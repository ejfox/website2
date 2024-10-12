<template>
  <div id="app-container" class="sans-serif w-full">
    <NuxtLoadingIndicator />
    <section class="flex flex-col md:flex-row min-h-screen relative">



      <nav class="sticky w-52 h-auto max-h-screen top-0 left-0 z-50 p-2 md:p-4  monospace overflow-auto">
        <div
          class="container mx-auto md:py-1 md:flex md:flex-col items-start shadow-lg dark:shadow-none w-full md:shadow-none border-b border-zinc-300 dark:border-zinc-900 md:border-none rounded bg-zinc-50/50 dark:bg-zinc-900/30 md:dark:bg-transparent backdrop-blur-md px-2 max-h-screen">
          <div class="pt-3 pb-1 space-y-2">
            <!-- Updated class: items-start -->
            <NuxtLink class="text-zinc-800 dark:text-zinc-400 md:text-xl font-bold px-2 md:p-4 md:mb-2 block" to="/">EJ
              Fox
            </NuxtLink>
            <NuxtLink :class="linkClasses" to="/"> Home </NuxtLink>
            <NuxtLink :class="linkClasses" to="/projects"> Projects </NuxtLink>
            <NuxtLink :class="linkClasses" to="/blog/">Blog </NuxtLink>

            <NuxtLink :class="linkClasses" to="/scrapbook/">Scrapbook</NuxtLink>
            <NuxtLink :class="linkClasses" to="/pottery/">Pottery</NuxtLink>

            <NuxtLink :class="linkClasses" to="https://ejfox.photos">
              Photos
              <UIcon name="i-ei-external-link" class="w-3 md:w-4 h-3 md:h-4 inline-block" />
            </NuxtLink>

          </div>
        </div>

        <div id="toc-container"></div>

      </nav>


      <article class="w-full md:w-5/6">
        <NuxtPage />
      </article>
    </section>
  </div>

</template>
<script setup>
const linkClasses =
  "inline-block md:block md:w-full px-2 md:px-4 text-sm md:text-xl hover:bg-zinc-200/30 dark:hover:bg-zinc-700/30 active:bg-zinc-200/80 active:backdrop-blur active:text-black rounded active:shadow-lg font-light tracking-wide mr-2 md:mr-0"

</script>

<style>
.sans-serif {
  font-family: 'Signika Negative', sans-serif !important;
  /* font-family: 'Raleway', Helvetica, Arial, sans-serif !important; */
  font-weight: 300;
}


.monospace {
  font-family: 'Red Hat Mono', monospace !important;
}

h1,
h2,
h3,
.font-fjalla {
  font-family: 'Fjalla One', sans-serif !important;
}

.sticky {
  position: sticky !important;
  top: 0;
  z-index: 10;
}
</style>
