<template>
  <div class="column items-center">
    <q-spinner
      color="primary"
      size="3em"
      class="q-mb-md"
    ></q-spinner>
    <p>{{ props.label }}</p>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  label: {
    type: String,
    default: 'Loading...'
  }
})
</script>
