---
title: "GitHub Sloth"
date: 2026-05-01
category: "Tools"
featured: false
draft: false
url: https://github.com/ejfox/github-sloth
tech: ["Rust"]
state: deployed
ai-involvement: ai-assisted
tags:
  - cli
  - terminal
  - git
---

<!-- TODO (EJ): NEEDS A HERO IMAGE: a terminal screenshot. -->

A minimalist amber-on-black terminal UI for GitHub PRs, reviews, and checks, written in Rust. It is designed to be complementary to lazygit.

I wanted my own top-level minimalist view of all of my open work — most of my work collaborations happen through GitHub. It's part of a process of redesigning all of my tools and daily interfaces to the world with an eye towards exactly what I need and what serves me.

I've been having a lot of fun lately writing minimalist TUIs I can run in tmux panes — my workspace lately is often just a full-screen terminal with different tmux panes and windows, and I really like it when the interface is just text. It lets me think about the functionality and core offerings rather than diving into padding and spacing and layout the way I do in CSS and front-end.

![The PR rollup logic in Rust — status glyphs and age coloring](https://res.cloudinary.com/ejf/image/upload/projects/github-sloth/code.png)

![The TUI rendering — ratatui layout and styled spans for the PR list](https://res.cloudinary.com/ejf/image/upload/projects/github-sloth/code2.png)
