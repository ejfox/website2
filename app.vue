<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup>
// Inline critical CSS (dark mode handling moved to plugins/dark-mode.client.js)
useHead({
  style: [
    {
      innerHTML: `
        *{margin:0;padding:0;box-sizing:border-box}
        body{
          font-family:Georgia,serif;line-height:1.6;
          color:#18181b;background:#fff
        }
        @media(prefers-color-scheme:dark){
          body{color:#fafafa;background:#18181b}
        }
        main{padding:1rem;max-width:48rem;margin:0 auto}
        @media(min-width:768px){main{padding:2rem}}
        h1{font-size:2rem;font-weight:700;margin-bottom:1rem}
        p{margin:1rem 0}
        a{color:inherit;text-decoration:underline}
        #app{min-height:100vh}
      `,
      tagPosition: 'head'
    }
  ]
})
</script>
