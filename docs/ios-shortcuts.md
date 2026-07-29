# iOS Shortcuts Examples for Stats Lite API

## Quick Start

The `/api/stats-lite` endpoint is optimized for iOS Shortcuts with:
- Simple top-level JSON structure
- Single values only (no arrays or nested objects)
- Small response size (~345 bytes)
- 5-minute cache for fast loading

## Example 1: Display Current Chess Rating

```
Get Contents of URL: https://ejfox.com/api/stats-lite
Get Dictionary Value "chessRatingRapid" from Contents of URL
Show Notification:
  Title: "Chess Rating"
  Body: "Current Rapid: [Dictionary Value]"
```

## Example 2: Morning Dashboard Widget

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "chessRatingRapid" from Contents
Set Variable: ChessRating to Dictionary Value

Get Dictionary Value "blogPostsCalMonth" from Contents
Set Variable: BlogPosts to Dictionary Value

Get Dictionary Value "gearWeightTotalOz" from Contents
Set Variable: GearWeight to Dictionary Value

Calculate: [GearWeight] / 16
Set Variable: GearPounds to Calculation

Text:
📊 Daily Dashboard
♟️ Chess: [ChessRating]
✍️ Posts: [BlogPosts] this month
🎒 Gear: [GearPounds] lbs

Show Notification with Text
```

## Example 3: Weekly Stats Summary

```
Get Contents of URL: https://ejfox.com/api/stats-lite

# Get multiple values
Get Dictionary Value "blogPostsCalMonth" from Contents
Set Variable: Posts

Get Dictionary Value "blogWordsCalMonth" from Contents
Set Variable: Words

Get Dictionary Value "musicScrobblesAllTime" from Contents
Set Variable: Scrobbles

Get Dictionary Value "chessGamesAllTime" from Contents
Set Variable: Games

# Format as text
Text:
📈 Weekly Summary
✍️ Blog: [Posts] posts, [Words] words
🎵 Music: [Scrobbles] scrobbles
♟️ Chess: [Games] total games

Share with Text
```

## Example 4: Gear Weight Calculator

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "gearWeightTotalOz" from Contents
Set Variable: WeightOz

# Convert to different units
Calculate: [WeightOz] / 16
Set Variable: WeightLbs

Calculate: [WeightOz] * 28.3495
Set Variable: WeightGrams

Calculate: [WeightGrams] / 1000
Set Variable: WeightKg

Text:
🎒 Total Gear Weight
🔢 [WeightOz] oz
📊 [WeightLbs] lbs
⚖️ [WeightKg] kg

Show Result with Text
```

## Example 5: Productivity Check

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "rescueTimeLast7dHours" from Contents
Set Variable: Hours

Get Dictionary Value "rescueTimeLast7dProductivePct" from Contents
Set Variable: Productive

Text:
⏰ Last 7 Days
🕐 [Hours] hours tracked
✅ [Productive]% productive

Show Notification with Text
```

## Example 6: Culture Consumption Tracker

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "musicTopArtistAllTime" from Contents
Set Variable: TopArtist

Get Dictionary Value "letterboxdFilmsCalYear" from Contents
Set Variable: FilmsThisYear

Get Dictionary Value "discogsRecordsTotal" from Contents
Set Variable: VinylCollection

Text:
🎨 Culture Stats
🎵 Top Artist: [TopArtist]
🎬 Films: [FilmsThisYear] this year
💿 Vinyl: [VinylCollection] records

Copy to Clipboard with Text
```

## Example 7: Website Analytics Widget

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "websitePageviewsCalMonth" from Contents
Set Variable: Pageviews

Get Dictionary Value "websiteVisitorsCalMonth" from Contents
Set Variable: Visitors

Calculate: [Pageviews] / [Visitors]
Set Variable: PagesPerVisitor

Text:
📊 Website Stats (This Month)
👁️ [Pageviews] pageviews
👤 [Visitors] visitors
📄 [PagesPerVisitor] pages/visitor

Show in Quick Look
```

## Example 8: GitHub Activity Widget

```
Get Contents of URL: https://ejfox.com/api/stats-lite

Get Dictionary Value "githubContributionsAllTime" from Contents
Set Variable: Contributions

Get Dictionary Value "githubReposTotal" from Contents
Set Variable: Repos

Get Dictionary Value "githubFollowersCurrent" from Contents
Set Variable: Followers

Text:
🐙 GitHub Stats
✨ [Contributions] contributions
📦 [Repos] repositories
👥 [Followers] followers

Show Notification with Text
```

## Example 9: Combined Morning Routine

```
# Get stats
Get Contents of URL: https://ejfox.com/api/stats-lite

# Build comprehensive dashboard
Get Dictionary Value "chessRatingRapid" from Contents
Set Variable: Chess

Get Dictionary Value "blogPostsCalMonth" from Contents
Set Variable: Posts

Get Dictionary Value "githubContributionsAllTime" from Contents
Set Variable: Contributions

Get Dictionary Value "musicScrobblesAllTime" from Contents
Set Variable: Scrobbles

# Get current time
Get Current Date
Format Date with "EEEE, MMMM d"
Set Variable: Today

Text:
🌅 Good Morning!
📅 [Today]

📊 Your Stats:
♟️ Chess Rating: [Chess]
✍️ Blog Posts: [Posts]
💻 GitHub: [Contributions]
🎵 Scrobbles: [Scrobbles]

Share with Text
```

## Example 10: Home Screen Widget (Data Only)

For a widget, you can create a shortcut that:
1. Fetches the stats
2. Stores key values in Files/iCloud
3. Widget reads from stored file

```
Get Contents of URL: https://ejfox.com/api/stats-lite

# Extract key metrics
Get Dictionary Value "chessRatingRapid" from Contents
Set Variable: ChessRating

Get Dictionary Value "blogPostsCalMonth" from Contents
Set Variable: BlogPosts

# Create JSON for widget
Dictionary:
  chess: [ChessRating]
  blog: [BlogPosts]
  updated: [Current Date]

Save File "stats-cache.json" to iCloud Drive/Shortcuts/
```

## Tips for iOS Shortcuts

1. **Use Variables**: Store dictionary values in variables for reuse
2. **Error Handling**: Add "If Result" blocks to handle missing data
3. **Formatting**: Use "Format Number" for cleaner display
4. **Caching**: The API has 5-minute cache, safe to call frequently
5. **Combine Actions**: Chain multiple dictionary lookups together
6. **Share Actions**: Use Share, Copy, or Notification based on use case
7. **Widgets**: Store data in files for widget consumption
8. **Automation**: Add to morning/evening routines

## Field Reference

Quick reference of available fields (with precise time periods and units):

**GitHub (all time)**
- `githubContributionsAllTime`, `githubReposTotal`, `githubFollowersCurrent`

**Chess.com (current ELO ratings + all time games)**
- `chessRatingRapid`, `chessRatingBlitz`, `chessRatingBullet`, `chessRatingPuzzles`, `chessGamesAllTime`

**Blog (calendar month + all time)**
- `blogPostsCalMonth`, `blogPostsAllTime`, `blogWordsCalMonth`

**Last.fm (all time)**
- `musicScrobblesAllTime`, `musicTopArtistAllTime`

**RescueTime (last 7 days)**
- `rescueTimeLast7dHours`, `rescueTimeLast7dProductivePct`

**Gear (current totals)**
- `gearItemsTotal`, `gearWeightTotalOz`

**Website Analytics (calendar month)**
- `websitePageviewsCalMonth`, `websiteVisitorsCalMonth`

**Letterboxd (calendar year + all time)**
- `letterboxdFilmsCalYear`, `letterboxdFilmsAllTime`, `letterboxdRatingAvg`

**Discogs (current totals)**
- `discogsRecordsTotal`, `discogsValueTotalUsd`

All fields are optional and may not be present if data is unavailable.
