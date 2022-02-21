<template>
  <q-page class="flex flex-center column">
    <p>{{ connectionStatus }}</p>

    <q-btn
      v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
      @click="flags.portSelectRequired ? selectPort() : connect()"
    >
      Connect
    </q-btn>

    <div v-if="flags.connected">
      <q-btn
        @click="flags.rpcActive ? stopRpc() : startRpc()"
        :loading="flags.rpcToggling"
        class="q-ma-sm"
      >
        {{ flags.rpcActive ? 'Stop rpc' : 'Start rpc' }}
      </q-btn>

      <q-btn
        @click="readInfo"
        class="q-ma-sm"
      >
        Read info
      </q-btn>

      <q-btn
        @click="disconnect"
        class="q-ma-sm"
      >
        Disconnect
      </q-btn>
    </div>

    <pre
      v-if="this.info.device_info_major"
      style="white-space: pre-line;"
    >
      {{ this.info }}
    </pre>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import * as flipper from '../flipper/core'

const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

export default defineComponent({
  name: 'PageDevice',

  setup () {
    return {
      flipper: ref(flipper),
      info: ref({}),
      flags: ref({
        portSelectRequired: false,
        connected: false,
        rpcActive: false,
        rpcToggling: false
      }),
      connectionStatus: ref('Ready to connect')
    }
  },

  methods: {
    async connect () {
      await this.flipper.connect()
        .then(() => {
          this.connectionStatus = 'Connected'
          this.flags.connected = true
        })
        .catch((error) => {
          if (error.toString() === 'Error: No known ports') {
            this.flags.portSelectRequired = true
          } else {
            this.connectionStatus = error.toString()
          }
        })
    },

    async selectPort () {
      await navigator.serial.requestPort({ filters })
      return this.connect()
    },

    async disconnect () {
      await this.flipper.disconnect()
        .then(() => {
          this.connectionStatus = 'Disconnected'
          this.flags.connected = false
        })
        .catch((error) => {
          this.connectionStatus = error.toString()
        })
    },

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

    async readInfo () {
      const res = await this.flipper.commands.system.deviceInfo()
      for (const line of res) {
        this.info[line.key] = line.value
      }
    }
  },

  mounted () {
    this.connect()

    navigator.serial.addEventListener('disconnect', async () => {
      await this.disconnect()
    })
  }
})
</script>
