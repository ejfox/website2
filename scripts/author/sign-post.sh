#!/bin/bash

# Usage: yarn sign-post path/to/post.md
POST_FILE=$1

if [ -z "$POST_FILE" ]; then
    echo "Error: Please provide a path to the markdown file"
    echo "Usage: yarn sign-post path/to/post.md"
    exit 1
fi

if [ ! -f "$POST_FILE" ]; then
    echo "Error: File $POST_FILE does not exist"
    exit 1
fi

# Extract content after frontmatter
awk '/^---$/ { if (++count == 2) { next } } count == 2 { print }' "$POST_FILE" > temp_content.txt

# Sign the content
gpg --clearsign temp_content.txt

# Clean up
rm temp_content.txt

echo "Signature generated in temp_content.txt.asc"
echo "You can now append this signature to your post"