---
date: 2025-08-13T19:03:17-04:00
modified: 2025-08-31T18:46:36-04:00
tags:
  - journalism
  - ai
  - machinelearning
  - tech
  - media
---

Imagine we had a big whiteboard, and we sat for a while and thought of the actual real applications of what everyone wants to call "AI".

We can split this into two fundamental mechanisms:

**Large Language Models (LLMs)** can read text, write summaries, extract facts, and help with research.

**Embeddings** take words, documents, or images and organize them by connections you didn't see—like an alien filing system that groups your research materials in ways that actually make sense.

The atomic unit depends on your beat. Fashion journalists organize by brands and designers. Political reporters track super PACs and FEC filings. City hall reporters follow properties and council members.

I've tested this extensively: give an AI a news article and ask it to extract facts. Works surprisingly well. The technique that works best is like smoothing a river stone—multiple passes:

1. **Paragraph-level extraction**: AI reads each paragraph, lists facts
2. **Concatenation**: Gather all paragraph-level facts
3. **Meta-summarization**: AI creates clean article-level fact list

**What you get**: Facts → Entities → Relationships → Networks

This is what good journalists already do in their heads, but now you can scale it across hundreds of documents.

[Simon Willison's experiments](https://simonwillison.net/2024/Apr/17/ai-for-data-journalism/) show similar results with semantic search using embeddings—suddenly you can find every conference session about "things that will upset politicians" across thousands of documents.

## Embeddings: The Alien Filing System

City council meetings—instead of manually combing through months of transcripts, ask the system to cluster all discussions about specific properties or topics.

Organizations like [Earth Genome](https://news.mongabay.com/2024/07/gold-mining-in-the-amazon-has-doubled-in-area-since-2018-ai-tool-shows/) partnered with the [Amazon Conservation Association](https://www.amazonconservation.org/maap-update-using-ai-to-detect-gold-mining-deforestation-in-the-amazon/) to create [Amazon Mining Watch](https://amazonminingwatch.org/en/about)—training AI to recognize illegal gold mines from satellite photos with 99.6% precision. They documented over 275,000 acres of new mining deforestation in 2024 alone. Same approach works for tracking construction, environmental damage, any "hard-to-track but easy-to-see" phenomena.

## Auto-Tagging

AI is surprisingly good at creating consistent tagging systems. Years of unorganized archives suddenly become searchable—every article mentioning affordable housing, every photo from city council meetings, every document about a development project.

## Service Journalism Helpbots

Local news helpbots that guide people through bureaucratic processes. Instead of another "how to apply for county assistance" article, create AI interfaces that walk people through actual steps, remind them of deadlines, help find the right forms.

Voice interfaces for communities without computer access—call or text to get help with unemployment benefits, housing assistance, municipal services. Mutual aid through technology.

## Document Archaeology at Scale

Modern image models can digitize and extract data from PDFs at massive scale. Thousands or tens of thousands of records that were effectively invisible before.

Imagine if the Spotlight team had a robot reading every church record, personnel file, and legal document, automatically threading together movements and relationships across decades. Instead of months of detective work, instant network analysis showing patterns, transfers, cover-ups.

Take 50,000 lawsuit PDFs and extract structured data: plaintiff names, settlement amounts, case outcomes. Transform qualitative legal language into quantitative datasets. What patterns emerge analyzing every police misconduct case in a state? Every environmental violation across decades? Every zoning variance?

**This is the democratization of massive investigative capacity.** A two-person newsroom can analyze datasets that would have required teams and months of work. You're uncovering systemic patterns hidden in plain sight.

## Image Forensics and Geolocation

AI systems are remarkably good at geolocation from images—essentially playing geoguessr at professional levels. Can verify location and timing of photos and videos much faster.

## Police Accountability Tools

Organizations like Lucy Parsons Labs created [OpenOversight](https://openoversight.lucyparsonslabs.com/), an interactive tool that helps the public identify police officers for complaints using crowdsourced photos and public data. Users can search by estimated age, race, and gender to get a gallery of potential matches.

Technologist Kyle McDonald built [FuckLAPD.com](https://www.404media.co/fucklapd-com-lets-anyone-use-facial-recognition-to-instantly-identify-cops/), a facial recognition site that matches uploaded LAPD officer photos against 9,000+ official headshots obtained through public records, displaying names, badge numbers, and salaries. The tool addresses officers concealing identities during protests.

Everything still needs independent confirmation, but AI dramatically narrows your search and flags potential issues, speeding up investigations and increasing the breadth of information covered.

These accountability projects show how AI can flip the surveillance script—using the same technologies to increase transparency and oversight of law enforcement.

---

**Further reading:**

- [AI for Data Journalism - Simon Willison](https://simonwillison.net/2024/Apr/17/ai-for-data-journalism/)
- [New AI Tools for Journalists - GIJN](https://gijn.org/stories/new-ai-large-language-model-tools-journalists/)
- [Amazon Mining Watch](https://amazonminingwatch.org/en/about)
- [OpenOversight Documentation](https://openoversight.com/about)
- [Satellite imagery and machine learning](https://www.nature.com/articles/s41467-021-24638-z)
