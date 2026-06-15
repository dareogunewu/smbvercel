import { NextRequest, NextResponse } from "next/server";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey } = body as { passkey?: string };

    if (typeof passkey !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const passkeyHash = process.env.PASSKEY_HASH || "";

    // No passkey configured → open access
    if (!passkeyHash) {
      return NextResponse.json({ success: true });
    }

    const inputHash = await hashPassword(passkey);
    if (inputHash !== passkeyHash) {
      // Delay response to slow brute-force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "Incorrect passkey" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
