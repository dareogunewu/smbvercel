import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { getAllCategoryNames } from "@/lib/categories";
import { Transaction, MerchantRule } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  const identifier = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitResult = apiRateLimiter.check(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { transactions, merchantRules } = body as {
      transactions: Transaction[];
      merchantRules?: MerchantRule[];
    };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json({ error: "Invalid transactions data" }, { status: 400 });
    }

    // Phase 1: Local keyword + user-rule matching (free, instant)
    const locallyCategized = batchCategorizeTransactions(transactions, merchantRules);

    // Phase 2: For anything still needing review, use Claude Haiku
    const needsAI = locallyCategized.filter((t) => t.needsReview);

    if (needsAI.length === 0 || !process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ success: true, transactions: locallyCategized });
    }

    const categoryNames = getAllCategoryNames();
    const CHUNK_SIZE = 40;

    const chunks: typeof needsAI[] = [];
    for (let i = 0; i < needsAI.length; i += CHUNK_SIZE) {
      chunks.push(needsAI.slice(i, i + CHUNK_SIZE));
    }

    const allAIResults: { id: string; category: string; confidence: number }[] = [];

    const categoryList = categoryNames.join(", ");

    for (const chunk of chunks) {
      const prompt = `You are a financial transaction categorizer for a small business.
Categorize each transaction into exactly one of these categories:
${categoryList}

Return ONLY a JSON array — no markdown, no explanation:
[{"id":"...","category":"...","confidence":0.0-1.0}]

Transactions:
${chunk.map((t) => `{"id":"${t.id}","description":${JSON.stringify(t.description)},"amount":${t.amount}}`).join("\n")}`;

      const message = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const responseText = message.content[0].type === "text" ? message.content[0].text : "";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const chunkResults: { id: string; category: string; confidence: number }[] = JSON.parse(jsonMatch[0]);
        allAIResults.push(...chunkResults);
      }
    }

    if (allAIResults.length > 0) {
      const aiMap = new Map(allAIResults.map((r) => [r.id, r]));

      const finalTransactions = locallyCategized.map((t) => {
        const aiResult = aiMap.get(t.id);
        if (aiResult && t.needsReview) {
          return {
            ...t,
            category: aiResult.category,
            confidence: aiResult.confidence,
            needsReview: aiResult.confidence < 0.7,
          };
        }
        return t;
      });

      return NextResponse.json({ success: true, transactions: finalTransactions });
    }

    return NextResponse.json({ success: true, transactions: locallyCategized });
  } catch (error) {
    console.error("Error categorizing transactions:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to categorize transactions" },
      { status: 500 }
    );
  }
}
