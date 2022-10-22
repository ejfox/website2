<template>
  <main class="pt4">
    <ContentList path="/blog" v-slot="{ list }" :query="query">
      <div v-for="article in list" :key="article._path" class="article bg-white w-50-ns dib v-top mb4 mb6-l pv2 pv0-l bn-l pr2 pr6-l overflow-hidden measure-wide">
        <div class="">
          <!-- <pre class="h5 w-100 ba overflow-y-auto f7">{{JSON.stringify(article, 0, 2)}}
        </pre> -->

          <small class="mv0 pv0 gray fw7 tracked">{{formatDate(new Date(article.date))}}</small>
          <NuxtLink :to="article._path" class="link b near-black dim db pv2 pr2 f2 f1-l lh-solid ttu word-wrap pr headline-sans-serif">{{ article.title
          }}</NuxtLink>

          <!-- word count -->
          <!-- <small v-if="countWords(article) > 10" class="mv0 pa0 gray">
            {{countWords(article)}} words
          </small>

          <div class="mv2 tr overflow-hidden">
            <span v-for="char in article.excerpt.children" :key="char" class="bg-light-gray fl" :style="{
              height: '2px',
              width: char.children?.length  * 5 + 'px',
            }">
            </span>
          </div> -->

          <div class="gray f6 mr3">
            <div class="fw2">
              <div v-if="article.dek" class="dek">{{ article.dek }}</div>
              <div v-else="article.description" class="dek">{{ article.description }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </ContentList>
  </main>
</template>
<script setup lang="ts">
import anime from 'animejs/lib/anime.es.js'
import { timeFormat } from 'd3-time-format'
import type { QueryBuilderParams } from '@nuxt/content/dist/runtime/types'
import { countWords } from '~~/helpers'

const formatDate = timeFormat('%B %d, %Y')
const query: QueryBuilderParams = { path: '/blog', sort: { date: -1 } }

onMounted(() => {
  // use anime to animate the intro text
  anime({
    targets: '.article',
    opacity: [0, 1],
    translateX: ['-22vw', 0],
    easing: 'easeOutQuad',
    duration: 720,
    delay: anime.stagger(250),
  })
})

// const query: QueryBuilderParams = { path: '/blog', limit: 5, sort: { date: -1 } }

// blog posts look like this 
// {
//   "_path": "/blog/nypd-ccrb-complaint-clusters",
//   "_draft": false,
//   "_partial": false,
//   "_locale": "en",
//   "_empty": false,
//   "title": "Finding Clusters of NYPD Officers In CCRB Complaint Data",
//   "description": "",
//   "excerpt": {
//     "type": "root",
//     "children": [
//       {
//         "type": "element",
//         "tag": "h1",
//         "props": {
//           "id": "finding-clusters-of-nypd-officers-in-ccrb-complaint-data"
//         },
//         "children": [
//           {
//             "type": "text",
//             "value": "Finding Clusters of NYPD Officers In CCRB Complaint Data"
//           }
//         ]
//       },
//       {
//         "type": "element",
//         "tag": "img",
//         "props": {
//           "src": "https://res.cloudinary.com/ejf/image/upload/v1624505769/Screen_Shot_2021-06-21_at_8.58.50_PM.jpg"
//         },
//         "children": []
//       },
//       {
//         "type": "element",
//         "tag": "h2",
//         "props": {
//           "id": "why"
//         },
//         "children": [
//           {
//             "type": "text",
//             "value": "Why?"
//           }
//         ]
//       },
//       {
//         "type": "element",
//         "tag": "p",
//         "props": {},
//         "children": [
//           {
//             "type": "text",
//             "value": "Complaints filed against police officers by the public are often the first and only warning sign that a cop might be on a course of escalating violence."
//           }
//         ]
//       },
//     ...... etc

// count words for every article


</script>
<style>
.headline-sans-serif {
  font-family: 'Fjalla One', sans-serif;
}

.footnotes ul,
.footnotes ol {
  padding: 0;
  margin: 0;
  margin-left: 1rem;
  margin-right: 1rem;
}

@media screen and (min-width: 60em) {
  .footnotes ul,
  .footnotes ol {
    margin-left: 8rem;
  }
}

.footnotes li {
  list-style: none;
  margin-bottom: 1rem;
  margin-top: 1rem;
}
</style>
