<template>
  <q-page class="column items-center full-width">
    <PixelEditor ref="editor"/>
  </q-page>
</template>

<script setup>
import { ref, defineProps, defineEmits, onMounted, onBeforeUnmount } from 'vue'
import PixelEditor from 'src/components/PixelEditor.vue'
import { imageDataToXBM } from '../util/pixeleditor/xbm'

const props = defineProps({
  flipper: Object,
  connected: Boolean,
  rpcActive: Boolean,
  info: Object
})

const emit = defineEmits(['setRpcStatus', 'log', 'showNotif'])

const componentName = 'Paint'
const flags = ref({
  restarting: false,
  rpcActive: false,
  rpcToggling: false,
  pixelGrid: false
})
const autoStreaming = ref({
  enabled: true,
  interval: null,
  delay: 500
})
let backlightInterval = null
const editor = ref(null)

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

const startVirtualDisplay = async () => {
  await props.flipper.RPC('guiStartVirtualDisplay')
    .catch(error => {
      rpcErrorHandler(error, 'guiStartVirtualDisplay')
      emit('showNotif', {
        message: 'Couldn\'t start virtual display session',
        color: 'negative'
      })
    })

  await enableBacklight()
  backlightInterval = setInterval(enableBacklight, 15000)

  if (autoStreaming.value.enabled) {
    autoStream()
  }
}
const stopVirtualDisplay = async () => {
  await props.flipper.RPC('guiStopVirtualDisplay')
    .catch(error => rpcErrorHandler(error, 'guiStopVirtualDisplay'))
}
const enableBacklight = async () => {
  await props.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'PRESS' })
    .catch(error => rpcErrorHandler(error, 'guiSendInputEvent'))
  await props.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'SHORT' })
    .catch(error => rpcErrorHandler(error, 'guiSendInputEvent'))
  await props.flipper.RPC('guiSendInputEvent', { key: 'OK', type: 'RELEASE' })
    .catch(error => rpcErrorHandler(error, 'guiSendInputEvent'))
}
const sendFrame = async () => {
  const imageData = editor.value.pe.toImageData()
  const xbmBytes = imageDataToXBM(imageData)
  await props.flipper.RPC('guiScreenFrame', { data: new Uint8Array(xbmBytes) })
}
const autoStream = () => {
  if (autoStreaming.value.enabled) {
    if (autoStreaming.value.interval) {
      clearInterval(autoStreaming.value.interval)
    }
    autoStreaming.value.interval = setInterval(sendFrame, autoStreaming.value.delay)
  } else {
    clearInterval(autoStreaming.value.interval)
  }
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

const start = () => {
  flags.value.rpcActive = props.rpcActive
  if (!props.rpcActive) {
    startRpc()
  }
}

onMounted(() => {
  if (props.connected && props.info !== null && props.info.doneReading) {
    start()
  }

  startVirtualDisplay()
})

onBeforeUnmount(() => {
  if (autoStreaming.value.interval) {
    clearInterval(autoStreaming.value.interval)
  }
  clearInterval(backlightInterval)
  stopVirtualDisplay()
})
</script>
