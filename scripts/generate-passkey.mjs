#!/usr/bin/env node
// Usage: node scripts/generate-passkey.mjs <yourpassword>
// Outputs: PASSKEY_HASH=<salt_hex>:<hash_hex>  — paste this into your Cloudflare / Vercel env vars.

import { webcrypto } from "crypto";
const { subtle, getRandomValues } = webcrypto;

const password = process.argv[2];
if (!password) {
  console.error("Usage: node scripts/generate-passkey.mjs <password>");
  process.exit(1);
}

const salt = new Uint8Array(32);
getRandomValues(salt);
const saltHex = Buffer.from(salt).toString("hex");

const keyMaterial = await subtle.importKey(
  "raw",
  new TextEncoder().encode(password),
  "PBKDF2",
  false,
  ["deriveBits"]
);

const bits = await subtle.deriveBits(
  { name: "PBKDF2", salt, iterations: 200_000, hash: "SHA-256" },
  keyMaterial,
  256
);

const hashHex = Buffer.from(bits).toString("hex");
console.log(`PASSKEY_HASH=${saltHex}:${hashHex}`);
