export const SERIAL_TIMEOUT = 10000
export const RPC_TIMEOUT = 15000

export function watch (callback, emitter, requestType) {
  const validator = {
    set: (target, key, value) => {
      target[key] = value
      if (typeof (value) === 'object') {
        if (emitter) {
          emitter.emit(requestType + '/progress', key)
        }
        if (!value.hasNext) {
          delete value.hasNext
          callback(target)
        }
      }
      delete value.hasNext
      return true
    }
  }
  return validator
}

export function createRPCPromise (requestType, args, format, emitter, timeout) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(`RPC timeout: ${requestType}`), timeout || RPC_TIMEOUT)
    function callback (chunks) {
      let result
      if (format) {
        result = format(chunks)
      } else {
        if (chunks.length === 1) {
          result = chunks[0]
        } else {
          result = chunks
        }
      }
      resolve(result)
    }
    const [data, command] = this.encodeRPCRequest(requestType, args)
    command.chunks = new Proxy([], watch(callback, emitter, requestType))
    this.writeRaw(data)
  })
}
