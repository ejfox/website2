---
title: "Screenshot Space"
date: 2026-05-17T00:00:00-04:00
draft: true
tech: ["WebGL", "UMAP", "SigLIP", "HDBSCAN", "Python", "RescueTime", "easyOCR", "sentence-transformers"]
state: doing
aiInvolvement: ai-collaborative
tags:
  - dataviz
  - data
  - ai
  - embeddings
  - quantified-self
---

<!-- TODO (EJ): the facts/architecture below are pulled straight from the code and
     are accurate — but the *why* is yours. Add your voice on top whenever you want.
     Draft until then. -->

I take a lot of screenshots — about 1,700 of them sitting in `~/screenshots`. **Screenshot Space** turns that pile into a single searchable WebGL map: every screenshot is placed by what it *looks like* and what *text* it contains, clustered into the projects I was actually working on, and then **colored by how productive RescueTime says I was the hour I took it.** It's a map of my screen life, and the RescueTime layer is what makes it an analysis instead of just a pretty constellation.

![Screenshot Space — 1,554 screenshots placed by visual + OCR similarity, tinted teal where RescueTime logged a productive hour and pink where it logged a distracting one](https://res.cloudinary.com/ejf/image/upload/projects/screenshot-space/productivity.png)

## The RescueTime layer

This is the part I care about most. Every screenshot's file modification time gets bucketed to the hour and joined against my local RescueTime SQLite database (`rescuetime.db`). For each hour I pull `total_sec` and `productive_sec`, so every screenshot carries a **productive fraction** — `productive_sec / total_sec` for the hour it was captured.

In the viz (press **`P`**) that fraction becomes the tint: **teal for productive hours, pink/magenta for distracting ones,** and tiles from hours with no RescueTime data get dimmed instead of colored. Suddenly the clusters tell on me — you can see which projects happened during focused stretches and which ones were what I was doing *instead* of focusing.

The strip along the bottom is the same data aggregated per day: a calendar histogram of screenshot volume, each bar tinted by that day's average productivity. RescueTime tracking only kicks in partway through the timeline, which is why the early bars are grey and the later ones light up teal/pink.

![Per-day timeline: screenshot volume by day, each bar tinted by that day's average RescueTime productivity. The grey stretch is before RescueTime tracking started; the colored stretch is after.](https://res.cloudinary.com/ejf/image/upload/projects/screenshot-space/timeline.png)

Each point also gets its **dominant RescueTime activity** for that hour and the **number of GitHub commits I made that calendar day** (harvested across all my repos), so hovering a screenshot tells you when it was taken, what app dominated that hour, and whether it was a commit-heavy day.

## How the map gets built

The layout isn't hand-arranged — it falls out of an embedding pipeline:

1. **Embed every screenshot** (on a rented GPU pod). Each image gets a **SigLIP** visual embedding (`google/siglip-base-patch16-256`, 768-d), **easyOCR** pulls out any on-screen text, and that text gets its own **sentence-transformer** embedding (`all-MiniLM-L6-v2`, 384-d). Output is a single resumable `embeddings.parquet`.
2. **Project to 2D** with **UMAP** over a weighted blend of the visual and text vectors (default 60% visual / 40% OCR text, cosine metric). Visual similarity pulls lookalike UIs together; the text weight makes sure two screens *about* the same thing land near each other even if they look different.
3. **Cluster and name.** HDBSCAN finds the dense regions, and an LLM names each one from its OCR contents. The result is clusters that read like a list of what I actually do: *Website2, Subway Builder, GEM Viz, DDHQ Election, Newswell Studio, Social Media* — plus an honest *Unreadable OCR* cluster for the junk.

![The raw map before any tint — 1,554 screenshot thumbnails as GPU-instanced tiles at their UMAP positions, with LLM-named cluster labels overlaid](https://res.cloudinary.com/ejf/image/upload/projects/screenshot-space/map.png)

## Exploring it

The front end is hand-written WebGL (no chart library) so it can hold ~1,550 textured tiles at 60fps:

- **Drag** to pan, **wheel** to zoom, **click** a tile to open it, **`R`** to reset to the full bounds.
- **Semantic search** — the search box finds screenshots by what's *in* them, not by filename (filenames are just timestamps).
- **`L`** drops a magnifier **lens** over the cursor for reading a dense neighborhood without zooming.
- **`T`** switches to a **recency tint** — newest screenshots glow, old ones recede — so you can watch the map fill in over time.
- **`P`** is the RescueTime productivity tint described above.
- **Hover** any tile for a tooltip with its timestamp, that hour's RescueTime activity, and an OCR preview.

![Recency mode (T): the same map tinted by age instead of productivity — newer screenshots light up, older ones fade back](https://res.cloudinary.com/ejf/image/upload/projects/screenshot-space/recency.png)

## Infrastructure

The embedding step is too heavy for a laptop, so it runs on a rented GPU pod: a setup script provisions the box, `embed.py` chews through the screenshots (resumable, so a dropped connection doesn't restart it), and the resulting parquet comes home for the local UMAP / clustering / enrichment steps. The dataset is backed up to **Cloudflare R2**, and a **launchd** job (`morning_check`) keeps the whole thing current as new screenshots accumulate.
