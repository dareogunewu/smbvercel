import { z } from "zod";

const envSchema = z.object({
  PASSKEY_HASH: z.string().min(1, "PASSKEY_HASH is required. Run: node scripts/generate-passkey.mjs <password>"),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`\n[smbowner] Missing or invalid environment variables:\n${missing}\n`);
  }
  return result.data;
}

// Validate once at module load (server-side only)
export const env = typeof window === "undefined" ? validateEnv() : ({} as ReturnType<typeof validateEnv>);
