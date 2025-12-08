#!/usr/bin/env node
/* eslint-disable no-console */
import { writeFileSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import {
  Configuration,
  PortfolioApi,
  EventsApi,
  MarketsApi,
} from 'kalshi-typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env file
const envFile = join(__dirname, '..', '.env')
const envContent = readFileSync(envFile, 'utf-8')
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove surrounding quotes if present
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
})

const KEY_ID = process.env.KALSHI_KEY_ID
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n')

// Configure Kalshi SDK
const config = new Configuration({
  apiKey: KEY_ID,
  privateKeyPem: PRIVATE_KEY,
  basePath: 'https://api.elections.kalshi.com/trade-api/v2',
})

const portfolioApi = new PortfolioApi(config)
const eventsApi = new EventsApi(config)
const marketsApi = new MarketsApi(config)

async function main() {
  try {
    console.log('Testing Kalshi API connection...\n')

    // Get portfolio balance
    console.log('1. Fetching portfolio balance...')
    const balanceResponse = await portfolioApi.getBalance()
    const balance = balanceResponse.data
    writeFileSync('data/kalshi-balance.json', JSON.stringify(balance, null, 2))
    console.log('✓ Saved to data/kalshi-balance.json\n')

    // Get portfolio positions
    console.log('2. Fetching portfolio positions...')
    const positionsResponse = await portfolioApi.getPositions()
    const positions = positionsResponse.data
    writeFileSync(
      'data/kalshi-positions.json',
      JSON.stringify(positions, null, 2)
    )
    console.log('✓ Saved to data/kalshi-positions.json\n')

    // Get events
    console.log('3. Fetching events...')
    const eventsResponse = await eventsApi.getEvents({
      limit: 20,
      status: 'open',
    })
    const events = eventsResponse.data
    writeFileSync('data/kalshi-events.json', JSON.stringify(events, null, 2))
    console.log('✓ Saved to data/kalshi-events.json\n')

    // Get markets
    console.log('4. Fetching markets...')
    const marketsResponse = await marketsApi.getMarkets({
      limit: 20,
      status: 'open',
    })
    const markets = marketsResponse.data
    writeFileSync('data/kalshi-markets.json', JSON.stringify(markets, null, 2))
    console.log('✓ Saved to data/kalshi-markets.json\n')

    // Get fills (trade history)
    console.log('5. Fetching fills (trade history)...')
    const fillsResponse = await portfolioApi.getFills()
    const fills = fillsResponse.data
    writeFileSync('data/kalshi-fills.json', JSON.stringify(fills, null, 2))
    console.log('✓ Saved to data/kalshi-fills.json\n')

    console.log('✅ All data fetched successfully!')
    console.log('\nQuick stats:')
    console.log(`- Balance: $${(balance.balance / 100).toFixed(2)}`)
    console.log(`- Positions: ${positions.positions?.length || 0}`)
    console.log(`- Open events: ${events.events?.length || 0}`)
    console.log(`- Open markets: ${markets.markets?.length || 0}`)
    console.log(`- Recent fills: ${fills.fills?.length || 0}`)
  } catch (error) {
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

main()
