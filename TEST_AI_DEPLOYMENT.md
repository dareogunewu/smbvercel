# Testing AI Deployment

## Quick Test: Verify Gemini AI is Active

### Method 1: Browser Console Test

1. Open your deployed app (Railway or Vercel URL)
2. Open browser DevTools (F12 → Console tab)
3. Paste this code:

```javascript
// Test AI categorization endpoint
fetch('/api/search-merchant', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ merchantName: 'ACME CONSULTING GROUP' })
})
.then(r => r.json())
.then(data => {
  console.log('AI Test Result:');
  console.log('Source:', data.source); // Should be "gemini_ai"
  console.log('Category:', data.merchantInfo.suggestedCategory);
  console.log('Type:', data.merchantInfo.businessType);
  console.log('Description:', data.merchantInfo.description);

  if (data.source === 'gemini_ai') {
    console.log('✅ Gemini AI is ACTIVE!');
  } else {
    console.log('⚠️ Using pattern matching fallback');
  }
})
.catch(err => console.error('❌ Error:', err));
```

**Expected Output:**
```
AI Test Result:
Source: gemini_ai
Category: Professional Services
Type: Consulting
Description: Professional consulting services firm
✅ Gemini AI is ACTIVE!
```

### Method 2: cURL Test

```bash
# Replace YOUR_DEPLOYMENT_URL with your actual URL
curl -X POST https://YOUR_DEPLOYMENT_URL/api/search-merchant \
  -H "Content-Type: application/json" \
  -d '{"merchantName":"STARBUCKS COFFEE"}' \
  | jq .

# Look for: "source": "gemini_ai"
```

### Method 3: Upload a Statement

1. Upload a bank statement with transactions
2. Check the browser console for logs
3. Look for lines like:
   ```
   GEMINI_API_KEY not configured - falling back to pattern matching
   ```

   **If you see this:** API key not loaded (check env vars)

   **If you DON'T see this:** Gemini AI is being used ✅

## Verification Checklist

### Railway Deployment

- [ ] Go to railway.app → Your project → Variables
- [ ] Confirm `GEMINI_API_KEY` is set
- [ ] Go to Deployments tab
- [ ] Latest deployment should show "Success"
- [ ] Click on deployment → Logs tab
- [ ] Should NOT see "GEMINI_API_KEY not configured" warnings
- [ ] Test with browser console method above

### Vercel Deployment

- [ ] Go to vercel.com → Your project → Settings → Environment Variables
- [ ] Confirm `GEMINI_API_KEY` exists for Production
- [ ] Go to Deployments tab
- [ ] Redeploy latest deployment (click ... → Redeploy)
- [ ] Wait for deployment to complete
- [ ] Test with browser console method above

## How to Tell if AI is Working

### ✅ AI is Active:
- API responses show `"source": "gemini_ai"`
- No console warnings about missing API key
- More detailed merchant descriptions
- Better categorization of unusual merchants

### ⚠️ Fallback Mode:
- API responses show `"source": "pattern_matching"`
- Console shows "GEMINI_API_KEY not configured" warning
- Still works, but uses built-in patterns only
- May not categorize unusual merchant names

## Troubleshooting

### Problem: Still seeing "pattern_matching" source

**Solutions:**
1. **Check env var name:** Must be exactly `GEMINI_API_KEY` (case-sensitive)
2. **Redeploy:**
   - Railway: Should auto-redeploy, check Deployments tab
   - Vercel: Must manually redeploy or push new commit
3. **Verify API key is valid:**
   - Go to https://aistudio.google.com/
   - Check if key is still active
4. **Check deployment logs:**
   - Look for API errors
   - Gemini might be rate-limited or API key invalid

### Problem: API returns errors

**Check for:**
- Invalid API key (401 error)
- Rate limit exceeded (429 error) - Free tier: 15 req/min
- API key restrictions (check Google AI Studio settings)

### Problem: Deployment failed after adding env var

**Railway:**
```bash
railway logs --tail 100
```
Look for build/startup errors

**Vercel:**
- Go to Deployments → Failed deployment → Function Logs
- Check for build errors

## Testing Locally

Before testing production, verify locally:

```bash
# 1. Create .env.local (if not exists)
echo "GEMINI_API_KEY=your_key_here" > .env.local

# 2. Start dev server
npm run dev

# 3. Run test script
node test-ai-categorization.mjs
```

Expected output should show `source: "gemini_ai"` for all merchants.

## What's Different with AI vs Pattern Matching?

### Pattern Matching (Fallback):
```json
{
  "merchantInfo": {
    "name": "STARBUCKS COFFEE",
    "businessType": "Coffee Shop",
    "description": "Categorized as Coffee Shop based on merchant name patterns",
    "suggestedCategory": "Meals & entertainment"
  },
  "source": "pattern_matching"
}
```

### Gemini AI:
```json
{
  "merchantInfo": {
    "name": "STARBUCKS COFFEE",
    "businessType": "Coffee Shop",
    "description": "International coffeehouse chain serving specialty coffee drinks",
    "suggestedCategory": "Meals & entertainment"
  },
  "source": "gemini_ai"
}
```

Notice:
- More detailed description from AI
- Better understanding of context
- Can handle unusual/new merchant names
- More accurate categorization

## Success Criteria

✅ **AI is working if:**
1. Browser console test shows `source: "gemini_ai"`
2. No console warnings about missing API key
3. Merchant descriptions are detailed sentences
4. Unusual merchant names get categorized correctly

## Need Help?

Check these files:
- [AI_VALIDATION.md](AI_VALIDATION.md) - Complete validation guide
- [test-ai-categorization.mjs](test-ai-categorization.mjs) - Test script
- `.env.local.example` - Environment setup guide
