<template>
  <q-page class="column items-center q-pa-md full-width">
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

<script setup>
import { ref, defineProps, defineEmits, watch, onMounted } from 'vue'
import { startMfkey } from '../util/mfkey32v2/mfkey'

const props = defineProps({
  flipper: Object,
  connected: Boolean,
  rpcActive: Boolean
})

const emit = defineEmits(['setRpcStatus', 'log', 'showNotif', 'toggleMicroSDcardMissingDialog'])

const componentName = 'NfcTools'
const flags = ref({
  rpcActive: false,
  rpcToggling: false,
  mfkeyFlipperInProgress: false,
  mfkeyManualInProgress: false
})
const mfkeyStatus = ref('')
const args = ref({
  cuid: '2a234f80',
  nt0: '55721809',
  nr0: 'ce9985f6',
  ar0: '772f55be',
  nt1: 'a27173f2',
  nr1: 'e386b505',
  ar1: '5fa65203'
})
const result = ref('')

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
const mfkeyFlipperStart = async () => {
  if (!props.info?.storage.sdcard.status.isInstalled) {
    emit('toggleMicroSDcardMissingDialog', true)
    return
  }
  flags.value.mfkeyFlipperInProgress = true
  mfkeyStatus.value = 'Loading log'

  let res = await props.flipper.RPC('storageRead', { path: '/ext/nfc/.mfkey32.log' })
    .catch(error => {
      rpcErrorHandler(error, 'storageRead')
      mfkeyStatus.value = 'No new logs available'
      flags.value.mfkeyFlipperInProgress = false
    })
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageRead: /ext/nfc/.mfkey32.log`
      })
    })

  if (!res) {
    return
  }

  mfkeyStatus.value = 'Processing log'
  const nonces = new TextDecoder().decode(res).split('\n')
  if (nonces[nonces.length - 1].length === 0) {
    nonces.pop()
  }

  const keys = new Set()
  const errors = []
  for (let i = 0; i < nonces.length; i++) {
    const args = nonces[i].slice(nonces[i].indexOf('cuid')).split(' ').filter((e, i) => i % 2 === 1)
    mfkeyStatus.value = `Attacking nonce ${i + 1} of ${nonces.length}`
    try {
      const key = await mfkey(args)
      if (!key.startsWith('Error')) {
        keys.add(key)
      }
      emit('log', {
        level: 'debug',
        message: `${componentName}: cracked nonce: ${args}, key: ${key}`
      })
    } catch (error) {
      errors.push(error.toString())
      emit('log', {
        level: 'error',
        message: `${componentName}: error in mfkey32v2: ${error}`
      })
    }
  }

  mfkeyStatus.value = 'Loading user dictionary'
  res = await props.flipper.RPC('storageRead', { path: '/ext/nfc/assets/mf_classic_dict_user.nfc' })
    .catch(error => {
      rpcErrorHandler(error, 'storageRead')
    })
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storageRead: /ext/nfc/assets/mf_classic_dict_user.nfc`
      })
    })

  let dictionary = []
  if (res) {
    mfkeyStatus.value = 'Processing user dictionary'
    dictionary = new TextDecoder().decode(res).split('\n')
    if (dictionary[dictionary.length - 1].length === 0) {
      dictionary.pop()
    }
  }

  dictionary = dictionary.filter(e => e !== 'Error: mfkey run killed on timeout')
  dictionary = new Set(dictionary)
  const dictLength = Array.from(dictionary).length
  for (const key of keys) {
    dictionary.add(key)
  }

  mfkeyStatus.value = 'Uploading user dictionary'
  const file = new TextEncoder().encode(Array.from(keys).join('\n'))
  const path = '/ext/nfc/assets/mf_classic_dict_user.nfc'
  await props.flipper.RPC('storageWrite', { path, buffer: file.buffer })
    .catch(error => rpcErrorHandler(error, 'storageWrite'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: storage.write: ${path}`
      })
    })

  mfkeyStatus.value = `Nonces: ${nonces.length} | Unique keys: ${Array.from(keys).length} | New keys: ${Array.from(dictionary).length - dictLength} | Errors: ${errors.length}`

  flags.value.mfkeyFlipperInProgress = false
}
const mfkeyManualStart = async (e) => {
  e.preventDefault()
  flags.value.mfkeyManualInProgress = true
  return mfkey()
}
const mfkey = async (localArgs) => {
  result.value = ''
  if (!localArgs) {
    localArgs = Object.values(args.value)
  }
  let localResult
  try {
    localResult = await startMfkey(localArgs)
    emit('log', {
      level: 'debug',
      message: `${componentName}: cracked nonce: ${localArgs}, key: ${localResult}`
    })
  } catch (error) {
    emit('log', {
      level: 'error',
      message: `${componentName}: error in mfkey32v2: ${error}`
    })
    localResult = `Error: ${error}`
  }
  if (flags.value.mfkeyManualInProgress) {
    result.value = localResult
  }
  flags.value.mfkeyManualInProgress = false
  return result.value
}

const start = async () => {
  flags.value.rpcActive = props.rpcActive
  if (!props.rpcActive) {
    await startRpc()
  }
}

onMounted(() => {
  if (props.connected) {
    start()
  }
})
</script>
