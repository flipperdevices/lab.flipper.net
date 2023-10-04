<template>
  <div>
    <template v-if="apps.length">
      <div
        class="row q-pr-md"
        :class="`${$q.screen.width > 670 ? 'no-wrap' : 'justify-center'} ${action.type ? 'disabled' : ''}`"
      >
        <q-list class="categories row" :class="$q.screen.width > 670 ? 'col-8' : 'justify-center'">
          <div
            :style="`opacity: ${currentCategory && currentCategory.name !== 'All apps' ? '0.5' : '1'}`"
            style="background-color: #ebebeb; border-radius: 20px; padding: 4px 13px; cursor: pointer;"
            class="row no-wrap items-center q-mr-md q-mb-md q-py-xs q-px-md"
            @click="currentCategory = null; $router.push('/apps')"
          >
            <span style="white-space: nowrap;">All apps</span>
          </div>
          <div
            v-for="category in categories"
            :key="category.name"
            :style="`background-color: #${category.color}; opacity: ${currentCategory && currentCategory.name !== category.name ? '0.5' : '1'}`"
            style="border-radius: 20px; padding: 4px 13px; cursor: pointer;"
            class="row no-wrap items-center q-mr-md q-mb-md q-py-xs q-px-md"
            @click="currentCategory = category;"
          >
            <q-icon v-if="category.iconUri" :name="`img:${category.iconUri}`" size="14px" class="q-my-xs q-mr-sm"/>
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
              standout="bg-primary text-white no-shadow"
              rounded
              style="min-width: fit-content; border-radius: 20px;"
            />
          </div>
        </div>
      </div>

      <q-list class="apps full-width q-mt-sm">
        <div
          v-for="app in filteredSortedApps"
          :key="app.name"
          class="flex justify-center q-pa-none card-container"
          style="width: fit-content"
          :class="action.type && action.id !== app.id ? 'disabled' : ''"
        >
          <div
            style="width: calc(256px + 4px + 8px)"
            class="app-card"
            @click="appClicked(app)"
          >
            <div class="screenshot q-mb-sm">
              <img :src="app.currentVersion.screenshots[0]" style="width: 256px" />
            </div>

            <div class="flex justify-between no-wrap" style="padding: 0 4px">
              <div class="text-h6 ellipsis" style="flex-grow: 1;flex-basis: 179px;margin-right: 3px;">{{ app.currentVersion.name }}</div>
              <div style="font-size: 18px; line-height: 18px;">
                <span>
                  <q-icon :name="`img:${categories.find(e => e.id === app.categoryId).iconUri}`" size="14px" class="q-mr-sm"/>
                  <span style="font-size: 13px">{{ categories.find(e => e.id === app.categoryId).name }}</span>
                </span>
              </div>
            </div>

            <div
              style="display: grid;grid-template-columns: 1fr auto;padding-left: 4px;align-items: end;"
              :style="`padding-right: ${action.type && action.id === app.id ? 0 : 4}px`"
            >
              <span class="col-shrink desc text-grey-7" style="margin-bottom: 2px;max-height: 30px;overflow: hidden;display: -webkit-box;-webkit-line-clamp: 2;-webkit-box-orient: vertical;">
                {{ app.currentVersion.shortDescription }}
              </span>
              <div class="col-shrink" style="width: 80px;">
                <template v-if="action.type && action.id === app.id">
                  <q-linear-progress
                    :value="action.progress"
                    size="32px"
                    :color="actionColors.bar"
                    :track-color="actionColors.track"
                    style="width: 80px; border-radius: 5px;"
                  >
                    <div class="absolute-full flex flex-center" style="border: 2px solid; border-radius: 5px;">
                      <div
                        class="app-progress-label"
                        style="font-size: 28px;"
                      >{{ `${action.progress * 100}%` }}</div>
                    </div>
                  </q-linear-progress>
                </template>
                <q-btn
                  v-else
                  flat
                  dense
                  color="white"
                  style="margin-left: 5px; padding: 0; border-radius: 5px; font-size: 16px; line-height: 16px;"
                  :label="app.actionButton?.text"
                  class="fit no-shadow text-pixelated"
                  :class="app.actionButton?.class"
                  @click="handleAction(app, app.actionButton?.text)"
                />
              </div>
            </div>
          </div>
        </div>
      </q-list>
    </template>
    <template v-else>
      <div class="column items-center">
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Loading apps...</p>
      </div>
    </template>
  </div>
</template>

<script>
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
// import semver from 'semver'

export default defineComponent({
  name: 'AppList',
  props: {
    categories: Array,
    apps: Array,
    initialCategory: Object,
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    action: Object
  },

  emit: ['showNotif', 'openApp', 'action', 'batchUpdate'],

  setup (props, { emit }) {
    onMounted(() => {
      currentCategory.value = props.initialCategory
    })

    const initialCategoryRef = computed(() => props.initialCategory)

    watch(initialCategoryRef, (newCategory) => {
      currentCategory.value = newCategory
    })

    const filteredSortedApps = computed(() => {
      let filtered
      if (currentCategory.value) {
        filtered = props.apps.filter(app => app.categoryId === currentCategory.value.id)
      } else {
        filtered = props.apps
      }

      let sortBy = '', direction = -1
      switch (sortModel.value) {
        case 'New Updates':
          sortBy = 'updatedAt'
          break
        case 'Old Updates':
          sortBy = 'updatedAt'
          direction = 1
          break
        case 'New Releases':
          sortBy = 'createdAt'
          break
        case 'Old Releases':
          sortBy = 'createdAt'
          direction = 1
          break
      }

      return filtered.sort((a, b) => {
        if (a[sortBy] >= b[sortBy]) {
          return 1 * direction
        }
        return -1 * direction
      })
    })

    const actionColors = computed(() => {
      switch (props.action.type) {
        case 'delete':
          return {
            bar: 'negative',
            track: 'deep-orange-5'
          }
        case 'install':
          return {
            bar: 'primary',
            track: 'orange-6'
          }
        default:
          return {
            bar: 'positive',
            track: 'green-6'
          }
      }
    })

    const currentCategory = ref(null)
    const sortOptions = [
      'New Updates',
      'New Releases',
      'Old Updates',
      'Old Releases'
    ]
    const sortModel = ref('New Updates')
    const actionType = ref(null)

    const appClicked = (app) => {
      if (props.action.type) {
        return
      }
      emit('openApp', app)
    }

    const handleAction = (app, value) => {
      if (value === 'Installed') {
        actionType.value = ''
      } else {
        actionType.value = value.toLowerCase()
      }
      emit('action', app, actionType.value)
    }

    return {
      filteredSortedApps,
      actionColors,

      currentCategory,
      sortOptions,
      sortModel,
      actionType,

      appClicked,
      handleAction
    }
  }
})
</script>

<style lang="sass" scoped>
.apps
  display: grid
  grid-template-columns: repeat(4, 1fr)
  justify-items: center

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
