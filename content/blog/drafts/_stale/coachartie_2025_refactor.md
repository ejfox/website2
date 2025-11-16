---
date: 2025-01-01T00:00:00-05:00
modified: 2025-01-01T00:00:00-05:00
tags:
  - ai
  - projects
---

The new Coach Artie refactor has been split into discrete parts:

1. The Discord Client- a discord Bot responsible for interfacing with users through channels and DMs - future i/o interfaces are planned for SMS, and email.
2. Capabilities, a router that handles a manifest of all of the possible tools and capabilities, secret/authentication management, and proxying requests to the appropriate endpoint
3. Context Alchemy - a framework for generating a nicely mixed context window for the robot at appropriate times, informed by world context, user memories and history, and the user’s persistent profile.

One of the focuses has been on tenancy, the ability for someone new to spin up a Coach Artie of their own.

Currently, this means cloning both the discord client
