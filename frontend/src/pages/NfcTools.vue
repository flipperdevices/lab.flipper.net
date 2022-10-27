<template>
  <q-page class="column items-center q-pa-md">
    <div class="text-h6 q-py-sm">Mfkey32v2 NFC attack</div>
    <div class="text-subtitle-1">Crack nonces you've gathered on your Flipper</div>

    <q-btn
      color="primary"
      :loading="flags.mfkeyFlipperInProgress"
      :disable="flags.mfkeyManualInProgress"
      class="q-mt-lg q-py-sm q-px-lg"
      label="Give me the keys"
      @click="mfkeyFlipperStart"
    />
    <div class="q-pt-sm q-mb-xl text-subtitle-1">{{ mfkeyStatus }}</div>

    <q-card flat bordered class="q-mt-xl">
      <q-card-section>
        <div class="text-h6">Manual attack</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit="mfkeyManualStart">
          <div class="flex q-gutter-md">
            <q-input v-model="args.cuid" label="cuid" style="width: 70px" />
            <q-input v-model="args.nt0" label="nt0" style="width: 70px" />
            <q-input v-model="args.nr0" label="nr0" style="width: 70px" />
            <q-input v-model="args.ar0" label="ar0" style="width: 70px" />
            <q-input v-model="args.nt1" label="nt1" style="width: 70px" />
            <q-input v-model="args.nr1" label="nr1" style="width: 70px" />
            <q-input v-model="args.ar1" label="ar1" style="width: 70px" />
            <div class="q-mt-lg">
              <q-btn
                type="submit"
                color="primary"
                :loading="flags.mfkeyManualInProgress"
                :disable="flags.mfkeyFlipperInProgress"
                label="Run"
              />
            </div>
          </div>
        </q-form>
        <div v-if="result" class="q-pt-lg">
          <span v-if="!result.startsWith('Error')" class="text-subtitle1 q-mr-sm">Key:</span>
          <b>{{ result }}</b>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import asyncSleep from 'simple-async-sleep'
import { startMfkey, forceStopMfkey } from '../util/mfkey32v2/mfkey'

export default defineComponent({
  name: 'NfcTools',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean
  },

  setup () {
    return {
      flags: ref({
        rpcActive: false,
        rpcToggling: false,
        mfkeyFlipperInProgress: false,
        mfkeyManualInProgress: false
      }),
      mfkeyStatus: ref(''),
      args: ref({
        cuid: '2a234f80',
        nt0: '55721809',
        nr0: 'ce9985f6',
        ar0: '772f55be',
        nt1: 'a27173f2',
        nr1: 'e386b505',
        ar1: '5fa65203'
      }),
      result: ref('')
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
      const ping = await this.flipper.commands.startRpcSession(this.flipper)
      if (!ping.resolved || ping.error) {
        this.$emit('showNotif', {
          message: 'Unable to start RPC session. Reload the page or reconnect Flipper manually.',
          color: 'negative',
          reloadBtn: true
        })
        this.$emit('log', {
          level: 'error',
          message: 'NfcTools: Couldn\'t start rpc session'
        })
        throw new Error('Couldn\'t start rpc session')
      }
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', true)
      this.$emit('log', {
        level: 'info',
        message: 'NfcTools: RPC started'
      })
    },
    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
      this.$emit('log', {
        level: 'info',
        message: 'NfcTools: RPC stopped'
      })
    },
    async restartRpc (force) {
      if (this.connected && (this.rpcActive || force)) {
        this.flags.restarting = true
        await this.flipper.closeReader()
        await asyncSleep(300)
        await this.flipper.disconnect()
        await asyncSleep(300)
        await this.flipper.connect()
        await this.startRpc()
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
        message: `NfcTools: RPC error in command '${command}': ${error}`
      })
    },

    async mfkeyFlipperStart () {
      this.flags.mfkeyFlipperInProgress = true
      this.mfkeyStatus = 'Loading log'

      let res = await this.flipper.commands.storage.read('/ext/nfc/.mfkey32.log')
        .catch(error => {
          this.rpcErrorHandler(error, 'storage.read')
          this.mfkeyStatus = 'No new logs available'
          this.flags.mfkeyFlipperInProgress = false
        })
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: 'NfcTools: storage.read: /ext/nfc/.mfkey32.log'
          })
        })

      if (!res) {
        return
      }

      this.mfkeyStatus = 'Processing log'
      const nonces = new TextDecoder().decode(res).split('\n')
      if (nonces[nonces.length - 1].length === 0) {
        nonces.pop()
      }

      const keys = new Set()
      const errors = []
      for (let i = 0; i < nonces.length; i++) {
        const args = nonces[i].slice(nonces[i].indexOf('cuid')).split(' ').filter((e, i) => i % 2 === 1)
        this.mfkeyStatus = `Attacking nonce ${i + 1} of ${nonces.length}`
        try {
          const key = await this.mfkey(args)
          keys.add(key)
          this.$emit('log', {
            level: 'debug',
            message: `NfcTools: cracked nonce: ${args}, key: ${key}`
          })
        } catch (error) {
          errors.push(error.toString())
          this.$emit('log', {
            level: 'error',
            message: `NfcTools: error in mfkey32v2: ${error}`
          })
        }
      }

      this.mfkeyStatus = 'Loading user dictionary'
      res = await this.flipper.commands.storage.read('/ext/nfc/assets/mf_classic_dict_user.nfc')
        .catch(error => {
          this.rpcErrorHandler(error, 'storage.read')
        })
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: 'NfcTools: storage.read: /ext/nfc/assets/mf_classic_dict_user.nfc'
          })
        })

      let dictionary = []
      if (res) {
        this.mfkeyStatus = 'Processing user dictionary'
        dictionary = new TextDecoder().decode(res).split('\n')
        if (dictionary[dictionary.length - 1].length === 0) {
          dictionary.pop()
        }
      }

      dictionary = new Set(dictionary)
      const dictLength = Array.from(dictionary).length
      for (const key of keys) {
        dictionary.add(key)
      }

      this.mfkeyStatus = 'Uploading user dictionary'
      const file = new TextEncoder().encode(Array.from(keys).join('\n'))
      await this.flipper.commands.storage.write('/ext/nfc/assets/mf_classic_dict_user.nfc', file.buffer)
        .catch(error => this.rpcErrorHandler(error, 'storage.write'))
        .finally(() => {
          this.$emit('log', {
            level: 'debug',
            message: 'Archive: storage.write: ' + this.path + '/' + file.name
          })
        })

      this.mfkeyStatus = `Nonces: ${nonces.length} | Unique keys: ${Array.from(keys).length} | New keys: ${Array.from(dictionary).length - dictLength} | Errors: ${errors.length}`

      this.flags.mfkeyFlipperInProgress = false
    },

    mfkeyManualStart (e) {
      e.preventDefault()
      this.flags.mfkeyManualInProgress = true
      return this.mfkey()
    },

    async mfkey (args) {
      this.result = ''
      if (!args) {
        args = Object.values(this.args)
      }
      let result
      try {
        result = await startMfkey(args)
        this.$emit('log', {
          level: 'debug',
          message: `NfcTools: cracked nonce: ${args}, key: ${result}`
        })
      } catch (error) {
        this.$emit('log', {
          level: 'error',
          message: `NfcTools: error in mfkey32v2: ${error}`
        })
        result = `Error: ${error}`
      }
      if (this.flags.mfkeyManualInProgress) {
        this.result = result
      }
      this.flags.mfkeyManualInProgress = false
      return result
    },

    forceStopMfkey () {
      forceStopMfkey()
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (!this.rpcActive) {
        setTimeout(() => {
          if (!this.rpcActive) {
            return this.restartRpc(true)
          }
        }, 1000)
        await this.startRpc()
      }
    }
  },

  async mounted () {
    if (this.connected) {
      await this.start()
    }
  }
})
</script>
