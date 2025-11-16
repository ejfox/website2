---
title: Dataproofer
date: 2015-11-03T00:00:00-05:00
modified: 2025-08-26T15:53:33-04:00
url: https://github.com/dataproofer/Dataproofer
tech: ['JavaScript', 'Electron', 'Data Quality', 'CSV']
featured: false
state: deployed
aiInvolvement: human-only
tags:
  - data
  - javascript
  - tool
  - journalism
---

Along with Gerald Rich and the Vocativ data team, I received a [Knight Prototype Fund](https://knightfoundation.org/articles/20-ideas-receive-support-knight-prototype-fund-media-and-information-projects/) grant to create [Dataproofer](https://github.com/dataproofer/Dataproofer) - an open source tool to check data for reliability, missing data, and outliers. Built as an Electron desktop app for journalists.

```bash
❯ dataproofer Criterion\ Channel\ videos\ v1.2.0-20190621\ -\ v1.2.0-20190621.csv

total rows 5035
rows sampled 1259

Missing or duplicate column headers: passed
Numeric cells: info
String cells: info
Empty Cells: warn
Special Letters & Characters: warn
Duplicate Rows: passed
Potentially missing rows: passed
Words at their character limit: failed
Integer at its SQL upper limit: passed
Summed integer at its upper limit: passed
Small integer at its SQL upper limit: passed
Big integer at its SQL upper limit: passed
Outliers from the mean: info
Outliers from the median: info
Invalid coordinates: passed
Void coordinates: passed

75%
9 tests passed out of 12

### PROOFED ###
```
