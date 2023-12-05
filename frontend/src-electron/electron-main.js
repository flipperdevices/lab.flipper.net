import { app, BrowserWindow, nativeTheme, utilityProcess, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import { SerialPort } from 'serialport'

const serialPortFilter = {
  manufacturer: 'Flipper Devices Inc.'
}

const qFlipper = {
  spawn (event, args) {
    try {
      const webContents = event.sender
      const cliProcess = utilityProcess.fork(path.resolve(__dirname, 'extraResources/qflipper/cli/process.js'))
      cliProcess.postMessage({ args })
      cliProcess.on('message', data => webContents.send('qFlipper:log', data))
    } catch (error) {
      console.error(error)
    }
  }
}

const serial = {
  async getPorts (event) {
    try {
      const ports = await SerialPort.list()
      return ports.filter(e => {
        for (const [key, value] of Object.entries(serialPortFilter)) {
          if (e[key] !== value) {
            return false
          }
        }
        return true
      })
    } catch (error) {
      console.error(error)
    }
  },
  setPortFilter (event, filter) {
    for (const [key, value] of Object.entries(filter)) {
      if (value) {
        serialPortFilter[key] = value
      } else {
        delete serialPortFilter[key]
      }
    }
  },
  // rework
  getDeviceInfo (event, port) {
    try {
      const serialPort = new SerialPort({ path: port.path, baudRate: 1, autoOpen: false })
      return new Promise((resolve, reject) => {
        let result = ''
        const decoder = new TextDecoder()

        serialPort.open(error => {
          if (error) {
            reject(error)
          }
          serialPort.write('!\r', error => {
            if (error) {
              reject(error)
            }
            serialPort.on('readable', () => {
              const buffer = serialPort.read()
              result += decoder.decode(buffer)
            })
          })
        })

        setTimeout(() => {
          try {
            serialPort.close()
          } catch {}
          resolve(result)
        }, 1000)
      })
    } catch (error) {
      console.error(error)
    }
  }
}

// needed in case process is undefined under Linux
const platform = process.platform || os.platform()

try {
  if (platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

let mainWindow

async function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    icon: path.resolve(__dirname, 'icons/icon.png'), // tray icon
    width: 1000,
    height: 600,
    useContentSize: true,
    sandbox: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.showInactive()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.session.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'serial') {
      return true
    }
    return false
  })
  mainWindow.webContents.session.setDevicePermissionHandler((details) => {
    if (details.deviceType === 'serial') {
      if (details.device.vendorId === 1155 && details.device.productId === 22336) {
        console.log(details.device)
        // Always allow this type of device (this allows skipping the call to `navigator.serial.requestPort` first)
        return true
      }
    }
    return true
  })
  mainWindow.webContents.session.on('select-serial-port', (event, portList, webContents, callback) => {
    console.log(portList, callback)
    event.preventDefault()
    const selectedPort = portList.filter(e => {
      for (const [key, value] of Object.entries(serialPortFilter)) {
        if (e[key] !== value) {
          return false
        }
      }
      return true
    })
    if (!selectedPort) {
      // eslint-disable-next-line node/no-callback-literal
      callback('')
    } else {
      callback(selectedPort.portId)
    }
  })
}

app.whenReady()
  .then(() => {
    ipcMain.on('qFlipper:spawn', qFlipper.spawn)
    ipcMain.on('serial:setPortFilter', serial.setPortFilter)
    ipcMain.handle('serial:getPorts', serial.getPorts)
    ipcMain.handle('serial:getDeviceInfo', serial.getDeviceInfo)
    createWindow()
  })

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
