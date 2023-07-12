onmessage = function (event) {
  switch (event.data.operation) {
    case 'connect':
      connect()
      break
    case 'disconnect':
      disconnect()
      break
    case 'read':
      read(event.data.data)
      break
    case 'stop reading':
      reader.cancel()
      break
    case 'write':
      enqueue(event.data.data)
      break
  }
}

let port, reader, readComplete = false, writerIdle = true
const writeQueue = []

async function connect () {
  const filters = [
    { usbVendorId: 0x0483, usbProductId: 0x5740 }
  ]
  const ports = await navigator.serial.getPorts({ filters })
  port = ports[0]
  port.open({ baudRate: 1 })
    .then(() => {
      self.postMessage({
        operation: 'connect',
        status: 1
      })
    })
    .catch(async error => {
      if (error.toString().includes('The port is already open')) {
        await port.close()
        return connect()
      } else {
        self.postMessage({
          operation: 'connect',
          status: 0,
          error: error
        })
      }
    })
}

function disconnect () {
  if (port && !port.closed) {
    port.close()
      .then(() => {
        self.postMessage({
          operation: 'disconnect',
          status: 1
        })
      })
      .catch(error => {
        if (!(error.toString().includes('The port is already closed.'))) {
          self.postMessage({
            operation: 'disconnect',
            status: 0,
            error: error
          })
        }
      })
  }
}

function enqueue (entry) {
  writeQueue.push(entry)
  if (writerIdle) {
    write()
  }
}

async function write () {
  writerIdle = false
  while (writeQueue.length) {
    const entry = writeQueue[0]
    if (!port.writable) {
      self.postMessage({
        operation: 'write',
        status: 0,
        error: 'Writable stream closed'
      })
      return
    }
    const writer = port.writable.getWriter()

    if (entry.mode.startsWith('cli')) {
      if (entry.mode === 'cli/delimited') {
        entry.data.push('\r\n')
      }
      const encoder = new TextEncoder()
      entry.data.forEach(async (line, i) => {
        let message = line
        if (entry.data[i + 1]) {
          message = line + '\r\n'
        }
        await writer.write(encoder.encode(message).buffer)
      })
    } else if (entry.mode === 'raw') {
      await writer.write(entry.data[0].buffer)
    } else {
      throw new Error('Unknown write mode:', entry.mode)
    }

    await writer.close()
      .then(() => {
        writeQueue.shift()
        self.postMessage({
          operation: 'write/end'
        })
        self.postMessage({
          operation: 'write',
          status: 1
        })
      })
      .catch(error => {
        self.postMessage({
          operation: 'write',
          status: 0,
          error: error
        })
      })
  }
  writerIdle = true
}

async function read (mode) {
  try {
    reader = port.readable.getReader()
  } catch (error) {
    self.postMessage({
      operation: 'read',
      status: 0,
      error: error
    })
    if (!error.toString().includes('locked to a reader')) {
      throw error
    }
  }
  const decoder = new TextDecoder()
  let buffer = new Uint8Array(0)
  readComplete = false

  while (!readComplete) {
    await reader.read()
      .then(({ done, value }) => {
        if (done) {
          readComplete = true
        } else {
          if (mode) {
            self.postMessage({
              operation: mode + ' output',
              data: value
            })
          } else {
            const newBuffer = new Uint8Array(buffer.length + value.length)
            newBuffer.set(buffer)
            newBuffer.set(value, buffer.length)
            buffer = newBuffer

            if (decoder.decode(buffer.slice(-12)).replace(/\s/g, '').endsWith('>:\x07')) {
              readComplete = true
              self.postMessage({
                operation: 'read',
                data: 'read',
                status: 1
              })
            }
          }
        }
      })
      .catch(error => {
        if (error.toString().includes('The device has been lost.')) {
          readComplete = true
        } else {
          throw error
        }
      })
  }
  await reader.cancel()
    .then(() => {
      self.postMessage({
        operation: 'read',
        status: 1,
        data: buffer
      })
    })
    .catch(error => {
      self.postMessage({
        operation: 'read',
        status: 0,
        error: error
      })
    })
}
