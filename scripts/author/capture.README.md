# capture.mjs — autonomous screenshot toolkit

A single self-contained CLI for banking screenshots into the `/projects`
portfolio. Replaces the old pile of scratch scripts (`up2.mjs`…`up11.mjs`,
`cdp-shot/scroll/clip`, `audit-*`, `cloudinary-explore`, `pull-project-images`).

No new deps — built-in `fetch`/`WebSocket` drive Chrome over the DevTools
Protocol; uploads use the `cloudinary` + `dotenv` packages already installed.

## The footgun it fixes

Capturing used to assume a Chrome was already running on `:9222`, and cleanup
meant `pkill -f "nuxt dev"` — **which killed website2's own dev server twice.**
This tool launches its **own** headless Chrome on a dedicated port (`9333`) with
a throwaway profile, and reuses it across runs. It never touches node processes,
so there is never a reason to pkill anything.

## Commands

```bash
# Full-page screenshot. --click clicks an element by visible text first.
node scripts/capture.mjs page <url> <out.png> [--click "Generate"] [--wait 5000]

# N evenly-spaced viewport shots down a long scrolly page.
node scripts/capture.mjs scroll <url> <outPrefix> [--count 6] [--wait 1300]

# Tight clips of individual elements (diagrams/figures on a whitespace page).
node scripts/capture.mjs clip <url> "svg, figure, canvas" <outPrefix> [--max 6] [--min-w 320]

# Upload one or more local files to Cloudinary (cloud "ejf").
node scripts/capture.mjs upload /tmp/hero.png projects/<slug>/landing

# Contact sheet to eyeball a batch before wiring it in (verification step).
node scripts/capture.mjs sheet /tmp/sheet.png /tmp/foo_*.png

# One-shot: capture a URL, upload to projects/<slug>/landing, print the md line.
node scripts/capture.mjs shoot <slug> <url> [--click "..."] [--wait 5000]

# Render a CLI / TUI to a clean, themed PNG (headless PTY via VHS).
node scripts/capture.mjs tui "<command>" <out.png> [--wait 3] [--cd dir] [--theme "Name"] [--width 1200] [--height 800] [--font 18]
```

## Screenshotting TUIs / CLIs

The `tui` command shells out to **[VHS](https://github.com/charmbracelet/vhs)**
(`brew install vhs`) — it runs your command in a real headless pseudo-terminal
and renders a crisp, padded, themed PNG. This is how terminal projects get into
the wall without screen-recording your actual desktop.

```bash
# A CLI that prints output and exits:
node scripts/capture.mjs tui "ls -la ~/code | head -25" /tmp/out.png --wait 1

# A project's own CLI, run from its dir:
node scripts/capture.mjs tui "node src/cli.js list" /tmp/out.png --cd /tmp/myrepo --wait 4

# Full-screen TUIs (git dashboards, etc.) render rich immediately:
node scripts/capture.mjs tui "github-sloth" /tmp/out.png --cd ~/code/website2 --wait 3
```

Notes:
- **REPLs** (prompt-and-wait) screenshot sparse — prefer a non-interactive
  subcommand that prints straight to stdout (e.g. `list`/`stats`/`explore`).
- Many "CLI" projects actually ship a hidden **web dashboard** (openrouter-census
  serves Observable Plot charts on a port) — that's usually the prettier shot, so
  check for a `serve`/`dashboard` script before settling for the terminal view.
- `--theme` takes any VHS theme name (e.g. `"Catppuccin Mocha"`); omit for the default.

## The full pipeline (live deployed site)

```bash
node scripts/capture.mjs shoot my-project https://my-project.example.com
# -> prints:  ![my-project](https://res.cloudinary.com/ejf/image/upload/projects/my-project/landing.png)
# paste that into content/blog/projects/my-project.md, then:
yarn blog:process
curl -s localhost:3006/api/projects | jq '.[] | select(.slug=="projects/my-project") | .metadata.images'
```

## The full pipeline (local app that needs booting)

Boot the app **on a non-3006 port** so it never clashes with website2's dev
server, then capture the live URL:

```bash
cd ~/code/some-app && PORT=4321 yarn dev &   # or npm run dev -- --port 4321
# wait for it to come up, then:
node scripts/capture.mjs page http://localhost:4321 /tmp/app.png --wait 6000
node scripts/capture.mjs sheet /tmp/sheet.png /tmp/app.png   # eyeball it
node scripts/capture.mjs upload /tmp/app.png projects/some-app/landing
kill %1   # kill THAT app, by job number — never `pkill -f "nuxt dev"`
```

## Cropping (ImageMagick)

`capture.mjs` doesn't crop — pipe through `magick` when you need to:

```bash
magick /tmp/app.png -gravity North -crop 1440x810+0+0 +repage /tmp/app_crop.png
```

## Finding screenshots you already took (embeddings index)

The `~/code/screenshot-embeddings` project has ~1700 of EJ's real screenshots
indexed. Three search angles, in order of reliability:

1. **OCR content** — regex over `ocr_preview` in `data/points.json`. Most
   reliable for "a screen that mentions X".
2. **Visual nearest-neighbour** — `scripts/visual_nn.py <seed.png> [N]` ranks the
   index by cosine on `visual_emb` in `data/embeddings.parquet`. Best for "more
   shots that look like this one".
3. **`git_top_repo` tag** — noisy: it tags a shot by the day's busiest repo, not
   its subject. Always visually verify with a `sheet` before trusting it.

Source images live in `~/screenshots`. Build a contact sheet of candidates and
look before wiring anything in — the tag is a hint, not ground truth.

## Conventions

- Cloudinary public_id: `projects/<slug>/<name>` (e.g. `.../landing`, `.../map`).
- New project pages start as `draft: true` with a `<!-- TODO (EJ) -->` stub —
  EJ's written voice is sacred; never fabricate prose. Drafts are dev-only.
- Image cap / sizing (50vh, natural aspect, no borders) is enforced in
  `components/projects/ProjectRow.vue`, not here.
