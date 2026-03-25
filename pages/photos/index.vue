<template>
  <main class="px-4 md:px-6 lg:px-8 max-w-full min-h-screen pt-8">
    <header class="section-spacing-sm">
      <div class="flex flex-col gap-2 py-3">
        <h1 class="font-mono text-sm text-zinc-100">PHOTOS</h1>
        <div v-if="data" class="font-mono text-[10px] text-muted tabular">
          {{ data.total }} photographs · Fujifilm
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div
      v-if="pending"
      class="font-mono text-xs text-zinc-600 py-12"
    >
      Loading photographs...
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="text-center py-8 text-red-600 dark:text-red-400"
    >
      Failed to load photos
    </div>

    <!-- Photo Grid -->
    <div v-else-if="data?.photos?.length" class="photo-grid">
      <a
        v-for="photo in data.photos"
        :key="photo.id"
        :href="`/photos/${encodeURIComponent(photo.id)}`"
        class="photo-item group"
        :style="{
          aspectRatio: photo.aspect,
          backgroundImage: `url(${placeholderUrl(photo)})`,
          backgroundSize: 'cover',
        }"
      >
        <img
          :src="thumbUrl(photo, 1200)"
          :srcset="`${thumbUrl(photo, 640)} 640w, ${thumbUrl(photo, 1200)} 1200w, ${thumbUrl(photo, 1920)} 1920w`"
          sizes="(max-width: 768px) 95vw, 48vw"
          :width="photo.width"
          :height="photo.height"
          :alt="photo.description || 'Photograph'"
          loading="lazy"
          decoding="async"
          class="photo-img"
        />

        <!-- EXIF overlay on hover -->
        <div class="photo-meta">
          <span v-if="photo.camera" class="photo-exif">{{ shortCamera(photo.camera) }}</span>
          <span v-if="photo.focalLength" class="photo-exif">{{ photo.focalLength }}mm</span>
          <span v-if="photo.aperture" class="photo-exif">f/{{ photo.aperture }}</span>
          <span v-if="photo.shutter" class="photo-exif">{{ photo.shutter }}s</span>
          <span v-if="photo.iso" class="photo-exif">ISO {{ photo.iso }}</span>
        </div>

        <!-- Date -->
        <div class="photo-date">
          {{ formatDate(photo.dateTaken || photo.date) }}
        </div>
      </a>
    </div>

    <!-- Empty -->
    <div
      v-else
      class="font-mono text-xs text-zinc-600 py-12"
    >
      No photographs found
    </div>
  </main>
</template>

<script setup>
const { data, pending, error } = await useFetch('/api/photos', {
  lazy: true,
})

const thumbUrl = (photo, width) => {
  const base = photo.url.split('/upload/')[0] + '/upload/'
  const path = photo.url.split('/upload/')[1]
  // Strip any existing transforms from the path
  const cleanPath = path.replace(/^v\d+\//, '')
  const version = path.match(/^(v\d+\/)/)?.[1] || ''
  return `${base}c_scale,f_auto,fl_progressive,q_auto:good,w_${width}/${version}${cleanPath}`
}

const placeholderUrl = (photo) => {
  const base = photo.url.split('/upload/')[0] + '/upload/'
  const path = photo.url.split('/upload/')[1]
  const cleanPath = path.replace(/^v\d+\//, '')
  const version = path.match(/^(v\d+\/)/)?.[1] || ''
  return `${base}c_scale,e_blur:400,f_auto,q_auto:low,w_200/${version}${cleanPath}`
}

const shortCamera = (model) => {
  if (!model) return ''
  return model
    .replace('FUJIFILM ', '')
    .replace('Canon ', '')
    .replace('NIKON ', '')
    .replace('Sony ', '')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    // Handle EXIF date format "2025:09:13 13:14:29"
    const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    const d = new Date(normalized)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    })
  } catch {
    return ''
  }
}

useHead({
  title: 'Photos — EJ Fox',
})
</script>

<style scoped>
.photo-grid {
  columns: 1;
  column-gap: 12px;
  max-width: 1400px;
}

@media (min-width: 768px) {
  .photo-grid {
    columns: 2;
  }
}

.photo-item {
  display: block;
  break-inside: avoid;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}

.photo-img {
  width: 100%;
  height: auto;
  display: block;
  transition: opacity 0.2s ease;
}

.photo-item:hover .photo-img {
  opacity: 0.92;
}

.photo-meta {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 6px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}

.photo-item:hover .photo-meta {
  opacity: 1;
}

.photo-exif {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}

.photo-date {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 6px;
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0;
  transition: opacity 0.15s ease;
  background: linear-gradient(rgba(0, 0, 0, 0.4), transparent);
}

.photo-item:hover .photo-date {
  opacity: 1;
}
</style>
