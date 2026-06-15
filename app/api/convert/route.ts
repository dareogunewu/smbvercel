import { NextRequest, NextResponse } from "next/server";
import { uploadRateLimiter } from "@/lib/rate-limit";
import { validateOrigin } from "@/lib/csrf";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BSC_BASE = "https://api2.bankstatementconverter.com/api/v1/BankStatement";

function bscHeaders() {
  return { Authorization: (process.env.BSC_API_KEY ?? "").trim() };
}

async function pollStatus(uuid: string, timeoutMs = 55_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 5000));
    const res = await fetch(`${BSC_BASE}/status`, {
      method: "POST",
      headers: { ...bscHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify([uuid]),
    });
    const data = await res.json();
    // Response is an array; check the first item's state
    const item = Array.isArray(data) ? data[0] : data;
    if (item?.state !== "PROCESSING" && item?.status !== "PROCESSING") return;
  }
  throw new Error("PDF conversion timed out after 55s");
}

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

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    // Step 1: Upload to Bank Statement Converter
    const uploadForm = new FormData();
    uploadForm.append("file", file);

    const uploadRes = await fetch(BSC_BASE, {
      method: "POST",
      headers: bscHeaders(),
      body: uploadForm,
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Upload failed (${uploadRes.status}): ${err}`);
    }

    const uploadRaw = await uploadRes.json();
    // API returns an array of uploaded file objects
    const uploadData = Array.isArray(uploadRaw) ? uploadRaw[0] : uploadRaw;

    if (!uploadData) throw new Error("No data returned from upload");

    const uuid: string = uploadData.uuid ?? uploadData.id ?? uploadData.statementId;
    if (!uuid) throw new Error("No UUID returned from upload");

    // Step 2: Poll if still processing
    const uploadState = uploadData.state ?? uploadData.status;
    if (uploadState === "PROCESSING") {
      await pollStatus(uuid);
    }

    // Step 3: Convert to JSON transactions
    const convertRes = await fetch(`${BSC_BASE}/convert?format=JSON&raw=false`, {
      method: "POST",
      headers: { ...bscHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify([uuid]),
    });

    if (!convertRes.ok) {
      const err = await convertRes.text();
      throw new Error(`Conversion failed (${convertRes.status}): ${err}`);
    }

    const convertData = await convertRes.json();

    // API returns array of statement objects, each with a `normalised` array
    // normalised rows have { date, description, amount } where amount is a string
    const statementsArr = Array.isArray(convertData) ? convertData : [convertData];
    const rawTxns: Array<{ date?: string; description?: string; amount?: string | number; credit?: number; debit?: number }> =
      statementsArr.flatMap((s: { normalised?: unknown[]; transactions?: unknown[]; data?: unknown[] }) =>
        s.normalised ?? s.transactions ?? s.data ?? (Array.isArray(s) ? s : [])
      );

    if (rawTxns.length === 0) {
      return NextResponse.json(
        { error: "No transactions found in this statement." },
        { status: 422 }
      );
    }

    const transactions = rawTxns
      .filter((t) => t.date && (t.description || t.amount !== undefined))
      .map((t) => {
        const amount = typeof t.amount === "string"
          ? parseFloat(t.amount)
          : (t.amount ?? (t.credit ? Math.abs(t.credit) : -(Math.abs(t.debit ?? 0))));
        return {
          id: crypto.randomUUID(),
          date: t.date!,
          description: t.description ?? "",
          amount,
          type: (amount >= 0 ? "credit" : "debit") as "debit" | "credit",
        };
      });

    return NextResponse.json({
      success: true,
      transactions,
      count: transactions.length,
      confidence: transactions.length >= 5 ? "high" : "partial",
    });
  } catch (error) {
    console.error("Error converting PDF:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to convert PDF" },
      { status: 500 }
    );
  }
}
