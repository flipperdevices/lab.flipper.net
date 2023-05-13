import { createRPCPromise } from '../util'

function isObject (item) {
  return (item && typeof item === 'object' && !Array.isArray(item))
}
function mergeDeep (target, ...sources) {
  if (!sources.length) return target
  const source = sources.shift()
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }
  return mergeDeep(target, ...sources)
}
function expand (str, defaultVal = {}) {
  return str.split('.').reduceRight((acc, currentVal) => {
    return {
      [currentVal]: acc
    }
  }, defaultVal)
}

function get ({ key }) {
  function format (chunks) {
    const accumulator = {}
    let result = {}
    for (const chunk of chunks) {
      if (chunk.key) {
        accumulator[chunk.key] = chunk.value
      }
    }
    for (const line of Object.keys(accumulator)) {
      const expanded = expand(line, accumulator[line])
      result = mergeDeep(result, expanded)
    }
    return result
  }
  return createRPCPromise.bind(this)('propertyGetRequest', { key }, format)
}

export {
  get
}
