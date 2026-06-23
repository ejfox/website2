# 📸 Project screenshot TODO

The forcing function. **23 project pages currently show only source code or a
raw desktop grab** — no real screenshot of the actual thing. Knock these out and
the `/projects` wall stops looking like a code dump.

All 232 existing project images load fine (no broken links). This list is purely
about *quality*: replacing `code.png` / `Screenshot_2025-…png` heroes with a shot
of the project actually doing its thing.

## The loop (memorize this)

```bash
# 1. capture  →  2. upload  →  3. paste md line  →  4. process
node scripts/capture.mjs upload /tmp/SHOT.png projects/<slug>/landing
#   prints: ![<slug>](https://res.cloudinary.com/ejf/.../projects/<slug>/landing.png)
# paste that as the FIRST image in content/blog/projects/<slug>.md, then:
yarn blog:process
```

`capture.mjs` launches its own headless Chrome on :9333 — **never pkill nuxt.**
Eyeball before wiring in: `node scripts/capture.mjs sheet /tmp/check.png /tmp/SHOT.png`

> ⚠️ TUI shots need VHS: `brew install vhs` (not currently installed).

---

## 🔴 Priority — single image, and it's just code (whole row = code)

These 12 have ONE image and it's a screenshot of source. Highest visual payoff.

- [ ] **cli-ai-chat** · CLI — `node scripts/capture.mjs tui "node src/cli.js" /tmp/cli-ai-chat.png --cd ~/code/cli-ai-chat --wait 3`
- [ ] **groundwave** · Nuxt web app — boot on `PORT=4321`, then `node scripts/capture.mjs page http://localhost:4321 /tmp/groundwave.png --wait 6000`
- [ ] **journo-llm** · Python CLI — `node scripts/capture.mjs tui "python main.py --help" /tmp/journo-llm.png --cd ~/code/journo-llm --wait 2`
- [ ] **outlast** · Vue app — boot local, `capture.mjs page http://localhost:4321 /tmp/outlast.png --wait 5000`
- [ ] **retroscope** · JS app — boot local, `capture.mjs page http://localhost:4321 /tmp/retroscope.png`
- [ ] **room302-template** · Nuxt template — boot local, `capture.mjs page http://localhost:4321 /tmp/room302.png`
- [ ] **scrapscroller** · JS — boot local, `capture.mjs page http://localhost:4321 /tmp/scrapscroller.png`
- [ ] **smallweb-starter** · Deno/Smallweb — boot, `capture.mjs page http://localhost:<port> /tmp/smallweb-starter.png`
- [ ] **transcript-video** · HTML/Canvas — open the demo, `capture.mjs page <url> /tmp/transcript-video.png --wait 4000`
- [ ] **vulpes-rss** · Rust **TUI** (Kitty graphics) — `capture.mjs tui "vulpes-rss" /tmp/vulpes-rss.png --cd ~/code/vulpes-rss --wait 3`
- [ ] **vulpesvg** · Tauri desktop — run app, screenshot window, `capture.mjs upload /tmp/vulpesvg.png projects/vulpesvg/app`
- [ ] **tmux-link-grab** · currently a `.gif` — fine to leave, or grab a clean still frame

## 🟠 Multiple images but ALL code/raw (no real screenshot anywhere)

- [ ] **clipgoblin** · Swift/macOS — Final Cut + app screenshot (the FCPXML markers)
- [ ] **cloudinary-backup-tool** · Tauri — run app, screenshot the backup UI
- [ ] **coach-artie** · Discord bot — screenshot a real conversation (or reuse the coachartie-showcase hero)
- [ ] **flipper-space-calculators** · Flipper Zero — qFlipper screen capture of the calculator running
- [ ] **git-status-dash** · Go CLI — `capture.mjs tui "git-status-dash" /tmp/git-status-dash.png --cd ~/code/git-status-dash --wait 2`
- [ ] **github-sloth** · Rust TUI — `capture.mjs tui "github-sloth" /tmp/github-sloth.png --cd ~/code/website2 --wait 3` (renders rich immediately)
- [ ] **nbcnews-specials** · external/old — archive screenshot or leave as-is
- [ ] **smallbot-mcp** · MCP — screenshot a generated Smallweb app (the *output*, not the code)
- [ ] **spectrum-synth** · Flipper + ESP32 — device photo or qFlipper capture of the spectrum UI
- [ ] **torchslit-ios** · Swift/iOS — Simulator screenshot, `capture.mjs upload /tmp/torchslit.png projects/torchslit-ios/app`
- [ ] **vulpino** · Swift/iOS — Simulator screenshot of the widget editor

## 🟡 Drop / fix weak shots (verified by eye)

- [ ] **glasses-hud** — remove `lenses.png` (empty "DROP HERE / L:0 R:0" state); `body`/`environment`/`messages` are fine
- [ ] **openrouter-census** — remove `tui.png` (empty terminal prompt); `dashboard.png` is the strong one
- [ ] **vulpes-devices** — `boot-animation.png` is a 1280×78 sprite strip (illegible in grid); needs a real device/animation still
- [ ] **hexagram-motion-graphics** — `coins.jpg` is sparse; optional drop (`grid`/`loom` carry it)

---

_Regenerate the "no real screenshot" list anytime: the signal is any project whose
images are all named `code*` / `Screenshot_*` / `IMG_*`. See git history of this
file for how it was derived._
