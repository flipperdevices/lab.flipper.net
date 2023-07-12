import { createNanoEvents } from 'nanoevents'
const emitter = createNanoEvents()
import { connect, disconnect, write, read, closeReader } from './serial'
import * as commands from './protobuf/commands/core'

export {
  emitter,
  connect,
  disconnect,
  write,
  read,
  closeReader,
  commands
}
