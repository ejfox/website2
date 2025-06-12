---
title: "Clusters of NYPD Misconduct"
date: 2024-09-21T16:00:47-04:00
modified: 2025-04-05T16:10:29-04:00
url: https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct
---

![](https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1280/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg)

In 2021, I got my hands on a massive NYPD complaint dataset from Gothamist/WNYC and immediately went down a data rabbit hole. I was curious if we could find patterns similar to the officers who killed George Floyd- early warning signs that got missed.

I started by converting an 81MB Excel file into SQLite and used Datasette to explore it. After initial poking around, I jumped into Neo4j, which I'd fallen in love with during a previous Russian Twitter trolls project.

Neo4j let me build this super cool officer-complaint network by writing Cypher queries. Every officer became a node connected to their complaints. I ultimately created 29,915 officer nodes with 159,671 relationships between them.

Then came the force visualization with Gephi (love-hate relationship, but unrivaled for networks). I used Force Atlas 2 layout algorithms and eigenvector centrality to identify clusters of officers who repeatedly appeared in complaints together. The network communities often mirrored real-world precincts, which reinforced my confidence in the analysis.

When Gothamist reporter George Joseph interviewed victims, they confirmed what the network showed - certain officers like Radoncic were "catalysts" who other officers "followed" into misconduct. Math and reality matched up!

I documented everything in excruciating detail (with footnotes!) so others could replicate it for their own police departments.