<template>
  <div class="calendar-wrapper p-4 md:p-8">
    <iframe
      :src="calendarUrl"
      class="calendar-iframe"
      frameborder="0"
      allowfullscreen
    ></iframe>
  </div>
</template>

<script setup>
import { useColorMode } from '@vueuse/core'

// Detect system theme
const colorMode = useColorMode()
const calendarUrl = computed(() => {
  const theme =
    colorMode.preference === 'system' ? colorMode.value : colorMode.preference

  return `https://cal.com/ejfox/30min?embed=true&layout=month_view&theme=${theme === 'dark' ? 'dark' : 'light'}`
})

// CSP headers
useHead({
  meta: [
    {
      name: 'Content-Security-Policy',
      content: "frame-src 'self' https://cal.com;",
    },
  ],
})
</script>

<style scoped>
.calendar-wrapper {
  width: 100%;
  height: 100vh;
  background: rgb(250 250 250);
  transition: background-color 0.2s ease;
}

.calendar-iframe {
  width: 100%;
  height: calc(100vh - 2rem); /* Account for padding */
  border: none;
  display: block;
  background: transparent;
  transition: opacity 0.2s ease;
  border-radius: 1rem; /* Big round corners */
}

@media (min-width: 768px) {
  .calendar-iframe {
    height: calc(100vh - 4rem); /* Account for larger padding on desktop */
  }
}

/* Dark mode background */
:global(.dark) .calendar-wrapper {
  background: rgb(9 9 11);
}

/* Loading state */
.calendar-iframe:not([src]) {
  opacity: 0;
}

/* Desktop layout - full width within layout */
@media (min-width: 768px) {
  .calendar-wrapper {
    width: 100%;
  }
}

/* Mobile layout - account for header */
@media (max-width: 767px) {
  .calendar-wrapper {
    height: calc(100vh - 64px);
  }
}

/* Ensure calendar blends with your site's background */
.calendar-wrapper::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: inherit;
  z-index: -1;
}

/* Add subtle border on desktop to separate from nav */
@media (min-width: 768px) {
  .calendar-wrapper {
    border-left: 1px solid rgb(228 228 231);
  }

  :global(.dark) .calendar-wrapper {
    border-left-color: rgb(39 39 42);
  }
}
</style>
