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
      // Convert PDF using bankstatementconverter.com API (3-step process)
      try {
        // Step 1: Upload PDF
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const uploadResponse = await fetch(
          "https://api2.bankstatementconverter.com/api/v1/BankStatement",
          {
            method: "POST",
            headers: {
              Authorization: apiKey,
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("PDF upload failed:", uploadResponse.status, errorText);
          throw new Error(`PDF upload failed: ${uploadResponse.statusText}`);
        }

        const uploadData = await uploadResponse.json();
        console.log("Upload response data:", JSON.stringify(uploadData));

        // The response might be an array or have different structure
        const fileId = Array.isArray(uploadData)
          ? uploadData[0]?.id || uploadData[0]?.uuid || uploadData[0]
          : uploadData.id || uploadData.uuid || uploadData;

        console.log("Extracted file ID:", fileId);

        if (!fileId) {
          throw new Error("No file ID returned from upload");
        }

        // Step 2: Poll for status (wait for processing to complete)
        let status = "PROCESSING";
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes max (30 * 10 seconds)

        while (status === "PROCESSING" && attempts < maxAttempts) {
          // Wait before checking (except first time)
          if (attempts > 0) {
            await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
          }

          const statusResponse = await fetch(
            "https://api2.bankstatementconverter.com/api/v1/BankStatement/status",
            {
              method: "POST",
              headers: {
                Authorization: apiKey,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([fileId]),
            }
          );

          if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            console.log("Status check attempt", attempts + 1, "response:", statusData);

            // Response is an array, get first item
            // API returns 'state' not 'status'
            status = Array.isArray(statusData) && statusData.length > 0
              ? statusData[0].state || statusData[0].status
              : "FAILED";

            console.log("Current status:", status);
          } else {
            console.error("Status check failed:", statusResponse.status, await statusResponse.text());
          }

          attempts++;
        }

        console.log("Final status after polling:", status, "attempts:", attempts);

        if (status !== "READY") {
          throw new Error(`PDF processing timed out or failed. Final status: ${status}`);
        }

        // Step 3: Convert to JSON
        const convertResponse = await fetch(
          `https://api2.bankstatementconverter.com/api/v1/BankStatement/convert?format=JSON`,
          {
            method: "POST",
            headers: {
              Authorization: apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([fileId]),
          }
        );

        if (!convertResponse.ok) {
          const errorText = await convertResponse.text();
          console.error("PDF conversion failed:", convertResponse.status, errorText);
          throw new Error(`PDF conversion failed: ${convertResponse.statusText}`);
        }

        const convertData = await convertResponse.json();

        // Convert response is an array of results
        const result = Array.isArray(convertData) && convertData.length > 0
          ? convertData[0]
          : null;

        if (!result || !result.normalised || result.normalised.length === 0) {
          throw new Error("No transactions found in PDF");
        }

        // Create CSV from normalized data
        interface NormalizedTransaction {
          date: string;
          description: string;
          amount: string;
        }

        const csvLines = ["Date,Description,Amount,Type"];
        result.normalised.forEach((transaction: NormalizedTransaction) => {
          const amount = parseFloat(transaction.amount);
          const type = amount >= 0 ? "credit" : "debit";
          csvLines.push(
            `${transaction.date},"${transaction.description}",${amount},${type}`
          );
        });

        csvText = csvLines.join("\n");
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
