import untar from 'js-untar'
import pako from 'pako'

class Operation {
  constructor () {
    this.resolve = undefined
    this.reject = undefined
  }

  create (worker, operation, data) {
    return new Promise((resolve, reject) => {
      worker.postMessage({ operation: operation, data: data })
      this.resolve = resolve
      this.reject = reject
    })
  }

  terminate (event) {
    if (event.status === 1) {
      this.resolve(event.data)
    } else {
      this.reject(event.error)
    }
  }
}

function unpack (buffer) {
  const inflate = new pako.Inflate()
  inflate.push(new Uint8Array(buffer))
  const ungzipped = inflate.result
  return untar(ungzipped.buffer)
}

export {
  Operation,
  unpack
}
