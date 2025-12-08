import { Configuration, MarketsApi, EventsApi } from 'kalshi-typescript'
import fs from 'fs'

// Load .env file
const envContent = fs.readFileSync('.env', 'utf-8')
envContent.split('\n').forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
})

const config = new Configuration({
  apiKey: process.env.KALSHI_KEY_ID,
  privateKeyPem: process.env.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
  basePath: 'https://api.elections.kalshi.com/trade-api/v2',
})

const marketsApi = new MarketsApi(config)
const eventsApi = new EventsApi(config)

async function queryMarket(ticker) {
  console.log(`\n========== QUERYING: ${ticker} ==========\n`)
  
  try {
    console.log(`Fetching market data for ${ticker}...`)
    const marketRes = await marketsApi.getMarket({ ticker })
    console.log('✓ Market data found:')
    console.log(JSON.stringify(marketRes.data, null, 2))
  } catch (err) {
    console.log(`✗ Market data error (${err.response?.status}): ${err.message}`)
  }

  // Try to extract event ticker and fetch event
  try {
    const eventTicker = ticker.split('-').slice(0, 2).join('-')
    console.log(`\nTrying event ticker: ${eventTicker}...`)
    const eventRes = await eventsApi.getEvent({ event_ticker: eventTicker })
    console.log('✓ Event data found:')
    console.log(JSON.stringify(eventRes.data, null, 2))
  } catch (err) {
    console.log(`✗ Event data error (${err.response?.status}): ${err.message}`)
  }

  // Try alternate event ticker patterns
  const patterns = [
    ticker.substring(0, ticker.lastIndexOf('-')),
    ticker.split('-')[0],
    ticker.replace(/-\d{2}$/, ''),
  ]
  
  for (const pattern of patterns) {
    if (pattern && pattern !== ticker) {
      try {
        console.log(`\nTrying alternate event: ${pattern}...`)
        const eventRes = await eventsApi.getEvent({ event_ticker: pattern })
        console.log('✓ Event data found:')
        console.log(JSON.stringify(eventRes.data, null, 2))
        break
      } catch (err) {
        // continue
      }
    }
  }
}

async function main() {
  await queryMarket('KXDJTVOSTARIFFS')
  await queryMarket('KXRETIREPELOSI-26')
}

main().catch(console.error)
