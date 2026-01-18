---
date: 2025-08-06T12:53:07-04:00
modified: 2026-01-03T14:45:26-05:00
tags:
  - dataviz
  - quantifiedself
  - personal
  - data
  - analytics
  - productivity
  - fdc/519
  - fdc/005
---
## Ten Years of the Computer

In 2011, when I was 19 years old, I made a prescient decision. I was an aspiring data visualization designer working at my first startup, and when I discovered then 4-year-old app [RescueTime](https://www.ycombinator.com/companies/rescuetime) - a sort of self-development introspective spyware, I immediately installed it on all of my computers. (This is [[../robots/quantified-self-as-archaeology|tracking as archaeology, not optimization]] - capturing data before knowing what questions I'd ask.)

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

### What the Data Revealed

#### The YouTube Learning Explosion

My YouTube consumption tells a story about how I learn. I started small in 2012 with just 1 hour, peaked at 315 hours in 2014, then settled into a pattern. But 2021 was different:

- 2014: 315 hours
- 2020: 299 hours
- 2021: 589 hours (97% increase - nearly doubling)
- 2022: 244 hours (crashed back to earth)

With nowhere to go and endless time, I accidentally conducted the largest educational experiment of my life. While others binged Netflix, I was deep in programming tutorials, design theory, and maker content.

#### From Software to Hardware: The Music Story

The data captured my transition from digital music production to physical instruments and analog gear:

**2014 - Peak Digital Era:**
- Logic Pro X: 118 hours (building production skills)
- Traktor: 197 hours (digital DJing obsession)
- Total: 393 hours making music on computers

**2016 - The Turning Point:**
- Logic Pro X peaked at 169 hours
- Traktor crashed to 26 hours (the hardware bug was biting)

**2017-2020 - The Great Migration:**
The software hours disappeared as I moved to hardware synthesizers, drum machines, and analog mixers that aren't trackable with RescueTime. What looks like "giving up music" in the data was actually me getting *more* serious about it - just away from the computer.

#### The Social Media Roller Coaster

If there's one thing the data reveals about my relationship with social platforms, it's that I'm apparently incapable of moderation. I either binge or quit cold turkey.

**The Facebook Years (2013-2016)**
My early twenties were peak Facebook addiction. In 2014, I spent 169 hours on the platform - that's 28 minutes every single day, including a legendary 17-hour binge on June 1st, 2015. (What was I even doing for 17 hours? The mind boggles.)

**The Great Migration (2017-2019)**
Then something interesting happened: I just… stopped. Facebook usage collapsed from 116 hours to 15 hours over two years. This wasn't a conscious decision - I simply found myself opening Twitter instead. The data shows a near-perfect inverse relationship: as Facebook died, Twitter grew.

**The Pandemic Peak (2020-2021)**
COVID broke my brain in measurable ways. Twitter usage exploded from 50 hours in 2019 to 327 hours in 2021 - nearly an hour every day. I was mainlining political discourse, pandemic updates, and tech Twitter drama with 0.6-minute average sessions. Pure dopamine farming.

**The Musk Exodus (2022-2025)**
Then Elon bought Twitter and I noped out entirely. 327 hours to zero overnight. By 2025, my total social media usage across all platforms: 9 hours for the entire year. I went from social media addict to digital hermit in the span of a few years.

#### Hybrid Design Engineer Evolution

2. 2014: The Creative Supernova

  Design peak: 508.5 hours (1.4 hours every single day)

  - Traktor: 197h (digital DJing mastery)
  - Logic Pro X: 118h (music production peak)
  - Adobe After Effects: 24h (motion graphics)
  - Illustrator CS6: 21h (classic design work)

  2014 wasn't the end of my design career - it was the absolute zenith.

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