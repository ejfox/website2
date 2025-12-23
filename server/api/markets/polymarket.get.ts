/**
 * @file markets/polymarket.get.ts
 * @description Fetches public market data from Polymarket Gamma API with price history from CLOB API
 * @endpoint GET /api/markets/polymarket
 * @params slug: string - Market slug (e.g., "new-york-city-mayoral-election")
 * @returns Market data with current probability, volume, liquidity, resolution status, and daily price history
 */
// Polymarket Gamma API client (simpler, no auth needed)
// Docs: https://docs.polymarket.com/developers/gamma-markets-api

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const slug = query.slug as string // e.g. "new-york-city-mayoral-election"

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Market slug required (e.g. "new-york-city-mayoral-election")',
    })
  }

  try {
    // Gamma API: Get market by slug
    const response = await fetch(
      `https://gamma-api.polymarket.com/events?slug=${slug}`
    )

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`)
    }

    const data = await response.json()
    const event = data[0] // First result

    if (!event) {
      throw new Error(`Market not found: ${slug}`)
    }

    // Get the primary market (usually first one)
    const market = event.markets?.[0]

    if (!market) {
      throw new Error(`No markets found for event: ${slug}`)
    }

    // Get price history from CLOB API using condition_id
    let priceHistory = []
    try {
      const historyRes = await fetch(
        `https://clob.polymarket.com/prices-history?market=${market.condition_id}&interval=1d&fidelity=1`
      )
      if (historyRes.ok) {
        const historyData = await historyRes.json()
        priceHistory = historyData.history || []
      }
    } catch (e) {
      console.warn('Failed to fetch price history:', e)
    }

    return {
      provider: 'polymarket',
      marketId: slug,
      conditionId: market.condition_id,
      question: market.question || event.title,
      currentProb: Number.parseFloat(market.outcomePrices?.[0] || 0) * 100,
      volume: Number.parseFloat(event.volume || 0),
      liquidity: Number.parseFloat(market.liquidity || 0),
      resolved: event.closed || market.closed || false,
      outcome: market.outcome,
      endDate: event.end_date || market.end_date,
      url: `https://polymarket.com/event/${slug}`,
      priceHistory: priceHistory.map((p: { t: number; p: string }) => ({
        t: p.t * 1000, // Convert to milliseconds
        p: Number.parseFloat(p.p) * 100, // Convert to percentage
      })),
      lastUpdated: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Polymarket API error:', error)
    const err = error as Error
    throw createError({
      statusCode: 500,
      message: `Failed to fetch Polymarket data: ${err.message}`,
    })
  }
})
