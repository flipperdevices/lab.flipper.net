<template>
  <q-page class="flex-center column full-width">
    <div class="flex-center column">
      <div v-show="flags.updateInProgress || (connected && info !== null && info.doneReading && flags.rpcActive)" class="device-screen column">
        <div class="flex">
          <div class="info">
            <p>
              <span>Firmware:</span>
              <span>{{ info.firmware.version !== 'unknown' ? info.firmware.version : info.firmware.commit }}</span>
            </p>
            <p>
              <span>Build date:</span>
              <span>{{ info.firmware.build.date }}</span>
            </p>
            <p>
              <span>SD card:</span>
              <span>{{ sdCardUsage }}</span>
            </p>
            <p>
              <span>Databases:</span>
              <span>{{ info.storage.databases.status }}</span>
            </p>
            <p>
              <span>Hardware:</span>
              <span>{{ info.hardware.ver + '.F' + info.hardware.target + 'B' + info.hardware.body + 'C' + info.hardware.connect }}</span>
            </p>
            <p>
              <span>Radio FW:</span>
              <span>{{ info.radio.alive !== false ? info.radio.stack.major + '.' + info.radio.stack.minor + '.' + info.radio.stack.sub : 'corrupt' }}</span>
            </p>
            <p>
              <span>Radio stack:</span>
              <span>{{ radioStackType }}</span>
            </p>
          </div>
          <div class="column items-center">
            <h5>{{ info.hardware.name }}</h5>
            <div
              class="flipper"
              :class="info.hardware.color === '1' ? 'body-black' : 'body-white'"
            >
              <canvas
                v-show="flags.screenStream"
                :width="128 * screenScale"
                :height="64 * screenScale"
                style="image-rendering: pixelated;"
                :style="`rotate: ${flags.leftHanded ? 180 : 0}deg`"
                ref="screenStreamCanvas"
              ></canvas>
              <img
                v-if="flags.updateInProgress"
                src="../assets/flipper-screen-updating.png"
                style="image-rendering: pixelated; position: relative; top: -2px;"
              />
            </div>
          </div>
        </div>
        <Updater
          :flipper="flipper"
          :rpcActive="rpcActive"
          :info="info"
          :installFromFile="installFromFile"
          @update="onUpdateStage"
          @showNotif="passNotif"
          @log="passLog"
        />
      </div>
      <div
        v-if="!flags.updateInProgress && (!connected || info == null || !flags.rpcActive || flags.rpcToggling)"
        class="flex-center column q-my-xl"
      >
        <q-spinner
          color="primary"
          size="3em"
          class="q-mb-md"
        ></q-spinner>
        <p>Waiting for Flipper...</p>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Updater from 'components/Updater.vue'
import asyncSleep from 'simple-async-sleep'
import { bytesToSize } from '../util/util'

const props = defineProps({
  flipper: Object,
  connected: Boolean,
  rpcActive: Boolean,
  info: Object,
  installFromFile: Boolean
})

const emit = defineEmits(['setRpcStatus', 'log', 'update', 'showNotif'])

const componentName = 'Device'
const flags = ref({
  restarting: false,
  rpcActive: false,
  rpcToggling: false,
  screenStream: false,
  updateInProgress: false,
  leftHanded: false
})
const screenScale = ref(1)
const screenStreamCanvas = ref(null)

const radioStackType = computed(() => {
  switch (parseInt(props.info.radio.stack.type)) {
    case 0x01:
      return 'full'
    case 0x02:
      return 'BLE_HCI'
    case 0x03:
      return 'light'
    case 0x04:
      return 'BLE_BEACON'
    case 0x05:
      return 'BLE_BASIC'
    case 0x06:
      return 'BLE_FULL_EXT_ADV'
    case 0x07:
      return 'BLE_HCI_EXT_ADV'
    case 0x10:
      return 'THREAD_FTD'
    case 0x11:
      return 'THREAD_MTD'
    case 0x30:
      return 'ZIGBEE_FFD'
    case 0x31:
      return 'ZIGBEE_RFD'
    case 0x40:
      return 'MAC'
    case 0x50:
      return 'BLE_THREAD_FTD_STATIC'
    case 0x51:
      return 'BLE_THREAD_FTD_DYAMIC'
    case 0x60:
      return '802154_LLD_TESTS'
    case 0x61:
      return '802154_PHY_VALID'
    case 0x62:
      return 'BLE_PHY_VALID'
    case 0x63:
      return 'BLE_LLD_TESTS'
    case 0x64:
      return 'BLE_RLV'
    case 0x65:
      return '802154_RLV'
    case 0x70:
      return 'BLE_ZIGBEE_FFD_STATIC'
    case 0x71:
      return 'BLE_ZIGBEE_RFD_STATIC'
    case 0x78:
      return 'BLE_ZIGBEE_FFD_DYNAMIC'
    case 0x79:
      return 'BLE_ZIGBEE_RFD_DYNAMIC'
    case 0x80:
      return 'RLV'
    case 0x90:
      return 'BLE_MAC_STATIC'
    default:
      return props.info.radio.stack.type
  }
})
const sdCardUsage = computed(() => {
  return `${bytesToSize(props.info.storage.sdcard.totalSpace - props.info.storage.sdcard.freeSpace)} / ${bytesToSize(props.info.storage.sdcard.totalSpace)}`
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
const startScreenStream = async () => {
  await props.flipper.RPC('guiStartScreenStream')
    .catch(error => rpcErrorHandler(error, 'guiStartScreenStream'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: guiStartScreenStream: OK`
      })
    })
  flags.value.screenStream = true

  const ctx = screenStreamCanvas.value.getContext('2d')
  ctx.lineWidth = 1
  ctx.lineCap = 'square'
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = '#fe8a2b'
  ctx.fillRect(0, 0, 128 * screenScale.value, 64 * screenScale.value)
  ctx.fillStyle = 'black'

  const unbind = props.flipper.emitter.on('screenStream/frame', (data, orientation) => {
    if (!data) {
      return
    }

    if (orientation && !flags.value.leftHanded) {
      flags.value.leftHanded = true
    } else if (!orientation && flags.value.leftHanded) {
      flags.value.leftHanded = false
    }

    for (let x = 0; x < 128; x++) {
      for (let y = 0; y < 64; y++) {
        const i = Math.floor(y / 8) * 128 + x
        const z = y & 7
        if (data.at(i) & (1 << z)) {
          ctx.fillStyle = 'black'
          ctx.fillRect(x * screenScale.value, y * screenScale.value, 1 * screenScale.value, 1 * screenScale.value)
        } else {
          ctx.fillStyle = '#fe8a2b'
          ctx.fillRect(x * screenScale.value, y * screenScale.value, 1 * screenScale.value, 1 * screenScale.value)
        }
      }
    }

    const unbindStop = props.flipper.emitter.on('screenStream/stop', () => {
      flags.value.screenStream = false
      unbind()
      unbindStop()
    })
  })
}
const stopScreenStream = async () => {
  await props.flipper.RPC('guiStopScreenStream')
    .catch(error => rpcErrorHandler(error, 'guiStopScreenStream'))
    .finally(() => {
      emit('log', {
        level: 'debug',
        message: `${componentName}: guiStopScreenStream: OK`
      })
    })
  flags.value.screenStream = false
}
const onUpdateStage = (stage) => {
  emit('update', stage)
  if (stage === 'start') {
    flags.value.updateInProgress = true
    stopScreenStream()
    navigator.serial.addEventListener('connect', () => {
      emit('update', 'end')
    })
  } else if (stage === 'end') {
    emit('update', 'end')
  }
}
const passNotif = (config) => {
  emit('showNotif', config)
}
const passLog = (config) => {
  emit('log', config)
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

const start = async () => {
  flags.value.rpcActive = props.rpcActive
  if (!props.rpcActive) {
    await startRpc()
  }
  if (!flags.value.screenStream) {
    await startScreenStream()
  }
}

watch(props.info, (newInfo) => {
  if (newInfo !== null && props.info.doneReading && props.connected) {
    start()
  }
})

onMounted(() => {
  if (props.info !== null && props.info.doneReading && props.connected) {
    start()
  }
  navigator.serial.addEventListener('disconnect', e => {
    flags.value.rpcActive = false
    flags.value.rpcToggling = false
    emit('setRpcStatus', false)
    flags.value.screenStream = false
  })
})

onBeforeUnmount(async () => {
  await stopScreenStream()
  await asyncSleep(3000)
})
</script>
