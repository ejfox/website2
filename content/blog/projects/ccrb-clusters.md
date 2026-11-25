---
title: "Clusters of NYPD Misconduct"
date: 2021-06-15T00:00:00-04:00
category: "Journalism"
modified: 2025-08-26T15:52:56-04:00
url: https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct
tech: ["Neo4j", "SQLite", "Gephi", "Network Analysis", "Cypher"]
featured: true
state: deployed
ai-involvement: human-only
context: client
tags:
  - data
  - nypd
  - journalism
  - database
---

![Force-directed network graph of NYPD civilian complaint clusters showing officers connected by shared misconduct patterns](https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1280/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg)

![Scrolling the published Gothamist investigation — the officer-cluster network as readers met it](https://res.cloudinary.com/ejf/video/upload/projects/ccrb-clusters/published-piece-scroll.mp4)

![The network visualization in the published piece](https://res.cloudinary.com/ejf/image/upload/projects/ccrb-clusters/article-viz.png)

In 2021, WNYC/Gothamist gets the NYPD's full civilian-complaint dataset through a FOIL request and hands it to me — every complaint and every officer since 2000, including officers named only as witnesses and complaints the CCRB never substantiated. Noisier than the data ProPublica published a year earlier, but for mapping a network that noise is the signal: being named on a complaint alongside another officer, even an unfounded one, means the two of them interacted in a way the public noticed.

Complaints are often the first and only warning that an officer is on a course of escalating violence. Derek Chauvin had at least 22 complaints across 19 years before he killed George Floyd; the officer who choked Eric Garner had 7. Nothing disrupted either pattern.

So I build the network — 29,915 officer nodes, 159,671 relationships, in Neo4j (with a lot of Cypher help from David Allen at Neo4j) and laid out in Gephi (love-hate relationship, but unrivaled for networks). Two officers get a link — a `CO_OCCURANCE` — when they appear on the same complaint, weighted by how many they share: three complaints together, weight 3. I filter out everything the CCRB marked *exonerated* or *unfounded* first, and only label an officer by name if they've had a complaint *substantiated* — a caution I'm told lawyers will appreciate. Everyone else stays an anonymous ID.

One sign it's working: when I run community detection, the clusters mirror real NYPD precincts — officers appear on complaints with the officers they actually work beside.

Then the big nodes surface — Martinez, Radoncic, Grieco — officers co-appearing on complaint after complaint. When Gothamist reporter George Joseph takes those names to the street and interviews victims, the graph holds up: the central nodes are acting as catalysts in real life. One man describes a big node, Adnan Radoncic, sparking a group assault — _"As soon as he grabbed me, all the officers was hands on. It's like they just followed his lead."_ Math and reality match up.

I document every query and every decision so anyone can rebuild this for their own police department: **[the full methodology write-up →](/blog/2021/nypd-ccrb-complaint-clusters)**