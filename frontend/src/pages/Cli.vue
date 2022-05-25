<template>
  <q-page class="column items-center bg-black">
    <div
      v-if="!connected"
      class="column flex-center q-my-xl"
    >
      <q-spinner
        color="primary"
        size="3em"
        class="q-mb-md"
      ></q-spinner>
      <p class="text-white">Waiting for Flipper...</p>
    </div>
    <div v-if="connected && !flags.rpcActive" class="full-width" style="height: calc(100vh - 50px)">
      <div id="terminal-container" class="fit bg-black"></div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Terminal } from 'xterm'
import 'xterm/css/xterm.css'
import { FitAddon } from 'xterm-addon-fit'

export default defineComponent({
  name: 'PageCli',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean
  },

  setup () {
    return {
      flags: ref({
        rpcActive: false,
        rpcToggling: false
      }),
      terminal: ref(undefined),
      readInterval: undefined,
      input: ref(''),
      unbind: ref(undefined)
    }
  },

  methods: {
    init () {
      this.terminal = new Terminal({
        scrollback: 10_000
      })
      const fitAddon = new FitAddon()
      this.terminal.loadAddon(fitAddon)
      this.terminal.open(document.getElementById('terminal-container'))
      document.querySelector('.xterm').setAttribute('style', 'height:' + getComputedStyle(document.querySelector('.xterm')).height)
      this.terminal.focus()
      fitAddon.fit()

      this.write('\x01')
      this.read()

      this.terminal.onData(async data => {
        this.write(data)
      })
    },

    write (data) {
      this.flipper.write('cli', data)
    },

    read () {
      this.flipper.read('cli')
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (this.rpcActive) {
        await this.stopRpc()
      }
      setTimeout(this.init, 500)

      let isUnicode = false,
        unicodeBytesLeft = 0,
        unicodeBuffer = []

      this.unbind = this.flipper.emitter.on('cli output', data => {
        if (data.byteLength === 1) {
          const byte = data[0]
          if (!isUnicode && byte >> 7 === 1) {
            isUnicode = true
            data = undefined
            unicodeBuffer.push(byte)
            for (let i = 6; i >= 4; i--) {
              if ((byte >> i) % 2 === 1) {
                unicodeBytesLeft++
              } else {
                break
              }
            }
          } else {
            if (unicodeBytesLeft > 0 && byte >> 6 === 2) {
              unicodeBuffer.push(byte)
              unicodeBytesLeft--
              if (unicodeBytesLeft === 0) {
                data = new Uint8Array(unicodeBuffer)
                isUnicode = false
                unicodeBuffer = []
              } else {
                data = undefined
              }
            } else {
              isUnicode = false
              unicodeBytesLeft = 0
              unicodeBuffer = []
            }
          }
        }
        if (data) {
          const text = new TextDecoder().decode(data).replaceAll('\x7F', '')
          this.terminal.write(text)
        }
      })
    }
  },

  mounted () {
    if (this.connected) {
      setTimeout(this.start, 500)
    }
  },

  async beforeUnmount () {
    this.unbind()
  }
})
</script>
