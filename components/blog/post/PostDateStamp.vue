<!--
  @file PostDateStamp.vue
  @description Prominent publication/project date shown directly beneath an
    article title. A later frontmatter modified date appears as a second cell.
    This intentionally duplicates the tiny chrome metadata: readers arriving
    on a deep link should not have to inspect site chrome to know its age.
-->
<script setup lang="ts">
type DateInput = string | Date | null | undefined

const props = withDefaults(
  defineProps<{
    date: DateInput
    modified?: DateInput
    label?: string
    /** Add IndieWeb's dt-published class when rendered inside an h-entry. */
    microformat?: boolean
  }>(),
  {
    modified: null,
    label: 'Published',
    microformat: false,
  }
)

const formattedDate = computed(() => formatDate(props.date, 'MMMM d, yyyy'))

function datetimeValue(value: DateInput): string | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value.toISOString()
  return value
}

function dayKey(value: DateInput): string | null {
  if (!value) return null
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

const formattedModified = computed(() => {
  const publishedDay = dayKey(props.date)
  const modifiedDay = dayKey(props.modified)
  if (!publishedDay || !modifiedDay || modifiedDay <= publishedDay) return ''
  return formatDate(props.modified, 'MMMM d, yyyy')
})
</script>

<template>
  <div
    v-if="formattedDate"
    class="post-date-stamp inline-flex w-full flex-wrap items-stretch overflow-hidden rounded-md border border-zinc-300 bg-zinc-50 font-mono sm:w-auto dark:border-zinc-700 dark:bg-zinc-900/60"
    aria-label="Article dates"
  >
    <div class="grid w-full gap-0.5 px-3 py-2.5 sm:w-auto sm:px-4">
      <span
        class="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
      >
        {{ label }}
      </span>
      <time
        :datetime="datetimeValue(date)"
        :class="[
          'text-sm font-bold tabular-nums text-zinc-950 sm:text-base dark:text-zinc-50',
          { 'dt-published': microformat },
        ]"
      >
        {{ formattedDate }}
      </time>
    </div>

    <div
      v-if="formattedModified"
      class="grid w-full gap-0.5 border-t border-zinc-300 px-3 py-2.5 sm:w-auto sm:border-l sm:border-t-0 sm:px-4 dark:border-zinc-700"
    >
      <span
        class="text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400"
      >
        Updated
      </span>
      <time
        :datetime="datetimeValue(modified)"
        class="text-sm font-bold tabular-nums text-zinc-950 sm:text-base dark:text-zinc-50"
      >
        {{ formattedModified }}
      </time>
    </div>
  </div>
</template>
