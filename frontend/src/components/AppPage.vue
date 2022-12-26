<template>
  <div>
    <div class="row items-center q-mb-lg" :class="$q.screen.width > 670 ? 'no-wrap' : ''">
      <div class="app-icon q-mr-md">
        <q-img :src="app.icon"/>
      </div>
      <div :class="$q.screen.width > 350 ? 'q-mr-md' : ''">
        <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.name }}</div>
        <div class="row">
          <div
            :style="`background-color: ${category.color};`"
            style="border-radius: 20px; padding: 4px 13px; width: fit-content;"
            class="row no-wrap items-center q-py-xs q-px-md"
          >
            <q-icon v-if="category.icon" :name="category.icon" size="16px" class="q-my-xs q-mr-sm"/>
            <span style="white-space: nowrap;">{{ category.name }}</span>
          </div>
          <div class="flex items-center q-ml-md">
            <span class="text-grey-7">Version:</span>
            <b class="q-ml-xs">{{ app.version }}</b>
          </div>
        </div>
      </div>
      <q-space />
      <q-btn
        flat
        color="white"
        style="font-size: 22px; padding: 0 60px; border-radius: 10px;"
        :label="actionButton().text"
        class="no-shadow text-pixelated"
        :class="actionButton().class + ' ' + ($q.screen.width > 670 ? 'q-mr-md' : 'q-my-md full-width')"
      />
    </div>
    <div id="carousel" class="flex">
      <q-btn
        flat
        dense
        @click="animateScroll('backward')"
        icon="mdi-chevron-left"
      />
      <q-scroll-area
        ref="scrollAreaRef"
        :thumb-style="{ display: 'none' }"
        style="height: 140px; max-width: 1280px; width: calc(100% - 65px);"
        class="q-my-md no-pointer-events"
      >
        <div class="row no-wrap">
          <div
            v-for="screenshot in app.screenshots"
            :key="screenshot"
            class="q-mx-xs screenshot"
          >
            <img :src="screenshot" />
          </div>
        </div>
      </q-scroll-area>
      <q-btn
        flat
        dense
        @click="animateScroll('forward')"
        icon="mdi-chevron-right"
      />
    </div>
    <div class="column">
      <div class="text-h6 q-my-sm">Description</div>
      <p style="white-space: pre-wrap;">{{ app.description }}</p>
      <div class="text-h6 q-my-sm">Changelog</div>
      <p style="white-space: pre-wrap;">{{ app.changelog }}</p>
      <div class="text-h6 q-my-sm">Developer</div>
      <p>
        <a class="text-grey-7" :href="app.manifest" style="text-decoration: none;">
          <q-icon name="mdi-github" color="grey-7" size="20px"/>
          <span class="q-ml-xs" style="text-decoration: underline;">Manifest</span>
        </a>
        <br />
        <a class="text-grey-7" :href="app.repository" style="text-decoration: none;">
          <q-icon name="mdi-github" color="grey-7" size="20px"/>
          <span class="q-ml-xs" style="text-decoration: underline;">Repository</span>
        </a>
      </p>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import semver from 'semver'

export default defineComponent({
  name: 'AppPage',
  props: {
    categories: Array,
    app: Object,
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  setup () {
    return {
      flags: ref([]),
      category: ref({}),
      screenshotWidth: 256 + 4 + 8 + 8,
      position: ref(0),
      scrollAreaRef: ref(null)
    }
  },

  computed: {
  },

  methods: {
    setCategory () {
      this.category = this.categories.find(e => e.name === this.app.category)
    },

    animateScroll (direction) {
      const carousel = document.querySelector('#carousel')
      const width = carousel.clientWidth - 2 * 32
      if (direction === 'forward') {
        this.position = this.position + this.screenshotWidth
        if (this.position > width) {
          this.position = width + this.screenshotWidth
        }
      } else if (direction === 'backward') {
        if (this.position > width) {
          this.position = Math.round((width + this.screenshotWidth) / this.screenshotWidth) * this.screenshotWidth
        }
        this.position = this.position - this.screenshotWidth
        if (this.position < 0) {
          this.position = 0
        }
      }
      this.scrollAreaRef.setScrollPosition('horizontal', this.position, 300)
    },

    actionButton () {
      if (this.app.isInstalled) {
        if (this.app.installedVersion && semver.lt(this.app.installedVersion, this.app.version)) {
          return {
            text: 'Update',
            class: 'bg-positive'
          }
        }
        return {
          text: 'Installed',
          class: 'bg-grey-6'
        }
      }
      return {
        text: 'Install',
        class: 'bg-primary'
      }
    }
  },

  mounted () {
    this.setCategory()
  },

  updated () {
    this.setCategory()
  }
})
</script>

<style lang="sass" scoped>
.app-icon
  width: 70px
  padding: 10px
  border: 1px solid #dbdbdb
  border-radius: 10px

.screenshot
  width: calc(256px + 4px + 8px)
  display: flex
  justify-content: center
  padding: 4px
  background-color: $primary
  border: 2px solid #000000
  border-radius: 6px
  img
    image-rendering: pixelated
</style>
