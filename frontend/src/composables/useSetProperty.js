const setProperty = (obj, options) => {
  const keys = Object.keys(options)

  keys.forEach((key) => {
    const value = options[key]

    if (typeof value === 'object') {
      if (!obj[key]) {
        obj[key] = {}
      }
      setProperty(obj[key], options[key])
    } else {
      obj[key] = value
    }
  })

  return obj
}

export default setProperty
