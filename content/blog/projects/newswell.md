---
title: "Newswell Studio"
date: 2025-10-01
category: "Tools"
featured: false
draft: false
tech: ["Nuxt 4", "Vue", "WordPress", "PHP", "GPT-4"]
state: deployed
ai-involvement: ai-assisted
tags:
  - tools
  - journalism
  - dataviz
---

A browser-based newspaper layout tool, built to take small newsrooms off InDesign. It has three parts: a WordPress plugin that stores issues, layouts and ads; a Nuxt web editor for laying out pages; and a Slack bot for checking issue status without leaving chat.

In the editor, pages are built from drag-and-drop frames on a six-column newspaper grid. Articles come straight in from WordPress, ads are placed from inventory, and text flow is simulated so you can see what fits before you print. GPT-4 suggests headlines and trims articles to fit their frames. Finished pages export to print-ready PDF from the browser, with a preflight check first. Times of San Diego is the test site.

![Newswell Studio — drag-drop frame layout on the six-column grid](https://res.cloudinary.com/ejf/image/upload/projects/newswell/layout-1.png)

![Article trimming and page export](https://res.cloudinary.com/ejf/image/upload/projects/newswell/layout-2.png)
