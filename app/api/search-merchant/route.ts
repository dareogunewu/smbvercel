import { NextRequest, NextResponse } from "next/server";
import { MerchantInfo } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

/**
 * FREE intelligent merchant categorization using enhanced pattern matching
 * No API keys, no costs - 100% free
 */
function categorizeMerchantIntelligently(merchantName: string): MerchantInfo {
  const lowerName = merchantName.toLowerCase();

  // Comprehensive merchant database with common patterns
  const merchantPatterns = [
    // Food & Dining
    { patterns: ['starbucks', 'coffee', 'cafe', 'espresso', 'brew'], category: 'Meals & entertainment', type: 'Coffee Shop' },
    { patterns: ['mcdonald', 'burger', 'wendys', 'kfc', 'popeyes', 'chick-fil-a'], category: 'Meals & entertainment', type: 'Fast Food' },
    { patterns: ['restaurant', 'grill', 'bistro', 'diner', 'eatery', 'pizza', 'sushi'], category: 'Meals & entertainment', type: 'Restaurant' },
    { patterns: ['bar', 'pub', 'tavern', 'brewery', 'lounge'], category: 'Meals & entertainment', type: 'Bar/Pub' },

    // Grocery & Food Stores
    { patterns: ['walmart', 'target', 'costco', 'whole foods', 'trader joe', 'kroger', 'safeway', 'publix'], category: 'Grocery', type: 'Grocery Store' },
    { patterns: ['market', 'grocery', 'supermarket', 'food store', 'fresh'], category: 'Grocery', type: 'Grocery Store' },

    // Gas & Auto
    { patterns: ['shell', 'chevron', 'exxon', 'mobil', 'bp', 'texaco', 'arco', 'marathon', 'sunoco'], category: 'Gas', type: 'Gas Station' },
    { patterns: ['gas', 'fuel', 'petroleum', 'petro'], category: 'Gas', type: 'Gas Station' },
    { patterns: ['autozone', 'advance auto', 'napa', 'car wash', 'jiffy lube', 'midas', 'pep boys'], category: 'Auto', type: 'Auto Service' },

    // Shopping & Retail
    { patterns: ['amazon', 'ebay', 'etsy', 'shop', 'store', 'boutique'], category: 'Shopping', type: 'Retail' },
    { patterns: ['apple', 'microsoft', 'best buy', 'electronics'], category: 'Computer exp', type: 'Electronics' },
    { patterns: ['home depot', 'lowes', 'hardware', 'lumber'], category: 'Shopping', type: 'Hardware Store' },

    // Services
    { patterns: ['verizon', 'at&t', 'tmobile', 't-mobile', 'sprint', 'wireless', 'mobile'], category: 'Business Cell phone', type: 'Telecom' },
    { patterns: ['comcast', 'spectrum', 'cox', 'internet', 'broadband', 'fiber'], category: 'Internet', type: 'Internet Provider' },
    { patterns: ['netflix', 'hulu', 'disney', 'spotify', 'youtube', 'subscription'], category: 'Spotify', type: 'Streaming Service' },
    { patterns: ['insurance', 'geico', 'state farm', 'allstate', 'progressive'], category: 'Insurance', type: 'Insurance' },
    { patterns: ['hotel', 'marriott', 'hilton', 'hyatt', 'motel', 'inn', 'airbnb'], category: 'Travel', type: 'Lodging' },
    { patterns: ['airline', 'airways', 'delta', 'united', 'american air', 'southwest'], category: 'Travel', type: 'Airline' },
    { patterns: ['uber', 'lyft', 'taxi', 'cab'], category: 'Travel', type: 'Transportation' },
    { patterns: ['parking', 'park', 'garage'], category: 'Parking', type: 'Parking' },

    // Utilities & Bills
    { patterns: ['electric', 'power', 'utility', 'water', 'gas utility', 'city of'], category: 'Office utilities', type: 'Utility' },
    { patterns: ['paypal', 'venmo', 'zelle', 'cashapp'], category: 'Fees & Charges', type: 'Payment Service' },

    // Professional
    { patterns: ['legal', 'attorney', 'lawyer', 'law firm'], category: 'Professional Services', type: 'Legal' },
    { patterns: ['accounting', 'cpa', 'tax'], category: 'Professional Services', type: 'Accounting' },
    { patterns: ['consulting', 'consultant'], category: 'Professional Services', type: 'Consulting' },

    // Charitable
    { patterns: ['donation', 'charity', 'foundation', 'church', 'tithe'], category: 'Charitable donation', type: 'Charity' },
  ];

  // Check patterns
  for (const pattern of merchantPatterns) {
    if (pattern.patterns.some(p => lowerName.includes(p))) {
      return {
        name: merchantName,
        businessType: pattern.type,
        description: `Categorized as ${pattern.type} based on merchant name patterns`,
        suggestedCategory: pattern.category,
      };
    }
  }

  // Fallback: generic keyword matching
  return fallbackKeywordMatching(merchantName, lowerName);
}

function fallbackKeywordMatching(merchantName: string, lowerName: string): MerchantInfo {
  const merchantInfo: MerchantInfo = {
    name: merchantName,
  };

  if (lowerName.includes("market") || lowerName.includes("food") || lowerName.includes("grocery")) {
    merchantInfo.businessType = "Grocery Store";
    merchantInfo.description = "Food and grocery retailer";
    merchantInfo.suggestedCategory = "Grocery";
  } else {
    merchantInfo.businessType = "Unknown";
    merchantInfo.description = "Business type not automatically detected";
  }

  return merchantInfo;
}

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
    const { merchantName } = body as { merchantName: string };

    if (!merchantName) {
      return NextResponse.json(
        { error: "Merchant name is required" },
        { status: 400 }
      );
    }

    // Use FREE intelligent categorization
    const merchantInfo = categorizeMerchantIntelligently(merchantName);

    return NextResponse.json({
      success: true,
      merchantInfo,
      source: "pattern_matching",
    });
  } catch (error) {
    console.error("Error searching merchant:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to search merchant",
      },
      { status: 500 }
    );
  }
}
