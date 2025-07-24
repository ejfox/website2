#!/bin/bash
# VPS Update Script - The one script to rule them all! 🧙‍♂️
# Handles all edge cases and port conflicts automatically

set -e  # Exit on error

# Safety check: Are we in the right directory?
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ ERROR: No docker-compose.yml found in current directory!"
    echo "📍 Current directory: $(pwd)"
    echo "🤔 Are you in the website2 directory?"
    exit 1
fi

# Verify this is actually website2
if ! grep -q "website2" docker-compose.yml; then
    echo "❌ ERROR: This doesn't look like the website2 project!"
    echo "🤔 docker-compose.yml doesn't contain 'website2'"
    exit 1
fi

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

# Surgical strike: Only kill OUR stuff
echo "🎯 Targeting only website2 containers..."

# Stop only OUR containers
echo "🛑 Stopping website2 containers..."
docker-compose down --remove-orphans 2>/dev/null || true
docker stop website2-prod 2>/dev/null || true
docker rm website2-prod 2>/dev/null || true

# Look for EXACT website2 containers only
echo "🔍 Finding any remaining website2 containers..."
# Only match exact names: website2-prod or website2_website2_1 (docker-compose generated)
docker ps -a --filter "name=^website2-prod$" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
docker ps -a --filter "name=^website2-prod$" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true
docker ps -a --filter "name=^website2_website2" --format "{{.ID}}" | xargs -r docker stop 2>/dev/null || true
docker ps -a --filter "name=^website2_website2" --format "{{.ID}}" | xargs -r docker rm 2>/dev/null || true

# Check what's actually using port 3006 before killing
echo "🔍 Checking port 3006..."
PORT_USER=$(sudo lsof -i :3006 -t 2>/dev/null)
if [ ! -z "$PORT_USER" ]; then
    # Check if it's actually a Docker container
    if ps -p $PORT_USER -o comm= | grep -q "docker-proxy"; then
        echo "🔫 Port 3006 is used by Docker, safe to kill..."
        sudo kill -9 $PORT_USER 2>/dev/null || true
    else
        echo "⚠️  WARNING: Port 3006 is used by non-Docker process!"
        ps -p $PORT_USER -o pid,comm,args
        echo "❌ Refusing to kill non-Docker process. Fix this manually!"
        exit 1
    fi
fi

# Only clean up our network
echo "🌐 Cleaning up website2 network..."
docker network rm website2_default 2>/dev/null || true

# Give everything a moment to die
echo "⏰ Waiting for processes to terminate..."
sleep 3

# Build new image (or use existing if just restarting)
if [ "$SKIP_PULL" = false ]; then
    echo "🔨 Building Docker image (no cache)..."
    docker-compose build --no-cache
else
    echo "♻️  Restarting with existing image..."
fi

# Start new container with retries
echo "✨ Starting new container..."
RETRY_COUNT=0
MAX_RETRIES=3

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker-compose up -d; then
        echo "✅ Container started successfully!"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "❌ Attempt $RETRY_COUNT failed. Retrying in 5 seconds..."
        
        if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
            # Kill anything that might be interfering again
            sudo fuser -k 3006/tcp 2>/dev/null || true
            sleep 5
        else
            echo "💥 Failed to start container after $MAX_RETRIES attempts!"
            echo "📋 Docker logs:"
            docker-compose logs 2>/dev/null || true
            exit 1
        fi
    fi
done

# Wait for health check with longer timeout
echo "⏳ Waiting for application to start (30s timeout)..."
sleep 10

# Extended health check with retries
HEALTH_RETRY=0
MAX_HEALTH_RETRIES=6

while [ $HEALTH_RETRY -lt $MAX_HEALTH_RETRIES ]; do
    if docker ps | grep -q website2; then
        echo "✅ Container is running!"
        
        # Check health endpoint
        if curl -f http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
            echo "✅ Health check passed!"
            echo "🎉 Update complete! Site is running at http://localhost:3006"
            echo ""
            echo "📋 Recent logs:"
            docker-compose logs --tail=10
            echo ""
            echo "💡 Tip: Use './scripts/vps_update.sh --no-pull' for quick restarts"
            exit 0
        else
            HEALTH_RETRY=$((HEALTH_RETRY + 1))
            echo "⏳ Health check attempt $HEALTH_RETRY/$MAX_HEALTH_RETRIES..."
            sleep 5
        fi
    else
        echo "❌ Container not running!"
        break
    fi
done

# If we get here, something went wrong
echo "❌ Health checks failed!"
echo "📋 Container status:"
docker ps -a | grep website2 || echo "No website2 containers found"
echo ""
echo "📋 Recent logs:"
docker-compose logs --tail=50 2>/dev/null || echo "No logs available"
echo ""
echo "🔍 Port status:"
sudo lsof -i :3006 2>/dev/null || echo "Nothing using port 3006"
exit 1