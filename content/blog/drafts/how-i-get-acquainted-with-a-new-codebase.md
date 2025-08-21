---
date: 2025-03-05T10:10:06-05:00
modified: 2025-06-02T10:00:23-04:00
tags:
  - code
  - howto
  - process
## How I get acquainted with a new codebase
---
If it has a README, I read it. Even if it's old, even if a robot wrote it. You don't want to be the idiot asking a question that's answered in the README.
If it's a front-end application, I'm going to use the user flow to start dissecting the codebase logically and figuring out where things live. The first place that I will start is the router; what URLs does this site support? Is there a list of them somewhere?
Most importantly, where can I find the code that powers the index?
If it's a data processing or analysis application- I'll start at the top, where does data come in? What is the source file or API? Is there a file that orchestrates a series of processes (like a script or a Makefile) or are they run ad-hoc by hand?
