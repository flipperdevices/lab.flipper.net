import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('qFlipper', {
  spawn: args => ipcRenderer.send('qFlipper:spawn', args),
  onLog: callback => ipcRenderer.on('qFlipper:log', (_event, value) => callback(value))
})

contextBridge.exposeInMainWorld('serial', {
  list: (filter = { manufacturer: 'Flipper Devices Inc.' }) => ipcRenderer.invoke('serial:list', filter),
  open: path => ipcRenderer.invoke('serial:open', path),
  close: path => {
    ipcRenderer.removeAllListeners()
    return ipcRenderer.invoke('serial:close', path)
  },
  onData: callback => {
    return ipcRenderer.on('serial:data', (_event, value) => {
      callback(value)
    })
  },
  write: ({ path, message }) => ipcRenderer.invoke('serial:write', { path, message }),
  isOpen: path => ipcRenderer.invoke('serial:isOpen', path)
})
