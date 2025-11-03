#!/bin/bash
# Auto-update script for website2 - checks for new commits and deploys
# Runs via cron every 5 minutes

set -e

# Paths and config
WEBSITE_DIR="/data2/website2"
LOG_FILE="$WEBSITE_DIR/auto-update.log"
MAX_LOG_SIZE=10485760  # 10MB

# Load NVM and Node environment for cron
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
# Add yarn and node to PATH
export PATH="$HOME/.nvm/versions/node/$(nvm current)/bin:$PATH"

# Function to log with timestamp
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE") -gt $MAX_LOG_SIZE ]; then
  mv "$LOG_FILE" "$LOG_FILE.old"
  log "Log rotated"
fi

# Change to website directory
cd "$WEBSITE_DIR" || { log "ERROR: Cannot cd to $WEBSITE_DIR"; exit 1; }

# Fetch latest from origin
git fetch origin main --quiet 2>&1 || { log "ERROR: Git fetch failed"; exit 1; }

# Check if we're behind
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  log "✅ Already up to date"
  exit 0
fi

log "🔄 New commits found, updating..."
log "   Local: ${LOCAL:0:7}"
log "   Remote: ${REMOTE:0:7}"

# Stash any local changes (including generated files)
if [ -n "$(git status --porcelain)" ]; then
  log "📦 Stashing local changes..."
  git stash --include-untracked --quiet || { log "ERROR: Git stash failed"; exit 1; }
fi

# Pull latest changes
git pull origin main --quiet 2>&1 || { log "ERROR: Git pull failed"; exit 1; }

# Install/update dependencies
log "📦 Installing dependencies..."
yarn install --frozen-lockfile >> "$LOG_FILE" 2>&1 || { log "ERROR: Yarn install failed"; exit 1; }

# Process content (this regenerates the processed files)
log "📝 Processing content..."
yarn blog:process >> "$LOG_FILE" 2>&1 || { log "ERROR: Content processing failed"; exit 1; }

# Build
log "🔨 Building..."
rm -rf .nuxt .output
yarn build >> "$LOG_FILE" 2>&1 || { log "ERROR: Build failed"; exit 1; }

# Restart Docker container
log "🐳 Restarting Docker container..."
docker-compose down >> "$LOG_FILE" 2>&1
docker-compose up -d --build >> "$LOG_FILE" 2>&1 || { log "ERROR: Docker restart failed"; exit 1; }

# Wait for health check
log "⏳ Waiting for health check..."
sleep 10

# Verify deployment
if curl -sf http://localhost:3006/api/healthcheck > /dev/null 2>&1; then
  log "✅ Deployment successful!"
else
  log "⚠️  WARNING: Health check failed"
fi

log "🎉 Update complete"
