<script setup>
// Renders one component (lazily loaded via a glob importer) with a set of mock
// props, fully isolated: an async-load failure or a render-time throw is caught
// here so a single broken component can never take down the kitchen-sink grid.
import { shallowRef, ref, markRaw, watch, onErrorCaptured } from 'vue'

const props = defineProps({
  // () => import('../foo/Bar.vue') — the lazy importer from import.meta.glob
  loader: { type: Function, required: true },
  // mock props to bind onto the rendered component
  componentProps: { type: Object, default: () => ({}) },
  // optional structural wrapper so e.g. a <tr> component renders inside a table
  wrapper: { type: String, default: null }, // 'table' | 'list' | null
  // optional default-slot text for components that render their slot
  slotText: { type: String, default: null },
})

const resolved = shallowRef(null)
const error = ref(null)
const loading = ref(true)

onErrorCaptured((err) => {
  error.value = err
  return false // swallow — don't let it bubble past this preview
})

watch(
  () => props.loader,
  async (loader) => {
    error.value = null
    loading.value = true
    resolved.value = null
    try {
      const mod = await loader()
      resolved.value = markRaw(mod.default || mod)
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<template>
  <div
    v-if="error"
    class="font-mono text-2xs text-amber-600 dark:text-amber-400 px-2 py-1 break-words"
  >
    ⚠ {{ error.message || 'render error' }}
  </div>

  <div
    v-else-if="loading"
    class="font-mono text-2xs text-zinc-400 dark:text-zinc-600 px-2 py-1"
  >
    …
  </div>

  <!-- Suspense lets components with async setup (await useFetch) resolve in the
       preview. Transparent (no DOM node), so table/list layout is preserved. -->
  <table v-else-if="wrapper === 'table'" class="w-full">
    <tbody>
      <Suspense>
        <component :is="resolved" v-bind="componentProps" />
      </Suspense>
    </tbody>
  </table>

  <ul v-else-if="wrapper === 'list'">
    <Suspense>
      <component :is="resolved" v-bind="componentProps" />
    </Suspense>
  </ul>

  <Suspense v-else>
    <component :is="resolved" v-bind="componentProps">
      <template v-if="slotText !== null">{{ slotText }}</template>
    </component>
  </Suspense>
</template>
