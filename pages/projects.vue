<template>
  <main class="pt4">

    <Head>
      <Title>EJ Fox: Projects</Title>
    </Head>
    <table id="projects" class="w-100 collapse f3">
      <!-- projects have Client, Project Name, Role, Year, and URL-->
      <!-- <tr class="">
        <th class="bb ph2 b--gray dn dtc-l"><span class="gray">Client</span></th>
        <th class="bb ph2 b--gray dn dtc-l">
          <div class="w-100 tc">Project Name</div>
        </th>
        <th class="bb ph2 b--gray dn dtc-l gray">Role</th>
        <th class="bb ph2 b--gray dn dtc-l gray">Year</th>
      </tr> -->

      <!-- if the project has a screenshot, use it as the background image for the <tr> -->
      <tr v-for="project in data.body" :key="project.name"
        :class="['', project.screenshot ? 'screenshot-row' : '']">
        <td class="dn dtc-l v-mid w-10 gray">
          <div class="flex ph2 items-center in-project-client-info">
            {{ project.Client }}
          </div>
        </td>

        <td :class="['bn ma0 pa0 dtc-l v-mid', project.screenshot ? 'screenshot-bg' : '']" :style="project.screenshot ? 'background-image: url(' + processProjectCloudinaryUrl(project.screenshot) + ')' : ''">
          <!-- use flex to make the link vertically centered -->
          <div class="wrapper-div flex items-left flex-column justify-center">

            <div class="in-project-client-info db dn-l f6 pl3 pt2 pb0 mv0 ttu fw1 w-100">
              {{ project.Client }}
            </div>

            <a :href="project.URL" class="project-name link b near-black db pv2 pv5-l f2 f-subheadline-l lh-solid-l headline-sans-serif ttu tl tc-l pl3 pl0-l ph4-l
                  ">{{
                      project['Project Name']
                  }}</a>
            <div class="project-role db dn-l f7 pl3 pv2 pb0 mv0 ttu fw1 in-project-client-info tracked">
              {{ project.Role }}
            </div>

            <div v-if="project.blogpost" class="db mv0 pv0 tl tc-l">
            <NuxtLink :to="project.blogpost" class="db link mv0 pv0 black f5 o-80 pa2 pv4">
              📝 <span class="underline pv5">Process blog post</span>
            </NuxtLink>
          </div>
          </div>          
        </td>

        <td class="dn dtc-l v-mid w-10 gray">
          <div class="flex ph2 f5 items-center in-project-client-info">
            {{ project.Role }}
          </div>
        </td>

        <td class="dtc-l v-mid w-10 gray">
          <div class="project-year flex ph2 f5">
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

const animationDuration = 720

function processProjectCloudinaryUrl(cloudinaryUrl) {
  if (!cloudinaryUrl) return ''
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
  const newPath = path.replace('upload', `upload/q_auto:eco/f_auto/e_blur:900,e_grayscale/${w_string}`)

  // then add the new path to the URL
  url.pathname = newPath

  // then return the new URL

  return url.toString()
}

function animateProjects() {
  anime({
    targets: '#projects tr',
    opacity: [0, 1],
    // translateY: [10, 0],
    easing: 'easeInOutQuad',
    duration: animationDuration,
    delay: anime.stagger(animationDuration/2.5),
  })
}

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      animateProjects()
    }, 50)
  })
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
table {
  border-collapse: collapse;
}

th {
  text-align: left;
}

tr {
  padding: 0;
  margin: 0;
}

.stripe-dark:nth-child(odd) {
  background-color: rgba(0, 0, 0, .1);
}

.headline-sans-serif {
  font-family: 'Fjalla One', sans-serif;
}

.screenshot-bg {
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
}

.screenshot-bg .wrapper-div {
  padding: 0;
  margin: 0;
  transition: background-color 0.77s cubic-bezier(0.5, 1, 0.89, 1);
  transition-delay: 33ms;
}

.screenshot-bg:hover .wrapper-div {
  /* background-color: rgba(0, 0, 0, .2); */
  background-color: rgba(255,255,255,0.45);

}

.screenshot-row td .wrapper-div {
  min-height: 33vh;
  /* background-color: rgba(0, 0, 0, .5);   */
  background-color: rgba(255,255,255,0.8);

}

td .wrapper-div {
  min-height: 22vh;
}

.screenshot-row {
  padding: 0;
  margin: 0;
}
</style>