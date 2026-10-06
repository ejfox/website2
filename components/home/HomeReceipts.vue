<script setup>
// Third-party sources that name EJ, verbatim (see utils/careerRecord.js).
// Not <blockquote>: global.css styles those as giant decorative pull quotes.
import { RECEIPTS } from '~/utils/careerRecord'

const props = defineProps({
  receipts: { type: Array, default: () => RECEIPTS },
})
</script>

<template>
  <section class="mt-16" aria-labelledby="receipts-label">
    <h2 id="receipts-label" class="mono-xs text-secondary mb-4 tracking-wider">
      RECEIPTS
    </h2>
    <ul class="list-none pl-0 m-0">
      <li
        v-for="r in props.receipts"
        :key="r.url"
        class="py-2 border-t border-zinc-200 dark:border-zinc-800"
      >
        <a
          :href="r.url"
          target="_blank"
          rel="noopener"
          class="group block no-underline"
        >
          <span
            class="block font-serif text-base leading-6 text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-950 dark:group-hover:text-white"
          >
            {{ r.kind === 'headline' ? r.quote : `“${r.quote}”` }}
          </span>
          <span class="block mt-0.5 mono-xs text-secondary tabular">
            {{ r.source }} · {{ r.year }}
            <span class="opacity-0 group-hover:opacity-100 transition-opacity">
              ↗
            </span>
          </span>
        </a>
      </li>
    </ul>
  </section>
</template>
