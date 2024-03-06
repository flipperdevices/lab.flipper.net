import { createNanoEvents } from 'nanoevents'

const bridgeController = {
  list: [],
  currentFlipper: {}
}

const emitter = createNanoEvents()
const findFlipper = (name) => {
  return bridgeController.list.find((flipper) => flipper.name === name)
}

const init = async () => {
  console.log('bridge init')
  window.bridge.onRPCRead(payload => {
    // console.log('findFlipper', payload, findFlipper(payload.name))
    const flipper = findFlipper(payload.name)
    flipper.emitter.emit('RPCRead', payload.data)
  })

  window.bridge.onCLIRead(payload => {
    const flipper = findFlipper(payload.name)
    flipper.emitter.emit('CLIRead', payload.data)
  })

  window.bridge.onList(payload => {
    payload.forEach(currentItem => {
      if (!bridgeController.list.length) {
        currentItem.emitter = createNanoEvents()
        bridgeController.list.push(currentItem)
      }

      bridgeController.list.forEach(item => {
        if (currentItem.name !== item.name) {
          currentItem.emitter = createNanoEvents()
          bridgeController.list.push(currentItem)
        }
      })
    })
    // payload.forEach(element => {
    //   element.emitter = createNanoEvents()
    // })
    // bridgeController.list = payload
    bridgeController.currentFlipper = payload[0]

    // console.log(bridgeController.list)
    emitter.emit('list', payload)
  })

  window.bridge.onLog(console.log)
  window.bridge.onExit(console.log)

  window.bridge.spawn()

  return new Promise((resolve) => {
    const unbind = emitter.on('list', list => {
      if (list.length) {
        unbind()
        resolve()
      }
    })
  })
}

const getList = () => {
  return bridgeController.list
}

const getCurrentFlipper = () => {
  return bridgeController.currentFlipper
}

const setCurrentFlipper = (name) => {
  bridgeController.currentFlipper = findFlipper(name)
  console.log('currentFlipper', bridgeController.currentFlipper)
}

export { bridgeController, emitter, init, getList, getCurrentFlipper, setCurrentFlipper }
