# Kalshi + Predictions System

Complete guide for maintaining your falsifiable prediction ledger.

## The System (Overview)

```
/predictions page shows:
├─ PGP-signed predictions (content/predictions/*.md)
├─ Kalshi market positions (live API + markdown commentary)
└─ [Future] Election model outputs (JSON files)

All cryptographically verifiable, timestamped, git-tracked.
```

## What You Have Now

### 1. PGP-Signed Predictions

**Location**: `content/predictions/*.md`

**What they are**: Your manually created, cryptographically signed predictions

**Example**: `zohran-mamdani-nyc-mayor-2025.md`

**How to add more**: Use your existing `yarn predict` script

### 2. Kalshi Market Positions

**API**: `/api/kalshi` pulls live data every 5 minutes

**Commentary**: `content/kalshi/TICKER.md`

**Display**: Shows on `/predictions` below your PGP predictions

**What it shows**:

- Live positions with YES/NO, quantity, price
- Your commentary/thesis from markdown files
- Recent fills table
- All styled to match your predictions aesthetic

### 3. Deep-Linking (Implemented)

In your Kalshi commentary markdown:

```yaml
---
ticker: OAIAGI-29
related_posts: [/blog/2025/agi-timeline] # Links to blog posts
tags: [ai, agi, skepticism] # Cross-reference tags
---
```

In your PGP predictions:

```yaml
---
id: my-prediction
market:
  provider: kalshi
  ticker: OAIAGI-29 # Auto-links to Kalshi position
---
```

## Daily Workflow

### When You Make a New Kalshi Bet

```bash
# 1. Check what positions you have
node scripts/kalshi-test.mjs

# 2. Create commentary for new position
vim content/kalshi/TICKER-NAME.md

# 3. Git commit (preserves timestamp)
git add content/kalshi/TICKER-NAME.md
git commit -m "Add commentary for TICKER-NAME position"

# 4. Push to deploy
git push

# Site auto-updates within 5 minutes
```

### When You Make a New PGP Prediction

```bash
# Use your existing script
yarn predict --statement "..." --confidence 80 --deadline 2026-12-31

# Optionally link to Kalshi position
# Edit the generated .md file, add:
market:
  provider: kalshi
  ticker: RELEVANT-TICKER
```

### When Predictions Resolve

```bash
# 1. Update the prediction markdown
vim content/predictions/my-prediction.md

# Add resolution data
resolved: true
resolved_date: '2025-11-14T00:00:00.000Z'
status: correct  # or incorrect
resolution: |
  Outcome details here...

# 2. Commit
git commit -m "Resolve: my-prediction (correct)"

# Kalshi positions auto-resolve when markets settle
```

## File Structure

```
website2/
├─ content/
│  ├─ predictions/
│  │  ├─ *.md                    # PGP-signed predictions
│  │  └─ elections/              # Future: election model outputs
│  │     └─ 2026/
│  │        └─ *.json
│  └─ kalshi/
│     ├─ OAIAGI-29.md           # Commentary on positions
│     ├─ KXIMPEACH-27-JAN01.md
│     └─ README.md               # Guide for adding commentary
├─ server/api/
│  ├─ kalshi.get.ts             # Fetches live Kalshi data + merges commentary
│  └─ predictions.get.ts         # Serves PGP predictions
├─ composables/
│  └─ useKalshi.ts              # Client-side Kalshi data hook
├─ pages/
│  └─ predictions/
│     └─ index.vue               # Main predictions page
└─ docs/
   ├─ KALSHI-PREDICTIONS-SYSTEM.md  # This file
   └─ ELECTION-PREDICTION-FORMAT.md # Future: election model schema
```

## Data Flow

```
Kalshi API (live positions)
    ↓
server/api/kalshi.get.ts (fetches + caches 5min)
    ↓
Merges with content/kalshi/*.md (commentary)
    ↓
useKalshi() composable
    ↓
/predictions page displays
```

## Verification & Posterity

### PGP Predictions

- **Hash**: SHA-256 in frontmatter
- **Signature**: PGP signed
- **Git**: Commit timestamp
- **Cannot alter** without detection

### Kalshi Positions

- **Timestamp**: Kalshi API provides `created_time` for every fill
- **Immutable**: Kalshi's database = blockchain-level proof
- **Your commentary**: Git tracked, timestamped
- **Cannot backdate** bets or change prices

### Election Model (Future)

- **Hash**: SHA-256 in JSON
- **Git**: Commit timestamp
- **Optional**: PGP signature on outputs

## Maintenance

### Keep API Keys Fresh

```bash
# Update local .env file
vim .env
# Add or update KALSHI_KEY_ID and KALSHI_PRIVATE_KEY

# Auto-syncs to VPS via mutagen (see below)
# Or manually sync to VPS:
ssh vps "cd /data2/website2 && docker-compose restart"
```

**Mutagen Auto-Sync** (configured):
The `.env` file automatically syncs from local → VPS via mutagen.

```bash
# Check sync status
mutagen sync list website2-env

# Created with:
# mutagen sync create --name=website2-env --sync-mode=one-way-replica \
#   /Users/ejfox/code/website2/.env debian@vps:/data2/website2/.env
```

Changes to local `.env` propagate to VPS within seconds. Container restart still required for new vars.

### Add Commentary for Positions

```bash
# Find positions without commentary
node scripts/kalshi-test.mjs

# Create markdown files for any missing
touch content/kalshi/NEW-TICKER.md
```

### Clean Up Old Positions

Resolved Kalshi positions disappear from API automatically.
Commentary files stay in git for posterity.

## Styling Philosophy

**Brutalist academia**:

- `font-mono` for data
- `font-serif` for prose
- `text-xs` for density
- `tabular-nums` for alignment
- Zinc palette (900→100 light, 100→900 dark)
- No borders, no boxes - just spacing
- Green/red for YES/NO
- 300ms transitions on theme change

**Consistency with PredictionCard**:

- Same grid layout
- Same spacing (py-4, gap-x-8, gap-y-4)
- Same header pattern (badge + serif title)
- Same metadata (mono xs zinc-500)
- Same tables (border-collapse, pb-2 headers)

## Future Additions

### Election Model Integration

When you build the model:

1. Model outputs JSON → `content/predictions/elections/2026/`
2. Site auto-detects and displays
3. Links to related Kalshi positions
4. Post-election: auto-compares model vs result

### Advanced Linking

- Tag-based clustering (all AI predictions together)
- Cross-reference network graph
- Time-series view of confidence updates
- Calibration curves over time

### Performance Tracking

- Brier scores across all predictions
- You vs market accuracy
- Win rate by category
- P&L tracking

## The Promise

This system is built to last **decades**:

- Markdown files (human-readable forever)
- Git history (timestamp proof)
- Cryptographic signatures (tamper-proof)
- API-first (easy to migrate display layer)
- No database (just files)
- No build step (for predictions)

In 2035, you can look back and see:

- Exactly what you predicted in 2025
- Exactly when you placed Kalshi bets
- Exactly what your thinking was
- Exactly how you did

**No revisionism. No cherry-picking. Just truth.**

---

_"The best accountability system is one you can't escape from."_
