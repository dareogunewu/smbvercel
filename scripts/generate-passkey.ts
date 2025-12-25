/**
 * Script to generate a passkey hash for environment variables
 *
 * Usage:
 *   npx ts-node scripts/generate-passkey.ts
 *
 * Then set the generated hash in your .env.local:
 *   NEXT_PUBLIC_PASSKEY_HASH=<generated_hash>
 */

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  // Use Node's crypto for server-side hashing
  const crypto = await import('crypto');
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

async function main() {
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter your desired passkey: ', async (passkey) => {
    if (!passkey || passkey.length < 8) {
      console.error('\n❌ Error: Passkey must be at least 8 characters long');
      rl.close();
      process.exit(1);
    }

    const hash = await hashPassword(passkey);

    console.log('\n✅ Passkey hash generated successfully!\n');
    console.log('Add this to your .env.local file:');
    console.log('─'.repeat(60));
    console.log(`NEXT_PUBLIC_PASSKEY_HASH=${hash}`);
    console.log('─'.repeat(60));
    console.log('\n⚠️  Important:');
    console.log('1. Never commit this hash to version control');
    console.log('2. Add .env.local to your .gitignore (should already be there)');
    console.log('3. Set this as an environment variable in Vercel');
    console.log('4. Keep your passkey secure and don\'t share it\n');

    rl.close();
  });
}

main();
