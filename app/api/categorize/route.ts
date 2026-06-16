import { NextRequest } from "next/server";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { getAllCategoryNames } from "@/lib/categories";
import { Transaction, MerchantRule } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
const CHUNK_SIZE = 40;
const enc = new TextEncoder();

function sseEvent(event: string, data: unknown): Uint8Array {
  return enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function callGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not set");

  const res = await fetch(`${GEMINI_URL}?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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
        // Phase 1: local pattern matching (instant)
        const localResults = batchCategorizeTransactions(transactions, merchantRules);
        controller.enqueue(sseEvent("progress", {
          transactions: localResults,
          message: "Matched known merchants",
          done: false,
        }));

        const needsAI = localResults.filter((t) => t.needsReview);

        if (needsAI.length === 0 || !process.env.GEMINI_API_KEY) {
          controller.enqueue(sseEvent("done", { transactions: localResults }));
          controller.close();
          return;
        }

        // Phase 2: Gemini AI batches
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
            const text = await callGemini(prompt);
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const parsed: { id: string; category: string; confidence: number; reason?: string }[] =
                JSON.parse(jsonMatch[0]);
              for (const r of parsed) aiMap.set(r.id, r);
            }
          } catch (err) {
            console.error(`AI chunk ${ci} failed:`, err);
          }

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
