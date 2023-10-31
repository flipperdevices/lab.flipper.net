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
                  <q-item v-if="item.name.endsWith('.sub') || item.name.endsWith('.ir')" clickable @click="openFileIn(item, { name: 'PulsePlotter' })">
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

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from 'vue'
import ProgressBar from 'components/ProgressBar.vue'
import { exportFile } from 'quasar'

const props = defineProps({
  flipper: Object,
  connected: Boolean,
  rpcActive: Boolean
})
const emit = defineEmits(['setRpcStatus', 'log', 'showNotif'])

const componentName = 'Archive'
const path = ref('/')
const dir = ref([])
const flags = ref({
  rpcActive: false,
  rpcToggling: false,
  uploadPopup: false,
  uploadFolderPopup: false,
  renamePopup: false,
  mkdirPopup: false,
  blockingOperationPopup: false,
  deletePopup: false
})
const uploadedFiles = ref(null)
const editorText = ref('')
const oldName = ref('')
const file = ref({
  name: '',
  progress: 0
})
const itemToDelete = ref(null)

watch(ref(props.connected), (newStatus) => {
  if (newStatus) {
    start()
  }
})

const startRpc = async () => {
  flags.value.rpcToggling = true
  await props.flipper.startRPCSession()
    .catch(error => {
      console.error(error)
      emit('log', {
        level: 'error',
        message: `${componentName}: Error while starting RPC: ${error.toString()}`
      })
    })
  flags.value.rpcActive = true
  emit('setRpcStatus', true)
  flags.value.rpcToggling = false
  emit('log', {
    level: 'info',
    message: `${componentName}: RPC started`
  })
}

const list = async () => {
  const list = await props.flipper.RPC('storageList', { path: path.value })
    .catch(error => rpcErrorHandler(error, 'storageList'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageList: ${path.value}`
      })
    })
  if (list.length === 0) {
    dir.value = []
    return
  }

  if (path.value === '/') {
    dir.value = list.filter(e => e.name !== 'any')
  } else {
    dir.value = list
  }
}
const read = async (path, preventDownload) => {
  flags.value.blockingOperationPopup = true
  file.value.name = path.slice(path.lastIndexOf('/') + 1)
  const localFile = dir.value.find(e => e.name === file.value.name && !e.type)
  const total = localFile.size
  const unbind = props.flipper.emitter.on('storageReadRequest/progress', chunks => {
    file.value.progress = Math.min(chunks * 512, total) / total
  })

  const res = await props.flipper.RPC('storageRead', { path })
    .catch(error => rpcErrorHandler(error, 'storageRead'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageRead: ${path}`
      })
    })
  const s = path.split('/')
  if (!preventDownload) {
    exportFile(s[s.length - 1], res)
  }
  unbind()
  flags.value.blockingOperationPopup = false
  if (preventDownload) {
    return res
  }
}
const remove = async (path, isRecursive) => {
  await props.flipper.RPC('storageRemove', { path, recursive: isRecursive })
    .catch(error => rpcErrorHandler(error, 'storageRemove'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageRemove: ${path}, recursive: ${isRecursive}`
      })
    })
  list()
}
const rename = async (path, oldName, newName) => {
  await props.flipper.RPC('storageRename', { oldPath: path + '/' + oldName, newPath: path + '/' + newName })
    .catch(error => rpcErrorHandler(error, 'storageRename'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageRename: ${path}, old name: ${oldName}, new name: ${newName}`
      })
    })
  list()
}
const mkdir = async (path) => {
  await props.flipper.RPC('storageMkdir', { path })
    .catch(error => rpcErrorHandler(error, 'storageMkdir'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageMkdir: ${path}`
      })
    })
  list()
}
const upload = async () => {
  if (!uploadedFiles.value || uploadedFiles.value.length === 0) {
    return
  }
  flags.value.blockingOperationPopup = true
  for (const localFile of uploadedFiles.value) {
    file.value.name = localFile.name
    let dir = path.value

    if (localFile.webkitRelativePath?.length > 0) {
      const path = localFile.webkitRelativePath.split('/')
      path.pop()
      while (path.length > 0) {
        dir += '/' + path.shift()
        const stat = await props.flipper.RPC('storageStat', { path: dir })
        if (!stat) {
          await props.flipper.RPC('storageMkdir', { path: dir })
        }
      }
    }

    const unbind = props.flipper.emitter.on('storageWriteRequest/progress', e => {
      file.value.progress = e.progress / e.total
    })

    await props.flipper.RPC('storageWrite', { path: dir + '/' + localFile.name, buffer: await localFile.arrayBuffer() })
      .catch(error => rpcErrorHandler(error, 'storageWrite'))
      .finally(() => {
        emit('log', {
          level: 'debug',
          message: `${componentName}: storageWrite: ${path.value}/${localFile.name}`
        })
      })
    unbind()
  }
  file.value.name = ''
  list()
  flags.value.blockingOperationPopup = false
}

const itemClicked = (item) => {
  if (item.type === 1) {
    if (!path.value.endsWith('/')) {
      path.value += '/'
    }
    path.value += item.name
    list()
  } else if (item.name === '..') {
    path.value = path.value.slice(0, path.value.lastIndexOf('/'))
    if (path.value.length === 0) {
      path.value = '/'
    }
    list()
  } else {
    read(path.value + '/' + item.name)
  }
}
const openFileIn = async (item, destination) => {
  const res = await read(path.value + '/' + item.name, true)
  emit('openFileIn', {
    path: destination,
    file: {
      name: item.name,
      data: res
    }
  })
}
const itemIconSwitcher = (item) => {
  if (path.value === '/' && item.name === 'int') {
    return 'svguse:common-icons.svg#internal-memory'
  } else if (path.value === '/' && item.name === 'ext') {
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
}

const rpcErrorHandler = (error, command) => {
  error = error.toString()
  emit('showNotif', {
    message: `RPC error in command '${command}': ${error}`,
    color: 'negative'
  })
  emit('log', {
    level: 'error',
    message: `${componentName}: RPC error in command '${command}': ${error}`
  })
}

const start = async () => {
  flags.value.rpcActive = props.rpcActive
  if (!props.rpcActive) {
    await startRpc()
  }
  await list()
}

onMounted(() => {
  if (props.connected) {
    start()
  }
})
</script>
