import { NextRequest, NextResponse } from "next/server";
import { MerchantInfo } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

/**
 * AI-powered merchant categorization using FREE Google Gemini API
 * Get your free API key from https://aistudio.google.com/
 *
 * Supports multiple models with automatic fallback:
 * - gemini-2.5-flash-lite: 10 RPM, faster (primary)
 * - gemini-2.5-flash: 5 RPM, more accurate (fallback)
 */
async function categorizeMerchantWithGemini(
  merchantName: string,
  retryCount = 0,
  preferredModel: string = 'gemini-2.5-flash-lite'
): Promise<MerchantInfo | null> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn("GEMINI_API_KEY not configured - falling back to pattern matching");
    return null;
  }

  const maxRetries = 2;
  const models = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'];
  const currentModel = models.includes(preferredModel) ? preferredModel : models[0];

  try {
    // Sanitize merchant name to prevent JSON injection
    const sanitizedName = merchantName.replace(/[\n\r\t]/g, ' ').trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Categorize this merchant name: ${JSON.stringify(sanitizedName)}

Return ONLY a JSON object (no markdown, no explanation):
{
  "businessType": "brief type (e.g., Coffee Shop, Gas Station)",
  "description": "one sentence",
  "suggestedCategory": "EXACTLY ONE of: Advertising, Auto, Bank service charges, Business Cell phone, Car wash, Charitable donation, Computer exp, Equipment rental, Fees & Charges, Gas, Grocery, Insurance, Interest expense, Internet, Meals & entertainment, Office utilities, Parking, Professional Services, Repairs/ maintenance, Shopping, Spotify, Travel, Uncategorized"
}`
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 500,
          }
        }),
      }
    );

    // Handle rate limiting with retry and model fallback
    if (!response.ok) {
      if (response.status === 429 && retryCount < maxRetries) {
        // Rate limit hit - try exponential backoff
        const backoffMs = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
        console.warn(`Rate limit hit on ${currentModel}, retrying in ${backoffMs}ms...`);

        await new Promise(resolve => setTimeout(resolve, backoffMs));

        // Try alternative model on retry
        const nextModel = currentModel === models[0] ? models[1] : models[0];
        return categorizeMerchantWithGemini(merchantName, retryCount + 1, nextModel);
      }

      console.error(`Gemini API error (${currentModel}):`, response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const finishReason = data.candidates?.[0]?.finishReason;

    if (!text) {
      console.error("Gemini API: No text in response");
      return null;
    }

    // Check if response was truncated
    if (finishReason === 'MAX_TOKENS') {
      console.warn("Gemini API: Response truncated due to max tokens limit");
      return null;
    }

    // Parse JSON response (remove markdown if present)
    let jsonText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Try to extract JSON if embedded in other text
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("Gemini AI JSON parse error:", parseError);
      console.error("Raw response:", text);
      return null;
    }

    console.log(`Successfully categorized with ${currentModel}: "${merchantName}" → "${parsed.suggestedCategory}"`);

    return {
      name: merchantName,
      businessType: parsed.businessType,
      description: parsed.description,
      suggestedCategory: parsed.suggestedCategory,
    };
  } catch (error) {
    console.error("Gemini AI categorization failed:", error);
    return null;
  }
}

/**
 * FREE intelligent merchant categorization using enhanced pattern matching
 * Fallback when AI is not configured
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

    // Try FREE Google Gemini AI first (if API key configured)
    const aiResult = await categorizeMerchantWithGemini(merchantName);
    if (aiResult) {
      return NextResponse.json({
        success: true,
        merchantInfo: aiResult,
        source: "gemini_ai",
      });
    }

    // Fallback to FREE intelligent pattern matching
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
