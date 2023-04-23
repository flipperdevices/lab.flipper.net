onmessage = function (e) {
  switch (e.data.message) {
    case 'connect':
      connect()
      break
    case 'disconnect':
      closePort()
      break
    case 'reopenPort':
      reopenPort()
      break
  }
}

let port

async function connect () {
  // TODO: full connection flow
  const ports = await navigator.serial.getPorts({ filters: this.filters })
  port = ports[0]
  return openPort()
}

async function openPort () {
  await port.open({ baudRate: 1 })
  self.postMessage({
    message: 'getReadableStream',
    stream: port.readable
  }, [port.readable])
  self.postMessage({
    message: 'getWritableStream',
    stream: port.writable
  }, [port.writable])
}

async function closePort () {
  await port.close()
}

async function reopenPort () {
  await closePort()
  return openPort()
}
