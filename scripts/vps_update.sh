#!/bin/bash
# VPS Update Script - The one script to rule them all! 🧙‍♂️

set -e  # Exit on error

# Check if we should skip git pull (for quick restarts)
SKIP_PULL=false
if [ "$1" = "--no-pull" ] || [ "$1" = "-n" ]; then
    SKIP_PULL=true
    echo "🏃 Quick restart mode - skipping git pull"
else
    echo "🚀 Starting full VPS update..."
fi

# Pull latest changes (unless skipped)
if [ "$SKIP_PULL" = false ]; then
    echo "📥 Pulling latest changes from git..."
    git pull origin main
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env with your actual values"
    exit 1
fi

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker-compose down || true

# Build new image (or use existing if just restarting)
if [ "$SKIP_PULL" = false ]; then
    echo "🔨 Building Docker image (no cache)..."
    docker-compose build --no-cache
else
    echo "♻️  Using existing Docker image..."
fi

# Start new container
echo "✨ Starting new container..."
docker-compose up -d

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# Check if container is healthy
if docker ps | grep -q website2; then
    echo "✅ Container is running!"
    
    # Show logs
    echo "📋 Recent logs:"
    docker-compose logs --tail=20
    
    # Check health endpoint
    if curl -f http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        echo "🎉 Update complete! Site is running at http://localhost:3006"
        echo ""
        echo "💡 Tip: Use './scripts/vps_update.sh --no-pull' for quick restarts"
    else
        echo "❌ Health check failed!"
        echo "📋 Container logs:"
        docker-compose logs
        exit 1
    fi
else
    echo "❌ Container failed to start!"
    echo "📋 Container logs:"
    docker-compose logs
    exit 1
fi