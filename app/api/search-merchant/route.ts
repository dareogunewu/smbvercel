import { NextRequest, NextResponse } from "next/server";
import { MerchantInfo } from "@/lib/types";
import { apiRateLimiter } from "@/lib/rate-limit";

/**
 * AI-powered merchant categorization using Claude API
 * Intelligently determines business type and suggests category
 */
async function categorizeMerchantWithAI(merchantName: string): Promise<MerchantInfo | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY not configured - falling back to keyword matching");
    return null;
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: `Analyze this merchant name and provide categorization: "${merchantName}"

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "businessType": "brief business type (e.g., Coffee Shop, Gas Station, Restaurant)",
  "description": "one sentence description",
  "suggestedCategory": "EXACTLY ONE of: Advertising, Auto, Bank service charges, Business Cell phone, Car wash, Charitable donation, Computer exp, Equipment rental, Fees & Charges, Gas, Grocery, Insurance, Interest expense, Internet, Meals & entertainment, Office utilities, Parking, Professional Services, Repairs/ maintenance, Shopping, Spotify, Travel, Uncategorized"
}`
          }
        ],
      }),
    });

    if (!response.ok) {
      console.error("Claude API error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const textContent = data.content?.[0]?.text;

    if (!textContent) {
      return null;
    }

    // Parse the JSON response
    const parsed = JSON.parse(textContent);

    return {
      name: merchantName,
      businessType: parsed.businessType,
      description: parsed.description,
      suggestedCategory: parsed.suggestedCategory,
    };
  } catch (error) {
    console.error("AI categorization failed:", error);
    return null;
  }
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

    // Try AI-powered categorization first
    const aiResult = await categorizeMerchantWithAI(merchantName);
    if (aiResult) {
      return NextResponse.json({
        success: true,
        merchantInfo: aiResult,
        source: "ai",
      });
    }

    // Fallback to keyword-based detection
    const merchantInfo: MerchantInfo = {
      name: merchantName,
    };

    const lowerName = merchantName.toLowerCase();

    if (
      lowerName.includes("market") ||
      lowerName.includes("food") ||
      lowerName.includes("grocery")
    ) {
      merchantInfo.businessType = "Grocery Store";
      merchantInfo.description = "Food and grocery retailer";
      merchantInfo.suggestedCategory = "Grocery";
    } else if (
      lowerName.includes("gas") ||
      lowerName.includes("fuel") ||
      lowerName.includes("petroleum")
    ) {
      merchantInfo.businessType = "Gas Station";
      merchantInfo.description = "Fuel and convenience store";
      merchantInfo.suggestedCategory = "Fuel & Gas";
    } else if (
      lowerName.includes("restaurant") ||
      lowerName.includes("cafe") ||
      lowerName.includes("grill") ||
      lowerName.includes("pizza")
    ) {
      merchantInfo.businessType = "Restaurant";
      merchantInfo.description = "Food service establishment";
      merchantInfo.suggestedCategory = "Restaurants & Dining";
    } else if (
      lowerName.includes("wireless") ||
      lowerName.includes("telecom") ||
      lowerName.includes("phone")
    ) {
      merchantInfo.businessType = "Telecommunications";
      merchantInfo.description = "Phone and internet service provider";
      merchantInfo.suggestedCategory = "Utilities";
    } else {
      merchantInfo.businessType = "Unknown";
      merchantInfo.description = "Business type not automatically detected";
    }

    // TODO: Implement actual web search using Google Custom Search API
    // or another service to get real merchant information

    return NextResponse.json({
      success: true,
      merchantInfo,
    });
  } catch (error) {
    console.error("Error searching merchant:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to search merchant",
      },
      { status: 500 }
    );
  }
}
