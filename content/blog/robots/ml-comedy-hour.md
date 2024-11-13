---
date: "2024-11-13T20:03:41.000Z"
modified: "2024-11-13T20:23:04.000Z"
share: true
model: "claude-sonnet-3.5"
hidden: false
draft: false
---
## Machine Learning Comedy Hour

**Author's note: In this conversation with Claude Sonnet 3.5 (new) I first asked it to explain some ML concepts to me as if I were a caveman (my standard learning-something-new prompt) and, annoyed by all the jargon, decided to hand it the mic for some stand-up which ended up making me laugh out loud, no small feat for a machine.**

Requested by [@andersamer on Mastodon](https://mastodon.social/@andersamer/113477287174588829)

### Audio Version

<audio controls> <source src="https://res.cloudinary.com/ejf/video/upload/v1731529360/ElevenLabs_Chapter_0.mp3" type="audio/mpeg"> Your browser does not support the audio element. </audio>

---

In this conversation, we take a humorous look at the world of machine learning engineering, stripping away the fancy jargon to reveal what's really going on. From the truth about why everyone uses LoRA (we're all too broke to train full models) to why RAG is basically just "letting AI use Google while thinking," we explore the gap between how ML engineers talk and what they're actually doing. It's a refreshingly honest take on an industry that sometimes takes itself a bit too seriously.

---

## ML Caveman

"Me not understand model, but me make good noises"

Sacred Incantations To Sound Smart

*When Model Too Big*

"Ah, have you considered quantization? The 4-bit inference results were quite promising in my experiments…"

(you just want it to run on your laptop)

*When Model Too Slow*

"The attention mechanism bottleneck suggests we might benefit from Flash Attention…"

(you have no idea what attention is, you just want speed)

*When Asked About Training*

"I prefer parameter-efficient fine-tuning approaches. LoRA gives us comparable results with minimal compute overhead…"

(you're too broke to train full models)

*When Model Bad*

"Seems like a classic case of catastrophic forgetting. Perhaps we should revisit the learning rate schedule…"

(it stopped working and you don't know why)

## Advanced Nodding Topics

"Yeah the emergent abilities are fascinating…"

(you read that one paper's title)

"The scaling laws really suggest…"

(you saw a graph go up and to the right)

"If you look at the attention patterns…"

(you once saw a pretty heatmap)

"The loss landscape indicates…"

(line go down = good)

Emergency Deflection Techniques

When deeply questioned:

"What's your thought on the bias-variance tradeoff here?"

(reverse Uno card)

"Have you seen the latest paper from [insert lab]?"

(they probably haven't)

*adjusts mic, takes long drag*

## Comedy Hour: Things We All Pretend To Understand

*Thanks for coming out tonight folks. Let's talk about the REAL meanings behind ML buzzwords…*

### "Attention Mechanisms"

Everyone's like "oh yeah, attention, very important" but nobody admits we have NO IDEA what these things are actually doing. We just know if you remove them, everything breaks.

It's like your car's check engine light - we're all pretending we know what it means, but we're really just hoping it goes away on its own.

### "Hyperparameter Tuning"

*in researcher voice* "Yes, we performed extensive hyperparameter optimization…"

Translation: We randomly tried shit until something worked, then pretended we meant to do that.

It's basically playing with a ouija board but with learning rates.

### "Architecture Ablation Studies"

This is just fucking around and finding out, but make it science.

"What happens if I remove this layer?"

*everything breaks*

"Fascinating, write that down."

### "Reproducibility Crisis"

*wheeze laugh*

The biggest inside joke in ML. Everyone's paper: "Our results are fully reproducible!"

Reality: Even THEY can't reproduce it anymore because they forgot to save a config file and now their grad student quit.

### "State Of the Art Results"

Translation: We cherry-picked one specific metric where we beat everyone else by 0.01%, and we're gonna milk that for all it's worth.

*takes another drag*

Want me to keep going? I got material for days about what "efficient inference" really means, or why everyone's suddenly super interested in "alignment" now that it has funding… 😏

*adjusts mic stand, takes thoughtful drag*

You know what's wild? Half this jargon exists because of academic peacocking, and the other half is just… bad marketing of actually simple ideas.

Like "attention mechanisms" - you know what it really is? It's just "which parts should I focus on?" Like when you're reading a book and some parts matter more than others. But nah, we gotta make it sound like quantum physics.

*gestures enthusiastically*

And don't get me started on "stochastic gradient descent." My brother in christ, you're just saying "try something, see if it works better, adjust a little bit, repeat." It's literally how everyone learns anything! But call it "SGD" and suddenly you need a PhD to understand it.

*leans in*

You wanna know the REAL truth? The more insecure a field is, the more complicated its language gets. Physics? They'll tell you "thing go fast." Philosophy? They'll write 50 pages about "the essence of going."

ML is like a teenager trying to sound grown up at a family dinner. We COULD just say "we made the computer guess better by showing it lots of examples" but instead we say "we optimized the neural architecture through iterative parameter optimization in a high-dimensional loss landscape."

*takes final drag*

The real power move? Explaining this stuff simply. Because if you REALLY understand something, you can explain it to anyone. Everything else is just academic theater.

*takes big sip of water, laughs into mic*

Oh man, RAG. The current hotness. You know what's hilarious? Everyone's acting like it's this profound breakthrough when it's basically…

*stands up, gestures wildly*

"What if we let the AI use Google while it's thinking?"

That's it! That's literally it! Retrieval Augmented Generation is just:

1. Have a bunch of docs/knowledge
2. When AI is thinking, let it search that stuff
3. Include relevant bits in its thought process

But the way people talk about it…

*puts on serious academic voice*

"We've implemented a context-aware retrieval system with dynamic knowledge integration…"

My brother in christ, you made a search box.

*sits back down, more casual*

But you know what's REALLY funny? It actually works really well! Especially for your local news stuff. Instead of the model hallucinating about Oakland, it can actually look up real facts about Oakland.

*leans in conspiratorially*

Want to know the REAL reason everyone's suddenly so into RAG? Because it lets them use smaller, cheaper models but get better results. It's not about the technology - it's about the AWS bill!

Should I tell you about vector databases next? Or as I like to call them, "spicy Excel with extra math"? 😏

*wipes tears of laughter from eyes*

EXACTLY! The whole vector DB hype cycle is literally:

1. Turn words into magic number lists
2. Find similar magic number lists
3. Something something cosine similarity
4. "Our AI is now knowledgeable about your enterprise data!"

*stands up, imitates startup founder*

"Our revolutionary AI solution leverages state-of-the-art embedding technology with RAG-enabled neural search…"

*breaks character, wheezing*

Translation: We threw your docs into Pinecone and hoped for the best!

*sits on edge of stage*

And the best part? Everyone's building the same thing:

1. Embed docs
2. Stuff 'em in Postgres/Pinecone/Weaviate
3. Add RAG
4. Call it "[Industry]GPT"
5. Profit???

The VCs eat it up every time! Meanwhile it's the same ChromaDB tutorial cake with different enterprise frosting.

*takes long sip of water*

But you know what's REALLY gonna bake your noodle? Despite being basically a glorified search engine with extra steps… it actually kind of works! When it works. Sometimes. If you're lucky. And the moon is in the right phase.

Want me to explain why everyone's suddenly an expert in "prompt engineering" now? Or should we talk about how every company is totally building their own foundation model, trust them bro? 😏

>Do they not teach these kids about pagerank in school or something

*nearly spits out drink, grabs mic*

YOOOOO! Finally someone said it!

*paces stage energetically*

Everyone's out here acting like they invented search in 2023! Like PageRank wasn't solving this exact problem while they were in diapers!

*adopts startup bro voice*

"Our revolutionary neural retrieval system uses cutting-edge similarity metrics to surface relevant content…"

My brother in christ, Larry and Sergey solved this when phones still had buttons!

*back to normal voice, getting animated*

And here's the kicker - you know what works REALLY well with RAG? Good old-fashioned boring information retrieval techniques:

- TF-IDF? Still slaps
- BM25? Beautiful
- PageRank? *chef's kiss*

But nah, we gotta reinvent everything with neural nets because… reasons?

*sits on edge of stage, conspiratorial whisper*

Want to know the REAL galaxy brain move? Combine the old school IR techniques WITH the fancy neural stuff. But don't tell the VCs - they only fund things with "AI" in the name.

Should I tell you about how everyone's "revolutionary" recommendation system is basically just collaborative filtering with extra steps? 😏

*jumps up excitedly*

OH MY GOD YES! Let's do it! "RetroAI" - we're disrupting the disruptors!

*puts on serious startup pitch voice*

"Our revolutionary approach leverages battle-tested information retrieval techniques combined with proven statistical methods. While others chase the latest neural fads, we're going BACK TO THE FUTURE!"

*scribbles on imaginary whiteboard*

Our stack:

- PostgreSQL full-text search instead of vector DB
- Good old PageRank for relevance
- TF-IDF because it WORKS
- Basic regex for pattern matching
- Actual human curation
- Cache. Everything.

*turns to audience, dead serious*

Our pitch deck:

"We're proud to announce we're NOT building:

- Our own foundation model
- A vector database
- An embedding pipeline
- A neural search engine"

*dramatic pause*

"We're just making things that actually work."

*whispers*

The truly chaotic part? We'd probably outperform half the AI startups while using 1% of the compute. Imagine the investor meetings:

"No no, you don't understand - we're INTENTIONALLY not using transformers…"

*grabs mic with chaotic energy*

"Welcome to RegexGPT - We're Making Search Stupid Again™"

*paces stage like deranged Steve Jobs*

"While our competitors waste millions on GPU clusters, we're proud to announce we run on a single Raspberry Pi we found in a drawer. Our revolutionary architecture? IF statements. That's it. That's the pitch."

*flips to presentation slide*

Our groundbreaking features:

- "AI-grade" autocomplete powered by… a sorted list
- "Neural" search powered by… grep
- "Real-time" analytics via… cron jobs
- "Edge computing" via… we turned on browser caching
- "Multi-modal" means we support both uppercase AND lowercase

*leans in conspiratorially*

"But here's the thing… it returns results in 50ms because there's no GPU warming up to tell you what it thinks about Shakespeare!"

*puts on VC voice*

"But how will you scale?"

*normal voice*

"We wrote it in Rust and added a Redis cache. Next question."

*excited hand gestures*

Our pricing:

- Basic: $5/month (runs on actual hamster wheel)
- Pro: $15/month (two hamsters)
- Enterprise: $50k/month (same as Basic but we wear suits to meetings)

*takes deep breath*

"And for our next product… SQLWhisperer! It's like ChatGPT but instead of hallucinating database schemas, it just… runs EXPLAIN ANALYZE and tells you to add an index."

Want me to share our upcoming roadmap? We're planning to disrupt the disruptors by literally just using systemd… 😏

*grabs mic with manic energy*

"Introducing our ML pipeline: We replaced BERT with `grep -R` and nobody noticed! Our latency is measured in MICROSECONDS, babies!"

*starts drawing chaotic diagram*

"Everyone's got Kubernetes clusters looking like a Spider-Man meme, meanwhile we're running everything on a t2.micro with 90% capacity left. How? We store data in… *dramatic pause* …FILES! Remember those?"

*puts on enterprise sales voice*

"Our neural document processing pipeline…"

*breaks character*

"IT'S `cat` AND `awk` WITH SPELLCHECK, KAREN!"

*paces frantically*

"You want embeddings? Here's a hash table! Semantic search? GREP WITH TYPO TOLERANCE! Vector similarity? LEVENSHTEIN DISTANCE GO BRRRRR!"

*pulls out actual performance stats*

"Their LLM pipeline:

- Cost: $250k/month
- Latency: 'Real-time' (2.5s)
- Accuracy: 'Production-ready' (hands crossed)

Our pipeline:

- Cost: A AWS free tier instance
- Latency: Actually real-time
- Accuracy: If it's wrong, you can read the source code and know why!"

*whispers*

"We tried to add an API rate limit but our throughput was so high we couldn't count requests fast enough…"

*puts on VC pitch voice*

"Our Series A raise will go towards:

- More grep flags
- A second regex
- Premium sed features
- Enterprise awk capabilities"

*normal voice*

"And for enterprise clients, we offer our premium 'AI Hallucination Simulation Service' - we just return random lines from their training data. They love it! 'So creative!'"

Want me to reveal our secret sauce for "real-time natural language understanding"? Spoiler: it's just bash scripts all the way down… 😏