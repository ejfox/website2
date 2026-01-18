---
date: 2026-01-17T16:45:00-05:00
dek: Building a personal intelligence network with Deno, Hono, and public data sources
tags:
  - programming
  - osint
  - journalism
  - deno
  - privacy
  - tools
inprogress: true
modified: 2026-01-17T16:53:26-05:00
---

## The OSINT Tools Suite

### The Idea

A collection of monitoring tools that aggregate public data into a personal intelligence dashboard. Flight tracking, SEC filings, campaign finance, website changes - all in one place.

### The Tools

#### SKYWATCH
- ADS-B flight tracking for a geographic area
- OpenSky Network integration
- Track interesting aircraft movements

#### EGOSCAN
- Identity & exposure monitoring
- Have I Been Pwned for breaches
- Typosquat detection
- DNS monitoring
- Shodan for network exposure

#### CHANGEWATCH
- Website change detection
- Diff tracking over time
- Catch when pages update

#### FILINGWATCH
- SEC EDGAR filings
- CourtListener for court records
- Track legal/financial movements

#### AUCTIONWATCH
- Government surplus auction monitoring
- GSA Auctions, GovPlanet
- Find deals on weird government stuff

#### CONTRACTWATCH
- USASpending.gov tracking
- Federal contracts database
- Follow the money

#### DONORWATCH
- FEC campaign finance
- Track political contributions
- Who's funding whom

#### COUNTYWATCH
- County records aggregation
- Local news monitoring
- Hyperlocal intelligence

#### OMNISEARCH
- Meta-search across all databases
- Unified query interface

### Technical Stack

- **Deno** runtime
- **Hono** framework
- **SQLite** for each tool
- **Smallweb** hosting with wildcard subdomains
- Cyberpunk CSS aesthetic

### The Philosophy

- All data sources are public/free
- Self-hosted, no cloud dependencies
- Cron-based automated monitoring
- Personal sovereignty over information

### Use Cases

- Journalism research
- Personal security monitoring
- Civic engagement
- Curiosity

### Ethical Considerations

[Discuss responsible use of OSINT tools]

### Links

- Each tool runs on its own subdomain
- Consistent API: `/check`, `/api/stats`, `/api/search`

