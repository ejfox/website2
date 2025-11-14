import { Configuration, PortfolioApi, MarketsApi } from 'kalshi-typescript'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import matter from 'gray-matter'

// In-memory cache
let cache: {
  data: any
  timestamp: number
} | null = null

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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

    // Fetch all portfolio data
    const [balanceRes, positionsRes, fillsRes, ordersRes] = await Promise.all([
      portfolioApi.getBalance(),
      portfolioApi.getPositions({ limit: 100 }),
      portfolioApi.getFills({ limit: 100 }),
      portfolioApi.getOrders({ limit: 100 })
    ])

    const balance = balanceRes.data
    const positions = positionsRes.data
    const fills = fillsRes.data
    const orders = ordersRes.data

    // Get market details for positions and recent fills
    const tickers = new Set([
      ...positions.positions?.map((p: any) => p.ticker) || [],
      ...fills.fills?.slice(0, 20).map((f: any) => f.ticker) || []
    ])

    const marketDetails: any = {}
    for (const ticker of tickers) {
      try {
        const marketRes = await marketsApi.getMarket({ ticker: ticker as string })
        marketDetails[ticker as string] = marketRes.data
      } catch (e) {
        console.error(`Failed to fetch market ${ticker}:`, e)
      }
    }

    // Load commentary from markdown files
    const commentaries = await loadCommentaries()

    const data = {
      balance,
      positions: positions.positions || [],
      fills: fills.fills || [],
      orders: orders.orders || [],
      marketDetails,
      commentaries,
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
