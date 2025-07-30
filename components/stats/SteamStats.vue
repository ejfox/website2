<template>
  <div v-if="data?.stats" class="space-y-3 font-mono">
    <!-- Key metrics -->
    <div>
      <StatsSectionHeader title="GAMING STATUS" />
      <div class="grid grid-cols-2 gap-2">
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.totalGames || 0 }}
          </div>
          <div class="stat-label">
            TOTAL GAMES
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.gamesWithPlaytime || 0 }}
          </div>
          <div class="stat-label">
            PLAYED
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.totalPlaytime || 0 }}h
          </div>
          <div class="stat-label">
            TOTAL HOURS
          </div>
        </div>
        <div class="metric-card">
          <div class="stat-value">
            {{ data.stats.averagePlaytime || 0 }}h
          </div>
          <div class="stat-label">
            AVG PER GAME
          </div>
        </div>
      </div>
    </div>

    <!-- Recently played -->
    <div v-if="data?.stats?.recentlyPlayed?.length">
      <StatsSectionHeader title="RECENTLY PLAYED" />
      <div class="space-y-1.5">
        <div 
          v-for="game in data.stats.recentlyPlayed" 
          :key="game.appid"
          class="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <img 
              v-if="game.img_icon_url"
              :src="`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`"
              :alt="game.name"
              class="w-8 h-8 rounded flex-shrink-0"
            >
            <div class="min-w-0 flex-1">
              <div class="font-medium truncate">
                {{ game.name }}
              </div>
              <div class="text-xs text-muted">
                {{ game.playtime_2weeks }}h past 2 weeks
              </div>
            </div>
          </div>
          <div class="text-xs text-muted flex-shrink-0 ml-2">
            {{ game.playtime_forever }}h total
          </div>
        </div>
      </div>
    </div>

    <!-- Top games -->
    <div v-if="data?.stats?.topGames?.length">
      <StatsSectionHeader title="MOST PLAYED" />
      <div class="space-y-2">
        <div 
          v-for="(game, index) in data.stats.topGames.slice(0, 8)" 
          :key="game.appid"
          class="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg text-sm"
        >
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div class="text-xs text-muted font-mono w-6 flex-shrink-0">
              #{{ index + 1 }}
            </div>
            <img 
              v-if="game.img_icon_url"
              :src="`https://media.steampowered.com/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_url}.jpg`"
              :alt="game.name"
              class="w-8 h-8 rounded flex-shrink-0"
            >
            <div class="min-w-0 flex-1">
              <div class="font-medium truncate">
                {{ game.name }}
              </div>
              <a 
                :href="game.steamStoreUrl"
                target="_blank"
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                View on Steam ↗
              </a>
            </div>
          </div>
          <div class="text-sm font-mono flex-shrink-0 ml-2">
            {{ game.playtime_hours }}h
          </div>
        </div>
      </div>
    </div>

    <!-- Playtime visualization -->
    <div v-if="data?.stats?.topGames?.length">
      <StatsSectionHeader title="PLAYTIME DISTRIBUTION" />
      <div class="space-y-1">
        <div 
          v-for="game in data.stats.topGames.slice(0, 6)" 
          :key="game.appid"
          class="flex items-center gap-3"
        >
          <div class="text-xs text-muted w-24 truncate flex-shrink-0">
            {{ game.name }}
          </div>
          <div class="flex-1 bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 relative">
            <div 
              class="bg-blue-500 h-2 rounded-full"
              :style="{ width: `${(game.playtime_hours / maxPlaytime) * 100}%` }"
            ></div>
          </div>
          <div class="text-xs font-mono text-muted w-12 text-right flex-shrink-0">
            {{ game.playtime_hours }}h
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pt-4 border-t border-zinc-200 dark:border-zinc-800">
      <a 
        :href="data.stats.profileUrl" 
        target="_blank"
        rel="noopener noreferrer"
        class="text-xs text-muted hover:text-primary transition-colors uppercase tracking-wider"
      >
        View on Steam ↗
      </a>
    </div>
  </div>
  
  <div v-else-if="data?.error" class="text-center py-8">
    <div class="text-sm text-muted">
      {{ data.error }}
    </div>
    <div class="text-xs text-muted mt-2">
      Check Steam API configuration
    </div>
  </div>
  
  <div v-else class="text-center py-8 text-muted">
    <div class="text-sm">
      Steam data not available
    </div>
  </div>
</template>

<script setup>
import StatsSectionHeader from './StatsSectionHeader.vue'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({})
  }
})

// Calculate max playtime for visualization
const maxPlaytime = computed(() => {
  if (!props.data?.stats?.topGames?.length) return 1
  return Math.max(...props.data.stats.topGames.map(g => g.playtime_hours), 1)
})
</script>