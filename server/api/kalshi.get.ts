import { Configuration, PortfolioApi, MarketsApi, EventsApi } from 'kalshi-typescript'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'
import type {
  KalshiBalance,
  KalshiPosition,
  KalshiFill,
  KalshiOrder,
  KalshiEvent,
  KalshiCommentary,
  PortfolioStats,
  EnrichedMarketData,
  KalshiApiResponse
} from '../types/kalshi'

// Multi-layer caching system
interface CacheLayer<T> {
  data: T
  timestamp: number
}

let portfolioCache: CacheLayer<{
  balance: KalshiBalance
  positions: KalshiPosition[]
  fills: KalshiFill[]
  orders: KalshiOrder[]
}> | null = null

let eventsCache: Map<string, CacheLayer<KalshiEvent>> = new Map()
let commentariesCache: CacheLayer<Record<string, KalshiCommentary>> | null = null

// Cache durations (in milliseconds)
const PORTFOLIO_CACHE_DURATION = 2 * 60 * 1000 // 2 minutes - positions change frequently
const EVENTS_CACHE_DURATION = 60 * 60 * 1000 // 1 hour - events rarely change
const COMMENTARIES_CACHE_DURATION = 10 * 60 * 1000 // 10 minutes - user-managed content

/**
 * Derives event ticker from market ticker
 * Example: "KXOTEEPSTEIN-26-MLAW" → "KXOTEEPSTEIN-26"
 */
function deriveEventTicker(marketTicker: string): string {
  const parts = marketTicker.split('-')
  return parts.length >= 2 ? parts.slice(0, 2).join('-') : marketTicker
}

/**
 * Calculate portfolio P&L with proper YES/NO position handling
 */
function calculatePortfolioPnL(
  positions: KalshiPosition[],
  fills: KalshiFill[],
  marketDetails: Record<string, EnrichedMarketData>
): PortfolioStats {
  const stats: PortfolioStats = {
    totalUnrealizedPnL: 0,
    totalRealizedPnL: 0,
    totalInvested: 0,
    totalValue: 0,
    openPositions: [],
    closedPositions: []
  }

  // Group fills by ticker for analysis
  const fillsByTicker = fills.reduce<Record<string, KalshiFill[]>>((acc, fill) => {
    if (!acc[fill.ticker]) acc[fill.ticker] = []
    acc[fill.ticker].push(fill)
    return acc
  }, {})

  // Process open positions
  for (const pos of positions) {
    const posFills = fillsByTicker[pos.ticker] || []
    const market = marketDetails[pos.ticker]

    // Calculate average entry price from fills
    let totalCost = 0
    let totalQuantity = 0

    for (const fill of posFills) {
      totalCost += fill.count * fill.price
      totalQuantity += fill.count
    }

    const avgEntryPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0
    const currentQuantity = Math.abs(pos.position)
    const isYesPosition = pos.position > 0

    // Get current market price with fallback chain
    let currentPrice = market?.last_price
    if (!currentPrice) {
      currentPrice = isYesPosition ? market?.yes_bid : market?.no_bid
    }
    if (!currentPrice) {
      currentPrice = avgEntryPrice // Fallback to entry price
    }

    // Calculate P&L (YES = long, NO = short)
    const costBasis = currentQuantity * avgEntryPrice
    const currentValue = currentQuantity * currentPrice
    const unrealizedPnL = isYesPosition
      ? currentValue - costBasis // YES: profit if price rises
      : costBasis - currentValue // NO: profit if price falls

    const unrealizedPnLPercent = costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

    stats.totalInvested += costBasis
    stats.totalValue += isYesPosition ? currentValue : costBasis - unrealizedPnL
    stats.totalUnrealizedPnL += unrealizedPnL

    stats.openPositions.push({
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
  }

  // Process closed positions
  for (const [ticker, tickerFills] of Object.entries(fillsByTicker)) {
    const hasOpenPosition = positions.some(p => p.ticker === ticker)
    if (hasOpenPosition) continue

    let buyValue = 0
    let sellValue = 0
    let buyQty = 0
    let sellQty = 0

    for (const fill of tickerFills) {
      const value = fill.count * fill.price
      if (fill.action === 'buy') {
        buyValue += value
        buyQty += fill.count
      } else {
        sellValue += value
        sellQty += fill.count
      }
    }

    const realizedPnL = sellValue - buyValue
    const totalQty = Math.max(buyQty, sellQty)

    if (totalQty > 0) {
      stats.totalRealizedPnL += realizedPnL
      stats.closedPositions.push({
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

  return stats
}

/**
 * Load user commentary from markdown files
 */
async function loadCommentaries(): Promise<Record<string, KalshiCommentary>> {
  // Check commentary cache
  if (commentariesCache && Date.now() - commentariesCache.timestamp < COMMENTARIES_CACHE_DURATION) {
    return commentariesCache.data
  }

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
        } as KalshiCommentary
      })
    )

    const result = Object.fromEntries(commentaries.map(c => [c.ticker, c]))

    // Update cache
    commentariesCache = {
      data: result,
      timestamp: Date.now()
    }

    return result
  } catch (error) {
    console.error('[Kalshi] Failed to load commentaries:', error)
    return {}
  }
}

/**
 * Fetch event data with smart caching
 */
async function fetchEvents(
  eventTickers: string[],
  eventsApi: EventsApi
): Promise<Map<string, KalshiEvent>> {
  const now = Date.now()
  const result = new Map<string, KalshiEvent>()

  // Separate cached vs. need-to-fetch events
  const needsFetch: string[] = []
  for (const ticker of eventTickers) {
    const cached = eventsCache.get(ticker)
    if (cached && now - cached.timestamp < EVENTS_CACHE_DURATION) {
      result.set(ticker, cached.data)
    } else {
      needsFetch.push(ticker)
    }
  }

  if (needsFetch.length === 0) {
    console.log(`[Kalshi] All ${eventTickers.length} events served from cache`)
    return result
  }

  console.log(`[Kalshi] Fetching ${needsFetch.length}/${eventTickers.length} events from API`)

  // Fetch missing events in parallel
  const eventResults = await Promise.allSettled(
    needsFetch.map(async (eventTicker) => {
      const eventRes = await eventsApi.getEvent({ event_ticker: eventTicker })
      return { eventTicker, data: eventRes.data as KalshiEvent }
    })
  )

  // Process results and update cache
  for (const fetchResult of eventResults) {
    if (fetchResult.status === 'fulfilled') {
      const { eventTicker, data } = fetchResult.value
      eventsCache.set(eventTicker, { data, timestamp: now })
      result.set(eventTicker, data)
    } else {
      console.error(`[Kalshi] Failed to fetch event:`, fetchResult.reason)
    }
  }

  return result
}

/**
 * Enrich market data with event metadata and commentary
 */
function enrichMarketData(
  ticker: string,
  eventTicker: string,
  event: KalshiEvent | undefined,
  commentary: KalshiCommentary | undefined
): EnrichedMarketData {
  // Title priority: commentary > event
  const title = commentary?.marketTitle || event?.title || ticker
  const subtitle = event?.sub_title || ''

  return {
    ticker,
    event_ticker: eventTicker,
    title,
    subtitle,
    category: event?.category || 'Unknown',
    series_ticker: event?.series_ticker || '',
    status: 'settled', // All resolved markets
    market_type: 'binary',
    last_price: null,
    yes_bid: null,
    no_bid: null,
    yes_ask: null,
    no_ask: null
  }
}

export default defineEventHandler(async (event): Promise<KalshiApiResponse> => {
  const now = Date.now()

  // Check portfolio cache
  const portfolioCacheValid = portfolioCache && now - portfolioCache.timestamp < PORTFOLIO_CACHE_DURATION

  if (portfolioCacheValid) {
    console.log('[Kalshi] Serving from cache')

    // Still need to recalculate derived data with fresh commentary
    const commentaries = await loadCommentaries()
    const { balance, positions, fills, orders } = portfolioCache.data

    // Derive event tickers
    const tickers = new Set([
      ...positions.map(p => p.ticker),
      ...fills.slice(0, 20).map(f => f.ticker)
    ])

    const tickerToEvent = new Map<string, string>()
    const uniqueEvents = new Set<string>()

    for (const ticker of tickers) {
      const eventTicker = deriveEventTicker(ticker)
      tickerToEvent.set(ticker, eventTicker)
      uniqueEvents.add(eventTicker)
    }

    const config = useRuntimeConfig()
    const kalshiConfig = new Configuration({
      apiKey: config.KALSHI_KEY_ID,
      privateKeyPem: config.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
      basePath: 'https://api.elections.kalshi.com/trade-api/v2'
    })
    const eventsApi = new EventsApi(kalshiConfig)

    const eventDataMap = await fetchEvents(Array.from(uniqueEvents), eventsApi)

    // Enrich market data
    const marketDetails: Record<string, EnrichedMarketData> = {}
    for (const ticker of tickers) {
      const eventTicker = tickerToEvent.get(ticker)!
      const event = eventDataMap.get(eventTicker)
      const commentary = commentaries[ticker]
      marketDetails[ticker] = enrichMarketData(ticker, eventTicker, event, commentary)
    }

    const portfolioStats = calculatePortfolioPnL(positions, fills, marketDetails)

    return {
      balance,
      positions,
      fills,
      orders,
      marketDetails,
      commentaries,
      portfolioStats,
      lastUpdated: new Date(portfolioCache.timestamp).toISOString(),
      cacheMetadata: {
        positionsCacheAge: now - portfolioCache.timestamp,
        eventsCacheAge: Math.min(...Array.from(eventsCache.values()).map(c => now - c.timestamp)),
        nextRefresh: new Date(portfolioCache.timestamp + PORTFOLIO_CACHE_DURATION).toISOString()
      }
    }
  }

  // Fetch fresh portfolio data
  console.log('[Kalshi] Fetching fresh portfolio data from API')
  const config = useRuntimeConfig()

  try {
    const kalshiConfig = new Configuration({
      apiKey: config.KALSHI_KEY_ID,
      privateKeyPem: config.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
      basePath: 'https://api.elections.kalshi.com/trade-api/v2'
    })

    const portfolioApi = new PortfolioApi(kalshiConfig)
    const eventsApi = new EventsApi(kalshiConfig)

    // Fetch portfolio data in parallel
    const [balanceRes, positionsRes, fillsRes, ordersRes] = await Promise.all([
      portfolioApi.getBalance(),
      portfolioApi.getPositions({ limit: 100 }),
      portfolioApi.getFills({ limit: 100 }),
      portfolioApi.getOrders({ limit: 100 })
    ])

    const balance = balanceRes.data as KalshiBalance
    const positions = (positionsRes.data.market_positions || []) as KalshiPosition[]
    const fills = (fillsRes.data.fills || []) as KalshiFill[]
    const orders = (ordersRes.data.orders || []) as KalshiOrder[]

    // Update portfolio cache
    portfolioCache = {
      data: { balance, positions, fills, orders },
      timestamp: now
    }

    // Derive event tickers
    const tickers = new Set([
      ...positions.map(p => p.ticker),
      ...fills.slice(0, 20).map(f => f.ticker)
    ])

    const tickerToEvent = new Map<string, string>()
    const uniqueEvents = new Set<string>()

    for (const ticker of tickers) {
      const eventTicker = deriveEventTicker(ticker)
      tickerToEvent.set(ticker, eventTicker)
      uniqueEvents.add(eventTicker)
    }

    // Fetch events with smart caching
    const eventDataMap = await fetchEvents(Array.from(uniqueEvents), eventsApi)

    // Load commentaries
    const commentaries = await loadCommentaries()

    // Enrich market data
    const marketDetails: Record<string, EnrichedMarketData> = {}
    for (const ticker of tickers) {
      const eventTicker = tickerToEvent.get(ticker)!
      const event = eventDataMap.get(eventTicker)
      const commentary = commentaries[ticker]
      marketDetails[ticker] = enrichMarketData(ticker, eventTicker, event, commentary)
    }

    // Calculate portfolio stats
    const portfolioStats = calculatePortfolioPnL(positions, fills, marketDetails)

    return {
      balance,
      positions,
      fills,
      orders,
      marketDetails,
      commentaries,
      portfolioStats,
      lastUpdated: new Date().toISOString(),
      cacheMetadata: {
        positionsCacheAge: 0,
        eventsCacheAge: eventsCache.size > 0
          ? Math.min(...Array.from(eventsCache.values()).map(c => now - c.timestamp))
          : 0,
        nextRefresh: new Date(now + PORTFOLIO_CACHE_DURATION).toISOString()
      }
    }
  } catch (error: any) {
    console.error('[Kalshi] API error:', error.message, error.response?.data)
    throw createError({
      statusCode: error.response?.status || 500,
      message: `Kalshi API error: ${error.message}`
    })
  }
})
