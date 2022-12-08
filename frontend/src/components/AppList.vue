<template>
  <div>
    <div class="row no-wrap">
      <q-list class="categories row full-width">
        <div
          v-for="category in categoriesUI"
          :key="category.name"
          :style="`background-color: ${category.color}; opacity: ${currentCategory && currentCategory.name !== category.name ? '0.5' : '1'}`"
          style="border-radius: 20px; padding: 4px 13px; cursor: pointer;"
          class="row no-wrap items-center q-mr-md q-mb-md q-py-xs q-px-md"
          @click="category.name === 'All apps' ? currentCategory = null : currentCategory = category"
        >
          <q-icon v-if="category.icon" :name="category.icon" size="18px" class="q-my-xs q-mr-sm"/>
          <span style="white-space: nowrap;">{{ category.name }}</span>
        </div>
      </q-list>

      <div class="q-ml-lg">
        <div class="row no-wrap justify-end text-grey-7">
          <q-select
            v-model="sortModel"
            :options="sortOptions"
            dense
            borderless
            style="width: 120px"
            label="Sort by"
          />
          <q-btn
            flat
            class="q-ml-sm q-pa-sm"
            :icon="sortIcon"
            :style="sortIcon === 'mdi-sort-' + oppositeDirection ? 'transform: scale(1, -1)' : ''"
            @click="changeSortDirection"
          />
        </div>
      </div>
    </div>

    <q-list class="apps full-width q-mt-sm">
      <div
        v-for="app in filteredSortedApps"
        :key="app.name"
        class="flex justify-center q-ma-sm q-pa-none card-container"
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
    initialCategory: Object
  },

  setup () {
    return {
      currentCategory: ref(null),
      sortOptions: [
        'Update date',
        'Github stars',
        'Name'
      ],
      sortModel: ref('Update date'),
      sortDirection: ref('ascending')
    }
  },

  computed: {
    categoriesUI () {
      const categories = this.categories
      categories.unshift({
        name: 'All apps',
        color: '#ebebeb'
      })
      return categories
    },

    filteredSortedApps () {
      let filtered
      if (this.currentCategory) {
        filtered = this.apps.filter(e => e.category === this.currentCategory.name)
      } else {
        filtered = this.apps
      }

      let sortBy = ''
      switch (this.sortModel) {
        case 'Update date':
          sortBy = 'updated'
          break
        case 'Github stars':
          sortBy = 'stars'
          break
        case 'Name':
          sortBy = 'name'
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
      switch (this.sortModel) {
        case 'Update date':
          return 'mdi-sort-calendar-' + this.sortDirection
        case 'Name':
          return 'mdi-sort-alphabetical-' + this.sortDirection
        default:
          return 'mdi-sort-' + this.oppositeDirection
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
      this.$emit('showNotif', { message: app.name })
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

@media (max-width: 1275px)
  .apps
    grid-template-columns: repeat(3, 1fr)

@media (max-width: 990px)
  .apps
    grid-template-columns: repeat(2, 1fr)

@media (max-width: 875px)
  .categories
    grid-template-columns: repeat(4, 1fr)

@media (max-width: 675px)
  .categories
    grid-template-columns: repeat(3, 1fr)
  .apps
    grid-template-columns: 1fr

@media (max-width: 545px)
  .categories
    grid-template-columns: repeat(2, 1fr)
</style>
