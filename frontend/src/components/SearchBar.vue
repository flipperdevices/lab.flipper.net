<template>
  <div class="full-width">
    <q-input dense borderless v-model="text" class="full-width q-px-md bg-grey-3" style="border-radius: 20px" label="Search">
      <template v-slot:prepend>
        <q-icon name="mdi-magnify" class="text-grey-7"/>
      </template>
    </q-input>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'AppList',
  props: {
    apps: Array
  },

  setup () {
    return {
      text: ref('')
    }
  },

  computed: {
  },

  methods: {
  },

  mounted () {
  }
})
</script>

<style lang="sass" scoped>
input
  color: black !important
</style>
