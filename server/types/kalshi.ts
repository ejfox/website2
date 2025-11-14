// Kalshi API type definitions - matching official API schema

export interface KalshiBalance {
  balance: number
  payout: number
}

export interface KalshiPosition {
  ticker: string
  position: number
  market_exposure: number
  market_exposure_dollars: string
  fees_paid: number
  fees_paid_dollars: string
  realized_pnl: number
  realized_pnl_dollars: string
  total_traded: number
  total_traded_dollars: string
  last_updated_ts: string
}

export interface KalshiFill {
  ticker: string
  fill_id: string
  order_id: string
  trade_id: string
  side: 'yes' | 'no'
  action: 'buy' | 'sell'
  count: number
  price: number
  yes_price: number
  no_price: number
  yes_price_fixed: string
  no_price_fixed: string
  created_time: string
  is_taker: boolean
}

export interface KalshiOrder {
  order_id: string
  ticker: string
  status: string
  side: 'yes' | 'no'
  action: 'buy' | 'sell'
  type: string
  count: number
  remaining_count: number
  yes_price?: number
  no_price?: number
  created_time: string
  expiration_time?: string
}

export interface KalshiEvent {
  event_ticker: string
  series_ticker: string
  title: string
  sub_title: string
  category: string
  mutually_exclusive: boolean
  strike_period?: string
  collateral_return_type?: string
  available_on_brokers: boolean
}

export interface KalshiMarket {
  ticker: string
  event_ticker: string
  market_type: string
  title: string
  subtitle?: string
  open_time: string
  close_time: string
  expiration_time: string
  expected_expiration_time?: string
  latest_expiration_time?: string
  settlement_timer_seconds?: number
  expiration_value?: string
  category?: string
  status: 'active' | 'closed' | 'settled' | 'finalized'
  can_close_early: boolean
  strike_type?: string

  // Pricing
  last_price?: number
  last_price_dollars?: string
  previous_price?: number
  yes_bid?: number
  yes_ask?: number
  no_bid?: number
  no_ask?: number

  // Liquidity & Volume
  liquidity?: number
  liquidity_dollars?: string
  volume?: number
  volume_24h?: number
  open_interest?: number

  // Titles for YES/NO sides
  yes_sub_title?: string
  no_sub_title?: string
}

export interface KalshiCommentary {
  ticker: string
  marketTitle: string
  position: number
  side: 'YES' | 'NO'
  theme?: string
  tags: string[]
  relatedPosts: string[]
  opened: string
  thesis: string
  commentary: string
}

export interface PortfolioStats {
  totalUnrealizedPnL: number
  totalRealizedPnL: number
  totalInvested: number
  totalValue: number
  openPositions: Array<{
    ticker: string
    position: number
    side: 'YES' | 'NO'
    avgEntryPrice: number
    currentPrice: number
    currentValue: number
    costBasis: number
    unrealizedPnL: number
    unrealizedPnLPercent: number
    fillCount: number
  }>
  closedPositions: Array<{
    ticker: string
    totalQuantity: number
    buyValue: number
    sellValue: number
    realizedPnL: number
    realizedPnLPercent: number
    fillCount: number
  }>
}

export interface EnrichedMarketData {
  // Core identification
  ticker: string
  event_ticker: string

  // Titles (prioritized: commentary > market > event)
  title: string
  subtitle: string

  // Event metadata
  category: string
  series_ticker: string

  // Market status
  status: string
  market_type: string

  // Timing
  open_time?: string
  close_time?: string
  expiration_time?: string

  // Pricing (null for resolved markets)
  last_price: number | null
  yes_bid: number | null
  no_bid: number | null
  yes_ask: number | null
  no_ask: number | null

  // Volume
  volume?: number
  open_interest?: number
}

export interface KalshiApiResponse {
  balance: KalshiBalance
  positions: KalshiPosition[]
  fills: KalshiFill[]
  orders: KalshiOrder[]
  marketDetails: Record<string, EnrichedMarketData>
  commentaries: Record<string, KalshiCommentary>
  portfolioStats: PortfolioStats
  lastUpdated: string
  cacheMetadata: {
    positionsCacheAge: number
    eventsCacheAge: number
    nextRefresh: string
  }
}
