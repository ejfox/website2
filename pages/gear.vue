<template>
  <main class="p-4 md:p-8 space-y-8">
    <!-- Quick TCWM Explanation -->
    <div class="max-w-3xl mb-8 p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
      <h3 class="text-lg font-medium mb-3">How to Read This List</h3>
      <p class="text-base text-zinc-600 dark:text-zinc-400">
        Each item is scored on four factors:
        <span class="text-blue-500">Time Criticality</span> (how quickly you need it),
        <span class="text-purple-500">Consequence</span> (impact if you don't have it),
        <span class="text-green-500">Weight</span> (how much it impacts mobility), and
        <span class="text-amber-500">Multi-use</span> (versatility).
        Higher scores (T1) mean the item should be immediately accessible.
      </p>
    </div>

    <!-- Add download option -->
    <div class="flex justify-end mb-4">
      <a href="/gear.csv" download class="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full
                bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700
                transition-colors">
        <UIcon name="i-heroicons-arrow-down-tray" class="w-4 h-4" />
        Download Full List
      </a>
    </div>

    <!-- Add this before the stats grid -->
    <div class="max-w-6xl mb-12">
      <!-- Two-column layout on md+ -->
      <div class="md:grid md:grid-cols-[1fr_auto] md:gap-12 items-start">
        <!-- Left column: Text content -->
        <div class="prose prose-zinc dark:prose-invert mb-8 md:mb-0">

          <p class="text-lg serif">
            For me
            everything must be weatherproof at highway speeds, when total capacity is limited to what a <span
              class="text-primary font-bold">Versys X 300</span> can
            carry, when items must be both accessible and waterproof, when creative tools need to coexist with survival
            gear.
            This requires thinking about every ounce deeply. I am really proud of this system, ever-evolving as I test
            and
            push it to new limits.
          </p>

          <p>
            The system currently manifests across a few primary containers
            <ruby class="font-mono text-sm">
              {{ totalWeight }}oz
              <rt class="flex gap-2 text-[10px] text-zinc-500">
                <span>{{ ouncesToPounds }}lb</span>
                <span>{{ ouncesToKilos }}kg</span>
              </rt>
            </ruby>:
          </p>

          <!-- Container List with Micro Stats -->
          <div class="space-y-2 my-6">
            <div v-for="[container, items] in groupedGear" :key="container">
              <!-- Only show primary containers -->
              <div v-if="PRIORITY_CONTAINERS.includes(container)" class="flex items-center gap-3 py-1">
                <UIcon :name="containerIcons[container] || 'i-material-symbols-light-backpack-rounded'"
                  class="w-4 h-4 text-zinc-400" />
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <div class="flex items-center gap-2">
                      <span class="font-medium">{{ container }}</span>
                      <!-- Location indicator -->
                      <span v-if="containerLocations[container]"
                        class="text-[10px] font-mono text-zinc-500 dark:text-zinc-400">
                        {{ containerLocations[container] }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-sm">
                      <div class="flex gap-px">
                        <div v-for="n in Math.floor(Number(calculateTotalWeight(items)) / 10)"
                          class="w-1 h-3 bg-zinc-200 dark:bg-zinc-700">
                        </div>
                      </div>
                      <ruby class="font-mono tabular-nums">
                        {{ calculateTotalWeight(items) }}oz
                        <rt class="text-[10px] text-zinc-500">
                          {{ (Number(calculateTotalWeight(items)) / 16).toFixed(1) }}lb
                        </rt>
                      </ruby>
                    </div>
                  </div>
                  <div class="text-xs text-zinc-500">
                    {{ items.length }} item{{ items.length === 1 ? '' : 's' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 my-6 text-sm">
            <div v-for="(score, type) in avgScores" :key="type" class="flex items-baseline justify-between gap-2">
              <span :class="scoreColors[type]">{{ scoreLabels[type] }}</span>
              <div class="flex items-center gap-2">
                <span class="font-mono tabular-nums">{{ score.toFixed(1) }}</span>
                <div class="w-16 h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div class="h-full" :class="scoreBgColors[type]" :style="{ width: `${(score / 5) * 100}%` }">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p class="text-sm text-zinc-500">
            Whether you ride or not, the principles here apply to anyone interested in maintaining multiple capabilities
            within strict constraints.
          </p>
        </div>

        <!-- Right column: Hero image -->
        <div class="md:sticky md:top-8 min-w-full md:w-[33vw] md:min-w-[33vw]">
          <div class="relative rounded-2xl overflow-hidden shadow-2xl dark:shadow-zinc-950/50">
            <img src="https://res.cloudinary.com/ejf/image/upload/v1732053354/IMG_0010.jpg"
              alt="Motorcycle packed with gear and hand-drawn annotations" class="w-full h-auto" />
            <div
              class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-zinc-150/90 via-zinc-900/30 to-transparent backdrop-blur-[2px] p-4">
              <div class="text-xs text-zinc-950 font-mono">
                Versys X 300 on Mount Washington with full gear loadout; backpack, cooler, GPS, water, and camp setup.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add this right after <main> and before the two-column layout -->
    <div class="max-w-3xl mb-12">
      <!-- Primary Stats -->
      <div class="prose prose-zinc dark:prose-invert mb-8">
        <h2 class="uppercase text-2xl text-zinc-600 dark:text-zinc-300 leading-relaxed">
          Currently tracking <span class="px-1 bg-black/30 rounded tabular-nums">{{ totalItems }}</span> items
          across <span class="px-1 bg-black/30 rounded tabular-nums">{{ containerCount }}</span> containers.
        </h2>
      </div>

      <!-- Feltron-style Stats Grid -->
      <div class="space-y-12">
        <!-- Key Metrics - Big Numbers -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-8 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div class="space-y-1">
            <div class="font-mono text-5xl tabular-nums">{{ totalItems }}</div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Total Items</div>
          </div>
          <div class="space-y-1">
            <div class="font-mono text-5xl tabular-nums">{{ totalWeight }}oz</div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Total Weight</div>
          </div>
          <div class="space-y-1">
            <div class="font-mono text-5xl tabular-nums">{{ avgTCWMScore }}</div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Avg TCWM Score</div>
          </div>
        </div>

        <!-- Distribution Charts -->
        <div class="grid grid-cols-2 gap-12">
          <!-- Weight Distribution -->
          <div class="space-y-4">
            <div class="text-base font-medium">Weight Distribution</div>
            <div class="h-24 flex items-end gap-px">
              <div v-for="(count, i) in weightDistribution" :key="i"
                class="flex-1 bg-zinc-900/5 dark:bg-zinc-100/5 hover:bg-zinc-900/10 dark:hover:bg-zinc-100/10 transition-colors"
                :style="{ height: `${(count / Math.max(...weightDistribution)) * 100}%` }">
              </div>
            </div>
            <div class="flex justify-between text-sm text-zinc-500 font-mono">
              <span>0oz</span>
              <span>{{ Math.max(...gearItems.map(item => parseFloat(item['Base Weight ()']) || 0)).toFixed(1)
                }}oz</span>
            </div>
          </div>

          <!-- Score Distribution -->
          <div class="space-y-4">
            <div class="text-base font-medium">TCWM Score Distribution</div>
            <div class="h-24 flex items-end gap-px">
              <div v-for="(count, i) in tcwmDistribution" :key="i" :class="[
                'flex-1 transition-colors',
                i >= 35 ? 'bg-blue-500/20 hover:bg-blue-500/30' :
                  i >= 25 ? 'bg-amber-500/20 hover:bg-amber-500/30' :
                    'bg-green-500/20 hover:bg-green-500/30'
              ]" :style="{ height: `${(count / Math.max(...tcwmDistribution)) * 100}%` }">
              </div>
            </div>
            <div class="flex justify-between text-sm font-mono">
              <span class="text-green-500">T₃</span>
              <span class="text-amber-500">T₂</span>
              <span class="text-blue-500">T₁</span>
            </div>
          </div>
        </div>

        <!-- Notable Items -->
        <div class="grid grid-cols-3 gap-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
          <!-- Heaviest -->
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="font-mono text-3xl tabular-nums">{{ heaviestItem?.weight }}oz</div>
              <div class="text-base text-zinc-600 dark:text-zinc-400 line-clamp-1" :title="heaviestItem?.name">
                {{ heaviestItem?.name }}
              </div>
            </div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Heaviest Item</div>
          </div>

          <!-- Lightest -->
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="font-mono text-3xl tabular-nums">{{ lightestItem?.weight }}oz</div>
              <div class="text-base text-zinc-600 dark:text-zinc-400 line-clamp-1" :title="lightestItem?.name">
                {{ lightestItem?.name }}
              </div>
            </div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Lightest Item</div>
          </div>

          <!-- Highest Multi-use -->
          <div class="space-y-4">
            <div class="space-y-1">
              <div class="font-mono text-3xl tabular-nums">{{ highestMultiUse?.score }}</div>
              <div class="text-base text-zinc-600 dark:text-zinc-400 line-clamp-1" :title="highestMultiUse?.name">
                {{ highestMultiUse?.name }}
              </div>
            </div>
            <div class="text-sm text-zinc-500 font-medium tracking-wide uppercase">Highest Multi-Use</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Two-column layout for gear items and legend -->
    <div class="lg:grid lg:grid-cols-[1fr_minmax(auto,24rem)] lg:gap-8">
      <!-- Left column: Gear items -->
      <div>
        <h1 class="text-4xl font-bold mb-8">Gear</h1>

        <!-- Add this after the h1 and before the container-based layout -->
        <div class="mb-8">
          <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4">
            <h2 class="uppercase text-base font-medium mb-3">Quick Navigation</h2>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <div v-for="[container, items] in groupedGear" :key="container">
                <a :href="`#${container.toLowerCase().replace(/\s+/g, '-')}`"
                  class="group flex items-center justify-between p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors">
                  <div class="min-w-0">
                    <div class="font-medium truncate flex items-center gap-1.5">
                      <UIcon :name="containerIcons[container] || typeIcons[getContainerType(items)]"
                        class="w-4 h-4 shrink-0" />
                      {{ container }}
                    </div>
                    <div class="text-xs text-zinc-500">
                      {{ items.length }} items • {{ calculateTotalWeight(items) }}oz
                    </div>
                  </div>
                  <div class="text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300">
                    <UIcon name="i-heroicons-arrow-down" class="w-4 h-4" />
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Container-based layout -->
        <div class="grid grid-cols-1 gap-4 sm:gap-6">
          <!-- Loop through containers -->
          <div v-for="[container, items] in groupedGear" :key="container"
            :id="container.toLowerCase().replace(/\s+/g, '-')"
            class="border dark:border-zinc-800 rounded-lg overflow-hidden scroll-mt-4">
            <!-- Container Header -->
            <div class="w-full p-3 sm:p-4 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div class="flex items-center gap-2 sm:gap-3">
                <h2 class="uppercase text-base sm:text-lg font-bold">{{ container }}</h2>
                <span class="text-xs sm:text-sm text-zinc-500">
                  ({{ items.length }} items)
                </span>
              </div>
              <span class="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                <!-- <ruby class="font-mono tabular-nums">
                  {{ calculateTotalWeight(items) }}oz
                  <rt class="text-zinc-500">
                    {{ (Number(calculateTotalWeight(items)) / 16).toFixed(1) }}lb
                  </rt>
                </ruby> -->
                {{ calculateTotalWeight(items) }}oz
                <span class="opacity-50">
                  ({{ (Number(calculateTotalWeight(items)) / 16).toFixed(1) }}lb)
                </span>
              </span>
            </div>

            <!-- Container Items -->
            <div class="divide-y divide-zinc-100 dark:divide-zinc-800">
              <GearItem v-for="item in sortItemsByScore(items)" :key="item.Name" :item="item" :create-viz="createViz" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right column: Sticky legend -->
      <div class="hidden lg:block">
        <div class="sticky top-8 space-y-8 max-h-[calc(100vh-4rem)] flex flex-col">
          <!-- Type legend -->
          <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4 shrink-0">
            <h3 class="text-sm font-medium mb-3">Gear Types</h3>
            <div class="grid grid-cols-2 gap-x-6 gap-y-2">
              <div v-for="(icon, type) in typeIcons" :key="type" class="flex items-center gap-2 text-sm"
                :class="typeClasses[type]">
                <UIcon :name="icon" class="w-4 h-4" />
                <span>{{ type }}</span>
              </div>
            </div>
          </div>

          <!-- How to read chart legend -->
          <div class="space-y-8 shrink-0">
            <!-- Visualization Legend -->
            <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-6">
              <h2 class="text-lg font-bold mb-4">How to Read the Charts</h2>
              <div class="flex gap-8 items-center">
                <!-- Example visualization -->
                <div class="w-32 h-32 relative shrink-0">
                  <svg id="legend-viz" class="w-full h-full">
                    <!-- D3 will inject example visualization here -->
                  </svg>
                </div>

                <div class="text-sm space-y-2 text-zinc-600 dark:text-zinc-400">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 border-2 border-current rounded-full opacity-30"></div>
                    <span>Circle size represents item weight</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-current rounded-full opacity-40"></div>
                    <span>Arc completion shows total score (out of 20)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="flex">
                      <div class="w-1.5 h-1.5 bg-current rounded-full opacity-30"></div>
                      <div class="w-1.5 h-1.5 bg-current rounded-full opacity-30 ml-2"></div>
                    </div>
                    <span>Corner dots show T/C/W/M scores (clockwise from top)</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 bg-blue-500 rounded-full opacity-60"></div>
                    <span>Colors indicate gear type (see legend above)</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- TCWM Categories only (remove formula section) -->
            <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-4">
              <h2 class="text-base font-medium mb-4">Understanding TCWM Scores</h2>

              <!-- Add back scrolling container -->
              <div class="overflow-x-auto thin-scrollbar">
                <div class="grid grid-cols-4 gap-4 text-sm min-w-[40rem]">
                  <!-- Time Criticality -->
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-medium">Time Criticality</span>
                      <span class="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">T</span>
                    </div>
                    <div class="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">5</span>
                        <span>Immediate <span class="text-zinc-400">(&lt;5m)</span></span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">4</span>
                        <span>Very Soon <span class="text-zinc-400">(&lt;1h)</span></span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">3</span>
                        <span>Same Day <span class="text-zinc-400">(&lt;24h)</span></span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">2</span>
                        <span>This Week <span class="text-zinc-400">(&lt;7d)</span></span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">1</span>
                        <span>Eventually <span class="text-zinc-400">(&gt;7d)</span></span>
                      </div>
                    </div>
                  </div>

                  <!-- Consequence -->
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-medium">Consequence</span>
                      <span class="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">C</span>
                    </div>
                    <div class="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">5</span>
                        <span>Life-threatening</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">4</span>
                        <span>Major health/safety</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">3</span>
                        <span>Significant discomfort</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">2</span>
                        <span>Notable inconvenience</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">1</span>
                        <span>Minor inconvenience</span>
                      </div>
                    </div>
                  </div>

                  <!-- Weight -->
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-medium">Weight/Space</span>
                      <span class="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">W</span>
                    </div>
                    <div class="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">5</span>
                        <span>Negligible</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">4</span>
                        <span>Light/Small</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">3</span>
                        <span>Moderate</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">2</span>
                        <span>Heavy/Bulky</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">1</span>
                        <span>Very Heavy/Bulky</span>
                      </div>
                    </div>
                  </div>

                  <!-- Multi-Use -->
                  <div>
                    <div class="flex items-center gap-2 mb-2">
                      <span class="font-medium">Multi-Use</span>
                      <span class="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 rounded">M</span>
                    </div>
                    <div class="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">5</span>
                        <span>Critical in 3+ scenarios</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">4</span>
                        <span>Important in 2+ scenarios</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">3</span>
                        <span>Critical in 1 scenario</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">2</span>
                        <span>Useful in multiple cases</span>
                      </div>
                      <div class="grid grid-cols-[1.25rem_1fr] gap-2">
                        <span class="font-mono text-right">1</span>
                        <span>Single specific use</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- New full-width formula section at bottom -->
    <div class="mx-auto">
      <div class="bg-zinc-50 dark:bg-zinc-900/50 rounded-lg p-2 md:p-4 space-y-8">
        <!-- Formula section -->
        <div>
          <h3 class="text-lg font-medium mb-6">TCWM Score Formula</h3>
          <div class="bg-zinc-100 dark:bg-zinc-800/50 p-6 rounded-lg">
            <!-- Main formula with semantic markup -->
            <div class="flex flex-wrap items-center justify-center gap-4 font-mono text-xl mb-8">
              <!-- Score term -->
              <div class="flex items-center gap-2">
                <ruby class="text-2xl">
                  S
                  <rt class="text-xs text-zinc-400">score</rt>
                </ruby>
                <span class="text-zinc-400">=</span>
              </div>

              <!-- Time Criticality term -->
              <div class="flex items-center">
                <ruby class="text-blue-500 dark:text-blue-400">
                  2T
                  <rt class="text-xs text-zinc-400 whitespace-nowrap">criticality</rt>
                </ruby>
              </div>

              <span class="text-zinc-400">+</span>

              <!-- Consequence term -->
              <div class="flex items-center">
                <ruby class="text-purple-500 dark:text-purple-400">
                  2C
                  <rt class="text-xs text-zinc-400 whitespace-nowrap">consequence</rt>
                </ruby>
              </div>

              <span class="text-zinc-400">+</span>

              <!-- Weight term -->
              <div class="flex items-center">
                <ruby class="text-green-500 dark:text-green-400">
                  1.5W
                  <rt class="text-xs text-zinc-400 whitespace-nowrap">weight</rt>
                </ruby>
              </div>

              <span class="text-zinc-400">+</span>

              <!-- Multi-use term -->
              <div class="flex items-center">
                <ruby class="text-amber-500 dark:text-amber-400">
                  M
                  <rt class="text-xs text-zinc-400 whitespace-nowrap">multi-use</rt>
                </ruby>
              </div>
            </div>

            <!-- Domain definitions with semantic markup -->
            <div class="text-center space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <div class="space-x-6">
                <span>
                  <ruby>
                    S
                    <rt class="text-xs text-zinc-400">score</rt>
                  </ruby>
                  <span class="mx-1">∈</span>
                  [0, 47.5]
                </span>
                <span class="text-zinc-400">|</span>
                <span>
                  <ruby>T<rt>time</rt></ruby>,
                  <ruby>C<rt>cons</rt></ruby>,
                  <ruby>M<rt>multi</rt></ruby>
                  <span class="mx-1">∈</span>
                  {1, 2, 3, 4, 5}
                </span>
              </div>
              <div>
                <ruby>W<rt>weight</rt></ruby>
                <span class="mx-1">∈</span>
                {1, 2, 3, 4, 5}
              </div>
            </div>
          </div>
        </div>

        <!-- Replace the Tier Classification section -->
        <div>
          <h3 class="text-lg font-medium mb-6">Access Tiers</h3>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <!-- Tier 1 -->
            <div class="relative">
              <div class="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/80 to-blue-500/20">
              </div>
              <div class="space-y-2">
                <div class="flex items-baseline gap-3">
                  <ruby class="font-mono text-lg tracking-tight">
                    T₁
                    <rt class="text-[10px] sans-serif text-zinc-400">on-person</rt>
                  </ruby>
                  <span class="font-mono text-sm tabular-nums text-zinc-500">35–47.5</span>
                </div>
                <div class="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Critical gear requiring immediate access. Typically carried on body or in immediately accessible
                  locations.
                  <span class="block mt-1 font-mono text-[10px] text-zinc-400">response time: &lt; 5 seconds</span>
                </div>
              </div>
            </div>

            <!-- Tier 2 -->
            <div class="relative">
              <div class="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/80 to-blue-500/20">
              </div>
              <div class="space-y-2">
                <div class="flex items-baseline gap-3">
                  <ruby class="font-mono text-lg tracking-tight">
                    T₂
                    <rt class="text-[10px] sans-serif text-zinc-400">vehicle/pack</rt>
                  </ruby>
                  <span class="font-mono text-sm tabular-nums text-zinc-500">25–34.5</span>
                </div>
                <div class="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Support gear stored in vehicle or pack. Important but not time-critical access requirements.
                  <span class="block mt-1 font-mono text-[10px] text-zinc-400">response time: &lt; 5 minutes</span>
                </div>
              </div>
            </div>

            <!-- Tier 3 -->
            <div class="relative">
              <div class="absolute -left-3 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500/80 to-blue-500/20">
              </div>
              <div class="space-y-2">
                <div class="flex items-baseline gap-3">
                  <ruby class="font-mono text-lg tracking-tight">
                    T₃
                    <rt class="text-[10px] sans-serif text-zinc-400">base cache</rt>
                  </ruby>
                  <span class="font-mono text-sm tabular-nums text-zinc-500">&lt; 25</span>
                </div>
                <div class="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Auxiliary gear stored at base location. Occasional access needs with planned retrieval.
                  <span class="block mt-1 font-mono text-[10px] text-zinc-400">response time: &lt; 24 hours</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Optional: Add a minimal data visualization -->
          <div class="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div class="h-12 flex items-stretch gap-px">
              <div class="flex-1 bg-blue-500/20 dark:bg-blue-500/10 relative">
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-500/20 to-transparent"></div>
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] text-blue-600 dark:text-blue-400 mt-1">
                  47.5</div>
              </div>
              <div class="flex-1 bg-amber-500/20 dark:bg-amber-500/10 relative">
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  35</div>
              </div>
              <div class="flex-1 bg-amber-500/20 dark:bg-amber-500/10 relative">
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-amber-500/20 to-transparent"></div>
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  25</div>
              </div>
              <div class="flex-1 bg-green-500/20 dark:bg-green-500/10 relative">
                <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green-500/20 to-transparent"></div>
                <div
                  class="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[10px] text-green-600 dark:text-green-400 mt-1">
                  0</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import * as d3 from 'd3'

const gearItems = ref([])
const svgRefs = new Map()

// Add color scale for types
const typeColors = {
  'Tech': '#71717a',
  'Utility': '#71717a',
  'Comfort': '#71717a',
  'Sleep': '#71717a',
  'Bag': '#71717a',
  'Safety': '#ef4444',  // Keep red for safety items
  'Creativity': '#71717a'
}

// Helper function to get color with fallback
const getTypeColor = (type) => {
  return typeColors[type] || '#94a3b8' // default to slate if type not found
}

// Helper to set SVG refs
const setSvgRef = (el, name) => {
  if (el) svgRefs.set(name, el)
}

// Updated visualization function
const createViz = (item, svgEl) => {
  const svg = d3.select(svgEl)
  svg.selectAll('*').remove()

  const width = svgEl.clientWidth
  const height = svgEl.clientHeight
  const padding = 10
  const minRadius = 10

  const weightScale = d3.scaleSqrt()
    .domain([0, d3.max(gearItems.value, d => parseFloat(d['Base Weight ()']) || 0)])
    .range([minRadius, Math.min(width, height) / 2 - padding])

  const scoreScale = d3.scaleLinear()
    .domain([0, 20])
    .range([0, Math.PI * 2])

  const centerX = width / 2
  const centerY = height / 2

  // Get color based on type
  const itemColor = getTypeColor(item.Type)

  // Draw weight circle with type color
  const weight = parseFloat(item['Base Weight ()']) || 0
  svg.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', weightScale(weight))
    .attr('fill', 'none')
    .attr('stroke', itemColor)
    .attr('class', 'opacity-20 dark:opacity-30')
    .attr('stroke-width', 1.5)

  // Draw score arc with type color
  const score = parseFloat(item['Total Score']) || 0
  const arc = d3.arc()
    .innerRadius(weightScale(weight) - 2)
    .outerRadius(weightScale(weight))
    .startAngle(0)
    .endAngle(scoreScale(score))

  svg.append('path')
    .attr('d', arc)
    .attr('transform', `translate(${centerX},${centerY})`)
    .attr('fill', itemColor)
    .attr('class', 'opacity-40 dark:opacity-50')

  // Create a group for the visualization to handle hover
  const vizGroup = svg.append('g')
    .attr('class', 'viz-group')
    .style('cursor', 'pointer')

  // Draw weight circle with type color
  vizGroup.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', weightScale(weight))
    .attr('fill', 'none')
    .attr('stroke', itemColor)
    .attr('class', 'opacity-20 dark:opacity-30')
    .attr('stroke-width', 1.5)

  // Draw score arc with type color
  vizGroup.append('path')
    .attr('d', arc)
    .attr('transform', `translate(${centerX},${centerY})`)
    .attr('fill', itemColor)
    .attr('class', 'opacity-40 dark:opacity-50')

  // Define indicators once
  const tcwmIndicators = [
    { key: 'Time Criticality (T)', angle: 0, label: 'T' },
    { key: 'Consequence Severity (C)', angle: Math.PI / 2, label: 'C' },
    { key: 'Weight/Space Penalty (W)', angle: Math.PI, label: 'W' },
    { key: 'Multi-Use Factor (M)', angle: Math.PI * 3 / 2, label: 'M' }
  ]

  // Add indicators with type color and their value labels
  tcwmIndicators.forEach(({ key, angle, label }) => {
    const value = parseFloat(item[key]) || 0
    const radius = weightScale(weight) + 5

    const indicatorGroup = vizGroup.append('g')
      .attr('transform', `translate(${centerX + Math.cos(angle) * radius}, ${centerY + Math.sin(angle) * radius})`)

    // Add the circle
    indicatorGroup.append('circle')
      .attr('r', value)
      .attr('fill', itemColor)
      .attr('class', 'opacity-30 dark:opacity-40 transition-opacity duration-200')

    // Add the value text (hidden by default)
    indicatorGroup.append('text')
      .attr('class', 'font-mono text-[10px] fill-current opacity-0 transition-opacity duration-200')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(value)
  })

  // Add hover effects
  vizGroup
    .on('mouseenter', function () {
      // Hide circles, show numbers
      d3.select(this)
        .selectAll('circle:not(:first-child)')
        .classed('opacity-0', true)

      d3.select(this)
        .selectAll('text')
        .classed('opacity-80', true)
        .classed('opacity-0', false)
    })
    .on('mouseleave', function () {
      // Show circles, hide numbers
      d3.select(this)
        .selectAll('circle:not(:first-child)')
        .classed('opacity-30', true)
        .classed('opacity-0', false)

      d3.select(this)
        .selectAll('text')
        .classed('opacity-0', true)
        .classed('opacity-80', false)
    })
}

// Update the legend creation function to handle both desktop and mobile
const createLegend = () => {
  // Create desktop legend
  const legendContainer = d3.select('#type-legend')
  createLegendContent(legendContainer)

  // Create mobile legend
  const mobileLegendContainer = d3.select('#type-legend-mobile')
  createLegendContent(mobileLegendContainer)
}

// Helper function to create legend content
const createLegendContent = (container) => {
  Object.entries(typeColors).forEach(([type, color]) => {
    const item = container
      .append('div')
      .attr('class', 'flex items-center gap-2 text-sm')

    item.append('div')
      .attr('class', 'w-3 h-3 rounded-full opacity-60')
      .style('background-color', color)

    item.append('span')
      .text(type)
  })
}

// Update the legend visualization function
const createLegendViz = () => {
  const svg = d3.select('#legend-viz')
  svg.selectAll('*').remove()

  const width = svg.node().clientWidth
  const height = svg.node().clientHeight
  const centerX = width / 2
  const centerY = height / 2
  const radius = Math.min(width, height) / 3 // Make the example a bit larger
  const minRadius = 10 // Match the main visualization's minimum

  // Example circle (weight indicator)
  svg.append('circle')
    .attr('cx', centerX)
    .attr('cy', centerY)
    .attr('r', Math.max(radius, minRadius))
    .attr('fill', 'none')
    .attr('stroke', 'currentColor')
    .attr('class', 'opacity-20 dark:opacity-30')
    .attr('stroke-width', 1.5)

  // Example arc (score indicator - showing 15/20 = 75%)
  const arc = d3.arc()
    .innerRadius(Math.max(radius, minRadius) - 2)
    .outerRadius(Math.max(radius, minRadius))
    .startAngle(0)
    .endAngle(Math.PI * 1.5) // 75% of full circle

  svg.append('path')
    .attr('d', arc)
    .attr('transform', `translate(${centerX},${centerY})`)
    .attr('class', 'fill-current opacity-40 dark:opacity-50')

  // Use consistent naming for indicators
  const tcwmIndicators = [
    { angle: 0, value: 4, label: 'T' },
    { angle: Math.PI / 2, value: 5, label: 'C' },
    { angle: Math.PI, value: 3, label: 'W' },
    { angle: Math.PI * 3 / 2, value: 4, label: 'M' }
  ]

  tcwmIndicators.forEach(({ angle, value, label }) => {
    const indicatorRadius = Math.max(radius, minRadius) + 5
    const indicatorGroup = svg.append('g')
      .attr('transform', `translate(${centerX + Math.cos(angle) * indicatorRadius}, ${centerY + Math.sin(angle) * indicatorRadius})`)

    // Add the circle
    indicatorGroup.append('circle')
      .attr('r', value)
      .attr('class', 'fill-current opacity-30 dark:opacity-40 transition-opacity duration-200')

    // Add the value text (hidden by default)
    indicatorGroup.append('text')
      .attr('class', 'font-mono text-[10px] fill-current opacity-0 transition-opacity duration-200')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .text(value)
  })

  // Add hover effects
  svg
    .on('mouseenter', function () {
      d3.select(this)
        .selectAll('circle:not(:first-child)')
        .classed('opacity-0', true)

      d3.select(this)
        .selectAll('text')
        .classed('opacity-80', true)
        .classed('opacity-0', false)
    })
    .on('mouseleave', function () {
      d3.select(this)
        .selectAll('circle:not(:first-child)')
        .classed('opacity-30', true)
        .classed('opacity-0', false)

      d3.select(this)
        .selectAll('text')
        .classed('opacity-0', true)
        .classed('opacity-80', false)
    })
}

// Add new refs and computed properties
const expandedContainers = computed(() => ({
  has: () => true
}))

// Group items by container
const groupedGear = computed(() => {
  const groups = new Map()

  // First, collect all unique containers
  const containers = new Set(gearItems.value.map(item => item['Parent Container']))
  containers.forEach(container => groups.set(container || 'Unassigned', []))

  // Then group items
  gearItems.value.forEach(item => {
    const container = item['Parent Container'] || 'Unassigned'
    groups.get(container).push(item)
  })

  // Sort containers to ensure Body and important containers come first
  const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
    const aIndex = PRIORITY_CONTAINERS.indexOf(a[0])
    const bIndex = PRIORITY_CONTAINERS.indexOf(b[0])
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  return new Map(sortedEntries)
})

// Calculate total weight for a container
const calculateTotalWeight = (items) => {
  if (!items?.length) return '0.0'
  return items
    .reduce((sum, item) => sum + (parseFloat(item['Base Weight ()']) || 0), 0)
    .toFixed(1)
}

// Add affiliate URL handling
const addAffiliateCode = (url) => {
  if (!url || !url.includes('amazon.com')) return url
  const amazonUrl = new URL(url)
  amazonUrl.searchParams.set('tag', 'ejfox0c-20')
  return amazonUrl.toString()
}

// Update the GearItem component to use the affiliate URL
const processGearItem = (item) => {
  if (item.amazon) {
    item.amazon = addAffiliateCode(item.amazon)
  }
  return item
}

// Update the onMounted hook to process Amazon links
onMounted(async () => {
  try {
    const response = await fetch('/gear.csv')
    const csvText = await response.text()
    gearItems.value = d3.csvParse(csvText).map(processGearItem)

    await nextTick()
    gearItems.value.forEach(item => {
      const svgEl = svgRefs.get(item.Name)
      if (svgEl) createViz(item, svgEl)
    })

    createLegend()
    createLegendViz()
  } catch (error) {
    console.error('Error loading gear data:', error)
  }
})

// Update resize handler to include legend viz
const debouncedResize = useDebounceFn(() => {
  gearItems.value.forEach(item => {
    const svgEl = svgRefs.get(item.Name)
    if (svgEl) createViz(item, svgEl)
  })
  createLegendViz() // Recreate legend viz on resize
}, 250)

onMounted(() => {
  window.addEventListener('resize', debouncedResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
})

// Add this helper function to determine container type
function getContainerType(items) {
  // Return the most common type in the container
  const types = items.map(item => item.Type).filter(Boolean)
  if (!types.length) return null

  return Object.entries(
    types.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
  ).sort((a, b) => b[1] - a[1])[0][0]
}

// Update typeIcons to match GearItem.vue
const typeIcons = {
  'Tech': 'i-material-symbols-light-earbuds-battery',
  'Utility': 'i-heroicons-wrench',
  'Comfort': 'i-heroicons-heart',
  'Sleep': 'i-heroicons-moon',
  'Bag': 'i-material-symbols-light-backpack-outline',
  'Safety': 'i-heroicons-shield-check',
  'Creativity': 'i-heroicons-sparkles'
}

// Add typeClasses to match GearItem.vue for consistent styling
const typeClasses = {
  'Tech': 'text-zinc-600 dark:text-zinc-400',
  'Utility': 'text-zinc-600 dark:text-zinc-400',
  'Comfort': 'text-zinc-600 dark:text-zinc-400',
  'Sleep': 'text-zinc-600 dark:text-zinc-400',
  'Bag': 'text-zinc-600 dark:text-zinc-400',
  'Safety': 'text-red-600 dark:text-red-400',  // Keep red for safety
  'Creativity': 'text-zinc-600 dark:text-zinc-400'
}

// Container-specific icons take precedence over type icons
const containerIcons = {
  'Motorcycle': 'i-fa6-solid-motorcycle',
  'WLF Enduro Backpack': 'i-material-symbols-light-backpack-rounded',
  '5.11 Rush 24 Backpack': 'i-material-symbols-light-backpack-rounded'
}

// Add at the top of the script section
const totalItems = computed(() => gearItems.value.length)
const totalWeight = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  return gearItems.value
    .reduce((sum, item) => sum + (parseFloat(item['Base Weight ()']) || 0), 0)
    .toFixed(1)
})

const containerCount = computed(() => groupedGear.value?.size || 0)

const typeBreakdown = computed(() => {
  const types = gearItems.value.reduce((acc, item) => {
    if (item.Type) {
      acc[item.Type] = (acc[item.Type] || 0) + 1
    }
    return acc
  }, {})
  return Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([type, count]) => `${type} (${count})`)
    .join(', ')
})

// SEO metadata
useHead(() => ({
  title: 'Aventure Gear Inventory',
  meta: [
    {
      name: 'description',
      content: `Comprehensive gear inventory tracking ${totalItems.value} items across ${containerCount.value} containers. Total weight: ${totalWeight.value}oz. Main categories: ${typeBreakdown.value}.`
    },
    // Open Graph
    {
      property: 'og:title',
      content: 'Adventure Gear Inventory'
    },
    {
      property: 'og:description',
      content: `Detailed gear tracking system with weight calculations and TCWM scoring. ${totalItems.value} items, ${totalWeight.value}oz total.`
    },
    {
      property: 'og:type',
      content: 'website'
    },
    // Twitter Card
    {
      name: 'twitter:card',
      content: 'summary'
    },
    {
      name: 'twitter:title',
      content: 'Adventure Gear Inventory'
    },
    {
      name: 'twitter:description',
      content: `Tracking ${totalItems.value} adventure gear items (${totalWeight.value}oz) with detailed scoring and categorization.`
    },
    // Additional metadata
    {
      name: 'keywords',
      content: 'adventure gear, inventory management, gear tracking, TCWM scoring, outdoor equipment'
    },
    {
      name: 'author',
      content: 'Adventure Gear Tracker'
    },
    {
      name: 'robots',
      content: 'index, follow'
    }
  ],
  // Optional: Add structured data for rich results
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Adventure Gear Inventory',
        numberOfItems: totalItems.value,
        itemListElement: groupedGear.value ? Array.from(groupedGear.value).map(([container, items], index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: container,
          numberOfItems: items.length,
          description: `${items.length} items, ${calculateTotalWeight(items)}oz total weight`
        })) : []
      })
    }
  ]
}))

// Add these computed properties
const weightDistribution = computed(() => {
  if (!gearItems.value?.length) return Array(20).fill(0)

  const weights = gearItems.value.map(item => parseFloat(item['Base Weight ()']) || 0)
  const max = Math.max(...weights)
  const bins = Array(30).fill(0) // More bins for smoother distribution

  weights.forEach(w => {
    const bin = Math.floor((w / max) * (bins.length - 1))
    bins[bin]++
  })

  return bins
})

const avgWeight = computed(() => {
  if (!gearItems.value?.length) return '0.0'
  const weights = gearItems.value.map(item => parseFloat(item['Base Weight ()']) || 0)
  return (weights.reduce((a, b) => a + b, 0) / weights.length).toFixed(1)
})

const tierCounts = computed(() => {
  const counts = { t1: 0, t2: 0, t3: 0 }
  gearItems.value.forEach(item => {
    const score = calculateTCWMScore(item)
    if (score >= 35) counts.t1++
    else if (score >= 25) counts.t2++
    else counts.t3++
  })
  return counts
})

const topTypes = computed(() => {
  const types = gearItems.value.reduce((acc, item) => {
    if (item.Type) acc[item.Type] = (acc[item.Type] || 0) + 1
    return acc
  }, {})
  return Object.entries(types)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([type, count]) => `${type} ${count}`)
    .join(' · ')
})

// Helper function for TCWM calculation
const calculateTCWMScore = (item) => {
  const T = Number(item['Time Criticality (T)']) || 0
  const C = Number(item['Consequence Severity (C)']) || 0
  const W = Number(item['Weight/Space Penalty (W)']) || 0
  const M = Number(item['Multi-Use Factor (M)']) || 0
  return (2 * T) + (2 * C) + (1.5 * W) + M
}

// Update the computed properties with null checks
const heaviestItem = computed(() => {
  if (!gearItems.value?.length) return null
  const item = [...gearItems.value].sort((a, b) =>
    (parseFloat(b['Base Weight ()']) || 0) - (parseFloat(a['Base Weight ()']) || 0)
  )[0]
  return item ? {
    name: item.Name,
    weight: parseFloat(item['Base Weight ()']).toFixed(1)
  } : null
})

const lightestItem = computed(() => {
  if (!gearItems.value?.length) return null;
  const items = gearItems.value.filter(item => parseFloat(item['Base Weight ()']) > 0);
  if (!items.length) return null;

  const item = items.sort((a, b) =>
    (parseFloat(a['Base Weight ()']) || 0) - (parseFloat(b['Base Weight ()']) || 0)
  )[0];

  return item ? {
    name: item.Name,
    weight: parseFloat(item['Base Weight ()']).toFixed(1)
  } : null;
});

// Add new computed property for space efficiency
const leastEfficientItem = computed(() => {
  if (!gearItems.value?.length) return null;
  // Calculate efficiency score: weight / (TCWM score)
  const items = gearItems.value.map(item => {
    const weight = parseFloat(item['Base Weight ()']) || 0;
    const tcwmScore = calculateTCWMScore(item);
    return {
      name: item.Name,
      weight,
      tcwmScore,
      efficiency: weight / (tcwmScore || 1) // Avoid division by zero
    };
  });

  const worst = items.sort((a, b) => b.efficiency - a.efficiency)[0];
  return worst ? {
    name: worst.name,
    score: worst.efficiency.toFixed(2),
    weight: worst.weight.toFixed(1),
    tcwm: worst.tcwmScore.toFixed(1)
  } : null;
});

const avgTCWMScore = computed(() => {
  const scores = gearItems.value.map(item => calculateTCWMScore(item))
  return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
})

const typeDistribution = computed(() => {
  return gearItems.value.reduce((acc, item) => {
    if (item.Type) {
      acc[item.Type] = (acc[item.Type] || 0) + 1
    }
    return acc
  }, {})
})

const avgItemsPerContainer = computed(() => {
  if (!totalItems.value || !containerCount.value) return 0
  return Math.round(totalItems.value / containerCount.value)
})

const densestContainer = computed(() => {
  if (!groupedGear.value?.size) return { name: '-', count: 0 }
  const entries = Array.from(groupedGear.value.entries())
  const sorted = entries.sort((a, b) => b[1].length - a[1].length)
  if (!sorted.length) return { name: '-', count: 0 }
  const [container, items] = sorted[0]
  return {
    name: container,
    count: items.length
  }
})

const heaviestContainer = computed(() => {
  if (!groupedGear.value?.size) return { name: '-', weight: '0.0' }
  const entries = Array.from(groupedGear.value.entries())
  const sorted = entries.sort((a, b) => calculateTotalWeight(b[1]) - calculateTotalWeight(a[1]))
  if (!sorted.length) return { name: '-', weight: '0.0' }
  const [container, items] = sorted[0]
  return {
    name: container,
    weight: calculateTotalWeight(items)
  }
})

// Add this new computed property for TCWM distribution
const tcwmDistribution = computed(() => {
  // Create a 48-bin distribution (0-47.5)
  const bins = Array(48).fill(0)

  gearItems.value.forEach(item => {
    const score = calculateTCWMScore(item)
    const bin = Math.floor(score)
    if (bin >= 0 && bin < 48) bins[bin]++
  })

  return bins
})

// Get container weights from the actual data
const primaryContainers = computed(() => {
  if (!groupedGear.value) return []

  return Array.from(groupedGear.value)
    .filter(([name]) => PRIMARY_CONTAINERS.includes(name))
    .map(([name, items]) => ({
      name,
      weight: Number(calculateTotalWeight(items))
    }))
})

// Update the kit weight lookups
function getKitWeight(kitName) {
  const kit = gearItems.value?.find(item => {
    switch (kitName.toLowerCase()) {
      case 'sleep system':
        return item.Name === 'Black 20L Big River Dry Bag' && item['Loaded Weight ()']
      case 'electronics':
        return item.Name === 'Electronics Zipper Dry Bag' && item['Base Weight ()']
      case 'art supplies':
        return item.Name === 'Art Tools Dry Bag' && item['Base Weight ()']
      default:
        return false
    }
  })

  if (kitName.toLowerCase() === 'sleep system') {
    return Number(kit?.['Loaded Weight ()']) || 0
  }
  return Number(kit?.['Base Weight ()']) || 0
}

const sleepSystemWeight = computed(() => getKitWeight('sleep system'))
const electronicsWeight = computed(() => getKitWeight('electronics'))
const artSuppliesWeight = computed(() => getKitWeight('art supplies'))

const totalContainerWeight = computed(() => {
  return primaryContainers.value.reduce((sum, c) => sum + c.weight, 0)
})

const avgScores = computed(() => {
  if (!gearItems.value?.length) return { T: 0, C: 0, W: 0, M: 0 }

  const scores = {
    T: d3.mean(gearItems.value, d => Number(d['Time Criticality (T)']) || 0),
    C: d3.mean(gearItems.value, d => Number(d['Consequence Severity (C)']) || 0),
    W: d3.mean(gearItems.value, d => Number(d['Weight/Space Penalty (W)']) || 0),
    M: d3.mean(gearItems.value, d => Number(d['Multi-Use Factor (M)']) || 0)
  }

  // Ensure all values are numbers
  Object.keys(scores).forEach(key => {
    scores[key] = Number(scores[key]) || 0
  })

  return scores
})

const scoreLabels = {
  T: 'Time Criticality',
  C: 'Consequence Severity',
  W: 'Weight/Space Penalty',
  M: 'Multi-Use Factor'
}

const scoreColors = {
  T: 'text-blue-600 dark:text-blue-400',
  C: 'text-purple-600 dark:text-purple-400',
  W: 'text-green-600 dark:text-green-400',
  M: 'text-amber-600 dark:text-amber-400'
}

const scoreBgColors = {
  T: 'bg-blue-500/50',
  C: 'bg-purple-500/50',
  W: 'bg-green-500/50',
  M: 'bg-amber-500/50'
}

// Move these to a separate config file later if needed
const PRIORITY_CONTAINERS = [
  'Body',
  'Motorcycle',
  'WLF Enduro Backpack',
  '5.11 Rush 24 Backpack'
]

const PRIMARY_CONTAINERS = [
  '5.11 Rush 24',
  'WLF Enduro Pack',
  'Timbuk2 Waist Pack'
]

// Get current date for last updated
const currentDate = new Date().toISOString().split('T')[0]

// Add these helper functions
const getSleepSystem = () => {
  return gearItems.value?.filter(item =>
    item['Parent Container'] === 'Black 20L Big River Dry Bag'
  ) || []
}

const getElectronicsKit = () => {
  return gearItems.value?.filter(item =>
    item['Parent Container'] === 'Electronics Zipper Dry Bag'
  ) || []
}

const getArtSupplies = () => {
  return gearItems.value?.filter(item =>
    item['Parent Container'] === 'Art Tools Dry Bag'
  ) || []
}

// Add container locations
const containerLocations = {
  'Body': 'on my person',
  'Motorcycle': '',
  'WLF Enduro Backpack': 'worn',
  '5.11 Rush 24 Backpack': 'on motorcycle'
}

// Add this computed property
const highestMultiUse = computed(() => {
  if (!gearItems.value?.length) return null
  const item = [...gearItems.value].sort((a, b) =>
    (Number(b['Multi-Use Factor (M)']) || 0) - (Number(a['Multi-Use Factor (M)']) || 0)
  )[0]
  return item ? {
    name: item.Name,
    score: Number(item['Multi-Use Factor (M)']).toFixed(1)
  } : null
})

// Add these computed properties for weight conversions
const ouncesToPounds = computed(() => {
  const pounds = Number(totalWeight.value) / 16
  return pounds.toFixed(1)
})

const ouncesToKilos = computed(() => {
  const kilos = Number(totalWeight.value) * 0.0283495
  return kilos.toFixed(1)
})

// Add sorting helper function
const sortItemsByScore = (items) => {
  return [...items].sort((a, b) => calculateTCWMScore(b) - calculateTCWMScore(a))
}
</script>

<style>
/* Optional: Add smooth transition for line-clamp hover */
.line-clamp-2 {
  transition: all 0.2s ease-in-out;
}

/* Custom scrollbar styling */
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.thin-scrollbar::-webkit-scrollbar {
  height: 6px;
}

.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dark .thin-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.2);
}

/* Add some custom styling for ruby text */
ruby {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  vertical-align: middle;
  line-height: 1;
}

rt {
  transform: translateY(-0.5em);
  text-align: center;
  font-feature-settings: "tnum";
}
</style>