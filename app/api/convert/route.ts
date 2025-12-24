import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rate-limit";

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // Rate limiting
  const identifier = request.headers.get("x-forwarded-for") || "anonymous";
  const rateLimitResult = uploadRateLimiter.check(identifier);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "5",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(rateLimitResult.reset).toISOString(),
        },
      }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Get API key from environment (server-side only, no NEXT_PUBLIC_)
    const apiKey = process.env.BANK_STATEMENT_CONVERTER_API_KEY;

    let csvText: string;

    if (!apiKey) {
      console.warn("API key not configured - using mock data for development");

      // Mock data for development
      csvText = `Date,Description,Amount,Type
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
    } else {
      // Convert PDF to CSV using bankstatementconverter.com API
      try {
        const convertFormData = new FormData();
        convertFormData.append("file", file);
        convertFormData.append("api_key", apiKey);

        const response = await fetch("https://api.bankstatementconverter.com/convert", {
          method: "POST",
          body: convertFormData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("PDF conversion failed:", response.status, errorText);
          throw new Error(`PDF conversion failed: ${response.statusText}`);
        }

        csvText = await response.text();
      } catch (error) {
        console.error("Error calling PDF conversion API:", error);
        throw new Error(
          error instanceof Error
            ? `PDF conversion error: ${error.message}`
            : "Failed to convert PDF. Please try again."
        );
      }
    }

    // Parse CSV to transactions
    const lines = csvText.trim().split("\n");
    const headers = lines[0].toLowerCase().split(",");

    interface ParsedTransaction {
      id: string;
      date?: string;
      description?: string;
      amount?: number;
      type?: string;
    }

    const transactions: ParsedTransaction[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",");
      const transaction: ParsedTransaction = {
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
