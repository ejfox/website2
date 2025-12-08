<template>
  <div v-if="fills && fills.length > 0" class="mt-8">
    <h3 class="heading-3 mb-4">Recent Fills</h3>
    <div class="overflow-x-auto -mx-4 px-4">
      <div class="min-w-[450px]">
        <table class="table-header">
          <thead>
            <tr>
              <th class="table-th">Time</th>
              <th class="table-th">Market</th>
              <th class="table-th-right">Side</th>
              <th class="table-th-right">Qty</th>
              <th class="table-th-right">Price</th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr v-for="fill in fills.slice(0, 10)" :key="fill.fill_id">
              <td class="table-cell tabular">
                {{ formatRelativeTime(fill.created_time) }}
              </td>
              <td class="table-cell">{{ fill.ticker }}</td>
              <td
                class="table-cell-value mono-lg"
                :class="fill.side === 'yes' ? 'text-success' : 'text-error'"
              >
                {{ fill.side.toUpperCase() }}
              </td>
              <td class="table-cell text-right tabular">
                {{ fill.count }}
              </td>
              <td class="table-cell text-right tabular">
                {{ (fill.price * 100).toFixed(0) }}¢
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  fills: any[]
}

defineProps<Props>()

const { formatRelativeTime } = useDateFormat()
</script>
