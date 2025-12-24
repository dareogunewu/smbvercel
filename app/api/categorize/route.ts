import { NextRequest, NextResponse } from "next/server";
import { batchCategorizeTransactions } from "@/lib/categorization";
import { Transaction, MerchantRule } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

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
    const { transactions, merchantRules } = body as {
      transactions: Transaction[];
      merchantRules?: MerchantRule[];
    };

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid transactions data" },
        { status: 400 }
      );
    }

    // Categorize all transactions
    const categorizedTransactions = batchCategorizeTransactions(
      transactions,
      merchantRules
    );

    return NextResponse.json({
      success: true,
      transactions: categorizedTransactions,
    });
  } catch (error) {
    console.error("Error categorizing transactions:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to categorize transactions",
      },
      { status: 500 }
    );
  }
}
