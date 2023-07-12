import { enqueue, emitter } from './core'

function ping () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemPingRequest',
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

function getDatetime () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemGetDatetimeRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        if (res.chunks && res.chunks[0] && res.chunks[0].datetime) {
          const dt = res.chunks[0].datetime
          resolve(new Date(dt.year, dt.month - 1, dt.day, dt.hour, dt.minute, dt.second))
        }
        resolve('empty response')
      }
      unbind()
    })
  })
}

function setDatetime (date) {
  const datetime = {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    day: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
    weekday: date.getDay() || 7
  }
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemSetDatetimeRequest',
      args: {
        datetime: datetime
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

function reboot (mode) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemRebootRequest',
      args: {
        mode: mode
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

function deviceInfo () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemDeviceInfoRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res.chunks)
      }
      unbind()
    })
  })
}

function powerInfo () {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemPowerInfoRequest',
      args: {}
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res.chunks)
      }
      unbind()
    })
  })
}

function update (manifest) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'systemUpdateRequest',
      args: {
        updateManifest: manifest
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
  ping,
  getDatetime,
  setDatetime,
  reboot,
  deviceInfo,
  powerInfo,
  update
}
