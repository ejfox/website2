#!/bin/bash

# -----------------------------------------------------------------------------
# Folder Action: Publish Blog Script
# -----------------------------------------------------------------------------
# When Automator sees new files in your Obsidian vault, it forwards them
# as arguments ($@). This script copies any .md files into your blog, runs
# "yarn import", optionally signs the posts, and then commits/pushes changes.
# -----------------------------------------------------------------------------

# --- EDIT THESE PATHS FOR YOUR SYSTEM ----------------------------------------
ROOT_FOLDER="/Users/ejfox/Library/Mobile Documents/iCloud~md~obsidian/Documents/ejfox"
WEBSITE_FOLDER="/Users/ejfox/code/website2"
BLOG_FOLDER="$WEBSITE_FOLDER/content/blog"
LOCK_FILE="$WEBSITE_FOLDER/.import.lock"

# Node environment and other Path settings
export SHELL=/bin/zsh
export PATH="$HOME/.nvm/versions/node/v20.16.0/bin:$HOME/.yarn/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20.16.0 || echo "Could not switch to Node 20.16.0. Using default node..."

# -----------------------------------------------------------------------------
#  Utility & Helper Functions
# -----------------------------------------------------------------------------
error_exit() {
  echo "ERROR: $1"
  exit 1
}

cleanup() {
  [ -f "$LOCK_FILE" ] && rm "$LOCK_FILE"
}

# Runs yarn import and checks for success keywords
run_import() {
  local output
  output=$(yarn import 2>&1)
  echo "$output"
  if echo "$output" | grep -q "Manifest written successfully"; then
    echo "Import finished OK!"
    return 0
  else
    echo "Import may have failed"
    return 1
  fi
}

git_commit_and_push() {
  yarn sign-post || echo "Sign-post step failed or was skipped."
  git add . || error_exit "git add failed"
  git commit -m "blog: auto-publish new content" || {
    echo "Nothing to commit or commit failed"
    return 0
  }
  git push || echo "Failed to push changes"
}

# -----------------------------------------------------------------------------
#  Main Script
# -----------------------------------------------------------------------------
main() {
  trap cleanup EXIT

  # Ensure no parallel runs 
  if [ -f "$LOCK_FILE" ]; then
    echo "Another import is in progress – skipping!"
    exit 0
  fi
  touch "$LOCK_FILE"

  cd "$WEBSITE_FOLDER" || error_exit "Cannot cd into $WEBSITE_FOLDER"

  # Automator passes changed files as arguments. Filter for .md only.
  local md_files=()
  for f in "$@"; do
    if [[ -f "$f" && "$f" == *.md ]]; then
      md_files+=("$f")
    fi
  done

  if [ ${#md_files[@]} -eq 0 ]; then
    echo "No new .md files to process."
    exit 0
  fi

  echo "Received new/changed .md files from Automator:"
  printf '%s\n' "${md_files[@]}"
  echo

  # Copy .md files to your blog folder
  for file in "${md_files[@]}"; do
    cp "$file" "$BLOG_FOLDER" || echo "Warning: could not copy $file"
  done

  # Run the import
  if ! run_import; then
    error_exit "Import script encountered an error"
  fi

  # Commit & push
  git_commit_and_push

  echo "Automator Blog Publish: Completed Successfully"
}

main "$@" 