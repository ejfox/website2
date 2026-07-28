# Stats API Documentation

## Overview

The website provides two stats endpoints for accessing personal metrics from multiple services:

1. **Full Stats** (`/api/stats`) - Comprehensive data with arrays and historical information
2. **Lite Stats** (`/api/stats-lite`) - Minimal, optimized for mobile and iOS Shortcuts

## Endpoints

### `/api/stats` - Full Stats Endpoint

**Size:** ~2.4KB  
**Use Case:** Web dashboard, detailed analytics, historical data

Returns comprehensive statistics including:
- Arrays of recent items (commits, games, tracks, etc.)
- Nested objects with detailed breakdowns
- Historical data and trends
- Complete metadata

**Example Response Structure:**
```json
{
  "github": {
    "stats": { ... },
    "contributions": [...],
    "detail": {
      "commits": [...],
      "commitTypes": [...]
    }
  },
  "chess": {
    "currentRating": { ... },
    "recentGames": [...]
  },
  ...
}
```

### `/api/stats-lite` - Lightweight Stats Endpoint

**Size:** ~345 bytes (86% smaller than full endpoint)  
**Cache:** 5 minutes  
**Use Case:** iOS Shortcuts, widgets, cellular connections

Returns minimal, top-level metrics only:
- Single numbers and strings
- No arrays or nested objects
- Most recent/current values only
- Optimized JSON structure

**Example Response:**
```json
{
  "lastUpdated": "2026-01-10T16:55:18.837Z",
  "cached": true,
  "githubContributionsAllTime": 1250,
  "githubReposTotal": 42,
  "githubFollowersCurrent": 156,
  "chessRatingRapid": 1450,
  "chessRatingBlitz": 1380,
  "chessRatingBullet": 1220,
  "chessRatingPuzzles": 1650,
  "chessGamesAllTime": 523,
  "blogPostsCalMonth": 3,
  "blogPostsAllTime": 43,
  "blogWordsCalMonth": 4200,
  "musicScrobblesAllTime": 52341,
  "musicTopArtistAllTime": "Radiohead",
  "rescueTimeLast7dHours": 42.5,
  "rescueTimeLast7dProductivePct": 68.3,
  "gearItemsTotal": 70,
  "gearWeightTotalOz": 1178,
  "websitePageviewsCalMonth": 3450,
  "websiteVisitorsCalMonth": 1250,
  "letterboxdFilmsCalYear": 42,
  "letterboxdFilmsAllTime": 156,
  "letterboxdRatingAvg": 3.8,
  "discogsRecordsTotal": 234,
  "discogsValueTotalUsd": 4567.89
}
```

## Field Reference

### GitHub Metrics
- `githubContributionsAllTime` - Total contributions (all time)
- `githubReposTotal` - Total public repositories
- `githubFollowersCurrent` - Current follower count

### Chess.com Metrics (ELO Ratings)
- `chessRatingRapid` - Current rapid ELO rating
- `chessRatingBlitz` - Current blitz ELO rating
- `chessRatingBullet` - Current bullet ELO rating
- `chessRatingPuzzles` - Current puzzle ELO rating
- `chessGamesAllTime` - Total games played (all time)

### Blog Metrics
- `blogPostsCalMonth` - Posts published in current calendar month
- `blogPostsAllTime` - Total published posts (all time)
- `blogWordsCalMonth` - Words written in current calendar month

### Music (Last.fm) Metrics
- `musicScrobblesAllTime` - Total scrobbles (all time)
- `musicTopArtistAllTime` - Most played artist name (all time)

### Time Tracking (RescueTime) Metrics
- `rescueTimeLast7dHours` - Total hours tracked in last 7 days
- `rescueTimeLast7dProductivePct` - Productive time percentage in last 7 days

### Gear Metrics
- `gearItemsTotal` - Total items in gear inventory
- `gearWeightTotalOz` - Total weight in ounces

### Website Analytics (Umami) Metrics
- `websitePageviewsCalMonth` - Pageviews in current calendar month
- `websiteVisitorsCalMonth` - Unique visitors in current calendar month

### Movies (Letterboxd) Metrics
- `letterboxdFilmsCalYear` - Films watched in current calendar year
- `letterboxdFilmsAllTime` - Total films logged (all time)
- `letterboxdRatingAvg` - Average rating (0-5 scale)

### Vinyl Collection (Discogs) Metrics
- `discogsRecordsTotal` - Total records in collection
- `discogsValueTotalUsd` - Total collection value in USD

## iOS Shortcuts Usage

The lite endpoint is designed for easy use in iOS Shortcuts:

1. Add a "Get Contents of URL" action
2. Set URL to: `https://ejfox.com/api/stats-lite`
3. Use "Get Dictionary Value" to extract specific metrics
4. Format and display as needed

**Example Shortcut:**
```
Get Contents of URL: https://ejfox.com/api/stats-lite
Get Dictionary Value "chessRatingRapid" from Contents of URL
Set Variable: ChessRating to Dictionary Value
Show Notification: "Current Chess Rating: [ChessRating]"
```

## Caching

Both endpoints implement caching:
- **Full Stats:** No caching (always fresh)
- **Lite Stats:** 5-minute cache (optimal for mobile)

The `cached` field in the lite response indicates if data came from cache.

## Error Handling

Both endpoints use graceful error handling:
- Individual service failures don't break the entire response
- Missing data is omitted from response (undefined fields)
- Always returns valid JSON even if all services fail

## Data Freshness

Data freshness varies by source:
- **GitHub:** Near real-time
- **Chess.com:** Updates after each game
- **Blog:** Immediate after publishing
- **Music:** Scrobbles within minutes
- **RescueTime:** Updated hourly
- **Gear:** Manual updates only
- **Website Analytics:** Real-time
- **Letterboxd:** RSS feed updates (hourly)
- **Discogs:** API updates (daily)

## Development

To test locally:
```bash
# Start dev server
yarn dev

# Test full endpoint
curl http://localhost:3006/api/stats | jq .

# Test lite endpoint
curl http://localhost:3006/api/stats-lite | jq .

# Check size
curl -s http://localhost:3006/api/stats-lite | wc -c
```

## Implementation Notes

- All API credentials stored in `.env` (see `.env.example`)
- Uses `Promise.allSettled` for parallel fetching
- Type-safe with full TypeScript definitions
- Implements `node-cache` for lite endpoint
- Designed for delete-driven development philosophy
