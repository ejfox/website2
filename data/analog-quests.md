# Analog Quests — the stuff only EJ can do (2026-07-13)

Everything automatable is done: 11 flagship/archive demo videos live in posts,
capture pipeline built, micro graphics shipped. What remains needs your voice,
your hands, or your keys. Ordered by impact-per-minute.

## Quest 1 · Voice rewrites — 7 flagship stubs (~15 min each)

Production only shows non-draft flagships. Currently live: ccrb-clusters,
nbc-big-board, dataproofer, pixel-canvas. These seven are `draft: true` factual
stubs waiting for the pixel-canvas treatment (your voice → flip draft → done).
The pixel-canvas rewrite is the template: open with the personal stake, land
the "opposite of a notification feed" move, close with the detail only you know.

Per-stub sparks (react to these, don't answer them literally):

- [ ] **motorcycle-viz** (326w — closest to done)
      What does 3.5 years of riding *feel* like averaged together? Was there a
      render that surprised you — a road that showed up in the average that you
      didn't expect to matter?
- [ ] **hexagram-motion-graphics** (122w)
      Why the I Ching, why Manim? What clicked when you saw the possibility
      tree render (now the lead video) — Leibniz? The 45,000-year-old binary?
- [ ] **scrapbook-core** (106w)
      A dozen sources into one database — what broke you into building it?
      What's the oldest scrap in there and does it embarrass you?
- [ ] **connectology** (102w)
      Who is this FOR? The Thiel funding network in the demo video is a story —
      what networks do YOU build in it when nobody's watching?
- [ ] **paramilitary-leaks** (116w)
      The Micah Lee collab — what was the moment the corpus became navigable?
      What could a reporter suddenly DO that they couldn't before?
- [ ] **gem-viz** (142w — also needs the real project name + link)
      Following a pipeline's ownership up to BlackRock — what did you trace
      first? Confirm the shareable name/link while you're in there.
- [ ] **flipper-generative-art** (193w)
      Ten gradient families dithered to 1-bit at 30fps — why does constraint
      (128×64, monochrome) make generative art BETTER?

After each rewrite: flip `draft: false`, then `yarn blog:process`. Each one
adds a flagship to the production page.

## Quest 2 · Photo Day (one session, phone + good light)

- [ ] **pixel-canvas hero** — the 320×240 display glowing on your desk, ambient
      scene visible, room dark-ish so the Vulpes palette carries. This replaces
      nothing — it joins the scene-rotation video as the post's opener.
- [ ] **flipper-generative-art on-device** — the patterns running live on the
      Flipper's screen. A 15-30s phone video works; I'll trim/compress/upload
      (`node scripts/capture.mjs upload <file> projects/flipper-generative-art/on-device`).
- [ ] Bonus while the light's good: any gear-closet glamour shot the gear page
      could use.

## Quest 3 · Keys & hosts (10 minutes of ssh)

- [ ] **VPS rsync** — PR preview deploys fail without it:
      `ssh vps 'sudo apt install -y rsync'` then rerun the preview workflow.
- [ ] **connectology.room302.studio 502** — the app is fine (verified locally);
      the host/process behind the Cloudflare route is down. Kick it, then the
      flagship's live URL works again.
- [ ] **scrapbook Supabase env** — drop real SUPABASE_URL/KEY where
      scrapbook-cli can see them and the scrapbook-core capture unblocks
      (VHS is installed and ready).

## Then the loop closes

Each finished quest feeds back into automation: voice rewrite → I reprocess and
the flagship goes live; device footage → I cut and embed it; creds/hosts → I
capture the remaining queue items. Ping me with whichever lands first.
