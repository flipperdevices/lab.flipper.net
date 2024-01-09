import { LineBreakTransformer, PromptBreakTransformer, ProtobufTransformer } from './transformers'
import { PB } from './protobufCompiled'
import { createNanoEvents } from 'nanoevents'
// import asyncSleep from 'simple-async-sleep'

import * as storage from './commands/storage'
import * as system from './commands/system'
import * as application from './commands/application'
import * as gui from './commands/gui'
import * as gpio from './commands/gpio'
import * as property from './commands/property'

const RPCSubSystems = {
  storage,
  system,
  application,
  gui,
  gpio,
  property
}

export default class Flipper {
  constructor () {
    this.emitter = createNanoEvents()
    this.path = null
    this.readable = null
    this.reader = null
    this.readingModes = {
      textRaw: {
        // electron-only
        transformer: {
          decoder: new TextDecoder(),
          transform (chunk, controller) {
            controller.enqueue(this.decoder.decode(chunk))
          }
        },
        enabled: false
      },
      lineBreak: {
        transformer: new LineBreakTransformer(),
        enabled: false
      },
      promptBreak: {
        transformer: new PromptBreakTransformer(),
        enabled: true
      },
      protobuf: {
        transformer: new ProtobufTransformer(),
        enabled: false
      },
      raw: {
        enabled: false
      }
    }
    this.cliCheckPromise = new Promise((resolve, reject) => {
      const cliCheckTimeout = setTimeout(() => {
        reject(new Error('CLI check timeout'))
      }, 2000)

      this.emitter.on('output/promptBreak', async (data) => {
        console.log('cli check', data)
        clearTimeout(cliCheckTimeout)
        resolve()
      })
      this.write('help\r')
    })
    // RPC
    this.commandQueue = [
      {
        commandId: 0,
        requestType: 'unsolicited',
        chunks: [],
        error: undefined
      }
    ]
  }

  defaultInfo () {
    this.emitter = createNanoEvents()
    this.path = null
    this.readable = null
    this.reader = null
    this.readingModes = {
      textRaw: {
        // electron-only
        transformer: {
          decoder: new TextDecoder(),
          transform (chunk, controller) {
            controller.enqueue(this.decoder.decode(chunk))
          }
        },
        enabled: false
      },
      lineBreak: {
        transformer: new LineBreakTransformer(),
        enabled: false
      },
      promptBreak: {
        transformer: new PromptBreakTransformer(),
        enabled: true
      },
      protobuf: {
        transformer: new ProtobufTransformer(),
        enabled: false
      },
      raw: {
        enabled: false
      }
    }
    this.cliCheckPromise = new Promise((resolve, reject) => {
      const cliCheckTimeout = setTimeout(() => {
        reject(new Error('CLI check timeout'))
      }, 2000)

      this.emitter.on('output/promptBreak', async (data) => {
        console.log('cli check', data)
        clearTimeout(cliCheckTimeout)
        resolve()
      })
      this.write('help\r')
    })
    // RPC
    this.commandQueue = [
      {
        commandId: 0,
        requestType: 'unsolicited',
        chunks: [],
        error: undefined
      }
    ]
  }

  async connect (path, attempts = 1) {
    return new Promise((resolve, reject) => {
      (async () => {
        if (!path) {
          const ports = await window.serial.list()
          path = ports[0].path
        }
        this.path = path

        this.readable = new ReadableStream({
          readingModes: this.readingModes,

          start (controller) {
            const modeController = {
              modeName: '',
              controller,
              enqueue (data) {
                console.log('i am a fake controlla', this.modeName, data)
                this.controller?.enqueue({
                  type: this.modeName,
                  data
                })
              }
            }

            window.serial.onData(data => {
              for (const modeName in this.readingModes) {
                const mode = this.readingModes[modeName]
                if (mode.enabled) {
                  if (mode.transformer) {
                    modeController.modeName = modeName
                    mode.transformer.transform(data, modeController)
                  } else {
                    controller.enqueue(data)
                  }
                }
              }
            })
          }
        })
        this.reader = this.readable.getReader()

        const portOpenTimeout = setTimeout(() => {
          throw new Error('Port open timeout')
        }, 2000)
        await window.serial.open(path)
          .catch(async error => {
            if (error.message.endsWith('Port is already open')) {
              await this.disconnect()
              resolve(window.serial.open(path))
            }

            reject(error)
          })
          .finally(() => clearTimeout(portOpenTimeout))

        window.serial.onClose(path => this.emitter.emit('disconnect', path))

        this.read()

        await new Promise((resolve, reject) => {
          const motdCheckTimeout = setTimeout(() => {
            reject(new Error('MOTD check timeout'))
          }, 4000)

          this.emitter.on('output/promptBreak', async (data) => {
            console.log('motd check', data)
            clearTimeout(motdCheckTimeout)
            resolve()
          })
        })

        /* await this.cliCheckPromise
          .catch(async error => {
            if (attempts > 3) {
              reject(error)
            }
            await this.disconnect()
            resolve(this.connect(path, attempts + 1))
          }) */

        resolve()
      })()
    })
  }

  async disconnect () {
    if (this.reader) {
      this.reader.cancel()
      // await this.readableStreamClosed.catch(() => {})
    }
    await window.serial.close(this.path)
  }

  async read () {
    let keepReading = true
    while (keepReading) {
      try {
        const result = await this.reader.read()
        console.log(result)
        const { type, data: value } = result.value
        if (result.done) {
          this.reader.releaseLock()
          keepReading = false
          break
        }

        if (type === 'protobuf') {
          if (value.content && value.content === 'guiScreenFrame') {
            this.emitter.emit('screenStream/frame', value.guiScreenFrame.data, value.guiScreenFrame.orientation)
          }
          const command = this.commandQueue.find(c => c.commandId === value.commandId)
          value[value.content].hasNext = value.hasNext
          command.chunks.push(value[value.content])
        } else {
          if (type === 'textRaw') {
            // compatibility with browser
            this.emitter.emit('cli/output', value)
          }
          // electron event
          this.emitter.emit(`output/${type}`, value)
        }
      } catch (error) {
        if (!error.toString().includes('Releasing Default reader')) {
          console.error(error)
        }
        keepReading = false
      }
    }
  }

  write (message) {
    return window.serial.write({ path: this.path, message })
  }

  writeRaw (message) {
    return window.serial.write({ path: this.path, message })
  }

  async setReadingMode (type, transform = '') {
    // compatibility with browser
    if (transform && this.readingModes[transform]) {
      this.readingModes[transform].enabled = true
    } else if (this.readingModes[type]) {
      this.readingModes[transform].enabled = true
    } else if (type === 'text') {
      this.readingModes.textRaw.enabled = true
    }
  }

  async startRPCSession (attempts = 1) {
    this.readingModes.promptBreak.enabled = false
    this.readingModes.textRaw.enabled = true
    this.write('start_rpc_session\r')

    const readMirroredPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('RPC session start timeout'))
      }, 3000)
      let acc = ''
      this.emitter.on('output/textRaw', async (data) => {
        acc += data
        if (acc.includes('start_rpc_session\r\n')) {
          clearTimeout(timeout)
          resolve()
        }
      })
    })
    await readMirroredPromise
      .catch(async error => {
        if (attempts > 3) {
          throw error
        }
        await this.disconnect()
        await this.connect(this.path)
        return this.startRPCSession(attempts + 1)
      })

    // consider RPC started
    this.readingModes.textRaw.enabled = false
    this.readingModes.protobuf.enabled = true

    let rpcPingAttempts = 0
    const rpcPingPromise = new Promise((resolve, reject) => {
      this.RPC('systemPing', { timeout: 300 })
        .catch(async error => {
          if (rpcPingAttempts > 3) {
            if (attempts <= 3) {
              await this.cliCheckPromise
                .catch(async error => {
                  console.error('rpc', error)
                  await this.disconnect()
                  await this.connect(this.path)
                })
              resolve(this.startRPCSession(attempts + 1))
            } else {
              reject(error)
            }
          }
          console.error(error)
          rpcPingAttempts++
          resolve(rpcPingPromise)
        })
    })
  }

  encodeRPCRequest (requestType, args, hasNext, commandId) {
    let command
    const options = { hasNext }
    options[requestType] = args || {}
    if (commandId) {
      options.commandId = commandId
      command = this.commandQueue.find(c => c.commandId === options.commandId)
    } else {
      options.commandId = this.commandQueue.length
    }

    if (!command) {
      const i = this.commandQueue.push({
        commandId: options.commandId,
        requestType: requestType,
        args: hasNext ? [args] : args
      })
      command = this.commandQueue[i - 1]
    }

    const message = PB.Main.create(options)
    const data = new Uint8Array(PB.Main.encodeDelimited(message).finish())
    return [data, command]
  }

  RPC (requestType, args) {
    const [subSystem, command] = splitRequestType(requestType)
    return RPCSubSystems[subSystem][command].bind(this)(args)
    // TODO: commandStatus
  }
}

function splitRequestType (requestType) {
  const index = requestType.search(/[A-Z]/g)
  const command = requestType.slice(index)
  return [requestType.slice(0, index), command[0].toLowerCase() + command.slice(1)]
}
