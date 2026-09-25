---
title: "Coach Artie — Memory Analysis"
date: 2026-02-01T00:00:00-05:00
category: "Dataviz"
featured: false
tech: ["Python", "t-SNE", "HDBSCAN", "Embeddings", "Data Visualization"]
state: doing
ai-involvement: ai-collaborative
context: collaborative
tags:
  - dataviz
  - data
  - ai
  - embeddings
---

<!-- TODO (EJ): voice done. Abstract/structural charts only; no readable memory
     contents shown. -->

What does an AI agent actually *remember*? Coach Artie has been accumulating memory for as long as he's been running, so I embedded all of it, clustered it, and drew the map.

I expected noise. What came back was sorted — clean clusters, things filed where they belonged, distinctions I never asked him to make.

Reading it was the strange part. The clusters kept surfacing episodes I'd completely forgotten about, sitting right there where he'd put them. He really was listening the whole time, and thinking about what was said.

![Cognitive topology — Coach Artie's memories embedded and laid out as a map](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/topology.png)

![Hierarchical clustering of the memory space, as a dendrogram](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/hierarchy.png)

![t-SNE small multiples across the memory clusters](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/tsne.png)

Beyond the static map, the analysis tracks how the memory *changes* — which clusters grow, when memories form, and how the topology shifts over time.

![Temporal cluster evolution — how the memory grows and shifts](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/temporal.png)

![Cognitive activity calendar — daily memory-formation patterns](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/calendar.png)

![Qualitative cluster heatmap](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-memory/heatmap.png)
