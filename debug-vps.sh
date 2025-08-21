#!/bin/bash

echo "🔍 VPS Deployment Debug Script"
echo "==============================="

echo "1. Checking Node.js environment..."
echo "NODE_ENV: $NODE_ENV"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

echo -e "\n2. Checking built files..."
if [ -d ".output" ]; then
    echo "✅ .output directory exists"
    echo "CSS files:"
    find .output -name "*.css" | head -3
    echo "JS files:"  
    find .output -name "*.js" | head -3
else
    echo "❌ .output directory missing - run 'npm run build' first"
fi

echo -e "\n3. Checking main CSS file for corruption..."
MAIN_CSS=$(find .output -name "entry.*.css" | head -1)
if [ -f "$MAIN_CSS" ]; then
    echo "Main CSS file: $MAIN_CSS"
    echo "File size: $(wc -c < "$MAIN_CSS") bytes"
    echo "First few characters:"
    head -c 100 "$MAIN_CSS" | cat -A
    echo -e "\nLast few characters:"
    tail -c 100 "$MAIN_CSS" | cat -A
else
    echo "❌ Main CSS file not found"
fi

echo -e "\n4. Checking main JS file for corruption..."
MAIN_JS=$(find .output -name "entry.*.js" | head -1)
if [ -f "$MAIN_JS" ]; then
    echo "Main JS file: $MAIN_JS"
    echo "File size: $(wc -c < "$MAIN_JS") bytes"
    echo "First few characters:"
    head -c 100 "$MAIN_JS" | cat -A
else
    echo "❌ Main JS file not found"
fi

echo -e "\n5. Testing server startup..."
timeout 5s node .output/server/index.mjs &
sleep 2
if curl -s http://localhost:3000/api/healthcheck > /dev/null; then
    echo "✅ Server starts and health check works"
else
    echo "❌ Server startup or health check failed"
fi

echo -e "\n6. Environment check..."
echo "PORT: $PORT"
echo "HOST: $HOST"
echo "Working directory: $(pwd)"
echo "User: $(whoami)"

echo -e "\nDone! Run this script on your VPS to diagnose the issue."