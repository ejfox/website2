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

onMounted(() =>
  nextTick(() => {
    if (!canvas.value) {
      status.value = 'error'
      return
    }

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a0a')

    const key = new THREE.DirectionalLight(0x06b6d4, 1.5)
    key.position.set(5, 5, 5)
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-5, -2, -5)
    scene.add(new THREE.AmbientLight(0xffffff, 0.6), key, fill)

    const w = width.value || canvas.value.parentElement?.offsetWidth || 300
    const hv = h.value || 300

    renderer = new THREE.WebGLRenderer({
      canvas: canvas.value,
      antialias: true,
    })
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

        model.position.sub(center)
        camera.position.set(0, d * 0.5, d * 2)
        camera.near = d * 0.01
        camera.far = d * 100
        camera.updateProjectionMatrix()
        controls.minDistance = d * 0.5
        controls.maxDistance = d * 10

        scene.add(model)
        status.value = 'ready'
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
