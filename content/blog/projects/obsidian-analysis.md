---
title: "Obsidian Analysis"
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

## More semantic maps

### Criterion Embeddings

![Criterion film embeddings explored as a 2D map](https://res.cloudinary.com/ejf/image/upload/v1780060622/projects/data-visualization-suite/gh-4.png)

[Criterion Embeddings](https://github.com/ejfox/criterion-embedding-viz) computes vector embeddings for every Criterion Collection film and projects them into an explorable 2D map. You search by theme ("films about existentialism") instead of by keyword.

### r/dataisbeautiful, Embedded

![r/dataisbeautiful embedded — 1,000 posts clustered into 50 thematic bubbles, sized by count](https://res.cloudinary.com/ejf/image/upload/projects/reddit-embeddings/map.png)

The top 1,000 posts from r/dataisbeautiful, each embedded with OpenAI and clustered into 50 themes, laid out as a map. The biggest clusters: US politics dataviz, COVID and mortality, Google search trends, climate, creative visualizations, and personal-finance charts.

### code-network-gen

![Real output — every script in this site's content pipeline as a call-constellation (pink hub = file scope, teal = functions, edges = calls)](https://res.cloudinary.com/ejf/image/upload/projects/code-network-gen/graph.png)

[code-network-gen](https://github.com/ejfox/code-network-gen) generates a node/edge graph from a JavaScript codebase by walking the AST with acorn and babel. It shows software architecture as an explorable network instead of a file tree — above, the scripts behind this site's own content pipeline.
