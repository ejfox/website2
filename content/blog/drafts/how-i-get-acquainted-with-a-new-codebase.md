---
date: 2025-03-05T10:10:06-05:00
modified: 2025-08-29T14:10:02-04:00
tags:
  - code
  - howto
  - process
  - coding
  - programming
  - workflow
## How I get acquainted with a new codebase
---

## Step Zero: Get It Running Locally

Before anything else, I need the application running on my machine. This is non-negotiable—you can't really investigate anything until you can see it work. I strongly recommend doing this with someone on a live call. They haven't had to onboard to this system in maybe 6 months or a year, so things that worked when they set up might not work anymore. Your fresh eyes and their institutional knowledge make a powerful debugging combo.

## Read the README (Even If It Sucks)

If it has a README, I read it. Even if it's old, even if a robot wrote it. You don't want to be the idiot asking a question that's answered in the README—even poorly.

## Front-End Applications: Follow the User Journey

For front-end apps, I trace the user's path through the code:

**Index → Components → Routing → State → Data**

- Where's the home page? What does index.js/index.html actually render?
- Where are the components organized? What's the folder structure philosophy?
- How is routing handled? Custom solution or standard library?
- Is there a store? What state management approach?
- Is there a database? Can I see the schema? Can I run one locally?

The router is usually my first deep dive—what URLs does this site support? Is there a list of them somewhere?

## Backend Applications: Find the Scaffolding

For backend systems, I look for the structural files first:

- **Makefile** - How do they actually run this thing? What are the common commands?
- **Dependency file** - package.json, requirements.txt, Gemfile - what libraries am I dealing with?
- **Docker files** - Dockerfile, docker-compose.yml - how does this thing build? Does it need a database?
- **Recent activity** - I surf GitHub for recently changed files, active PRs, files with the most recent commits

This gives me the landscape before I start exploring the actual logic.

## Data Applications: Start at the Source

For data processing or analysis applications, I start at the top: Where does data come in? What's the source file or API? Is there a file that orchestrates a series of processes or are they run ad-hoc by hand?

## The First PR: Proof of Concept

My goal is to make a PR on day 1-2. Something super simple—a copy change, a CSS tweak, anything. This isn't about shipping meaningful features yet. It's about proving the entire development process works end-to-end: I can make changes, test them locally, create a PR, get it reviewed, and see it deployed.

This first PR teaches me their deployment process, PR review culture, testing requirements, and any gotchas in their pipeline.

## Document What You Learn

I'm constantly taking notes and making diagrams—Scapple, Mermaid charts, and increasingly my own tool Connectology. I mirror this internal knowledge back to the subject matter experts in a way that sparks joy for them, which keeps me excited.

These diagrams often reveal inefficiencies or make people say "yeah, I know it's less than ideal." I'm not judging them—constraints create complexity, and every codebase has baggage. But these visualizations might bring value down the line, helping the team see their own system with fresh eyes.

## The Secret: Talk to People First

Here's what most developers miss: you're not just a code detective, you're a people detective. Someone once said "Never solve problems with technology you can solve by talking to people"—and this applies doubly to understanding codebases.

The person who built the authentication system can explain in 30 seconds what would take you hours to reverse-engineer. The PM who requested that weird feature can tell you why the code looks hacky (spoiler: it was supposed to be temporary). The designer who created those components can explain the naming conventions that seem random.

You're not just reading code—you're reading the humans who wrote it, the history of the decisions behind them, the constraints they faced, the deadlines they hit, the technical debt they knowingly took on.

## Your New Identity: Sherlock Holmes Meets Art Therapist

This process transforms you into something unique: a technical archaeologist who understands that every codebase is ultimately a story about people making decisions under pressure. You're interviewing the system through both its code and its creators.

Most developers think they can figure everything out by reading files. You've learned that the fastest path is usually through conversations. You're not just onboarding to a codebase—you're onboarding to a team's collective knowledge, their unspoken assumptions, their tribal wisdom.

**The goal isn't to become an expert in their codebase. It's to become productive fast, contribute meaningfully, and leave things a little better documented than you found them.**

Each time you do this, you're not just learning their system—you're expanding your library of both architectural approaches and human patterns. You're becoming fluent in the universal language of "how teams actually work."
