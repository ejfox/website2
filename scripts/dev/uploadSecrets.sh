#!/bin/bash

# Loop through each line in the .env file
while IFS= read -r line || [[ -n "$line" ]]; do
  # Split the line into key and value
  if [[ "$line" == *"="* ]]; then
    key=$(echo "$line" | cut -d '=' -f 1)
    value=$(echo "$line" | cut -d '=' -f 2-)
    
    # Use GitHub CLI to set the secret
    gh secret set "$key" -b"$value"
  fi
done < .env
