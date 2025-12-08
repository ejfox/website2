/* eslint-disable no-console */
import { Configuration, EventsApi, MarketsApi } from 'kalshi-typescript'
import { config } from 'dotenv'

config()

const kalshiConfig = new Configuration({
  apiKey: process.env.KALSHI_KEY_ID,
  privateKeyPem: process.env.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
  basePath: 'https://api.elections.kalshi.com/trade-api/v2',
})

const eventsApi = new EventsApi(kalshiConfig)
const marketsApi = new MarketsApi(kalshiConfig)

// User's actual positions
const positions = [
  'KXOTEEPSTEIN-26-MLAW',
  'KXCALLIMPEACHRCONGRESS-26',
  'KXIMPEACH-27-JAN01',
  'AILEGISLATION-25-DEC31',
  'KXCODINGMODEL-26JAN-ANTH',
  'KXAIAUTHOR-25',
  'NYTOAI-27DEC31',
  'KXJOINSTEPHENCOLBERT-26JAN-APP',
  'OAIAGI-29',
]

console.log('Fetching market and event data for user positions...\n')

for (const ticker of positions) {
  console.log(`\n=== ${ticker} ===`)

  // Try fetching market first
  try {
    const marketRes = await marketsApi.getMarket({ ticker })
    console.log('MARKET DATA:')
    console.log(JSON.stringify(marketRes.data, null, 2))
  } catch (e) {
    console.log(`Market fetch failed (likely resolved): ${e.message}`)
  }

  // Try fetching parent event
  const parts = ticker.split('-')
  const eventTicker = parts.length >= 2 ? parts.slice(0, 2).join('-') : ticker

  try {
    const eventRes = await eventsApi.getEvent({ event_ticker: eventTicker })
    console.log('\nEVENT DATA:')
    console.log(JSON.stringify(eventRes.data, null, 2))
  } catch (e) {
    console.log(`\nEvent fetch failed: ${e.message}`)
  }
}
