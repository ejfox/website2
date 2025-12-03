<template>
  <ClientOnly>
    <teleport v-if="tocTarget" to="#nav-toc-container">
      <div v-if="items.length > 0" class="toc">
        <div class="py-4 pl-0 relative">
          <ul class="space-y-0">
            <li
              v-for="(item, index) in items"
              :key="item.slug"
              class="group relative"
            >
              <a
                :href="`#${item.slug}`"
                :class="{ 'toc-link-active': activeSection === item.slug }"
                class="toc-link"
              >
                <span
                  :class="{
                    'toc-number-active': activeSection === item.slug,
                  }"
                  class="toc-number"
                >
                  {{ String(index + 1).padStart(2, '0') }}
                </span>
                <span class="toc-title">{{ item.text }}</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </teleport>
  </ClientOnly>
</template>

<script setup>
import { useIntersectionObserver } from '@vueuse/core'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  contentRef: {
    type: Object,
    default: null,
  },
  headingSelector: {
    type: String,
    default: 'h2, h3, h4',
  },
})

const { tocTarget } = useTOC()
const activeSection = ref('')
const headings = ref([])

onMounted(() => {
  nextTick(() => {
    if (!props.contentRef) return

    headings.value = Array.from(
      props.contentRef.querySelectorAll(props.headingSelector)
    )

    headings.value.forEach((heading) => {
      const { stop } = useIntersectionObserver(
        heading,
        ([{ isIntersecting }]) => {
          if (isIntersecting) {
            activeSection.value = heading.id
          }
        },
        { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
      )
      heading._stopObserver = stop
    })
  })
})

onUnmounted(() => {
  headings.value.forEach((heading) => {
    if (heading._stopObserver) {
      heading._stopObserver()
    }
  })
})
</script>

<style scoped>
.toc-link {
  @apply flex items-baseline text-sm transition-colors duration-200;
  @apply no-underline py-2 gap-2;
  @apply text-zinc-600 dark:text-zinc-400;
  @apply hover:text-zinc-900 dark:hover:text-zinc-100;
}

.toc-link-active {
  @apply text-zinc-900 dark:text-zinc-100 font-medium;
}

.toc-number {
  @apply font-mono text-xs tabular-nums opacity-40;
  @apply w-4 text-right flex-shrink-0;
}

.toc-number-active {
  @apply opacity-70;
}

.toc-title {
  @apply font-serif leading-relaxed font-normal;
}

.toc-link-active .toc-title {
  @apply font-medium;
}
</style>
