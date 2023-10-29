<template>
  <q-page class="column full-width">
    <template v-if="!props.installedApps.length">
      <div class="column items-center">
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Loading installed app...</p>
      </div>
    </template>
    <template v-else>
      <div v-if="updatableApps.length" style="width: 140px">
        <template v-if="props.batch.totalCount">
          <q-linear-progress
            :value="props.batch.doneCount / props.batch.totalCount + props.action.progress / props.batch.totalCount"
            size="32px"
            :color="actionColors.bar"
            :track-color="actionColors.track"
            style="border-radius: 5px;"
          >
            <div class="absolute-full flex flex-center" style="border: 2px solid; border-radius: 5px;">
              <div
                class="app-progress-label"
                style="font-size: 28px;"
              >{{ `${props.batch.doneCount} / ${props.batch.totalCount}` }}</div>
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
          @click="emit('batchUpdate', updatableApps);"
        >
          <div class="install-all-badge">{{ updatableApps.length }}</div>
        </q-btn>
      </div>

      <div v-if="props.batch.failed.length" class="text-negative">
        Update failed for
        <span v-for="app, index in props.batch.failed" :key="app.id">"{{ app.currentVersion.name }}"<span v-if="props.batch.failed[index + 1]">, </span></span>
      </div>

      <div class="column full-width" :class="props.batch.totalCount ? 'disabled' : ''">
        <div
          v-for="app in updatableApps"
          :key="app.currentVersion.name"
          class="flex no-wrap items-center q-my-md"
          :class="props.action.type === 'delete' && props.action.id === app.id ? 'disabled' : ''"
        >
          <div class="flex no-wrap items-center cursor-pointer" @click="appClicked(app)">
            <div class="app-icon q-mr-md">
              <q-img :src="app.currentVersion.iconUri" style="image-rendering: pixelated; width: 38px"/>
            </div>
            <div class="col-10">
              <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.currentVersion.name }}</div>
              <div class="text-grey-7" style="margin-right: 80px;">{{ app.currentVersion.shortDescription }}</div>
            </div>
          </div>

          <q-space />

          <div class="column items-end q-ml-md">
            <span class="text-grey-7">Version:</span>
            <b>{{ app.installedVersion.version }}</b>
          </div>
          <div class="q-ml-md" style="width: 80px;">
            <template v-if="props.action.type && props.action.id === app.id">
              <q-linear-progress
                :value="props.action.progress"
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
                  >{{ `${props.action.progress * 100}%` }}</div>
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

        <q-separator v-if="updatableApps.length && upToDateApps.length" class="q-my-lg" />

        <div
          v-for="app in upToDateApps"
          :key="app.currentVersion.name"
          class="flex no-wrap items-center q-my-md"
          :class="props.action.type === 'delete' && props.action.id === app.id ? 'disabled' : ''"
        >
          <div class="flex no-wrap items-center cursor-pointer" @click="appClicked(app)">
            <div class="app-icon q-mr-md">
              <q-img :src="app.currentVersion.iconUri" style="image-rendering: pixelated; width: 38px"/>
            </div>
            <div class="col-10">
              <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.currentVersion.name }}</div>
              <div class="text-grey-7" style="margin-right: 80px;">{{ app.currentVersion.shortDescription }}</div>
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

        <div
          v-for="app in unsupportedApps"
          :key="app.name"
          class="flex no-wrap items-center q-my-md"
          :class="props.action.type === 'delete' && props.action.id === app.id ? 'disabled' : ''"
        >
          <div class="flex no-wrap items-center cursor-pointer" @click="$router.push(`/apps/${app.id}`)">
            <div class="app-icon q-mr-md">
              <q-img :src="`data:image/png;base64,${app.icon}`" style="image-rendering: pixelated; width: 38px"/>
            </div>
            <div class="col-10">
              <div class="flex flex-center">
                <div class="text-h6 q-mr-sm" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.name }}</div>
                <q-chip color="deep-orange-2" icon="mdi-alert-circle-outline" label="Outdated app" size="12px" dense class="q-px-sm"/>
              </div>
              <div class="text-grey-7">{{ app.installedVersion.shortDescription }}</div>
            </div>
          </div>

          <q-space />

          <div class="column items-end q-ml-md">
            <span v-if="app.installedVersion.version" class="text-grey-7">Version:</span>
            <b>{{ app.installedVersion.version }}</b>
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
                <template v-if="appToDelete.currentVersion">
                  <q-img :src="appToDelete.currentVersion.iconUri" style="image-rendering: pixelated; width: 38px"/>
                </template>
                <template v-else>
                  <q-img :src="`data:image/png;base64,${appToDelete.icon}`" style="image-rendering: pixelated; width: 38px"/>
                </template>
              </div>
              <div class="column items-start">
                <template v-if="appToDelete.currentVersion">
                  <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ appToDelete.currentVersion.name }}</div>
                  <div class="text-grey-7"><b>v{{ appToDelete.currentVersion.version }}</b></div>
                </template>
                <template v-else>
                  <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ appToDelete.name }}</div>
                  <div class="text-grey-7"><b>v{{ appToDelete.installedVersion.version }}</b></div>
                </template>
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
    </template>
  </q-page>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
// import semver from 'semver'

const props = defineProps({
  apps: Array,
  flipper: Object,
  installedApps: Array,
  sdk: Object,
  action: Object,
  batch: Object
})

const emit = defineEmits(['openApp', 'action', 'batchUpdate'])

const flags = ref({
  deleteConfirmationDialog: false
})
const appToDelete = ref(null)
const actionType = ref('')

const updatableApps = computed(() => {
  return props.apps.filter(app => {
    if (app.isInstalled === true && app.installedVersion && app.currentVersion.status === 'READY') {
      if (props.sdk.api && app.installedVersion.api !== props.sdk.api) {
        return true
      }
      if (app.installedVersion.isOutdated) {
        return true
      }
    }
    return false
  })
})

const upToDateApps = computed(() => {
  return props.apps.filter(app => {
    if (app.isInstalled === true && app.installedVersion) {
      if (props.sdk.api && app.installedVersion.api !== props.sdk.api) {
        return false
      }
      if (!app.installedVersion.isOutdated && app.currentVersion.status === 'READY') {
        return true
      }
    }
    return false
  })
})

const unsupportedApps = computed(() => {
  return props.installedApps.filter(installedApp => {
    if (!props.apps.find(app => app.id === installedApp.id)) {
      return true
    }
    return false
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
