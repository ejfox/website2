#!/usr/bin/env bash
# Refresh the Valley Atlas basemap: cut a Hudson Valley extract from the
# latest Protomaps planet build and upload it to the ejfox-tiles R2 bucket.
#   yarn atlas:basemap
# Needs: pmtiles CLI (brew install pmtiles), wrangler logged in.
# Then point BASEMAP_URL in pages/atlas.vue at the new file name.
set -euo pipefail
BBOX="-75.6,40.7,-72.6,42.9"   # matches the map's maxBounds
MAXZOOM=14                      # vector tiles overzoom cleanly; z15 doubles the size
BUILD=$(curl -s https://build-metadata.protomaps.dev/builds.json | node -e 'const b=JSON.parse(require("fs").readFileSync(0));console.log(b.at(-1).key)')
DATE=${BUILD%.pmtiles}
OUT="$(mktemp -d)/hudson-valley-${DATE}.pmtiles"
echo "Extracting ${BUILD} → ${OUT}"
pmtiles extract "https://build.protomaps.com/${BUILD}" "$OUT" --bbox="$BBOX" --maxzoom="$MAXZOOM"
ls -lh "$OUT"
# wrangler's single-object upload tops out around 300 MB
npx -y wrangler@4 r2 object put "ejfox-tiles/basemap/$(basename "$OUT")" \
  --file="$OUT" --content-type=application/vnd.pmtiles --remote
echo "Uploaded: https://pub-d198c0af42af471bb2e755ad4a268050.r2.dev/basemap/$(basename "$OUT")"
