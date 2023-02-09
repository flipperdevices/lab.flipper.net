<template>
  <div class="column full-width items-end">
    <div style="width: 140px">
      <q-btn
        flat
        dense
        color="white"
        style="margin-left: 5px; padding: 0; border-radius: 5px; font-size: 16px; line-height: 16px;"
        label="Update all"
        class="fit no-shadow text-pixelated bg-positive"
      >
        <div class="install-all-badge">{{ outdatedApps.length }}</div>
      </q-btn>
    </div>
    <div class="column full-width">
      <div
        v-for="app in outdatedApps"
        :key="app.name"
        class="flex no-wrap items-center q-my-md"
      >
        <div class="flex no-wrap items-center cursor-pointer" @click="$emit('openApp', app)">
          <div class="app-icon q-mr-md">
            <q-img :src="app.icon"/>
          </div>
          <div class="col-10">
            <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.name }}</div>
            <div class="text-grey-7">{{ app.description.split('\n')[0] }}</div>
          </div>
        </div>

        <q-space />

        <div class="column items-end q-ml-md">
          <span class="text-grey-7">Version:</span>
          <b>{{ app.installedVersion }}</b>
        </div>
        <div class="q-ml-md" style="width: 80px;">
          <q-btn
            flat
            dense
            color="white"
            style="margin-left: 5px; padding: 0; border-radius: 5px; font-size: 16px; line-height: 16px;"
            label="Update"
            class="fit no-shadow text-pixelated bg-positive"
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

      <q-separator class="q-my-lg" />

      <div
        v-for="app in upToDateApps"
        :key="app.name"
        class="flex no-wrap items-center q-my-md"
      >
        <div class="flex no-wrap items-center cursor-pointer" @click="$emit('openApp', app)">
          <div class="app-icon q-mr-md">
            <q-img :src="app.icon"/>
          </div>
          <div class="col-10">
            <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ app.name }}</div>
            <div class="text-grey-7">{{ app.description.split('\n')[0] }}</div>
          </div>
        </div>

        <q-space />

        <div class="column items-end q-ml-md">
          <span class="text-grey-7">Version:</span>
          <b>{{ app.version }}</b>
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
      <q-card class="dialog">
        <q-card-section class="q-pb-none">
          <div class="text-h6">Delete this app?</div>
        </q-card-section>

        <q-card-section class="q-pt-none q-my-md text-center">
          <div class="flex no-wrap items-center">
            <div class="app-icon q-mr-md">
              <q-img :src="appToDelete.icon"/>
            </div>
            <div class="column items-start">
              <div class="text-h6" style="line-height: 1.5em; margin-bottom: 0.25rem;">{{ appToDelete.name }}</div>
              <div class="text-grey-7"><b>v{{ appToDelete.version }}</b></div>
            </div>
          </div>
        </q-card-section>

        <q-card-section class="q-pt-none flex justify-between">
          <q-btn
            unelevated
            color="grey-4"
            text-color="dark"
            label="Cancel"
            v-close-popup
          ></q-btn>
          <q-btn
            outline
            color="negative"
            label="Delete"
            v-close-popup
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
    flipper: Object
  },

  setup () {
    return {
      flags: ref({
        deleteConfirmationDialog: false
      }),
      appToDelete: ref(null)
    }
  },

  computed: {
    outdatedApps () {
      return this.apps.filter(e => e.isInstalled === true && e.installedVersion && semver.lt(e.installedVersion, e.version))
    },

    upToDateApps () {
      return this.apps.filter(e => e.isInstalled === true && (!e.installedVersion || !semver.lt(e.installedVersion, e.version)))
    }
  },

  methods: {
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
