---
title: "2016 Russian Twitter Trolls"
date: 2017-12-20T15:01:43-05:00
modified: 2025-04-05T16:07:27-04:00
url: https://www.nbcnews.com/tech/social-media/russian-trolls-went-attack-during-key-election-moments-n827176
---

In 2016 I was working at NBC News, and reporter Ben Popken approached me with a unique mission. He had been given a huge dataset of over 200k tweets sent by known Russian twitter trolls, and he needed a way to analyze and visualize it. I jumped at the opportunity to help.

In partnership from analysts from Neo4J we began by applying standard [OSINT](https://en.wikipedia.org/wiki/Open-source_intelligence) principles; patterns, daily volume, and senders. Because this was twitter, the trolls had also helpfully hashtagged their tweets, providing another feature to explore.

The Neo4J team helped build exports from the data as .csv files, which I then created interactive d3 visualizations and static visualizations in Illustrator to embed into the NBC News CMS. The data was later expanded on with a release of [over 2 million Russian troll tweets](https://fivethirtyeight.com/features/why-were-sharing-3-million-russian-troll-tweets/) by FiveThirtyEight.

Our analysis showed that Russan trolling often spiked during significant political events like debates, and via hashtag analysis, we found they often pushed ideologies from *both sides* of the political spectrum- which I visualized as a streamgraph, with flowing colors for each topic.

![](http://res.cloudinary.com/ejf/image/upload/v1743883580/Screenshot_2025-04-05_at_4.06.07_PM.png)

[Neo4J released the dataset on Github](https://github.com/neo4j-graph-examples/twitter-trolls) as well