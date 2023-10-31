<template>
  <q-page class="full-width q-pl-md">
    <template v-if="loading">
      <div class="column items-center">
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Loading app...</p>
      </div>
    </template>
    <template v-else>
      <div class="row items-center q-mb-lg" :class="$q.screen.width > 670 ? 'no-wrap' : ''">
        <div class="app-icon q-mr-md">
          <q-img :src="props.app.currentVersion.iconUri" style="image-rendering: pixelated;"/>
        </div>
        <div :class="$q.screen.width > 350 ? 'q-mr-md' : ''">
          <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ props.app.currentVersion.name }}</div>
          <div class="row q-gutter-md">
            <div
              :style="`background-color: #${category.color};`"
              style="border-radius: 20px; padding: 4px 13px; width: fit-content;"
              class="row no-wrap items-center q-py-xs q-px-md"
            >
              <q-icon v-if="category.iconUri" :name="`img:${category.iconUri}`" size="14px" class="q-my-xs q-mr-sm"/>
              <span style="white-space: nowrap;">{{ category.name }}</span>
            </div>
            <div class="flex items-center q-ml-md">
              <span class="text-grey-7">Version:</span>
              <b class="q-ml-xs">{{ props.app.currentVersion.version }}</b>
            </div>
            <div class="flex items-center q-ml-md">
              <span class="text-grey-7" v-if="!!props.app.currentVersion.currentBuild">Size:</span>
              <b class="q-ml-xs">{{ bytesToSize(props.app.currentVersion.currentBuild.metadata.length) }}</b>
            </div>

            <template v-if="currentStatusHint">
              <div>
                <q-chip
                  :color="statusHints[currentStatusHint].color"
                  :icon="statusHints[currentStatusHint].icon"
                  :label="statusHints[currentStatusHint].text"
                  class="q-my-none"
                  :clickable="!!statusHints[currentStatusHint].dialog"
                  @click="emit('showDialog', statusHints[currentStatusHint].dialog)"
                >
                <q-tooltip v-if="!!statusHints[currentStatusHint].tooltip">
                  {{ statusHints[currentStatusHint].tooltip }}
                </q-tooltip>
                </q-chip>
              </div>
            </template>
          </div>
        </div>

        <q-space />

        <template v-if="props.action.type">
          <q-linear-progress
            :value="props.action.progress"
            size="56px"
            :color="actionColors.bar"
            :track-color="actionColors.track"
            :class="$q.screen.width > 670 ? 'q-mr-md' : 'q-my-md full-width'"
            style="width: 188px; border-radius: 10px;"
          >
            <div class="absolute-full flex flex-center" style="border: 2px solid; border-radius: 11px;">
              <div
                class="app-progress-label"
                style="font-size: 40px;"
              >{{ `${props.action.progress * 100}%` }}</div>
            </div>
          </q-linear-progress>
        </template>
        <template v-else>
          <q-btn
            v-if="props.app.isInstalled"
            flat
            color="negative"
            icon="svguse:common-icons.svg#delete"
            class="q-mr-md"
            style="font-size: 19px;padding: 10px 12px;border-radius: 10px;border: 2px solid currentColor;"
            @click="flags.deleteConfirmationDialog = true"
          />
          <q-btn
            flat
            color="white"
            style="font-size: 22px; padding: 0 60px; border-radius: 10px;"
            :label="props.app.actionButton.text"
            class="no-shadow text-pixelated"
            :class="props.app.actionButton.class + ' ' + ($q.screen.width > 670 ? 'q-mr-md' : 'q-my-md full-width')"
            @click="handleAction(props.app.actionButton.text)"
          />
        </template>
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
              v-for="screenshot in props.app.currentVersion.screenshots"
              :key="screenshot"
              class="q-mx-xs screenshot"
            >
              <img :src="screenshot" style="width: 248px" />
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
      <div class="app-content column q-pr-md">
        <div class="text-h5 q-my-sm">Description</div>
        <q-markdown
          no-heading-anchor-links
          no-html
          no-image
          no-link
          no-linkify
          no-typographer
          :src="props.app.currentVersion.description"
        ></q-markdown>
        <div class="text-h5 q-my-sm">Changelog</div>
        <q-markdown
          no-heading-anchor-links
          no-html
          no-image
          no-link
          no-linkify
          no-typographer
          :src="props.app.currentVersion.changelog"
        ></q-markdown>
        <div class="text-h6 q-my-sm">Developer</div>
        <p>
          <a class="text-grey-7" :href="props.app.currentVersion.links.manifestUri" style="text-decoration: none;">
            <q-icon name="mdi-github" color="grey-7" size="20px"/>
            <span class="q-ml-xs" style="text-decoration: underline;">Manifest</span>
          </a>
          <br />
          <a class="text-grey-7" :href="props.app.currentVersion.links.sourceCode.uri" style="text-decoration: none;">
            <q-icon name="mdi-github" color="grey-7" size="20px"/>
            <span class="q-ml-xs" style="text-decoration: underline;">Repository</span>
          </a>
        </p>
      </div>
      <q-btn
        no-caps
        outline
        color="negative"
        icon="mdi-alert-circle-outline"
        label="Report app"
        class="q-mt-lg"
        @click="flags.reportDialog = true"
      />

      <q-dialog v-model="flags.noFreeSpaceDialog">
        <q-card class="dialog">
          <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

          <q-card-section class="q-pa-none q-ma-md" align="center">
            <q-icon name="svguse:common-icons.svg#fw-conflict-icon" size="64px" />
            <div class="text-h6 q-my-sm">No Free Space</div>
            <p>There is no empty space to install this application.<br />Use archive to delete needless files.</p>
          </q-card-section>

          <q-card-section class="q-pt-none" align="center">
            <q-btn
              outline
              color="primary"
              label="Open Archive"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.deleteConfirmationDialog">
        <q-card class="dialog" style="min-width: 300px;">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Delete this app?</div>
          </q-card-section>

          <q-card-section class="q-pt-none q-my-md text-center">
            <div class="flex no-wrap items-center">
              <div class="app-icon q-mr-md">
                <q-img :src="props.app.currentVersion.iconUri" width="50px" style="image-rendering: pixelated;"/>
              </div>
              <div class="column items-start">
                <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ props.app.currentVersion.name }}</div>
                <div class="text-grey-7"><b>v{{ props.app.currentVersion.version }}</b></div>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="q-pt-none" align="right">
            <q-btn
              flat
              text-color="dark"
              class="q-mr-md"
              label="Cancel"
              v-close-popup
            ></q-btn>
            <q-btn
              outline
              color="negative"
              label="Delete"
              v-close-popup
              @click="handleAction('delete')"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.reportDialog">
        <q-card class="dialog" style="min-width: 300px;">
          <q-card-section class="q-pb-none">
            <div class="text-h6">Report app</div>
          </q-card-section>

          <q-card-section>
            <q-select v-model="report.type" :options="[ 'bug', 'report' ]" label="What do you want to sumbit?" />
          </q-card-section>

          <q-card-section v-if="report.type === 'bug'">
            Sorry, we don't provide support for third-party apps.<br />
            You can file an issue on Github or contact the app developer.
          </q-card-section>
          <q-card-section v-if="report.type === 'report'">
            <q-input
              v-model="report.description"
              placeholder="Describe your problem"
              autogrow
            />
            <div v-if="flags.reportSubmitted" class="text-positive q-mt-md">We received your report. Thank you for the feedback!</div>
          </q-card-section>

          <q-card-section align="right">
            <q-btn
              flat
              text-color="dark"
              class="q-mr-md"
              label="Cancel"
              v-close-popup
            ></q-btn>
            <q-btn
              v-if="!report.type || report.type === 'report'"
              outline
              color="primary"
              label="Send"
              :disabled="flags.reportSubmitted || !report.description"
              @click="sendReport"
            ></q-btn>
            <q-btn
              v-if="report.type === 'bug'"
              outline
              color="primary"
              label="View on Github"
              v-close-popup
              :href="props.app.currentVersion.links.manifestUri"
            ></q-btn>
          </q-card-section>
        </q-card>
      </q-dialog>
    </template>
  </q-page>
</template>

<script setup>
import { onUpdated, defineProps, defineEmits, ref, computed, watch } from 'vue'
import { bytesToSize, submitAppReport } from '../util/util'

const props = defineProps({
  categories: Array,
  app: Object,
  flipper: Object,
  connected: Boolean,
  rpcActive: Boolean,
  sdk: Object,
  action: Object,
  progress: Number
})

const emit = defineEmits(['action', 'showDialog'])

const loading = ref(true)
const flags = ref({
  noFreeSpaceDialog: false,
  deleteConfirmationDialog: false,
  reportDialog: false,
  reportSubmitted: false
})
const category = ref({})
const screenshotWidth = 256 + 4 + 8 + 8
const position = ref(0)
const scrollAreaRef = ref(null)
const currentStatusHint = ref(null)
const statusHints = ref({
  READY: {
    text: 'Runs on latest firmware release',
    icon: 'mdi-check-circle-outline',
    color: 'light-green-2'
  },
  BUILD_RUNNING: {
    text: 'App is rebuilding',
    icon: 'mdi-alert-circle-outline',
    color: 'yellow-2',
    tooltip: 'This may take some time, come back later'
  },
  FLIPPER_OUTDATED: {
    text: 'Flipper firmware is outdated',
    icon: 'mdi-alert-circle-outline',
    color: 'deep-orange-2',
    dialog: 'outdatedFirmwareDialog'
  },
  UNSUPPORTED_APPLICATION: {
    text: 'Outdated app',
    icon: 'mdi-alert-circle-outline',
    color: 'deep-orange-2',
    dialog: 'outdatedAppDialog'
  },
  UNSUPPORTED_SDK: {
    text: 'Unsupported SDK',
    icon: 'mdi-alert-circle-outline',
    color: 'deep-orange-2',
    dialog: 'outdatedFirmwareDialog'
  }
})
const report = ref({
  type: '',
  description: ''
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

watch(() => props.app, () => {
  start()
}, {
  deep: true
})

const setCategory = () => {
  category.value = props.categories.find(category => category.id === props.app.categoryId)
}

const animateScroll = (direction) => {
  const carousel = document.querySelector('#carousel')
  const width = carousel.clientWidth - 2 * 32
  if (direction === 'forward') {
    position.value = position.value + screenshotWidth
    if (position.value > width) {
      position.value = width + screenshotWidth
    }
  } else if (direction === 'backward') {
    if (position.value > width) {
      position.value = Math.round((width + screenshotWidth) / screenshotWidth) * screenshotWidth
    }
    position.value = position.value - screenshotWidth
    if (position.value < 0) {
      position.value = 0
    }
  }
  scrollAreaRef.value.setScrollPosition('horizontal', position.value, 300)
}

const handleAction = (value) => {
  let actionType
  if (value === 'Installed') {
    actionType = ''
  } else {
    actionType = value.toLowerCase()
  }
  emit('action', props.app, actionType)
}

const sendReport = async () => {
  await submitAppReport(props.app.id, { description: report.value.description, description_type: report.value.type })
  flags.value.reportSubmitted = true
}

const start = () => {
  loading.value = false
  const status = props.app.currentVersion.status
  if (props.connected && status === 'READY') {
    currentStatusHint.value = null
  } else {
    currentStatusHint.value = status
  }
  setCategory()
}

// mounted () {
//   start()
// }

onUpdated(() => {
  if (!loading.value) {
    start()
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

// Dialogs
.dialog-close-btn
  position: absolute
  top: 0.5rem
  right: 0.5rem
</style>
