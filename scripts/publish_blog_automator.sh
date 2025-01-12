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

# Load Node environment
export SHELL=/bin/zsh
export PATH="$HOME/.nvm/versions/node/v20.16.0/bin:$HOME/.yarn/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# --- LOGGING --------------------------------------------------------------
log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOGFILE"
}

# --- MAIN ----------------------------------------------------------------
main() {
  log "=== Blog Publish Started ==="
  
  # Switch to website directory
  cd "$WEBSITE_FOLDER" || {
    log "ERROR: Cannot cd to $WEBSITE_FOLDER"
    exit 1
  }
  
  # Load correct Node version
  nvm use 20.16.0 || log "Warning: Could not switch to Node 20.16.0"
  
  # Run the import pipeline (import.mjs followed by processMarkdown.mjs)
  log "Running import pipeline..."
  if node scripts/import.mjs && node scripts/processMarkdown.mjs; then
    log "Import pipeline completed successfully"
  else
    log "ERROR: Import pipeline failed"
    exit 1
  fi
  
  # Commit and push if there are changes
  if [[ -n "$(git status --porcelain)" ]]; then
    log "Changes detected, committing..."
    git add . && \
    git commit -m "blog: auto-publish new content" && \
    git push && \
    log "Changes pushed successfully" || \
    log "ERROR: Git operations failed"
  else
    log "No changes to commit"
  fi
  
  log "=== Blog Publish Completed ==="
}

# Run main and capture all output to log
main "$@" 2>&1 | tee -a "$LOGFILE" 