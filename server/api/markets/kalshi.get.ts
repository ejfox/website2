// Kalshi API client
// Docs: https://trading-api.readme.io/reference/getting-started

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const marketId = query.id as string // e.g. "BTCUSD-24DEC-100K"

  if (!marketId) {
    throw createError({
      statusCode: 400,
      message: 'Market ID required'
    })
  }

  try {
    // Kalshi public API endpoint
    const response = await fetch(
      `https://api.elections.kalshi.com/trade-api/v2/markets/${marketId}`
    )

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`)
    }

    const data = await response.json()
    const market = data.market

    // Get market history
    const historyRes = await fetch(
      `https://api.elections.kalshi.com/trade-api/v2/markets/${marketId}/history`
    )

    const historyData = historyRes.ok ? await historyRes.json() : { history: [] }

    return {
      provider: 'kalshi',
      marketId,
      question: market.title,
      currentProb: market.yes_bid * 100, // Kalshi uses 0-1 scale
      volume: market.volume,
      liquidity: market.open_interest,
      resolved: market.status === 'closed',
      outcome: market.result,
      endDate: market.close_time,
      url: `https://kalshi.com/markets/${marketId}`,
      priceHistory: historyData.history?.map((p: any) => ({
        t: p.ts,
        p: p.yes_price * 100
      })) || [],
      lastUpdated: new Date().toISOString()
    }
  } catch (error: any) {
    console.error('Kalshi API error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch Kalshi data: ${error.message}`
    })
  }
})
