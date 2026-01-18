---
date: 2025-03-09T13:49:01-04:00
modified: 2025-03-15T21:25:05-04:00
title: Processing Telegram Leaks for Fast Web Visualization
dek: In which I describe my workflow for transforming a Telegram database dump into a web-friendly format for analysis and visualization
inprogress: true
tags:
  - data
  - dataviz
  - journalism
  - politics
---

## Paramilitary Telegram Leaks: From Dump To Data

The other day I was perusing Mastodon, as one does, and noticed a post from [journalist](https://theintercept.com/staff/micah-lee/) and [author](https://hacksandleaks.com) Micah Lee [saying he was exploring](https://micahflee.com/exploring-the-paramilitary-leaks/) a 200GB dump from [American paramilitary groups.](https://www.propublica.org/article/ap3-oath-keepers-militia-mole)

This leak was made possible through the incredible bravery of [John Williams](https://www.reddit.com/user/shitshowshaman/) who infiltrated these groups and exfiltrated all this data. He is currently [crowdfunding $10k](https://www.every.org/psstorg-inc/f/help-john-infiltrate) in part, to "move safe houses and to change his identity" and he also [has a Patreon where you can support him](https://www.patreon.com/mobiusblack)

![Screenshot - 2025-03-05 12:11:34 - Screenshot 2025-03-05 at 12.11.19 PM.png](https://res.cloudinary.com/ejf/image/upload/v1741194693/Screenshot_2025-03-05_at_12.11.19_PM.png)

I hadn't heard of such a dump before, and immediately sent Micah an email offering to help with any dataviz.

![](https://res.cloudinary.com/ejf/image/upload/v1741542940/Screenshot_2025-03-09_at_1.55.27_PM.png)

## From SQLite to Parquet: Processing Telegram Leaks for Fast Web Visualization


### The Challenge

1. Extract the relevant data
2. Convert it to a web-friendly format
3. Make it quickly accessible for visualization
4. Cache it for fast loading across browsers

![Screenshot - 2025-03-05 23:49:03 - Screenshot 2025-03-05 at 11.48.45 PM.png](https://res.cloudinary.com/ejf/image/upload/v1741236542/Screenshot_2025-03-05_at_11.48.45_PM.png)

### The Workflow

We start with the [repo Micah started](https://github.com/micahflee/paramilitary-leaks) that takes the raw dump of .html exports from Telegram and transforms them into a structured sqlite db we can work with.

Once you get that repo setup you can just do

```bash
poetry run tasks build-db ~/RAW-LEAK-LOCATION`
```

… and you get a sqlite database in your `output` folder.

#### Step 1: Export from SQLite to CSV

First, I extract the messages table to a .csv using SQLite's command-line tool:

```bash
sqlite3 -header -csv output/data.db 'select * from messages;' > output/telegram_chats.csv
```

This gives us a clean CSV file with all our message data, ready for the next transformation- we could also play around with something like [csvkit](https://github.com/wireservice/csvkit) or [visitdata](https://www.visidata.org)

#### Step 2: Convert CSV to Parquet

Parquet is a columnar storage format that's incredibly efficient for analytical queries and works brilliantly in browser environments. I use DuckDB (an in-process analytical database) to handle the conversion:

```bash
duckdb -c "INSTALL parquet; LOAD parquet; CREATE TABLE temp AS SELECT * FROM read_csv('output/telegram_chats.csv'); COPY temp TO 'output/telegram_chats.r5.parquet' (FORMAT PARQUET, COMPRESSION 'SNAPPY');"
```

The compression with Snappy ensures it's both compact and fast to decompress.

#### Step 3: Host on R2 with Cloudflare Caching

To make the data available globally with minimal latency (and cost to me) we throw it on Cloudflare R2 for hosting

```
# R2 Configuration
R2_PARQUET_URL=https://r2.ejfox.com/para-leaks/telegram_chats.r5.parquet
```

### The Frontend

I've developed a Nuxt / [regl-scatterplot](https://github.com/flekschas/regl-scatterplot) frontend application to interact with this data, available on GitHub:

[https://github.com/ejfox/paramilitary-leaks-frontend](https://github.com/ejfox/paramilitary-leaks-frontend)

<div class="video-container relative aspect-video w-full max-w-full mx-auto rounded-lg overflow-hidden shadow-lg">
  <video
    controls
    preload="none"
    poster="https://res.cloudinary.com/ejf/video/upload/v1741568702/text-search.jpg"
    class="w-full h-full object-cover">
    <source src="https://res.cloudinary.com/ejf/video/upload/v1741568702/text-search.mp4" type="video/mp4">
    Your browser does not support the video tag.
  </video>
</div>

You can view it the front-end <https://para-leaks.ejfox.com>

### Data Exploration Examples

Now that we've chopped and screwed our data between sqlite, parquet, and .csv – depending on what application we want to use it for, we can start asking interesting questions from the sqlite database with [datasette](https://datasette.io).

For example, to find the top senders of media you could run:

```sql
select id, timestamp, sender, text, media_note, media_filename, filename, group_chat_id 
from messages 
where "media_filename" is not null 
order by media_filename desc
limit 101
```

![Datasette query for top media senders](https://res.cloudinary.com/ejf/image/upload/v1741547576/Screenshot_2025-03-09_at_3.12.44_PM.png)

Because so much information is in these media files, I took a stab at having Gemini write data transcriptions of each photo so they could be indexed for text search later.

![Screenshot - 2025-03-07 15:06:40 - Screenshot 2025-03-07 at 3.06.14 PM.png](https://res.cloudinary.com/ejf/image/upload/v1741377995/Screenshot_2025-03-07_at_3.06.14_PM.png)

![Screenshot - 2025-03-07 15:08:31 - Screenshot 2025-03-07 at 3.08.18 PM.png](https://res.cloudinary.com/ejf/image/upload/v1741378110/Screenshot_2025-03-07_at_3.08.18_PM.png)

This experiment went pretty well, but I shelved it to come back to, there's enough to analyze here without involving LLMs and prompt engineering.

### Building Custom Visualizations

The real power of this approach is that we can build all sorts of different front-ends or visualizations on top of this data. The Parquet format is super-fast in the browser, making it ideal for interactive visualizations. We've taken a 200GB leak and turned it into something we can explore in the browser.

Some ideas I'm exploring:

- Timeline visualizations of message frequency
- Network graphs of user interactions
- Text analysis and keyword extraction
- Sentiment analysis over time

---

For more information on this topic, I recommend reading Micah Lee's excellent article:

[Exploring the Paramilitary Leaks](https://micahflee.com/exploring-the-paramilitary-leaks/)

ProPublica: [The Militia and the Mole (Jan. 4, 2025)](https://www.propublica.org/article/ap3-oath-keepers-militia-mole)