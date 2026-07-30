# Micro Graphics — research synthesis (2026-07-12)

Deep-research run (101 agents, claims 3-0 adversarially verified unless noted)
crossed with a full inventory of ejfox.com's existing micro-graphic vocabulary.
The question: what is the "micro graphics" trend, who does it well, and how does
it apply here **utilitarian and non-forced** — every mark backed by real data.

## The lineage (all verified to primary sources)

Three strands converge:

1. **Tufte sparklines** — "small, intense, word-sized graphics with typographic
   resolution," embeddable anywhere a word or number can appear. His purity
   standard: data-ink ratio 1.0, "no non-data at all." And the kicker — his
   original 1983 *chartjunk* definition names **excess ticks and over-busy
   grids first**: the literal micro-graphics texture kit is the first-listed
   junk when it carries no data.
   ([tufte: sparklines history](https://www.edwardtufte.com/notebook/sparklines-history-by-tufte-1324-to-now/),
   [theory & practice](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/))
2. **Swiss grid rationalism** — Müller-Brockmann's "objective, functional,
   aesthetic quality of mathematical thinking." Documented failure mode:
   over-annotation reads mechanical and cold. (medium confidence, single
   secondary source corroborated against *Grid Systems*, 1981)
3. **Sci-fi FUI, explicitly cited** — the Arwes framework names Star Citizen /
   Halo / TRON: Legacy as ancestors and ships the vocabulary as npm packages:
   `@arwes/frames` (SVG corner brackets, ResizeObserver + dynamic viewBox),
   `@arwes/bgs` (dot grids, moving lines). ([arwes.dev](https://arwes.dev/))

## Who does it now

- **Vercel Design Engineering** — a named team (2024 blog post, five credited
  engineers). Rauno Freiberg is the most-cited individual; philosophy is
  *restraint*: "subtle craft where the intricate details almost fade into the
  background." ([vercel.com/blog/design-engineering-at-vercel](https://vercel.com/blog/design-engineering-at-vercel), [rauno.me/craft](https://rauno.me/craft))
- **Devouring Details (2025)** — Freiberg's interactive book; the canonical
  artifact. Prototype names that map to real site data: **Line Minimap, Scroll
  Strip, Radial Timeline, Line Graph**. ([devouringdetails.com](https://devouringdetails.com/))
- **The "Linear Look"** — the searchable parent-trend name (Alex Trost,
  Frontend Horse, Feb 2024). 2024 canon: Linear, Vercel, Supabase, Raycast,
  Resend, Clerk, Railway, AuthKit. Caveat: centers dark/glow/bento; its
  decorative circuitry (labeled nodes connected to nothing) is the anti-pattern.
  ([frontend.horse/articles/the-linear-look](https://frontend.horse/articles/the-linear-look))

## Implementation techniques (verified)

- **Dotted grid/divider lines**: CSS `repeating-linear-gradient` on absolutely
  positioned pseudo-elements — Freiberg: "I borrowed from Stripe." Crisper and
  more controllable than `border-style: dotted`.
- **Word-sized charts**: zero-dependency SVG (fnando/sparkline proves the
  floor: 545★, empty dependencies field). We already have D3 — no new deps.
- **Corner-bracket frames**: responsive SVG paths in percentage coordinates
  (the Arwes approach), never raster.

## The honesty rubric (the useful part)

- **Tufte's test**: does the mark encode data? Data-ink ratio of the mark → 1.0.
- **Few's test** (The Chartjunk Debate, 2011): a non-data embellishment is
  legitimate ONLY if it (a) engages, (b) emphasizes what merits emphasis, or
  (c) makes the message memorable — and never distracts or misrepresents.
- **Freiberg's test**: details should recede, not decorate.
- **House rule discovered today**: `curl` the prod endpoint FIRST. Two of three
  proposed micro graphics died on data verification (chess API is 401 in prod,
  GitHub commit detail is empty). An instrument with no gauge behind it is
  costume by definition.

## Shipped today (all pass the rubric)

- **Prediction ledger pips** (`pages/predictions/index.vue`) — one linked pip
  per prediction, chronological; green/red/hollow = correct/wrong/open.
- **Writing cadence strip** (`pages/blog/index.vue`) — 24 months of
  posts-per-month, zero months rendered as baseline ticks (the gaps are data).
- **Typing WPM form strip** (`components/stats/MonkeyTypeStats.vue`) — recent
  tests as bars vs all-time best, `N TESTS · BEST 189 · AVG 129` caption.

## Backlog — honest opportunities (each names its data source)

1. **Tufte 45° audit** of the existing stem plot + sparklines: resize so
   average hill-slopes ≈ 45° (Cleveland banking). An upgrade, not an addition.
2. **Stripe/Vercel dotted dividers** for real data boundaries only: year
   markers on /blog, category sections on /projects, gear-table containers.
3. **Line Minimap** of post length in blog post margins (words per section
   from the existing TOC/headers metadata in processed JSON).
4. **Scroll Strip** for /threads (the 350vh canvas begs for a position strip).
5. **Radial Timeline** of prediction deadlines (content/predictions dates).
6. **Letterboxd rating distribution** pips on /stats (`.letterboxd` verified
   live in prod aggregate).
7. **RescueTime week strip** — 7 tiny productive-hours bars (`.rescueTime`
   verified live).
8. **Sleep/body micro-readout** from `.health.thisWeek` (verified live) — the
   pixel-canvas ethos, on the web.
9. **Gear container weight pips** already half-exist — audit against the 45°
   rule and the Few test rather than adding more.
10. **Corner brackets**: ONLY candidate that passes = framing the live-stats
    panel (a genuine data region fed by stats-lite). Anywhere else: chartjunk.

Accessibility note: no verified evidence either way on 8-10px mono labels —
keep micro text redundant with accessible text, never the sole carrier.
Sub-11px text should be enhancement, not information.
