#!/bin/bash

# Deployment Validation Script
# Tests both Railway and Vercel deployments for AI functionality

echo "=================================="
echo "AI Deployment Validation"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local url=$1
    local name=$2

    echo "Testing: $name"
    echo "URL: $url/api/search-merchant"
    echo ""

    response=$(curl -s -X POST "$url/api/search-merchant" \
        -H "Content-Type: application/json" \
        -d '{"merchantName":"ACME CONSULTING GROUP"}')

    source=$(echo "$response" | grep -o '"source":"[^"]*"' | cut -d'"' -f4)

    if [ "$source" == "gemini_ai" ]; then
        echo -e "${GREEN}✅ AI ACTIVE${NC} - Using Gemini AI"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    elif [ "$source" == "pattern_matching" ]; then
        echo -e "${YELLOW}⚠️  FALLBACK MODE${NC} - Using pattern matching"
        echo "Reason: GEMINI_API_KEY not configured or invalid"
        echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
    else
        echo -e "${RED}❌ ERROR${NC} - Unexpected response"
        echo "$response"
    fi

    echo ""
    echo "----------------------------------"
    echo ""
}

# Prompt for URLs
echo "Enter your deployment URLs (press Enter to skip):"
echo ""

read -p "Railway URL (e.g., https://your-app.railway.app): " railway_url
read -p "Vercel URL (e.g., https://your-app.vercel.app): " vercel_url

echo ""
echo "=================================="
echo "Starting Validation Tests"
echo "=================================="
echo ""

# Test Railway
if [ -n "$railway_url" ]; then
    test_endpoint "$railway_url" "Railway Deployment"
else
    echo "Skipping Railway test (no URL provided)"
    echo ""
fi

# Test Vercel
if [ -n "$vercel_url" ]; then
    test_endpoint "$vercel_url" "Vercel Deployment"
else
    echo "Skipping Vercel test (no URL provided)"
    echo ""
fi

# Local test (if running)
echo "Would you like to test localhost:3000? (y/n)"
read -p "> " test_local

if [ "$test_local" == "y" ]; then
    test_endpoint "http://localhost:3000" "Local Development"
fi

echo "=================================="
echo "Validation Complete"
echo "=================================="
echo ""
echo "Next Steps:"
echo ""
echo "If you see ${YELLOW}FALLBACK MODE${NC}:"
echo "1. Check if GEMINI_API_KEY is set in environment"
echo "2. Railway: Should auto-deploy after adding env var"
echo "3. Vercel: Requires manual redeploy after adding env var"
echo ""
echo "To redeploy Vercel:"
echo "  1. Go to vercel.com → Your Project"
echo "  2. Deployments tab → ... → Redeploy"
echo ""
