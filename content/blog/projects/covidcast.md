---
title: "COVIDcast"
date: 2020-04-24T00:00:00-04:00
category: "Journalism"
featured: false
modified: 2025-08-26T15:53:05-04:00
url: https://campustechnology.com/articles/2020/04/24/carnegie-mellon-maps-offer-more-data-for-covid-19-forecasting.aspx
tech: ["Data Visualization", "JavaScript", "COVID-19 Data", "Public Health"]
state: deployed
ai-involvement: human-only
context: client
tags:
  - covid
  - dataviz
  - javascript
  - health
---

During the early COVID-19 pandemic, I worked with Carnegie Mellon University's Delphi research group on [COVIDcast](https://delphi.cmu.edu/epidemic-signals/), prototyping data visualizations and interactions to help the public understand hospitalization, transmission and movement trends across the country.

COVIDcast launched in April 2020 with a then-unusual idea: no single signal could be trusted on its own, so it mapped many rough ones side by side. These included doctor and telemedicine visits, symptom searches on Google, flu-test statistics, and symptom surveys run through Facebook and Google. Where several signals agreed, you could believe them.

![Scrolling the COVIDcast dashboard as it runs today — indicator tiles, the county-level map, and the signals table](https://res.cloudinary.com/ejf/video/upload/projects/covidcast/dashboard-scroll.mp4)

![COVIDcast dashboard: weekly case, hospitalization, and death rates above an interactive county-level map](https://res.cloudinary.com/ejf/image/upload/v1666630395/project-images/cmu_covidcast.png)

I kept playing with the data afterwards. Using Delphi's open Epidata API, I made time-lapses of doctor visits by county, where each circle is a county sized by the share of outpatient visits due to COVID-like symptoms. One was paired with a data sonification of the same numbers for all of New York State.

![A county-level circle map of the United States, one circle per county](https://res.cloudinary.com/ejf/image/upload/v1755099710/screenshot_2025-08-13_at_11.41.38_AM.png)
