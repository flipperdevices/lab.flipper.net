import { RPC_TIMEOUT, watch } from '../util'

async function ping (requestType, args) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(`RPC timeout: ${requestType}`), RPC_TIMEOUT)
    const [data, command] = this.encodeRPCRequest(requestType, args)
    command.chunks = new Proxy([], watch(resolve, command))
    this.writeRaw(data)
  })
}

async function getDatetime (requestType, args) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(`RPC timeout: ${requestType}`), RPC_TIMEOUT)
    function formatDatetime (chunks) {
      let result = {}
      for (const chunk of chunks) {
        result = { ...result, ...chunk.datetime }
      }
      resolve(resolve(new Date(result.year, result.month - 1, result.day, result.hour, result.minute, result.second)))
    }
    const [data, command] = this.encodeRPCRequest(requestType, args)
    command.chunks = new Proxy([], watch(formatDatetime, command))
    this.writeRaw(data)
  })
}

async function deviceInfo (requestType, args) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(`RPC timeout: ${requestType}`), RPC_TIMEOUT)
    function mergeChunks (chunks) {
      const result = {}
      for (const chunk of chunks) {
        result[chunk.key] = chunk.value
      }
      resolve(result)
    }
    const [data, command] = this.encodeRPCRequest(requestType, args)
    command.chunks = new Proxy([], watch(mergeChunks, command))
    this.writeRaw(data)
  })
}

export {
  ping,
  getDatetime,
  deviceInfo
}
