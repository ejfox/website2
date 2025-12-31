#!/bin/bash
# TURBO MODE: 90-second deployments
# CRITICAL FIX: Use absolute paths for cron

set -e

# ABSOLUTE paths - $HOME doesn't expand in cron!
# Use Node 22 (required for Nuxt 4)
export PATH="/home/debian/.nvm/versions/node/v22.21.1/bin:/usr/local/bin:/usr/bin:/bin"

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

# OPT 3: Clean build with correct preset
log "🔨 Build..."
STEP_START=$(date +%s)
# CRITICAL: Clear ALL build caches to prevent wrong Nitro preset
rm -rf .nuxt .output node_modules/.cache
# CRITICAL: Explicitly set node-server preset (Docker needs server files)
NITRO_PRESET=node-server NODE_ENV=production yarn build --quiet >> "$LOG_FILE" 2>&1 || { log "ERROR: Build failed"; exit 1; }
BUILD_TIME=$(($(date +%s) - STEP_START))
log "   ${BUILD_TIME}s"

# Wait for processing
if [ -n "$CONTENT_CHANGED" ]; then
  wait $PROCESS_PID 2>/dev/null || true
  PROCESS_TIME=$(($(date +%s) - STEP_START))
fi

# OPT 4: Docker rebuild (always needed - .output is copied into image)
log "🐳 Docker..."
STEP_START=$(date +%s)
# Always rebuild - the Dockerfile copies .output/ into the image
# A restart won't pick up the new build files
docker-compose build --quiet >> "$LOG_FILE" 2>&1 || { log "ERROR: Docker build failed"; exit 1; }
docker-compose up -d >> "$LOG_FILE" 2>&1 || { log "ERROR: Docker up failed"; exit 1; }
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

# Gather commit details for alert
COMMIT_SHORT="${REMOTE:0:7}"
PREV_SHORT="${LOCAL:0:7}"
COMMIT_MSG=$(git log -1 --pretty=format:"%s" 2>/dev/null | head -c 100)
COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an" 2>/dev/null)
COMMIT_DATE=$(git log -1 --pretty=format:"%cr" 2>/dev/null)  # relative time
COMMIT_DATE_FULL=$(git log -1 --pretty=format:"%ci" 2>/dev/null)
COMMIT_URL="https://github.com/ejfox/website2/commit/${REMOTE}"
COMPARE_URL="https://github.com/ejfox/website2/compare/${LOCAL}...${REMOTE}"

# Files analysis
FILES_CHANGED=$(git diff --name-only $LOCAL $REMOTE 2>/dev/null | wc -l)
FILES_ADDED=$(git diff --name-status $LOCAL $REMOTE 2>/dev/null | grep -c "^A" || echo 0)
FILES_MODIFIED=$(git diff --name-status $LOCAL $REMOTE 2>/dev/null | grep -c "^M" || echo 0)
FILES_DELETED=$(git diff --name-status $LOCAL $REMOTE 2>/dev/null | grep -c "^D" || echo 0)
LINES_ADDED=$(git diff --stat $LOCAL $REMOTE 2>/dev/null | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+' || echo 0)
LINES_DELETED=$(git diff --stat $LOCAL $REMOTE 2>/dev/null | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+' || echo 0)

# Key changed areas
CHANGED_AREAS=""
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -q "^components/" && CHANGED_AREAS="${CHANGED_AREAS}components "
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -q "^pages/" && CHANGED_AREAS="${CHANGED_AREAS}pages "
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -q "^content/" && CHANGED_AREAS="${CHANGED_AREAS}content "
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -q "^server/" && CHANGED_AREAS="${CHANGED_AREAS}api "
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -q "nuxt.config" && CHANGED_AREAS="${CHANGED_AREAS}config "
git diff --name-only $LOCAL $REMOTE 2>/dev/null | grep -qE "package.json|yarn.lock" && CHANGED_AREAS="${CHANGED_AREAS}deps "
[ -z "$CHANGED_AREAS" ] && CHANGED_AREAS="other"

# Build output stats
OUTPUT_SIZE=$(du -sh .output 2>/dev/null | cut -f1 || echo "?")
SERVER_SIZE=$(du -sh .output/server 2>/dev/null | cut -f1 || echo "?")
PUBLIC_SIZE=$(du -sh .output/public 2>/dev/null | cut -f1 || echo "?")
PRERENDERED=$(find .output/public -name "*.html" 2>/dev/null | wc -l || echo "?")

# Container stats (after deploy)
sleep 2
CONTAINER_STATUS=$(docker inspect website2-prod --format '{{.State.Status}}' 2>/dev/null || echo "unknown")
CONTAINER_HEALTH=$(docker inspect website2-prod --format '{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
CONTAINER_RESTARTS=$(docker inspect website2-prod --format '{{.RestartCount}}' 2>/dev/null || echo "?")
CONTAINER_MEM=$(docker stats website2-prod --no-stream --format '{{.MemUsage}}' 2>/dev/null | cut -d'/' -f1 || echo "?")

# Health check result
HEALTH_OK="❌"
curl -sf http://localhost:3006/api/healthcheck > /dev/null 2>&1 && HEALTH_OK="✅"

# Timing breakdown
TIMING_DETAIL=""
[ "$INSTALL_TIME" -gt 0 ] && TIMING_DETAIL="deps:${INSTALL_TIME}s→"
TIMING_DETAIL="${TIMING_DETAIL}build:${BUILD_TIME}s→docker:${RELOAD_TIME}s"

# Compose hyper-dense alert message
ALERT_MSG="**🚀 ejfox.com deployed** ${HEALTH_OK}
\`${PREV_SHORT}\`→\`${COMMIT_SHORT}\` ${COMMIT_DATE}
**${COMMIT_MSG}**
by ${COMMIT_AUTHOR} | [diff](${COMPARE_URL})

**Δ** ${FILES_CHANGED} files (+${LINES_ADDED}/-${LINES_DELETED}) | A:${FILES_ADDED} M:${FILES_MODIFIED} D:${FILES_DELETED}
**Areas:** ${CHANGED_AREAS}
**Output:** ${OUTPUT_SIZE} total | server:${SERVER_SIZE} public:${PUBLIC_SIZE} | ${PRERENDERED} pages
**Container:** ${CONTAINER_STATUS}/${CONTAINER_HEALTH} | mem:${CONTAINER_MEM} | restarts:${CONTAINER_RESTARTS}
**Timing:** ${TIMING_DETAIL} | **total:${DEPLOY_TIME}s**"

# Alert on successful deploy
$ALERT website info "$ALERT_MSG"
