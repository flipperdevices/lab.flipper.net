const beforeUnloadHandler = (event) => {
  // Recommended
  event.preventDefault()

  // Included for legacy support, e.g. Chrome/Edge < 119
  event.returnValue = true
}

const beforunloadActive = () => {
  window.addEventListener('beforeunload', beforeUnloadHandler)
}

const beforunloadDeactivate = () => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
}

export { beforunloadActive, beforunloadDeactivate }
