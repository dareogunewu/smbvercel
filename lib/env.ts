import { z } from "zod";

const envSchema = z.object({
  PASSKEY_HASH: z.string().min(1, "PASSKEY_HASH is required. Run: node scripts/generate-passkey.mjs <password>"),
  BSC_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

// Lazy singleton — validated on first call, not at import time (build-safe)
let _env: z.infer<typeof envSchema> | null = null;

export function getEnv(): z.infer<typeof envSchema> {
  if (_env) return _env;
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  • ${i.path.join(".")}: ${i.message}`).join("\n");
    throw new Error(`\n[smbowner] Missing or invalid environment variables:\n${missing}\n`);
  }
  _env = result.data;
  return _env;
}
