<script setup lang="ts">
// The keymap on EJ's ZSA Voyager, read live from Oryx via /api/keymap (cached
// an hour), so editing the layout in Oryx updates this page with no deploy.
import type { Keymap } from '~/server/utils/oryx'

const { data: km, error } = await useFetch<Keymap>('/api/keymap')

const pinned = ref(0)
const hover = ref<number | null>(null)
const active = computed(() => hover.value ?? pinned.value)
const pin = (i: number) => {
  pinned.value = pinned.value === i ? 0 : i
}

const others = computed(() => km.value?.layers.slice(1) || [])
const counts = (i: number) => {
  const keys = km.value?.layers[i]?.keys || []
  const set = keys.filter((k) => k && !k.x).length
  const blocked = keys.filter((k) => k?.x).length
  return { set, blocked, through: keys.length - set - blocked }
}
const updated = computed(() =>
  km.value
    ? new Date(km.value.updated).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''
)
const dotColor = (i: number) =>
  i === 0 ? 'currentColor' : km.value?.layers[i]?.color || '#71717a'

usePageSeo({
  title: 'Keymap · EJ Fox',
  description:
    'The layout on my ZSA Voyager, drawn as type and read live from Oryx',
  type: 'article',
  section: 'Meta',
  tags: ['Keyboards', 'Voyager', 'QMK'],
})
</script>

<template>
  <div class="max-w-screen-xl mx-auto px-4 md:px-8 xl:px-16 pt-8 pb-16">
    <header class="max-w-prose mb-10">
      <h1 class="font-serif text-2xl mb-2">Keymap</h1>
      <p class="font-serif text-zinc-600 dark:text-zinc-400">
        The layout on my ZSA Voyager, read live from Oryx. Hold a layer to see
        what it changes
      </p>
      <p
        v-if="km"
        class="font-mono text-xs text-zinc-500 mt-3 tabular-nums"
        data-keymap-meta
      >
        {{ km.title }} · rev {{ km.revision }} · {{ updated }} ·
        {{ km.layers.length }} layers · {{ km.layers[0]?.keys.length }} keys ·
        <a :href="km.url" class="underline" rel="noopener">open in Oryx</a>
      </p>
    </header>

    <p v-if="error || !km" class="font-mono text-sm text-zinc-500 max-w-prose">
      Oryx isn't answering right now, so there's nothing to draw. The layout
      lives at
      <a
        href="https://configure.zsa.io/voyager/layouts/xBzP0/latest/0"
        class="underline"
        >configure.zsa.io</a
      >
    </p>

    <template v-else>
      <section class="mb-14">
        <div
          class="flex flex-wrap gap-x-5 gap-y-1 mb-4 font-mono text-xs"
          role="group"
          aria-label="Layers"
        >
          <button
            v-for="(layer, i) in km.layers"
            :key="layer.name"
            type="button"
            class="inline-flex items-center gap-2 py-1 transition-colors"
            :class="
              active === i
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            "
            :aria-pressed="pinned === i"
            @pointerenter="hover = i"
            @pointerleave="hover = null"
            @focus="hover = i"
            @blur="hover = null"
            @click="pin(i)"
          >
            <span
              class="inline-block w-2 h-2 rounded-full"
              :style="{ background: dotColor(i) }"
            />
            {{ layer.name }}
          </button>
        </div>
        <div class="overflow-x-auto">
          <KeymapBoard
            :layers="km.layers"
            :active="active"
            class="min-w-[600px] max-w-5xl"
            @select="pin"
          />
        </div>
        <p class="font-mono text-2xs text-zinc-500 mt-3">
          large = tap · small below = hold · small above = double-tap · ● hold
          for layer · ◉ toggle · ■ jump to layer · – blocked
        </p>
      </section>

      <section class="mb-14">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4"
        >
          What each layer changes
        </h2>
        <div class="grid gap-y-10 max-w-4xl">
          <figure v-for="(layer, n) in others" :key="layer.name">
            <KeymapBoard :layers="km.layers" :active="n + 1" mode="diff" />
            <figcaption class="font-mono text-2xs text-zinc-500 tabular-nums">
              <span :style="{ color: dotColor(n + 1) }">●</span>
              <span class="text-zinc-900 dark:text-zinc-100">{{
                layer.name
              }}</span>
              · {{ counts(n + 1).set }} keys ·
              {{ counts(n + 1).blocked }} blocked ·
              {{ counts(n + 1).through }} fall through
            </figcaption>
          </figure>
        </div>
      </section>

      <section class="max-w-prose">
        <h2
          class="font-mono text-xs uppercase tracking-wider text-zinc-500 mb-4"
        >
          Every layer at once
        </h2>
        <div class="max-w-md">
          <KeymapBoard :layers="km.layers" mode="strata" />
        </div>
        <p class="font-serif text-sm text-zinc-600 dark:text-zinc-400 mt-3">
          One tick per layer on every key, base at the top. Dots mark the keys
          that switch layers
        </p>
      </section>
    </template>
  </div>
</template>
