import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { getAllCategoryNames } from "@/lib/categories";
import { Transaction, MerchantRule } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

const client = new Anthropic();
const CHUNK_SIZE = 40;
const enc = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitResult = apiRateLimiter.check(identifier);

  if (!rateLimitResult.success) {
    return new Response(JSON.stringify({ error: "Too many requests." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { transactions: Transaction[]; merchantRules?: MerchantRule[] };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const { transactions, merchantRules } = body;
  if (!transactions || !Array.isArray(transactions)) {
    return new Response(JSON.stringify({ error: "Invalid transactions" }), { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Phase 1: local categorization (instant)
        const localResults = batchCategorizeTransactions(transactions, merchantRules);
        controller.enqueue(sseEvent("progress", {
          transactions: localResults,
          message: "Matched known merchants",
          done: false,
        }));

        const needsAI = localResults.filter((t) => t.needsReview);

        if (needsAI.length === 0 || !process.env.ANTHROPIC_API_KEY) {
          controller.enqueue(sseEvent("done", { transactions: localResults }));
          controller.close();
          return;
        }

        // Phase 2: AI batches — one Claude call per chunk
        const categoryList = getAllCategoryNames().join(", ");
        const chunks: typeof needsAI[] = [];
        for (let i = 0; i < needsAI.length; i += CHUNK_SIZE) {
          chunks.push(needsAI.slice(i, i + CHUNK_SIZE));
        }

        const aiMap = new Map<string, { category: string; confidence: number; reason?: string }>();

        for (let ci = 0; ci < chunks.length; ci++) {
          const chunk = chunks[ci];
          const prompt = `You are a financial transaction categorizer for a small business.
Categorize each transaction into exactly one of these categories:
${categoryList}

Return ONLY a JSON array — no markdown, no explanation outside JSON:
[{"id":"...","category":"...","confidence":0.0-1.0,"reason":"one short phrase why"}]

Transactions:
${chunk.map((t) => `{"id":"${t.id}","description":${JSON.stringify(t.description)},"amount":${t.amount}}`).join("\n")}`;

          try {
            const message = await client.messages.create({
              model: "claude-haiku-4-5-20251001",
              max_tokens: 2048,
              messages: [{ role: "user", content: prompt }],
            });

            const text = message.content[0].type === "text" ? message.content[0].text : "";
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed: { id: string; category: string; confidence: number; reason?: string }[] = JSON.parse(jsonMatch[0]);
              for (const r of parsed) aiMap.set(r.id, r);
            }
          } catch (err) {
            console.error(`AI chunk ${ci} failed:`, err);
          }

          // Emit updated snapshot after each chunk
          const snapshot = localResults.map((t) => {
            const ai = aiMap.get(t.id);
            if (ai && t.needsReview) {
              return { ...t, category: ai.category, confidence: ai.confidence, needsReview: ai.confidence < 0.7, categoryReason: ai.reason };
            }
            return t;
          });

          controller.enqueue(sseEvent("progress", {
            transactions: snapshot,
            message: `AI categorized batch ${ci + 1} of ${chunks.length}`,
            done: false,
          }));
        }

        const final = localResults.map((t) => {
          const ai = aiMap.get(t.id);
          if (ai && t.needsReview) {
            return { ...t, category: ai.category, confidence: ai.confidence, needsReview: ai.confidence < 0.7, categoryReason: ai.reason };
          }
          return t;
        });

        controller.enqueue(sseEvent("done", { transactions: final }));
      } catch (err) {
        console.error("Categorize stream error:", err);
        controller.enqueue(sseEvent("error", { message: err instanceof Error ? err.message : "Failed" }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
