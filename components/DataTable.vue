<template>
  <div class="table-container">
    <!-- Data overlay -->
    <div v-if="showStats" class="mono-xs text-zinc-400 mb-2 tabular">
      <span>{{ rows.length }} ROWS</span>
      <span class="mx-2">·</span>
      <span>{{ columns.length }} COLS</span>
      <span v-if="sortColumn" class="mx-2">·</span>
      <span v-if="sortColumn">
        SORTED BY {{ columns[sortColumn]?.label || sortColumn }}
      </span>
    </div>

    <table class="data-table" :class="{ 'data-table-dense': dense }">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="[
              column.align === 'right' ? 'text-right' : 'text-left',
              column.sortable !== false
                ? 'cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300'
                : '',
            ]"
            @click="column.sortable !== false && sort(column.key)"
          >
            <span class="inline-flex items-center gap-1">
              {{ column.label }}
              <span
                v-if="column.sortable !== false"
                class="text-zinc-400"
                style="font-family: monospace"
              >
                {{
                  sortColumn === column.key
                    ? sortDirection === 'asc'
                      ? '↑'
                      : '↓'
                    : '↕'
                }}
              </span>
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, rowIndex) in sortedRows" :key="rowIndex">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="[
              column.type === 'numeric' || column.align === 'right'
                ? 'numeric'
                : '',
              column.type === 'category' ? 'category' : '',
              column.className || '',
            ]"
          >
            <!-- Custom slot for cell content -->
            <slot
              :name="`cell-${column.key}`"
              :value="row[column.key]"
              :row="row"
            >
              <!-- Date formatting -->
              <template v-if="column.type === 'date'">
                {{ formatDate(row[column.key]) }}
              </template>

              <!-- Number formatting -->
              <template v-else-if="column.type === 'numeric'">
                <span style="font-variant-numeric: tabular-nums">
                  {{ formatNumber(row[column.key], column.format) }}
                </span>
              </template>

              <!-- Link handling -->
              <template v-else-if="column.type === 'link'">
                <a
                  :href="row[column.key]"
                  target="_blank"
                  rel="noopener"
                  class="hover:underline"
                >
                  {{ column.linkText ? row[column.linkText] : row[column.key] }}
                </a>
              </template>

              <!-- Boolean -->
              <template v-else-if="column.type === 'boolean'">
                <span
                  v-if="row[column.key]"
                  class="text-green-600 dark:text-green-400"
                >
                  ✓
                </span>
                <span v-else class="text-zinc-300 dark:text-zinc-700">—</span>
              </template>

              <!-- Default text -->
              <template v-else>
                {{ row[column.key] || '—' }}
              </template>
            </slot>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Empty state -->
    <div v-if="!rows.length" class="py-8 text-center mono-xs text-zinc-400">
      NO_DATA
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    required: true,
    // Expected format:
    // [
    //   { key: 'name', label: 'Name', type: 'text', sortable: true },
    //   { key: 'count', label: 'Count', type: 'numeric', align: 'right' },
    //   { key: 'date', label: 'Date', type: 'date' },
    //   { key: 'url', label: 'Link', type: 'link', linkText: 'title' }
    // ]
  },
  rows: {
    type: Array,
    required: true,
  },
  dense: {
    type: Boolean,
    default: false,
  },
  showStats: {
    type: Boolean,
    default: true,
  },
  initialSort: {
    type: String,
    default: null,
  },
  initialSortDirection: {
    type: String,
    default: 'asc',
    validator: (value) => ['asc', 'desc'].includes(value),
  },
})

const sortColumn = ref(props.initialSort)
const sortDirection = ref(props.initialSortDirection)

const sort = (column) => {
  if (sortColumn.value === column) {
    // Toggle direction
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
}

const sortedRows = computed(() => {
  if (!sortColumn.value) return props.rows

  const column = props.columns.find((c) => c.key === sortColumn.value)
  if (!column) return props.rows

  return [...props.rows].sort((a, b) => {
    let aVal = a[sortColumn.value]
    let bVal = b[sortColumn.value]

    // Handle null/undefined
    if (aVal == null) return sortDirection.value === 'asc' ? 1 : -1
    if (bVal == null) return sortDirection.value === 'asc' ? -1 : 1

    // Type-specific sorting
    if (column.type === 'numeric') {
      aVal = Number.parseFloat(aVal) || 0
      bVal = Number.parseFloat(bVal) || 0
    } else if (column.type === 'date') {
      aVal = new Date(aVal).getTime()
      bVal = new Date(bVal).getTime()
    } else {
      // String comparison
      aVal = String(aVal).toLowerCase()
      bVal = String(bVal).toLowerCase()
    }

    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

// Formatting helpers
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toISOString().split('T')[0]
}

const formatNumber = (value, format) => {
  if (value == null) return '—'
  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) return value

  if (format === 'percentage') {
    return `${(num * 100).toFixed(1)}%`
  } else if (format === 'currency') {
    return `$${num.toFixed(2)}`
  } else if (format === 'compact') {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return num.toLocaleString()
}
</script>

<style scoped>
/* Additional component-specific styles if needed */
.table-container {
  @apply my-8;
}

/* Responsive handling */
@media (max-width: 640px) {
  .data-table {
    @apply text-xs;
  }

  .data-table th,
  .data-table td {
    @apply px-1;
  }
}
</style>
