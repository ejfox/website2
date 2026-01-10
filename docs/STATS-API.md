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
  "githubContributions": 1250,
  "githubRepos": 42,
  "githubFollowers": 156,
  "chessRapid": 1450,
  "chessBlitz": 1380,
  "chessBullet": 1220,
  "chessPuzzles": 1650,
  "chessGamesTotal": 523,
  "blogPostsThisMonth": 3,
  "blogPostsTotal": 43,
  "blogWordsThisMonth": 4200,
  "musicTotalScrobbles": 52341,
  "musicTopArtist": "Radiohead",
  "rescueTimeWeekHours": 42.5,
  "rescueTimeWeekProductivePercent": 68.3,
  "gearTotalItems": 70,
  "gearTotalWeightOz": 1178,
  "websitePageviewsMonth": 3450,
  "websiteVisitorsMonth": 1250,
  "letterboxdThisYear": 42,
  "letterboxdTotal": 156,
  "letterboxdAvgRating": 3.8,
  "discogsTotal": 234,
  "discogsValue": 4567.89
}
```

## Field Reference

### GitHub Metrics
- `githubContributions` - Total contributions (all time)
- `githubRepos` - Total public repositories
- `githubFollowers` - Current follower count

### Chess.com Metrics
- `chessRapid` - Current rapid rating
- `chessBlitz` - Current blitz rating
- `chessBullet` - Current bullet rating
- `chessPuzzles` - Current puzzle rating
- `chessGamesTotal` - Total games played

### Blog Metrics
- `blogPostsThisMonth` - Posts published this month
- `blogPostsTotal` - Total published posts
- `blogWordsThisMonth` - Words written this month

### Music (Last.fm) Metrics
- `musicTotalScrobbles` - Total scrobbles all-time
- `musicTopArtist` - Most played artist name

### Time Tracking (RescueTime) Metrics
- `rescueTimeWeekHours` - Total hours tracked this week
- `rescueTimeWeekProductivePercent` - Productive time percentage

### Gear Metrics
- `gearTotalItems` - Total items in gear inventory
- `gearTotalWeightOz` - Total weight in ounces

### Website Analytics (Umami) Metrics
- `websitePageviewsMonth` - Pageviews this month
- `websiteVisitorsMonth` - Unique visitors this month

### Movies (Letterboxd) Metrics
- `letterboxdThisYear` - Films watched this year
- `letterboxdTotal` - Total films logged
- `letterboxdAvgRating` - Average rating (out of 5)

### Vinyl Collection (Discogs) Metrics
- `discogsTotal` - Total records in collection
- `discogsValue` - Total collection value (USD)

## iOS Shortcuts Usage

The lite endpoint is designed for easy use in iOS Shortcuts:

1. Add a "Get Contents of URL" action
2. Set URL to: `https://ejfox.com/api/stats-lite`
3. Use "Get Dictionary Value" to extract specific metrics
4. Format and display as needed

**Example Shortcut:**
```
Get Contents of URL: https://ejfox.com/api/stats-lite
Get Dictionary Value "chessRapid" from Contents of URL
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
