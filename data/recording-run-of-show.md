# Recording Run-of-Show — one session, max reusable footage

The move you were circling: record ONE narrated screen session, then let Claude
harvest it three ways — muted demo clips for the page, your spoken story as
source for the voice rewrites, and a behind-the-scenes cut for launch/social.

**Golden rule:** don't record what `capture.mjs` can grab headlessly (the ~70
web/URL projects — those are Claude's job, no performance anxiety). Record only
what needs your hands, your keys, or your voice.

---

## Section 0 · Pre-flight (NOT recorded — ~10 min of ssh)

Do these first so the apps are actually live when you hit record. From
`analog-quests.md` Quest 3:

- [ ] `ssh vps 'sudo apt install -y rsync'` — unblocks PR preview deploys
- [ ] Kick the **connectology.room302.studio** host — it's 502 (app is fine
      locally). Needs to be up for the flagship demo + live URL.
- [ ] Drop real `SUPABASE_URL` / `SUPABASE_KEY` where `scrapbook-cli` can see
      them — unblocks the scrapbook-core capture.

Also boot locally, in tabs, before recording (so there's no dead air):
- connectology: `NUXT_DISABLE_AUTH=true yarn dev`
- motorcycle-viz, gem-viz, paramilitary-leaks, flipper-generative-art repos

---

## Section 1 · Rec setup (2 min)

- QuickTime/OBS, record **screen + mic + system audio**.
- Clean desktop, hide bookmarks bar, dark mode consistent (Vulpes palette reads).
- One monitor for the app, this file on the other (or your phone).
- The demo clips ship **muted + looping** on the page, so your narration never
  collides with them — talk freely; the voice track is for the rewrites + BTS.

---

## Section 2 · Flagship tour — "boot it, drive it, tell its story"

Seven `draft: true` flagship stubs. Each one you finish flips a flagship LIVE
(flagships are 80% of the page). For EACH: **boot → drive it 20–30s → react to
the spark out loud.** The 20–30s of you driving = the demo video Claude can't
auto-capture cleanly. Your spoken answer = the raw material for the rewrite.

Ordered by readiness + narrative punch — don't answer the sparks literally,
just riff:

1. **motorcycle-viz** (326w, closest to done)
   Drive: pan the averaged-ride renders.
   Spark: what does 3.5 years of riding *feel* like averaged together? Was
   there a road that showed up in the average you didn't expect to matter?

2. **hexagram-motion-graphics** (122w — 55 finished clips already in
   `~/code/hexagram-motion-graphics/media/videos`)
   Drive: the possibility-tree render (already the lead video) + one more clip.
   Spark: why the I Ching, why Manim? What clicked — Leibniz? 45,000-year binary?

3. **connectology** (102w — once un-502'd)
   Drive: shuffle/re-layout the force graph; open the editor.
   Spark: who is this FOR? What networks do YOU build when nobody's watching?

4. **gem-viz** (142w — ALSO needs the real project name + shareable link)
   Drive: trace a pipeline's ownership up to BlackRock.
   Spark: what did you trace first? Say the real name/link on camera so I can
   wire it in.

5. **paramilitary-leaks** (116w)
   Drive: navigate the corpus.
   Spark: the Micah Lee collab — the moment it became navigable. What could a
   reporter suddenly DO that they couldn't before?

6. **flipper-generative-art** (193w — device shot is Photo Day, but…)
   Drive on screen: the 10 gradient families / the render code at 30fps.
   Spark: why does constraint (128×64, monochrome) make generative art BETTER?

7. **scrapbook-core** (106w — once Supabase'd)
   Drive: `scrapbook-cli` / `yarn doctor:status` with real data (VHS ready).
   Spark: a dozen sources into one DB — what broke you into building it? Oldest
   scrap in there, and does it embarrass you?

**After the session, per stub:** I transcribe your riff → draft in your voice
(pixel-canvas is the template: personal stake → the "opposite of a notification
feed" move → the detail only you know) → you approve → flip `draft: false` →
`yarn blog:process` → flagship goes live.

---

## Section 3 · Tool demos — where your usage IS the demo (optional, same session)

A few terminal/interactive tools read better as "watch EJ actually use it" than
as a headless capture. Pick 3–5 you love and drive them for 15s each. Good
candidates from the queue: `cli-ai-chat`, `tmux-link-grab`, `music-cli`,
`git-status-dash`, `showtouch`. (For pure-output terminal tools, skip this —
VHS tapes make cleaner gifs than a live take.)

---

## Section 4 · Photo Day (SEPARATE — phone, good light, not screen rec)

From Quest 2. One session, dark-ish room so the palette carries:
- [ ] **pixel-canvas hero** — the 320×240 display glowing on the desk, ambient
      scene visible. Joins the scene-rotation video as the post opener.
- [ ] **flipper-generative-art on-device** — patterns running live on the
      Flipper screen; 15–30s phone video is plenty. EJ wants REAL camera for
      this one, not just phone. Same session: **flipper-space-calculators**
      (the time-dilation app) — shoot both while the device is out.
- [ ] Bonus: any gear-closet glamour shot the gear page could use.

Hand me the files: `node scripts/capture.mjs upload <file> projects/<slug>/<name>`
and I trim/compress/embed.

---

## The harvest (what I do with the footage after)

1. **Demo clips** — pull each 20–30s app-driving segment, trim to the clean
   loop, strip audio, upload under `projects/<slug>/`, embed the `.mp4` in the md.
2. **Voice rewrites** — transcribe your narration, draft the 7 stubs in your
   voice, you approve, I flip drafts + reprocess.
3. **BTS / launch cut** — the continuous narrated session is its own artifact;
   I can rough-cut a 60–90s "how the projects page got made" for social.
4. **Pile A in parallel** — while you record, I run `capture.mjs` on the ~70
   automatable URL/repo projects so the long tail fills itself in.

Then: page is full → merge PR #30.
