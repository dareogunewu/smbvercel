import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";
import { parseBankStatement } from "@/lib/pdf-parser";

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

    const buffer = await file.arrayBuffer();
    const parsedData = await parseBankStatement(buffer);

    if (!parsedData.success) {
      return NextResponse.json(
        { error: parsedData.error || "Failed to parse PDF" },
        { status: 422 }
      );
    }

    const transactions = parsedData.transactions.map((txn) => ({
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
