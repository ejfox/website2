#!/bin/bash
# VPS Update Script - Pull, build, and restart Docker
# Usage: ./vps_update.sh [--no-pull] [--no-build]

set -e
cd /data2/website2

echo "🔄 Starting VPS update..."

NO_PULL=false
NO_BUILD=false

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        --no-pull)
            NO_PULL=true
            ;;
        --no-build)
            NO_BUILD=true
            ;;
    esac
done

if [ "$NO_PULL" = true ]; then
    echo "   Skipping git pull (--no-pull flag)"
else
    echo "📥 Pulling latest changes..."
    git pull origin main
fi

# Process content if markdown changed
echo "📝 Processing content..."
yarn blog:process

if [ "$NO_BUILD" = true ]; then
    echo "   Skipping build (--no-build flag)"
else
    echo "🔨 Building project..."
    # CRITICAL: Clear ALL build caches to prevent wrong Nitro preset
    rm -rf .nuxt .output node_modules/.cache
    # CRITICAL: Explicitly set node-server preset (Docker needs server files)
    NITRO_PRESET=node-server yarn build
fi

echo "🐳 Restarting Docker containers..."
docker-compose down
docker-compose up -d --build

echo "✅ VPS update complete!"
echo "🌐 Site should be available at http://localhost:3006"