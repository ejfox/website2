<template>
  <div class="metadata-visuals">
    <!-- Compact view: all sparklines in a row -->
    <div v-if="variant === 'compact'" class="sparkline-row">
      <BlogSparkline :value="wordCount" metric="words" :show-label="false" />
      <BlogSparkline
        v-if="imageCount > 0"
        :value="imageCount"
        metric="images"
        :show-label="false"
      />
      <BlogSparkline
        v-if="fileSize"
        :value="fileSize"
        metric="size"
        type="bar"
        :show-label="false"
      />
    </div>

    <!-- Detailed view: labeled sparklines -->
    <div v-else-if="variant === 'detailed'" class="sparkline-stack">
      <div class="sparkline-item">
        <span class="sparkline-metric-label">WORDS</span>
        <BlogSparkline
          :value="wordCount"
          metric="words"
          :columns="20"
          :square-size="3"
          :gap="1"
        />
        <span class="sparkline-value">{{ wordCount.toLocaleString() }}</span>
      </div>

      <div v-if="imageCount > 0" class="sparkline-item">
        <span class="sparkline-metric-label">IMAGES</span>
        <BlogSparkline :value="imageCount" metric="images" type="dots" />
        <span class="sparkline-value">{{ imageCount }}</span>
      </div>

      <div v-if="fileSize" class="sparkline-item">
        <span class="sparkline-metric-label">SIZE</span>
        <BlogSparkline
          :value="fileSize"
          metric="size"
          type="bar"
          :max="maxFileSize"
        />
        <span class="sparkline-value"
          >{{ (fileSize / 1024).toFixed(1) }}KB</span
        >
      </div>

      <div v-if="readingTime" class="sparkline-item">
        <span class="sparkline-metric-label">TIME</span>
        <BlogSparkline
          :value="readingTime"
          metric="time"
          :columns="readingTime"
          :square-size="4"
          :gap="1"
        />
        <span class="sparkline-value">{{ readingTime }}min</span>
      </div>
    </div>

    <!-- Inline variant for use within text -->
    <span v-else-if="variant === 'inline'" class="sparkline-inline">
      <BlogSparkline
        :value="wordCount"
        metric="words"
        :columns="Math.min(wordCount / 100, 10)"
        :square-size="1.5"
        :gap="0.3"
      />
    </span>
  </div>
</template>

<script setup>
defineProps({
  wordCount: {
    type: Number,
    required: true
  },
  imageCount: {
    type: Number,
    default: 0
  },
  fileSize: {
    type: Number, // in bytes
    default: null
  },
  readingTime: {
    type: Number, // in minutes
    default: null
  },
  maxFileSize: {
    type: Number,
    default: 100000 // 100KB default max for scaling
  },
  variant: {
    type: String,
    default: 'compact', // compact | detailed | inline
    validator: (value) => ['compact', 'detailed', 'inline'].includes(value)
  }
})
</script>

<style scoped>
.metadata-visuals {
  @apply font-mono text-xs;
}

.sparkline-row {
  @apply flex items-center gap-3;
}

.sparkline-stack {
  @apply space-y-2;
}

.sparkline-item {
  @apply flex items-center gap-2;
}

.sparkline-metric-label {
  @apply text-zinc-400 dark:text-zinc-500 tracking-wider uppercase;
  font-size: 9px;
  min-width: 3rem;
}

.sparkline-value {
  @apply text-zinc-600 dark:text-zinc-400 ml-auto tabular-nums;
  font-size: 10px;
}

.sparkline-inline {
  @apply inline-flex items-center gap-1;
}
</style>
