<template>
  <q-item
    clickable
    tag="router-link"
    :to="link"
  >
    <q-item-section
      v-if="icon"
      avatar
    >
      <q-icon :name="icon" :color="link === this.$route.path ? '#ff8200' : ''"/>
    </q-item-section>

    <q-item-section>
      <q-item-label :class="link === this.$route.path ? 'text-orange' : ''">{{ title }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'RouterLink',
  props: {
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
  }
})
</script>
