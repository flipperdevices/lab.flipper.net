<template>
  <div>
    <q-list class="categories full-width q-mt-sm q-mb-xl">
      <q-item
        v-for="category in categories"
        :key="category.name"
        class="row nowrap items-center q-ma-sm shadow-4 rounded-borders q-pa-none"
        :class="currentCategory && currentCategory.name === category.name ? 'bg-primary' : 'bg-white'"
        clickable
        @click="currentCategory && currentCategory.name === category.name ? currentCategory = null : currentCategory = category"
      >
        <q-card-section avatar :class="$q.screen.width >= 990 ? 'q-px-xs' : 'q-pa-none'">
          <q-avatar :icon="category.icon" />
        </q-card-section>
        <q-space />
        <q-card-section :class="$q.screen.width >= 990 ? 'q-px-md' : 'q-px-sm'">
          <div class="text-subtitle-1 text-center">{{ category.name }}</div>
        </q-card-section>
        <q-space v-if="$q.screen.width >= 1200" />
        <q-card-section v-if="$q.screen.width >= 1200">
          <div
            class="text-subtitle-1"
            :class="currentCategory && currentCategory.name === category.name ? 'text-dark' : 'text-grey-7'"
          >{{ category.amount }}</div>
        </q-card-section>
      </q-item>
    </q-list>

    <div class="full-width flex justify-end text-grey-7">
      <q-select
        v-model="sortModel"
        :options="sortOptions"
        dense
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

    <q-list class="apps full-width q-mt-sm">
      <div
        v-for="app in filteredSortedApps"
        :key="app.name"
        class="flex justify-center q-ma-md q-pa-none"
      >
        <q-item
          style="width: 256px"
          clickable
          class="app-card"
          @click="$emit('showNotif', { message: app.name })"
        >
          <img :src="app.screenshots[0]" class="rounded-borders q-mb-sm">

          <q-card-section class="flex justify-between">
            <div class="text-h6">{{ app.name }}</div>
            <div class="column text-caption text-grey-7">
              <span>
                <q-icon :name="categories.find(e => e.name === app.category).icon" style="margin: 0 3px 2px 0" />
                {{ app.category }}
              </span>
              <span class="text-right"><q-icon name="star" size="14px" /> {{ app.stars }}</span>
            </div>
          </q-card-section>

          <q-card-section class="flex no-wrap items-end justify-between">
            <span>{{ app.description.split('\n')[0] }}</span>
            <q-btn color="primary" label="Install" style="margin-bottom: 3px" class="no-shadow"/>
          </q-card-section>
        </q-item>
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
    }
  },

  mounted () {
    this.currentCategory = this.initialCategory
  }
})
</script>

<style lang="sass" scoped>
.categories
  display: grid
  grid-template-columns: repeat(5, 1fr)

.apps
  display: grid
  grid-template-columns: repeat(4, 1fr)
  .app-card
    display: flex
    flex-direction: column
    justify-content: center
    padding: 0
    border-radius: 3px

    .q-card__section
      padding: 2px 4px

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
