<template>
  <div class="w-full h-full">
    <iframe src="https://cal.com/ejfox/30min?embed=true&layout=month_view&theme=dark" class="w-full h-[800px] border-0"
      frameborder="0" allowfullscreen></iframe>
  </div>
</template>

<script setup>
// Simple iframe approach - no CSP issues
useHead({
  meta: [
    {
      name: 'Content-Security-Policy',
      content: "frame-src 'self' https://cal.com;"
    }
  ]
})
</script>
