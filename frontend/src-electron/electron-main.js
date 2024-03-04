import { app, BrowserWindow, nativeTheme, utilityProcess, ipcMain } from 'electron'
import path from 'path'
import os from 'os'
import { SerialPort } from 'serialport'
const extraResourcesPath = process.env.WEBPACK_SERVE === 'true' ? 'extraResources' : '../extraResources'

// eslint-disable-next-line no-unused-vars
const qFlipper = {
  spawn (event, args) {
    try {
      const webContents = event.sender
      const cliProcess = utilityProcess.fork(path.resolve(__dirname, extraResourcesPath, 'qflipper/cli/process.js'))
      cliProcess.postMessage({ args })
      cliProcess.on('message', data => webContents.send('qFlipper:log', data))
    } catch (error) {
      console.error(error)
    }
  }
}

const bridge = {
  process: null,
  async spawn (event) {
    if (this.process) {
      await this.kill()
    }

    try {
      const webContents = event.sender
      this.process = utilityProcess.fork(path.resolve(__dirname, extraResourcesPath, 'serial-bridge/bridgeProcess.js'))
      this.process.on('message', data => webContents.send('bridge:message', data))
    } catch (error) {
      console.error(error)
    }
  },
  async kill (event) {
    return new Promise((resolve, reject) => {
      try {
        if (this.process) {
          this.process.postMessage({ type: 'kill' })
          const killTimeout = setTimeout(() => {
            this.process.kill()
            console.log('killed bridge process on timeout')
            if (event) {
              const webContents = event.sender
              webContents.send('bridge:message', { type: 'exit', code: null, timeout: true })
            }
            resolve()
          }, 1000)

          this.process.on('message', data => {
            if (data.type === 'exit') {
              clearTimeout(killTimeout)
              resolve()
            }
          })
        }
      } catch (error) {
        reject(error)
      }
    })
  },
  send (event, json) {
    try {
      if (this.process && json) {
        this.process.postMessage({ type: 'stdin', json })
      }
    } catch (error) {
      console.error(error)
    }
  }
}

let ports = []
// eslint-disable-next-line no-unused-vars
const serial = {
  async list (event, filter) {
    try {
      const ports = await SerialPort.list()
      return ports.filter(e => {
        for (const [key, value] of Object.entries(filter)) {
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
  open (event, path) {
    try {
      const webContents = event.sender
      return new Promise((resolve, reject) => {
        const existingPort = ports.find(e => e.path === path)
        const port = existingPort || new SerialPort({ path, baudRate: 1, autoOpen: false, endOnClose: true })
        port.open()

        port.handlers = {
          onOpen: () => {
            if (!existingPort) {
              ports.push(port)
            }
            webContents.send('serial:onOpen', path)
            resolve(port.readable)
          },
          onClose: () => {
            // console.log(`onClose ${path}`)
            webContents.send('serial:onClose', path)
          },
          onData: data => {
            webContents.send('serial:onData', data)
          },
          onError: error => {
            reject(error.message)
          }
        }
        port.on('open', port.handlers.onOpen)
        port.on('data', port.handlers.onData)
        port.on('error', port.handlers.onError)
        port.on('close', port.handlers.onClose)
      })
    } catch (error) {
      console.error('error', error)
      return error
    }
  },
  close (event, path) {
    try {
      return new Promise((resolve, reject) => {
        const port = ports.find(e => e.path === path)
        if (!port) {
          reject('Port not found')
        }
        // UNCOMMENT IF NEEDED port.removeAllListeners()
        // port.removeListener('data', port.handlers.onData)
        port.close(error => {
          if (error) {
            reject(error.message)
          }
          ports = ports.filter(e => e.path !== path)
          resolve(true)
        })
      })
    } catch (error) {
      console.error(error)
    }
  },
  write (event, { path, message }) {
    try {
      return new Promise((resolve, reject) => {
        const port = ports.find(e => e.path === path)
        if (!port) {
          reject('Port not found')
        }
        port.write(message, error => {
          if (error) {
            reject(error.message)
          }
          resolve(true)
        })
      })
    } catch (error) {
      console.error(error)
    }
  },
  isOpen (event, path) {
    try {
      return new Promise((resolve, reject) => {
        const port = ports.find(e => e.path === path)
        resolve(!!port?.isOpen)
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
    if (process.env.PRODUCTION) {
      mainWindow.webContents.on('devtools-opened', () => {
        mainWindow.webContents.closeDevTools()
      })
    }
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.showInactive()
  })

  mainWindow.on('closed', () => {
    ports.filter(port => port.isOpen).forEach(port => {
      port.removeAllListeners()
      port.close()
    })
    ports = []
    mainWindow = null
  })
}

app.whenReady()
  .then(() => {
    /*
    ipcMain.on('qFlipper:spawn', qFlipper.spawn)
    ipcMain.handle('serial:list', serial.list)
    ipcMain.handle('serial:open', serial.open)
    ipcMain.handle('serial:close', serial.close)
    ipcMain.handle('serial:write', serial.write)
    ipcMain.handle('serial:isOpen', serial.isOpen)
    */

    /*
      Usage (browser side):

      bridge.onMessage(console.log)
      bridge.spawn()
      bridge.send({
        id: 1,
        type: 'write',
        name: 'Amogus',
        data: btoa('led bl 128\r'),
        mode: 'cli'
      })
    */

    ipcMain.on('bridge:spawn', bridge.spawn)
    ipcMain.on('bridge:kill', bridge.kill)
    ipcMain.on('bridge:send', bridge.send)

    createWindow()
  })

app.on('window-all-closed', () => {
  if (platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', async () => {
  // FIXME doesn't work
  await bridge.kill()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
