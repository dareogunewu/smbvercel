import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = process.env.NEXT_PUBLIC_BANK_STATEMENT_CONVERTER_API_KEY;

    if (!apiKey) {
      console.warn("API key not configured - using mock data");
      // Don't error out, just use mock data in development
    }

    // Convert PDF to CSV using bankstatementconverter.com API
    // NOTE: Uncomment when you have an API key
    /*
    const convertFormData = new FormData();
    convertFormData.append("file", file);
    convertFormData.append("api_key", apiKey);

    const response = await fetch("https://api.bankstatementconverter.com/convert", {
      method: "POST",
      body: convertFormData,
    });

    if (!response.ok) {
      throw new Error("Failed to convert PDF");
    }

    const csvText = await response.text();
    */

    // For development: Use mock data
    const mockCSV = `Date,Description,Amount,Type
2024-11-01,WALMART SUPERCENTER,-125.43,debit
2024-11-02,SHELL OIL,-45.00,debit
2024-11-03,PAYROLL DEPOSIT,2500.00,credit
2024-11-05,NETFLIX SUBSCRIPTION,-15.99,debit
2024-11-07,STARBUCKS,-5.67,debit
2024-11-08,KROGER GROCERY,-89.23,debit
2024-11-10,AMAZON.COM,-67.89,debit
2024-11-12,OYATO AFRICAN FOOD MARKET,-45.23,debit
2024-11-15,AT&T WIRELESS,-75.00,debit
2024-11-18,CHEVRON GAS STATION,-52.34,debit
2024-11-20,WHOLE FOODS MARKET,-103.45,debit`;

    const csvText = mockCSV;

    // Parse CSV to transactions
    const lines = csvText.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",");

    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const transaction: any = {
        id: `txn_${Date.now()}_${i}`,
      };

      headers.forEach((header, index) => {
        const key = header.trim();
        const value = values[index]?.trim() || "";

        if (key === "date") {
          transaction.date = value;
        } else if (key === "description") {
          transaction.description = value;
        } else if (key === "amount") {
          transaction.amount = parseFloat(value);
        } else if (key === "type") {
          transaction.type = value.toLowerCase();
        }
      });

      transactions.push(transaction);
    }

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error("Error converting PDF:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to convert PDF",
      },
      { status: 500 }
    );
  }
}
