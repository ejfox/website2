<template>
  <section class="space-y-2 text-xs">
    <!-- Minimal header -->
    <div
      class="flex justify-between items-center text-[10px] tracking-[0.2em] text-zinc-500 p-4"
    >
      <div>FOX_STATS</div>
      <div>{{ dayOfYear }}/{{ daysInYear }}</div>
    </div>

    <!-- Dense stats layout -->
    <div class="space-y-4 p-4">
      <!-- Writing Stats -->
      <div v-if="blogStats" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">WRITING</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Posts</span>
            <span class="tabular-nums">{{ blogStats.totalPosts }}</span>
          </div>
          <div class="flex justify-between">
            <span>Words</span>
            <span class="tabular-nums">{{
              blogStats.totalWords.toLocaleString()
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>This Month</span>
            <span class="tabular-nums">{{ blogStats.postsThisMonth }}</span>
          </div>
          <div class="flex justify-between">
            <span>Avg Words</span>
            <span class="tabular-nums">{{ blogStats.averageWords }}</span>
          </div>
        </div>
      </div>

      <!-- Typing Stats -->
      <div v-if="stats.monkeyType?.typingStats" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">TYPING</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Best WPM</span>
            <span class="tabular-nums">{{
              stats.monkeyType.typingStats.bestWPM
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tests</span>
            <span class="tabular-nums">{{
              stats.monkeyType.typingStats.testsCompleted
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Accuracy</span>
            <span class="tabular-nums"
              >{{ stats.monkeyType.typingStats.bestAccuracy }}%</span
            >
          </div>
          <div class="flex justify-between">
            <span>Consistency</span>
            <span class="tabular-nums"
              >{{ stats.monkeyType.typingStats.bestConsistency }}%</span
            >
          </div>
        </div>
      </div>

      <!-- GitHub Stats -->
      <div v-if="stats.github?.stats" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">GITHUB</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Contributions</span>
            <span class="tabular-nums">{{
              stats.github.stats?.totalContributions || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Repos</span>
            <span class="tabular-nums">{{
              stats.github.stats?.totalRepos || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Followers</span>
            <span class="tabular-nums">{{
              stats.github.stats?.followers || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Following</span>
            <span class="tabular-nums">{{
              stats.github.stats?.following || 0
            }}</span>
          </div>
        </div>
      </div>

      <!-- LeetCode Stats -->
      <div v-if="stats.leetcode?.submissionStats" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">LEETCODE</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Easy</span>
            <span class="tabular-nums">{{
              stats.leetcode.submissionStats.easy.count
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Medium</span>
            <span class="tabular-nums">{{
              stats.leetcode.submissionStats.medium.count
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Hard</span>
            <span class="tabular-nums">{{
              stats.leetcode.submissionStats.hard.count
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Total</span>
            <span class="tabular-nums">{{
              stats.leetcode.submissionStats.easy.count +
              stats.leetcode.submissionStats.medium.count +
              stats.leetcode.submissionStats.hard.count
            }}</span>
          </div>
        </div>
      </div>

      <!-- Chess Stats -->
      <div v-if="stats.chess" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">CHESS</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Blitz</span>
            <span class="tabular-nums">{{
              stats.chess.currentRating.blitz
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Rapid</span>
            <span class="tabular-nums">{{
              stats.chess.currentRating.rapid
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Bullet</span>
            <span class="tabular-nums">{{
              stats.chess.currentRating.bullet
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Puzzles</span>
            <span class="tabular-nums">{{
              stats.chess.puzzleStats.rating
            }}</span>
          </div>
        </div>
      </div>

      <!-- Health Stats -->
      <div v-if="stats.health" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">HEALTH</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Steps Today</span>
            <span class="tabular-nums">{{
              healthToday.steps.toLocaleString()
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Exercise</span>
            <span class="tabular-nums"
              >{{ healthToday.exerciseMinutes }}m</span
            >
          </div>
          <div class="flex justify-between">
            <span>Avg Steps</span>
            <span class="tabular-nums">{{
              stats.health.averages?.dailySteps?.toLocaleString() || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Heart Rate</span>
            <span class="tabular-nums">{{
              stats.health.heartRate?.resting || 0
            }}</span>
          </div>
        </div>
      </div>

      <!-- Photography Stats -->
      <div v-if="stats.photos?.stats" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">
          PHOTOGRAPHY
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Total</span>
            <span class="tabular-nums">{{
              stats.photos.stats.totalPhotos
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>This Month</span>
            <span class="tabular-nums">{{
              stats.photos.stats.photosThisMonth
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Avg/Month</span>
            <span class="tabular-nums">{{
              stats.photos.stats.averagePerMonth.toFixed(1)
            }}</span>
          </div>
        </div>
      </div>

      <!-- Productivity Stats -->
      <div v-if="stats.rescueTime?.week" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">
          PRODUCTIVITY
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Weekly</span>
            <span class="tabular-nums"
              >{{ stats.rescueTime.week.summary.total.hours }}h</span
            >
          </div>
          <div class="flex justify-between">
            <span>Productive</span>
            <span class="tabular-nums"
              >{{
                stats.rescueTime.week.summary.productive.percentage.toFixed(0)
              }}%</span
            >
          </div>
          <div class="flex justify-between">
            <span>Distracting</span>
            <span class="tabular-nums"
              >{{
                stats.rescueTime.week.summary.distracting.percentage.toFixed(0)
              }}%</span
            >
          </div>
        </div>
      </div>

      <!-- Last.fm Stats -->
      <div v-if="stats.lastfm" class="space-y-1">
        <div class="text-[10px] tracking-[0.2em] text-zinc-500">MUSIC</div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div class="flex justify-between">
            <span>Scrobbles</span>
            <span class="tabular-nums">{{
              stats.lastfm.stats?.totalScrobbles || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Artists</span>
            <span class="tabular-nums">{{
              stats.lastfm.stats?.uniqueArtists || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Daily Avg</span>
            <span class="tabular-nums">{{
              stats.lastfm.stats?.averagePerDay?.toFixed(1) || 0
            }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tracks</span>
            <span class="tabular-nums">{{
              stats.lastfm.stats?.uniqueTracks || 0
            }}</span>
          </div>
        </div>
        <!-- Now Playing / Recent -->
        <div
          v-if="stats.lastfm.recentTracks?.tracks?.[0]"
          class="mt-2 text-[10px]"
        >
          <div class="flex items-baseline gap-2">
            <div class="text-zinc-500">NOW</div>
            <div class="truncate">
              {{ stats.lastfm.recentTracks.tracks[0].name }} -
              {{ stats.lastfm.recentTracks.tracks[0].artist?.name }}
            </div>
          </div>
        </div>

        <!-- Top Artists -->
        <div v-if="stats.lastfm.topArtists?.artists" class="mt-3">
          <div class="text-[10px] text-zinc-500 mb-1">TOP_ARTISTS</div>
          <div class="space-y-0.5">
            <div
              v-for="(artist, index) in stats.lastfm.topArtists.artists.slice(
                0,
                3
              )"
              :key="artist.name"
              class="flex items-baseline justify-between text-[10px]"
            >
              <div class="truncate">{{ index + 1 }}. {{ artist.name }}</div>
              <div class="text-zinc-500 tabular-nums">
                {{ artist.playcount }}x
              </div>
            </div>
          </div>
        </div>

        <!-- Top Tracks -->
        <div v-if="stats.lastfm.topTracks?.tracks" class="mt-3">
          <div class="text-[10px] text-zinc-500 mb-1">TOP_TRACKS</div>
          <div class="space-y-0.5">
            <div
              v-for="(track, index) in stats.lastfm.topTracks.tracks.slice(
                0,
                3
              )"
              :key="track.name"
              class="flex items-baseline justify-between text-[10px]"
            >
              <div class="truncate">{{ index + 1 }}. {{ track.name }}</div>
              <div class="text-zinc-500 tabular-nums">
                {{ track.playcount }}x
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { useStats } from '~/composables/useStats'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  },
  blogStats: {
    type: Object,
    default: null
  }
})

// Calculate the day of year and year progress
const now = new Date()
const currentYear = now.getFullYear()
const startOfYear = new Date(currentYear, 0, 0)
const diff = now.getTime() - startOfYear.getTime()
const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24))
const isLeapYear =
  (currentYear % 4 === 0 && currentYear % 100 !== 0) || currentYear % 400 === 0
const daysInYear = isLeapYear ? 366 : 365

// Helper to get local (Eastern) date string in YYYY-MM-DD
const getEasternDateString = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
}

const todayLocal = getEasternDateString()

// If stats.health.today.day is not todayLocal, find the correct index in trends
const healthToday = computed(() => {
  if (!props.stats?.health) return { steps: 0, exerciseMinutes: 0 }
  // If the API's today is correct, use it
  if (props.stats.health.trends?.daily?.dates) {
    const idx = props.stats.health.trends.daily.dates.indexOf(todayLocal)
    if (idx !== -1) {
      return {
        steps: props.stats.health.trends.daily.steps[idx] || 0,
        exerciseMinutes: props.stats.health.trends.daily.exercise[idx] || 0
      }
    }
  }
  // fallback to API's today
  return props.stats.health.today || { steps: 0, exerciseMinutes: 0 }
})
</script>

<style scoped>
/* Dense mode specific styles */
.tabular-nums {
  font-feature-settings: 'tnum';
  font-variant-numeric: tabular-nums;
}
</style>
