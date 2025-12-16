<!--
  @file KalshiPortfolioStats.vue
  @description Kalshi portfolio statistics showing open P&L, closed P&L, total P&L, and invested capital
  @props portfolioStats: Object - Portfolio statistics with totalUnrealizedPnL, totalRealizedPnL, totalInvested, closedPositions
-->
<template>
  <div v-if="portfolioStats" class="section-spacing-sm grid-2col-lg">
    <div>
      <div class="stat-label">Open P&L</div>
      <div
        v-if="portfolioStats.totalUnrealizedPnL >= 0"
        class="mono-2xl text-success"
      >
        +${{ portfolioStats.totalUnrealizedPnL.toFixed(2) }}
      </div>
      <div v-else class="mono-2xl text-error">
        ${{ portfolioStats.totalUnrealizedPnL.toFixed(2) }}
      </div>
      <div class="stat-details">
        {{
          (
            (portfolioStats.totalUnrealizedPnL / portfolioStats.totalInvested) *
            100
          ).toFixed(1)
        }}%
      </div>
    </div>

    <div>
      <div class="stat-label">Closed P&L</div>
      <div
        v-if="portfolioStats.totalRealizedPnL >= 0"
        class="mono-2xl text-success"
      >
        +${{ portfolioStats.totalRealizedPnL.toFixed(2) }}
      </div>
      <div v-else class="mono-2xl text-error">
        ${{ portfolioStats.totalRealizedPnL.toFixed(2) }}
      </div>
      <div class="stat-details">
        {{ portfolioStats.closedPositions.length }} positions
      </div>
    </div>

    <div>
      <div class="stat-label">Total P&L</div>
      <div
        v-if="
          portfolioStats.totalUnrealizedPnL + portfolioStats.totalRealizedPnL >=
          0
        "
        class="mono-2xl text-success"
      >
        +${{
          (
            portfolioStats.totalUnrealizedPnL + portfolioStats.totalRealizedPnL
          ).toFixed(2)
        }}
      </div>
      <div v-else class="mono-2xl text-error">
        ${{
          (
            portfolioStats.totalUnrealizedPnL + portfolioStats.totalRealizedPnL
          ).toFixed(2)
        }}
      </div>
      <div class="stat-details">all time</div>
    </div>

    <div>
      <div class="stat-label">Portfolio Value</div>
      <div class="mono-2xl text-primary">
        ${{ portfolioStats.totalValue.toFixed(2) }}
      </div>
      <div class="stat-details">
        {{ portfolioStats.openPositions?.length || 0 }} open
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  portfolioStats: any
}

defineProps<Props>()
</script>
