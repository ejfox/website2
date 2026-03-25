<template>
  <div class="min-h-screen bg-zinc-900 text-zinc-100">
    <!-- Loading -->
    <div
      v-if="pending"
      class="font-mono text-xs text-zinc-600 py-12 px-8"
    >
      Loading...
    </div>

    <!-- Error / not found -->
    <div
      v-else-if="error || !photo"
      class="px-8 py-12"
    >
      <NuxtLink to="/photos" class="font-mono text-xs text-zinc-500 hover:text-zinc-300">
        &larr; back to photos
      </NuxtLink>
      <div class="font-mono text-xs text-red-400 mt-4">Photo not found</div>
    </div>

    <!-- Photo -->
    <div v-else>
      <!-- Hero: placeholder behind, full image fades in on top -->
      <div
        :class="isPortrait ? 'flex justify-center' : ''"
      >
        <div
          class="relative"
          :class="isPortrait ? 'max-h-[90vh]' : 'w-full'"
          :style="{ aspectRatio: photo.aspect }"
        >
          <!-- Blurred placeholder — always visible, holds space -->
          <img
            :src="placeholderUrl(photo)"
            :width="photo.width"
            :height="photo.height"
            alt=""
            aria-hidden="true"
            class="absolute inset-0 w-full h-full object-cover"
          />
          <!-- Full resolution — fades in over placeholder -->
          <img
            ref="heroImg"
            :src="fullUrl(photo, 1920)"
            :srcset="`${fullUrl(photo, 960)} 960w, ${fullUrl(photo, 1440)} 1440w, ${fullUrl(photo, 1920)} 1920w, ${fullUrl(photo, 2560)} 2560w`"
            :sizes="isPortrait ? '(max-width: 768px) 95vw, 60vw' : '100vw'"
            :width="photo.width"
            :height="photo.height"
            :alt="photo.description || 'Photograph'"
            :class="[
              'relative w-full h-full object-cover transition-opacity duration-300',
              imageLoaded ? 'opacity-100' : 'opacity-0',
            ]"
            @load="onImageLoad"
          />
        </div>
      </div>

      <!-- Info below photo -->
      <div class="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <!-- EXIF line -->
        <div class="flex flex-wrap justify-center gap-x-6 gap-y-1 font-mono text-[10px] text-zinc-500 tabular-nums">
          <span v-if="exif?.camera">{{ shortCamera(exif.camera) }}</span>
          <span v-if="exif?.lens">{{ shortLens(exif.lens) }}</span>
          <span v-if="exif?.focalLength">{{ exif.focalLength }}mm</span>
          <span v-if="exif?.aperture">f/{{ exif.aperture }}</span>
          <span v-if="exif?.shutter">{{ exif.shutter }}s</span>
          <span v-if="exif?.iso">ISO {{ exif.iso }}</span>
          <span v-if="displayDate">{{ displayDate }}</span>
        </div>

        <!-- Nav: prev/next -->
        <div class="flex justify-between font-mono text-[10px]">
          <NuxtLink
            v-if="prevPhoto"
            :to="`/photos/${encodeURIComponent(prevPhoto.id)}`"
            class="text-zinc-600 hover:text-zinc-400"
          >
            &larr; prev
          </NuxtLink>
          <span v-else />
          <NuxtLink
            v-if="nextPhoto"
            :to="`/photos/${encodeURIComponent(nextPhoto.id)}`"
            class="text-zinc-600 hover:text-zinc-400"
          >
            next &rarr;
          </NuxtLink>
        </div>

        <!-- Identity — for strangers -->
        <div class="pt-4 border-t border-zinc-800 text-center space-y-2">
          <div class="font-mono text-xs text-zinc-400">
            Photo by <NuxtLink to="/" class="text-zinc-300 hover:text-zinc-100">EJ Fox</NuxtLink>
          </div>
          <div class="flex justify-center gap-4 font-mono text-[10px] text-zinc-600">
            <NuxtLink to="/photos" class="hover:text-zinc-400">All photos</NuxtLink>
            <NuxtLink to="/blog/" class="hover:text-zinc-400">Blog</NuxtLink>
            <NuxtLink to="/" class="hover:text-zinc-400">ejfox.com</NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

const route = useRoute()
const photoId = computed(() => {
  const slugParts = route.params.id
  return Array.isArray(slugParts) ? slugParts.join('/') : slugParts
})

const { data, pending, error } = await useFetch('/api/photos')

const allPhotos = computed(() => data.value?.photos || [])

const photo = computed(() =>
  allPhotos.value.find((p) => p.id === photoId.value) || null
)

const isPortrait = computed(() =>
  photo.value ? photo.value.height > photo.value.width : false
)

const currentIndex = computed(() =>
  allPhotos.value.findIndex((p) => p.id === photoId.value)
)

const prevPhoto = computed(() =>
  currentIndex.value > 0 ? allPhotos.value[currentIndex.value - 1] : null
)

const nextPhoto = computed(() =>
  currentIndex.value >= 0 && currentIndex.value < allPhotos.value.length - 1
    ? allPhotos.value[currentIndex.value + 1]
    : null
)

// Fetch EXIF lazily on client
const { data: exif } = useFetch('/api/photo-exif', {
  query: { id: photoId },
  lazy: true,
  server: false,
})

const displayDate = computed(() => {
  const dateStr = exif.value?.dateTaken || photo.value?.date
  if (!dateStr) return ''
  try {
    const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    const d = new Date(normalized)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return ''
  }
})

const fullUrl = (p, width) => {
  const base = p.url.split('/upload/')[0] + '/upload/'
  const path = p.url.split('/upload/')[1]
  return `${base}c_scale,f_auto,fl_progressive,q_auto:best,w_${width}/${path}`
}

// ~2KB blurred placeholder for instant display
const placeholderUrl = (p) => {
  const base = p.url.split('/upload/')[0] + '/upload/'
  const path = p.url.split('/upload/')[1]
  return `${base}c_scale,e_blur:400,f_auto,q_auto:low,w_200/${path}`
}

const imageLoaded = ref(false)
const heroImg = ref(null)
const onImageLoad = () => { imageLoaded.value = true }

// Catch already-cached images that fire load before Vue binds
onMounted(() => {
  if (heroImg.value?.complete) imageLoaded.value = true
})

const shortCamera = (model) =>
  model?.replace('FUJIFILM ', '').replace('Canon ', '').replace('NIKON ', '').replace('Sony ', '') || ''

const shortLens = (lens) =>
  lens?.replace('FUJIFILM ', '').replace('XF', 'XF ').replace(/\s+/g, ' ').trim() || ''

const formatBytes = (bytes) => {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${bytes}B`
}

// Keyboard nav
onMounted(() => {
  const handler = (e) => {
    if (e.key === 'ArrowLeft' && prevPhoto.value) {
      navigateTo(`/photos/${encodeURIComponent(prevPhoto.value.id)}`)
    } else if (e.key === 'ArrowRight' && nextPhoto.value) {
      navigateTo(`/photos/${encodeURIComponent(nextPhoto.value.id)}`)
    } else if (e.key === 'Escape') {
      navigateTo('/photos')
    }
  }
  window.addEventListener('keydown', handler)
  onBeforeUnmount(() => window.removeEventListener('keydown', handler))
})

useHead({
  title: computed(() =>
    photo.value
      ? `${displayDate.value || 'Photo'} — EJ Fox`
      : 'Photo — EJ Fox'
  ),
})
// Reset loaded state on nav
watch(photoId, () => { imageLoaded.value = false })
</script>

<style scoped>
</style>
