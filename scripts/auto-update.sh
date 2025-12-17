#!/bin/bash
# TURBO MODE: 90-second deployments
# CRITICAL FIX: Use absolute paths for cron

set -e

# ABSOLUTE paths - $HOME doesn't expand in cron!
export PATH="/home/debian/.nvm/versions/node/v20.19.0/bin:/usr/local/bin:/usr/bin:/bin"

WEBSITE_DIR="/data2/website2"
LOG_FILE="$WEBSITE_DIR/auto-update.log"
METRICS_FILE="$WEBSITE_DIR/deployment-metrics.json"
ALERT="/home/debian/scripts/alert.sh"

log() { echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"; }

# Alert on failure
trap '$ALERT website error "Deployment FAILED: check $LOG_FILE"' ERR

cd "$WEBSITE_DIR" || { log "ERROR: Cannot cd"; exit 1; }

git fetch origin main --quiet 2>&1 || { log "ERROR: Fetch failed"; exit 1; }

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  log "✅ Up to date"
  exit 0
fi

DEPLOY_START=$(date +%s)

log "⚡ TURBO: ${LOCAL:0:7} → ${REMOTE:0:7}"

# Check what changed
DEPS_CHANGED=$(git diff --name-only $LOCAL $REMOTE | grep -E '^(package\.json|yarn\.lock)$' || true)
CONTENT_CHANGED=$(git diff --name-only $LOCAL $REMOTE | grep '^content/' || true)

# Stash if needed
[ -n "$(git status --porcelain)" ] && git stash --include-untracked --quiet

# Pull
git pull origin main --quiet 2>&1 || { log "ERROR: Pull failed"; exit 1; }

# OPT 1: Skip deps if unchanged
INSTALL_TIME=0
if [ -n "$DEPS_CHANGED" ]; then
  log "📦 Deps..."
  STEP_START=$(date +%s)
  yarn install --frozen-lockfile --prefer-offline --silent >> "$LOG_FILE" 2>&1 || { log "ERROR: Yarn failed"; exit 1; }
  INSTALL_TIME=$(($(date +%s) - STEP_START))
  log "   ${INSTALL_TIME}s"
fi

# OPT 2: Parallel content processing
PROCESS_TIME=0
if [ -n "$CONTENT_CHANGED" ]; then
  log "📝 Process..."
  STEP_START=$(date +%s)
  yarn blog:process >> "$LOG_FILE" 2>&1 &
  PROCESS_PID=$!
fi

# OPT 3: Incremental build
log "🔨 Build..."
STEP_START=$(date +%s)
rm -rf .output
NODE_ENV=production yarn build --quiet >> "$LOG_FILE" 2>&1 || { log "ERROR: Build failed"; exit 1; }
BUILD_TIME=$(($(date +%s) - STEP_START))
log "   ${BUILD_TIME}s"

# Wait for processing
if [ -n "$CONTENT_CHANGED" ]; then
  wait $PROCESS_PID 2>/dev/null || true
  PROCESS_TIME=$(($(date +%s) - STEP_START))
fi

# OPT 4: Smart reload
log "⚡ Reload..."
STEP_START=$(date +%s)
if [ -n "$DEPS_CHANGED" ]; then
  docker-compose down >> "$LOG_FILE" 2>&1
  docker-compose up -d --build >> "$LOG_FILE" 2>&1
else
  docker-compose restart >> "$LOG_FILE" 2>&1
fi
RELOAD_TIME=$(($(date +%s) - STEP_START))
log "   ${RELOAD_TIME}s"

# OPT 5: Background health check
(
  for i in {1..20}; do
    sleep 0.3
    curl -sf http://localhost:3006/api/healthcheck > /dev/null 2>&1 && log "   ✅ Healthy" && exit 0
  done
  log "   ⚠️ Timeout"
) &

DEPLOY_END=$(date +%s)
DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))

log "🎉 TURBO: ${DEPLOY_TIME}s"

# Alert on successful deploy
$ALERT website info "Deployed ${LOCAL:0:7}→${REMOTE:0:7} in ${DEPLOY_TIME}s"
