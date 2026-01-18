---
date: 2026-01-17T16:45:00-05:00
dek: Building a multi-interface AI assistant that lives in Discord, SMS, and the web
tags:
  - ai
  - programming
  - discord
  - chatbots
  - typescript
inprogress: true
---

# Coach Artie 2

## The Idea

A multi-interface AI assistant. Discord, SMS, web. Same brain, multiple bodies.

## Outline

### The Architecture

```
Discord/SMS → Capabilities (47324) → Redis → LLM → Response
                     ↓
                 SQLite (state, memory, config)
```

### Why Multi-Interface?
- Meet people where they are
- Discord for communities
- SMS for mobile/urgent
- Web for dashboard/config
- Same personality across all

### The Monorepo Structure

**Packages:**
- `capabilities` - The orchestrator brain
- `discord` - Discord.js integration
- `sms` - Twilio SMS handling
- `brain` - Web UI dashboard
- `shared` - Common utilities

### Technical Stack
- Node.js 20 + TypeScript
- Turborepo for monorepo management
- pnpm for package management
- Redis for state/queuing
- SQLite for persistence
- OpenRouter for LLM access

### The Capabilities System
- Modular skill system
- Each capability is a focused function
- Orchestrator decides which to invoke
- Extensible without core changes

### Memory & State
- Conversation history in SQLite
- Cross-platform memory (Discord context available in SMS)
- Config per-user, per-guild

### Cost Optimization
- OpenRouter for model flexibility
- ~$0.01 per message
- $5 free credit to start

## Screenshots

[Add Discord/web UI screenshots]

## Lessons Learned
- Multi-interface complexity
- State management across platforms
- Making AI feel consistent

## Links

- OpenRouter: https://openrouter.ai
- Discord Developer Portal setup guide included

