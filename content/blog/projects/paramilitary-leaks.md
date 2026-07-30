---
title: "Paramilitary Leaks"
date: 2025-09-01T00:00:00-04:00
category: "Journalism"
featured: true
tech: ["Nuxt", "Vue", "Search", "Data Visualization"]
state: deployed
ai-involvement: ai-assisted
context: collaborative
tags:
  - journalism
  - data
  - osint
  - tools
---

I was perusing Mastodon, as one does, and noticed a post from journalist [Micah Lee](https://micahflee.com/exploring-the-paramilitary-leaks/) saying he was exploring a 200GB dump from [American paramilitary groups](https://www.propublica.org/article/ap3-oath-keepers-militia-mole) — a leak made possible through the incredible bravery of John Williams, who infiltrated these groups and exfiltrated the data. I hadn't heard of the dump before, and immediately sent Micah an email offering to help with any dataviz.

![The leak explorer — search + a dense visual index of the document set](https://res.cloudinary.com/ejf/image/upload/projects/paramilitary-leaks/explorer.png)

The pipeline chops and screws the data from Telegram HTML exports into SQLite, then Parquet hosted on Cloudflare R2 — a columnar format that's super-fast in the browser. On top of that sits a Nuxt + [regl-scatterplot](https://github.com/flekschas/regl-scatterplot) frontend with full-text search, filters, and a dense visual index of the corpus. We took a 200GB leak and turned it into something a reporter can explore in the browser.

![Full-text search across the corpus](https://res.cloudinary.com/ejf/video/upload/v1741568702/text-search.mp4)

Explore it at [para-leaks.ejfox.com](https://para-leaks.ejfox.com), read the full write-up — [Processing Telegram Leaks for Fast Web Visualization](/blog/2025/paramilitary-telegram-leaks-001) — or watch the walkthrough: [Visualizing 200GB Of Leaked Telegram Chats](https://www.youtube.com/watch?v=x-OSFUtCdK0).
