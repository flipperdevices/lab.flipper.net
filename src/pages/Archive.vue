<template>
  <q-page class="flex flex-center column">
    <code
      v-if="dir.length > 0"
      class="q-ma-sm q-pa-xs bg-grey-3 rounded-borders"
    >{{ path }}</code>
    <q-list
      style="display: grid; grid-gap: 5px 1rem; min-width: 300px;"
      :style="$q.screen.width < 500 ? 'grid-template-columns: 1fr;' : 'grid-template-columns: 1fr 1fr;'"
    >
      <q-item
        v-for="item in dir"
        :key="item.name"
        v-bind="item"
        clickable
        style="border-radius: 3px;"
        @click="itemClicked(item)"
      >
        <q-item-section
          avatar
        >
          <q-icon v-if="item.name === '..'" name="arrow_back_ios"/>
          <q-icon v-else-if="item.type === 1" name="folder"/>
          <q-icon v-else name="description"/>
        </q-item-section>

        <q-item-section>
          <q-item-label>
            {{ item.name }}
          </q-item-label>
          <span v-if="item.type !== 1 && item.size" class="text-weight-light">{{ item.size }} bytes</span>
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'

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
        rpcToggling: false
      })
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
      this.dir = res
      if (this.path !== '/') {
        this.dir.unshift({
          name: '..'
        })
      }
    },

    async read (path) {
      const res = await this.flipper.commands.storage.read(path)
      console.log(res)
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
        this.read(this.path + item.name)
      }
    }
  },

  async mounted () {
    await this.startRpc()
    this.list()
  }
})
</script>
