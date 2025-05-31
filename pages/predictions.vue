<template>
  <div class="container mx-auto px-4 py-8 max-w-4xl">
    <h1 class="text-3xl font-bold mb-8">Predictions & Forecasts</h1>
    
    <p class="text-gray-600 dark:text-gray-400 mb-8">
      Public predictions with cryptographic verification. Each prediction is hashed and timestamped
      at the time of creation, ensuring accountability and preventing post-hoc modifications.
    </p>

    <div class="mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-2 flex items-center gap-2">
        <Icon name="material-symbols:info" class="text-blue-600" />
        About This System
      </h2>
      <p class="text-sm text-gray-700 dark:text-gray-300">
        Inspired by <a href="https://www.gwern.net/" target="_blank" class="text-blue-600 hover:underline">Gwern's prediction system</a>,
        each prediction is cryptographically signed using SHA-256 hashing and optionally PGP signatures.
        Git commits provide additional timestamping, creating an immutable record of when predictions were made.
      </p>
    </div>

    <section v-if="transformedPredictions.length > 0" class="space-y-4">
      <h2 class="text-2xl font-semibold mb-4">Recent Predictions</h2>
      <TransitionGroup name="list" tag="div" class="space-y-4">
        <PredictionCard 
          v-for="prediction in transformedPredictions" 
          :key="prediction._path + prediction.title"
          :prediction="prediction"
        />
      </TransitionGroup>
    </section>

    <section class="mt-12 border-t pt-8">
      <h2 class="text-2xl font-semibold mb-4">Commitment Log</h2>
      <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          All predictions are tracked through git commits. View the full history:
        </p>
        <a 
          href="https://github.com/ejfox/website2/commits/main/content/blog/predictions/"
          target="_blank"
          class="inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <Icon name="mdi:github" />
          View on GitHub
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import PredictionCard from '~/components/prediction/PredictionCard.vue'
import { usePredictions } from '~/composables/usePredictions'

const { parsePredictionsFromMarkdown } = usePredictions()

const { data: predictionPosts } = await useAsyncData('predictions', () => {
  return queryContent('blog/predictions')
    .where({ published: { $ne: false } })
    .sort({ date: -1 })
    .find()
})

// Transform markdown predictions to structured format for the component
const transformedPredictions = computed(() => {
  if (!predictionPosts.value) return []
  
  return predictionPosts.value.flatMap(post => {
    const parsedPredictions = parsePredictionsFromMarkdown(post.body)
    return parsedPredictions.map(pred => ({
      ...pred,
      verification: post.verification,
      _path: post._path
    }))
  })
})

useSeoMeta({
  title: 'Predictions & Forecasts',
  description: 'Public predictions with cryptographic verification and accountability',
  ogTitle: 'Predictions & Forecasts | ejfox.com',
  ogDescription: 'Cryptographically verified predictions and forecasts',
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<style>
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
