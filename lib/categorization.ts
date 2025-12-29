import { categories } from "./categories";
import { CategorizationResult, MerchantRule, Transaction } from "./types";

/**
 * Use AI to categorize unknown merchants
 */
export async function categorizeMerchantWithAI(merchantName: string): Promise<{ category: string; confidence: number; source: string } | null> {
  try {
    const response = await fetch("/api/search-merchant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ merchantName }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.success && data.merchantInfo?.suggestedCategory) {
      return {
        category: data.merchantInfo.suggestedCategory,
        confidence: data.source === "gemini_ai" ? 0.95 : 0.75, // Higher confidence for AI vs pattern matching
        source: data.source === "gemini_ai" ? "ai" : "pattern_matching",
      };
    }

    return null;
  } catch (error) {
    console.error("AI categorization error:", error);
    return null;
  }
}

/**
 * Categorize a transaction using multiple strategies
 */
export function categorizeTransaction(
  description: string,
  amount: number,
  mccCode?: number,
  userRules?: MerchantRule[]
): CategorizationResult {
  const normalizedDescription = description.toLowerCase().trim();

  // Strategy 1: Check user's custom rules first (highest priority)
  if (userRules) {
    const userRule = userRules.find((rule) =>
      normalizedDescription.includes(rule.merchantName.toLowerCase())
    );

    if (userRule) {
      return {
        category: userRule.category,
        confidence: 1.0,
        source: "user_history",
        needsReview: false,
      };
    }
  }

  // Strategy 2: MCC Code matching (if available)
  if (mccCode) {
    for (const category of categories) {
      if (category.mccCodes?.includes(mccCode)) {
        return {
          category: category.name,
          confidence: 0.95,
          source: "mcc",
          needsReview: false,
        };
      }
    }
  }

  // Strategy 3: Keyword matching
  let bestMatch: { category: string; confidence: number } | null = null;

  for (const category of categories) {
    for (const keyword of category.keywords) {
      if (normalizedDescription.includes(keyword.toLowerCase())) {
        // Calculate confidence based on keyword specificity
        const keywordLength = keyword.length;
        const descriptionLength = normalizedDescription.length;
        const confidence = Math.min(
          0.9,
          0.7 + (keywordLength / descriptionLength) * 0.2
        );

        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { category: category.name, confidence };
        }
      }
    }
  }

  if (bestMatch && bestMatch.confidence >= 0.7) {
    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      source: "keyword",
      needsReview: bestMatch.confidence < 0.8,
    };
  }

  // Strategy 4: Pattern-based inference
  const patternResult = inferFromPatterns(normalizedDescription, amount);
  if (patternResult) {
    return patternResult;
  }

  // Strategy 5: Needs web search or manual review
  return {
    category: "Uncategorized",
    confidence: 0,
    source: "uncategorized",
    needsReview: true,
  };
}

/**
 * Infer category from common transaction patterns
 */
function inferFromPatterns(
  description: string,
  amount: number
): CategorizationResult | null {
  // Payment patterns
  if (description.match(/payment|autopay|bill pay/i)) {
    return {
      category: "Fees & Charges",
      confidence: 0.6,
      source: "keyword",
      needsReview: true,
    };
  }

  // Transfer patterns
  if (description.match(/transfer|xfer|wire/i)) {
    return {
      category: "Uncategorized",
      confidence: 0,
      source: "uncategorized",
      needsReview: true,
    };
  }

  // Deposit patterns (income)
  if (
    description.match(/deposit|payroll|direct dep|salary/i) &&
    amount > 0
  ) {
    return {
      category: "Income",
      confidence: 0.85,
      source: "keyword",
      needsReview: false,
    };
  }

  // Check/cheque patterns
  if (description.match(/check|cheque|chk #/i)) {
    return {
      category: "Uncategorized",
      confidence: 0,
      source: "uncategorized",
      needsReview: true,
    };
  }

  return null;
}

/**
 * Batch categorize multiple transactions
 */
export function batchCategorizeTransactions(
  transactions: Transaction[],
  userRules?: MerchantRule[]
): Transaction[] {
  return transactions.map((transaction) => {
    const result = categorizeTransaction(
      transaction.description,
      transaction.amount,
      undefined,
      userRules
    );

    return {
      ...transaction,
      category: result.category,
      confidence: result.confidence,
      needsReview: result.needsReview,
    };
  });
}

/**
 * Extract merchant name from transaction description
 * Removes common prefixes and suffixes
 */
export function extractMerchantName(description: string): string {
  const cleaned = description
    .trim()
    .replace(/^(PURCHASE|POS|DEBIT|CREDIT|ACH|CHECK|WIRE|TRANSFER)\s+/i, "")
    .replace(/\s+\d{2}\/\d{2}\/\d{4}$/, "") // Remove date
    .replace(/\s+\d{2}\/\d{2}$/, "") // Remove date
    .replace(/\s+#\d+$/, "") // Remove transaction number
    .replace(/\s+[A-Z]{2}$/, "") // Remove state code
    .trim();

  return cleaned;
}

/**
 * Calculate categorization statistics
 */
export function getCategorizationStats(transactions: Transaction[]): {
  total: number;
  categorized: number;
  needsReview: number;
  confidence: number;
} {
  const total = transactions.length;
  const categorized = transactions.filter(
    (t) => t.category && t.category !== "Uncategorized"
  ).length;
  const needsReview = transactions.filter((t) => t.needsReview).length;
  const avgConfidence =
    transactions.reduce((sum, t) => sum + (t.confidence || 0), 0) / total;

  return {
    total,
    categorized,
    needsReview,
    confidence: avgConfidence,
  };
}
