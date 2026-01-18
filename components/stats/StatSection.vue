<!--
  @file StatSection.vue
  @description Stats section wrapper with optional title and grid layout
  @props title: string - Section title
  @props id: string - Section HTML id (optional)
  @props show: boolean - Whether to show section (default: true)
  @props grid: boolean - Use grid layout (default: false)
-->
<template>
  <div v-if="show" :id="id" :class="wrapperClass">
    <component :is="headerTag" :class="headerClass">
      {{ title }}
    </component>
    <div :class="contentClass">
      <slot />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  id: {
    type: String,
    default: undefined,
  },
  show: {
    type: [Boolean, Object, Array, String, Number],
    default: true,
  },
  grid: {
    type: Boolean,
    default: false,
  },
})

const headerTag = computed(() => (props.grid ? 'div' : 'h2'))
const headerClass = computed(() =>
  props.grid ? 'label-uppercase' : 'stats-section-title-hover'
)
const wrapperClass = computed(() =>
  props.grid ? 'stack-1' : 'stats-section space-y-8 group'
)
const contentClass = computed(() => (props.grid ? 'grid-2col' : 'div'))
</script>

<style scoped>
.stats-section {
  position: relative;
  padding-left: 2.5rem;
}

.stats-section-title-hover {
  @apply tracking-[0.24em] font-mono text-zinc-500;
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%) rotate(-90deg);
  transform-origin: left top;
  font-size: 0.75rem;
  line-height: 1rem;
}

@media (max-width: 640px) {
  .stats-section {
    padding-left: 0;
    padding-right: 0.5rem;
    padding-left: 0.5rem;
  }

  .stats-section-title-hover {
    position: static;
    transform: none;
    margin-bottom: 0.5rem;
    display: block;
  }
}
</style>
