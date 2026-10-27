<!--
  @file GearModelViewer.client.vue
  @description three.js GLB/GLTF viewer for a gear item's 3D scan: auto-fit
    camera, cyan key light, orbit controls with optional auto-rotate. Used by
    Gear3DGallery and pages/gear/[slug].vue. Client-only (WebGL).
  @props modelUrl: string (Scan_3D_URL), autoRotate?: boolean (true),
    height?: CSS length ('300px')
-->
<script setup>
import { useElementSize } from '@vueuse/core'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const {
  modelUrl,
  autoRotate = true,
  height = '300px',
} = defineProps({
  modelUrl: { type: String, required: true },
  autoRotate: { type: Boolean, default: true },
  height: { type: String, default: '300px' },
})

const container = ref(null)
const canvas = ref(null)
const status = ref('loading')

const { width, height: h } = useElementSize(container)

let renderer, camera, controls, raf

// nextTick so the canvas ref and container size exist before WebGL init.
onMounted(() =>
  nextTick(() => {
    if (!canvas.value) {
      status.value = 'error'
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000000')

    const key = new THREE.DirectionalLight(0x06b6d4, 1.5)
    key.position.set(5, 5, 5)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-5, -2, -5)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6), key, fill)

    // useElementSize can still read 0 on the first tick; fall back to the
    // parent's width, then a fixed 300.
    const w = width.value || canvas.value.parentElement?.offsetWidth || 300
    const hv = h.value || 300

    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
    })
    // Cap DPR at 2: 3x phones would triple fill cost for no visible gain.
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
    renderer.setSize(w, hv)
    renderer.outputColorSpace = THREE.SRGBColorSpace

    camera = new THREE.PerspectiveCamera(45, w / hv, 0.01, 1000)

    controls = new OrbitControls(camera, canvas.value)
    controls.enableDamping = true
    controls.autoRotate = autoRotate
    controls.autoRotateSpeed = 1.5

    new GLTFLoader().load(
      modelUrl,
      ({ scene: model }) => {
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        const size = box.getSize(new THREE.Vector3())
        const d = Math.max(size.x, size.y, size.z)

        // Normalise any scan to its own scale: centre it at the origin, then
        // size camera distance, clip planes and zoom limits off its largest
        // dimension `d`, so tiny and huge models frame the same way.
        model.position.sub(center)
        camera.position.set(0, d * 0.5, d * 2)
        camera.near = d * 0.01
        camera.far = d * 100
        camera.updateProjectionMatrix()
        controls.minDistance = d * 0.5
        controls.maxDistance = d * 10

        scene.add(model)
        status.value = 'ready'
        // Render loop starts only once the model is in; damping and
        // auto-rotate need controls.update() every frame.
        const tick = () => {
          raf = requestAnimationFrame(tick)
          controls.update()
          renderer.render(scene, camera)
        }
        tick()
      },
      undefined,
      () => {
        status.value = 'error'
      }
    )
  })
)

// Keep the renderer and aspect in sync when the container resizes.
watch([width, h], ([w, hv]) => {
  if (!renderer || !w || !hv) return
  camera.aspect = w / hv
  camera.updateProjectionMatrix()
  renderer.setSize(w, hv)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  controls?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <div ref="container" class="viewer" :style="{ height }">
    <canvas ref="canvas" class="canvas" />
    <div
      v-if="status !== 'ready'"
      class="overlay"
      role="status"
      aria-live="polite"
    >
      <div
        v-if="status === 'loading'"
        class="spinner"
        aria-label="Loading 3D model"
      />
      <span v-else class="error-label">3D UNAVAILABLE</span>
    </div>
  </div>
</template>

<style scoped>
.viewer {
  @apply relative w-full overflow-hidden bg-page;
}
.overlay {
  @apply absolute inset-0 flex items-center justify-center pointer-events-none;
}

/* canvas needs !important to override Three.js inline styles —
   can't use @apply */
.canvas {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.spinner {
  @apply w-3 h-3 rounded-full border-2 border-cyan-500/20 border-t-cyan-500;
  animation: spin 0.8s linear infinite;
}
.error-label {
  @apply font-mono text-3xs text-cyan-500/50 tracking-[.1em];
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
