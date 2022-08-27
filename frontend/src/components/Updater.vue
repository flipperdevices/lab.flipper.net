<template>
  <div class="updater column flex-center text-center">
    <template v-if="!flags.updateInProgress">
      <template v-if="flags.ableToUpdate && info.storage_sdcard_present">
        <template v-if="flags.outdated !== undefined">
          <p v-if="flags.outdated">Your firmware is out of date, newest release is {{ channels.release.version }}.</p>
          <p v-else-if="flags.aheadOfRelease">Your firmware is ahead of current release.</p>
          <p v-else-if="info.firmware_version !== 'unknown'">Your firmware is up to date.</p>
        </template>
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
            @click="update(false)"
            color="positive"
            padding="12px 30px"
            :class="!$q.screen.xs ? 'q-ml-lg' : 'q-mt-sm'"
          >Install</q-btn>
        </div>
        <q-btn
          v-if="installFromFile && flags.uploadEnabled"
          @click="flags.uploadPopup = true; uploadedFile = null"
          class="q-mt-lg"
          flat
        >Install from file</q-btn>
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
    <q-dialog v-model="flags.uploadPopup">
      <q-card>
        <q-card-section class="q-pt-none">
          <q-file
            outlined
            v-model="uploadedFile"
            label="Drop or select files"
            class="q-pt-md"
            :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
          >
            <template v-slot:prepend>
              <q-icon name="file_upload"></q-icon>
            </template>
          </q-file>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            label="Upload"
            v-close-popup
            @click="update(true)"
          ></q-btn>
          <q-btn
            flat
            label="Cancel"
            color="negative"
            v-close-popup
          ></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { fetchChannels, fetchFirmware, fetchRegions, unpack } from '../util/util'
import ProgressBar from './ProgressBar.vue'
import semver from 'semver'
import asyncSleep from 'simple-async-sleep'
import { PB } from '../flipper/protobuf/proto-compiled'

export default defineComponent({
  name: 'Updater',

  components: {
    ProgressBar
  },

  props: {
    flipper: Object,
    rpcActive: Boolean,
    info: Object,
    installFromFile: Boolean
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
        updateError: false,
        uploadEnabled: true,
        uploadPopup: false,
        overrideDevRegion: false
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
      }),
      uploadedFile: ref(null)
    }
  },

  watch: {
    async fwModel (newModel, oldModel) {
      localStorage.setItem('selectedFwChannel', newModel.value)
    }
  },

  methods: {
    async update (fromFile) {
      this.flags.updateInProgress = true
      this.$emit('update', 'start')
      this.$emit('log', {
        level: 'info',
        message: 'Updater: Update started'
      })
      if (fromFile) {
        if (!this.uploadedFile) {
          this.flags.updateError = true
          this.$emit('update', 'end')
          this.updateStage = 'No file selected'
          throw new Error('No file selected')
        } else if (!this.uploadedFile.name.endsWith('.tgz')) {
          this.flags.updateError = true
          this.$emit('update', 'end')
          this.updateStage = 'Wrong file format'
          throw new Error('Wrong file format')
        }
        this.$emit('log', {
          level: 'info',
          message: 'Updater: Uploading firmware from file'
        })
      }
      await this.loadFirmware(fromFile)
        .catch(error => {
          this.flags.updateError = true
          this.updateStage = error
          this.$emit('showNotif', {
            message: error.toString(),
            color: 'negative'
          })
          this.$emit('log', {
            level: 'error',
            message: 'Updater: ' + error.toString()
          })
          throw error
        })
      this.flags.updateInProgress = false
    },

    async loadFirmware (fromFile) {
      this.updateStage = 'Loading firmware bundle...'
      if (this.info.hardware_region !== '0' || this.flags.overrideDevRegion) {
        const regions = await fetchRegions()
          .catch(error => {
            this.$emit('showNotif', {
              message: 'Failed to fetch regions: ' + error.toString(),
              color: 'negative'
            })
            this.$emit('log', {
              level: 'error',
              message: 'Updater: Failed to fetch regions: ' + error.toString()
            })
            throw error
          })

        let bands
        if (regions.countries[regions.country]) {
          bands = regions.countries[regions.country].map(e => regions.bands[e])
        } else {
          bands = regions.default.map(e => regions.bands[e])
          regions.country = 'JP'
        }
        const options = {
          countryCode: regions.country,
          bands: []
        }

        for (const band of bands) {
          const bandOptions = {
            start: band.start,
            end: band.end,
            powerLimit: band.max_power,
            dutyCycle: band.duty_cycle
          }
          const message = PB.Region.Band.create(bandOptions)
          options.bands.push(message)
        }

        this.$emit('log', {
          level: 'debug',
          message: 'Updater: Region provisioning message: ' + JSON.stringify(options)
        })

        options.countryCode = new TextEncoder().encode(regions.country)
        const message = PB.Region.create(options)
        const encoded = new Uint8Array(PB.Region.encodeDelimited(message).finish()).slice(1)

        await this.flipper.commands.storage.write('/int/.region_data', encoded)
          .catch(error => this.rpcErrorHandler(error, 'storage.write'))

        this.$emit('log', {
          level: 'info',
          message: 'Updater: Set Sub-GHz region: ' + regions.country
        })
      }

      if (fromFile || (this.channels[this.fwModel.value] && this.channels[this.fwModel.value].url)) {
        let files
        if (!fromFile) {
          files = await fetchFirmware(this.channels[this.fwModel.value].url)
            .catch(error => {
              this.flags.updateError = true
              this.updateStage = error
              this.$emit('showNotif', {
                message: 'Failed to fetch firmware: ' + error.toString(),
                color: 'negative'
              })
              this.$emit('log', {
                level: 'error',
                message: 'Updater: Failed to fetch firmware: ' + error.toString()
              })
              throw error
            })
            .finally(() => {
              this.$emit('log', {
                level: 'debug',
                message: 'Updater: Downloaded firmware from ' + this.channels[this.fwModel.value].url
              })
            })
        } else {
          const buffer = await this.uploadedFile.arrayBuffer()
          files = await unpack(buffer)
            .finally(() => {
              this.$emit('log', {
                level: 'debug',
                message: 'Updater: Unpacked firmware'
              })
            })
        }

        this.updateStage = 'Loading firmware files'
        this.$emit('log', {
          level: 'info',
          message: 'Updater: Loading firmware files'
        })

        let path = '/ext/update/'
        await this.flipper.commands.storage.stat('/ext/update')
          .catch(async error => {
            if (error.toString() !== 'ERROR_STORAGE_NOT_EXIST') {
              this.rpcErrorHandler(error, 'storage.stat')
            } else {
              await this.flipper.commands.storage.mkdir('/ext/update')
                .catch(error => this.rpcErrorHandler(error, 'storage.mkdir'))
                .finally(() => {
                  this.$emit('log', {
                    level: 'debug',
                    message: 'Updater: storage.mkdir: /ext/update'
                  })
                })
            }
          })

        for (const file of files) {
          if (file.size === 0) {
            path = '/ext/update/' + file.name
            if (file.name.endsWith('/')) {
              path = path.slice(0, -1)
            }
            await this.flipper.commands.storage.mkdir(path)
              .catch(error => this.rpcErrorHandler(error, 'storage.mkdir'))
              .finally(() => {
                this.$emit('log', {
                  level: 'debug',
                  message: 'Updater: storage.mkdir: ' + path
                })
              })
          } else {
            this.write.filename = file.name.slice(file.name.lastIndexOf('/') + 1)
            const unbind = this.flipper.emitter.on('storageWriteRequest/progress', e => {
              this.write.progress = e.progress / e.total
            })
            await this.flipper.commands.storage.write('/ext/update/' + file.name, file.buffer)
              .catch(error => this.rpcErrorHandler(error, 'storage.write'))
              .finally(() => {
                this.$emit('log', {
                  level: 'debug',
                  message: 'Updater: storage.write: /ext/update/' + file.name
                })
              })
            unbind()
          }
          await asyncSleep(300)
        }
        this.write.filename = ''
        this.write.progress = 0

        this.updateStage = 'Loading manifest...'
        this.$emit('log', {
          level: 'info',
          message: 'Updater: Loading update manifest'
        })

        await this.flipper.commands.system.update(path + '/update.fuf')
          .catch(error => this.rpcErrorHandler(error, 'system.update'))
          .finally(() => {
            this.$emit('log', {
              level: 'debug',
              message: 'Updater: system.update: OK'
            })
          })

        this.updateStage = 'Update in progress, pay attention to your Flipper'
        this.$emit('log', {
          level: 'info',
          message: 'Updater: Rebooting Flipper'
        })

        await this.flipper.commands.system.reboot(2)
          .catch(error => this.rpcErrorHandler(error, 'system.reboot'))
      } else {
        this.flags.updateError = true
        this.updateStage = 'Failed to fetch channel'
        this.$emit('showNotif', {
          message: 'Unable to load firmware channel from the build server. Reload the page and try again.',
          color: 'negative',
          reloadBtn: true
        })
        this.$emit('log', {
          level: 'error',
          message: 'Updater: Failed to fetch channel'
        })
      }
    },

    compareVersions () {
      if (semver.lt((this.info.protobuf_version_major + '.' + this.info.protobuf_version_minor) + '.0', '0.6.0')) {
        this.flags.ableToUpdate = false
      }
      if (this.info.firmware_version) {
        if (this.info.firmware_version !== 'unknown' && semver.valid(this.info.firmware_version)) {
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
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.$emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.$emit('log', {
        level: 'error',
        message: `Updater: RPC error in command '${command}': ${error}`
      })
    }
  },

  async mounted () {
    this.channels = await fetchChannels(this.info.hardware_target)
      .catch(error => {
        this.$emit('showNotif', {
          message: 'Unable to load firmware channels from the build server. Reload the page and try again.',
          color: 'negative',
          reloadBtn: true
        })
        this.$emit('log', {
          level: 'error',
          message: 'Updater: failed to fetch channels'
        })
        throw error
      })
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

    if (new URLSearchParams(location.search).get('overrideDevRegion') === 'true') {
      this.flags.overrideDevRegion = true
    }
  }
})
</script>
