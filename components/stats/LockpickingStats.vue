<template>
  <div class="space-y-6">
    <!-- Current Belt & Progress -->
    <div class="text-center space-y-4">
      <div class="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div :class="getBeltColor(currentBelt)" class="w-4 h-8 rounded-sm"></div>
        <div class="text-left">
          <div class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {{ currentBelt }} Belt
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            {{ getBeltDescription(currentBelt) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Belt Progression -->
    <div class="space-y-3">
      <h3 class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        Belt_Progression
      </h3>
      
      <div class="space-y-2">
        <div 
          v-for="belt in beltLevels" 
          :key="belt.name"
          class="flex items-center gap-3 p-3 rounded-lg transition-colors"
          :class="getBeltProgressClass(belt.name)"
        >
          <div :class="getBeltColor(belt.name)" class="w-3 h-6 rounded-sm flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline justify-between">
              <span class="text-sm font-medium" :class="belt.completed ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400'">
                {{ belt.name }}
              </span>
              <span v-if="belt.completed" class="text-xs text-green-600 dark:text-green-400 font-mono">
                ✓
              </span>
            </div>
            <div class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {{ belt.requirement }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Picks -->
    <div class="space-y-3">
      <h3 class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        Recent_Picks
      </h3>
      
      <div class="space-y-2">
        <div 
          v-for="pick in recentPicks" 
          :key="pick.id"
          class="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
        >
          <div :class="getBeltColor(pick.belt)" class="w-2 h-4 rounded-sm flex-shrink-0"></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {{ pick.lock }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ pick.date }} • {{ pick.method }}
            </div>
          </div>
          <div class="text-xs font-mono text-zinc-400">
            {{ pick.time }}
          </div>
        </div>
      </div>
    </div>

    <!-- Lock Collection -->
    <div class="space-y-3">
      <h3 class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        Lock_Collection
      </h3>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div 
          v-for="lock in lockCollection" 
          :key="lock.id"
          class="p-3 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {{ lock.name }}
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {{ lock.manufacturer }}
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-3">
              <div :class="getBeltColor(lock.belt)" class="w-2 h-4 rounded-sm mb-1"></div>
              <div class="text-xs font-mono text-zinc-400">
                {{ lock.status }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Targets -->
    <div class="space-y-3">
      <h3 class="text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
        Next_Targets
      </h3>
      
      <div class="space-y-2">
        <div 
          v-for="target in nextTargets" 
          :key="target.id"
          class="flex items-center gap-3 p-3 border border-dashed border-zinc-300 dark:border-zinc-600 rounded-lg"
        >
          <div :class="getBeltColor(target.belt)" class="w-2 h-4 rounded-sm flex-shrink-0 opacity-50"></div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {{ target.lock }}
            </div>
            <div class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ target.manufacturer }} • {{ target.belt }} Belt
            </div>
          </div>
          <div class="text-xs text-zinc-400">
            {{ target.difficulty }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Pick {
  id: string
  lock: string
  belt: string
  date: string
  method: string
  time: string
}

interface Lock {
  id: string
  name: string
  manufacturer: string
  belt: string
  status: 'picked' | 'owned' | 'target'
}

interface Target {
  id: string
  lock: string
  manufacturer: string
  belt: string
  difficulty: string
}

interface Belt {
  name: string
  requirement: string
  completed: boolean
}

// Fetch lockpicking data
const { data: lockpickingData } = await useFetch('/api/lockpicking')

// Current progress
const currentBelt = computed(() => lockpickingData.value?.currentBelt || 'White')

// Belt progression data with real completion status
const beltLevels = computed((): Belt[] => {
  const progress = lockpickingData.value?.beltProgress || {}
  return [
    { name: 'White', requirement: 'Pick any lock with any tool', completed: progress.White?.completed || false },
    { name: 'Yellow', requirement: 'Pick a Yellow Belt lock with basic security pins', completed: progress.Yellow?.completed || false },
    { name: 'Orange', requirement: 'Pick an Orange Belt lock with advanced security pins', completed: progress.Orange?.completed || false },
    { name: 'Green', requirement: 'Pick, gut, and reassemble a Green Belt lock', completed: progress.Green?.completed || false },
    { name: 'Blue', requirement: 'Pick and gut a Blue Belt lock + help community', completed: progress.Blue?.completed || false },
    { name: 'Purple', requirement: 'High-security locks with multiple mechanisms', completed: progress.Purple?.completed || false },
    { name: 'Brown', requirement: 'Expert-level locks requiring custom tools', completed: progress.Brown?.completed || false },
    { name: 'Red', requirement: 'Near-unpickable locks, mentor others', completed: progress.Red?.completed || false },
    { name: 'Black', requirement: 'Master-level achievement and innovation', completed: progress.Black?.completed || false }
  ]
})

// Recent picks data
const recentPicks = computed(() => lockpickingData.value?.recentPicks || [])

// Lock collection
const lockCollection = computed(() => lockpickingData.value?.lockCollection || [])

// Next targets
const nextTargets = computed(() => lockpickingData.value?.nextTargets || [])

// Helper functions
const getBeltColor = (belt: string): string => {
  const colors: Record<string, string> = {
    'White': 'bg-gray-100 border border-gray-300',
    'Yellow': 'bg-yellow-400',
    'Orange': 'bg-orange-500',
    'Green': 'bg-green-500',
    'Blue': 'bg-blue-500',
    'Purple': 'bg-purple-500',
    'Brown': 'bg-amber-700',
    'Red': 'bg-red-500',
    'Black': 'bg-gray-900'
  }
  return colors[belt] || 'bg-gray-400'
}

const getBeltDescription = (belt: string): string => {
  const descriptions: Record<string, string> = {
    'White': 'Beginner',
    'Yellow': 'Basic Security',
    'Orange': 'Advanced Security',
    'Green': 'Gutting Required',
    'Blue': 'Community Helper',
    'Purple': 'High Security',
    'Brown': 'Expert Level',
    'Red': 'Near Impossible',
    'Black': 'Master Level'
  }
  return descriptions[belt] || 'Unknown'
}

const getBeltProgressClass = (belt: string): string => {
  const completed = beltLevels.value.find(b => b.name === belt)?.completed
  return completed 
    ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
    : 'bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700'
}
</script>