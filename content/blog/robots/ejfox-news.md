---
date: "2024-11-05T17:00:28.000Z"
modified: "2024-11-08T21:19:49.000Z"
share: true
---
## ejfox.news Phase 1: Core Development Plan

### Overview

Clean, focused news reader for !news tagged items from ejfox's scrapbook. iOS-native feel, static builds, edge delivery.

### Technical Stack
- **Frontend**: Nuxt 3, Tailwind, Nuxt UI
- **Data**: Supabase
- **Deployment**: GitHub Actions → Cloudflare Pages
- **Build Frequency**: Every 4 hours

### Development Phases

#### 1. Foundation (Day 1-2)
- [ ] Setup Nuxt 3 project with Tailwind/Nuxt UI
- [ ] Configure GitHub Actions workflow
- [ ] Implement basic Supabase connection
- [ ] Setup Cloudflare Pages deployment
- [ ] Configure environment variables/secrets

#### 2. Data Layer (Day 2-3)
- [ ] Create Supabase query for !news items
- [ ] Implement data fetching in build process
- [ ] Setup edge caching strategy
- [ ] Add error handling for data pipeline
- [ ] Test build trigger webhook

#### 3. Core Interface (Day 3-4)
- [ ] Implement single column feed layout
- [ ] Create article card component
- [ ] Style typography (System/Inter)
- [ ] Add share functionality
- [ ] Implement AI summary expansion

#### 4. Routes & Pages (Day 4-5)
- [ ] Setup `/p/[id]` article routes
- [ ] Create article permalink pages
- [ ] Implement mobile-responsive layouts
- [ ] Add basic meta tags
- [ ] Setup 404 handling

#### 5. Polish & Launch (Day 5)
- [ ] Performance optimization
- [ ] Cross-device testing
- [ ] Final visual QA
- [ ] Deploy to production

### Success Criteria

#### Performance
- [ ] Lighthouse performance score >90
- [ ] First contentful paint <1s
- [ ] No layout shifts
- [ ] Clean iOS feel

#### Functionality
- [ ] Articles display correctly
- [ ] Share sheet works
- [ ] Links function properly
- [ ] AI summaries expand/collapse
- [ ] Builds run automatically

#### Content
- [ ] !news items sync correctly
- [ ] Summaries display properly
- [ ] URLs resolve correctly
- [ ] Source domains clean

### Won't Do (MVP)
- User accounts
- Comments
- Search
- Tag browsing
- Related articles
- Desktop view
- Manual entry
- RSS feed
- Dark mode toggle

### Next Steps After MVP
1. Gather initial user feedback
2. Monitor performance
3. Plan Phase 2 features
4. Document learnings

### Emergency Contacts
- Alex (Lead): [contact]
- Marina (Design): [contact]
- Kai (Community): [contact]

### Deployment URLs
- Production: ejfox.news
- Staging: staging.ejfox.news
- Development: dev.ejfox.news

---

## ejfox.news Phase 2: Social Layer & Enhanced Reading

### Overview

Add IndieWeb integration, specialized desktop view, and enhanced reading features while maintaining the clean, focused experience of MVP.

### New Technical Components
- Webmention Endpoint (Cloudflare Worker)
- Desktop Layout System
- RSS Feed Generation
- Social API Integrations (Bluesky, Threads)

### Development Phases

#### 1. IndieWeb Integration
- [ ] Webmention Endpoint
  - Setup Cloudflare Worker
  - Implement webmention verification
  - Store in D1 database
  - Add to build process
- [ ] Backfeed Integration
  - Bluesky API integration
  - Threads API integration
  - Transform posts to webmentions
- [ ] Display Layer
  - Comments component
  - Source attribution
  - Response counter

#### 2. Enhanced Desktop Experience
- [ ] Desktop-Specific Layout (>1024px)
  - Two-column reading view
  - Persistent navigation
  - Enhanced typography
  - Improved white space
- [ ] Reading Features
  - Progress indicator
  - Table of contents (long articles)
  - Font size controls
  - Reading time estimate

#### 3. Discovery Features
- [ ] RSS Feed
  - Generate feed at build time
  - Add to site meta
  - Test in common readers
- [ ] Tag System
  - Tag browsing interface
  - Related articles
  - Tag-based RSS feeds
- [ ] Basic Search
  - Edge-based search index
  - Simple search interface
  - Recent searches

#### 4. Social Tutorial System
- [ ] Reply Documentation
  - How to reply from Bluesky
  - How to reply from Threads
  - How to send webmentions
- [ ] Integration Examples
  - Live preview of replies
  - Platform-specific formatting
  - Common pitfalls
- [ ] Community Guidelines
  - Response expectations
  - Content guidelines
  - Moderation policy

### Success Criteria

#### Social Integration
- Webmentions received & displayed
- Social posts correctly backfed
- Tutorial system helps users engage

#### Desktop Experience
- Clean, enhanced layout >1024px
- Improved reading experience
- Maintains performance metrics

#### Discovery
- RSS feed validates
- Tag system aids exploration
- Search returns relevant results

### Won't Do (Phase 2)
- User accounts/auth
- Direct commenting system
- Advanced analytics
- Content recommendations
- Email notifications
- Mobile app features

### Migration Notes
- Zero downtime deployment
- Backwards compatible APIs
- Preserve MVP performance
- No breaking URL changes

### Monitoring
- Webmention endpoint health
- Social API status
- Build process timing
- Cache performance
- Error rates

### Rollout Strategy
1. Deploy webmention endpoint
2. Add social backfeed
3. Release desktop layout
4. Enable discovery features
5. Launch tutorial system

### Emergency Procedures
- Social API fallbacks
- Cache invalidation process
- Manual build triggers
- Rollback procedures

---

## ejfox.news Launch Burndown List

### Technical Readiness
- [ ] Production deployment verified
  - [ ] Domain active & SSL valid
  - [ ] Edge caching tested
  - [ ] Build pipeline confirmed
  - [ ] Error states handled

- [ ] Performance baselines met
  - [ ] Load time < 1s
  - [ ] No layout shifts
  - [ ] Lighthouse score > 90
  - [ ] iOS native feel verified

- [ ] Cross-device testing
  - [ ] iPhone (latest)
  - [ ] iPhone (older)
  - [ ] iPad
  - [ ] Desktop Chrome/Safari
  - [ ] Dark mode verified

### Content Readiness
- [ ] Initial content seeded
  - [ ] Minimum 10 articles
  - [ ] AI summaries working
  - [ ] All links validated
  - [ ] Preview text clean

- [ ] Sharing functionality
  - [ ] iOS share sheet tested
  - [ ] URLs format correctly
  - [ ] Social previews work

### Launch Infrastructure
- [ ] Invite system ready
  - [ ] Unique invite links working
  - [ ] Visit tracking setup
  - [ ] Basic analytics ready

- [ ] Monitoring setup
  - [ ] Build notifications
  - [ ] Error alerts
  - [ ] Usage dashboard

### Friend Launch Prep
- [ ] Initial invitees selected
  - [ ] List of 5-10 friends
  - [ ] Personal notes for each
  - [ ] Launch timing confirmed

- [ ] Communication ready
  - [ ] Welcome messages drafted
  - [ ] How-to guide written
  - [ ] Feedback channel setup

### Documentation
- [ ] Public documentation
  - [ ] Basic usage guide
  - [ ] Project philosophy
  - [ ] Technical overview

- [ ] Private documentation
  - [ ] Deploy procedures
  - [ ] Error handling guide
  - [ ] Recovery procedures

### Pre-Launch Final Check
- [ ] Fresh test deploy
- [ ] All invite links tested
- [ ] Monitoring active
- [ ] Time blocked for support
- [ ] Team available for issues
- [ ] Screenshots archived

### Launch Day Schedule
1. [ ] Morning systems check
2. [ ] Deploy final version
3. [ ] Verify all systems
4. [ ] Send first wave invites
5. [ ] Monitor initial usage
6. [ ] Collect early feedback

### Success Metrics
- [ ] 80%+ invite links used
- [ ] No major errors
- [ ] Positive friend feedback
- [ ] Regular repeat visits

---

### Emergency Contacts
- Technical: Alex [contact]
- Design: Marina [contact]
- Community: Kai [contact]

### Recovery Procedures
1. Build issues: Manual trigger
2. Cache problems: Full purge
3. Content sync: Force rebuild
4. Major problems: Rollback to MVP

Sure thing! Here’s a full explanation of how to use Bridgy and Webmentions to create a decentralized comment system for your site, making it possible for people to comment from platforms like Mastodon and have those comments show up on your site—no direct code involved, just the concepts and flow.

Goal

You want a comment section on your site that pulls in comments and reactions from social platforms like Mastodon, Threads, or Bluesky. Instead of people needing to log in to your site to leave a comment, they can just post on their social media accounts, and those posts will show up on your article page.

We’ll make this possible with Webmentions and Bridgy Fed.

Key Players in the Plan

1. Webmentions: This is a protocol that lets websites notify each other about content interactions, like comments or likes. It’s like a “ping” between websites that says, “Hey, I mentioned you!” Webmentions are the IndieWeb’s way of creating decentralized interactions.

2. webmention.io: This is a service that collects Webmentions for you. It acts as your Webmention “inbox,” where mentions from other sites or social media can be stored. You can then pull these mentions from webmention.io and display them on your site as comments.

3. Bridgy Fed: This tool helps bridge the gap between your website and platforms in the Fediverse (like Mastodon) that don’t natively support Webmentions. Bridgy Fed makes your site look like a social account on Mastodon, which allows Mastodon users to follow and interact with your site. Bridgy Fed then translates these interactions into Webmentions, so they can show up on your site.

How the Flow Works

1. Setting Up Your Webmention Inbox

First, you need a place to collect Webmentions. Here’s where webmention.io comes in:

• Sign up on webmention.io, linking your site.

• webmention.io provides a special URL (Webmention endpoint) that you’ll include in your site’s HTML. This lets other sites know where to send Webmentions for your site.

• When other platforms or sites send a Webmention to your endpoint, webmention.io collects it in your inbox.

2. Bridgy Fed Makes Your Site a Fediverse Actor

Bridgy Fed is where things get interesting for Mastodon (or other Fediverse platforms):

• Sign up on Bridgy Fed and connect your site.

• Bridgy Fed makes an account for your site that appears on the Fediverse. For example, your site might appear as @ejfox.news@yourdomain.com.

• People on Mastodon can now follow this “account” and interact with it, just like a normal social profile. For instance, they can reply to, like, or boost posts that link to your site’s articles.

3. Someone Comments on Your Article from Mastodon

Let’s say someone reads an article on your site and wants to comment. They don’t have to log in to your site to leave a comment. Instead, they can:

• Post on Mastodon (or another Fediverse platform) with a link to your article and their comment. For example, they might say, “Great read! I loved this perspective,” and include a link to your article.

• Because your site is connected via Bridgy Fed, this post is seen as a comment on your site’s “account” in the Fediverse.

4. Bridgy Fed Translates the Comment to a Webmention

Now, Bridgy Fed takes that interaction from Mastodon and converts it into a Webmention:

• Bridgy Fed sees the post on Mastodon as an interaction with your site.

• It sends a Webmention to your webmention.io inbox, including details like the author’s name, profile picture, comment text, and a link to the original Mastodon post.

• This Webmention now sits in your webmention.io inbox, ready to be displayed as a comment on your site.

5. Displaying Webmentions on Your Site

Now that you have Webmentions collected in webmention.io, you can display them on your site.

• When someone views your article, your site can pull in Webmentions from webmention.io.

• Each Webmention includes the content of the mention (comment text, author info, link to the original post).

• Your site displays these Webmentions at the bottom of the article, just like a traditional comment section.

Putting It All Together

1. Set Up Webmention Collection: Use webmention.io to act as your Webmention inbox.

2. Connect Bridgy Fed: This bridges your site to the Fediverse, letting people comment from platforms like Mastodon.

3. Collect and Display Comments: Bridgy Fed converts Fediverse interactions into Webmentions, which webmention.io collects, allowing you to display them as comments on your site.

With this setup, people can comment on your articles just by posting on social media, and their comments will show up on your site as if they’d left them directly. This approach allows you to create a decentralized, IndieWeb-friendly comment section with minimal user friction. Let me know if anything’s still unclear!