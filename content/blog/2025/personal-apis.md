---
date: 2025-01-04T19:07:17-05:00
modified: 2025-05-03T18:17:43-04:00
dek: In which the author steals his data back from various tools and APIs and uses them to build his own panopticon-for-one
---

## Building Personal APIs

When I talk to the robot, I want it to know things about me or my life out of the gate. For example I have a bot that txts me the weather every day. That's fine and easy, but I also feed it my health data so it can do things like "its gonna be a nice day today and you are due for a walk!" because my health data is there. It was a small tweak that made the touchpoint spark joy instead of feel like another rote notification.

The APIs I have been building are based on my personal KPIs– for lack of a better term. Forgive my broken brain. As they say, you can't improve what you don't measure. So the stats I collect and resurface are based on how I want to live my life.

I want to write more blog posts; so I measure cumulative total words written. I wanna get better at chess; so I measure my Chess.com score. I wanna be a better programmer and learn data science and algorithms; so I have my leetcode history. Often the bottleneck when interacting with computers is just how quickly I can get my ideas out; so I track typing speed.

My choices for what data to gobble up are based on my natural intuition and the things I want to improve on. The implementation is straightforward - I just use basic caching in the Nuxt / Nitro API. Its not that hard and the results feel powerful.

It's also kinda based on what's simply __available__ and what services offer data egress. Though I do always choose services that offer APIs and the ability to export my data wherever possible (fuck Facebook for slowly enshittifying all their APIs over the past 10 years).

This project was deeply inspired by quantified self and the Feltron annual report and tim ferris and that sort of self-tracking and improvement movement, oh and Gwern! From them, I learned a few specific lessons:

- Feltron taught me to focus on simple narrative metrics, where less is more
- Ferriss taught me anything is learnable with a system and persistence
- Gwern taught me that all experimentation is valuable with enough documentation, and that if you are ahead of the curve and just document your own interests than some time later as people catch up they will find your work

We live in a post capitalist digital surveillance state, so theoretically the algorithm(s) already have a dashboard of intelligence on me. Why not build the same for myself, but around things that might actually improve my life? I wanna write more code, practice more skills, get better at things, continuously improve and learn, write more blog posts, make more youtube videos, document the things I make.

What makes this approach feel so powerful is that there is a compounding factor where if you give the bot a bunch of context the results feel like *magic* - like - how did you know that? Oh right– you it has *visibility* into the context of my life.

Here's what I'm tracking right now:

### 🏃‍♂️ Health & Fitness

I pull data from Apple Health to track my daily steps, exercise minutes, stand hours, and distance. This API helps me see if I'm actually getting outside or just doom-scrolling all day. Seeing my step count drop below 5,000 for several days is a clear indicator I need to touch grass.

### 🎮 Gaming & Skills

**LeetCode** - This tracks my progress through coding challenges by difficulty level. Essential for keeping my algorithmic thinking sharp and reminding me I'm not as clever as I think I am.

**MonkeyType** - Because typing speed actually matters when you code all day. This API tracks my WPM and accuracy, though I'm still not as fast as some of those YouTube programmers who seem to type at the speed of thought.

**Chess** - I suck at chess but I want to get better. The API shows me my win rates and puzzle solving stats. I still suck but at least it's quantified now, and I am hoping that with some concentrated effort and studying I can steadily increase my numbers.

### 💻 Development

My GitHub API integration tracks contributions, repos, and commit types. It's like a digital fingerprint of my coding life. I can see when I'm in build mode vs. maintenance mode based on commit frequency and types.

### 📸 Creative

I have a simple photos API that pulls stats from my personal photo platform.

### 🎵 Entertainment

The Last.fm API tracks my listening habits going back at least 10 years. I can see my most-played artists, recent tracks, and even calculate my average daily listening.

### ⏰ Productivity

RescueTime gives me the hard truth about where my time actually goes. The API breaks down productive vs. distracting time, showing me exactly how many hours I spent in VS Code versus falling down YouTube rabbit holes.

### 📝 Writing

I track my monthly word count and blog post frequency. Having this data helps me maintain consistency and actually ship writing instead of endlessly tinkering. Seeing that "words this month" counter is motivating.

---

Sure, the machines already have this data. But now I have it too, and it's structured around what I actually care about, and easy to pass along to any robot (or, uh, human I guess) that I want to have more real-time data about what's going on with me.