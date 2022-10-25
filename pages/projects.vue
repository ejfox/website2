<template>
  <main class="pt4">

    <Head>
      <Title>EJ Fox: Projects</Title>
    </Head>
    <table id="projects" class="w-100 collapse f3 ba bw2 b--white">
      <!-- projects have Client, Project Name, Role, Year, and URL-->
      <tr class="">
        <th class="bb bw1 b--gray dn dtc-l"><span class="gray">Client</span></th>
        <th class="bb bw1 b--gray dn dtc-l">
          <div class="w-100 tc">Project Name</div>
        </th>
        <th class="bb bw1 b--gray dn dtc-l gray">Role</th>
        <th class="bb bw1 b--gray dn dtc-l gray">Year</th>
      </tr>

      <!-- if the project has a screenshot, use it as the background image for the <tr> -->
      <tr v-for="project in data.body" :key="project.name"
        :style="project.screenshot ? 'background-image: url(' + processProjectCloudinaryUrl(project.screenshot) + ')' : ''"
        :class="['ba bw2 b--white stripe-dark bg-white', project.screenshot ? 'screenshot-bg bg-center bg-fit' : '']">
        <!-- <td class="dn dtc-l f5 v-top w-10 gray">
          <div class="flex items-center">
          {{ project.Client }}
        </td>
        <td class="dtc measure-narrow center">
          <a :href="project.URL" class="link b near-black dim db pv5 f1 f-subheadline-l lh-solid headline-sans-serif ttu tc tracked-tight">{{ project['Project Name'] }}</a>
          </td>
        <td class="f5 v-top w-10 gray">{{ project.Role }}</td>
        <td class="dn dtc-l f5 v-top w-10 gray">{{ project.Year }}</td> -->

        <!-- vertically align everything in the row -->
        <td class="dn dtc-l v-mid w-10 gray">
          <div class="flex ph2 items-center in-project-client-info">
            {{ project.Client }}
          </div>
        </td>

        <td class="dtc-l v-mid">
          <!-- use flex to make the link vertically centered -->
          <div class="wrapper-div flex items-left flex-column justify-center">

            <div class="in-project-client-info db dn-l gray f6 pl2 pt2 pb0 mv0 ttu fw1 w-100">
              {{ project.Client }}
            </div>

              <!-- <a :href="project.URL"
                class="project-name link b near-black dim db pv2 pv5-l f2 f-subheadline-l lh-solid-l headline-sans-serif ttu tl tc-l pl2 pl0-l
                ">{{
                  project['Project Name']
              }}</a> -->
              
                <a :href="project.URL" class="project-name link b near-black db pv2 pv5-l f2 f-subheadline-l lh-solid-l headline-sans-serif ttu tl tc-l pl2 pl0-l
                  ">{{
                      project['Project Name']
                  }}</a>
                <div class="project-role db dn-l f7 pl2 pt2 pb0 mv0 ttu fw1 in-project-client-info tracked gray">
                  {{ project.Role }}
                </div>
              </div>

            <div v-if="project.blogpost" class="db mv0 pv0 tl tc-l">
              <NuxtLink :to="project.blogpost" class="db link mv0 pv0 black f5 o-80 pa2 pv4">
                📝 <span class="underline pv5">Process blog post</span>
              </NuxtLink>

            </div>


        </td>

        <td class="dn dtc-l v-mid w-10 gray">
          <div class="flex ph2 f5 items-center in-project-client-info">
            {{ project.Role }}
          </div>
        </td>

        <td class="dtc-l v-mid w-10 gray">
          <div class="project-year flex ph2 f5 items-center">
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

function processProjectCloudinaryUrl(cloudinaryUrl) {
  if(!cloudinaryUrl) return ''
  // first parse the URL
  const url = new URL(cloudinaryUrl)

  // check if the URL is a Cloudinary URL
  if (url.hostname !== 'res.cloudinary.com') {
    return cloudinaryUrl // if not, send it back
  }
  
  // if it is, then we process it
  // now add b_blurred:400 to the project parameters
  // like https://res.cloudinary.com/demo/video/upload/c_scale,h_320/b_blurred:400:15,c_pad,h_320,w_480/e_volume:mute/e_accelerate:100/cld_rubiks_guy.mp4

  let w_string = 'w_900'

  // check if there is a window, if there is, set the width string to the window width
  if (typeof window !== 'undefined') {
    // w_string = 'w_' + Math.round(window.innerWidth)
    const breakPoints = [320, 640, 900, 1080, 1440, 1920]
    const windowWidth = window.innerWidth
    const closestBreakPoint = breakPoints.reduce((prev, curr) => {
      return (Math.abs(curr - windowWidth) < Math.abs(prev - windowWidth) ? curr : prev)
    })
    w_string = 'w_' + closestBreakPoint
  }

  // first, get the path
  const path = url.pathname

  // then add our blur to the path
  const newPath = path.replace('upload', `upload/q_auto:eco/f_auto/e_blur:900/${w_string}`)

  // then add the new path to the URL
  url.pathname = newPath

  // then return the new URL

  return url.toString()
}

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
  border-bottom: 1px solid rgba(0, 0, 0, .15);
}

th,
td {
  text-align: left;
  padding: 4px;
}

.stripe-dark:nth-child(odd) {
  background-color: rgba(0, 0, 0, .1);
}

.headline-sans-serif {
  font-family: 'Fjalla One', sans-serif;
}

.screenshot-bg {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.screenshot-bg td {
  background-color: rgba(0, 0, 0, .5);
  transition: background-color 0.6s cubic-bezier(0.5, 1, 0.89, 1);
}

.screenshot-bg:hover td {
  background-color: rgba(0, 0, 0, .2);
}

.screenshot-bg td .project-name {
  /* min-height: 33vh; */
}

.screenshot-bg td .wrapper-div {
  min-height: 33vh;
}

.screenshot-bg td a {
  color: white;
  text-shadow: 0 0 10px rgba(0, 0, 0, .5);
}

.screenshot-bg .project-year {
  color: #CCC;
  text-shadow: 0 0 1px rgba(0, 0, 0, .1);
}

.screenshot-bg .in-project-client-info {
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, .25);
}
</style>