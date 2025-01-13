#!/bin/bash

# -----------------------------------------------------------------------------
# Folder Action: Blog Publishing Script
# -----------------------------------------------------------------------------
# Integrates with import.mjs and processMarkdown.mjs to process new Markdown files
# from Obsidian into the blog pipeline.
# -----------------------------------------------------------------------------

# --- PATHS & ENV -----------------------------------------------------------
WEBSITE_FOLDER="/Users/ejfox/code/website2"
LOGFILE="/tmp/publish_blog_automator.log"
LOCK_FILE="$WEBSITE_FOLDER/.import.lock"
STASH_NAME="pre-automator-import-$(date +%s)"

# Load Node environment
export SHELL=/bin/zsh
export PATH="$HOME/.nvm/versions/node/v20.16.0/bin:$HOME/.yarn/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# --- NOTIFICATIONS & LOGGING -----------------------------------------------
notify() {
  # First arg is the message, second (optional) is the title
  title=${2:-"Blog Publisher"}
  osascript -e "display notification \"$1\" with title \"$title\""
}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
  # If message starts with ERROR, send notification
  if [[ "$1" == ERROR* ]]; then
    notify "$*" "Blog Publisher Error"
  fi
}

# --- CLEANUP & SAFETY -----------------------------------------------------
cleanup() {
  local exit_code=$?
  
  # If we're exiting due to an error and have a stash
  if [[ $exit_code -ne 0 && -n "$STASH_REF" ]]; then
    log "Restoring changes from stash ($STASH_NAME)..."
    git stash pop "$STASH_REF" || log "ERROR: Could not restore stashed changes"
  fi
  
  # Remove lock file
  if [ -f "$LOCK_FILE" ]; then
    rm "$LOCK_FILE"
    log "Removed lock file"
  fi
  
  # Final notification based on exit code
  if [ $exit_code -eq 0 ]; then
    notify "Blog publish completed successfully"
  else
    notify "Blog publish failed - check logs" "Blog Publisher Error"
  fi
  
  exit $exit_code
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

# --- MAIN ----------------------------------------------------------------
main() {
  # Set up cleanup trap and lock file
  trap cleanup EXIT
  if [ -f "$LOCK_FILE" ]; then
    log "Another import is in progress (lock file exists)"
    exit 1
  fi
  touch "$LOCK_FILE"
  
  log "=== Blog Publish Started ==="
  notify "Starting blog publish..."
  
  # Switch to website directory
  cd "$WEBSITE_FOLDER" || {
    log "ERROR: Cannot cd to $WEBSITE_FOLDER"
    exit 1
  }
  
  # Load correct Node version
  nvm use 20.16.0 || log "Warning: Could not switch to Node 20.16.0"
  
  # Ensure clean workspace (stash if needed)
  ensure_clean_workspace
  
  # Run the import pipeline (import.mjs followed by processMarkdown.mjs)
  log "Running import pipeline..."
  
  # Run import.mjs first
  log "Running import step..."
  if ! node scripts/import.mjs; then
    log "ERROR: Import step failed"
    exit 1
  fi
  log "Import step completed"
  
  # Then run processMarkdown.mjs
  log "Running markdown processing..."
  if ! node scripts/processMarkdown.mjs; then
    log "ERROR: Markdown processing failed"
    exit 1
  fi
  log "Markdown processing completed"
  
  # Add build step
  log "Running nuxt build..."
  if ! yarn build; then
    log "ERROR: Build failed"
    exit 1
  fi
  log "Build completed"
  
  notify "Import and build completed successfully"
  
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
  
  # Pop stash if we had one
  if [ -n "$STASH_REF" ]; then
    log "Restoring stashed changes..."
    git stash pop "$STASH_REF" || {
      log "ERROR: Could not restore stashed changes"
      exit 1
    }
  fi
  
  log "=== Blog Publish Completed ==="
}

# Run main and capture all output to log
main "$@" 2>&1 | tee -a "$LOGFILE" 