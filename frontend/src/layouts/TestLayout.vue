<template>
  <q-btn
    @click="connect"
    label="connect"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="disconnect"
    label="disconnect"
    class="q-ma-xs"
  ></q-btn>
  <!--<q-btn
    @click="setReadingMode('text', 'lineBreak')"
    label="readingMode -> line"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="setReadingMode('raw')"
    label="readingMode -> raw"
    class="q-ma-xs"
  ></q-btn>-->
  <q-btn
    @click="startRPC"
    label="RPC"
    class="q-ma-xs"
  ></q-btn>
  <!--<q-btn
    @click="setReadingMode('raw', 'protobuf')"
    label="read protobuf"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="write('test\r\n')"
    label="write test"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="write('start_rpc_session\r')"
    label="write rpcStart"
    class="q-ma-xs"
  ></q-btn>-->
  <div class="row q-gutter-md q-pa-md">
    <q-select v-model="RPCRequest.subSystem" :options="RPCRequest.subSystemOptions" label="Subsystem" style="width: 100px" />
    <q-input v-model="RPCRequest.command" label="Command" style="width: 200px" />
    <q-input v-model="RPCRequest.args" label="Args" style="width: 250px" />
    <q-btn
      @click="rpcRequest()"
      label="send"
      class="q-ma-xs"
    ></q-btn>
  </div>
  <q-btn
    @click="RPCwrite"
    label="write test.txt"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="rpcRequest('storageList', { path: '/ext'})"
    label="list /ext"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="rpcRequest('storageRemove', { path: '/ext/test.txt' })"
    label="delete test.txt"
    class="q-ma-xs"
  ></q-btn>
</template>

<script>
import { defineComponent, ref } from 'vue'
import Flipper from 'src/flipper-js/flipper'
// import * as rpc from 'src/flipper/protobuf/rpc'

export default defineComponent({
  name: 'TestLayout',

  setup () {
    return {
      filters: [{ usbVendorId: 1155, usbProductId: 22336 }],
      flipper: new Flipper(),
      RPCRequest: ref({
        subSystem: 'property',
        subSystemOptions: [
          'storage',
          'system',
          'application',
          'gui',
          'gpio',
          'property'
        ],
        command: 'Get',
        args: '{ "key": "devinfo.hardware.name" }'
      })
    }
  },

  methods: {
    async connect () {
      const ports = await navigator.serial.getPorts({ filters: this.filters })
      if (!ports.length) {
        this.port = await navigator.serial.requestPort({ filters: this.filters })
      }
      await this.flipper.connect()
    },

    async disconnect () {
      await this.flipper.disconnect()
        .then(() => {
          console.log('port closed')
        })
        .catch(error => {
          console.error(error)
        })
    },

    setReadingMode (type, transform) {
      this.flipper.setReadingMode(type, transform)
    },

    write (text) {
      this.flipper.write(text)
    },

    async startRPC () {
      await this.flipper.startRPCSession()
        .then(() => {
          console.log('rpc started')
        })
        .catch(error => {
          console.error(error)
        })
    },

    async rpcRequest (type, args) {
      if (!type) {
        type = this.RPCRequest.subSystem + this.RPCRequest.command
        args = this.RPCRequest.args.length ? JSON.parse(this.RPCRequest.args) : null
      }
      const response = await this.flipper.RPC(type, args)
      console.log(response)
    },

    async RPCwrite () {
      const file = await this.flipper.RPC('storageRead', { path: '/ext/Manifest' })
      console.log(file)
      const response = await this.flipper.RPC('storageWrite', { path: '/ext/test.txt', buffer: file.buffer })
      console.log(response)
    }
  },

  mounted () {
    console.log(this.flipper)
  }
})
</script>
