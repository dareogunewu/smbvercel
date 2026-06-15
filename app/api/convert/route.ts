import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!validateOrigin(origin, host)) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

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

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF files are accepted." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    let parsedData: {
      success: boolean;
      bank?: string;
      transactions?: Array<{ date: string; description: string; amount: number }>;
      error?: string;
      metadata?: {
        total_transactions: number;
        safety_check_passed: boolean;
        statement_type: string;
      };
    };

    try {
      const fileBuffer = Buffer.from(await file.arrayBuffer());
      const tempFilePath = path.join(tmpdir(), `statement_${Date.now()}.pdf`);
      await writeFile(tempFilePath, fileBuffer);

      const scriptPath = path.join(process.cwd(), "scripts", "parse_statement.py");
      const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${tempFilePath}"`);

      if (stderr) {
        console.warn("Python parser warnings:", stderr);
      }

      parsedData = JSON.parse(stdout);

      await unlink(tempFilePath).catch(() => {});

      if (!parsedData.success) {
        throw new Error(parsedData.error || "Failed to parse PDF");
      }
    } catch (error) {
      console.error("Error parsing PDF with local parser:", error);
      throw new Error(
        error instanceof Error
          ? `PDF parsing error: ${error.message}`
          : "Failed to parse PDF. Please try again."
      );
    }

    const transactions = (parsedData.transactions ?? []).map((txn, index) => ({
      id: crypto.randomUUID(),
      date: txn.date,
      description: txn.description,
      amount: txn.amount,
      type: (txn.amount >= 0 ? "credit" : "debit") as "debit" | "credit",
    }));

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      bank: parsedData.bank,
      metadata: parsedData.metadata,
    });
  } catch (error) {
    console.error("Error converting PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert PDF" },
      { status: 500 }
    );
  }
}
