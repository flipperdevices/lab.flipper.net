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
      style="min-width: initial;"
    >
      <q-icon :name="icon"/>
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
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
  },

  computed: {
    isActive () {
      if (this.link.startsWith('/apps') && this.$route.path.startsWith('/apps')) {
        return true
      }
      return this.link === this.$route.path
    }
  }
})
</script>
