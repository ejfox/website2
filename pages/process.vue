<script setup lang="ts">
const principles = [
  {
    title: 'Prototypes over presentations',
    description:
      "I don't make slide decks about what I'm going to build. I build something small and real within the first week. You can click it, break it, react to it.",
  },
  {
    title: 'Editorial intent first',
    description:
      "Before any code: what's the story? What should the reader feel? What action should they take? The visualization serves the journalism, not the other way around.",
  },
  {
    title: 'Stress-test before launch',
    description:
      "If it's going live on election night, we simulate election night. Load testing, failure scenarios, fallback plans. The boring stuff that prevents disasters.",
  },
  {
    title: 'Documentation as delivery',
    description:
      "You get working code, not a dependency on me. Every project includes documentation your team can actually use after I'm gone.",
  },
]

const antiPatterns = [
  {
    bad: 'Waiting until the end to show you something',
    good: 'Working prototype in week one, iterate from there',
  },
  {
    bad: 'Building what you asked for literally',
    good: "Pushing back when the brief doesn't serve the goal",
  },
  {
    bad: 'Optimizing for "cool" over "clear"',
    good: 'Choosing boring technology that ships reliably',
  },
  {
    bad: 'Disappearing between check-ins',
    good: 'Async updates in Slack/Discord so you always know status',
  },
]

const questions = [
  'What happens if this visualization is wrong?',
  "Who's the least technical person who needs to understand this?",
  "What's the one thing this absolutely must communicate?",
  'How does this hold up when the data is ugly or incomplete?',
  'What does success look like in six months, not just at launch?',
]

usePageSeo({
  title: 'How I Work · EJ Fox',
  description:
    'My process for high-stakes data visualization: prototypes over presentations, editorial intent first, stress-tested before launch.',
  type: 'website',
  section: 'Process',
  tags: ['Process', 'Methodology', 'Consulting'],
})
</script>

<template>
  <main class="container-main pt-8 max-w-2xl">
    <header class="section-spacing-lg">
      <h1 class="heading-1 mb-4">How I Work</h1>
      <p class="font-serif text-lg text-zinc-600 dark:text-zinc-400">
        After 10+ years building newsroom tools under deadline pressure, I've
        developed strong opinions about what works.
      </p>
    </header>

    <!-- Principles -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-6">Principles</h2>
      <div class="space-y-8">
        <article
          v-for="p in principles"
          :key="p.title"
          class="border-l-2 border-zinc-200 dark:border-zinc-700 pl-4"
        >
          <h3 class="font-serif text-lg text-zinc-900 dark:text-zinc-100 mb-2">
            {{ p.title }}
          </h3>
          <p class="font-serif text-zinc-600 dark:text-zinc-400">
            {{ p.description }}
          </p>
        </article>
      </div>
    </section>

    <!-- Anti-patterns -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-6">What I Don't Do</h2>
      <div class="space-y-4">
        <div
          v-for="a in antiPatterns"
          :key="a.bad"
          class="grid grid-cols-2 gap-4 text-sm"
        >
          <div class="flex items-start gap-2">
            <span class="text-red-500 mt-0.5">✗</span>
            <span
              class="font-serif text-zinc-500 line-through decoration-zinc-300 dark:decoration-zinc-700"
            >
              {{ a.bad }}
            </span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-green-500 mt-0.5">✓</span>
            <span class="font-serif text-zinc-700 dark:text-zinc-300">
              {{ a.good }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <!-- Questions I Ask -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">Questions I'll Ask You</h2>
      <p class="font-serif text-zinc-600 dark:text-zinc-400 mb-6">
        Before we write any code, we need clear answers to these:
      </p>
      <ol class="space-y-3">
        <li v-for="(q, i) in questions" :key="i" class="flex gap-3 font-serif">
          <span class="font-mono text-sm text-zinc-400 w-6 shrink-0">
            {{ i + 1 }}.
          </span>
          <span class="text-zinc-700 dark:text-zinc-300">{{ q }}</span>
        </li>
      </ol>
    </section>

    <!-- Timeline -->
    <section class="section-spacing">
      <h2 class="heading-2 mb-4">Typical Timeline</h2>
      <div class="font-mono text-sm space-y-3">
        <div class="flex gap-4">
          <span class="text-zinc-400 w-20 shrink-0">Week 1</span>
          <span class="text-zinc-700 dark:text-zinc-300">
            Discovery, data audit, first prototype
          </span>
        </div>
        <div class="flex gap-4">
          <span class="text-zinc-400 w-20 shrink-0">Week 2-3</span>
          <span class="text-zinc-700 dark:text-zinc-300">
            Core functionality, design iteration
          </span>
        </div>
        <div class="flex gap-4">
          <span class="text-zinc-400 w-20 shrink-0">Week 4-5</span>
          <span class="text-zinc-700 dark:text-zinc-300">
            Polish, edge cases, stress testing
          </span>
        </div>
        <div class="flex gap-4">
          <span class="text-zinc-400 w-20 shrink-0">Week 6+</span>
          <span class="text-zinc-700 dark:text-zinc-300">
            Launch support, documentation, handoff
          </span>
        </div>
      </div>
      <p class="font-serif text-sm text-zinc-500 mt-4 italic">
        Timelines compress or expand based on scope. Election night systems need
        more stress testing. Investigative pieces need more data wrangling. We
        figure this out in the discovery call.
      </p>
    </section>

    <!-- CTA -->
    <section class="section-spacing">
      <div class="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-6">
        <p class="font-serif text-zinc-700 dark:text-zinc-300 mb-4">
          If this resonates, let's talk. If it doesn't, we're probably not a
          fit—and that's fine.
        </p>
        <div class="flex gap-4">
          <NuxtLink
            to="/calendar"
            class="inline-block bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-900 px-4 py-2 rounded font-mono text-sm hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
          >
            Book a Call
          </NuxtLink>
          <NuxtLink
            to="/consulting"
            class="inline-block border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-4 py-2 rounded font-mono text-sm hover:border-zinc-500 transition-colors"
          >
            See Services
          </NuxtLink>
        </div>
      </div>
    </section>
  </main>
</template>
