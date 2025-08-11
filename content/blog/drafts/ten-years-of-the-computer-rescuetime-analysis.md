---
date: 2025-08-06T12:53:07-04:00
modified: 2025-08-09T12:36:19-04:00
---
## Ten Years of the Computer

In 2011, when I was 19 years old, I made a prescient decision. I was an aspiring data visualization designer working at my first startup, and when I discovered then 4-year-old app [RescueTime](https://www.ycombinator.com/companies/rescuetime) - a sort of self-development introspective spyware, I immediately installed it on all of my computers.

Rescuetime would quietly watch me for the next 14 or so years, tracking most of my personal computer usage, with a small gap in 2020 when I bought a new computer a briefly forgot to reinstall RescueTime.

What accumulated over that time was an incredibly high-resolution dataset of how much time I spend doing different things on the computer.

I was particularly interested to look at the data surrounding the few years of AI-assisted coding. For me personally, it has felt like a ground-shift in terms of how I use the computer to make things, and luckily, I have the data to support that now.

### Getting the data

On [RescueTime's settings page](https://www.rescuetime.com/rtx/settings/data) you can ask them to "Download your data archive" - which took a few hours to complete for me.

The data that was most useful to me was a 448.9MB `rescuetime_data.json` file, and I promptly broke it down into .csvs for each year in the dataset, for more intricate analysis. I also converted the data to a [parquet](https://parquet.apache.org) file so it can easily be loaded into the browser with DuckDB for on-the-fly analysis and visualization.
