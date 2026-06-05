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
| `regions.csv` | `id,x,y,w,h,n` bounding boxes for every ink cluster (from browser `getBBox`) |
| `names.json` | which clusters to publish + names/categories, plus hand-tuned circled-number rects |
| `manifest.json` | **generated** — `[{name,cat,x,y,w,h}]`, imported by the component |
| `../../public/hand-drawn/sprite.svg` | **generated** — recolored shared geometry |

To add or rename an asset: find the region in `regions.csv` (or eyeball x/y/w/h against
`master.svg`), edit `names.json`, then:

```bash
node scripts/buildHandDrawn.mjs
```

Categories: `arrow`, `circled`, `number`, `box`, `shape`, `word`, `letter`, `texture`.
