#!/bin/bash
# VPS Update Script - Updates and restarts the website2 Docker container

set -e  # Exit on error

echo "🚀 Starting VPS update..."

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

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

# Build new image
echo "🔨 Building Docker image..."
docker-compose build

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