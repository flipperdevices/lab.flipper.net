import { contextBridge } from 'electron'
import { SerialPort } from 'serialport'

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
})
