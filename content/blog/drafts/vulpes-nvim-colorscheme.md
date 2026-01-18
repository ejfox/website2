---
date: 2026-01-17T16:45:00-05:00
dek: Creating a cyberpunk neon colorscheme for Neovim that balances vibes with utility
tags:
  - neovim
  - colorscheme
  - design
  - tools
  - programming
inprogress: true
---

# Making vulpes.nvim

## The Idea

A cyberpunk neon single-color(ish) scheme for Neovim that tries to find a balance between vibes and utility.

## Outline

### The Aesthetic Goal
- Cyberpunk neon
- Mostly monochromatic with accent colors
- Readable, not just pretty
- Works in dark environments

### The Palette

**Core Colors:**
- Background: Pure black (`#000000`)
- Foreground: Soft pink (`#f2cfdf`)
- Base accent: Hot pink (`#e60067`)
- Comments: Teal (`#6eedf7`)

**Why these choices:**
- High contrast for readability
- Accent colors that pop without overwhelming
- Teal comments stand out but don't distract

### What's Included

```
Neovim         Terminals       TUI Apps        Bonus
──────         ─────────       ────────        ─────
◆ 100+ hlgroups   ◆ Ghostty       ◆ tmux          ◆ MapLibre
◆ Treesitter      ◆ Kitty         ◆ lazygit       ◆ GLSL shaders
◆ LSP             ◆ Alacritty     ◆ Yazi
◆ Lualine         ◆ WezTerm       ◆ fzf
◆ 15+ plugins                     ◆ bat
```

### The Extras

**Terminal configs:**
- Ghostty, Kitty, Alacritty, WezTerm
- All with matching ANSI colors

**TUI configs:**
- tmux statusline
- lazygit theme
- Yazi file manager
- fzf colors
- bat syntax highlighting

**Shaders:**
- `vulpes-tft.glsl` - subtle LCD subpixel effect
- `vulpes-chromatic.glsl` - CRT chromatic aberration

**MapLibre:**
- Cyberpunk map style for geographic visualizations

### Design Decisions

**Why pure black background?**
- OLED friendly
- Maximum contrast
- True dark mode

**Why pink/magenta accent?**
- Distinctive
- Works with most syntax
- Cyberpunk aesthetic

**Why teal for comments?**
- Complementary to pink
- Stands out without screaming
- Easy to scan

### Configuration Options

```lua
require("vulpes").setup({
  transparent = false,
  italic_comments = true,
  cursor_color = "base",  -- "base" (pink) or "white"
})
```

## Screenshots

[Add Neovim screenshots with different filetypes]

## Links

- GitHub: https://github.com/ejfox/vulpes.nvim
- Install: `{ "ejfox/vulpes.nvim" }`

