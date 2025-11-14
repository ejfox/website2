import { Configuration, PortfolioApi, MarketsApi, EventsApi } from 'kalshi-typescript'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

// In-memory cache
let cache: {
  data: any
  timestamp: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Calculate P&L for positions
function calculatePortfolioPnL(positions: any[], fills: any[], marketDetails: any) {
  const portfolioStats = {
    totalUnrealizedPnL: 0,
    totalRealizedPnL: 0,
    totalInvested: 0,
    totalValue: 0,
    openPositions: [] as any[],
    closedPositions: [] as any[]
  }

  // Group fills by ticker
  const fillsByTicker = fills.reduce((acc: any, fill: any) => {
    if (!acc[fill.ticker]) acc[fill.ticker] = []
    acc[fill.ticker].push(fill)
    return acc
  }, {})

  // Process open positions
  positions.forEach((pos: any) => {
    const posFills = fillsByTicker[pos.ticker] || []
    const market = marketDetails[pos.ticker]

    // Calculate average entry price from fills
    let totalCost = 0
    let totalQuantity = 0

    posFills.forEach((fill: any) => {
      const qty = fill.count
      const price = fill.price
      totalCost += qty * price
      totalQuantity += qty
    })

    const avgEntryPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const currentQuantity = Math.abs(pos.position)
    const isYesPosition = pos.position > 0

    // Get current market price - try last_price, then yes_bid, then no_bid
    let currentPrice = market?.last_price
    if (!currentPrice) {
      currentPrice = isYesPosition ? market?.yes_bid : market?.no_bid
    }
    if (!currentPrice) {
      currentPrice = avgEntryPrice // Fallback to entry price if no market data
    }

    // Calculate P&L differently for YES vs NO positions
    // YES position: bought contracts, profit if price goes up
    // NO position: sold contracts, profit if price goes down
    let unrealizedPnL, currentValue, costBasis

    if (isYesPosition) {
      // YES position: paid avgEntryPrice, current value is currentPrice
      costBasis = currentQuantity * avgEntryPrice
      currentValue = currentQuantity * currentPrice
      unrealizedPnL = currentValue - costBasis
    } else {
      // NO position: received avgEntryPrice when sold, would pay currentPrice to close
      costBasis = currentQuantity * avgEntryPrice
      currentValue = currentQuantity * currentPrice
      unrealizedPnL = costBasis - currentValue // Profit if current < entry (cheaper to buy back)
    }

    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

    portfolioStats.totalInvested += costBasis
    portfolioStats.totalValue += isYesPosition ? currentValue : costBasis - unrealizedPnL
    portfolioStats.totalUnrealizedPnL += unrealizedPnL

    portfolioStats.openPositions.push({
      ticker: pos.ticker,
      position: pos.position,
      side: isYesPosition ? 'YES' : 'NO',
      avgEntryPrice,
      currentPrice,
      currentValue: isYesPosition ? currentValue : costBasis - unrealizedPnL,
      costBasis,
      unrealizedPnL,
      unrealizedPnLPercent,
      fillCount: posFills.length
    })
  })

  // Process closed positions (fills with no current position)
  Object.keys(fillsByTicker).forEach(ticker => {
    const hasOpenPosition = positions.find((p: any) => p.ticker === ticker)
    if (!hasOpenPosition) {
      const tickerFills = fillsByTicker[ticker]

      // Calculate realized P&L from fills
      let buyValue = 0
      let sellValue = 0
      let buyQty = 0
      let sellQty = 0

      tickerFills.forEach((fill: any) => {
        const value = fill.count * fill.price
        if (fill.side === 'yes') {
          buyValue += value
          buyQty += fill.count
        } else {
          sellValue += value
          sellQty += fill.count
        }
      })

      const realizedPnL = sellValue - buyValue
      const totalQty = Math.max(buyQty, sellQty)

      if (totalQty > 0) {
        portfolioStats.totalRealizedPnL += realizedPnL
        portfolioStats.closedPositions.push({
          ticker,
          totalQuantity: totalQty,
          buyValue,
          sellValue,
          realizedPnL,
          realizedPnLPercent: buyValue > 0 ? (realizedPnL / buyValue) * 100 : 0,
          fillCount: tickerFills.length
        })
      }
    }
  })

  return portfolioStats
}

// Load commentary from markdown files
async function loadCommentaries() {
  try {
    const contentDir = join(process.cwd(), 'content/kalshi')
    const files = await readdir(contentDir).catch(() => [])
    const mdFiles = files.filter(f => f.endsWith('.md'))

    const commentaries = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await readFile(join(contentDir, file), 'utf-8')
        const { data, content: body } = matter(content)
        return {
          ticker: data.ticker,
          marketTitle: data.market_title,
          position: data.position,
          side: data.side,
          theme: data.theme,
          tags: data.tags || [],
          relatedPosts: data.related_posts || [],
          opened: data.opened,
          thesis: data.thesis,
          commentary: body.trim()
        }
      })
    )

    return Object.fromEntries(commentaries.map(c => [c.ticker, c]))
  } catch (error) {
    console.error('Failed to load Kalshi commentaries:', error)
    return {}
  }
}

export default defineEventHandler(async (event) => {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data
  }

  const config = useRuntimeConfig()

  try {
    // Configure Kalshi SDK
    const kalshiConfig = new Configuration({
      apiKey: config.KALSHI_KEY_ID,
      privateKeyPem: config.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
      basePath: 'https://api.elections.kalshi.com/trade-api/v2'
    })

    const portfolioApi = new PortfolioApi(kalshiConfig)
    const marketsApi = new MarketsApi(kalshiConfig)
    const eventsApi = new EventsApi(kalshiConfig)

    // Fetch all portfolio data
    const [balanceRes, positionsRes, fillsRes, ordersRes] = await Promise.all([
      portfolioApi.getBalance(),
      portfolioApi.getPositions({ limit: 100 }),
      portfolioApi.getFills({ limit: 100 }),
      portfolioApi.getOrders({ limit: 100 })
    ])

    const balance = balanceRes.data
    const positionsData = positionsRes.data
    const fills = fillsRes.data
    const orders = ordersRes.data

    // Extract market positions from response
    const positions = positionsData.market_positions || []

    // Get market details for positions and recent fills
    const tickers = new Set([
      ...positions.map((p: any) => p.ticker) || [],
      ...fills.fills?.slice(0, 20).map((f: any) => f.ticker) || []
    ])

    const marketDetails: any = {}
    for (const ticker of tickers) {
      try {
        // Try fetching market data first (for active markets)
        const marketRes = await marketsApi.getMarket({ ticker: ticker as string })
        marketDetails[ticker as string] = {
          title: marketRes.data.title,
          subtitle: marketRes.data.subtitle,
          event_ticker: marketRes.data.event_ticker,
          last_price: marketRes.data.last_price,
          yes_bid: marketRes.data.yes_bid,
          no_bid: marketRes.data.no_bid
        }
      } catch (marketError) {
        // Market fetch failed (likely resolved/closed)
        // Try fetching parent event instead
        try {
          // Derive event ticker from market ticker
          // Example: "KXOTEEPSTEIN-26-MLAW" → "KXOTEEPSTEIN-26"
          const parts = (ticker as string).split('-')
          const eventTicker = parts.length >= 2 ? parts.slice(0, 2).join('-') : ticker

          const eventRes = await eventsApi.getEvent({ event_ticker: eventTicker })
          marketDetails[ticker as string] = {
            title: eventRes.data.title,
            subtitle: eventRes.data.sub_title || '',
            event_ticker: eventTicker,
            last_price: null,
            yes_bid: null,
            no_bid: null
          }
        } catch (eventError) {
          // Both market and event fetch failed - silently skip
          // Commentary or ticker will be used as fallback
        }
      }
    }

    // Load commentary from markdown files
    const commentaries = await loadCommentaries()

    // Calculate portfolio P&L
    const portfolioStats = calculatePortfolioPnL(
      positions,
      fills.fills || [],
      marketDetails
    )

    const data = {
      balance,
      positions,
      fills: fills.fills || [],
      orders: orders.orders || [],
      marketDetails,
      commentaries,
      portfolioStats,
      lastUpdated: new Date().toISOString()
    }

    // Update cache
    cache = {
      data,
      timestamp: Date.now()
    }

    return data
  } catch (error: any) {
    console.error('Kalshi API error:', error)
    throw createError({
      statusCode: 500,
      message: `Failed to fetch Kalshi data: ${error.message}`
    })
  }
})
