import { Operation } from '../util'
const operation = new Operation()
let mfkey

async function startMfkey (args) {
  mfkey = new Worker(new URL('./mfkey-worker.js', import.meta.url))
  const start = operation.create(mfkey, 'start', JSON.parse(JSON.stringify(args)))
  mfkey.onmessage = (e) => {
    if (e.data.operation === 'output') {
      operation.terminate({ status: 1, data: e.data.data })
      mfkey.terminate()
    } else if (e.data.operation === 'error') {
      operation.terminate({ status: 0, data: e.data.data })
      mfkey.terminate()
    }
  }
  return start
}

function forceStopMfkey () {
  mfkey.terminate()
  mfkey = null
}

export {
  startMfkey,
  forceStopMfkey
}
