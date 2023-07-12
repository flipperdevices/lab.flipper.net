import { enqueue, emitter } from './core'

function startVirtualDisplay (firstFrame) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiStartVirtualDisplayRequest',
      args: {
        firstFrame: firstFrame
      }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function stopVirtualDisplay () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiStopVirtualDisplayRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function startScreenStreamRequest () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiStartScreenStreamRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function stopScreenStreamRequest () {
  emitter.emit('stop screen streaming')
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiStopScreenStreamRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function screenFrame (data) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiScreenFrame',
      args: {
        data: data
      }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function sendInputEvent (key, type) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'guiSendInputEventRequest',
      args: {
        key: key,
        type: type
      }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

export {
  startVirtualDisplay,
  stopVirtualDisplay,
  startScreenStreamRequest,
  stopScreenStreamRequest,
  screenFrame,
  sendInputEvent
}
