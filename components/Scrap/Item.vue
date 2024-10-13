<template>
  <div class="max-w-screen-md rounded my-1 break-words">



    <ScrapPinboard v-if="scrap.source === 'pinboard'" :scrap="scrap" />
    <ScrapArena v-if="scrap.source === 'arena'" :scrap="scrap" />


    <!-- Rendered Markdown Content -->
    <!-- <div v-if="scrap.content" class="p-4" v-html="renderedContent"></div> -->

    <!-- Relationships -->
    <div v-show="hasRelationships && showRelationships" class="mt-4 text-xs">
      <ClientOnly>
        <svg ref="relationshipGraph" class="w-full h-96">
          <g v-for="edge in edges" :key="`${edge.source}-${edge.target}`" class="group">
            <line :x1="edge.source.x" :y1="edge.source.y" :x2="edge.target.x" :y2="edge.target.y"
              :stroke="isDark ? '#999' : '#ccc'" />
            <text :transform="calcLineLabelTransform(edge)" fill="red" font-size="8" text-anchor="middle">{{ edge.type
              }}</text>
          </g>
          <g v-for="node in nodes" :key="node.name">
            <foreignObject :x="node.x" :y="node.y - 16" width="128" height="64">
              <div class="text-xs p-1 leading-none rounded w-full break-words text-balance">
                <p class="text-black dark:text-white">{{ node.name }}</p>
              </div>
            </foreignObject>
          </g>
        </svg>
      </ClientOnly>
    </div>

    <div v-if="scrap.source === 'arena'">
      <!-- <pre>
      {{ scrap }}      
    </pre> -->
      <span v-if="scrap.metadata?.image">
        <img :src="scrap.metadata?.image?.thumb?.url" class="max-h-16 inline-block" />
      </span>
    </div>

    <div v-if="scrap.source === 'mastodon'">

      <span class="font-serif" v-html="scrap.content" />
      <div v-if="scrap?.metadata?.images">
        <img v-for="image in scrap?.metadata?.images" :src="image.url" class="max-h-16 inline-block" />
      </div>

    </div>



    <ScrapMetadata v-if="scrap.source === 'pinboard'" :scrap="scrap" :has-relationships="hasRelationships" />


  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

import * as d3 from 'd3'
import { renderMarkdown } from '~/utils/markdownRenderer'

const props = defineProps({
  scrap: {
    type: Object,
    required: true,
  },
})

const showRaw = ref(false)
const showRelationships = ref(false)
const renderedContent = ref('')

const isDark = useDark()

const hasLocation = computed(() => props.scrap.metadata?.latitude && props.scrap.metadata?.longitude)
const hasRelationships = computed(() => props.scrap.relationships?.length > 0)

function calcLineLabelTransform(edge) {
  const dx = edge.target.x - edge.source.x
  const dy = edge.target.y - edge.source.y
  let angle = Math.atan2(dy, dx) * 180 / Math.PI
  if (angle > 90) angle -= 180
  if (angle < -90) angle += 180
  const x = (edge.source.x + edge.target.x) / 2
  const y = (edge.source.y + edge.target.y) / 2 - 5
  return `translate(${x}, ${y}) rotate(${angle})`
}



const relationshipEdges = computed(() => {
  if (!hasRelationships.value) return []
  return props.scrap.relationships.map(rel => ({
    source: rel.source.name,
    target: rel.target.name,
    type: rel.type,
  }))
})

const relationshipNodes = computed(() => {
  if (!hasRelationships.value) return []
  const nodes = new Set()
  props.scrap.relationships.forEach(rel => {
    nodes.add(rel.source.name)
    nodes.add(rel.target.name)
  })
  return Array.from(nodes).map(name => ({ id: name }))
})

const relationshipGraph = ref(null)

const { width: graphWidth, height: graphHeight } = useElementSize(relationshipGraph)

const simulation = ref(null)
const nodes = ref([])
const edges = ref([])

onMounted(async () => {
  if (props.scrap.content) {
    renderedContent.value = renderMarkdown(props.scrap.content)
  }

  await nextTick()

  const width = Math.max(graphWidth.value, 700)
  const height = Math.max(graphHeight.value, 320)

  nodes.value = unref(relationshipNodes).map(d => ({
    name: d.id,
    x: Math.random() * width,
    y: Math.random() * height
  })).filter(d => relationshipEdges.value.some(e => e.source === d.name || e.target === d.name))

  edges.value = relationshipEdges.value.map(d => ({
    source: nodes.value.find(n => n.name === d.source),
    target: nodes.value.find(n => n.name === d.target),
    type: d.type
  }))

  simulation.value = d3.forceSimulation(nodes.value)
    .force('center', d3.forceCenter(width / 2, height / 2).strength(2))
    .force('link', d3.forceLink(edges.value).id(d => d.name).distance(92).strength(0.35))
    .force('charge', d3.forceManyBody().strength(-1000).distanceMax(200))
    .force('collide', d3.forceCollide().radius(132).strength(0.52))
    .force('box', () => {
      for (const node of nodes.value) {
        node.x = Math.max(node.x, 92)
        node.x = Math.min(node.x, width - 320)
        node.y = Math.max(node.y, 124)
        node.y = Math.min(node.y, height - 92)
      }
    })
})
</script>

<style scoped>
svg .group text {
  opacity: 0;
}

svg .group:hover text {
  opacity: 1;
}
</style>