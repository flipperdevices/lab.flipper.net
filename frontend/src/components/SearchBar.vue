<template>
  <div class="full-width relative-position justify-center">
    <q-input dense borderless v-model="text" class="full-width q-px-md bg-grey-3" style="border-radius: 20px" label="Search">
      <template v-slot:prepend>
        <q-icon name="mdi-magnify" class="text-grey-7"/>
      </template>
    </q-input>
    <q-list
      v-if="(text.length >= 2)"
      bordered
      class="absolute bg-white rounded-borders z-top"
      style="width: 270px; top: 43px;"
    >
      <template v-if="filteredIndex.length">
        <q-item
          v-for="item in filteredIndex"
          :key="item"
          clickable
          dense
          v-ripple
          @click="itemClicked(item)"
        >
          <q-item-section v-if="apps.find(e => e.currentVersion.name === item)" avatar>
            <q-avatar square size="24px" style="margin: 4px">
              <img :src="apps.find(e => e.currentVersion.name === item).currentVersion.iconUri" style="image-rendering: pixelated;">
            </q-avatar>
          </q-item-section>
          <q-item-section>{{ item }}</q-item-section>
        </q-item>
      </template>
      <template v-else>
        <q-item dense>
          <q-item-section class="text-grey-7">No matching items</q-item-section>
        </q-item>
      </template>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'SearchBar',
  props: {
    apps: Array
  },

  setup () {
    return {
      text: ref('')
    }
  },

  computed: {
    appNames () {
      return this.apps.map(e => e.currentVersion.name)
    },
    index () {
      return this.appNames
    },
    filteredIndex () {
      return this.index.filter(e => e.toLowerCase().includes(this.text.toLowerCase())).slice(0, 10)
    }
  },

  methods: {
    itemClicked (item) {
      this.$emit('openApp', this.apps.find(e => e.currentVersion.name === item))
      this.text = ''
    }
  }
})
</script>

<style lang="sass" scoped>
input
  color: black !important
</style>
