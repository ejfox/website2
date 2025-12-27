---
title: Dataproofer
date: 2015-11-03T00:00:00-05:00
modified: 2025-08-26T15:53:33-04:00
url: https://github.com/dataproofer/Dataproofer
tech: ['JavaScript', 'Electron', 'Node.js', 'Data Quality', 'CSV']
featured: true
state: deployed
aiInvolvement: human-only
industry: ['Journalism', 'Data Quality']
client: Vocativ / Knight Foundation
tags:
  - data
  - javascript
  - tool
  - journalism
---

## The Challenge

Newsrooms get messy data. Before you can analyze it, you need to know: Are there duplicates? Missing values? Outliers that might be errors? Journalists were spending hours manually checking spreadsheets—or worse, not checking at all.

## What We Built

[Dataproofer](https://github.com/dataproofer/Dataproofer)—a "spellcheck for data." Drop in a CSV, get an instant report on data quality issues. Open source, runs locally, no data leaves your machine.

**Checks for:**
- Missing/duplicate column headers
- Empty cells and missing rows
- Outliers from mean and median
- Values at SQL integer limits
- Invalid coordinates
- Character encoding issues

## How It Happened

Gerald Rich and I pitched the idea to the [Knight Prototype Fund](https://knightfoundation.org/articles/20-ideas-receive-support-knight-prototype-fund-media-and-information-projects/) while at Vocativ. We received a **$35,000 grant** and built it over 6 months with human-centered design training from Knight.

## Results

- **Open source** with community contributions
- Used by newsrooms, researchers, and data analysts
- Part of a broader effort at Vocativ that took graphics output from **5-6/month to 5-6/day**

```bash
❯ dataproofer data.csv

total rows 5035
rows sampled 1259

Missing or duplicate column headers: passed
Empty Cells: warn
Duplicate Rows: passed
Outliers from the median: info
Invalid coordinates: passed

75%
9 tests passed out of 12

### PROOFED ###
```
