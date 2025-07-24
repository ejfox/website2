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

# Auditable port cleanup - show what we're killing and why
echo "🔍 Checking what's using port 3006..."
PORT_INFO=$(sudo netstat -tlnp | grep :3006 || echo "Port 3006 is free")
echo "$PORT_INFO"

if echo "$PORT_INFO" | grep -q "LISTEN"; then
    echo "🎯 Port 3006 is in use, identifying processes..."
    
    # Get all PIDs using port 3006
    PIDS=$(sudo lsof -ti:3006 2>/dev/null)
    
    if [ ! -z "$PIDS" ]; then
        for PID in $PIDS; do
            # Show what we're about to kill
            PROC_INFO=$(ps -p $PID -o pid,ppid,cmd --no-headers 2>/dev/null || echo "$PID: process not found")
            echo "🔫 Killing: $PROC_INFO"
            sudo kill -9 $PID 2>/dev/null || echo "Failed to kill $PID"
        done
    fi
    
    # Also use fuser as backup
    echo "🧹 Running fuser cleanup..."
    sudo fuser -k 3006/tcp 2>/dev/null || true
    
    # Wait and verify
    sleep 3
    
    # Final verification
    FINAL_CHECK=$(sudo netstat -tlnp | grep :3006 || echo "Port 3006 is now free")
    echo "✅ Final status: $FINAL_CHECK"
    
    if echo "$FINAL_CHECK" | grep -q "LISTEN"; then
        echo "❌ FAILED: Port 3006 still in use after cleanup!"
        echo "Manual intervention required."
        exit 1
    fi
else
    echo "✅ Port 3006 is already free"
fi

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