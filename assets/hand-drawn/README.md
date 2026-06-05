# Hand-drawn asset kit

Notebook marginalia — arrows, circled numbers, magnitude badges, boxes, numerals,
number-words, letters, textures — scanned, traced in Illustrator, and turned into
inline components.

## Using it

```vue
<HandDrawn name="circled-3" />                <!-- inline, tracks the text size -->
<HandDrawn name="arrow-right-long" size="2rem" />
<HandDrawn name="badge-10k" size="4rem" title="10,000 plays" />  <!-- title => exposed as an image -->
<HandDrawn name="box-xl" stretch />           <!-- frame that fills its parent -->
```

- Renders **inline SVG** and inherits `currentColor`, so it adapts to dark mode and
  sits in a sentence like a glyph. Set the color via normal CSS (`class="text-rose-500"`).
- `size` sets the height (number → px, string → any CSS length). Width follows the aspect ratio.
- Browse the whole library + integration demos at **`/hand-drawn`**.

## Using them organically (three hooks)

**1. In prose — the `:hd` directive** (build-time, like `:prediction` / `::gear`):

```md
The deploy is just pm2 reload :hd{name="arrow-bend-down-right"} read the logs.
Big year :hd[record]{name="badge-100k" size="3rem"}.
```

`remarkHandDrawn` turns it into `<span data-hd="…">`; `plugins/hand-drawn.client.ts`
swaps in the SVG. After editing markdown, run `yarn blog:process`.

**2. Automatic — no new syntax.** `plugins/hand-drawn.client.ts` upgrades existing
markup inside `.blog-post-content`: footnote markers ¹²³ → circled numbers ①②③
(1–12), and `<hr>` (`---`) → a hand-drawn divider. Old posts get it for free.

**3. On charts — `<HandDrawnAnnotation>`.** Point / circle / label coordinates over
any viz (SVG or canvas). Put it in a `position:relative` wrapper; use **%** for x/y
so marks track a responsively-scaled chart.

```vue
<div class="relative">
  <MyChart />
  <HandDrawnAnnotation x="67%" y="14%" name="arrow-down" label="all-time high" />
  <HandDrawnAnnotation x="40%" y="55%" name="circle-md" size="3rem" class="text-amber-500" />
</div>
```

`rotate`/`flipX` aim arrows; `anchor` ("center" | "tip" | "tail") sets how (x,y) maps to the mark.

## How it works (and how to add assets)

The 962-path sheet is **not** sliced into files. The full geometry lives once in
`public/hand-drawn/sprite.svg` as `<g id="hd-ink">`; each asset is just a **viewBox
rectangle** into that shared coordinate space. The component injects the sprite once,
then every `<HandDrawn>` is an `<svg :viewBox><use href="#hd-ink"/></svg>` cropped to
its region. One 500KB fetch, ~100 assets, and a new asset is four numbers.

Files:

| file | role |
|------|------|
| `master.svg` | source art (traced sheet) — source of truth |
| `catalog.json` | **the curated taxonomy** — `{name,group,sub,desc,x,y,w,h}` per asset |
| `CATALOG.md` | human-readable listing of every shape, grouped (generated) |
| `element-bboxes.csv` | raw per-element `x,y,w,h` from the browser `getBBox()` — provenance for the rects |
| `manifest.json` | **generated** — the catalog padded + carried into the app |
| `../../public/hand-drawn/sprite.svg` | **generated** — recolored shared geometry |

To add or rename an asset: find its region in `element-bboxes.csv` (or eyeball x/y/w/h
against `master.svg`), add/edit a line in `catalog.json`, then:

```bash
node scripts/buildHandDrawn.mjs   # rewrites manifest.json + sprite.svg
```

Groups (and their subgroups):

- **arrows** — straight · curved · bent · special · study
- **circled** — thin · bold  (circled numbers ①–⑫)
- **numbers** — display · script · teens
- **magnitudes** — text (100…100k) · badge (circled 1k/10k/100k)
- **boxes** — rect · square
- **circles** — ring · dot
- **letters** — set (A–Z) · circled · boxed
- **words** — cardinal (ONE–TEN)
- **textures** — star · fill (stipple/blobs) · divider · marks
