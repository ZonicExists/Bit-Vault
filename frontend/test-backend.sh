#!/bin/bash

# 🔐 Test connection to Secure Vault Backend

echo "🔍 Testing Secure Vault Backend Connection"
echo "==========================================="
echo ""

# Allow overriding via REACT_APP_API_URL or BACKEND_URL env var
BACKEND_URL="${REACT_APP_API_URL:-${BACKEND_URL:-http://localhost:4000/api}}"

echo "Testing connection to: $BACKEND_URL"
echo ""

# Test basic connectivity
echo "1️⃣  Testing basic API connectivity..."
if curl -s -f -X GET "$BACKEND_URL/auth/status" > /dev/null 2>&1; then
    echo "   ✅ Backend is reachable"
else
    echo "   ❌ Backend is NOT reachable"
    echo "   Please ensure backend is running on http://localhost:4000"
    echo ""
    exit 1
fi

# Test API response format
echo ""
echo "2️⃣  Testing API response format..."
RESPONSE=$(curl -s -X GET "$BACKEND_URL/auth/status" 2>&1)
echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "success"; then
    echo "   ✅ API response format looks correct"
else
    echo "   ⚠️  API response may not match expected format"
fi

echo ""
echo "3️⃣  Testing CORS headers..."
CORS=$(curl -s -I -X OPTIONS "$BACKEND_URL/auth/status" 2>&1 | grep -i "access-control-allow-origin" || echo "Not found")
echo "   CORS Header: $CORS"

if echo "$CORS" | grep -q "localhost\|3000\|\*"; then
    echo "   ✅ CORS appears to be configured"
else
    echo "   ⚠️  CORS may need configuration for http://localhost:3000"
fi

echo ""
echo "==========================================="
echo "✅ Backend connection test complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Ensure backend is running: http://localhost:4000"
echo "   2. Run frontend: cd vault-frontend && npm start"
echo "   3. Open http://localhost:3000 in your browser"
echo ""
