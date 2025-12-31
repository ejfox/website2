---
title: 'Clusters of NYPD Misconduct'
date: 2021-06-15T00:00:00-04:00
modified: 2025-08-26T15:52:56-04:00
url: https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct
tech: ['Neo4j', 'SQLite', 'Gephi', 'Network Analysis', 'Cypher']
featured: true
state: deployed
aiInvolvement: human-only
industry: ['Police Accountability', 'Investigative Journalism']
client: Gothamist / WNYC
tags:
  - data
  - nypd
  - journalism
  - database
---

## The Challenge

Gothamist/WNYC had obtained a massive dataset of NYPD civilian complaints—years of misconduct allegations, but no way to see the patterns. The question wasn't just "which officers have complaints?" It was: do certain officers influence others to misbehave?

## What I Built

A network graph connecting **29,915 officers** through **159,671 relationships**—shared complaints, shared precincts, shared incidents. Built with Neo4j for graph queries and Gephi for visualization.

![](https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1280/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg)

**The analysis revealed:**
- Officers cluster into groups with similar complaint patterns
- Certain "catalyst" officers appear connected to spikes in misconduct among nearby officers
- Transfer patterns sometimes spread problematic behavior to new precincts

## Validation

When Gothamist reporter George Joseph interviewed victims, they confirmed what the network showed—certain officers were known as "leaders" who other officers followed into misconduct. The math matched the reality on the ground.

## Why This Matters

I documented the [complete methodology](https://github.com/ejfox/nypd-ccrb-complaints-network) so other journalists can replicate this analysis for their own police departments. The same techniques work anywhere you have officer complaint data—which, thanks to state transparency laws, is increasingly common.

Open-source accountability tools. That's the point.
