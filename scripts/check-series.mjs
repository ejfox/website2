/**
 * @file check-series.mjs
 * @description Query Kalshi series data for specific market tickers to get detailed event information
 * @usage node scripts/check-series.mjs
 * @env KALSHI_KEY_ID - Kalshi API key ID (required)
 * @env KALSHI_PRIVATE_KEY - Kalshi API private key (required)
 */

/* eslint-disable no-console */
import { Configuration, SeriesApi } from 'kalshi-typescript'
import { config } from 'dotenv'

config()

const kalshiConfig = new Configuration({
  apiKey: process.env.KALSHI_KEY_ID,
  privateKeyPem: process.env.KALSHI_PRIVATE_KEY.replace(/\\n/g, '\n'),
  basePath: 'https://api.elections.kalshi.com/trade-api/v2',
})

const seriesApi = new SeriesApi(kalshiConfig)

// Try fetching series for user's positions
const seriesTickers = [
  'KXOTEEPSTEIN',
  'KXCALLIMPEACHRCONGRESS',
  'KXIMPEACH',
  'AILEGISLATION',
  'KXCODINGMODEL',
  'KXAIAUTHOR',
  'NYTOAI',
  'KXJOINSTEPHENCOLBERT',
  'OAIAGI',
]

console.log('Fetching series data...\n')

for (const ticker of seriesTickers) {
  try {
    const res = await seriesApi.getSeries({ series_ticker: ticker })
    console.log(`\n=== ${ticker} ===`)
    console.log(JSON.stringify(res.data, null, 2))
  } catch (e) {
    console.log(`${ticker}: ${e.message}`)
  }
}
