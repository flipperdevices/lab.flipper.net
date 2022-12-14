<template>
  <div>
    <div class="row" :class="$q.screen.width > 670 ? 'no-wrap' : 'justify-center'">
      <q-list class="categories row" :class="$q.screen.width > 670 ? 'col-8' : 'justify-center'">
        <div
          :style="`opacity: ${currentCategory && currentCategory.name !== 'All apps' ? '0.5' : '1'}`"
          style="background-color: #ebebeb; border-radius: 20px; padding: 4px 13px; cursor: pointer;"
          class="row no-wrap items-center q-mr-md q-mb-md q-py-xs q-px-md"
          @click="currentCategory = null"
        >
          <span style="white-space: nowrap;">All apps</span>
        </div>
        <div
          v-for="category in categories"
          :key="category.name"
          :style="`background-color: ${category.color}; opacity: ${currentCategory && currentCategory.name !== category.name ? '0.5' : '1'}`"
          style="border-radius: 20px; padding: 4px 13px; cursor: pointer;"
          class="row no-wrap items-center q-mr-md q-mb-md q-py-xs q-px-md"
          @click="currentCategory = category"
        >
          <q-icon v-if="category.icon" :name="category.icon" size="18px" class="q-my-xs q-mr-sm"/>
          <span style="white-space: nowrap;">{{ category.name }}</span>
        </div>
      </q-list>
      <q-space v-if="$q.screen.width > 670"/>
      <div>
        <div class="row no-wrap justify-end text-grey-7">
          <q-select
            v-model="sortModel"
            :options="sortOptions"
            dense
            outlined
            class="rounded-borders"
            style="min-width: fit-content;"
            label="Sort by"
          />
          <q-btn
            outline
            class="q-ml-sm q-pa-sm text-grey-5"
            @click="changeSortDirection"
          >
            <div class="flex no-wrap text-grey-7">
              <q-icon name="svguse:common-icons.svg#old" size="16px"/>
              <q-icon :name="sortIcon" size="16px"/>
            </div>
          </q-btn>
        </div>
      </div>
    </div>

    <q-list class="apps full-width q-mt-sm">
      <div
        v-for="app in filteredSortedApps"
        :key="app.name"
        class="flex justify-center q-ma-sm q-pa-none card-container"
        style="width: fit-content"
      >
        <div
          style="width: calc(256px + 4px + 8px)"
          class="app-card"
          @click="appClicked(app)"
        >
          <div class="screenshot q-mb-sm">
            <img :src="app.screenshots[0]" />
          </div>

          <div class="flex justify-between" style="padding: 0 4px">
            <div class="text-h6">{{ app.name }}</div>
            <div style="font-size: 18px; line-height: 18px;">
              <span>
                <q-icon :name="categories.find(e => e.name === app.category).icon" />
              </span>
            </div>
          </div>

          <div class="flex no-wrap items-end justify-between" style="padding: 0 4px">
            <span class="desc text-grey-7">{{ app.description.split('\n')[0] }}</span>
            <q-btn
              flat
              dense
              color="white"
              style="margin-left: 5px; padding: 0 1rem; border-radius: 5px; font-size: 16px;"
              label="Install"
              class="no-shadow text-pixelated bg-primary"
            />
          </div>
        </div>
      </div>
    </q-list>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'

export default defineComponent({
  name: 'AppList',
  props: {
    categories: Array,
    apps: Array,
    initialCategory: Object,
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  setup () {
    return {
      currentCategory: ref(null),
      sortOptions: [
        'Recently Updated',
        'Recently Published'
      ],
      sortModel: ref('Recently Updated'),
      sortDirection: ref('ascending')
    }
  },

  watch: {
    initialCategory (newCat, oldCat) {
      this.currentCategory = newCat
    }
  },

  computed: {
    filteredSortedApps () {
      let filtered
      if (this.currentCategory) {
        filtered = this.apps.filter(e => e.category === this.currentCategory.name)
      } else {
        filtered = this.apps
      }

      let sortBy = ''
      switch (this.sortModel) {
        case 'Recently Updated':
          sortBy = 'updated'
          break
        case 'Recently Published':
          sortBy = 'published'
          break
      }
      const direction = this.sortDirection === 'descending' ? 1 : -1

      return filtered.sort((a, b) => {
        if (a[sortBy] >= b[sortBy]) {
          return 1 * direction
        }
        return -1 * direction
      })
    },

    sortIcon () {
      if (this.sortDirection === 'ascending') {
        return 'svguse:common-icons.svg#arrow-up'
      } else {
        return 'svguse:common-icons.svg#arrow-down'
      }
    },

    oppositeDirection () {
      if (this.sortDirection === 'ascending') {
        return 'descending'
      } else {
        return 'ascending'
      }
    }
  },

  methods: {
    changeSortDirection () {
      if (this.sortDirection === 'ascending') {
        this.sortDirection = 'descending'
      } else {
        this.sortDirection = 'ascending'
      }
    },

    appClicked (app) {
      this.$emit('openApp', app)
    }
  },

  mounted () {
    this.currentCategory = this.initialCategory
  }
})
</script>

<style lang="sass" scoped>
.apps
  display: grid
  grid-template-columns: repeat(4, 1fr)

  .card-container
    padding: 12px
    border-radius: 14px
    transition-duration: 300ms
    cursor: pointer
    &:hover
      box-shadow: 0 1px 11px rgb(0 0 0 / 13%), 0 3px 6px rgb(0 0 0 / 5%), 0 3px 6px -2px rgb(0 0 0 / 8%)
  .app-card
    display: flex
    flex-direction: column
    justify-content: center
    padding: 0
    border-radius: 3px
    .screenshot
      display: flex
      justify-content: center
      padding: 4px
      background-color: $primary
      border: 2px solid #000000
      border-radius: 6px
      img
        image-rendering: pixelated
    .text-h6
      line-height: 1.75rem
    .desc
      font-size: 12px
      line-height: 15px

@media (max-width: 1340px)
  .apps
    grid-template-columns: repeat(3, 1fr)

@media (max-width: 1032px)
  .apps
    grid-template-columns: repeat(2, 1fr)

@media (max-width: 875px)
  .categories
    grid-template-columns: repeat(4, 1fr)

@media (max-width: 670px)
  .categories
    grid-template-columns: repeat(3, 1fr)
  .apps
    display: flex
    flex-direction: column
    flex-wrap: nowrap
    align-items: center

@media (max-width: 545px)
  .categories
    grid-template-columns: repeat(2, 1fr)
</style>
