#!/usr/bin/env node
/**
 * Test script to validate AI categorization API
 * Tests both with and without GEMINI_API_KEY
 */

const testMerchants = [
  "STARBUCKS COFFEE #12345",
  "SHELL GAS STATION",
  "WALMART SUPERCENTER",
  "UNKNOWN MERCHANT XYZ",
  "ACME CONSULTING GROUP",
];

async function testCategorizationAPI(merchantName) {
  try {
    const response = await fetch("http://localhost:3000/api/search-merchant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ merchantName }),
    });

    if (!response.ok) {
      console.error(`❌ API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return null;
  }
}

async function runTests() {
  console.log("🧪 Testing AI Categorization API\n");
  console.log("=" .repeat(60));

  for (const merchant of testMerchants) {
    console.log(`\n📝 Testing: "${merchant}"`);
    const result = await testCategorizationAPI(merchant);

    if (result) {
      console.log(`✅ Success!`);
      console.log(`   Category: ${result.merchantInfo.suggestedCategory}`);
      console.log(`   Type: ${result.merchantInfo.businessType}`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Description: ${result.merchantInfo.description}`);
    } else {
      console.log(`❌ Failed to categorize`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("\n✨ Test complete!");
  console.log("\nℹ️  Notes:");
  console.log("  - If source='pattern_matching': Using built-in patterns (FREE)");
  console.log("  - If source='gemini_ai': Using Google Gemini AI (FREE with API key)");
  console.log("  - To enable AI: Add GEMINI_API_KEY to .env.local");
  console.log("  - Get free key: https://aistudio.google.com/");
}

runTests().catch(console.error);
