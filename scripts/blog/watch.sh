#!/bin/bash

# -----------------------------------------------------------------------------
# Blog Watch Script
# -----------------------------------------------------------------------------
# Watches for changes in the Obsidian directory and triggers the import process
# when changes are detected. Useful during development.
# -----------------------------------------------------------------------------

set -e # Exit on error

# Configuration
WATCH_DIR="/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox"
DEBOUNCE_SECONDS=5
LAST_RUN=0

# Load Node environment
export SHELL=/bin/zsh
export PATH="$HOME/.nvm/versions/node/v20.16.0/bin:$HOME/.yarn/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Utility functions
notify() {
  title=${2:-"Blog Watcher"}
  osascript -e "display notification \"$1\" with title \"$title\""
}

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

run_import() {
  current_time=$(date +%s)
  time_diff=$((current_time - LAST_RUN))
  
  if [ $time_diff -lt $DEBOUNCE_SECONDS ]; then
    return
  fi
  
  LAST_RUN=$current_time
  log "Changes detected, running import..."
  
  if node scripts/blog/import.mjs; then
    notify "Import completed successfully"
  else
    notify "Import failed - check console" "Blog Watcher Error"
  fi
}

# Main watch loop
main() {
  log "Starting blog watch..."
  notify "Blog watch started"
  
  # Initial import
  run_import
  
  # Watch for changes
  fswatch -o "$WATCH_DIR" | while read -r line; do
    if [[ "$line" == *".md" && "$line" != *".canvas.md" ]]; then
      run_import
    fi
  done
}

# Run main process
main "$@" 