import { Operation } from './util'
import * as flipper from './core'

const operation = new Operation()
const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

const serial = new Worker(new URL('./workers/webSerial.js', import.meta.url))
serial.onmessage = (e) => {
  if (e.data.operation === 'cli output') {
    flipper.emitter.emit('cli output', e.data.data)
  } else if (e.data.operation === 'raw output') {
    flipper.emitter.emit('raw output', e.data.data)
  } else if (e.data.operation === 'write/end') {
    flipper.emitter.emit('write/end')
  } else {
    operation.terminate(e.data)
  }
}

async function connect () {
  const ports = await navigator.serial.getPorts({ filters })
  if (ports.length === 0) {
    throw new Error('No known ports')
  }
  const connect = operation.create(serial, 'connect')
  await connect
}

async function disconnect () {
  const disconnect = operation.create(serial, 'disconnect')
  await disconnect
}

async function write (mode, data) {
  if (mode !== 'raw') {
    const write = operation.create(serial, 'write', { mode: mode, data: [data] })
    await write
  } else {
    serial.postMessage({ operation: 'write', data: { mode: mode, data: [data] } })
  }
}

function read (mode) {
  serial.postMessage({ operation: 'read', data: mode })
}

function closeReader () {
  serial.postMessage({ operation: 'stop reading' })
}

export {
  connect,
  disconnect,
  write,
  read,
  closeReader
}
