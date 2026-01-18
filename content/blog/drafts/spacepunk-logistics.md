---
date: 2026-01-17T16:45:00-05:00
dek: A space trucking game where the real enemy is enterprise software
tags:
  - gamedev
  - programming
  - satire
  - tauri
  - typescript
inprogress: true
---

# Spacepunk Logistics

## The Idea

A server-authoritative space trucking game where you manage the corporate nightmare of interstellar logistics through deliberately terrible enterprise software.

## Outline

### The concept
- Space trucking sim meets corporate satire
- The UI is intentionally bad enterprise software
- Managing logistics through forms and approvals
- The horror of space bureaucracy

### Why "deliberately terrible"?
- Satire of enterprise software
- The game mechanic IS the frustration
- Making mundane work feel epic (and awful)

### Technical architecture
```
Discord/SMS → Capabilities → Redis → LLM → Response
```
- Server-authoritative design
- SQLite for state (no Docker needed!)
- Tauri for cross-platform desktop app
- WebSocket for real-time updates

### God Mode Dashboard
- Development oversight panel
- Watching the simulation run
- Debugging the corporate nightmare

### The aesthetic
- Brutalist UI
- Forms within forms
- Loading spinners that lie
- Error messages that blame you

## Screenshots

[Add screenshots of the deliberately bad UI]

## The meta-joke

[How the game comments on real enterprise software]

## Links

- Local dev: `./run.sh` (THAT'S IT. NOTHING ELSE. EVER.)

