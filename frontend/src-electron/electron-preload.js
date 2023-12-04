// const { contextBridge, utilityProcess } = require('electron')
import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qFlipper', {
  spawn: (args) => ipcRenderer.send('qFlipper:spawn', args),
  onLog: (callback) => ipcRenderer.on('qFlipper:log', (_event, value) => callback(value))
})

contextBridge.exposeInMainWorld('serial', {
  getPorts: () => ipcRenderer.invoke('serial:getPorts'),
  setPortFilter: filter => ipcRenderer.send('serial:setPortFilter', filter),
  getDeviceInfo: async port => {
    const result = await ipcRenderer.invoke('serial:getDeviceInfo', port)
    const lines = result.split('\r\n')
    const infoLines = lines.slice(lines.findIndex(e => e.includes('>:')) + 1, lines.findLastIndex(e => e.includes('>:')) - 1)
    const devInfo = {}
    infoLines.forEach(e => {
      const [key, value] = e.split(': ')
      devInfo[key.trim()] = value
    })
    return devInfo
  }
})
/* const { SerialPort } = require('serialport')

let port

contextBridge.exposeInMainWorld('bridge', {
  getPorts: async () => {
    const ports = await SerialPort.list()
    return ports.filter(e => e.manufacturer === 'Flipper Devices Inc.')
  },
  createPort: (path) => {
    port = new SerialPort({ path, baudRate: 1, autoOpen: false })
    port.on('readable', () => {
      const buffer = port.read()
      window.postMessage({
        type: 'read',
        buffer
      }, '*')
    })
    port.on('error', error => {
      window.postMessage({
        type: 'error',
        error
      }, '*')
    })
  },
  connect: () => {
    return new Promise((resolve, reject) => {
      port.open(error => {
        if (error) {
          reject(error)
        }
        console.log('port opened')
        resolve()
      })
    })
  },
  disconnect: () => {
    return new Promise((resolve, reject) => {
      port.close(error => {
        if (error) {
          reject(error)
        }
        console.log('port closed')
        resolve()
      })
    })
  },
  write: (data) => {
    port.write(data)
  }
}) */
