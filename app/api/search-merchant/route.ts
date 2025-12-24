import { NextRequest, NextResponse } from "next/server";
import { MerchantInfo } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantName } = body as { merchantName: string };

    if (!merchantName) {
      return NextResponse.json(
        { error: "Merchant name is required" },
        { status: 400 }
      );
    }

    // In a real implementation, you would search Google or another service
    // For now, we'll use a simple heuristic based on keywords

    const merchantInfo: MerchantInfo = {
      name: merchantName,
    };

    // Simple keyword-based business type detection
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
