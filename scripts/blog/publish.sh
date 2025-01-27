#!/bin/bash

# -----------------------------------------------------------------------------
# Blog Publishing Script
# -----------------------------------------------------------------------------
# Handles the complete blog publishing workflow:
# 1. Import and process content
# 2. Build the site
# 3. Commit and push changes
# -----------------------------------------------------------------------------

set -e # Exit on error

# --- Configuration -----------------------------------------------------------
LOGFILE="/tmp/blog_publish.log"
LOCK_FILE=".blog-publish.lock"
STASH_NAME="pre-publish-$(date +%s)"

# Load Node environment
export SHELL=/bin/zsh
export PATH="$HOME/.nvm/versions/node/v20.16.0/bin:$HOME/.yarn/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# --- Utility Functions ------------------------------------------------------
notify() {
  title=${2:-"Blog Publisher"}
  osascript -e "display notification \"$1\" with title \"$title\""
}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
  if [[ "$1" == ERROR* ]]; then
    notify "$*" "Blog Publisher Error"
  fi
}

ensure_clean_workspace() {
  if [[ -n "$(git status --porcelain)" ]]; then
    log "Stashing existing changes as: $STASH_NAME"
    STASH_REF=$(git stash push -m "$STASH_NAME")
    if [ $? -ne 0 ]; then
      log "ERROR: Failed to stash changes"
      exit 1
    fi
  fi
}

cleanup() {
  local exit_code=$?
  
  # Restore stashed changes if we have them and there was an error
  if [[ $exit_code -ne 0 && -n "$STASH_REF" ]]; then
    log "Restoring changes from stash ($STASH_NAME)..."
    git stash pop "$STASH_REF" || log "ERROR: Could not restore stashed changes"
  fi
  
  # Remove lock file
  rm -f "$LOCK_FILE"
  
  # Final notification
  if [ $exit_code -eq 0 ]; then
    notify "Blog publish completed successfully"
  else
    notify "Blog publish failed - check logs" "Blog Publisher Error"
  fi
  
  exit $exit_code
}

# --- Main Process ----------------------------------------------------------
main() {
  trap cleanup EXIT
  
  # Check for lock file
  if [ -f "$LOCK_FILE" ]; then
    log "ERROR: Another publish is in progress (lock file exists)"
    exit 1
  fi
  touch "$LOCK_FILE"
  
  log "=== Starting Blog Publish ==="
  notify "Starting blog publish..."
  
  # Ensure clean workspace
  ensure_clean_workspace
  
  # Run import pipeline
  log "Running import pipeline..."
  if ! node scripts/blog/import.mjs; then
    log "ERROR: Import failed"
    exit 1
  fi
  
  # Build site
  log "Building site..."
  if ! yarn build; then
    log "ERROR: Build failed"
    exit 1
  fi
  
  # Commit and push if there are changes
  if [[ -n "$(git status --porcelain)" ]]; then
    log "Changes detected, committing..."
    
    if git add . && \
       git commit -m "blog: auto-publish new content" && \
       git push; then
      log "Changes pushed successfully"
      notify "Changes pushed to repository"
    else
      log "ERROR: Git operations failed"
      exit 1
    fi
  else
    log "No changes to commit"
    notify "No changes to publish"
  fi
  
  log "=== Blog Publish Completed ==="
}

# Run main process
main "$@" 2>&1 | tee -a "$LOGFILE" 