<script setup>
import PhotoStack from '~/components/photos/PhotoStack.vue'

// Both feeds in parallel
const { data: photosData, pending: photosPending } = await useFetch('/api/photos', { lazy: true })
const { data: postsData, pending: postsPending } = await useFetch('/api/photo-posts', { lazy: true })

const pending = computed(() => photosPending.value || postsPending.value)

// Merge into one chronological feed: individual photos + post-stacks
// Stacks break out of the masonry columns (column-span: all), so we interleave
// in-place by date and CSS handles the layout.
const feed = computed(() => {
  const items = []

  for (const photo of photosData.value?.photos || []) {
    const date = photo.dateTaken || photo.date
    items.push({
      kind: 'photo',
      date,
      timestamp: toTimestamp(date),
      photo,
    })
  }

  for (const post of postsData.value?.posts || []) {
    items.push({
      kind: 'stack',
      date: post.date,
      timestamp: toTimestamp(post.date),
      post,
    })
  }

  items.sort((a, b) => b.timestamp - a.timestamp)
  return items
})

function toTimestamp(dateStr) {
  if (!dateStr) return 0
  try {
    const normalized = String(dateStr).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    return new Date(normalized).getTime() || 0
  } catch {
    return 0
  }
}

const thumbUrl = (photo, width) => {
  const base = photo.url.split('/upload/')[0] + '/upload/'
  const path = photo.url.split('/upload/')[1]
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
  return model.replace('FUJIFILM ', '').replace('Canon ', '').replace('NIKON ', '').replace('Sony ', '')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  try {
    const normalized = dateStr.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
    return new Date(normalized).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  } catch {
    return ''
  }
}

useHead({ title: 'Photos — EJ Fox' })
</script>

<template>
  <main class="photos-page">
    <header class="photos-page__header">
      <h1 class="photos-page__title">Photos</h1>
      <p v-if="!pending" class="photos-page__sub">
        {{ feed.length }} items · {{ postsData?.total ?? 0 }} posts
      </p>
    </header>

    <div v-if="pending" class="photos-page__status">Loading…</div>

    <!-- Interleaved feed: masonry columns; stacks span full width -->
    <div v-else-if="feed.length" class="photo-grid">
      <template v-for="item in feed" :key="item.kind + (item.photo?.id || item.post?.slug)">
        <!-- Individual photo -->
        <a
          v-if="item.kind === 'photo'"
          :href="`/photos/${encodeURIComponent(item.photo.id)}`"
          class="photo-item"
          :style="{
            aspectRatio: item.photo.aspect,
            backgroundImage: `url(${placeholderUrl(item.photo)})`,
            backgroundSize: 'cover',
          }"
        >
          <img
            :src="thumbUrl(item.photo, 1200)"
            :srcset="`${thumbUrl(item.photo, 640)} 640w, ${thumbUrl(item.photo, 1200)} 1200w, ${thumbUrl(item.photo, 1920)} 1920w`"
            sizes="(max-width: 768px) 95vw, 48vw"
            :width="item.photo.width"
            :height="item.photo.height"
            :alt="item.photo.description || 'Photograph'"
            loading="lazy"
            decoding="async"
            class="photo-img"
          />
          <div class="photo-meta">
            <span v-if="item.photo.camera" class="photo-exif">{{ shortCamera(item.photo.camera) }}</span>
            <span v-if="item.photo.focalLength" class="photo-exif">{{ item.photo.focalLength }}mm</span>
            <span v-if="item.photo.aperture" class="photo-exif">f/{{ item.photo.aperture }}</span>
            <span v-if="item.photo.shutter" class="photo-exif">{{ item.photo.shutter }}s</span>
            <span v-if="item.photo.iso" class="photo-exif">ISO {{ item.photo.iso }}</span>
          </div>
          <div class="photo-date">{{ formatDate(item.photo.dateTaken || item.photo.date) }}</div>
        </a>

        <!-- Photo-post stack: a column-flow card that breaks out when expanded -->
        <PhotoStack v-else :post="item.post" />
      </template>
    </div>

    <div v-else class="photos-page__status">No photographs</div>
  </main>
</template>

<style scoped>
.photos-page {
  padding: 3rem 1rem 6rem;
  max-width: 1400px;
  margin: 0 auto;
}

.photos-page__header {
  display: flex;
  align-items: baseline;
  gap: 1rem;
  padding-bottom: 2rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid color-mix(in srgb, currentColor 15%, transparent);
}
.photos-page__title {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 2rem;
  line-height: 1;
  margin: 0;
}
.photos-page__sub {
  margin: 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  opacity: 0.5;
}
.photos-page__status {
  padding: 3rem 0;
  font-family: ui-monospace, 'SF Mono', Menlo, monospace;
  font-size: 0.8rem;
  opacity: 0.5;
}

/* ---- Masonry columns for individual photos ---- */
.photo-grid {
  columns: 1;
  column-gap: 12px;
}
@media (min-width: 768px) {
  .photo-grid { columns: 2; }
}
@media (min-width: 1280px) {
  .photo-grid { columns: 3; }
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
.photo-item:hover .photo-img { opacity: 0.92; }

.photo-meta {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  padding: 4px 6px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.15s ease;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
}
.photo-item:hover .photo-meta { opacity: 1; }
.photo-exif {
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 0.02em;
}
.photo-date {
  position: absolute;
  top: 0; right: 0;
  padding: 3px 6px;
  font-family: ui-monospace, monospace;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.7);
  opacity: 0;
  transition: opacity 0.15s ease;
  background: linear-gradient(rgba(0, 0, 0, 0.4), transparent);
}
.photo-item:hover .photo-date { opacity: 1; }

</style>
