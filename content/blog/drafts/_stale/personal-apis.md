---
date: 2025-01-04T19:07:17-05:00
modified: 2025-01-26T23:34:18-05:00
---

## Building Personal APIs

When I talk to the robots, I want the robot to know things about me or my life. For example I have a bot that txts me the weather every day. That's fine and easy, but I also feed it my health data so it can do things like "its gonna be a nice day today and you are due for a walk!" because my health data is there.

These APIs are based on my personal KPIs - you can't improve what you don't measure. So the stats are based on how I want to live my life. I wanna write more blog posts so I measure that and cumulative total words written. I wanna get better at chess so I measure my score. I wanna be a better programmer and learn data science and algorithms so I have my leetcode history.

My choices for what to track are all chosen based on my natural interests and things I want to improve on. The implementation is straightforward - I just use basic caching in the Nuxt / Nitro API. Its not that hard and the results feel powerful.

It's kinda based on what's available and what services offer data egress, though I do always choose services that offer APIs wherever possible (fuck Facebook for slowly enshittifying all their APIs over the past 10 years).

This project was deeply inspired by quantified self and the feltron annual report and tim ferris and that sort of self-tracking and improvement movement, oh and Gwern! From them, I learned a few specific lessons:

- Feltron taught me to focus on simple narrative metrics, where less is more
- Ferriss taught me anything is learnable with a system and persistence
- Gwern taught me that all experimentation is valuable with enough documentation, and that if you are ahead of the curve and just document your own interests than some time later as people catch up they will find your work

We live in a post capitalist digital surveillance state, so theoretically the algorithm has a dashboard of intelligence on me. Why not build the same for myself, but around things that actually matter for me? Based on my goals? I wanna write more code, practice more skills, get better at things, continuously improve and learn, write more blog posts, make more youtube videos, document the things I make.

What makes this approach feel so powerful is that there is a compounding factor where if you give the bot a bunch of context the results feel like *magic* - like - how did you know that? Much more like an entity *in your life*, so to speak.

Here's what I'm actually tracking right now. Each API represents something I care about improving or understanding better. The JSON structure is relatively simple - I'm resisting the impulse to track everything. I just slice it down to the stuff that tells an interesting story about how I spend my time and energy.

### GitHub

`/api/github`

```json
{
  "stats": {
    "totalRepos": number,
    "totalContributions": number,
    "followers": number,
    "following": number
  },
  "contributions": [number],
  "dates": [string]
}

```



### RescueTime

`/api/rescuetime`

```json
{
  "categories": [
    {
      "time": {
        "seconds": number,
        "minutes": number,
        "hours": number,
        "hoursDecimal": number,
        "formatted": string
      },
      "percentageOfTotal": number
    }
  ],
  "activities": [
    {
      "name": string,
      "time": {
        "seconds": number,
        "minutes": number,
        "hours": number,
        "hoursDecimal": number,
        "formatted": string
      },
      "percentageOfTotal": number
    }
  ],
  "summary": {
    "total": {
      "seconds": number,
      "minutes": number,
      "hours": number,
      "hoursDecimal": number,
      "formatted": string
    },
    "productive": {
      "time": {
        "seconds": number,
        "minutes": number,
        "hours": number,
        "hoursDecimal": number,
        "formatted": string
      },
      "percentage": number
    },
    "distracting": {
      "time": {
        "seconds": number,
        "minutes": number,
        "hours": number,
        "hoursDecimal": number,
        "formatted": string
      },
      "percentage": number
    },
    "neutral": {
      "time": {
        "seconds": number,
        "minutes": number,
        "hours": number,
        "hoursDecimal": number,
        "formatted": string
      },
      "percentage": number
    }
  },
  "lastUpdated": string
}

```


### Chess
```json
{
  "currentRating": {
    "bullet": 100,
    "blitz": 118,
    "rapid": 391
  },
  "bestRating": {
    "bullet": 241,
    "blitz": 370,
    "rapid": 0
  },
  "gamesPlayed": {
    "bullet": 233,
    "blitz": 198,
    "rapid": 1,
    "total": 432
  },
  "winRate": {
    "bullet": 41,
    "blitz": 40,
    "rapid": 100,
    "overall": 60.333333333333336
  },
  "puzzleStats": {
    "rating": 449,
    "totalSolved": 0,
    "bestRating": 449
  },
  "recentGames": [
    {
      "id": "025769a3-a9e6-11ef-b62b-1fb1b701000f",
      "opponent": "frooooooooooooooo",
      "timeControl": "blitz",
      "result": "loss",
      "timestamp": 1732399245,
      "rating": 118,
      "ratingDiff": 0
    }
  ],
  "lastUpdated": "2025-01-05T00:23:29.261Z"
}
```

### MonkeyType
```json
{
  "typingStats": {
    "testsCompleted": 3,
    "testsStarted": 3,
    "bestWPM": 130.4,
    "bestAccuracy": 97.93,
    "bestConsistency": 73.75,
    "timePercentile": 97.5,
    "wordsPercentile": null
  },
  "personalBests": {
    "time": {
      "30": [
        {
          "acc": 100,
          "consistency": 83.24,
          "difficulty": "normal",
          "lazyMode": false,
          "language": "english",
          "punctuation": false,
          "raw": 126.39,
          "wpm": 126.39,
          "timestamp": 1700329299686
        }
      ],
      "60": [
        {
          "acc": 97.93,
          "consistency": 73.75,
          "difficulty": "normal",
          "lazyMode": false,
          "language": "english",
          "punctuation": false,
          "raw": 133.8,
          "wpm": 130.4,
          "numbers": false,
          "timestamp": 1732731572039
        }
      ]
    },
    "words": {}
  },
  "speedHistogram": {
    "time": {
      "0": 120,
      "10": 1237,
      "20": 5775,
      "30": 16686,
      "40": 31798,
      "50": 44929,
      "60": 52587,
      "70": 52141,
      "80": 45879,
      "90": 37141,
      "100": 29754,
      "110": 19270,
      "120": 12729,
      "130": 7333,
      "140": 4303,
      "150": 2370,
      "160": 1207,
      "170": 565,
      "180": 267,
      "190": 136,
      "200": 71,
      "210": 22,
      "220": 22,
      "230": 8,
      "240": 6,
      "250": 3,
      "260": 3,
      "270": 1
    },
    "words": {}
  },
  "lastUpdated": "2025-01-05T00:23:54.080Z"
}
```

### Leetcode

`/api/leetcode`

```json
{
  "contestStats": null,
  "recentSubmissions": [
    {
      "title": "Add Two Integers",
      "titleSlug": "add-two-integers",
      "timestamp": "1735433140",
      "statusDisplay": "Accepted",
      "lang": "javascript"
    }
  ],
  "submissionStats": {
    "easy": {
      "count": 1,
      "submissions": 1
    },
    "medium": {
      "count": 0,
      "submissions": 0
    },
    "hard": {
      "count": 0,
      "submissions": 0
    }
  },
  "lastUpdated": "2025-01-05T17:16:38.800Z"
}
```

### Photos

`/api/photos`

```json
{
  "stats": {
    "totalPhotos": 385,
    "photosThisYear": 385,
    "photosThisMonth": 0,
    "averagePerMonth": 385,
    "mostActiveMonth": {
      "month": "November 2024",
      "count": 385
    }
  },
  "photos": [
    {
      "id": "e3nt5qi114uhk2byanjv",
      "url": "https://res.cloudinary.com/ejf/image/upload/v1735000421/e3nt5qi114uhk2byanjv.png",
      "uploaded_at": "2024-12-24T00:33:41+00:00",
      "width": 1290,
      "height": 2796,
      "format": "png"
    },
    ...etc...
```


### Health

`/api/health`

```json
{
  "today": {
    "steps": 0,
    "standHours": 0,
    "exerciseMinutes": 0,
    "distance": 0,
    "calories": 0
  },
  "thisWeek": {
    "steps": 5272,
    "exerciseMinutes": 0,
    "distance": 0,
    "calories": 0
  },
  "thisYear": {
    "steps": 1349,
    "exerciseMinutes": 0,
    "distance": 0,
    "calories": 0,
    "averageStepsPerDay": 169,
    "averageExercisePerWeek": 0
  },
  "averages": {
    "dailySteps": 124,
    "dailyStandHours": 0,
    "dailyExerciseMinutes": 0,
    "dailyDistance": 0,
    "restingHeartRate": 0
  },
  "heartRate": {
    "resting": 0,
    "walking": 0,
    "current": 0,
    "variability": 0
  },
  "activity": {
    "monthlyDistance": 0,
    "monthlyExerciseMinutes": 0,
    "monthlySteps": 12053,
    "flightsClimbed": 1
  },
  "trends": {
    "daily": {
      "dates": [
        "2024-12-25",
        "2024-12-26",
        "2024-12-27",
        "2024-12-28",
        "2024-12-29",
        "2024-12-30",
        "2024-12-31",
        "2025-01-01"
      ],
      "steps": [
        107,
        250,
        268,
        212,
        174,
        246,
        55,
        37
      ],
      "exercise": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "distance": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    "weekly": {
      "dates": [
        "2024-12-22",
        "2024-12-29"
      ],
      "steps": [
        6781,
        5272
      ],
      "exercise": [
        0,
        0
      ],
      "distance": [
        0,
        0
      ]
    },
    "monthly": {
      "dates": [
        "2024-12",
        "2025-01"
      ],
      "steps": [
        11621,
        432
      ],
      "exercise": [
        0,
        0
      ],
      "distance": [
        0,
        0
      ]
    }
  },
  "lastUpdated": "2025-01-05T00:22:55.401Z"
}
```

### RSS Feed

`/rss.xml`
