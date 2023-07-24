import semver from 'semver'
import { untar } from '../untar/untar.js'
import pako from 'pako'
import _ from 'lodash'

let API_ENDPOINT = process.env.ARCHIVARIUS_API_ENDPOINT
if (localStorage.getItem('catalogChannel') !== null) {
  if (localStorage.getItem('catalogChannel') === 'production') {
    API_ENDPOINT = 'https://catalog.flipperzero.one/api/v0'
  } else {
    API_ENDPOINT = 'https://catalog.flipp.dev/api/v0'
  }
}

function camelCaseDeep (object) {
  return Object.fromEntries(Object.entries(object).map(e => {
    if (!!e[1] && typeof e[1] === 'object') {
      e[1] = camelCaseDeep(e[1])
    }
    return [_.camelCase(e[0]), e[1]]
  }))
}

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
        throw new Error('Failed to fetch region (' + response.status + ')')
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

function bytesToSize (bytes) {
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB']
  if (bytes === 0) return 'n/a'
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)
  if (i === 0) return `${bytes} ${sizes[i]})`
  return `${(bytes / (1024 ** i)).toFixed(1)}${sizes[i]}`
}

async function fetchCategories (params) {
  const res = await fetch(`${API_ENDPOINT}/category?${new URLSearchParams({ ...params }).toString()}`).then(res => res.json())
  const categories = res.map(category => camelCaseDeep(category))
  return categories
}

async function fetchAppsShort (params) {
  const res = await fetch(`${API_ENDPOINT}/application?${new URLSearchParams({ ...params }).toString()}`).then(res => res.json())
  const apps = res.map(app => camelCaseDeep(app))
  return apps
}

async function fetchAppById (id, params) {
  if (!params.target) {
    delete params.target
  }
  if (!params.api) {
    delete params.api
  }
  const res = await fetch(`${API_ENDPOINT}/application/${id}?${new URLSearchParams({ ...params }).toString()}`).then(res => res.json())
  return camelCaseDeep(res)
}

async function fetchAppFap (params) {
  const file = await fetch(`${API_ENDPOINT}/application/version/${params.versionId}/build/compatible?${new URLSearchParams({ target: params.target, api: params.api }).toString()}`)
    .then((res) => {
      if (res.status >= 400) {
        throw new Error('Failed to fetch application build (' + res.status + ')')
      }
      return res.arrayBuffer()
    })
  return file
}

async function fetchAppsVersions (uids) {
  let query = ''
  for (const uid of uids) {
    query += 'uid=' + uid + '&'
  }
  const res = await fetch(`${API_ENDPOINT}/application/versions?${query}`).then(res => res.json())
  const versions = res.map(version => camelCaseDeep(version))
  return versions
}

async function submitAppReport (id, report) {
  return fetch(`${API_ENDPOINT}/application/${id}/issue`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(report)
  })
}

export {
  camelCaseDeep,
  Operation,
  fetchChannels,
  fetchFirmware,
  fetchRegions,
  unpack,
  bytesToSize,
  fetchCategories,
  fetchAppsShort,
  fetchAppById,
  fetchAppFap,
  fetchAppsVersions,
  submitAppReport
}
