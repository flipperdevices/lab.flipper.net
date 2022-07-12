<template>
  <div class="updater column flex-center text-center">
    <template v-if="!flags.updateInProgress">
      <template v-if="flags.ableToUpdate && info.storage_sdcard_present">
        <p v-if="flags.outdated">Your firmware is out of date, newest release is {{ channels.release.version }}.</p>
        <p v-else-if="flags.aheadOfRelease">Your firmware is ahead of current release.</p>
        <p v-else-if="info.firmware_version !== 'unknown'">Your firmware is up to date.</p>
        <p v-if="channels.custom">
          Detected custom firmware <b>"{{ channels.custom.channel }}"</b>
          <span v-if="!this.channels.custom.url.endsWith('tgz')"> with <b>unsupported</b> filetype</span>
        </p>
        <div class="flex q-mt-sm">
          <q-select
            v-model="fwModel"
            :options="fwOptions"
            label="Choose firmware"
            :suffix="fwOptions.find(({label}) => label === fwModel.label) ? fwOptions.find(({label}) => label === fwModel.label).version : ''"
            id="fw-select"
            :style="!$q.screen.xs ? 'width: 320px;' : 'width: 290px;'"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section class="items-start">
                  <q-item-label v-html="scope.opt.label" />
                </q-item-section>
                <q-item-section class="items-end">
                  <q-item-label v-html="scope.opt.version" :class="'fw-option-label ' + scope.opt.value"/>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-btn
            v-if="fwModel"
            @click="update"
            color="positive"
            padding="12px 30px"
            :class="!$q.screen.xs ? 'q-ml-lg' : 'q-mt-sm'"
          >Install</q-btn>
        </div>
      </template>
      <template v-else>
        <span v-if="info.storage_sdcard_present">Your firmware doesn't support self-update. Install latest release with <a href="https://update.flipperzero.one">qFlipper desktop tool</a>.</span>
        <span v-else>Self-update is impossible without an SD card.</span>
      </template>
    </template>
    <template v-else>
      <p>{{ updateStage }}</p>
      <q-btn
        v-if="flags.updateError"
        outline
        class="q-mt-md"
        @click="flags.updateInProgress = false; flags.updateError = false"
      >Cancel</q-btn>
      <ProgressBar
        v-if="write.filename.length > 0"
        :title="write.filename"
        :progress="write.progress"
      />
    </template>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { fetchChannels, fetchFirmware } from '../util/util'
import ProgressBar from './ProgressBar.vue'
import semver from 'semver'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'Updater',

  components: {
    ProgressBar
  },

  props: {
    flipper: Object,
    rpcActive: Boolean,
    info: Object
  },

  setup () {
    return {
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        outdated: undefined,
        aheadOfRelease: false,
        ableToUpdate: true,
        updateInProgress: false,
        updateError: false
      }),
      channels: ref({}),
      fwModel: ref({
        label: 'Release', value: 'release', version: ''
      }),
      fwOptions: ref([
        {
          label: 'Release', value: 'release', version: ''
        },
        {
          label: 'Release-candidate', value: 'rc', version: ''
        },
        {
          label: 'Dev (unstable)', value: 'dev', version: ''
        }
      ]),
      updateStage: ref(''),
      write: ref({
        filename: '',
        progress: 0
      })
    }
  },

  watch: {
    async fwModel (newModel, oldModel) {
      localStorage.setItem('selectedFwChannel', newModel.value)
    }
  },

  methods: {
    async update () {
      this.flags.updateInProgress = true
      this.$emit('update', 'start')
      await this.loadFirmware()
      this.flags.updateInProgress = false
    },

    async loadFirmware () {
      this.updateStage = 'Downloading firmware...'
      if (this.channels[this.fwModel.value].url) {
        const files = await fetchFirmware(this.channels[this.fwModel.value].url)
          .catch(error => {
            this.flags.updateError = true
            this.updateStage = error
            throw error
          })
        this.updateStage = 'Loading firmware files'
        let path = '/ext/update/'
        await this.flipper.commands.storage.mkdir('/ext/update')
        for (const file of files) {
          if (file.size === 0) {
            path = '/ext/update/' + file.name
            if (file.name.endsWith('/')) {
              path = path.slice(0, -1)
            }
            await this.flipper.commands.storage.mkdir(path)
          } else {
            this.write.filename = file.name.slice(file.name.lastIndexOf('/') + 1)
            const unbind = this.flipper.emitter.on('storageWriteRequest/progress', e => {
              this.write.progress = e.progress / e.total
            })
            await this.flipper.commands.storage.write('/ext/update/' + file.name, file.buffer)
            unbind()
          }
          await asyncSleep(300)
        }
        this.write.filename = ''
        this.write.progress = 0

        this.updateStage = 'Loading manifest...'
        await this.flipper.commands.system.update(path + '/update.fuf')

        this.updateStage = 'Update in progress, pay attention to your Flipper'
        await this.flipper.commands.system.reboot(2)
      } else {
        this.flags.updateError = true
        this.updateStage = 'No channel url'
        throw new Error('No channel url')
      }
    },

    compareVersions () {
      if (semver.lt((this.info.protobuf_version_major + '.' + this.info.protobuf_version_minor) + '.0', '0.6.0')) {
        this.flags.ableToUpdate = false
      }
      if (this.info.firmware_version) {
        if (this.info.firmware_version !== 'unknown') {
          if (semver.eq(this.info.firmware_version, this.channels.release.version)) {
            this.flags.outdated = false
          } else if (semver.gt(this.info.firmware_version, this.channels.release.version)) {
            this.flags.outdated = false
            this.flags.aheadOfRelease = true
          } else {
            this.flags.outdated = true
          }
        } else {
          this.flags.outdated = undefined
        }
      }
    }
  },

  async mounted () {
    this.channels = await fetchChannels(this.info.hardware_target)
    this.compareVersions()
    this.fwOptions[0].version = this.channels.release.version
    this.fwOptions[1].version = this.channels.rc.version
    this.fwOptions[2].version = this.channels.dev.version
    if (this.channels.custom && this.channels.custom.url.endsWith('tgz')) {
      this.fwOptions.unshift({
        label: this.channels.custom.channel || 'Custom', value: 'custom', version: this.channels.custom.version || 'unknown'
      })
    }

    const selectedBefore = this.fwOptions.find(e => e.value === localStorage.getItem('selectedFwChannel'))
    if (selectedBefore && !this.channels.custom) {
      this.fwModel = selectedBefore
    } else {
      this.fwModel = this.fwOptions[0]
    }
  }
})
</script>
