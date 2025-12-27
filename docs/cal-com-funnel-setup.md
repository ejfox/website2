# Cal.com High-Touch Sales Funnel Setup

Your booking page is the money page. Here's how to make it convert.

## Event Type: Discovery Call

Create a dedicated event type for consulting discovery calls (not the generic 30min):

**Settings:**
- Name: "Consulting Discovery Call"
- Duration: 30 min
- Location: Zoom/Google Meet

### Booking Questions (capture before the call)

Add these custom fields in Cal.com → Event Types → [Your Event] → Booking Questions:

1. **What's the project?** (Long text, required)
   - Label: "In 2-3 sentences, what are you trying to build?"

2. **Timeline** (Dropdown, required)
   - Options: "ASAP / Rush", "1-2 months", "3-6 months", "Just exploring"

3. **Budget range** (Dropdown, required)
   - Options: "$25K-$50K", "$50K-$100K", "$100K+", "Not sure yet"

4. **How'd you find me?** (Short text, optional)
   - Label: "Referral, Google, Twitter, etc."

5. **Anything else?** (Long text, optional)
   - Label: "Links, context, questions—whatever's helpful"

This pre-qualifies leads AND gives you prep material.

---

## Workflows: The High-Touch Sequence

### Workflow 1: Instant Confirmation + Prep Video

**Trigger:** When booking is created
**Action:** Send custom email

Subject: `Confirmed: Discovery call on {date}`

```
Hey {name},

Excited to chat on {date} at {time}.

Before we meet, I recorded a quick 3-min video just for discovery calls:
[LOOM LINK]

It covers:
- How I typically work with clients
- What makes a project a good fit
- What to expect on this call

See you soon,
EJ

P.S. If anything changes, reschedule here: {reschedule_link}
```

**To set up:**
1. Record a Loom walking through your process/expectations
2. Cal.com → Workflows → New Workflow
3. Trigger: "When booking is created"
4. Action: "Send email to attendee"
5. Paste the template above with your Loom link

---

### Workflow 2: 24-Hour Reminder + Prep Nudge

**Trigger:** 24 hours before event
**Action:** Send custom email

Subject: `Tomorrow: Quick prep for our call`

```
Hey {name},

Looking forward to our call tomorrow at {time}.

Quick reminder—I've got your notes from when you booked:
"{what's the project answer}"

If anything's changed or you want to add context, just reply to this email.

Talk soon,
EJ
```

**Why this works:** Shows you actually read their intake form. High-touch signal.

---

### Workflow 3: Same-Day Reminder (2 hours before)

**Trigger:** 2 hours before event
**Action:** Send email or SMS

Subject: `In 2 hours: {event_name}`

```
Quick reminder—we're on at {time} today.

Join here: {video_link}

See you soon!
```

---

### Workflow 4: No-Show Follow-Up

**Trigger:** When event ends (with condition: attendee didn't join)
**Action:** Send email after 30 minutes

Subject: `Missed you today`

```
Hey {name},

Looks like we missed each other. No worries—things happen.

Here's a link to reschedule when you're ready:
{reschedule_link}

If you'd rather just email, I'm at ejfox@ejfox.com.

EJ
```

---

### Workflow 5: Post-Call Follow-Up

**Trigger:** When event ends
**Action:** Send email after 1 hour

Subject: `Following up from our call`

```
Hey {name},

Great chatting today. As promised, here's what's next:

[Add your standard next steps here—proposal timeline, etc.]

If you have questions before then, just reply here.

Talk soon,
EJ
```

**Note:** You might want to send this manually so you can personalize. But having a template ready helps.

---

## The Prep Video (Record Once, Use Forever)

Record a 2-3 minute Loom covering:

1. **Who you are** (10 sec)
   - "I'm EJ, I build data visualization for newsrooms..."

2. **How the call works** (30 sec)
   - "This is a 30-min discovery call. You tell me the problem, I tell you if I can help."

3. **What makes a good fit** (45 sec)
   - "I work best with teams that have editorial stakes—elections, investigations, public interest..."

4. **What to bring** (30 sec)
   - "No prep needed, but if you have examples of what you're imagining, that helps."

5. **What happens after** (30 sec)
   - "If it's a fit, I'll send a proposal within a week. Fixed scope, fixed price."

This video does the selling before you even get on the call.

---

## Routing Form (Optional, for Volume)

If you're getting lots of inquiries, set up a routing form:

1. Cal.com → Routing Forms → New Form
2. Questions:
   - "What type of project?" → Election coverage / Investigation / Dashboard / Other
   - "Budget range?" → Under $25K / $25K+
3. Route:
   - Under $25K → Redirect to a "not a fit" page with recommendations
   - $25K+ → Route to Discovery Call booking

This filters out tire-kickers before they book.

---

## Integration Options

### n8n / Make / Zapier

Connect Cal.com to:
- **Notion/Airtable**: Log all discovery calls as a CRM
- **Slack**: Get notified when someone books
- **Email**: CC yourself on confirmations

### Webhooks

Cal.com can POST to any URL when bookings happen. Use this for custom tracking.

---

---

## Analytics & Tracking

The funnel is tracked via Umami + Cal.com webhooks.

### What's Tracked (Automatically)

| Event | Where | Meaning |
|-------|-------|---------|
| `funnel_consulting_view` | /consulting | Landed on consulting page |
| `scroll_depth` (25/50/75/90) | /consulting | How far they read |
| `time_on_page` (30/60/120s) | /consulting | Engagement depth |
| `funnel_calendar_view` | /calendar | Made it to booking page |
| `funnel_calendar_loaded` | /calendar | Cal.com embed rendered |
| `funnel_cal_booking_complete` | /calendar | Booking confirmed |

### Cal.com Webhook

Webhook endpoint: `/api/webhooks/calcom`

Set this up in Cal.com:
1. Settings → Developer → Webhooks
2. URL: `https://ejfox.com/api/webhooks/calcom`
3. Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED, BOOKING_NO_SHOW_UPDATED

This gives you server-side tracking of:
- Booking created (with budget/timeline/source from booking questions)
- Cancellations (with reason if provided)
- Reschedules
- No-shows

### Funnel Analysis in Umami

Build a funnel report:
1. Umami → Reports → Create Funnel
2. Steps:
   - `funnel_consulting_view` (entry)
   - `scroll_depth` where depth = 75 (read most of page)
   - `funnel_calendar_view` (clicked through)
   - `funnel_calendar_loaded` (page rendered)
   - `funnel_cal_booking_complete` (success)

### Key Metrics to Watch

| Metric | Good | Bad | Action |
|--------|------|-----|--------|
| Consulting → Calendar | >30% | <15% | Page not converting, check copy/pricing |
| Calendar → Booking | >20% | <10% | Cal.com friction, check available times |
| 75% scroll on /consulting | >50% | <25% | They're bouncing early, fix above-fold |
| Time on page >60s | >40% | <20% | Not engaging, content issue |

### Debugging Drop-offs

**"Can't find a time" problem:**
- Check Cal.com availability settings
- Look for patterns in when people visit vs. available slots
- Consider adding more availability or buffer times

**High calendar view, low booking:**
- Booking questions too long?
- Price shock after seeing intake form?
- Technical issues with embed?

---

## Checklist

- [ ] Create "Consulting Discovery Call" event type
- [ ] Add 5 booking questions (project, timeline, budget, source, notes)
- [ ] Record 3-min Loom prep video
- [ ] Set up Workflow 1: Confirmation + video
- [ ] Set up Workflow 2: 24-hour reminder
- [ ] Set up Workflow 3: 2-hour reminder
- [ ] Set up Workflow 4: No-show follow-up
- [ ] Set up Cal.com webhook to /api/webhooks/calcom
- [ ] Create Umami funnel report
- [ ] (Optional) Set up routing form for volume filtering
- [ ] Test the full flow yourself

---

## Sources

- [Cal.com Workflows Overview](https://cal.com/workflows)
- [How to Use Cal.com Workflows](https://cal.com/blog/how-to-use-cal-com-workflows)
- [Automate Follow-ups with Workflows](https://cal.com/blog/automate-follow-ups-with-calcom-workflows)
- [Booking Questions Guide](https://cal.com/blog/customize-your-scheduling-environment-a-guide-to-cal-com-s-booking-questions)
- [Routing Forms for Appointment Booking](https://cal.com/blog/how-to-use-routing-forms-for-online-appointment-booking)
- [Loom Pre-Meeting Videos](https://www.loom.com/blog/pre-meeting-video)
