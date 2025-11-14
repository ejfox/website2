# Kalshi Commentary System

Add your thinking to Kalshi positions. Just markdown files → auto-displays on /predictions.

## ⚠️ CRITICAL: Resolved Markets = No API Data

**Kalshi API removes historical data** once markets resolve:

- ✅ **Active markets**: API provides titles, prices automatically
- ❌ **Resolved markets**: API returns 404 (data deleted)
- 📝 **YOU provide titles** via commentary files

**All your current positions are resolved** → You MUST add `market_title` in commentary files.

### Auto-Generate Templates

```bash
node scripts/generate-commentary-templates.mjs
```

Creates starter files with position data. Edit the `market_title` field!

## Quick Add

**New position:**
```bash
# 1. Check your positions
node scripts/kalshi-test.mjs

# 2. Create commentary
vim content/kalshi/TICKER-NAME.md

# 3. Commit
git add content/kalshi/TICKER-NAME.md
git commit -m "Add: TICKER-NAME commentary"
```

**That's it.** Site auto-merges with live Kalshi data.

## File Structure

```yaml
---
ticker: OAIAGI-29                    # Match Kalshi ticker exactly
market_title: "Market question"       # Human-readable title
position: -32                         # Contract count (+ for YES, - for NO)
side: NO                              # YES or NO
theme: tech-realism                   # See worldview-themes.json
tags:                                 # For cross-referencing
  - ai
  - agi
  - skepticism
related_posts: []                     # Link to blog posts (future)
opened: 2025-11-13                    # When you entered
thesis: "One-line worldview statement"
---

Your actual thinking here. This is the commentary that appears on /predictions.

Can be multiple paragraphs. Write freely. This is your intellectual journal.

Link to blog posts, reference other positions, explain your reasoning.
```

## Themes

Defined in `/data/worldview-themes.json`:

- **tech-realism** - AI progress vs hype
- **institutional-decay** - Political structural stress
- **narrative-power** - Media/cultural framing effects
- **cultural-futures** - Long-term civilizational bets

## Workflow

1. Make bet on Kalshi
2. Create markdown file here with ticker name
3. Write your thinking
4. Site auto-merges with live API data
5. `/predictions` shows positions + commentary

When predictions resolve or thinking evolves, just edit the markdown.

## Future Us

When Claude says "let's update predictions again":
1. Check which new tickers you have: `node scripts/kalshi-test.mjs`
2. Create markdown files for new positions
3. Update existing files if thinking changed
4. Commit to git

No build step. No processing. Just markdown → display.
