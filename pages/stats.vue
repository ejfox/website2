<template>
  <div class="max-w-7xl mx-auto px-4 py-16">
    <!-- Primary Metrics - Full Width -->
    <div class="mb-24">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-16">
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

    <!-- Secondary Metrics Grid -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 mb-24">
      <div v-for="metric in headerMetrics" :key="metric.label" class="flex flex-col">
        <p class="text-4xl font-light tabular-nums">{{ metric.value }}</p>
        <div class="w-full h-px bg-gray-200 my-3"></div>
        <h3 class="text-xs uppercase tracking-wider text-gray-500">{{ metric.label }}</h3>
      </div>
    </div>

    <!-- Main Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-16">
      <!-- Typing Section -->
      <section class="space-y-8">
        <h2 class="text-sm uppercase tracking-wider">Typing Performance</h2>
        <div class="h-64 border border-gray-200 p-6">All-time Best: {{ bestWPM }} WPM</div>
        <div class="grid grid-cols-2 gap-6">
          <div class="border border-gray-200 p-6">Last 30 Tests</div>
          <div class="border border-gray-200 p-6">Accuracy: {{ accuracy }}%</div>
        </div>
      </section>

      <!-- Music Section -->
      <section class="space-y-8">
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

      <!-- Health Section -->
      <section class="space-y-8">
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

      <!-- Chess Section -->
      <section class="space-y-8">
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

      <!-- Code Section -->
      <section class="space-y-8">
        <h2 class="text-sm uppercase tracking-wider">Coding Activity</h2>
        <div class="h-64 border border-gray-200 p-6">Contribution Calendar</div>
        <div class="grid grid-cols-2 gap-6">
          <div class="border border-gray-200 p-6">
            <span class="text-xs uppercase text-gray-500">Current Streak</span>
            <p class="text-2xl font-light mt-2">{{ codeStreak }} days</p>
          </div>
          <div class="border border-gray-200 p-6">
            <span class="text-xs uppercase text-gray-500">PRs Merged</span>
            <p class="text-2xl font-light mt-2">{{ prCount }}</p>
          </div>
        </div>
      </section>

      <!-- Photos Section -->
      <section class="space-y-8">
        <h2 class="text-sm uppercase tracking-wider">Photography</h2>
        <div class="h-64 border border-gray-200 p-6">Location Heatmap</div>
        <div class="border border-gray-200 p-6">
          <h3 class="text-xs uppercase mb-4">Camera Breakdown</h3>
          <div class="space-y-2">
            <!-- Camera stats here -->
          </div>
        </div>
      </section>
    </div>

    <!-- Cross Correlations -->
    <section class="mt-24">
      <h2 class="text-sm uppercase tracking-wider mb-8">Patterns & Correlations</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="border border-gray-200 p-6 h-48">Daily Rhythm</div>
        <div class="border border-gray-200 p-6 h-48">Productivity vs Music</div>
        <div class="border border-gray-200 p-6 h-48">Sleep vs Performance</div>
      </div>
    </section>
  </div>
</template>

<script setup>
// Placeholder values - these would come from your data sources
const currentWPM = '108'
const productivityPulse = '87'
const bestWPM = '126'
const accuracy = '98.2'
const musicStreak = '42'
const sleepScore = '85'
const activeMinutes = '134'
const chessRating = '1842'
const peakRating = '1923'
const codeStreak = '12'
const prCount = '86'

const headerMetrics = [
  { label: 'Total Keystrokes', value: '12,543,290' },
  { label: 'Hours of Music', value: '2,431' },
  { label: 'Chess Games', value: '1,234' },
  { label: 'Steps Taken', value: '8,234,567' },
  { label: 'Photos Captured', value: '15,342' },
  { label: 'Lines of Code', value: '284,532' },
  { label: 'Hours Tracked', value: '4,521' },
  { label: 'Active Days', value: '365' },
]

const topArtists = [
  { name: 'Artist One', plays: '1,234' },
  { name: 'Artist Two', plays: '956' },
  { name: 'Artist Three', plays: '847' },
  { name: 'Artist Four', plays: '752' },
  { name: 'Artist Five', plays: '631' },
]
</script>

<style scoped>
/* Custom styles if needed */
</style>