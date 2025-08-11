<template>
  <div class="rounded-lg">
    <div v-if="product?.images" class="relative shadow-lg overflow-hidden rounded-lg">
      <!-- Price SVG overlay -->
      <img
        v-if="!productSold" 
        :src="priceSvgPath"
        alt="Price" 
        class="w-16 md:w-24 xl:w-30 h-auto absolute top-4 right-4 md:right-8 z-20 invert"
      />
      <img
        v-else 
        src="/images/handdrawn_ceramics_text/handdrawn_ceramics_text-14.svg"
        class="w-1/3 h-auto absolute top-4 right-4 md:right-8 z-20 invert" 
        alt="Sold Out"
      />

      <!-- Product image -->
      <img
        :src="product?.images[0]" 
        alt="product image"
        class="z-10 transition-all duration-300"
        :class="productSold ? 'grayscale hover:grayscale-0' : ''"
      />
    </div>
    
    <!-- Actions and price -->
    <div class="py-4 flex flex-row justify-between items-center">
      <div v-if="!productSold">
        <UButton color="green" @click="buyProduct(product.id)">
          <img
            src="/images/handdrawn_ceramics_text/handdrawn_ceramics_text-11.svg" 
            alt="Buy"
            class="mx-4 my-1 w-16 h-auto"
          />
        </UButton>
      </div>
      <div v-else>
        <UButton color="gray" disabled>
          <img
            src="/images/handdrawn_ceramics_text/handdrawn_ceramics_text-14.svg" 
            alt="Sold Out"
            class="w-16 h-auto dark:invert"
          />
        </UButton>
      </div>

      <div v-show="!productSold" class="text-lg py-2 hidden xl:block">
        {{ unitAmountToUSD(product.price.unit_amount) }} + shipping
      </div>
    </div>
    
    <!-- Product info -->
    <div class="py-2">
      <div class="flex flex-wrap justify-between items-center gap-4">
        <div class="prose dark:prose-invert my-1 lg:my-2 flex-1">
          {{ product.description }}
        </div>

        <img
          src="/images/handdrawn_ceramics_text/handdrawn_ceramics_text-13.svg" 
          alt="USA Shipping Only"
          class="h-10 xl:h-12 w-auto my-2 dark:invert"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  product: {
    id: string
    name: string
    price: {
      unit_amount: number
    }
    images?: string[]
    description?: string
    active?: boolean
    [key: string]: any
  }
}

const { product } = defineProps<Props>()

const buyProduct = async (productId: string) => {
  const { data } = await useFetch('/api/checkout-session', {
    method: 'POST',
    body: JSON.stringify({
      productId,
      success_url: `https://ejfox.com/pottery/success?productId=${productId}`,
      cancel_url: 'https://ejfox.com/pottery',
    }),
  })

  const { url } = data.value?.body || {}
  if (url) window.location.href = url
}

const productSold = computed(() => !product?.active)

// Map price amounts to specific hand-drawn SVGs
const priceAmountToSvg = (priceAmount: number): string => {
  const priceMap: Record<number, string> = {
    8000: '/images/handdrawn_ceramics_text/handdrawn_ceramics_text-18.svg', // $80
    4000: '/images/handdrawn_ceramics_text/handdrawn_ceramics_text-25.svg', // $40
    3000: '/images/handdrawn_ceramics_text/handdrawn_ceramics_text-22.svg', // $30
    1500: '/images/handdrawn_ceramics_text/handdrawn_ceramics_text-19.svg', // $15
  }
  
  return priceMap[priceAmount] || '/images/handdrawn_ceramics_text-10.svg'
}

const priceSvgPath = computed(() => {
  return priceAmountToSvg(product.price.unit_amount)
})

const unitAmountToUSD = (unitAmount: number): string => {
  return (unitAmount / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  })
}
</script>