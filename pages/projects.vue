<template>
  <main class="pt4">
    <table id="projects" class="w-100 collapse f3">
      <!-- projects have Client, Project Name, Role, Year, and URL-->
      <tr class="">
        <th class="bb bw1 b--gray dn dtc-ns"><span class="gray">Client</span></th>
        <th class="bb bw1 b--gray">
          <div class="w-100 tc">Project Name</div>
        </th>
        <th class="bb bw1 b--gray dn dtc-l gray">Role</th>
        <th class="bb bw1 b--gray dn dtc-ns gray">Year</th>
      </tr>
      <tr v-for="project in data.body" :key="project.name" class="stripe-dark">
        <!-- <td class="dn dtc-ns f5 v-top w-10 gray">
          <div class="flex items-center">
          {{ project.Client }}
        </td>
        <td class="dtc measure-narrow center">
          <a :href="project.URL" class="link b near-black dim db pv5 f1 f-subheadline-l lh-solid headline-sans-serif ttu tc tracked-tight">{{ project['Project Name'] }}</a>
          </td>
        <td class="f5 v-top w-10 gray">{{ project.Role }}</td>
        <td class="dn dtc-ns f5 v-top w-10 gray">{{ project.Year }}</td> -->

        <!-- vertically align everything in the row -->
        <td class="dn dtc-ns v-mid w-10 gray">
          <div class="flex ph2 items-center">
            {{ project.Client }}
          </div>
        </td>

        <td class="dtc-ns v-mid">
          <a :href="project.URL" class="link b near-black dim db pv5 f1 f-subheadline-l lh-solid headline-sans-serif ttu tc">{{ project['Project Name'] }}</a>
        </td>

        <td class="dn dtc-l v-mid w-10 gray">
          <div class="flex ph2 f5 items-center">
            {{ project.Role }}
          </div>
        </td>

        <td class="dtc-ns v-mid w-10 gray">
          <div class="flex ph2 f5 items-center">
            {{ project.Year }}
          </div>
        </td>



      </tr>
    </table>
  </main>
</template>
<script setup>
import anime from 'animejs/lib/anime.es.js'

const { data } = await useAsyncData('projects', () => queryContent('/projects').findOne())

const animationDuration = 220

function animateProjects() {
  anime({
    targets: '#projects tr',
    opacity: [0, 1],
    translateY: [10, 0],
    easing: 'easeInOutQuad',
    duration: animationDuration,
    delay: anime.stagger(animationDuration),
  })
}

onMounted(() => {
  animateProjects()
})

// also animate the projects when the route changes
// this is a hacky way to do it, but it works
const router = useRoute()
watch(router, (oldVal, newVal) => {
  if (oldVal.path !== newVal.path) {
    animateProjects()
  }
})
</script>
<style scoped>
/* table {
  border-collapse: collapse;
} */
tr {
  border-bottom: 1px solid rgba(0,0,0,.15);
}
th, td {
  text-align: left;
  padding: 4px;
}
.stripe-dark:nth-child(odd) {
    background-color: rgba(0,0,0,.1);
}

.headline-sans-serif {
  font-family: 'Fjalla One', sans-serif;
}
</style>