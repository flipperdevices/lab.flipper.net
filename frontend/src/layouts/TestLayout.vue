<template>
  <q-btn
    @click="connect"
    label="connect"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="setReadingMode('text', 'lineBreak')"
    label="readingMode -> line"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="setReadingMode('raw')"
    label="readingMode -> raw"
    class="q-ma-xs"
  ></q-btn>
  <q-btn
    @click="setReadingMode('raw', 'protobuf')"
    label="readingMode -> protobuf"
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
  ></q-btn>
  <q-btn
    @click="rpcRequest({ requestType: 'systemDeviceInfoRequest', args: {} })"
    label="deviceInfo req"
    class="q-ma-xs"
  ></q-btn>
</template>

<script>
import { defineComponent } from 'vue'
import Flipper from 'src/flipper-js/flipper'
import * as rpc from 'src/flipper/protobuf/rpc'
import { PB } from 'src/flipper-js/proto-compiled'

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

    rpcRequest (options) {
      const request = rpc.createRequest(options)
      // console.log(request)
      this.flipper.writeRaw(request.data)
    }
  },

  mounted () {
    console.log(PB)
  }
})
</script>
