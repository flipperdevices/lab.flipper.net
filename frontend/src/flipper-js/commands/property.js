import { createRPCPromise } from '../util'

function get ({ key }) {
  function format (chunks) {
    const result = {}
    for (const chunk of chunks) {
      if (chunk.key) {
        result[chunk.key] = chunk.value
      }
    }
    return result
  }
  return createRPCPromise.bind(this)('propertyGetRequest', { key }, format)
}

export {
  get
}
