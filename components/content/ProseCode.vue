
<script setup>
const props = defineProps({
  code: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: null
  },
  filename: {
    type: String,
    default: null
  },
  highlights: {
    type: Array,
    default: () => []
  }
})

// make a computed for the length of the code string
const codeCharCount = computed(() => props.code.length)
const codeLineCount = computed(() => props.code.split('\n').length - 1)

</script>

<template>
  <div
    :class="['overflow-x-auto w-100 ph3', codeCharCount > 100 ? 'f5 fw3' : 'f3', codeLineCount > 1 ? 'with-line-numbers' : '']">
    <!-- {{slot}} -->
    <slot />
  </div>
</template>

<style>
code {
  max-width: 100vw;
  overflow-x: auto;
  word-break: break-all;
}
pre {
  white-space: pre-wrap;
  line-height: 1.4rem;
}
pre code .line {
  display: block;
  min-height: 1rem;
  margin-top: 0.15rem;
}

.with-line-numbers code {
  counter-reset: step;
  counter-increment: step 0;
}

.with-line-numbers code .line::before {
  content: counter(step);
  counter-increment: step;
  width: 1rem;
  margin-right: 1rem;
  display: inline-block;
  text-align: right;
  color: rgba(115,138,148,.3)
}

.with-line-numbers code .line::before {
  content: counter(step);
}

/* re-factor to only add the line number if there ismore than one line */
.with-line-numbers code {
  counter-reset: step;
  counter-increment: step 0;
}
</style>