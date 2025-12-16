<!--
  @file KalshiPositionCard.vue
  @description Individual Kalshi market position card with position details, P&L, and commentary
  @props position: Object - Position with ticker, position, market_exposure_dollars, fees_paid_dollars, realized_pnl_dollars
  @props kalshiData: Object - Full Kalshi data including markets and events
  @props parsedCommentaries: Record<string, string> - Parsed commentary content by ticker
-->
<template>
  <article :id="`kalshi-${position.ticker}`" class="card-padding">
    <!-- Title + Side -->
    <div class="mb-2">
      <div class="flex-gap-3">
        <span
          :class="position.position > 0 ? 'badge-side-yes' : 'badge-side-no'"
        >
          {{ position.position > 0 ? 'YES' : 'NO' }}
        </span>
        <div class="text-body-lg text-balance">
          {{ getMarketTitle(position.ticker) }}
        </div>
      </div>
    </div>

    <!-- Dense data table -->
    <table class="table-dense mb-2">
      <tbody>
        <tr>
          <td class="py-0.5">Position</td>
          <td class="table-cell-value">
            {{
              Math.abs(position.position) > 0
                ? `${Math.abs(position.position)} × $${(
                    position.market_exposure_dollars /
                    Math.abs(position.position)
                  ).toFixed(2)}`
                : `${Math.abs(position.position)} (closed)`
            }}
          </td>
        </tr>
        <tr>
          <td class="py-0.5">Exposure</td>
          <td class="table-cell-primary">
            ${{ Number(position.market_exposure_dollars).toFixed(2) }}
          </td>
        </tr>
        <tr v-if="Number(position.fees_paid_dollars) > 0">
          <td class="py-0.5">Fees</td>
          <td class="text-right tabular">
            -${{ Number(position.fees_paid_dollars).toFixed(2) }}
          </td>
        </tr>
        <tr v-if="Number(position.realized_pnl_dollars) !== 0">
          <td class="py-0.5">Realized P&L</td>
          <td
            class="table-cell-value"
            :class="
              Number(position.realized_pnl_dollars) >= 0
                ? 'text-success'
                : 'text-error'
            "
          >
            {{ Number(position.realized_pnl_dollars) >= 0 ? '+' : '' }}${{
              Number(position.realized_pnl_dollars).toFixed(2)
            }}
          </td>
        </tr>
        <tr>
          <td class="py-0.5">Total Traded</td>
          <td class="text-right tabular">
            ${{ Number(position.total_traded_dollars).toFixed(2) }}
          </td>
        </tr>
        <tr v-if="getCommentary(position.ticker)?.tags?.length">
          <td class="py-0.5">Tags</td>
          <td class="text-right">
            <span
              v-for="tag in getCommentary(position.ticker)?.tags"
              :key="tag"
              class="mr-1"
            >
              #{{ tag }}
            </span>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Commentary -->
    <div
      v-if="parsedCommentaries[position.ticker]"
      class="text-sm text-muted leading-relaxed prose prose-sm prose-zinc dark:prose-invert max-w-none"
      v-html="parsedCommentaries[position.ticker]"
    />
  </article>
</template>

<script setup lang="ts">
interface Props {
  position: any
  kalshiData: any
  parsedCommentaries: Record<string, string>
}

const props = defineProps<Props>()

const getMarketTitle = (ticker: string) => {
  // Try commentary title first
  if (props.kalshiData?.commentaries?.[ticker]?.marketTitle) {
    return props.kalshiData.commentaries[ticker].marketTitle
  }

  // Try API market details
  if (props.kalshiData?.marketDetails?.[ticker]?.title) {
    return props.kalshiData.marketDetails[ticker].title
  }

  // Fall back to ticker
  return ticker
}

const getCommentary = (ticker: string) => {
  return props.kalshiData?.commentaries?.[ticker]
}
</script>
