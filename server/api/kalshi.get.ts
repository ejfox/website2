import { Configuration, PortfolioApi, EventsApi } from 'kalshi-typescript'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
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
  eventPositions: any[] // Event-level position aggregation from API
  fills: KalshiFill[]
  orders: KalshiOrder[]
}> | null = null

const eventsCache: Map<string, CacheLayer<KalshiEvent>> = new Map()
let commentariesCache: CacheLayer<Record<string, KalshiCommentary>> | null =
  null

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
  const fillsByTicker = fills.reduce<Record<string, KalshiFill[]>>(
    (acc, fill) => {
      if (!acc[fill.ticker]) acc[fill.ticker] = []
      acc[fill.ticker].push(fill)
      return acc
    },
    {}
  )

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

    const unrealizedPnLPercent =
      costBasis > 0 ? (unrealizedPnL / costBasis) * 100 : 0

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
    const hasOpenPosition = positions.some((p) => p.ticker === ticker)
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
  if (
    commentariesCache &&
    Date.now() - commentariesCache.timestamp < COMMENTARIES_CACHE_DURATION
  ) {
    return commentariesCache.data
  }

  try {
    const contentDir = join(process.cwd(), 'content/kalshi')
    const files = await readdir(contentDir).catch(() => [])
    const mdFiles = files.filter((f) => f.endsWith('.md'))

    const results = await Promise.allSettled(
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

    // Filter to fulfilled commentaries only
    const commentaries = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)

    const result = Object.fromEntries(commentaries.map((c) => [c.ticker, c]))

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

  console.log(
    `[Kalshi] Fetching ${needsFetch.length}/${eventTickers.length} events from API`
  )

  // Fetch missing events in parallel
  const eventResults = await Promise.allSettled(
    needsFetch.map(async (eventTicker) => {
      const eventRes = await eventsApi.getEvent({ event_ticker: eventTicker })
      return { eventTicker, data: eventRes.data as KalshiEvent }
    })
  )

  // Process results and update cache
  let resolved404Count = 0
  for (const fetchResult of eventResults) {
    if (fetchResult.status === 'fulfilled') {
      const { eventTicker, data } = fetchResult.value
      eventsCache.set(eventTicker, { data, timestamp: now })
      result.set(eventTicker, data)
    } else {
      const error = fetchResult.reason
      // 404s are EXPECTED for resolved markets - Kalshi removes historical data
      if (error?.response?.status === 404) {
        resolved404Count++
      } else {
        console.error(`[Kalshi] Event fetch error:`, error?.message)
      }
    }
  }

  if (resolved404Count > 0) {
    const msg = `${resolved404Count}/${needsFetch.length} events`
    console.log(`[Kalshi] ${msg} returned 404 (resolved/removed)`)
    console.log(
      `[Kalshi] Falling back to commentary files for titles.`,
      `Run: node scripts/generate-commentary-templates.mjs`
    )
  }

  return result
}

/**
 * Enrich market data with event metadata and commentary
 *
 * REALITY CHECK: Most user positions are in RESOLVED markets.
 * Kalshi API returns 404 for resolved markets/events (data is removed).
 * We MUST rely on user commentary files for titles.
 */
function enrichMarketData(
  ticker: string,
  eventTicker: string,
  event: KalshiEvent | undefined,
  commentary: KalshiCommentary | undefined
): EnrichedMarketData {
  // Title priority: commentary (ONLY reliable source for resolved markets) > event > ticker
  const title = commentary?.marketTitle || event?.title || ticker
  const subtitle = event?.sub_title || commentary?.thesis || ''

  return {
    ticker,
    event_ticker: eventTicker,
    title,
    subtitle,
    category: event?.category || commentary?.theme || 'Unknown',
    series_ticker: event?.series_ticker || '',
    status: event
      ? event?.mutually_exclusive
        ? 'active'
        : 'settled'
      : 'settled',
    market_type: 'binary',
    last_price: null,
    yes_bid: null,
    no_bid: null,
    yes_ask: null,
    no_ask: null
  }
}

export default defineEventHandler(
  async (_event): Promise<KalshiApiResponse> => {
    const now = Date.now()

    // Check portfolio cache
    const portfolioCacheValid =
      portfolioCache &&
      now - portfolioCache.timestamp < PORTFOLIO_CACHE_DURATION

    if (portfolioCacheValid) {
      console.log('[Kalshi] Serving from cache')

      // Still need to recalculate derived data with fresh commentary
      const commentaries = await loadCommentaries()
      const { balance, positions, eventPositions, fills, orders } =
        portfolioCache.data

      // Build market_ticker → event_ticker map from cached event positions
      const tickerToEvent = new Map<string, string>()

      for (const marketPos of positions) {
        const eventPos = eventPositions.find((ep: any) =>
          marketPos.ticker.startsWith(ep.event_ticker)
        )
        if (eventPos) {
          tickerToEvent.set(marketPos.ticker, eventPos.event_ticker)
        } else {
          tickerToEvent.set(
            marketPos.ticker,
            deriveEventTicker(marketPos.ticker)
          )
        }
      }

      // Handle fills
      for (const fill of fills.slice(0, 20)) {
        if (!tickerToEvent.has(fill.ticker)) {
          let found = false
          for (const [_, eventTicker] of tickerToEvent.entries()) {
            if (fill.ticker.startsWith(eventTicker)) {
              tickerToEvent.set(fill.ticker, eventTicker)
              found = true
              break
            }
          }
          if (!found) {
            tickerToEvent.set(fill.ticker, deriveEventTicker(fill.ticker))
          }
        }
      }

      const uniqueEvents = new Set(tickerToEvent.values())

      const config = useRuntimeConfig()
      const kalshiConfig = new Configuration({
        apiKey: config.KALSHI_KEY_ID,
        privateKeyPem: config.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
        basePath: 'https://api.elections.kalshi.com/trade-api/v2'
      })
      const eventsApi = new EventsApi(kalshiConfig)

      const eventDataMap = await fetchEvents(
        Array.from(uniqueEvents),
        eventsApi
      )

      // Enrich market data
      const marketDetails: Record<string, EnrichedMarketData> = {}
      const tickers = Array.from(tickerToEvent.keys())
      for (const ticker of tickers) {
        const eventTicker = tickerToEvent.get(ticker) ?? deriveEventTicker(ticker)
        const event = eventDataMap.get(eventTicker)
        const commentary = commentaries[ticker]
        marketDetails[ticker] = enrichMarketData(
          ticker,
          eventTicker,
          event,
          commentary
        )
      }

      const portfolioStats = calculatePortfolioPnL(
        positions,
        fills,
        marketDetails
      )

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
          eventsCacheAge: Math.min(
            ...Array.from(eventsCache.values()).map((c) => now - c.timestamp)
          ),
          nextRefresh: new Date(
            portfolioCache.timestamp + PORTFOLIO_CACHE_DURATION
          ).toISOString()
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
      const [balanceRes, positionsRes, fillsRes, ordersRes] = await Promise.all(
        [
          portfolioApi.getBalance(),
          portfolioApi.getPositions({ limit: 100 }),
          portfolioApi.getFills({ limit: 100 }),
          portfolioApi.getOrders({ limit: 100 })
        ]
      )

      const balance = balanceRes.data as KalshiBalance
      const positions = (positionsRes.data.market_positions ||
        []) as KalshiPosition[]
      const eventPositions = positionsRes.data.event_positions || []
      const fills = (fillsRes.data.fills || []) as KalshiFill[]
      const orders = (ordersRes.data.orders || []) as KalshiOrder[]

      // Update portfolio cache
      portfolioCache = {
        data: { balance, positions, eventPositions, fills, orders },
        timestamp: now
      }

      // Build market_ticker → event_ticker map from API data (NOT derivation!)
      // The positions API gives us event_positions with actual event_ticker values
      const tickerToEvent = new Map<string, string>()

      // Match market positions to event positions
      for (const marketPos of positions) {
        // Find corresponding event position
        // Event positions are aggregated, so we need to match by ticker pattern
        const eventPos = eventPositions.find((ep: any) =>
          marketPos.ticker.startsWith(ep.event_ticker)
        )

        if (eventPos) {
          tickerToEvent.set(marketPos.ticker, eventPos.event_ticker)
        } else {
          // Fallback to derivation for fills (which don't have event_positions)
          const eventTicker = deriveEventTicker(marketPos.ticker)
          tickerToEvent.set(marketPos.ticker, eventTicker)
        }
      }

      // Handle fills (use event mapping if exists, otherwise derive)
      for (const fill of fills.slice(0, 20)) {
        if (!tickerToEvent.has(fill.ticker)) {
          // Try to find event from existing mappings
          let found = false
          for (const [_marketTicker, eventTicker] of tickerToEvent.entries()) {
            if (fill.ticker.startsWith(eventTicker)) {
              tickerToEvent.set(fill.ticker, eventTicker)
              found = true
              break
            }
          }
          if (!found) {
            const eventTicker = deriveEventTicker(fill.ticker)
            tickerToEvent.set(fill.ticker, eventTicker)
          }
        }
      }

      const uniqueEvents = new Set(tickerToEvent.values())

      // Fetch events with smart caching
      const eventDataMap = await fetchEvents(
        Array.from(uniqueEvents),
        eventsApi
      )

      // Load commentaries
      const commentaries = await loadCommentaries()

      // Enrich market data
      const marketDetails: Record<string, EnrichedMarketData> = {}
      const tickers = Array.from(tickerToEvent.keys())
      for (const ticker of tickers) {
        const eventTicker = tickerToEvent.get(ticker) ?? deriveEventTicker(ticker)
        const event = eventDataMap.get(eventTicker)
        const commentary = commentaries[ticker]
        marketDetails[ticker] = enrichMarketData(
          ticker,
          eventTicker,
          event,
          commentary
        )
      }

      // Calculate portfolio stats
      const portfolioStats = calculatePortfolioPnL(
        positions,
        fills,
        marketDetails
      )

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
          eventsCacheAge:
            eventsCache.size > 0
              ? Math.min(
                  ...Array.from(eventsCache.values()).map(
                    (c) => now - c.timestamp
                  )
                )
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
  }
)
