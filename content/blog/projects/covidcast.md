---
title: 'CMU COVIDcast'
date: 2020-04-24T00:00:00-04:00
modified: 2025-08-26T15:53:05-04:00
url: https://campustechnology.com/articles/2020/04/24/carnegie-mellon-maps-offer-more-data-for-covid-19-forecasting.aspx
tech: ['D3.js', 'JavaScript', 'Observable', 'Force-Directed Graphs', 'Public Health Data']
state: deployed
aiInvolvement: human-only
industry: ['Public Health', 'Academia']
client: Carnegie Mellon University
tags:
  - covid
  - dataviz
  - javascript
  - health
---

## The Challenge

In April 2020, the public needed to understand COVID-19 spread at the local level—but existing dashboards were either too complex for general audiences or too simplified to be useful. CMU's Delphi research group had the data; they needed ways to make it legible.

## What I Built

Prototyped interactive visualizations for [CMU's COVIDcast project](https://delphi.cmu.edu/epidemic-signals/), exploring different approaches to showing hospitalization rates, transmission patterns, and movement data across U.S. counties.

**Key explorations:**
- Force-directed county bubbles sized by population, colored by case rates
- Time-series animations showing spread patterns
- Annotation-friendly layouts for public health communications

## Technical Approach

Built exploratory prototypes on [Observable](https://observablehq.com/@ejfox/cmu-covidcast-api-bubbles-textures-for-hand-annotation), using D3's force simulation to create bubble layouts where each county is represented proportionally. Color scales mapped daily COVID cases per 100k population.

## Context

Part of a broader effort during the early pandemic to help newsrooms and public health officials visualize uncertainty—work that also informed my [OSET Institute collaboration](https://www.osetinstitute.org/blog/2020/10/20/visualizing-election-uncertainty) on election data visualization.

![](http://res.cloudinary.com/ejf/image/upload/v1755099710/screenshot_2025-08-13_at_11.41.38_AM.png)
