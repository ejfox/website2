<template>
  <ClientOnly>
    <div v-if="gearItems.length > 0" class="footer-fixed">
      <div
        ref="scrollContainer"
        class="flex overflow-x-auto gap-4 scrollbar-hide"
      >
        <div
          v-for="(item, index) in gearItems"
          :key="`gear-${item.slug || item.Name}`"
          :data-gear-index="index"
          class="color-swatch-lg"
          :class="getSwatchClasses(item)"
          :title="item.Name"
          @click="navigateToItem(item)"
        >
          <div class="font-bold text-xs mb-1">
            {{ item.Type?.slice(0, 3) || '?' }}
          </div>
          <div class="truncate text-xs mb-1 px-1 w-full text-center">
            {{ item.Name?.slice(0, 10) }}
          </div>
          <div
            class="text-xs text-zinc-500"
            :class="getWeightTextClasses(item)"
          >
            {{ item['Base Weight ()'] || '?' }}oz
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup>
// NUKED BY BLOODHOUND: Animation import obliterated
// import { animate } from '~/anime.esm.js'

const props = defineProps({
  currentSlug: {
    type: String,
    default: ''
  }
})

// Load gear data
const { data: gearData } = await useAsyncData('gear-nav', async () => {
  try {
    return await $fetch('/api/gear')
  } catch (_error) {
    console.error('Error:', _error)
    return { items: [] }
  }
})

const gearItems = computed(() => {
  const items = gearData.value?.items || []
  return items.filter((item) => item?.Name && item.Name.trim() !== '')
})

const getItemSlug = (item) => {
  return item.slug || item.Name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
}

const getSwatchClasses = (item) => {
  if (isCurrentItem(item)) {
    return (
      'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 ' +
      'border-zinc-900 dark:border-zinc-100 scale-110'
    )
  }
  return (
    'border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 ' +
    'dark:hover:border-zinc-500'
  )
}

const getWeightTextClasses = (item) => {
  if (isCurrentItem(item)) {
    return 'text-zinc-300 dark:text-zinc-600'
  }
  return 'text-zinc-500'
}

const isCurrentItem = (item) => {
  if (!item?.Name) return false
  const slug = getItemSlug(item)
  return slug === props.currentSlug
}

const scrollContainer = ref(null)

const scrollToCenter = (targetIndex) => {
  if (!scrollContainer.value) return

  const container = scrollContainer.value
  const itemEl = container.querySelector(`[data-gear-index="${targetIndex}"]`)

  if (itemEl) {
    const containerWidth = container.clientWidth
    const itemRect = itemEl.getBoundingClientRect()
    const _containerRect = container.getBoundingClientRect()

    // Calculate item position relative to container
    const itemLeft = itemEl.offsetLeft
    const itemWidth = itemRect.width

    // Calculate scroll position to center the item
    const scrollPosition = itemLeft - containerWidth / 2 + itemWidth / 2

    container.scrollTo({
      left: scrollPosition,
      behavior: 'smooth'
    })
  }
}

const navigateToItem = (item, direction = 'none') => {
  if (!item?.Name) return
  const slug = getItemSlug(item)
  const targetIndex = gearItems.value.findIndex((i) => i.Name === item.Name)

  // Animation code removed for better performance
  if (direction !== 'none') {
    // Direction param used in previous animation system
  }

  nextTick(() => scrollToCenter(targetIndex))
  navigateTo(`/gear/${slug}`)
}

// Arrow key navigation
const handleKeydown = (e) => {
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
    e.preventDefault()
    const currentIndex = gearItems.value.findIndex(isCurrentItem)
    if (currentIndex === -1) return

    const direction = e.key === 'ArrowRight' ? 1 : -1
    const newIndex =
      (currentIndex + direction + gearItems.value.length) %
      gearItems.value.length
    const animationDirection = e.key === 'ArrowRight' ? 'right' : 'left'
    navigateToItem(gearItems.value[newIndex], animationDirection)
  }
}

// Watch for route changes to update current selection
watch(
  () => props.currentSlug,
  (newSlug, oldSlug) => {
    if (newSlug !== oldSlug && gearItems.value.length > 0) {
      nextTick(() => {
        const currentIndex = gearItems.value.findIndex(isCurrentItem)
        if (currentIndex !== -1) {
          scrollToCenter(currentIndex)
        }
      })
    }
  },
  { immediate: false }
)

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)

  // Auto-scroll to current item on mount
  nextTick(() => {
    const currentIndex = gearItems.value.findIndex(isCurrentItem)
    if (currentIndex !== -1) {
      scrollToCenter(currentIndex)
    }
  })
})

onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
