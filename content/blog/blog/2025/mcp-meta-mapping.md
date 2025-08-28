---
dek: In which we the author gets his bearings by doing one of the things he knows best; making a map
inprogress: true
tags:
  - embeddings
  - cartography
  - dataviz
date: 2025-03-25T00:12:41-04:00
modified: 2025-03-27T16:12:50-04:00
---

## Mapping Novel Territories: Untangling MCP Servers

There are now *so many* MCP servers which is both overwhelming and exciting for me.

Right now, all the MCP servers you add are made available to your robot at all times. That means that each tool and its description are taking up some of your context window, whether they are relevant or not. Which means you need to think through your toolkit carefully.

My first instinct, shared by many, is to load the robot up with *as many tools as possible*. You can stay up late configuring your API keys and imagining the possibilities. I went through this with Obsidian Plugins. But over time, I came to realize the extra plugins didn’t help as much as I thought. Worse, they slowed down every interaction (particularly on mobile.) I anticipate a similar arc with MCP servers.

Given a completely novel territory I did what any hacker-come-cartographer might do, I tried to make a map of it, aided at every step by the robot of course.

The first step was to take the MCP names and descriptions and turn them into embeddings; getting their location in hyper-dimensional space that we can use to arrange, cluster, and categorize them roughly by what they do (if we configure our parameters correctly)

![](http://res.cloudinary.com/ejf/video/upload/v1742924387/Screen_Recording_2025-03-25_at_1.38.45_PM.gif)

Now that we have a file full of the titles, descriptions, and embeddings we can apply “dimension reduction” to take the point from 4096TK dimensions, which I struggle to imagine, to 2 dimensions, which I can imagine quite easily.

A ton of points with X and Y positions? That’s data begging to be a scatterplot if I ever saw it. We can run our dimension reduction algorithms with all sorts of different parameters and see what the resulting piles look like. Some seem to have more prominent groupings, some look like true jumbles.

We are naively, intuitively “tuning” our parameters across hyper-dimensional space, like tuning your radio and looking for strong signals that might turn from noise into Fresh Air or the local Classic Rock station.

![https://res.cloudinary.com/ejf/image/upload/v1742920334/parameter_grid_ekueka.png](https://res.cloudinary.com/ejf/image/upload/v1742920334/parameter_grid_ekueka.png)

Once we have arranged our points, whose positions contain some meaning (one that is impossible for us to label simply on X and Y axes, at this point) that we need to discover.

![https://res.cloudinary.com/ejf/image/upload/v1742920403/umap_grid_16x16_silhouette_fpmntg.png](https://res.cloudinary.com/ejf/image/upload/v1742920403/umap_grid_16x16_silhouette_fpmntg.png)

From here we can run a number of clustering algorithms, created by people much smarter than ourselves, each with their own arcane parameters to be tuned and explored. We can do the same exercise, running lots of different clusters and comparing them as small multiples, and finding the shapes that we are drawn to.

![https://res.cloudinary.com/ejf/image/upload/v1742920502/kmeans_small_multiples_okqtkw.png](https://res.cloudinary.com/ejf/image/upload/v1742920502/kmeans_small_multiples_okqtkw.png)

When I used to shoot film photos I had my own darkroom, and one of the crucial steps in printing a roll of film is first printing a contact sheet, little thumbnails of the entire roll. In many ways we are recreating this process but with a machine, a camera that humanity has yet to perfect or even understand. Thats what makes it fun.

![](http://res.cloudinary.com/ejf/image/upload/v1742920150/IMG_3168.jpg)

![](http://res.cloudinary.com/ejf/image/upload/v1742920633/Screenshot_2025-03-25_at_12.37.00_PM.png)

Once we have picked groupings, we can begin to make some shape of them. We don’t even necessarily need the robot for this part, although doing it by hand is a chore. You can click around the points in a cluster, and as a human, after 4 or 5 you can kinda get a sense what “category” we might be in.

![](http://res.cloudinary.com/ejf/video/upload/v1742920786/Screen_Recording_2025-03-25_at_12.38.58_PM.gif)

Some traditional categories emerge; both from our manual spot-checking as well as our automated labeling techniques. We are beginning to find the true names of this unknown territory. The fog of war begins to lift, and we start to see not only the peaks but also the valleys and the space between concepts. These might be places for people who want to make *new things* to concentrate their energies.

![](http://res.cloudinary.com/ejf/image/upload/v1742920843/Screenshot_2025-03-25_at_12.40.31_PM.png)

Creativity and innovation can often come from the simple interpolation of discrete ideas or technologies. Maps like these can help us perform these exercises. I am a visual thinker, so for me, it is interesting to draw lines between clusters and think what it might look like to combine them in new ways or find gaps in coverage. This is strategy, not tactics.

Embeddings are just one particular method of exploring this dataset. We could probably ask the robot to apply some tags based on the data and use that to create groupings and taxonomies. But what list of tags to give it to choose from? Its a bit of a chicken and egg problem.