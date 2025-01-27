<template>
  <div v-if="amazonUrl" class="flex items-center gap-2">
    <!-- Product Image from Cloudinary -->
    <div class="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-800/50">
      <img v-if="productImageUrl" :src="productImageUrl" :alt="productName" class="w-full h-full object-cover"
        loading="lazy" />
    </div>

    <!-- Buy Button -->
    <a :href="affiliateUrl" target="_blank" rel="nofollow noopener" class="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-medium rounded-full 
             bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100
             dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 dark:hover:bg-amber-500/20
             transition-colors shrink-0" :title="`Buy ${productName} on Amazon`">
      <UIcon name="i-heroicons-shopping-cart" class="w-3 h-3" />
      <span>Buy yourself</span>
    </a>
  </div>
</template>

<script setup>
const props = defineProps({
  amazonUrl: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  }
})

// Extract ASIN from Amazon URL
const asin = computed(() => {
  const match = props.amazonUrl.match(/\/([A-Z0-9]{10})(?:[/?]|$)/)
  return match?.[1]
})

// Construct Cloudinary URL for the product image
const productImageUrl = computed(() => {
  if (!asin.value) return null
  const amazonImageUrl = `https://m.media-amazon.com/images/I/${asin.value}._AC_SL200_.jpg`
  return `https://res.cloudinary.com/ejf/image/fetch/f_auto,q_auto,w_200/${encodeURIComponent(amazonImageUrl)}`
})

// Add affiliate ID to URL
const affiliateUrl = computed(() => {
  if (!props.amazonUrl) return '#'
  const url = new URL(props.amazonUrl)
  url.searchParams.set('tag', 'ejfox0c-20')
  return url.toString()
})
</script>