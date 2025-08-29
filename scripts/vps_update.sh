#!/bin/bash
# VPS Update Script - Wrapper for auto-update.sh with force flag
# Usage: ./vps_update.sh [--no-pull]

cd /data2/website2

if [ "$1" = "--no-pull" ]; then
    ./auto-update.sh --force --no-pull
else
    ./auto-update.sh --force
fi