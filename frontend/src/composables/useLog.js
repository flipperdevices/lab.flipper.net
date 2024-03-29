import * as loglevel from 'loglevel'

const logger = loglevel
const history = []

const log = ({ level, message }) => {
  const timestamp = Date.now()
  const t = new Date(timestamp)
  history.push({
    level,
    timestamp,
    time: `${t.getHours()}:${t.getMinutes()}:${t.getSeconds()}`,
    message
  })
  switch (level) {
    case 'error':
      logger.error(message)
      break
    case 'warn':
      logger.warn(message)
      break
    case 'info':
      logger.info(message)
      break
    case 'debug':
      logger.debug(message)
      break
  }
}

export { logger, history, log }
