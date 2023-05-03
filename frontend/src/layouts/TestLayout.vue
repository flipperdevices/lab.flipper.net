<template>
  <q-btn
    @click="connect"
    label="connect"
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
  <q-btn
    @click="rpcRequest('systemPingRequest')"
    label="ping"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="rpcRequest('systemGetDatetimeRequest')"
    label="getDatetime"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="rpcRequest('systemDeviceInfoRequest')"
    label="deviceInfo"
    class="q-ma-xs"
  ></q-btn>
</template>

<script>
import { defineComponent } from 'vue'
import Flipper from 'src/flipper-js/flipper'
// import * as rpc from 'src/flipper/protobuf/rpc'

export default defineComponent({
  name: 'TestLayout',

  setup () {
    return {
      filters: [{ usbVendorId: 1155, usbProductId: 22336 }],
      flipper: new Flipper()
    }
  },

  methods: {
    async connect () {
      const ports = await navigator.serial.getPorts({ filters: this.filters })
      if (!ports.length) {
        this.port = await navigator.serial.requestPort({ filters: this.filters })
      }
      this.flipper.connect()
    },

    setReadingMode (type, transform) {
      this.flipper.setReadingMode(type, transform)
    },

    write (text) {
      this.flipper.write(text)
    },

    async startRPC () {
      await this.flipper.startRPCSession()
    },

    rpcRequest (type) {
      /* const rawReq = {
        ping: Uint8Array.from([4, 8, 1, 42, 0]),
        deviceInfo: Uint8Array.from([5, 8, 2, 130, 2, 0]),
        powerInfo: Uint8Array.from([5, 8, 3, 226, 2, 0])
      } */
      // const request = rpc.createRequest(options)
      // console.log(request)
      this.flipper.RPC(type)
    }
  },

  mounted () {
    console.log(this.flipper)
  }
})
</script>
