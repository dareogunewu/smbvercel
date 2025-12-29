import { NextRequest, NextResponse } from "next/server";
import { apiRateLimiter } from "@/lib/rate-limit";

interface Transaction {
  id: string;
  description: string;
  category?: string;
}

/**
 * AI-powered batch categorization endpoint
 * Processes multiple uncategorized transactions at once
 */
export async function POST(request: NextRequest) {
  // Rate limiting
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
    const { transactions } = body as { transactions: Transaction[] };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Transactions array is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "AI categorization not configured. Add ANTHROPIC_API_KEY to enable.",
        categorizations: [],
      });
    }

    // Filter only uncategorized transactions
    const uncategorized = transactions.filter(
      (t) => !t.category || t.category === "Uncategorized"
    );

    if (uncategorized.length === 0) {
      return NextResponse.json({
        success: true,
        categorizations: [],
        message: "All transactions already categorized",
      });
    }

    // Limit to 20 transactions per batch to avoid timeout
    const batch = uncategorized.slice(0, 20);

    // Extract unique merchant names
    const merchantNames = Array.from(
      new Set(
        batch.map((t) => {
          // Extract merchant name from description
          const cleaned = t.description
            .trim()
            .replace(/^(PURCHASE|POS|DEBIT|CREDIT|ACH|CHECK|WIRE|TRANSFER)\s+/i, "")
            .replace(/\s+\d{2}\/\d{2}\/\d{4}$/, "")
            .replace(/\s+\d{2}\/\d{2}$/, "")
            .replace(/\s+#\d+$/, "")
            .replace(/\s+[A-Z]{2}$/, "")
            .trim();
          return cleaned;
        })
      )
    );

    // Batch categorize with Claude
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 1500,
        messages: [
          {
            role: "user",
            content: `Categorize these merchants. Return ONLY a JSON array, no markdown:

${merchantNames.map((name, i) => `${i + 1}. ${name}`).join("\n")}

Categories: Advertising, Auto, Bank service charges, Business Cell phone, Car wash, Charitable donation, Computer exp, Equipment rental, Fees & Charges, Gas, Grocery, Insurance, Interest expense, Internet, Meals & entertainment, Office utilities, Parking, Professional Services, Repairs/ maintenance, Shopping, Spotify, Travel, Uncategorized

Return format:
[
  {"merchant": "exact name", "category": "category name", "confidence": 0.0-1.0},
  ...
]`
          }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.content?.[0]?.text;

    if (!textContent) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    const categorizations = JSON.parse(textContent);

    // Map back to transaction IDs
    const results = batch.map((transaction) => {
      const merchantName = transaction.description
        .trim()
        .replace(/^(PURCHASE|POS|DEBIT|CREDIT|ACH|CHECK|WIRE|TRANSFER)\s+/i, "")
        .replace(/\s+\d{2}\/\d{2}\/\d{4}$/, "")
        .replace(/\s+\d{2}\/\d{2}$/, "")
        .replace(/\s+#\d+$/, "")
        .replace(/\s+[A-Z]{2}$/, "")
        .trim();

      const match = categorizations.find(
        (c: { merchant: string }) =>
          c.merchant.toLowerCase() === merchantName.toLowerCase()
      );

      if (match) {
        return {
          id: transaction.id,
          category: match.category,
          confidence: match.confidence || 0.85,
          source: "ai",
        };
      }

      return {
        id: transaction.id,
        category: "Uncategorized",
        confidence: 0,
        source: "failed",
      };
    });

    return NextResponse.json({
      success: true,
      categorizations: results,
      processedCount: batch.length,
      remainingCount: uncategorized.length - batch.length,
    });
  } catch (error) {
    console.error("Batch categorization error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to categorize",
        categorizations: [],
      },
      { status: 500 }
    );
  }
}
