---
title: "Clusters of NYPD Misconduct"
date: 2024-09-21T16:00:47-04:00
modified: 2025-04-05T16:10:29-04:00
url: https://gothamist.com/news/mapping-clusters-nypd-officers-repeatedly-accused-misconduct
tech: ["Neo4j", "SQLite", "Gephi", "Network Analysis", "Cypher"]
---

![](https://res.cloudinary.com/ejf/image/upload/fl_progressive:semi,c_scale,dpr_auto,w_1280/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg)

In 2021, I got my hands on a massive NYPD complaint dataset from Gothamist/WNYC and immediately went down a data rabbit hole. Built a network of 29,915 officer nodes with 159,671 relationships using Neo4j and Gephi (love-hate relationship with Gephi, but unrivaled for networks).

When Gothamist reporter George Joseph interviewed victims, they confirmed what the network showed - certain officers were "catalysts" who other officers "followed" into misconduct. Math and reality matched up! I documented everything in excruciating detail so others could replicate it for their own police departments.