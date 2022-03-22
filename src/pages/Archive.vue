<template>
  <q-page class="flex flex-center column q-pa-md">
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
          icon="create_new_folder"
          class="q-mx-sm"
          :disabled="path === '/'"
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
            <q-icon v-if="item.name === '..'" name="arrow_back_ios"/>
            <q-icon v-else-if="item.type === 1" name="folder"/>
            <q-icon v-else name="description"/>
          </q-item-section>

          <q-item-section @click="itemClicked(item)">
            <q-item-label>
              {{ item.name }}
            </q-item-label>
            <span v-if="item.type !== 1 && item.size" class="text-weight-light">{{ item.size }} bytes</span>
          </q-item-section>

          <q-item-section avatar>
            <q-btn flat dense round icon="more_vert">
              <q-menu auto-close self="top middle">
                <q-list style="min-width: 100px">
                  <q-item clickable @click="editorText = item.name; oldName = item.name; flags.renamePopup = true">
                    <q-item-section avatar>
                      <q-icon name="edit"/>
                    </q-item-section>
                    <q-item-section>
                      Rename
                    </q-item-section>
                  </q-item>
                  <q-item clickable class="text-negative" @click="remove(path + '/' + item.name, !!item.type)">
                    <q-item-section avatar>
                      <q-icon name="delete"/>
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
              style="width: 300px;"
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
              style="width: 300px;"
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
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { exportFile } from 'quasar'

export default defineComponent({
  name: 'PageArchive',

  props: {
    flipper: Object
  },

  setup () {
    return {
      path: ref('/'),
      dir: ref([]),
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        uploadPopup: false,
        renamePopup: false
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
      const res = await this.flipper.commands.storage.list(this.path)
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

    async upload () {
      await this.flipper.commands.storage.write(this.path + '/' + this.uploadedFile.name, await this.uploadedFile.arrayBuffer())
      this.list()
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
    }
  },

  async mounted () {
    await this.startRpc()
    this.list()
  }
})
</script>
