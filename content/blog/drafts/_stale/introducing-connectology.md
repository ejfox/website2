---
draft: true
dek: In which we build a tool for seeing the hidden connections that bind the world together
inprogress: true
date: 2023-03-16T14:32:06-04:00
modified: 2024-10-30T09:11:49-04:00
hidden: true
tags:
  - network
  - visualization
  - tools
---
## The Hidden Networks Are Everywhere (Now You Can Actually See Them)

Everything is connected to everything else, but most of the time we can't see how. Social networks, supply chains, idea flows, collaboration patterns, conspiracy theories, protein interactions—the world runs on relationships that are invisible until someone takes the time to map them out.

The problem is that mapping networks has always been either expensive (hire a data visualization studio) or painful (spend weeks wrestling with Gephi or writing D3.js from scratch). Meanwhile, the most interesting connections are often hiding in plain sight: in your email threads, your research notes, your company's org chart, or that rabbit hole of Wikipedia articles you fell down last week.

I built Connectology because I was tired of having fascinating network insights trapped in my head with no good way to share them.

### What Makes a Network Tool Actually Useful

Most network visualization tools fall into two categories: academic software that requires a PhD to operate, or pretty demos that can't handle real data. Connectology sits in the sweet spot between power and usability.

**The basics just work:** Add nodes by typing. Connect them by dragging. Adjust the physics until the layout reveals the patterns you're looking for. Share the result with a URL. No exports, no file formats, no installation—just show people what you discovered.

**AI fills in the gaps:** The most tedious part of network analysis is often data entry. Connectology's AI can take a paragraph of text and extract the relationships automatically. It can suggest missing connections, generate labels, and even help you think of nodes you might have overlooked. It's like having a research assistant who never gets tired of connecting dots.

**Import from anywhere:** CSV files, text descriptions, lists of relationships—whatever format your data is in, Connectology can probably work with it. I built this because I was constantly switching between tools depending on whether my data was structured or messy, and that context switching was killing my momentum.

### The Networks You Didn't Know You Had

Since building this, I've been amazed by how many interesting networks were hiding in plain sight. The relationships between people mentioned in my meeting notes. The citation patterns in articles I've bookmarked. The skill overlaps between different projects I've worked on. Once you start seeing the world as networks, you can't stop—and finally there's a tool that doesn't fight you when you want to map what you're seeing.

But here's what I've realized: every other project I work on naturally wants to be understood as a graph network because that's how systems actually work. Working on my AI assistant's memory? The knowledge base is fundamentally a graph of interconnected concepts. Doing investigative journalism? The story is a network of actors, events, and relationships that can't be understood linearly. Debugging a sprawling codebase? The architecture is a complex system of dependencies, method calls, and data flows.

This isn't about having a hammer and looking for nails—it's about recognizing that systems thinking requires systems tools. Most complex problems exist as networks of relationships, but we're stuck analyzing them with lists, hierarchies, and linear documents. Graph analysis reveals the actual structure of how things connect, influence each other, and emerge from their relationships.

There aren't many genuine systems-thinking tools out there. The corporate world has started talking about "digital twins," but those are mostly expensive enterprise solutions for modeling industrial systems. What we need is something more fundamental: a way to map, explore, and reason about any system's underlying connection patterns, whether it's a codebase, a conspiracy, or an AI's memory.

### Network Editing Should Be As Fundamental As Word Processing

Here's what frustrates me about existing network tools: they treat graph creation like some special, ceremonial process. You import data, run algorithms, adjust parameters, export images. It's like using Microsoft Word to edit code—technically possible, but fighting the medium every step of the way.

But connection graphs are a fundamental unit of software that should be as widely available as word processors or calculators. Every computer user has access to tools for manipulating text (word processors), numbers (calculators and spreadsheets), and images (photo editors). But somehow the tools for manipulating relationships—one of the most fundamental aspects of how information is structured—have been locked away in academic software and expensive enterprise solutions.

A connection graph tool should be as accessible and immediate as a spreadsheet or a text editor. Why can't I edit a network as quickly as I can edit code in Vim or change a cell value in Excel? I should be able to type a node name, press Tab to create a connection, type another node, and instantly see the relationship. I should be able to delete connections with a keystroke, cluster nodes with a keyboard shortcut, and navigate large graphs with the same fluidity I navigate large codebases.

The speed of thought matters. When you're trying to map out a complex system—whether it's tracing through a bug, understanding organizational dynamics, or following a story's threads—the tool can't be the bottleneck. The moment you have to stop thinking about the problem and start thinking about the interface, you lose the thread of insight.

Most network tools were built for data scientists who work with static datasets. I want something built for thinkers who work with living, evolving systems that need to be understood in real-time.

### Try It When It's Ready

I'm putting the finishing touches on a public beta that embodies everything I've described here—fast, intuitive network editing that feels as natural as using a text editor or spreadsheet. No more fighting with clunky academic software or waiting for IT to approve enterprise licenses. Just you, your ideas, and a tool that gets out of the way.

The beta will launch with the core functionality: instant node creation, drag-to-connect relationships, AI-powered network generation from text, and shareable URLs for everything you create. Most importantly, it'll be fast enough to keep up with your thinking and simple enough that you won't need a tutorial.

If you're curious about mapping the hidden networks in your work—whether that's tracing code dependencies, understanding organizational dynamics, or following the threads of a complex story—stay tuned. The tool that should have existed decades ago is finally coming.