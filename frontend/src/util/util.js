import semver from 'semver'
import { untar } from '../untar/untar.js'
import pako from 'pako'

class Operation {
  constructor () {
    this.resolve = undefined
    this.reject = undefined
  }

  create (worker, operation, data) {
    return new Promise((resolve, reject) => {
      worker.postMessage({ operation: operation, data: data })
      this.resolve = resolve
      this.reject = reject
    })
  }

  terminate (event) {
    if (event.status === 1) {
      this.resolve(event.data)
    } else {
      this.reject(event.error)
    }
  }
}

function fetchChannels (target) {
  return fetch('https://update.flipperzero.one/firmware/directory.json')
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Failed to fetch firmware channels (' + response.status + ')')
      }
      return response.json()
    })
    .then((data) => {
      const release = data.channels.find(e => e.id === 'release')
      const rc = data.channels.find(e => e.id === 'release-candidate')
      const dev = data.channels.find(e => e.id === 'development')
      const params = new URLSearchParams(location.search)
      const customSource = {
        url: params.get('url'),
        channel: params.get('channel'),
        version: params.get('version'),
        target: params.get('target')
      }

      function formatChannel (channel) {
        channel.versions.sort((a, b) => {
          if (semver.lt(a.version, b.version)) return 1
          else return -1
        })
        const output = {
          version: '',
          date: '',
          url: '',
          files: [],
          changelog: ''
        }
        const updater = channel.versions[0].files.find(file => file.target === 'f' + target && file.type === 'update_tgz')
        if (updater) {
          output.url = updater.url
        }
        output.version = channel.versions[0].version
        output.date = new Date(channel.versions[0].timestamp * 1000).toISOString().slice(0, 10)
        output.files = channel.versions[0].files.sort((a, b) => {
          if (a.url.match(/[\w.]+$/g)[0] > b.url.match(/[\w.]+$/g)[0]) return 1
          else return -1
        })
        output.changelog = channel.versions[0].changelog
        return output
      }

      const releaseChannel = formatChannel(release)
      const rcChannel = formatChannel(rc)
      const devChannel = formatChannel(dev)

      let customChannel
      if (customSource.url) {
        customChannel = {
          channel: customSource.channel,
          version: customSource.version,
          date: new Date().toISOString().slice(0, 10),
          url: customSource.url,
          files: [{
            url: customSource.url,
            type: 'update_tgz',
            target: customSource.target
          }]
        }
      }
      return { release: releaseChannel, rc: rcChannel, dev: devChannel, custom: customChannel }
    })
}

async function fetchFirmware (url) {
  const buffer = await fetch(url)
    .then(async response => {
      if (response.status >= 400) {
        throw new Error('Failed to fetch resources (' + response.status + ')')
      }
      const buffer = await response.arrayBuffer()
      return unpack(buffer)
    })

  return buffer
}

async function fetchRegions () {
  return fetch('https://update.flipperzero.one/regions/api/v0/bundle')
    .then((response) => {
      if (response.status >= 400) {
        throw new Error('Failed to fetch firmware channels (' + response.status + ')')
      }
      return response.json()
    })
    .then(result => {
      if (result.error) {
        throw new Error(result.error.text)
      } else if (result.success) {
        return result.success
      }
    })
}

function unpack (buffer) {
  const ungzipped = pako.ungzip(new Uint8Array(buffer))
  return untar(ungzipped.buffer)
}

export {
  Operation,
  fetchChannels,
  fetchFirmware,
  fetchRegions,
  unpack
}
