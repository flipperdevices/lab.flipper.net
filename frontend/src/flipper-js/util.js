export const RPC_TIMEOUT = 15000

export function watch (cb) {
  const validator = {
    set: (target, key, value) => {
      target[key] = value
      if (typeof (value) === 'object' && !value.hasNext) {
        delete value.hasNext
        cb(target)
      }
      delete value.hasNext
      return true
    }
  }
  return validator
}
