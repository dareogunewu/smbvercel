import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  // CSRF Protection - Validate Origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!validateOrigin(origin, host)) {
    return NextResponse.json(
      { error: "Invalid request origin" },
      { status: 403 }
    );
  }

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

    // Use local Python RBC parser for PDF conversion
    let parsedData: {
      success: boolean;
      bank?: string;
      statement_type?: string;
      transactions?: Array<{ date: string; description: string; amount: number; type: string }>;
      error?: string;
      metadata?: {
        total_transactions: number;
        parser: string;
      };
    };

    try {
      // Save uploaded file to temporary location
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const tempFilePath = path.join(tmpdir(), `statement_${Date.now()}.pdf`);
      await writeFile(tempFilePath, fileBuffer);

      // Get the path to the Python script
      const scriptPath = path.join(process.cwd(), "api", "parse_rbc.py");

      // Execute Python parser
      const { stdout, stderr } = await execAsync(
        `python3 "${scriptPath}" "${tempFilePath}"`
      );

      if (stderr) {
        console.warn("Python parser warnings:", stderr);
      }

      // Parse the JSON output
      parsedData = JSON.parse(stdout);

      // Clean up temporary file
      await unlink(tempFilePath).catch(() => {
        // Ignore cleanup errors
      });

      if (!parsedData.success) {
        throw new Error(parsedData.error || "Failed to parse PDF");
      }

      console.log(`Successfully parsed RBC PDF - Type: ${parsedData.statement_type}, Transactions: ${parsedData.transactions?.length}`);
    } catch (error) {
      console.error("Error parsing PDF with RBC parser:", error);
      throw new Error(
        error instanceof Error
          ? `PDF parsing error: ${error.message}`
          : "Failed to parse PDF. Please try again."
      );
    }

    // Convert parsed data to transaction format
    interface ParsedTransaction {
      id: string;
      date?: string;
      description?: string;
      amount?: number;
      type?: string;
    }

    const transactions: ParsedTransaction[] = [];

    if (parsedData.transactions) {
      parsedData.transactions.forEach((txn, index) => {
        transactions.push({
          id: `txn_${Date.now()}_${index}`,
          date: txn.date,
          description: txn.description,
          amount: txn.amount,
          type: txn.type,
        });
      });
    }

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      bank: parsedData.bank,
      statement_type: parsedData.statement_type,
      metadata: parsedData.metadata,
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
