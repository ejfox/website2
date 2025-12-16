<!--
  @file KalshiPositionsList.vue
  @description List of all Kalshi market positions with portfolio stats header
  @props kalshiData: Object - Kalshi data with positions and portfolioStats
  @props parsedCommentaries: Record<string, string> - Parsed commentary content by ticker
-->
<template>
  <div>
    <h2 class="heading-3 mb-4">Market Positions</h2>

    <!-- Portfolio Performance Stats -->
    <KalshiPortfolioStats :portfolio-stats="kalshiData?.portfolioStats" />

    <!-- Positions Grid -->
    <div class="grid-predictions mt-8">
      <KalshiPositionCard
        v-for="position in kalshiData.positions"
        :key="position.ticker"
        :position="position"
        :kalshi-data="kalshiData"
        :parsed-commentaries="parsedCommentaries"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import KalshiPortfolioStats from './KalshiPortfolioStats.vue'
import KalshiPositionCard from './KalshiPositionCard.vue'

interface Props {
  kalshiData: any
  parsedCommentaries: Record<string, string>
}

defineProps<Props>()
</script>
