---
title: "Coach Artie"
date: 2023-03-21T00:00:00-04:00
category: "Tools"
featured: false
modified: 2025-08-26T15:52:50-04:00
url: https://github.com/room302studio/coachartie2
tech: ["Node.js", "TypeScript", "Discord.js", "OpenRouter", "Redis", "SQLite"]
state: evolved
ai-involvement: ai-enhanced
context: collaborative
tags:
  - programming
  - ai
  - product
  - nodejs
about: "[[project-notes/coach-artie]]"
---

Coach Artie is the AI assistant that lives in the Room 302 Studio Discord. He came online in March 2023 and has been answering the studio's questions, remembering its people and running its errands ever since.

![Coach Artie interface](https://res.cloudinary.com/ejf/image/upload/v1743818354/Screenshot_2025-04-04_at_9.59.00_PM.png)

## Version one: a studio assistant

The [first Coach Artie](https://github.com/room302studio/coachartie) was a Discord bot with memory. Alongside each message, he gets the history of his past conversations with that person, the memories he's formed about them, and a random mix of other memories. That mix is what made him feel like a member of the studio rather than a search box. As I wrote in my 2024 year in review, he "developed into an AI assistant that helps all members of the studio." I purposely left out the ability to DM him, to encourage public conversation.

## Version two: one brain, many doors

[Coach Artie 2](https://github.com/room302studio/coachartie2) is a 2025 rebuild as a TypeScript monorepo. One capabilities service sits behind many doors: Discord, Slack, SMS, IRC, email and a web "brain" UI for looking inside his head. A Redis queue feeds the language model through OpenRouter, and his memory and state live in SQLite. Capabilities are grouped by what they do: research, memory, the web, development, media, productivity, finance and more.

## What he remembers

What does an assistant actually remember after years of conversations? [Coach Artie: Memory Analysis](/projects/coachartie-memory) embeds all of his memories, clusters them and draws the map.

## The showcase site

![Meet Coach Artie — the showcase landing](https://res.cloudinary.com/ejf/image/upload/projects/coachartie-showcase/hero.png)

[The Coach Artie showcase](https://github.com/ejfox/coachartie_showcase) is a one-page editorial site in big serif display type on black, walking through what the agent does: adapts to its environment, remembers what matters, stays cost-conscious, writes its own release notes. It lays out 28 capabilities like a magazine feature.
