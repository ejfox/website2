---
title: Inter-Claude Deployment Architecture
date: 2025-12-01
tags: [claude, automation, deployment, indieweb]
hidden: true
---

# The Multi-Claude Deployment Setup

A genuinely unhinged but functional approach to automated deployment where Claude instances communicate across machines.

## The Architecture

```
Local Machine (Claude Code)
    │
    ├── Writes code
    ├── Commits to GitHub
    └── SSH sends message to VPS tmux session
            │
            ▼
VPS (Claude Code in tmux)
    │
    ├── Receives natural language request
    ├── Pulls from GitHub
    ├── Rebuilds Nuxt
    └── Restarts Docker container
```

## How It Works

1. **Local Claude** finishes a task and pushes to GitHub
2. **Local Claude** SSHs to VPS and types a message into the tmux session where **VPS Claude** lives:
   ```bash
   ssh vps "tmux send-keys 'Hey! I pushed 6 commits. Can you pull and rebuild?' Enter"
   ```
3. **VPS Claude** (if active) reads the message and executes the deployment
4. If VPS Claude is idle, Local Claude can just run the commands directly via SSH

## The Wild Part

This is literally two AI assistants coordinating via a tmux session like coworkers messaging each other on Slack. The "protocol" is just... English.

When VPS Claude was idle (sitting at a prompt), Local Claude just did the deployment directly:
```bash
ssh vps "cd /data2/website2 && git pull && yarn build && docker-compose up -d --build"
```

## Current Automation Stack

After this session, the setup is now:

1. **GitHub Action: Deploy** - Auto-deploys on push to main via SSH
2. **GitHub Action: Webmentions** - Sends webmentions after deploy
3. **Manual fallback** - Claude-to-Claude coordination if Actions fail

## Files Involved

- `.github/workflows/deploy.yml` - Auto-deploy action
- `.github/workflows/send-webmentions.yml` - Webmention automation
- `scripts/send-webmentions.mjs` - Webmention sender script

## Required GitHub Secrets

- `VPS_HOST` - VPS hostname/IP
- `VPS_USER` - SSH username
- `VPS_SSH_KEY` - Private SSH key

## The Philosophy

Why set up complex CI/CD pipelines when you can just have one AI ask another AI to do something in plain English? The overhead is a tmux session. The protocol is "yo can you rebuild?"

This probably shouldn't work, but it does.
