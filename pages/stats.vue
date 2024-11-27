<template>
  <div class="max-w-7xl mx-auto px-4 py-16">
    <div v-if="isLoading" class="text-center py-12">
      <div class="animate-pulse">Loading stats...</div>
    </div>

    <div v-if="Object.keys(errors).length" class="mb-8 p-4 bg-red-50 rounded-lg">
      <h3 class="text-sm font-medium text-red-800 mb-2">Some data sources are unavailable:</h3>
      <div v-for="(error, service) in errors" :key="service" class="text-red-600 text-sm capitalize">
        {{ service }}: {{ error }}
      </div>
    </div>

    <div>
      <div v-if="hasTypingData" class="mb-24">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-16">
          <div class="flex flex-col">
            <p class="text-6xl font-extralight tabular-nums">{{ currentWPM }}</p>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <h3 class="text-xs uppercase tracking-wider text-gray-500">Current WPM</h3>
          </div>
          <div class="flex flex-col">
            <p class="text-6xl font-extralight tabular-nums">{{ productivityPulse }}%</p>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <h3 class="text-xs uppercase tracking-wider text-gray-500">Productivity Pulse</h3>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-24">
        <div v-for="metric in availableHeaderMetrics" :key="metric.label" class="flex flex-col">
          <p class="text-4xl font-light tabular-nums">{{ metric.value }}</p>
          <div class="w-full h-px bg-gray-200 my-3"></div>
          <h3 class="text-xs uppercase tracking-wider text-gray-500">{{ metric.label }}</h3>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <section v-if="hasTypingData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Typing Performance</h2>
          <div class="h-64 border border-gray-200 p-6">All-time Best: {{ bestWPM }} WPM</div>
          <div class="grid grid-cols-2 gap-6">
            <div class="border border-gray-200 p-6">Last 30 Tests</div>
            <div class="border border-gray-200 p-6">Accuracy: {{ accuracy }}%</div>
          </div>
        </section>

        <section v-if="hasMusicData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Music Analytics</h2>
          <div class="h-64 border border-gray-200 p-6">
            <div class="mb-4">
              <span class="text-xs uppercase text-gray-500">Current Streak</span>
              <p class="text-2xl font-light">{{ musicStreak }} days</p>
            </div>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <div>Listening Calendar</div>
          </div>
          <div class="border border-gray-200 p-6">
            <h3 class="text-xs uppercase mb-4">Top 5 Artists</h3>
            <div v-for="artist in topArtists" :key="artist.name" class="flex justify-between py-2">
              <span>{{ artist.name }}</span>
              <span class="tabular-nums">{{ artist.plays }}</span>
            </div>
          </div>
        </section>

        <section v-if="hasHealthData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Health Metrics</h2>
          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Sleep Score</span>
              <p class="text-2xl font-light mt-2">{{ sleepScore }}</p>
            </div>
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Active Minutes</span>
              <p class="text-2xl font-light mt-2">{{ activeMinutes }}</p>
            </div>
          </div>
          <div class="h-64 border border-gray-200 p-6">Activity Heatmap</div>
        </section>

        <section v-if="hasChessData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Chess Statistics</h2>
          <div class="border border-gray-200 p-6">
            <div class="mb-6">
              <span class="text-xs uppercase text-gray-500">Current Rating</span>
              <p class="text-3xl font-light mt-2">{{ chessRating }}</p>
            </div>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <div class="mt-6">
              <span class="text-xs uppercase text-gray-500">Peak Rating</span>
              <p class="text-2xl font-light mt-2">{{ peakRating }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="border border-gray-200 p-6">Win Rate</div>
            <div class="border border-gray-200 p-6">Accuracy</div>
          </div>
        </section>

        <section class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Reading Stats</h2>
          <div class="border border-gray-200 p-6">
            <div class="mb-6">
              <span class="text-xs uppercase text-gray-500">Reading Speed</span>
              <p class="text-3xl font-light mt-2">381 WPM</p>
            </div>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <div class="mt-6">
              <span class="text-xs uppercase text-gray-500">Comprehension</span>
              <p class="text-2xl font-light mt-2">75%</p>
            </div>
          </div>
        </section>

        <section v-if="hasCodeData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Coding Activity</h2>
          <div class="grid grid-cols-1 gap-6">
            <div class="border border-gray-200 p-6">
              <div class="h-[250px] w-full">
                <HeatMap :data="{
                  values: stats?.code?.contributions ?? [],
                  details: stats?.code?.hourlyDetails ?? []
                }" />
              </div>
            </div>

            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div class="border border-gray-200 p-3">
                <span class="text-xs uppercase text-gray-500">Current Streak</span>
                <p class="text-xl font-light mt-1">{{ codeStreak }} days</p>
              </div>

              <div class="border border-gray-200 p-3">
                <span class="text-xs uppercase text-gray-500">PRs Merged</span>
                <p class="text-xl font-light mt-1">{{ prCount }}</p>
              </div>

              <div class="border border-gray-200 p-3">
                <span class="text-xs uppercase text-gray-500">Top Languages</span>
                <div class="mt-1">
                  <div v-for="lang in stats?.code?.languages?.slice(0, 3)" :key="lang" class="text-sm leading-tight">
                    {{ lang }}
                  </div>
                </div>
              </div>

              <div class="border border-gray-200 p-3">
                <span class="text-xs uppercase text-gray-500">Active Repos</span>
                <p class="text-xl font-light mt-1">
                  {{ stats?.code?.repositories?.length ?? 0 }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="hasPhotoData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Photography</h2>

          <div class="grid grid-cols-2 gap-6 mb-6">
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Total Photos</span>
              <p class="text-2xl font-light mt-2">{{ stats?.photography?.totalPhotos ?? 0 }}</p>
            </div>
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Average ISO</span>
              <p class="text-2xl font-light mt-2">{{ Math.round(stats?.photography?.stats?.avgISO ?? 0) }}</p>
            </div>
          </div>

          <div class="border border-gray-200 p-6">
            <h3 class="text-xs uppercase mb-4">Camera Breakdown</h3>
            <div class="space-y-3">
              <div v-for="camera in stats?.photography?.cameras" :key="camera.model"
                class="flex items-center justify-between">
                <span class="text-sm">{{ camera.model }}</span>
                <div class="flex items-center gap-4">
                  <span class="text-sm text-gray-500">{{ camera.count }} photos</span>
                  <div class="w-20 bg-gray-100 rounded-full h-2">
                    <div class="bg-blue-500 h-2 rounded-full" :style="{ width: `${camera.percentage}%` }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 p-6">
            <h3 class="text-xs uppercase mb-4">Favorite Lenses</h3>
            <div class="space-y-3">
              <div v-for="lens in stats?.photography?.lenses" :key="lens.model"
                class="flex items-center justify-between">
                <span class="text-sm">{{ lens.model }}</span>
                <span class="text-sm text-gray-500">{{ lens.count }} photos</span>
              </div>
            </div>
          </div>

          <div class="border border-gray-200 p-6">
            <h3 class="text-xs uppercase mb-4">Recent Activity</h3>
            <div class="h-32">
              <LineChart :data="{
                values: stats?.photography?.timeline?.map(d => d.count) ?? [],
                labels: stats?.photography?.timeline?.map(d => d.date) ?? []
              }" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="border border-gray-200 p-4">
              <span class="text-xs uppercase text-gray-500 block mb-2">Avg Aperture</span>
              <p class="text-xl font-light">ƒ/{{ stats?.photography?.stats?.avgAperture?.toFixed(1) ?? '0.0' }}</p>
            </div>
            <div class="border border-gray-200 p-4">
              <span class="text-xs uppercase text-gray-500 block mb-2">Favorite Focal Length</span>
              <p class="text-xl font-light">{{ stats?.photography?.stats?.favoriteFocalLength ?? 0 }}mm</p>
            </div>
            <div class="border border-gray-200 p-4">
              <span class="text-xs uppercase text-gray-500 block mb-2">Photos This Month</span>
              <p class="text-xl font-light">
                {{
                  stats?.photography?.timeline
                    ?.filter(d => new Date(d.date).getMonth() === new Date().getMonth())
                    ?.reduce((sum, d) => sum + d.count, 0) ?? 0
                }}
              </p>
            </div>
          </div>
        </section>

        <section v-if="hasWeatherData" class="space-y-8">
          <h2 class="text-sm uppercase tracking-wider">Winter Training</h2>
          <div class="h-64 border border-gray-200 p-6">
            <div class="mb-4">
              <span class="text-xs uppercase text-gray-500">Current Streak</span>
              <p class="text-2xl font-light">{{ winterTraining.currentStreak }} days</p>
            </div>
            <div class="w-full h-px bg-gray-200 my-4"></div>
            <div>Training Calendar</div>
          </div>
          <div class="grid grid-cols-2 gap-6">
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Days Completed</span>
              <p class="text-2xl font-light mt-2">{{ winterTraining.daysCompleted }}</p>
            </div>
            <div class="border border-gray-200 p-6">
              <span class="text-xs uppercase text-gray-500">Conditions Faced</span>
              <p class="text-2xl font-light mt-2">{{ winterTraining.conditionCount }}</p>
            </div>
          </div>
          <div class="border border-gray-200 p-6">
            <h3 class="text-xs uppercase mb-4">Achievements</h3>
            <div class="grid grid-cols-3 gap-4">
              <div v-for="badge in winterTraining.badges" :key="badge.name"
                class="flex flex-col items-center text-center">
                <div class="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  {{ badge.emoji }}
                </div>
                <span class="text-xs">{{ badge.name }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section v-if="hasMultipleDataSources" class="mt-24">
        <h2 class="text-sm uppercase tracking-wider mb-8">Patterns & Discoveries</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="pattern in patterns" :key="pattern.id" class="border border-gray-200 p-6 h-48">
            <h3 class="font-medium mb-2">{{ pattern.title }}</h3>
            <p class="text-sm text-gray-600 mb-4">{{ pattern.description }}</p>

            <div class="h-24">
              <LineChart v-if="pattern.viz === 'line'" :data="pattern.data" />
              <ScatterPlot v-else-if="pattern.viz === 'scatter'" :data="pattern.data" />
              <HeatMap v-else-if="pattern.viz === 'heatmap'" :data="pattern.data" />
              <Calendar v-else :data="pattern.data" />
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import LineChart from '~/components/viz/LineChart.vue'
import ScatterPlot from '~/components/viz/ScatterPlot.vue'
import HeatMap from '~/components/viz/HeatMap.vue'
import Calendar from '~/components/viz/Calendar.vue'

const { stats, isLoading, isReady, errors } = useStats()

const hasTypingData = computed(() => !!stats?.typing?.currentWPM)
const hasMusicData = computed(() => !!stats?.music?.currentStreak)
const hasHealthData = computed(() => !!stats?.health?.sleepScore)
const hasChessData = computed(() => !!stats?.chess?.currentRating)
const hasCodeData = computed(() => Array.isArray(stats?.code?.contributions))
const hasPhotoData = computed(() => !!stats?.photography?.totalPhotos)
const hasWeatherData = computed(() => !!stats?.weather?.current)

const hasMultipleDataSources = computed(() => {
  const availableSources = [
    hasTypingData.value,
    hasMusicData.value,
    hasHealthData.value,
    hasChessData.value,
    hasCodeData.value,
    hasPhotoData.value,
    hasWeatherData.value
  ].filter(Boolean).length

  return availableSources >= 2
})

const availableHeaderMetrics = computed(() => {
  const metrics = []

  if (hasTypingData.value) {
    metrics.push({
      label: 'Total Keystrokes',
      value: formatNumber(stats?.metrics?.keystrokes)
    })
  }

  if (hasMusicData.value) {
    metrics.push({
      label: 'Hours of Music',
      value: formatNumber(stats?.metrics?.musicHours)
    })
  }

  if (hasChessData.value) {
    metrics.push({
      label: 'Chess Games',
      value: formatNumber(stats?.metrics?.chessGames)
    })
  }

  if (hasHealthData.value) {
    metrics.push({
      label: 'Steps Taken',
      value: formatNumber(stats?.metrics?.steps)
    })
  }

  if (hasPhotoData.value) {
    metrics.push({
      label: 'Photos Captured',
      value: formatNumber(stats?.metrics?.photos)
    })
  }

  if (hasCodeData.value) {
    metrics.push({
      label: 'Lines of Code',
      value: formatNumber(stats?.metrics?.linesOfCode)
    })
  }

  return metrics
})

const currentWPM = computed(() => stats?.typing?.currentWPM ?? 0)
const productivityPulse = computed(() => stats?.typing?.productivityPulse ?? 0)
const bestWPM = computed(() => stats?.typing?.bestWPM ?? 0)
const accuracy = computed(() => stats?.typing?.accuracy ?? 0)
const musicStreak = computed(() => stats?.music?.currentStreak ?? 0)
const sleepScore = computed(() => stats?.health?.sleepScore ?? 0)
const activeMinutes = computed(() => stats?.health?.activeMinutes ?? 0)
const chessRating = computed(() => stats?.chess?.currentRating ?? 0)
const peakRating = computed(() => stats?.chess?.peakRating ?? 0)
const codeStreak = computed(() => stats?.code?.currentStreak ?? 0)
const prCount = computed(() => stats?.code?.prCount ?? 0)

const topArtists = computed(() => {
  if (!hasMusicData.value) return []

  return (stats?.music?.topArtists ?? [])
    .slice(0, 5)
    .map(artist => ({
      name: artist?.name ?? 'Unknown Artist',
      plays: formatNumber(artist?.plays ?? 0)
    }))
})

const formatNumber = (num) => {
  return new Intl.NumberFormat().format(num ?? 0)
}

const winterTraining = reactive({
  currentStreak: 5,
  daysCompleted: 23,
  conditionCount: 8,
  badges: [
    { name: 'Snow Master', emoji: '❄️' },
    { name: 'Rain Warrior', emoji: '🌧️' },
    { name: 'Early Bird', emoji: '🌅' },
    { name: 'Week Streak', emoji: '🔥' },
    { name: 'Sub-Zero', emoji: '🥶' },
    { name: 'Night Owl', emoji: '🌙' },
  ]
})

const { findPatterns } = usePatterns()
const patterns = computed(() => hasMultipleDataSources.value ? findPatterns.value : [])
</script>

<style scoped>
/* Custom styles if needed */
</style>