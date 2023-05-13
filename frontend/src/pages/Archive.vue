<template>
  <q-page class="column items-center q-pa-md full-width" :class="$q.screen.width > 960 && $q.screen.height > 500 ? 'q-mt-xl' : 'q-mt-xs'">
    <div
      v-if="!connected || !flags.rpcActive || flags.rpcToggling"
      class="column flex-center q-my-xl"
    >
      <q-spinner
        color="primary"
        size="3em"
        class="q-mb-md"
      ></q-spinner>
      <p>Waiting for Flipper...</p>
    </div>
    <div v-if="connected && flags.rpcActive" class="file-container">
      <div class="file-menu flex no-wrap q-pa-xs rounded-borders">
        <q-btn
          flat
          dense
          icon="arrow_back_ios_new"
          class="q-mr-xs"
          style="width: 24px;"
          :disabled="path === '/'"
          @click="itemClicked({ name: '..' })"
        ></q-btn>
        <code
          class="q-py-xs q-px-sm bg-grey-3 rounded-borders overflow-hidden-y"
        >{{ path }}</code>
        <q-space></q-space>
        <q-btn flat dense icon="mdi-plus" :disabled="path === '/'">
          <q-menu auto-close self="top middle">
            <q-list style="min-width: 100px">
              <q-item clickable @click="flags.uploadPopup = true; uploadedFiles = null">
                <q-item-section avatar>
                  <q-icon name="mdi-file-upload-outline"/>
                </q-item-section>
                <q-item-section>
                  Upload file
                </q-item-section>
              </q-item>
              <q-item clickable @click="flags.uploadFolderPopup = true; uploadedFiles = null">
                <q-item-section avatar>
                  <q-icon name="mdi-folder-upload-outline"/>
                </q-item-section>
                <q-item-section>
                  Upload folder
                </q-item-section>
              </q-item>
              <q-item clickable @click="flags.mkdirPopup = true; editorText = ''">
                <q-item-section avatar>
                  <q-icon name="mdi-folder-plus-outline"/>
                </q-item-section>
                <q-item-section>
                  Create folder
                </q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
      <q-list class="file-grid">
        <q-item
          v-for="item in dir"
          :key="item.name"
          v-bind="item"
          dense
          clickable
          style="border-radius: 3px;"
        >
          <q-item-section avatar @click="itemClicked(item)">
            <q-icon :name="itemIconSwitcher(item)"/>
          </q-item-section>

          <q-item-section @click="itemClicked(item)">
            <q-item-label>
              {{ item.name }}
            </q-item-label>
            <span v-if="path === '/' && item.name === 'int'">Flipper internal storage</span>
            <span v-if="path === '/' && item.name === 'ext'">SD card</span>
            <span v-if="item.type !== 1 && item.size" class="text-weight-light">{{ item.size }} bytes</span>
          </q-item-section>

          <q-item-section avatar>
            <q-btn v-if="path !== '/'" flat dense round icon="more_vert">
              <q-menu auto-close self="top middle">
                <q-list style="min-width: 100px">
                  <q-item v-if="item.type === 0" clickable @click="itemClicked(item)">
                    <q-item-section avatar>
                      <q-icon name="mdi-download-outline"/>
                    </q-item-section>
                    <q-item-section>
                      Download
                    </q-item-section>
                  </q-item>
                  <q-item v-if="item.name.endsWith('.sub') || item.name.endsWith('.ir')" clickable @click="openFileIn(item, 'pulse-plotter')">
                    <q-item-section avatar>
                      <q-icon name="mdi-share-outline"/>
                    </q-item-section>
                    <q-item-section>
                      Open in Pulse plotter
                    </q-item-section>
                  </q-item>
                  <q-item clickable @click="editorText = item.name; oldName = item.name; flags.renamePopup = true">
                    <q-item-section avatar>
                      <q-icon name="mdi-pencil-outline"/>
                    </q-item-section>
                    <q-item-section>
                      Rename
                    </q-item-section>
                  </q-item>
                  <q-item clickable class="text-negative" @click="flags.deletePopup = true; itemToDelete = item">
                    <q-item-section avatar>
                      <q-icon name="mdi-delete-outline"/>
                    </q-item-section>
                    <q-item-section>
                      Delete
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-menu>
            </q-btn>
          </q-item-section>
        </q-item>
        <q-item v-if="dir.length === 0 && path !== '/'" class="text-grey-7">
          <q-item-section avatar class="q-ml-xs">
            <q-icon name="mdi-folder-outline"/>
          </q-item-section>

          <q-item-section>
            <q-item-label>
              Empty folder
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
      <q-dialog v-model="flags.uploadFolderPopup">
        <q-card>
          <q-card-section class="q-pt-none">
            <q-file
              outlined
              multiple
              webkitdirectory
              v-model="uploadedFiles"
              label="Drop or select folder"
              class="q-pt-md folder-upload"
              :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
            >
              <template v-slot:prepend>
                <q-icon name="mdi-folder-upload-outline"></q-icon>
              </template>
            </q-file>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Upload"
              v-close-popup
              @click="upload"
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
      <q-dialog v-model="flags.deletePopup">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">Are you sure you want to delete <b>{{ itemToDelete.name }}</b>?</div>
            This action is permanent and can't be undone.
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Cancel"
              v-close-popup
            ></q-btn>
            <q-btn
              flat
              label="Delete"
              color="negative"
              v-close-popup
              @click="remove(path + '/' + itemToDelete.name, !!itemToDelete.type)"
            ></q-btn>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.uploadPopup">
        <q-card>
          <q-card-section class="q-pt-none">
            <q-file
              outlined
              multiple
              v-model="uploadedFiles"
              label="Drop or select files"
              class="q-pt-md"
              :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
            >
              <template v-slot:prepend>
                <q-icon name="mdi-file-upload-outline"></q-icon>
              </template>
            </q-file>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Upload"
              v-close-popup
              @click="upload"
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
      <q-dialog v-model="flags.renamePopup">
        <q-card>
          <q-card-section>
            <q-input
              v-model="editorText"
              :label="'Rename ' + oldName"
              :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
            ></q-input>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Save"
              v-close-popup
              @click="rename(path, oldName, editorText)"
            ></q-btn>
            <q-btn
              flat
              label="Cancel"
              color="negative"
              v-close-popup
              @click="editorText = ''"
            ></q-btn>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.mkdirPopup">
        <q-card>
          <q-card-section>
            <q-input
              v-model="editorText"
              label="Folder name"
              :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
            ></q-input>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn
              flat
              label="Create"
              v-close-popup
              @click="mkdir(path + '/' + editorText)"
            ></q-btn>
            <q-btn
              flat
              label="Cancel"
              color="negative"
              v-close-popup
              @click="editorText = ''"
            ></q-btn>
          </q-card-actions>
        </q-card>
      </q-dialog>
      <q-dialog v-model="flags.blockingOperationPopup" persistent>
        <q-card>
          <q-card-section>
            <div class="text-h6">File operation in progress</div>
          </q-card-section>
          <q-card-section v-if="file.name.length > 0">
            <ProgressBar
              :title="file.name"
              :progress="file.progress"
            />
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { exportFile } from 'quasar'
import ProgressBar from 'components/ProgressBar.vue'
// import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'PageArchive',

  components: {
    ProgressBar
  },

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean
  },

  setup () {
    return {
      componentName: 'Archive',

      path: ref('/'),
      dir: ref([]),
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        uploadPopup: false,
        uploadFolderPopup: false,
        renamePopup: false,
        mkdirPopup: false,
        blockingOperationPopup: false,
        deletePopup: false
      }),
      uploadedFiles: ref(null),
      editorText: ref(''),
      oldName: ref(''),
      file: ref({
        name: '',
        progress: 0
      }),
      itemToDelete: ref(null)
    }
  },

  watch: {
    async connected (newStatus, oldStatus) {
      if (newStatus) {
        await this.start()
      }
    }
  },

  methods: {
    async startRpc () {
      this.flags.rpcToggling = true
      await this.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          this.$emit('log', {
            level: 'error',
            message: `${this.componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      this.flags.rpcActive = true
      this.$emit('setRpcStatus', true)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC started`
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.setReadingMode('text', 'promptBreak')
      this.flags.rpcActive = false
      this.$emit('setRpcStatus', false)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC stopped`
      })
    },

    async list () {
      const list = await this.flipper.RPC('storageList', { path: this.path })
        .catch(error => this.rpcErrorHandler(error, 'storageList'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageList: ${this.path}`
          })
        })
      if (list.length === 0) {
        this.dir = []
        return
      }

      if (this.path === '/') {
        this.dir = list.filter(e => e.name !== 'any')
      } else {
        this.dir = list
      }
    },

    async read (path, preventDownload) {
      this.flags.blockingOperationPopup = true
      this.file.name = path.slice(path.lastIndexOf('/') + 1)
      const file = this.dir.find(e => e.name === this.file.name && !e.type)
      const total = file.size
      const unbind = this.flipper.emitter.on('storageReadRequest/progress', chunks => {
        this.file.progress = Math.min(chunks * 512, total) / total
      })

      const res = await this.flipper.RPC('storageRead', { path })
        .catch(error => this.rpcErrorHandler(error, 'storageRead'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageRead: ${path}`
          })
        })
      const s = path.split('/')
      if (!preventDownload) {
        exportFile(s[s.length - 1], res)
      }
      unbind()
      this.flags.blockingOperationPopup = false
      if (preventDownload) {
        return res
      }
    },

    async remove (path, isRecursive) {
      await this.flipper.RPC('storageRemove', { path, recursive: isRecursive })
        .catch(error => this.rpcErrorHandler(error, 'storageRemove'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageRemove: ${path}, recursive: ${isRecursive}`
          })
        })
      this.list()
    },

    async rename (path, oldName, newName) {
      await this.flipper.RPC('storageRename', { oldPath: path + '/' + oldName, newPath: path + '/' + newName })
        .catch(error => this.rpcErrorHandler(error, 'storageRename'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageRename: ${path}, old name: ${oldName}, new name: ${newName}`
          })
        })
      this.list()
    },

    async mkdir (path) {
      await this.flipper.RPC('storageMkdir', { path })
        .catch(error => this.rpcErrorHandler(error, 'storageMkdir'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: `${this.componentName}: storageMkdir: ${path}`
          })
        })
      this.list()
    },

    async upload () {
      if (!this.uploadedFiles || this.uploadedFiles.length === 0) {
        return
      }
      this.flags.blockingOperationPopup = true
      for (const file of this.uploadedFiles) {
        this.file.name = file.name
        let dir = this.path

        if (file.webkitRelativePath?.length > 0) {
          const path = file.webkitRelativePath.split('/')
          path.pop()
          while (path.length > 0) {
            dir += '/' + path.shift()
            const stat = await this.flipper.RPC('storageStat', { path: dir })
            if (!stat) {
              await this.flipper.RPC('storageMkdir', { path: dir })
            }
          }
        }

        const unbind = this.flipper.emitter.on('storageWriteRequest/progress', e => {
          this.file.progress = e.progress / e.total
        })

        await this.flipper.RPC('storageWrite', { path: dir + '/' + file.name, buffer: await file.arrayBuffer() })
          .catch(error => this.rpcErrorHandler(error, 'storageWrite'))
          .finally(() => {
            this.$emit('log', {
              level: 'debug',
              message: `${this.componentName}: storageWrite: ${this.path}/${file.name}`
            })
          })
        unbind()
      }
      this.file.name = ''
      this.list()
      this.flags.blockingOperationPopup = false
    },

    itemClicked (item) {
      if (item.type === 1) {
        if (!this.path.endsWith('/')) {
          this.path += '/'
        }
        this.path += item.name
        this.list()
      } else if (item.name === '..') {
        this.path = this.path.slice(0, this.path.lastIndexOf('/'))
        if (this.path.length === 0) {
          this.path = '/'
        }
        this.list()
      } else {
        this.read(this.path + '/' + item.name)
      }
    },

    async openFileIn (item, path) {
      const res = await this.read(this.path + '/' + item.name, true)
      this.$emit('openFileIn', {
        path,
        file: {
          name: item.name,
          data: res
        }
      })
    },

    itemIconSwitcher (item) {
      if (this.path === '/' && item.name === 'int') {
        return 'svguse:common-icons.svg#internal-memory'
      } else if (this.path === '/' && item.name === 'ext') {
        return 'svguse:common-icons.svg#sdcard-memory'
      } else if (item.type === 1) {
        return 'mdi-folder-outline'
      } else if (item.name.endsWith('.badusb')) {
        return 'svguse:file-types.svg#badusb'
      } else if (item.name.endsWith('.ibtn')) {
        return 'svguse:file-types.svg#ibutton'
      } else if (item.name.endsWith('.ir')) {
        return 'svguse:file-types.svg#infrared'
      } else if (item.name.endsWith('.nfc')) {
        return 'svguse:file-types.svg#nfc'
      } else if (item.name.endsWith('.rfid')) {
        return 'svguse:file-types.svg#rfid'
      } else if (item.name.endsWith('.sub')) {
        return 'svguse:file-types.svg#subghz'
      } else if (item.name.endsWith('.u2f')) {
        return 'svguse:file-types.svg#u2f'
      } else {
        return 'mdi-file-outline'
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
        message: `${this.componentName}: RPC error in command '${command}': ${error}`
      })
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (!this.rpcActive) {
        await this.startRpc()
      }
      await this.list()
    }
  },

  async mounted () {
    if (this.connected) {
      await this.start()
    }
  }
})
</script>
