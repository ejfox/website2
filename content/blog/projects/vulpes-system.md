---
title: "Vulpes"
date: 2026-01-18T00:00:00-05:00
category: "Art"
featured: true
url: https://github.com/ejfox/vulpes.nvim
tech: ["Lua", "Swift", "Metal", "Rust", "Zig", "Tauri", "Flipper Zero"]
state: doing
ai-involvement: ai-assisted
tags:
  - vulpes
  - design
  - aesthetic
  - tools
  - hardware
---

I believe that if I spend so much time looking at and thinking about my computer, I want to have full control over the fonts and colors I look at — to make it cinematic, aesthetic, "me," and different. And it's so dope that when I go to coffee shops (true story), people stop me and say "that setup looks sick, can I give you my card in case I need a dev?"

Vulpes is what that belief turns into when you follow it all the way down. One palette — `#e60067` magenta, `#6eedf7` teal, near-black — and one fox glyph, pushed through every surface I touch: the editor, the terminal, the browser, the screensaver, and the little screens on the hardware in my bag. Each piece is a working tool. Together they're one look.

![The vulpes palette across a full terminal — waveforms, logs, and the fox mark](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-nvim/theme1.png)

## The editor

It started with [vulpes.nvim](/projects/vulpes-nvim): a cyberpunk neon colorscheme for Neovim — signature vulpes pink, teal comments, dark and light variants, and monthly color rotations. It ships matching themes for the rest of the terminal: wezterm, kitty, ghostty, alacritty, tmux, lazygit, bat, and fzf.

![The vulpes colorscheme rendering its own palette file in Neovim](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-nvim/editor.png)

[Vulpes Theme Lab](https://ejfox.github.io/vulpes-theme-lab/) is the live builder for it: tweak a base hue and a ±7° offset and watch nvim, lazygit, htop, and tmux recolor in real time.

![The theme lab — palette controls on the left, live nvim / lazygit / htop / tmux previews recoloring as you tune](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-theme-lab/previews.png)

## The devices

[Vulpes Devices](/projects/vulpes-devices) carries the same palette file out to seven hardware targets — Flipper Zero, OnionOS handhelds, the TD-H3 radio, Meshtastic nodes, a PortaPack, plus iPhone and iMac wallpapers — so everything boots in the same visual language.

![One look, many targets — the Vulpes glyph and palette generated across Flipper, OnionOS, TD-H3, Meshtastic, PortaPack, and the desktop](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-devices/devices.png)

![The Flipper Zero boot animation, generated straight from the palette — the fox, on a 128×64 monochrome screen](https://res.cloudinary.com/ejf/image/upload/projects/vulpes-devices/boot.gif)

## The screen when I walk away

[cyberdeck-saver](/projects/cyberdeck-saver) is a native macOS screensaver in Swift and Metal: a 5×5 grid of terminal panels typing out live data — ADS-B aircraft over the Hudson Valley, earthquakes, space weather, my own telemetry — through a CRT shader chain in the vulpes palette. No fake data; every byte comes from a real API or a system call.

![The Metal fragment shader behind the screensaver's CRT look](https://res.cloudinary.com/ejf/image/upload/projects/cyberdeck-saver/code.png)

## The rest of the kit

- **[Vulpes Browser](https://github.com/ejfox/vulpes-browser)** — a minimalist web browser in Zig, Swift, and Metal, rendered entirely on the GPU, with particle effects, link glow, and a two-pass bloom.
- **Vulpes RSS** — a TUI feed reader that renders images *inline* in the terminal by implementing the Kitty Graphics Protocol in pure Rust.
- **VulpeSVG** — a native visual SVG editor in Tauri and Vue, with a properties inspector for every element's geometry.

![The vulpes browser rendering ejfox.com](https://res.cloudinary.com/ejf/image/upload/projects/vulpes/browser.png)
