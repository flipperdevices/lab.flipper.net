import { LineBreakTransformer, PromptBreakTransformer, ProtobufTransformer } from './transformers'
import { PB } from './proto-compiled'
import * as system from './commands/system'

export default class Flipper {
  constructor ({
    filters = [{ usbVendorId: 1155, usbProductId: 22336 }]
  } = {}) {
    // Device VID/PID
    this.filters = filters
    // Serial
    this.serialWorker = new Worker(new URL('./serialWorker.js', import.meta.url))
    this.serialWorker.onmessage = (e) => {
      switch (e.data.message) {
        case 'getReadableStream':
          this.readable = e.data.stream
          this.getReader()
          break
        case 'getWritableStream':
          this.writable = e.data.stream
          this.getWriter()
          break
      }
    }
    this.readable = null
    this.reader = null
    this.readingMode = {
      type: 'text',
      transform: 'promptBreak'
    }
    this.writable = null
    this.writer = null
    // RPC
    this.commandQueue = [
      {
        commandId: 0,
        requestType: 'unsolicited',
        chunks: [],
        error: undefined
      }
    ]

    this.RPCSubSystems = {
      system
    }
  }

  getReader () {
    if (this.readingMode.type === 'text') {
      // eslint-disable-next-line no-undef
      const textDecoder = new TextDecoderStream()
      this.readableStreamClosed = this.readable.pipeTo(textDecoder.writable)

      if (this.readingMode.transform.length) {
        let transformer
        switch (this.readingMode.transform) {
          case 'lineBreak':
            transformer = new LineBreakTransformer()
            break
          case 'promptBreak':
            transformer = new PromptBreakTransformer()
            break
          default:
            throw new Error('Invalid reading mode')
        }

        this.reader = textDecoder.readable
          .pipeThrough(new TransformStream(transformer))
          .getReader()
      } else {
        this.reader = textDecoder.readable.getReader()
      }
    } else if (this.readingMode.type === 'raw') {
      if (this.readingMode.transform.length) {
        let transformer
        switch (this.readingMode.transform) {
          case 'protobuf':
            transformer = new ProtobufTransformer()
            break
          default:
            throw new Error('Invalid reading mode')
        }

        this.reader = this.readable
          .pipeThrough(new TransformStream(transformer))
          .getReader()
      } else {
        this.reader = this.readable.getReader()
      }
    } else {
      throw new Error('Invalid reading mode')
    }

    this.read()
  }

  async setReadingMode (type, transform = '') {
    if (!type) {
      return
    }
    this.readingMode.type = type
    this.readingMode.transform = transform

    this.reader.cancel()
    if (this.readableStreamClosed) {
      await this.readableStreamClosed.catch(() => {})
    }

    await this.writer.close()
    await this.writer.releaseLock()

    setTimeout(() => this.serialWorker.postMessage({ message: 'reopenPort' }), 1)
  }

  getWriter () {
    this.writer = this.writable.getWriter()
  }

  connect () {
    // TODO: full connection flow
    this.serialWorker.postMessage({ message: 'connect' })
  }

  async disconnect () {
    // TODO: await for disconnect to complete
    this.reader.cancel()
    if (this.readableStreamClosed) {
      await this.readableStreamClosed.catch(() => {})
    }

    await this.writer.close()
    await this.writer.releaseLock()

    setTimeout(() => this.serialWorker.postMessage({ message: 'disconnect' }), 1)
  }

  async read () {
    while (true) {
      const { value, done } = await this.reader.read()
      if (done) {
        this.reader.releaseLock()
        break
      }

      if (this.readingMode.transform === 'protobuf') {
        const res = value
        const command = this.commandQueue.find(c => c.commandId === res.commandId)
        res[res.content].hasNext = res.hasNext
        command.chunks.push(res[res.content])
      } else {
        console.log(value)
      }
    }
  }

  write (message) {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(message)
    return this.writer.write(encoded)
  }

  writeRaw (message) {
    return this.writer.write(message)
  }

  async startRPCSession () {
    await this.setReadingMode('raw', 'protobuf')
    setTimeout(() => this.write('start_rpc_session\r'), 300)
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
        args: hasNext ? [args] : args,
        error: undefined
      })
      command = this.commandQueue[i - 1]
    }

    const message = PB.Main.create(options)
    const data = new Uint8Array(PB.Main.encodeDelimited(message).finish())
    return [data, command]
  }

  RPC (requestType, args) {
    const [subSystem, command] = splitRequestType(requestType)
    this.RPCSubSystems[subSystem][command].bind(this)(requestType, args)
      .then(command => {
        console.log(command)
      })
  }
}

function splitRequestType (requestType) {
  const index = requestType.search(/[A-Z]/g)
  const command = requestType.slice(index, requestType.indexOf('Request'))
  return [requestType.slice(0, index), command[0].toLowerCase() + command.slice(1)]
}
