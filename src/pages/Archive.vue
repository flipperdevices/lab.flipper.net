<template>
  <q-page class="flex items-center column q-pa-md" :class="$q.screen.width > 960 && $q.screen.height > 500 ? 'q-mt-xl' : 'q-mt-xs'">
    <div class="file-container">
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
          v-if="dir.length > 0"
          class="q-py-xs q-px-sm bg-grey-3 rounded-borders overflow-hidden-y"
        >{{ path }}</code>
        <q-space></q-space>
        <q-btn
          flat
          dense
          icon="archive:new"
          class="q-mx-sm"
          :disabled="path === '/'"
          @click="flags.mkdirPopup = true; editorText = ''"
        ></q-btn>
        <q-btn
          flat
          dense
          icon="upload_file"
          :disabled="path === '/'"
          @click="flags.uploadPopup = !flags.uploadPopup"
        ></q-btn>
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
            <q-btn flat dense round icon="more_vert">
              <q-menu auto-close self="top middle">
                <q-list style="min-width: 100px">
                  <q-item clickable @click="editorText = item.name; oldName = item.name; flags.renamePopup = true">
                    <q-item-section avatar>
                      <q-icon name="archive:rename"/>
                    </q-item-section>
                    <q-item-section>
                      Rename
                    </q-item-section>
                  </q-item>
                  <q-item clickable class="text-negative" @click="remove(path + '/' + item.name, !!item.type)">
                    <q-item-section avatar>
                      <q-icon name="archive:remove"/>
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
      </q-list>
      <q-dialog v-model="flags.uploadPopup">
        <q-card>
          <q-card-section class="q-pt-none">
            <q-file
              outlined
              v-model="uploadedFile"
              label="Drop or select file"
              class="q-pt-md"
              :style="$q.screen.width > 380 ? 'width: 300px;' : ''"
            >
              <template v-slot:prepend>
                <q-icon name="upload_file"></q-icon>
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
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { exportFile, useQuasar } from 'quasar'
const flipperIcons = {
  'archive:new': 'img:icons/flipper/action-new.svg',
  'archive:remove': 'img:icons/flipper/action-remove.svg',
  'archive:rename': 'img:icons/flipper/action-rename.svg',
  'archive:save': 'img:icons/flipper/action-save.svg',
  'archive:sdcard': 'img:icons/flipper/location-sdcard.svg',
  'archive:internal': 'img:icons/flipper/location-internal.svg',
  'archive:file': 'img:icons/flipper/file.svg',
  'archive:folder': 'img:icons/flipper/folder.svg',
  'archive:badusb': 'img:icons/flipper/badusb.svg',
  'archive:ibutton': 'img:icons/flipper/ibutton.svg',
  'archive:nfc': 'img:icons/flipper/nfc.svg',
  'archive:rfid': 'img:icons/flipper/rfid.svg',
  'archive:subghz': 'img:icons/flipper/subghz.svg',
  'archive:u2f': 'img:icons/flipper/u2f.svg'
}

export default defineComponent({
  name: 'PageArchive',

  props: {
    flipper: Object
  },

  setup () {
    const $q = useQuasar()

    $q.iconMapFn = (iconName) => {
      const icon = flipperIcons[iconName]
      if (icon !== void 0) {
        return { icon: icon }
      }
    }
    return {
      path: ref('/'),
      dir: ref([]),
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        uploadPopup: false,
        renamePopup: false,
        mkdirPopup: false
      }),
      uploadedFile: ref(null),
      editorText: ref(''),
      oldName: ref('')
    }
  },

  methods: {
    async startRpc () {
      this.flags.rpcToggling = true
      const ping = await this.flipper.commands.startRpcSession(this.flipper)
      if (!ping.resolved || ping.error) {
        throw new Error('Couldn\'t start rpc session')
      }
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
    },

    async list () {
      let res = await this.flipper.commands.storage.list(this.path)
      if (this.path === '/') {
        res = res.filter(e => e.name !== 'any')
      }
      this.dir = res.sort((a, b) => { return (b.type || 0) - a.type })
    },

    async read (path) {
      const res = await this.flipper.commands.storage.read(path)
      const s = path.split('/')
      exportFile(s[s.length - 1], res)
    },

    async remove (path, isRecursive) {
      await this.flipper.commands.storage.remove(path, isRecursive)
      this.list()
    },

    async rename (path, oldName, newName) {
      await this.flipper.commands.storage.rename(path, oldName, newName)
      this.list()
    },

    async mkdir (path) {
      await this.flipper.commands.storage.mkdir(path)
      this.list()
    },

    async upload () {
      await this.flipper.commands.storage.write(this.path + '/' + this.uploadedFile.name, await this.uploadedFile.arrayBuffer())
      this.list()
      this.uploadedFile = null
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

    itemIconSwitcher (item) {
      if (this.path === '/' && item.name === 'int') {
        return 'archive:internal'
      } else if (this.path === '/' && item.name === 'ext') {
        return 'archive:sdcard'
      } else if (item.type === 1) {
        return 'archive:folder'
      } else if (item.name.endsWith('.badusb')) {
        return 'archive:badusb'
      } else if (item.name.endsWith('.ibutton')) {
        return 'archive:ibutton'
      } else if (item.name.endsWith('.nfc')) {
        return 'archive:nfc'
      } else if (item.name.endsWith('.rfid')) {
        return 'archive:rfid'
      } else if (item.name.endsWith('.subghz')) {
        return 'archive:subghz'
      } else if (item.name.endsWith('.u2f')) {
        return 'archive:u2f'
      } else {
        return 'archive:file'
      }
    }
  },

  async mounted () {
    await this.startRpc()
    this.list()
  }
})
</script>
