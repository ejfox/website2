---
date: 2025-08-06T12:53:07-04:00
modified: 2025-08-13T11:15:55-04:00
tags:
  - dataviz
  - quantifiedself
  - personal
---
## Ten Years of the Computer

In 2011, when I was 19 years old, I made a prescient decision. I was an aspiring data visualization designer working at my first startup, and when I discovered then 4-year-old app [RescueTime](https://www.ycombinator.com/companies/rescuetime) - a sort of self-development introspective spyware, I immediately installed it on all of my computers.

Rescuetime would quietly watch me for the next 14 or so years, tracking most of my personal computer usage, with a small gap in 2020 when I bought a new computer a briefly forgot to reinstall RescueTime.

What accumulated over that time was an incredibly high-resolution dataset of how much time I spend doing different things on the computer.

I was particularly interested to look at the data surrounding the few years of AI-assisted coding. For me personally, it has felt like a ground-shift in terms of how I use the computer to make things, and luckily, I have the data to support that now.

### Getting the data

On [RescueTime's settings page](https://www.rescuetime.com/rtx/settings/data) you can ask them to "Download your data archive" - which took a few hours to complete for me.

The data that was most useful to me was a 448.9MB `rescuetime_data.json` file, and I promptly broke it down into .csvs for each year in the dataset, for more intricate analysis. I also converted the data to a [parquet](https://parquet.apache.org) file so it can easily be loaded into the browser with DuckDB for on-the-fly analysis and visualization.

  - 22,380 hours tracked over 14 years (2.6 years of straight computer usage)
  - 31,516 different apps and websites tracked
  - 3,827 days of data across 5,115 total days
  - 932 days worth of pure screen time

### Looking for patterns

#### YouTube: A Lifetime of Consumption

I started at just 1 hour in 2012, exploded to 315 hours in 2014 (52 minutes daily), then crashed to 84 hours in 2015.

  - 2020: 299 hours (pandemic baseline)
  - 2021: 589 hours (97% increase - nearly doubling)
  - 2022: 244 hours (59% crash back to earth)

  This isn't random volatility. 2021 was peak information arbitrage - maximum learning opportunity combined with minimum

  opportunity cost. While others doom-scrolled, I accidentally conducted the largest educational experiment of my life.

#### Digital To Analog: Music Production & DJing

  2014: The Software Maximalist

  - Traktor: 197 hours (peak year - you were deep in digital DJing)
  - Logic Pro X: 118 hours (building up production skills)
  - Total music software: 393 hours (10+ hours per week making music)

  2016: The Logic Pro Zenith

  - Logic Pro X: 169 hours (absolute peak - 3+ hours per week)
  - But Traktor had already crashed to 26 hours (the DJ transition begins)

  The Invisible Revolution (2017-2020)

  What the data shows:

  - Logic Pro X: 169h → 72h → 27h → 13h (systematic abandonment)
  - Traktor: Virtual disappearance after 2018
  - Total music software: 393h peak → 14h by 2020 (96% decline)
#### The Ebb and Flow of Social Media

  The Tale of Two Peaks

  Facebook: The Early Adopter's Peak (2014)

  - Peak: 169 hours = 28 minutes every single day
  - Peak single day: June 1, 2015 (17.6 hours - an entire waking day)
  - 151-day consecutive usage streak on Twitter (ultimate engagement)
  - Average session: 1.4 minutes (rapid-fire checking)

  Twitter: The Late Bloomer's Peak (2021)

  - Peak: 327 hours = 54 minutes daily (nearly an hour every day)
  - COVID renaissance: 2019 (50h) → 2021 (327h) = 554% increase
  - Average session: 0.6 minutes (even more compulsive than Facebook)

  The Four-Phase Evolution

  Phase 1: Early Adoption & Mastery (2013-2016)

  - Facebook dominance: 2014 peak of 169 hours
  - Twitter steady growth: Building from 92h to 228h
  - Combined social media: 57 minutes daily at peak

  Phase 2: The Great Facebook Escape (2017-2019)

  - Facebook collapse: 116h → 15h (87% decline in 2 years)
  - Twitter continues growing (the replacement theory)
  - This wasn't conscious - you just… stopped opening Facebook

  Phase 3: COVID Renaissance (2020-2021)

  - Twitter explodes: 50h → 327h (peak social year ever)
  - Facebook brief comeback: 11h → 43h (pandemic loneliness)
  - Peak combined usage: 370 hours = 61 minutes daily

  Phase 4: The Musk Exodus & Terminal Decline (2022-2025)

  - Twitter: 327h → 0h (complete abandonment)
  - Facebook: Slow death from 43h → 9h → effectively zero
  - 2025: 9 total social hours = 1.4 minutes daily

#### Hybrid Design Engineer Evolution

2. 2014: The Creative Supernova

  Design peak: 508.5 hours (1.4 hours every single day)

  - Traktor: 197h (digital DJing mastery)
  - Logic Pro X: 118h (music production peak)
  - Adobe After Effects: 24h (motion graphics)
  - Illustrator CS6: 21h (classic design work)

  2014 wasn't the end of my design career - it was the absolute zenith.

  3. The 2019 Design Apocalypse

  The most extreme ratio in the entire dataset: 33.7:1 engineering to design.

  - Engineering: 178.5 hours
  - Design: 5.3 hours (6 minutes per month)

  This is where the "designer to engineer" story comes from - one anomalous year where I nearly abandoned creative work

  entirely.

  The Terminal Renaissance

  2021: 42.3 hours (breakthrough year)

  2024: 62.9 hours (peak command-line mastery)

  But here's the twist: terminal usage peaked the same year as my design renaissance. 2024 saw:

  - Engineering: 776.5h (career high)
  - Design: 132.4h (strongest since 2017)

  I didn't choose engineering over design. I chose both, simultaneously.

  The Hybrid Reality

  Recent years (2022-2025):

  - Engineering: 1,603 hours
  - Design: 372 hours
  - Ratio: 4.3:1

  Even in my "full engineering" phase, I maintained 93 hours of design work annually. That's nearly 2 hours per week of

  creative work that's invisible to the "engineer" narrative.

  The Real Story

  The data reveals something unprecedented: a professional shape-shifter who refused to pick a lane.

  - 2014: Creative peak (508h design, 136h engineering)
  - 2019: Engineering peak (179h engineering, 5h design)
  - 2024: Hybrid peak (777h engineering, 132h design)