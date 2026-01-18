---
dek: >-
  In which we make it extremely easy to charge people to access your website or
  pay for a membership
inprogress: true
date: 2023-09-26T18:05:43.000Z
modified: 2024-07-18T18:41:39.000Z
tags:
  - code
hidden: true
draft: true
---
## Adding a Paywall to your Nuxt+Supabase App

### Goals

It should be extremely easy and quick to create something really cool on the internet and then charge people to access it. Whether it's art, a tool, or a piece of journalism, you should allow people to pay for things they find valuable. This is only possible if you let them.

I am a big fan of [[drafts/nuxt-3-and-netlify]] as a prototyping toolkit, and I have a [customized project template](https://github.com/ejfox/nuxt-template-2023/tree/main) that lets me spin up apps quickly. Once I've made something cool, I want to let people pay to access it.

#### Memberships

One model is to let people pay a monthly fee to access the site, or certain portions of it.

#### Commodities

Another model is to let people pay for specific app actions: uploads, image generation, processing, tokens. People want to perform an action, and you let them pay for it before proceeding.

#### Paywalling

Yet another model is to take a piece of content and only allow access to people who have paid for it (or have a membership granting them access) – this might be on a page-by-page basis for journalism. Users shouldn't need to sign up for an account to pay for access, and paying should be as seamless as possible.

#### Free, but collect emails

A final option is to create an entire checkout flow, but give out coupon codes that let the user get the product for free, but adds them as a customer to your Stripe account and collects their email.

## Using Stripe

Stripe offers a number of tools that help users of different technical abilities charge for things. Our Nuxt app sits at a weird juncture where we could potentially do everything ourselves; we need to resist that temptation and focus on the task at hand.

### The Stack

**Nuxt 3**: Frontend and API routes
**Supabase**: User auth and database  
**Stripe**: Payment processing
**Stripe Webhooks**: Keep payments in sync

### Basic Implementation

**1. Install Dependencies**
```bash
npm install stripe @stripe/stripe-js @supabase/supabase-js
```

**2. Environment Variables**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
```

**3. Stripe API Route** (`/server/api/create-checkout.post.ts`)
```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price: body.priceId,
      quantity: 1
    }],
    success_url: `${body.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${body.origin}/cancel`,
    metadata: {
      userId: body.userId
    }
  })
  
  return { sessionId: session.id }
})
```

**4. Frontend Checkout** 
```vue
<script setup>
import { loadStripe } from '@stripe/stripe-js'

const stripe = await loadStripe(process.env.STRIPE_PUBLISHABLE_KEY)

async function checkout() {
  const { data } = await $fetch('/api/create-checkout', {
    method: 'POST',
    body: {
      priceId: 'price_1234567890',
      origin: window.location.origin,
      userId: user.value?.id
    }
  })
  
  await stripe.redirectToCheckout({ sessionId: data.sessionId })
}
</script>
```

**5. Webhook Handler** (`/server/api/webhook.post.ts`)
```typescript
import Stripe from 'stripe'

export default defineEventHandler(async (event) => {
  const sig = getHeader(event, 'stripe-signature')
  const body = await readRawBody(event)
  
  const stripeEvent = stripe.webhooks.constructEvent(
    body, sig, process.env.STRIPE_WEBHOOK_SECRET
  )
  
  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    // Update user permissions in Supabase
    await grantAccess(session.metadata.userId, session.id)
  }
  
  return { received: true }
})
```

### Quick Patterns

**Pay-per-article**: Check payment status before showing content
**Membership**: Monthly subscription with role-based access  
**Credits**: Buy tokens, spend on actions
**Free trial**: Stripe subscription with trial period

### What Actually Works

Keep it simple. Stripe Checkout handles the complex stuff. Your job is connecting payments to permissions in your database.

Don't build custom payment forms unless you have to. Stripe's hosted checkout is faster to implement and more secure.
