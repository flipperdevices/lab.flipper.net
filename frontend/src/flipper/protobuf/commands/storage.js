import { enqueue, emitter } from './core'

function info (path) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageInfoRequest',
      args: { path: path }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res.chunks[0])
      }
      unbind()
    })
  })
}

function list (path) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageListRequest',
      args: { path: path }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        if (res.chunks && res.chunks.length) {
          let buffer = []
          res.chunks.forEach(c => {
            buffer = buffer.concat(c.file)
          })
          resolve(buffer)
        }
        resolve('empty response')
      }
      unbind()
    })
  })
}

function read (path) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageReadRequest',
      args: { path: path }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        if (res.chunks.length) {
          let buffer = new Uint8Array(0)
          res.chunks.forEach(c => {
            const newBuffer = new Uint8Array(buffer.length + c.file.data.length)
            newBuffer.set(buffer)
            newBuffer.set(c.file.data, buffer.length)
            buffer = newBuffer
          })
          resolve(buffer)
        }
        resolve('empty response')
      }
      unbind()
    })
  })
}

async function write (path, buffer) {
  let commandId, lastRes
  const file = new Uint8Array(buffer)
  for (let i = 0; i <= file.byteLength; i += 512) {
    const chunk = file.slice(i, i + 512)
    const write = new Promise((resolve, reject) => {
      enqueue({
        requestType: 'storageWriteRequest',
        args: { path: path, file: { data: chunk } },
        hasNext: chunk.byteLength === 512,
        commandId: commandId
      })
      const unbind = emitter.on('response', res => {
        unbind()
        if (res && res.error) {
          reject(res.error, res)
        } else {
          resolve(res)
        }
      })
    })
    await write
      .then(res => {
        emitter.emit('storageWriteRequest/progress', {
          progress: Math.min(file.byteLength, (i + 512 - 1)),
          total: file.byteLength
        })
        lastRes = res
        commandId = res.commandId
      })
  }
  return lastRes
}

function mkdir (path) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageMkdirRequest',
      args: { path: path }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function remove (path, isRecursive) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageDeleteRequest',
      args: { path: path, recursive: isRecursive }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function rename (path, oldName, newName) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageRenameRequest',
      args: { oldPath: path + '/' + oldName, newPath: path + '/' + newName }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res)
      }
      unbind()
    })
  })
}

function stat (path) {
  return new Promise((resolve, reject) => {
    enqueue({
      requestType: 'storageStatRequest',
      args: { path: path }
    })
    const unbind = emitter.on('response', res => {
      if (res && res.error) {
        reject(res.error, res)
      } else {
        resolve(res.chunks)
      }
      unbind()
    })
  })
}

export {
  info,
  list,
  read,
  write,
  mkdir,
  remove,
  rename,
  stat
}
