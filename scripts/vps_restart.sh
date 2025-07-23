#!/bin/bash
# Quick restart script - just restarts the container without rebuilding

set -e

echo "🔄 Restarting website2 container..."

# Restart container
docker-compose restart

# Wait for health check
echo "⏳ Waiting for health check..."
sleep 10

# Check if container is healthy
if docker ps | grep -q website2; then
    echo "✅ Container is running!"
    
    # Check health endpoint
    if curl -f http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
        echo "✅ Health check passed!"
        echo "🎉 Restart complete! Site is running at http://localhost:3006"
    else
        echo "❌ Health check failed!"
        echo "📋 Container logs:"
        docker-compose logs --tail=50
        exit 1
    fi
else
    echo "❌ Container failed to start!"
    echo "📋 Container logs:"
    docker-compose logs
    exit 1
fi