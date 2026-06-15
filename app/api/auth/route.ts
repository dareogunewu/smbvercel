import { NextRequest, NextResponse } from "next/server";
import "@/lib/env"; // validate env vars at startup

// Derives a key using PBKDF2-SHA256. salt is a Uint8Array.
async function pbkdf2Hash(password: string, salt: Uint8Array): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as unknown as BufferSource, iterations: 200_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { passkey } = body as { passkey?: string };

    if (typeof passkey !== "string" || passkey.length === 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const storedHash = process.env.PASSKEY_HASH || "";

    // No passkey configured → open access
    if (!storedHash) {
      return NextResponse.json({ success: true });
    }

    // Format: "<salt_hex>:<hash_hex>"
    const parts = storedHash.split(":");
    if (parts.length !== 2) {
      console.error("PASSKEY_HASH is malformed — expected salt_hex:hash_hex");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }

    const [saltHex, expectedHash] = parts;
    const salt = hexToBytes(saltHex);
    const inputHash = await pbkdf2Hash(passkey, salt);

    if (inputHash !== expectedHash) {
      // Constant delay to slow brute-force
      await new Promise((r) => setTimeout(r, 500));
      return NextResponse.json({ error: "Incorrect passkey" }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
