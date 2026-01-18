---
date: 2023-01-19T01:26:10-05:00
modified: 2025-08-28T22:04:54-04:00
draft: true
dek: In which we discover that the best workflow system ever created is hiding in plain sight, and most developers are using it completely wrong
tags:
  - workflow
  - github
  - productivity
  - methodology
---

## How I Use GitHub (The Way GitHub Actually Works Internally)

I contracted with GitHub in 2014, worked with `caged` to create their Octoverse report - and I learned how they worked internally. It was the best shit I've ever seen in my goddamn life.

Issues for everything. You can run your kanban off the issues if you write them right. Do all your documentation and decision making in the comments. Link it up to bots so your comms are automatically sent to your chatrooms. If you follow the "GitHub way" your life as a developer and human will just be so much better.

I've been working that way for eleven years now. Every team I run, it's one of the main things I implement. Any team I'm part of, it's a huge indicator as to how stressful it will be to work there and how organized the project will be.

### The GitHub Way: Issues as Universal Project Language

Most people use GitHub Issues like a basic bug tracker. GitHub uses Issues as the foundational communication layer for everything:

**Every conversation gets an Issue:**
- New feature ideas
- Bug reports
- Questions about architecture
- Meeting notes and decisions
- Documentation requests
- Even administrative stuff

**Why this works:** Issues create a permanent, searchable, linkable record of every decision. No more "I think we discussed this in Slack three months ago" - everything has a URL and a history.

### The Magic: Issues Become Your Kanban

Here's what most people miss - Issues aren't just for tracking bugs. They're your project management system:

**Use labels as workflow states:**
- `backlog` - Ideas we might do someday
- `ready` - Defined and ready to start
- `in-progress` - Currently being worked on
- `review` - Done, waiting for feedback
- `done` - Shipped and closed

**Projects view becomes your dashboard:** GitHub's built-in project boards let you drag Issues between columns. Suddenly your entire workflow is visual and everyone can see what's happening.

### Decision Making in Comments

This is where it gets powerful - every Issue becomes a decision thread:

**Document the why, not just the what:**
- Attach screenshots, mockups, error logs
- Link to related Issues and PRs
- Tag people for input (`@username what do you think about…`)
- Record the final decision in a comment

**Bot integration:** Connect GitHub to Slack/Discord so Issue updates automatically post to relevant channels. Your team stays informed without constantly checking GitHub.

### The Stress Test: How GitHub Usage Predicts Team Health

After eleven years, I can predict how stressful a project will be just by looking at their GitHub usage:

**Red flags (high stress teams):**
- Empty or generic Issue descriptions
- No labels or organization system
- Decision making happens in private Slack/email
- Issues get created and abandoned
- No clear workflow states

**Green flags (smooth teams):**
- Detailed Issue descriptions with context
- Consistent labeling and milestone usage
- Active discussion in Issue comments
- Clear workflow from idea to completion
- Regular issue grooming and organization

### Where Most Teams Get This Wrong

They treat GitHub like just a code repository instead of a project operating system. They're missing that Issues can replace:

- Scattered project management tools (Asana, Trello, Google Docs)
- Fractured decision logs across channels (email chains, meeting notes)
- Feature request tracking (separate ticketing systems, product manager sticky notes)

### Setting Up the GitHub Way

**Start small:**
1. Create Issue templates for common types (bug, feature, question)
2. Set up basic labels (backlog, ready, in-progress, review, done)
3. Use one Project board to visualize your workflow
4. Connect to your chat app for notifications, and move product decisions out of chat and*onto GitHub with intention* so they are recorded properly

**Build the habit:**
- Every conversation that leads to a decision gets an Issue
- Every new feature or screen is captured by an issue, somewhere, somehow
- Link Issues to Pull Requests when you implement
- Close Issues with detailed "why" in the final comment, or even better, [close them automatically](https://stackoverflow.com/questions/12235620/automatically-closing-issue-from-pull-request-in-github) with PRs
- Review and organize Issues weekly
