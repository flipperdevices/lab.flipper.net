import * as rpc from '../rpc'
import asyncSleep from 'simple-async-sleep'
import { emitter } from '../../core'

import * as system from './system'
import * as storage from './storage'
import * as gui from './gui'

let flipper, rpcIdle = true
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

    let res = { commandId: req.commandId }
    if (c.requestType === 'guiStartScreenStreamRequest') {
      res = { commandId: 0 }
      let streaming = true
      let prevFrame
      while (streaming) {
        let buffer = new Uint8Array(0)
        const unbind = emitter.on('raw output', data => {
          const newBuffer = new Uint8Array(buffer.length + data.length)
          newBuffer.set(buffer)
          newBuffer.set(data, buffer.length)
          buffer = newBuffer
        })
        let oldLength = 0, newLength = 1
        while (oldLength < newLength) {
          await asyncSleep(75)
          oldLength = newLength
          newLength = buffer.length
        }

        if (buffer.length && buffer !== prevFrame) {
          res = rpc.parseResponse(buffer)
          buffer = new Uint8Array(0)
        }
        prevFrame = buffer

        unbind()
        emitter.emit('response', res)
        const unbindStop = emitter.on('stop screen streaming', () => {
          streaming = false
          unbindStop()
        })
      }
    } else if (!c.hasNext && c.requestType !== 'stopSession') {
      let buffer = new Uint8Array(0)
      const unbind = emitter.on('raw output', data => {
        const newBuffer = new Uint8Array(buffer.length + data.length)
        newBuffer.set(buffer)
        newBuffer.set(data, buffer.length)
        buffer = newBuffer
      })
      let oldLength = 0, newLength = 1
      while (oldLength < newLength) {
        await asyncSleep(350)
        oldLength = newLength
        newLength = buffer.length
      }
      if (buffer.length) {
        res = rpc.parseResponse(buffer)
        buffer = new Uint8Array(0)
      }
      unbind()
      emitter.emit('response', res)
    } else {
      const unbind = emitter.on('write/end', () => {
        emitter.emit('response', res)
        unbind()
      })
    }
    commandQueue.shift()
  }

  rpcIdle = true
}

async function startRpcSession (f) {
  flipper = f
  await asyncSleep(500)
  await flipper.write('cli', 'start_rpc_session\r')
  flipper.read('raw')
  await asyncSleep(500)
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
