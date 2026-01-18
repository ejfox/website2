# The 2026 nvim + Claude Code + tmux Workflow

## The Problem

After ~1 year of Claude Code writing most of my code, I notice:
- Muscle memory atrophying (typing, vim motions, patterns)
- Less time "in the code" - more time reviewing
- The "hand it off" paradigm vs "pair programming" paradigm

## The Spectrum

```
[Full Manual] ←――――――――――――――――――――――――――→ [Full AI]
     ↑                    ↑                    ↑
  typing every         copilot            "claude, write
   character         ghost text            the whole thing"
```

**Where I want to be:** Somewhere in the middle. Copilot for the obvious stuff, Claude Code for the big refactors, but ME driving and understanding.

## The Setup

### Physical Layout
```
┌─────────────────────────────────────────────────────────────┐
│ tmux window                                                 │
│ ┌─────────────────────────┬───────────────────────────────┐ │
│ │                         │                               │ │
│ │      nvim               │      Claude Code              │ │
│ │   (left pane)           │      (right pane)             │ │
│ │                         │                               │ │
│ │   - editing             │   - big refactors             │ │
│ │   - navigation          │   - research                  │ │
│ │   - copilot ghost text  │   - questions                 │ │
│ │   - git diffs           │   - multi-file changes        │ │
│ │                         │                               │ │
│ └─────────────────────────┴───────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  dev server / logs (bottom pane, optional)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### The Flow

#### Small changes (stay in nvim):
1. Navigate to the spot (`gd`, `gr`, `<leader>ff`)
2. Let Copilot suggest (`Tab` to accept, `]s` to cycle)
3. Type it yourself if Copilot is wrong
4. `<leader>gs` to stage, lazygit to commit

#### Medium changes (nvim + Claude Code):
1. Select code in nvim, `<leader>yr` to yank with path
2. Paste in Claude Code: "refactor this to..."
3. Claude writes, nvim auto-reloads (hotreload.lua)
4. `<leader>gd` to review diff in snacks picker
5. Stage hunks with `<Tab>`, commit in lazygit

#### Big changes (Claude Code drives):
1. Describe what I want in Claude Code
2. Let it write across multiple files
3. Review with `<leader>gd` (snacks git diff)
4. `<Tab>` to stage good hunks, `<C-r>` to discard bad ones
5. Test, iterate

### Key Bindings I Actually Use

#### Navigation
- `gd` - goto definition
- `gr` - find references
- `gai` - who calls this? (incoming calls)
- `gao` - what does this call? (outgoing calls)
- `<leader>ss` - symbols in file
- `<leader>ff` - find files
- `<leader>fg` - live grep

#### Git (snacks pickers)
- `<leader>gd` - git diff (hunks) ← THE MAIN ONE
- `<leader>gs` - git status
- `<leader>gl` - git log
- `<leader>gi` - github issues
- `<leader>gp` - github PRs
- `<leader>gg` - lazygit

#### In snacks git diff:
- `<Tab>` - stage/unstage hunk
- `<C-r>` - restore (discard) change
- `<CR>` - jump to hunk
- `j/k` - navigate

#### Copilot
- `Tab` - accept suggestion
- `]s` / `[s` - next/prev suggestion
- `C-Right` - accept one word
- `C-l` - accept one line

#### tmux
- `M-c` - INSTANT copy entire pane (no prefix!)
- `M-v` - copy visible portion
- `C-a g` - lazygit popup
- `C-a Space` - copy mode
- `C-h/j/k/l` - navigate panes (seamless with nvim)

### Anti-Atrophy Practices

1. **Typing practice** - monkeytype sessions, keep WPM up
2. **Manual coding days** - sometimes disable Copilot, write it yourself
3. **Review everything** - don't just accept Claude's code, read it
4. **Understand before committing** - if you can't explain it, don't ship it
5. **Use the quiz** - `tips` command, keep the muscle memory fresh

### The Philosophy

> "a computer is a meta-tool — a tool for making tools. defaults are for everyone, meaning no one. yours should be useless to others, perfect for you."

Claude Code is a tool. Copilot is a tool. nvim is a tool. The goal is not to be replaced by them, but to be amplified by them.

The best flow keeps you:
- **Engaged** - you're thinking, not just approving
- **Learning** - you understand what's being written
- **Fast** - the tools accelerate you, not replace you
- **In control** - you can always drop to manual

## The Ctrl-Space Revelation (Incremental Selection)

Treesitter parses code into an AST. `<C-space>` lets you SELECT by structure, not by lines/chars.

```
Cursor here: |
                    ↓
<div class="card">
  <span>Hello |world</span>    ← start: selects "world"
</div>

<C-space> → selects "Hello world"
<C-space> → selects <span>Hello world</span>
<C-space> → selects the whole <div>...</div>
<C-space> → selects the parent component
<BS> → back down to the div
```

**This is semantic zoom. Not lines, not characters - MEANING.**

### The Moves

| Keys | Action |
|------|--------|
| `<C-space>` | Start/expand selection to parent node |
| `<BS>` | Shrink selection to child (in visual mode) |
| `<C-space><C-space>d` | Delete grandparent element |
| `<C-space><C-space>y` | Yank grandparent element |
| `<C-space><C-space>c` | Change grandparent element |
| `<C-space><C-space>>` | Indent grandparent block |

### Block-Level Text Objects

| Keys | Selects |
|------|---------|
| `vaf` / `daf` | Around function (with signature) |
| `vif` / `dif` | Inside function (body only) |
| `vat` / `dat` | Around HTML tag (whole element) |
| `vit` / `dit` | Inside tag (contents only) |
| `vaa` / `via` | Around/inside argument |
| `vac` / `vic` | Around/inside class |

### Why This Matters

This is **motorcycle coding**. You're not describing "delete the parent div" in English to Claude. You're *reaching out and grabbing it* with your hands.

The composable grammar: **selection + operator = action**
- Selection: `<C-space>`, `vaf`, `vat`, etc.
- Operator: `d` (cut), `y` (copy), `c` (change), `>` (indent)

Five keystrokes to move an entire component. No mouse, no shift-clicking, no "wait I missed a bracket".

## TODO

- [ ] Document the snacks git diff workflow in tips.txt
- [ ] Try `base = "main"` for PR reviews
- [ ] Experiment with Copilot panel (`M-Enter`) more
- [ ] Set up a "manual mode" toggle that disables AI?
- [ ] Drill: 20 reps of C-space selection daily until muscle memory

---

*Started: 2026-01-17*
*Status: draft*
