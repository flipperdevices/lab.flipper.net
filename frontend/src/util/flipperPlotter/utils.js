const selector = (elementOrSelector) => {
  if (!elementOrSelector) {
    return null
  }

  if (typeof elementOrSelector === 'string') {
    return document.querySelector(elementOrSelector)
  }

  return elementOrSelector
}

export { selector }
