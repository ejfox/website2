<script setup lang="ts">
const { data } = await useAsyncData('projects', () => queryContent('/projects').findOne())
</script>
<template>
  <main>
    <ContentRenderer :value="data">
      <template>
        <div>
          {{data.body}}
        </div>
      </template>
    </ContentRenderer>
  </main>
</template>