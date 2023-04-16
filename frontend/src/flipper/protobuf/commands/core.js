import * as rpc from '../rpc'
import asyncSleep from 'simple-async-sleep'
import { emitter } from '../../core'

import * as system from './system'
import * as storage from './storage'
import * as gui from './gui'

let flipper, rpcIdle = true, unbindRpcResponse, buffer = new Uint8Array(0)
const commandQueue = []

function enqueue (c) {
  commandQueue.push(c)
  if (rpcIdle) {
    sendRpcRequest()
  }
}

async function sendRpcRequest () {
  rpcIdle = false
  while (commandQueue.length) {
    const c = commandQueue[0]

    const req = rpc.createRequest(c.requestType, c.args, c.hasNext, c.commandId)
    await flipper.write('raw', req.data)

    if (c.requestType === 'stopSession') {
      const unbind = emitter.on('write/end', () => {
        emitter.emit('response', { requestType: c.requestType, commandId: c.commandId })
        unbind()
      })
    }

    commandQueue.shift()
  }
  rpcIdle = true
}

function receiveRpcResponse (data) {
  const newBuffer = new Uint8Array(buffer.length + data.length)
  newBuffer.set(buffer)
  newBuffer.set(data, buffer.length)
  buffer = newBuffer
  let res

  try {
    res = rpc.parseResponse(buffer)
  } catch (error) {
    if (!(error.toString().includes('index out of range'))) {
      if (error.toString().includes('invalid wire type') || error.toString().includes('invalid response')) {
        console.log(error.message)
        buffer = new Uint8Array()
      } else {
        throw error
      }
    }
  }

  if (res) {
    buffer = new Uint8Array(0)
    if (res.commandId === 0) {
      emitter.emit('screen frame', res.data, res.orientation)
    } else {
      emitter.emit('response', res)
    }
  }
}

async function startRpcSession (f) {
  flipper = f
  await asyncSleep(500)
  await flipper.write('cli', 'start_rpc_session\r')
  flipper.read('raw')
  await asyncSleep(500)
  unbindRpcResponse = emitter.on('raw output', receiveRpcResponse)
  return system.ping()
}

function stopRpcSession () {
  return new Promise((resolve) => {
    enqueue({
      requestType: 'stopSession',
      args: {}
    })
    const unbind = emitter.on('response', async () => {
      await asyncSleep(300)
      await flipper.closeReader()
      rpc.flushCommandQueue()
      resolve()
      unbind()
    })
    unbindRpcResponse()
  })
}

export {
  emitter,
  enqueue,
  startRpcSession,
  stopRpcSession,
  system,
  storage,
  gui
}
