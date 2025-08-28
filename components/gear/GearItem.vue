<template>
  <GearTableRow :item="item" />
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true
  }
})
</script>