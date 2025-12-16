/**
 * @file generate-commentary-templates.mjs
 * @description Generate Markdown templates for Kalshi positions to add commentary and thesis notes
 * @usage yarn kalshi:templates OR node scripts/generate-commentary-templates.mjs
 * @env None required - reads from data/kalshi-positions.json
 */

/* eslint-disable no-console */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

// Read position data
const positions = JSON.parse(
  readFileSync('data/kalshi-positions.json', 'utf-8')
)

console.log('Generating commentary templates for resolved positions...\n')

// Ensure directory exists
mkdirSync('content/kalshi', { recursive: true })

for (const pos of positions.market_positions) {
  const ticker = pos.ticker
  const side = pos.position > 0 ? 'YES' : 'NO'
  const quantity = Math.abs(pos.position)

  // Parse ticker to extract hints
  const parts = ticker.split('-')
  const eventBase = parts[0] // e.g., "KXOTEEPSTEIN", "AILEGISLATION"

  // Generate human-readable suggestions based on ticker patterns
  const suggestions = {
    KXOTEEPSTEIN: 'Epstein-related market',
    KXCALLIMPEACHRCONGRESS: 'Congressional impeachment call',
    KXIMPEACH: 'Impeachment market',
    AILEGISLATION: 'AI legislation',
    KXCODINGMODEL: 'Top coding AI model',
    KXAIAUTHOR: 'AI author/NYT bestseller',
    NYTOAI: 'NYT reference to AI',
    KXJOINSTEPHENCOLBERT: 'Stephen Colbert appearance',
    OAIAGI: 'OpenAI AGI announcement',
  }

  const suggestionKey = Object.keys(suggestions).find((key) =>
    eventBase.includes(key)
  )
  const suggestedTitle = suggestions[suggestionKey] || 'EDIT THIS TITLE'

  const template = `---
ticker: ${ticker}
market_title: "${suggestedTitle}"
position: ${quantity}
side: ${side}
theme: tech-realism
tags: []
related_posts: []
opened: "2025-11-13"
thesis: "EDIT: Why did you take this position?"
---

EDIT: Add your commentary about this market here.

**Market Details:**
- Ticker: \`${ticker}\`
- Position: ${side} ${quantity} contracts
- Exposure: $${pos.market_exposure_dollars}
- Fees: $${pos.fees_paid_dollars}

**Resolution:** This market has resolved. Add notes about the outcome.
`

  const filename = `content/kalshi/${ticker}.md`

  try {
    writeFileSync(filename, template)
    console.log(`✓ Created ${filename}`)
    console.log(`  Suggested title: "${suggestedTitle}"`)
    console.log(`  Position: ${side} ${quantity}`)
    console.log()
  } catch (e) {
    console.error(`✗ Failed to create ${filename}:`, e.message)
  }
}

console.log(
  `\n✅ Generated ${positions.market_positions.length} commentary templates`
)
console.log('\n📝 Next steps:')
console.log('1. Edit each file in content/kalshi/')
console.log('2. Replace "EDIT THIS TITLE" with proper market titles')
console.log('3. Add your thesis and commentary')
console.log('4. Add tags: e.g., #ai, #politics, #tech')
console.log('5. Refresh /predictions page to see titles')
