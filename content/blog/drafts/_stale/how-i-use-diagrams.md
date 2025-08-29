---
draft: true
dek: In which we discover that the fastest way to understand any complex problem is to draw it out
inprogress: true
date: 2023-01-19T01:16:47-05:00
modified: 2025-08-28T17:46:46-04:00
tags:
  - mapping
  - visualization
  - design
  - data
  - technique
hidden: true
---
## How I Use Diagrams to Think Faster Than My Brain Can Keep Up

Most people think diagrams are for explaining things to other people. But the real superpower of visual thinking is using diagrams to understand things yourself—to externalize the complexity bouncing around in your head so you can actually work with it.

I diagram everything. Meeting notes turn into network maps of who said what. Project planning becomes flowcharts of dependencies and decision points. Debugging sessions become visual traces of data flow and system interactions. Not because I'm going to show these diagrams to anyone else, but because drawing the problem is often faster than thinking through the problem.

Here's what I've learned about using diagrams as thinking tools, not communication tools.

### Drawing Systems in Real Time

When listening to a client or lead developer talk through a system, I use Scapple to "draw it" in real time as my notes. Instead of linear notes of what they said, I capture the actual systems we're working with—nodes, connections, data flows, dependencies.

Then I show it back to them. This is where it gets interesting: they can see their system externalized and immediately start correcting, refining, and adding missing pieces. Rather than trying to remember everything they said in sequence, I can rearrange and edit the diagram in real time to match their corrections.

This lets me confirm the system visually with the subject matter expert as we go, rather than discovering misunderstandings weeks later when I'm trying to implement something.

### Tools That Actually Work

I've tried dozens of diagramming tools, and most of them get in the way more than they help. The best tools for thinking (as opposed to presenting) are the ones that let you externalize ideas as quickly as you can think them.

**Whiteboard:** The OG- but not always viable, and frankly, I haven't touched one since 2020. But if you are able to find yourself in a room with some markers and plentiful whiteboard space, take advantage of it.

**Pen & Paper:** Still the fastest interface between brain and external representation. Zero learning curve, infinite flexibility, no software crashes. Perfect for real-time conversation mapping and initial problem exploration.

**Scapple:** This is what I use most often for client conversations. Infinite canvas, no forced structure, fast enough to keep up with real-time conversation. You can drop ideas anywhere and connect them as relationships become clear. It was actually part of the inspiration for Connectology—I do this visual systems capture so much that I wanted something even more optimized for network thinking.

**Mermaid:** Text-based diagramming that generates clean visuals from simple syntax. Perfect when you know the structure and want something more polished than a sketch, but don't want to fight with drag-and-drop interfaces.

The key insight: use the messiest tool that still helps you think. Clean, formal diagrams are for communication. Messy, flexible diagrams are for understanding.

### From Visual to Structured: Extracting Data from Diagrams

Here's where it gets interesting: once you've used a diagram to understand a complex system, you can often extract structured data from that visual representation an start doing some more structured analysis.

That network map of meeting participants and topics? It can become a CSV of relationships that reveals communication patterns and information flow. The project dependency flowchart? It can generate a task list with proper sequencing and resource allocation. The system architecture sketch? It can inform database schema design and API specifications.

The diagram serves as a bridge between messy human thinking and structured machine-readable data. You use visual thinking to understand the problem space, then translate that understanding into the formal representations that software systems need.
