<template>
  <main>
    <div class="f4 pt2">
      <!-- <ContentDoc /> -->
      <ContentDoc v-slot="{ doc, toc }">
        <ContentRenderer :value="doc" />
      </ContentDoc>
    </div>

    <div class="cf pv5">
      <NuxtLink v-if="prev" :to="prev._path" class="pr2 w-40 w-20-ns link gray db absolute left-2 lh-title">
        <span class="dib">&#8592;</span>
        {{ prev.title }}
        <div class="moon-gray f6 fw1">
          {{formatDate(new Date(prev.date))}}
        </div>
        <p class="moon-gray fw1 f6 mv0">{{ countWords(prev) }} words</p>
      </NuxtLink>

      <NuxtLink v-if="next" :to="next._path" class="pl2 w-40 w-20-ns link gray db absolute right-2 lh-title tr">
        {{ next.title }}
        <span class="dib">&#8594;</span>
        <div class="moon-gray f6 fw1 tr">
          {{formatDate(new Date(next.date))}}
        </div>
        <p class="moon-gray fw1 f6 mv0 tr">{{ countWords(next) }} words</p>
      </NuxtLink>
    </div>
  </main>
</template>
<script setup>
import { timeFormat } from 'd3-time-format'
import { countWords } from '~~/helpers'

// TODO: Fix this so it only pulls out things from the current category
// ie if slug[0] is 'blog' then only pull out blog posts

// get slug from the route
const { params } = useRoute()

const { prev, next, toc } = useContent()
const formatDate = timeFormat('%B %Y')

</script>