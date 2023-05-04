import { PB } from './protobufCompiled'

export class LineBreakTransformer {
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

export class PromptBreakTransformer {
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

export class ProtobufTransformer {
  constructor () {
    this.chunks = new Uint8Array(0)
    this.decoder = new TextDecoder()
    this.rpcStarted = false
    this.accumulator = []
  }

  transform (chunk, controller) {
    const newBuffer = new Uint8Array(this.chunks.length + chunk.length)
    newBuffer.set(this.chunks)
    newBuffer.set(chunk, this.chunks.length)
    this.chunks = newBuffer

    if (!this.rpcStarted && this.decoder.decode(this.chunks) === 'start_rpc_session\r\n') {
      console.log('rpc started')
      this.rpcStarted = true
      this.chunks = new Uint8Array(0)
      return
    }

    try {
      const res = PB.Main.decodeDelimited(this.chunks)
      controller.enqueue(res)
      this.chunks = new Uint8Array(0)
    } catch (error) {
      if (!(error.message.includes('index out of range'))) {
        if (this.rpcStarted) {
          console.error(error)
        }
        this.chunks = new Uint8Array(0)
      }
    }
  }

  flush (controller) {
    controller.enqueue(this.chunks)
  }
}
