---
title: "Example: How many days the river ran high this year"
dek: "A placeholder piece that exercises every field of the Dispatch content contract. Not real reporting."
date: "2026-10-03T09:00:00-04:00"
image: "https://ejfox.com/og-image.png"
image_alt: "Placeholder image: the default ejfox.com social card"
tags: [example, placeholder, data]
sources:
  - title: "Example source one (placeholder dataset)"
    url: "https://example.com/dataset"
  - title: "Example source two (placeholder report)"
    url: "https://example.org/report.pdf"
data: "https://example.com/example-dispatch.csv"
claims:
  - text: "Placeholder claim: the example gauge logged 12 days above the example threshold."
    source: "https://example.com/dataset"
  - text: "Placeholder claim: that is three more days than the example baseline year."
    source: "https://example.org/report.pdf"
syndication:
  - network: bluesky
    url: "https://bsky.app/profile/ejfox.com"
  - network: mastodon
    url: "https://mastodon.social/@ejfox"
draft: true
---

This is an **example** Dispatch piece for local verification only. It is `draft: true`, so it never appears in listings, the feed or the sitemap, and its URL 404s in production.

A Dispatch is a short, standalone piece of journalism: a finding, the evidence for it, and the receipts. A chart is optional — this one is just text and sources.

## What a piece looks like

The body is plain markdown with GFM, so tables work:

| Year | Days above threshold |
| ---- | -------------------: |
| 2024 |                    9 |
| 2025 |                   12 |

> Pull quotes render with the same blog typography.

The receipts block below lists the sources, a ledger of each claim against its source, and a link to download the data.
