import { PB } from './proto-compiled'
import * as protobuf from 'protobufjs/minimal'

export default class Flipper {
  constructor ({
    filters = [{ usbVendorId: 1155, usbProductId: 22336 }]
  } = {}) {
    this.filters = filters

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
      console.log(value)
    }
  }

  async write (message) {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(message)
    await this.writer.write(encoded)
  }

  async writeRaw (message) {
    await this.writer.write(message)
  }
}

class LineBreakTransformer {
  constructor () {
    this.chunks = ''
  }

  transform (chunk, controller) {
    this.chunks += chunk
    const lines = this.chunks.split('\r\n')
    this.chunks = lines.pop()
    lines.forEach((line) => controller.enqueue(line))
  }

  flush (controller) {
    controller.enqueue(this.chunks)
  }
}

class PromptBreakTransformer {
  constructor () {
    this.chunks = ''
  }

  transform (chunk, controller) {
    this.chunks += chunk
    const outputs = this.chunks.split('>:')
    this.chunks = outputs.pop()
    outputs.forEach((output) => controller.enqueue(output))
  }

  flush (controller) {
    controller.enqueue(this.chunks)
  }
}

class ProtobufTransformer {
  constructor () {
    console.log(protobuf)
    console.log(PB)
    // this.maxMessageLength = 4096
    // this.chunks = protobuf.Buffer.alloc(2 * this.maxMessageLength)
    this.chunks = new Uint8Array(0)
  }

  transform (chunk, controller) {
    // console.log(chunk)
    // this.chunks.append(chunk)
    const newBuffer = new Uint8Array(this.chunks.length + chunk.length)
    newBuffer.set(this.chunks)
    newBuffer.set(chunk, this.chunks.length)
    this.chunks = newBuffer
    console.log(this.chunks)

    try {
      const res = PB.Main.decodeDelimited(this.chunks)
      controller.enqueue(res)
      /* if (this.chunks.offset > this.maxMessageLength) {
        this.chunks.compact().resize(2 * this.maxMessageLength)
      } */
    } catch (error) {
      if (!(error.message.includes('index out of range'))) {
        console.error(error)
        this.chunks = new Uint8Array(0)
      }
    }
  }

  flush (controller) {
    controller.enqueue(this.chunks)
  }
}
