#!/bin/bash
# Deploy website2 to VPS — enforces correct build order
# Usage: ssh vps "cd /data2/website2 && bash scripts/deploy.sh"

set -euo pipefail

echo "==> Pulling latest..."
git pull

echo "==> Installing dependencies..."
yarn install --frozen-lockfile

echo "==> Building Nuxt..."
yarn build

# Verify build output exists
if [ ! -f ".output/server/index.mjs" ]; then
  echo "ERROR: Build failed — .output/server/index.mjs not found"
  exit 1
fi

echo "==> Building Docker image..."
docker compose build --no-cache

echo "==> Restarting container..."
docker compose up -d

echo "==> Waiting for health check..."
sleep 5

if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
  echo "==> Deploy successful!"
else
  echo "WARNING: Health check failed — check: docker logs website2-prod"
fi
