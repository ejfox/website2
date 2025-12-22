#!/bin/bash
# Local Deploy Script - Push to GitHub and deploy to VPS
# Usage: ./scripts/deploy.sh [--force] [--no-push]
#
# Options:
#   --force    Force rebuild even if no changes
#   --no-push  Skip git push (useful if already pushed)

set -e

FORCE=false
NO_PUSH=false
VPS_HOST="debian@vps"
VPS_DIR="/data2/website2"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() { echo -e "${GREEN}▶${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
error() { echo -e "${RED}✖${NC} $1"; exit 1; }

# Parse arguments
for arg in "$@"; do
    case $arg in
        --force) FORCE=true ;;
        --no-push) NO_PUSH=true ;;
        --help|-h)
            echo "Usage: ./scripts/deploy.sh [--force] [--no-push]"
            echo ""
            echo "Options:"
            echo "  --force    Force rebuild even if no changes"
            echo "  --no-push  Skip git push (useful if already pushed)"
            exit 0
            ;;
    esac
done

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    warn "You have uncommitted changes:"
    git status --short
    echo ""
    read -p "Continue anyway? [y/N] " -n 1 -r
    echo
    [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi

# Push to GitHub
if [ "$NO_PUSH" = false ]; then
    log "Pushing to GitHub..."
    git push origin main || error "Git push failed"
fi

# Deploy to VPS
log "Deploying to VPS..."

ssh "$VPS_HOST" "cd $VPS_DIR && \
    echo '📥 Pulling latest...' && \
    git pull origin main && \
    echo '🧹 Cleaning caches...' && \
    rm -rf .nuxt .output node_modules/.cache && \
    source ~/.nvm/nvm.sh && nvm use 22 && \
    echo '🔨 Building...' && \
    NITRO_PRESET=node-server yarn build && \
    echo '🐳 Restarting Docker...' && \
    docker-compose build && \
    docker-compose up -d && \
    echo '✅ Deployed!'"

# Health check
log "Checking health..."
sleep 5
HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' https://ejfox.com/ 2>/dev/null || echo "000")

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Site is healthy (HTTP $HTTP_CODE)${NC}"
else
    warn "Site returned HTTP $HTTP_CODE - check logs with: ssh $VPS_HOST 'docker logs website2-prod --tail 50'"
fi
