# 🎯 Prediction Examples

Real examples of well-formatted predictions using both CLI and interactive modes.

## 📋 Two Types of Predictions

### **Time-bound Predictions** (with deadlines)
Have specific end dates when they should be evaluated.

### **Event-based Predictions** (no deadlines)  
Resolve when the event naturally occurs, regardless of timing.

## Technology Predictions

### AI/ML Development (Time-bound)
```bash
yarn predict \
  --statement "At least one open-source AI model will achieve human-level performance on the MMLU benchmark by June 30, 2025" \
  --confidence 70 \
  --deadline 2025-06-30 \
  --resolution "Human-level is 85%+ accuracy. Model must be fully open-source. Results verified by 2+ research institutions." \
  --categories "ai,technology,open-source"
```

### Company/Product Launches (Time-bound)
```bash
yarn predict \
  --statement "Apple will announce a consumer AR headset priced under $2,000 by December 31, 2025" \
  --confidence 60 \
  --deadline 2025-12-31 \
  --resolution "Official Apple announcement at public event. Must be AR-focused and available for pre-order within 6 months." \
  --categories "technology,apple,ar"
```

### Technology Breakthroughs (Event-based)
```bash
yarn predict \
  --statement "The first practical room-temperature superconductor will be discovered by a university research team" \
  --confidence 30 \
  --resolution "Peer-reviewed publication in Nature/Science. Must demonstrate superconductivity above 15°C at ambient pressure." \
  --categories "science,physics,materials"
```

## Economic/Financial Predictions

### Market Performance (Time-bound)
```bash
yarn predict \
  --statement "The S&P 500 will close above 6,000 points at least once during 2025" \
  --confidence 55 \
  --deadline 2025-12-31 \
  --resolution "Using official S&P 500 closing prices. Intraday highs don't count - must be official close." \
  --categories "finance,markets,stocks"
```

### Cryptocurrency (Time-bound)
```bash
yarn predict \
  --statement "Bitcoin will reach a new all-time high above $100,000 USD by March 31, 2025" \
  --confidence 40 \
  --deadline 2025-03-31 \
  --resolution "Using CoinGecko BTC/USD data. Must sustain $100k+ for 1+ hour. Verified by 3+ exchanges." \
  --categories "cryptocurrency,bitcoin,finance"
```

### Economic Cycles (Event-based)
```bash
yarn predict \
  --statement "The next major recession will last longer than 18 months from peak to trough" \
  --confidence 65 \
  --resolution "Using NBER recession dating committee official peak and trough dates. Duration = trough month - peak month." \
  --categories "economics,recession,cycles"
```

## Climate/Environment

### Temperature Records
```
Statement: "2024 will be declared the hottest year on record globally"

Resolution Criteria: "Using NASA GISS global temperature data. Must be officially announced by NASA as the warmest year since temperature records began in 1880."

Confidence: 85%
Categories: climate, temperature, environment
```

### Policy/Agreements
```
Statement: "At least 5 G20 countries will announce binding net-zero carbon commitments with interim 2030 targets by COP30"

Resolution Criteria: "Commitments must be legally binding domestic legislation, not just pledges. Must include specific interim targets for 2030. Announcements can be made at COP30 or in the 6 months leading up to it."

Confidence: 75%
Categories: climate, policy, international
```

## Sports/Entertainment

### Sports Championships
```
Statement: "A team from the Eastern Conference will win the 2025 NBA Championship"

Resolution Criteria: "Based on official NBA playoff results. Winning team must have been in the Eastern Conference during the 2024-25 regular season."

Confidence: 50%
Categories: sports, basketball, nba
```

### Entertainment Industry
```
Statement: "The top-grossing movie of 2025 will earn over $1.5 billion worldwide"

Resolution Criteria: "Using Box Office Mojo worldwide box office totals. Must be a movie released in calendar year 2025. Revenue includes all theatrical releases but excludes streaming/digital sales."

Confidence: 30%
Categories: entertainment, movies, box-office
```

## Politics/Governance

### Elections
```
Statement: "Voter turnout in the 2026 US midterm elections will exceed 50% of eligible voters"

Resolution Criteria: "Using official turnout data from the US Elections Project. Calculated as total votes cast divided by voting-eligible population (VEP), not just registered voters."

Confidence: 65%
Categories: politics, elections, turnout
```

### Policy Changes
```
Statement: "At least 10 US states will have legalized recreational marijuana by January 1, 2026"

Resolution Criteria: "Must be fully legal for recreational use by adults 21+, not just decriminalized or medical-only. Includes states where legalization was voted on but implementation is delayed."

Confidence: 80%
Categories: politics, policy, marijuana
```

## Science/Research

### Space Exploration
```
Statement: "SpaceX will successfully land humans on the Moon before NASA's Artemis 3 mission"

Resolution Criteria: "Successful landing means crew arrives on lunar surface and returns safely to Earth. Must be SpaceX-operated mission, not just SpaceX hardware used by NASA."

Confidence: 25%
Categories: space, spacex, nasa, moon
```

### Medical Breakthroughs
```
Statement: "A COVID-19 vaccine providing sterilizing immunity will complete Phase 3 trials by December 31, 2025"

Resolution Criteria: "Sterilizing immunity defined as preventing infection entirely, not just severe disease. Must complete Phase 3 trials with published results showing statistical significance."

Confidence: 20%
Categories: medical, covid, vaccines
```

## Personal/Lifestyle

### Remote Work Trends
```
Statement: "More than 40% of US knowledge workers will be fully remote by end of 2025"

Resolution Criteria: "Using Bureau of Labor Statistics data or equivalent large-scale survey (5,000+ respondents). Fully remote means working from home/remote location 5+ days per week."

Confidence: 35%
Categories: work, remote, labor
```

### Social Media
```
Statement: "TikTok will have fewer than 100 million monthly active users in the US by December 31, 2025"

Resolution Criteria: "Based on official company reports or credible third-party estimates (Sensor Tower, App Annie, etc.). Must be US-specific user count, not global."

Confidence: 15%
Categories: social-media, tiktok, technology
```

## Tips for Good Predictions

### ✅ What Makes These Good:
1. **Specific numbers and dates** - No vague terms
2. **Clear resolution criteria** - Exactly how to determine the outcome
3. **Objective data sources** - Third-party verification possible
4. **Appropriate timing** - Use deadlines for time-bound events, omit for natural events
5. **Single, focused outcomes** - Not compound predictions

### ❌ Common Mistakes to Avoid:
- "Things will get better" (too vague)
- "AI will be amazing by 2030" (not measurable)
- "Bitcoin will moon and Tesla will crash" (compound prediction)
- "If the world doesn't end, stocks will go up" (conditional)
- "Something big will happen in tech" (no specificity)

### 🕐 Deadline Guidelines:
- **Use deadlines for**: Market predictions, product launches, time-sensitive events
- **Skip deadlines for**: "Next recession", "First to achieve X", natural event timing
- **Consider carefully**: Will this naturally resolve at a specific time, or when an event occurs?

### 🎯 Confidence Calibration:
- **90%+** - You'd bet your house on it
- **70-80%** - Strong conviction, significant research
- **50-60%** - Slight lean, meaningful uncertainty
- **20-30%** - Low probability but possible
- **<10%** - Very unlikely, but trackable

Remember: The goal is to make predictions you can learn from, not just win. Good calibration matters more than being right on any individual prediction!

---

*Ready to make your own? Run `yarn predict` to get started!*