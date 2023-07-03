<template>
  <div class="column full-width items-end">
    <div v-if="outdatedApps.length" style="width: 140px">
      <template v-if="batch.totalCount">
        <q-linear-progress
          :value="batch.doneCount / batch.totalCount + action.progress / batch.totalCount"
          size="32px"
          :color="actionColors.bar"
          :track-color="actionColors.track"
          style="border-radius: 5px;"
        >
          <div class="absolute-full flex flex-center" style="border: 2px solid; border-radius: 5px;">
            <div
              class="app-progress-label"
              style="font-size: 28px;"
            >{{ `${batch.doneCount} / ${batch.totalCount}` }}</div>
          </div>
        </q-linear-progress>
      </template>
      <q-btn
        v-else
        flat
        dense
        color="white"
        style="margin-left: 5px; padding: 0; border-radius: 5px; font-size: 16px; line-height: 16px;"
        label="Update all"
        class="fit no-shadow text-pixelated bg-positive"
        @click="this.$emit('batchUpdate', outdatedApps);"
      >
        <div class="install-all-badge">{{ outdatedApps.length }}</div>
      </q-btn>
    </div>

    <div v-if="batch.failed.length" class="text-negative">
      Update failed for
      <span v-for="app, index in batch.failed" :key="app.id">"{{ app.currentVersion.name }}"<span v-if="batch.failed[index + 1]">, </span></span>
    </div>

    <div class="column full-width" :class="batch.totalCount ? 'disabled' : ''">
      <div
        v-for="app in outdatedApps"
        :key="app.currentVersion.name"
        class="flex no-wrap items-center q-my-md"
        :class="action.type === 'delete' && action.id === app.id ? 'disabled' : ''"
      >
        <div class="flex no-wrap items-center cursor-pointer" @click="appClicked(app)">
          <div class="app-icon q-mr-md">
            <q-img :src="app.currentVersion.iconUri" style="image-rendering: pixelated;"/>
          </div>
          <div class="col-10">
            <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.currentVersion.name }}</div>
            <div class="text-grey-7">{{ app.currentVersion.shortDescription }}</div>
          </div>
        </div>

        <q-space />

        <div class="column items-end q-ml-md">
          <span class="text-grey-7">Version:</span>
          <b>{{ app.installedVersion.version }}</b>
        </div>
        <div class="q-ml-md" style="width: 80px;">
          <template v-if="action.type && action.id === app.id">
            <q-linear-progress
              :value="action.progress"
              size="32px"
              :color="actionColors.bar"
              :track-color="actionColors.track"
              style="width: 80px; border-radius: 5px;"
              class="q-ml-xs"
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
            label="Update"
            class="fit no-shadow text-pixelated bg-positive"
            @click="handleAction(app, 'update')"
          />
        </div>
        <q-btn
          flat
          round
          dense
          color="negative"
          icon="svguse:common-icons.svg#delete"
          class="q-ml-md"
          @click="appToDelete = app; flags.deleteConfirmationDialog = true"
        />
      </div>

      <q-separator v-if="outdatedApps.length && upToDateApps.length" class="q-my-lg" />

      <div
        v-for="app in upToDateApps"
        :key="app.currentVersion.name"
        class="flex no-wrap items-center q-my-md"
        :class="action.type === 'delete' && action.id === app.id ? 'disabled' : ''"
      >
        <div class="flex no-wrap items-center cursor-pointer" @click="appClicked(app)">
          <div class="app-icon q-mr-md">
            <q-img :src="app.currentVersion.iconUri" style="image-rendering: pixelated; width: 38px"/>
          </div>
          <div class="col-10">
            <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.currentVersion.name }}</div>
            <div class="text-grey-7">{{ app.currentVersion.shortDescription }}</div>
          </div>
        </div>

        <q-space />

        <div class="column items-end q-ml-md">
          <span class="text-grey-7">Version:</span>
          <b>{{ app.currentVersion.version }}</b>
        </div>
        <div class="q-ml-md" style="width: 80px;">
          <q-btn
            flat
            dense
            color="white"
            style="margin-left: 5px; padding: 0; border-radius: 5px; font-size: 16px; line-height: 16px;"
            label="Installed"
            class="fit no-shadow text-pixelated bg-grey-6"
          />
        </div>
        <q-btn
          flat
          round
          dense
          color="negative"
          icon="svguse:common-icons.svg#delete"
          class="q-ml-md"
          @click="appToDelete = app; flags.deleteConfirmationDialog = true"
        />
      </div>
    </div>

    <q-dialog v-model="flags.deleteConfirmationDialog">
      <q-card class="dialog" style="min-width: 300px;">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Delete this app?</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-my-md text-center">
          <div class="flex no-wrap items-center">
            <div class="app-icon q-mr-md">
              <q-img :src="appToDelete.currentVersion.iconUri" style="image-rendering: pixelated;"/>
            </div>
            <div class="column items-start">
              <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ appToDelete.currentVersion.name }}</div>
              <div class="text-grey-7"><b>v{{ appToDelete.currentVersion.version }}</b></div>
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
            @click="handleAction(appToDelete, 'delete')"
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import semver from 'semver'

export default defineComponent({
  name: 'InstalledApps',
  props: {
    apps: Array,
    flipper: Object,
    info: Object,
    flipperReady: Boolean,
    action: Object,
    batch: Object
  },

  setup () {
    return {
      flags: ref({
        deleteConfirmationDialog: false
      }),
      appToDelete: ref(null),
      actionType: ref('')
    }
  },

  computed: {
    outdatedApps () {
      return this.apps.filter(e => {
        if (e.isInstalled === true && e.installedVersion) {
          if (this.flipperReady && (e.installedVersion.versionBuildApi !== `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`)) {
            return true
          }
          const iv = e.installedVersion.version + '.0'
          const cv = e.currentVersion.version + '.0'
          if (semver.lt(iv, cv)) {
            return true
          } else if (semver.eq(iv, cv) && e.installedVersion.versionId !== e.currentVersion.id) {
            return true
          }
        }
        return false
      })
    },

    upToDateApps () {
      return this.apps.filter(e => {
        if (e.isInstalled === true && e.installedVersion) {
          if (this.flipperReady && (e.installedVersion.versionBuildApi !== `${this.info.firmware.api.major}.${this.info.firmware.api.minor}`)) {
            return false
          }
          const iv = e.installedVersion.version + '.0'
          const cv = e.currentVersion.version + '.0'
          if (!semver.lt(iv, cv)) {
            return true
          } else if (semver.gte(iv, cv) && e.installedVersion.versionId === e.currentVersion.id) {
            return true
          }
        }
        return false
      })
    },

    actionColors () {
      switch (this.action.type) {
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
    }
  },

  methods: {
    appClicked (app) {
      if (this.action.type) {
        return
      }
      this.$emit('openApp', app)
    },

    handleAction (app, value) {
      if (value === 'Installed') {
        this.actionType = ''
      } else {
        this.actionType = value.toLowerCase()
      }
      this.$emit('action', app, this.actionType)
    }
  }
})
</script>

<style lang="sass" scoped>
.app-icon
  width: 60px
  height: 60px
  padding: 10px
  border: 1px solid #dbdbdb
  border-radius: 10px

.install-all-badge
  position: relative
  top: -1px
  margin-left: 10px
  padding: 3px 4px 1px 4px
  font-size: 15px
  line-height: 13px
  background: #ffffffb3
  color: $positive
  border-radius: 3px
</style>
