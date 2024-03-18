<template>
  <q-item
    clickable
    tag="router-link"
    :to="link"
    :style="`color: ${isActive ? '#ff8200' : ''}}`"
  >
    <q-item-section
      v-if="icon"
      avatar
      class="items-center"
    >
      <q-avatar
        size="sm"
        square
      >
        <q-icon :name="icon" size="24px"/>
      </q-avatar>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  link: {
    type: String,
    default: '#'
  },
  icon: {
    type: String,
    default: ''
  }
})

const route = useRoute()

const isActive = computed(() => {
  if (props.link.startsWith('/apps') && route.path.startsWith('/apps')) {
    return true
  }
  return props.link === route.path
})
</script>
