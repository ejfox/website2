---
title: "Obsidian Analysis"
draft: true
date: 2024-06-01T00:00:00-04:00
category: "Dataviz"
featured: false
url: https://github.com/ejfox/obsidian-analysis
tech: ["Python", "Embeddings", "UMAP", "LM Studio"]
state: deployed
ai-involvement: ai-collaborative
tags:
  - data
  - visualization
  - ai
---

I embedded my entire Obsidian vault — around 2,000 notes, chunked — using local Nomic embeddings running in LM Studio, so my private notes never leave my machine, and then I laid the whole thing out as a semantic map. Every note is a point, and points that sit close together are notes that are actually about the same thing. You search it in plain natural language, and you can recolor the map by semantics, recency, note size, or link density to see the vault from a different angle each time.

![~2,000 notes embedded into a single semantic map — search and filter by SEMANTIC / TEMPORAL / SIZE / LINKS](https://res.cloudinary.com/ejf/image/upload/projects/obsidian-analysis/map.png)

The other half of this is the parameter grid. UMAP has a lot of knobs and the layout you get depends entirely on how you set them, so instead of guessing I ran 64 combinations of `n_neighbors` and `min_dist` at once and put them side by side. It turns "which settings are right" into something you can just look at — the same vault laid out 64 different ways, all on one screen.

![A 64-combination UMAP parameter grid — the same vault laid out 64 different ways](https://res.cloudinary.com/ejf/image/upload/projects/obsidian-analysis/grid.png)
