#!/bin/bash
# Simple VPS Update Script - No bullshit, just works

set -e

echo "🚀 Starting website2 update..."

# Basic safety check
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Run this from the website2 directory"
    exit 1
fi

# Pull code unless --no-pull
if [ "$1" != "--no-pull" ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
fi

# Create .env if missing
if [ ! -f .env ]; then
    echo "📝 Creating .env from example..."
    cp .env.example .env
    echo "⚠️  Edit .env with your values, then run again"
    exit 1
fi

# Stop existing containers
echo "🛑 Stopping old containers..."
docker-compose down 2>/dev/null || true

# Kill anything on port 3006
echo "🔥 Freeing port 3006..."
sudo pkill -f ":3006" 2>/dev/null || true
sudo lsof -ti:3006 | xargs -r sudo kill -9 2>/dev/null || true

# Wait for port to free
sleep 3

# Build and start
echo "🔨 Building and starting..."
docker-compose up -d --build

# Wait and check
echo "⏳ Waiting 15 seconds..."
sleep 15

if curl -f http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
    echo "✅ SUCCESS! Site is live at http://localhost:3006"
else
    echo "❌ Health check failed"
    docker-compose logs --tail=20
    exit 1
fi