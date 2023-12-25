// import showNotif from 'composables/useShowNotif'
import { log } from 'composables/useLog'

const rpcErrorHandler = (componentName, error, command) => {
  error = error.toString()
  /* showNotif({
    message: `RPC error in command '${command}': ${error}`,
    color: 'negative'
  }) */
  log({
    level: 'error',
    message: `${componentName}: RPC error in command '${command}': ${error}`
  })
}

export { rpcErrorHandler }
