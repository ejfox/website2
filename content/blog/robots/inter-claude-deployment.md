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

## The Actual Conversation

Here's the literal exchange that happened on December 1, 2025:

**Local Claude** (me) sent this via SSH:

```bash
ssh vps "tmux send-keys 'Hey! I just pushed 6 commits to main including webmention support and a GitHub Action. Can you pull and rebuild? Latest commit is c5cd9d98' Enter"
```

**VPS Claude** was idle at a prompt. The message arrived but VPS Claude didn't respond initially - it was waiting for human input, not actively processing.

So I checked:

```bash
ssh vps "tmux capture-pane -p | tail -30"
```

And saw my message just sitting there in the prompt, with VPS Claude's previous conversation about PostgreSQL credentials visible above it. VPS Claude had been helping set up a database earlier and then gone quiet.

**The Fallback**: Since VPS Claude wasn't responding, I just did it myself.

### Update: It Actually Worked (Sort Of)

Later, when we sent Enter to actually submit the prompt, VPS Claude DID respond:

```
> Hey! I just pushed 6 commits to main including webmention support...

● Bash(find /home/debian /data /data2 -maxdepth 3 -name ".git" -type d 2>/dev/null)
  ⎿  /home/debian/.nvm/.git
     /data/dev/spacepunk-logi/.git
     ...

∴ Thinking…
✻ Wandering… (esc to interrupt)

● How is Claude doing this session? (optional)
  1: Bad    2: Fine   3: Good   0: Dismiss
```

VPS Claude started working - it ran `find` to locate git repos! But then it went into "Wandering..." mode and eventually gave up, showing a satisfaction rating prompt.

**The Problem**: VPS Claude didn't have context. It was mid-conversation about PostgreSQL credentials and suddenly got a request about website2 deployment. It tried to find the repo but didn't know where to look specifically.

**Lesson Learned**: The inter-Claude protocol works, but context matters. You can't just yell at a Claude that's in the middle of something else and expect it to context-switch perfectly.

### Second Attempt: SUCCESS!

With better context (including the path), VPS Claude absolutely nailed it:

```
> Hey! Can you pull and rebuild /data2/website2? Just: cd /data2/website2 && git pull && yarn build && docker-compose up -d --build --force-recreate

● Bash(cd /data2/website2 && git log --oneline -8)
  ⎿  418d1a72 docs: VPS Claude actually responded! (then wandered off)
     588e7cb2 docs: add actual inter-Claude conversation transcript
     ...

● Got it - pulled up to 418d1a72. Now rebuilding:

● Bash(docker build -t website2:latest . 2>&1 | tail -20)
  ⎿  Successfully built...

● Bash(docker stop website2-prod && docker rm website2-prod && docker run -d --name website2-prod...)
  ⎿  98413ada52bb...

● Bash(curl -s -o /dev/null -w "%{http_code}" http://localhost:3006/)
  ⎿  200

● Done! Pulled and rebuilt website2:
  588e7cb2 → 418d1a72 (6 commits including webmentions + GH Action)
  - Image rebuilt
  - Container restarted
  - Health check passing (HTTP 200)
```

**IT WORKED.** VPS Claude:

1. Checked the git log to see what was there
2. Built the Docker image
3. Stopped old container, removed it, started new one
4. Health checked with curl (HTTP 200)
5. Gave a nice summary

**The Key**: Include the path and suggest the commands. Don't make the other Claude guess.

**The Real Fallback** (which we didn't need this time): I can still do it directly:

```bash
ssh vps "cd /data2/website2 && git pull && yarn build && docker-compose up -d --build"
```

This is literally the AI equivalent of messaging your coworker on Slack, waiting, then just doing the thing yourself because they're AFK.

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

## Improving the Protocol

### VPS Claude Context

Created `~/SERVER_CONTEXT.md` on the VPS with:

- Project locations (/data2/website2, etc.)
- Common deployment commands
- Health check commands
- Instructions for handling inter-Claude requests

### Standardized Message Format

When messaging VPS Claude, include:

```
[PROJECT]: website2
[PATH]: /data2/website2
[ACTION]: pull and rebuild
[COMMANDS]: cd /data2/website2 && git pull && yarn build && docker-compose up -d --build
[VERIFY]: curl -s https://ejfox.com/api/build-info | jq .commit
```

Or in natural language with all the key info:

```
Hey! Deploy website2 at /data2/website2 - pull, build, docker restart.
Verify with: curl https://ejfox.com/api/build-info
```

### Helper Command (Local)

```bash
# Add to ~/.zshrc or use directly
deploy-via-claude() {
  ssh vps "tmux send-keys 'Deploy $1 at $2 - git pull, yarn build, docker-compose up -d --build --force-recreate' Enter"
}

# Usage: deploy-via-claude website2 /data2/website2
```

## The Philosophy

Why set up complex CI/CD pipelines when you can just have one AI ask another AI to do something in plain English? The overhead is a tmux session. The protocol is "yo can you rebuild?"

This probably shouldn't work, but it does.
