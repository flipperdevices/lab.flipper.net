/* eslint-disable camelcase */
/**
    @file Pulse Data Viewer JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/* eslint no-console: "off" */

import { autorange, autorange_time } from './autorange.js'

import { selector, lookup, strip } from './utils.js'

import { DropZone } from './dropzone.js'

import { Analyzer } from './histogram.js'
import { sliceGuess } from './slicer.js'
import { PulseBuilder } from './builder.js'
import { RfRaw } from './rfraw.js'

function readFile (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => {
      reject(reader.error)
    }
    reader.onload = () => {
      resolve(reader.result)
    }
    reader.readAsText(file)
  })
}

// Check for the various File API support.
if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  alert('The File APIs are not fully supported in this browser.')
}

let resizeTimer

window.addEventListener('resize', function () {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(function () {
    // Dispatch the event.
    const event = new Event('debouncedResize')
    window.dispatchEvent(event)
  }, 250)
}, false)

/**
    Possible slicer values.
    @readonly
    @enum {string}
*/
const Slicers = {
  PCM: 'PCM',
  PWM: 'PWM',
  PPM: 'PPM',
  MC: 'MC',
  DM: 'DM',
  NRZI: 'NRZI',
  CMI: 'CMI',
  PIWM: 'PIWM'
}

/**
    Possible coding values.
    @readonly
    @enum {string}
*/
const Codings = {
  ManchesterGET: 'Manchester-GET',
  ManchesterIEEE: 'Manchester-IEEE',
  DifferentialManchester: 'Differential-Manchester'
}

const slicerOptions = [
  { text: 'off', value: '' },
  { text: 'PCM', value: 'PCM' },
  { text: 'PWM', value: 'PWM' },
  { text: 'PPM', value: 'PPM' },
  { text: 'MC', value: 'MC' },
  { text: 'DM', value: 'DM' },
  { text: 'NRZI', value: 'NRZI' },
  { text: 'CMI', value: 'CMI' },
  { text: 'PIWM', value: 'PIWM' }
]

const codingOptions = [
  { text: 'off', value: '' },
  { text: 'Manchester G.E.Thomas', value: 'ManchesterGET' },
  { text: 'Manchester IEEE', value: 'ManchesterIEEE' },
  { text: 'Differential Manchester', value: 'DifferentialManchester' }
]

/**
    The main Pulseplot class.
*/
class Pulseplot {
  /**
        Get all possible slicer options.
    */
  static get slicerOptions () {
    return slicerOptions
  }

  /**
        Get all possible coding options.
    */
  static get codingOptions () {
    return codingOptions
  }

  /**
        Initialize a new Pulseplot.

        @param {Object} options
        @param {number} [options.width=0] - canvas width in px, 0 = auto
        @param {number} [options.height=150] - canvas height in px
        @param {number} [options.yHi=50] - Marks y-height
        @param {number} [options.yLo=100] - Spaces y-height
        @param {number} [options.yHintLo=115] - Hints y-bottom
        @param {number} [options.yHintHi=35] - Hints y-top
        @param {number} [options.yHintText=125] - Hints text y-offset
        @param {number} [options.scroll=0] - Initial scroll offset
        @param {number} [options.zoom=1] - Initial zoom factor
        @param {boolean} [options.unlockable=false] - Enable unlockable
        @param {boolean} [options.scrollzoom=false] - Enable scrollZoom
        @param {Slicers} [options.slicer] - Slicer to apply, unset = auto
        @param {string|Object} options.parent - Container element or selector
        @param {string|Object} [options.renderInfo] - Info element or selector
        @param {string|Object} [options.theme] - Theme name or options, see {@link setTheme}
    */
  constructor (options = {}) {
    this.constrain = {
      histogram: value => parseInt(value, 10) || 0,
      slicer: value => lookup(Slicers, value) || '',
      coding: value => lookup(Codings, value) || ''
    }
    const defaults = {
      width: 0, // 0 = auto
      scroll: 0,
      zoom: 1
    }
    this.setTheme(options.theme)
    const heights = this.heightDefaults(options.height)
    options = Object.assign({}, defaults, heights, options)

    this.tag = Math.random().toString().substring(2) // unique instance tag
    this.parent = selector(options.parent)
    this.data = options.data || {}
    this.width = options.width || this.parent.clientWidth
    this.height = options.height
    this.yHi = options.yHi
    this.yLo = options.yLo
    this.yHintLo = options.yHintLo
    this.yHintHi = options.yHintHi
    this.yHintText = options.yHintText
    this.scroll = options.scroll
    this.zoom = options.zoom
    this.slicer = options.slicer
    this.renderInfo = options.renderInfo
    this.opts = options

    if (options.data) { this.setData(options.data, options.fileinfo) }
    if (options.unlockable) { this.enableUnlockable() }
    if (options.scrollzoom) { this.enableScrollZoom() }

    if (window.ResizeObserver) {
      // currently only with recent Edge, Firefox, Chrome, Opera
      this.resizeObserver = new ResizeObserver(() => {
        this.redrawCanvas()
      })
      this.resizeObserver.observe(this.parent)
    } else {
      // won't detect layout changes though
      window.addEventListener('debouncedResize', this, false)
    }
  }

  /**
        Set a color theme.

        @param {string|Object} options - Theme name or theme options
        @param {string} [options.hiStroke='#3c3'] - Mark stroke color
        @param {string} [options.hiFill='rgba(51,204,51,0.1)'] - Mark fill color
        @param {number} [options.hiLine=3] - Mark line width
        @param {number[]} [options.hiDash=[]] - Mark dash
        @param {string} [options.loStroke='#c33'] - Space stroke color
        @param {string} [options.loFill='rgba(204,204,204,0.1)'] - Space fill color
        @param {number} [options.loLine=3] - Space line width
        @param {number[]} [options.loDash=[]] - Space dash
        @param {string} [options.edgeStroke='#ccc'] - Edges stroke color
        @param {number} [options.edgeLine=1] - Edges line width
        @param {number[]} [options.edgeDash=[]] - Edge dash
        @param {string} [options.textFill='#666'] - Texts color
        @param {string} [options.dotFill='#999'] - Dots color
        @param {string} [options.hintStroke='#aaf'] - Hints stroke color
        @param {number[]} [options.hintDash=[3, 2]] - Hints dash
        @param {number} [options.hintLine=1] - Hints line width
        @param {string} [options.hintAltStroke='#f99'] - Error hints stroke color
        @param {number[]} [options.hintAltDash=[3, 2]] - Error hints dash
        @param {number} [options.hintAltLine=3] - Error hints line width
        @param {string} [options.hintFill='#448'] - Hints text color
        @param {string} [options.timeLabelFill='#333'] - Time label text color
        @param {string} [options.timeMinorFill='#CCC'] - Time minor tick color
        @param {string} [options.timeMajorFill='#666'] - Time major tick color
        @param {string} [options.font='10px sans-serif'] - Text font
    */
  setTheme (options) {
    let defaults = {
      hiStroke: '#3c3',
      hiFill: 'rgba(51,204,51,0.1)',
      hiLine: 3,
      hiDash: [],
      loStroke: '#c33',
      loFill: 'rgba(204,204,204,0.1)',
      loLine: 3,
      loDash: [],
      edgeStroke: '#ccc',
      edgeLine: 1,
      edgeDash: [],
      textFill: '#666',
      dotFill: '#999',
      hintStroke: '#aaf',
      hintDash: [3, 2],
      hintLine: 1,
      hintAltStroke: '#f99',
      hintAltDash: [3, 2],
      hintAltLine: 3,
      hintFill: '#448',
      timeLabelFill: '#333',
      timeMinorFill: '#CCC',
      timeMajorFill: '#666',
      font: '10px sans-serif'
    }
    const themes = {}
    themes.dark = {
      hiStroke: '#b0b',
      hiFill: 'rgba(191,0,191,0.2)',
      hiLine: 3,
      hiDash: [],
      loStroke: '#27c',
      loFill: 'rgba(102,102,102,0.2)',
      loLine: 3,
      loDash: [],
      edgeStroke: '#555',
      edgeLine: 1,
      edgeDash: [],
      textFill: '#ccc',
      dotFill: '#555',
      hintStroke: '#555',
      hintDash: [3, 2],
      hintLine: 1,
      hintAltStroke: '#c55',
      hintAltDash: [3, 2],
      hintAltLine: 3,
      hintFill: '#ccc',
      timeLabelFill: '#DDD',
      timeMinorFill: '#666',
      timeMajorFill: '#999',
      font: '10px sans-serif'
    }
    if (typeof options === 'string' && themes[options]) defaults = themes[options]
    this.theme = Object.assign({}, defaults, options)
    return this.redrawCanvas()
  }

  /**
        Get all height options based on total height value.
        @param {number} [height=120] - Total height
        @returns {Object} - All height option defaults
    */
  heightDefaults (height = 120) {
    const textHeight = parseInt(this.theme.font, 10) || 10
    const timeHeight = 22 + ~~(height / 10)
    const hintHeight = 1 + ~~(height / 10)
    const defaults = {
      height,
      yHi: timeHeight + hintHeight,
      yLo: height - textHeight - hintHeight,
      yHintLo: height - textHeight,
      yHintHi: timeHeight,
      yHintText: height
    }
    return defaults
  }

  /**
        Enables mouse and touch scroll zoom on double click.
    */
  enableUnlockable () {
    if (this.unlockable) { return }
    this.unlockable = true
    const canvas = this.canvasNode
    const events = ['dblclick']
    events.forEach(evt => canvas.addEventListener(evt, this, false))
  }

  /**
        Disables mouse and touch scroll zoom on double click.
    */
  disableUnlockable () {
    if (!this.unlockable) { return }
    this.unlockable = false
    const canvas = this.canvasNode
    const events = ['dblclick']
    events.forEach(evt => canvas.removeEventListener(evt, this, false))
  }

  /**
        Enables mouse and touch scroll zoom.
    */
  enableScrollZoom () {
    if (this.unlocked) { return }
    this.unlocked = true
    const canvas = this.canvasNode
    let events = ['mousedown', 'mousemove', 'mouseup', 'wheel']
    if (!this.unlockable) {
      events.push('dblclick')
    }
    if ('ontouchstart' in window) {
      events = events.concat('touchstart', 'touchmove', 'touchend')
    }
    events.forEach(evt => canvas.addEventListener(evt, this, false))
  }

  /**
        Disables mouse and touch scroll zoom.
    */
  disableScrollZoom () {
    if (!this.unlocked) { return }
    this.unlocked = false
    const canvas = this.canvasNode
    let events = ['mousedown', 'mousemove', 'mouseup', 'wheel']
    if (!this.unlockable) {
      events.push('dblclick')
    }
    if ('ontouchstart' in window) {
      events = events.concat('touchstart', 'touchmove', 'touchend')
    }
    events.forEach(evt => canvas.removeEventListener(evt, this, false))
  }

  /**
        Release all event handlers and resources.
    */
  destroy () {
    // this.dropZone?.destroy() // if we had optional chaining
    if (this.dropZone) {
      this.dropZone.destroy()
    }
    // this.resizeObserver?.disconnect() // if we had optional chaining
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    window.removeEventListener('debouncedResize', this, false)
    this.disableScrollZoom()
  }

  createDropZone (elementOrSelector) {
    elementOrSelector = elementOrSelector || this.parent.getElementsByClassName('dropzone')[0]
    const fileLoader = this.setData.bind(this)
    this.dropZone = new DropZone(elementOrSelector, fileLoader)
  }

  setSlicer (params) {
    if (params && params.modulation) {
      this.slicer = params
    } else if (this.data && this.data.modulation) {
      this.slicer = this.data
    } else {
      this.slicer = this.guess
    }

    if (!this.data.pulses || !this.data.pulses.length) return

    const slice = sliceGuess(this.data.pulses, this.slicer)
    this.data.hints = slice.hints
    this.data.bits = slice.bits
    if (slice.bits) {
      const timings = this.timingsNode
      const messages = this.messagesNode
      this.analyzer.print(timings, messages)
      console.log(slice.bits.toHexString())
      if (messages) {
        messages.innerHTML += `<div>Bits: <strong>${slice.bits.toHexString()}</strong></div>`
      }
    }

    this.redrawCanvas()
  }

  /**
        Set an option on the Pulseplot to some value.
        @param {string} opt - Option name, see {@link #new_Pulseplot_new new}
        @param {Object} value - The new value for the option
    */
  setOption (opt, value) {
    this[opt] = this.constrain[opt](value)
    return this.processData()
  }

  /**
        Set a number of options on the Pulseplot to some values.
        @param {Object} opts - A key/value object of options to set, see {@link #new_Pulseplot_new new}
    */
  setOptions (opts) {
    for (const opt in opts) {
      this[opt] = this.constrain[opt](opts[opt])
    }
    return this.processData()
  }

  /**
        Set new data on the Pulseplot.
        @param {string|Object} filedata - A URL string or File data object of `{ fileBuffer: ArrayBuffer, name: string, size: number, type: string }`
    */
  setData (data, fileinfo) {
    /*
        let promise;
        // handle if the arg is a url
        if (typeof filedata === 'string') {
            promise = loadUrl(filedata);
        } else {
            promise = Promise.resolve(filedata);
        }

        return promise
            .then(filedata => {
                this.fileinfo = filedata;
                return this.processData();
            })
*/
    if (data instanceof Blob) { // also File
      readFile(data).then(text => {
        this.data = this.parseData(text, data)
        this.processData()
      })
    } else if (Array.isArray(data)) {
      this.data = { pulses: data }
      this.processData()
    } else if (typeof data === 'string') {
      // if startsWith "http" or "/" then readUrl...
      this.data = this.parseData(data, fileinfo)
      this.processData()
    } else if (data.pulses) {
      this.data = data
      this.processData()
    } else {
      this.data = new PulseBuilder(data)
      this.processData()
    }
  }

  parseData (text, fileinfo = {}) {
    const data = {
      name: fileinfo.name || null,
      type: fileinfo.type || null,
      size: fileinfo.size || text.length,
      lastModifiedDate: fileinfo.lastModifiedDate, // use lastModifiedDate only on IE
      lastModified: fileinfo.lastModified,
      pulses: [],
      format: 'OOK',
      rate: 250000,
      scale: 1 // 1us
    }

    const lines = text.split('\n')
    for (const line of lines) {
      if (!line) continue
      if (line.startsWith(';timescale')) {
        data.timescale = line.slice(11)
        const s = parseFloat(data.timescale)
        if (data.timescale.endsWith('ns')) { data.scale = s * 1e-3 } else if (data.timescale.endsWith('us')) { data.scale = s } else if (data.timescale.endsWith('ms')) { data.scale = s * 1e3 } else if (data.timescale.endsWith('s')) { data.scale = s * 1e6 }
      }
      if (line.startsWith(';created')) data.created = line.slice(9)
      if (line.startsWith(';ook')) data.format = 'OOK'
      if (line.startsWith(';fsk')) data.format = 'FSK'
      if (line.startsWith(';freq1')) data.freq1 = line.slice(7)
      if (line.startsWith(';freq2')) data.freq2 = line.slice(7)
      if (line.startsWith(';samplerate')) data.rate = line.slice(12)
      if (line.startsWith(';centerfreq')) data.centerfreq = line.slice(12)
      if (line.startsWith(';sampledepth')) data.sampledepth = line.slice(13)
      if (line.startsWith(';range')) data.range = line.slice(7)
      if (line.startsWith(';rssi')) data.rssi = line.slice(6)
      if (line.startsWith(';snr')) data.snr = line.slice(5)
      if (line.startsWith(';noise')) data.noise = line.slice(7)
      if (line.startsWith(';slicer')) data.slicer = line.slice(8)
      if (line.startsWith(';')) continue

      if (RfRaw.isRfRaw(line)) {
        const pulses = RfRaw.getPulses(line)
        data.pulses = data.pulses.concat(pulses)
        continue
      }

      const fields = line.split(' ')
      for (const field of fields) {
        if (field.length) {
          const n = parseInt(field, 10)
          data.pulses.push(n * data.scale)
        }
      }
    }
    data.freq1 = parseFloat(data.freq1)
    data.freq2 = parseFloat(data.freq2)
    data.rate = parseFloat(data.rate)
    data.centerfreq = data.centerfreq && parseFloat(data.centerfreq)
    data.sampledepth = data.sampledepth && parseFloat(data.sampledepth)
    data.range = data.range && parseFloat(data.range)
    data.rssi = data.rssi && parseFloat(data.rssi)
    data.snr = data.snr && parseFloat(data.snr)
    data.noise = data.noise && parseFloat(data.noise)

    if (data.slicer) {
      const args = data.slicer.split(':')
      data.modulation = args[0]
      data.short = args[1] && parseFloat(args[1])
      data.long = args[2] && parseFloat(args[2])
      data.sync = args[3] && parseFloat(args[3])
      data.gap = args[4] && parseFloat(args[4])
    }
    // console.log(JSON.stringify(data))
    return data
  }

  get canvasNode () {
    return this.parent.getElementsByClassName('pulseplot-canvas')[0] || this.parent.getElementsByTagName('canvas')[0]
  }

  get fileinfoNode () {
    return this.parent.getElementsByClassName('pulseplot-fileinfo')[0] || this.parent.getElementsByClassName('fileinfo')[0]
  }

  get timingsNode () {
    return this.parent.getElementsByClassName('pulseplot-timings')[0]
  }

  get messagesNode () {
    return this.parent.getElementsByClassName('pulseplot-messages')[0]
  }

  buildInfo () {
    if (!this.renderInfo && !this.fileinfoNode) {
      return
    }

    const data = this.data || {}
    const sampleFormat = data.format
    const sampleRate = data.rate
    const rate_scale = autorange(sampleRate, 10.0)
    const width_secs = data.width / 1000000
    const width_scale = autorange_time(width_secs, 10.0)
    const sampleCount = data.width / 1000000 * sampleRate
    const pulses = data.pulses || []

    const lastModified = data.lastModifiedDate || new Date(data.lastModified || 0) // use lastModifiedDate only on IE

    const infos = []
    infos.push({ text: 'File name', value: strip(data.name) })
    infos.push({ text: 'File type', value: data.type || 'n/a' })
    infos.push({ text: 'File size', value: `${data.size} bytes` })
    infos.push({ text: 'Last modified', value: lastModified.toISOString() })
    infos.push({ text: 'Sample format', value: sampleFormat })
    infos.push({ text: 'No. of samples', value: `${sampleCount.toFixed(0)} S` })
    if (sampleRate > 1) { infos.push({ text: 'Sample rate', value: `${sampleRate / rate_scale.scale}${rate_scale.prefix}` }) }
    infos.push({ text: 'No. of pulses', value: `${pulses.length / 2} ×` })
    if (sampleRate > 1) { infos.push({ text: 'Length (time)', value: `${(width_secs / width_scale.scale).toFixed(2)} ${width_scale.prefix}` }) }

    if (this.renderInfo) {
      this.renderInfo(infos)
    } else {
      let text = ''
      for (const item of infos) {
        text += `<span title="${item.text}">${item.value}</span>`
      }
      const info = this.fileinfoNode
      info.innerHTML = text
    }
  }

  // events

  handleEvent (e) {
    // console.log(e.type)
    const handler = e.type
    if (typeof this[handler] === 'function') {
      return this[handler](e)
    }
  }

  wheel (e) {
    // console.log(e)
    // scroll (x)
    let refresh = false
    if (e.deltaX) {
      this.scroll += e.deltaX * 10
      refresh = true
    }

    // zoom (y)
    const zoomMin = 0.5
    const zoomMax = this.data.width / this.width * 10 > 2000 ? 2000 : this.data.width / this.width * 10

    let zoom
    if (e.deltaY < 0) {
      const deltaY = e.deltaY < -10 ? -10 : e.deltaY
      zoom = this.zoom * (1 + deltaY * -0.2) // zoom in
    } else {
      const deltaY = e.deltaY > 10 ? 10 : e.deltaY
      zoom = this.zoom / (1 + deltaY * 0.2) // zoom out
    }
    if (zoom < zoomMin) zoom = zoomMin
    if (zoom > zoomMax) zoom = zoomMax
    // apply and fix scroll
    if (this.zoom !== zoom) {
      this.scroll = (this.scroll + e.layerX) / this.zoom * zoom - e.layerX
      this.zoom = zoom
      refresh = true
    }

    // console.log(`${e.deltaX}, ${e.deltaY} at ${e.layerX}, ${e.layerY}: ${this.scroll} x ${this.zoom}`)
    if (refresh) this.redrawCanvas()
    // clientX, clientY
    // layerX, layerY
    // pageX, pageY
    // x, y
    e.preventDefault()
  }

  dblclick (e) {
    if (this.unlockable && !this.unlocked) {
      this.enableScrollZoom()
    } else if (this.unlockable && this.unlocked) {
      this.disableScrollZoom()
    } else if (this.zoom !== 1 || this.scroll !== 0) {
      this.scroll = 0
      this.zoom = 1
      this.redrawCanvas()
    }
    e.preventDefault()
  }

  mousedown (e) {
    this.dragX = e.offsetX
    this.dragY = e.offsetY
    this.dragOrig = this.scroll
    this.isDrag = true
    e.preventDefault()
  }

  mouseup (e) {
    this.isDrag = false
    e.preventDefault()
  }

  mousemove (e) {
    if (!this.isDrag) return
    this.redrawScroll(this.dragX - e.offsetX, this.dragY - e.offsetY)
    e.stopPropagation()
    e.preventDefault()
  }

  touchstart (e) {
    // single touch or start of a drag
    // touch events don't have offsetX, offsetY
    const clientRect = e.target.getBoundingClientRect()

    const t = e.targetTouches[0]
    const offsetX = t.clientX - clientRect.left
    const offsetY = t.clientY - clientRect.top

    this.dragX = offsetX
    this.dragY = offsetY
    this.dragOrig = this.scroll
    this.isDrag = true

    if (e.targetTouches.length > 1) { e.preventDefault() } // don't allow multitouches
  }

  touchcancel (e) {
    if (e.targetTouches.length < 1) {
      this.isDrag = false
      this.dragZoom = false
    }
  }

  touchend (e) {
    if (e.targetTouches.length < 1) {
      this.isDrag = false
      this.dragZoom = false
    }
  }

  touchmove (e) {
    // touch events don't have offsetX, offsetY
    const clientRect = e.target.getBoundingClientRect()

    const t1 = e.targetTouches[0]
    if (!this.dragZoom && e.targetTouches.length === 1) {
      // scroll
      const offsetX = t1.clientX - clientRect.left
      const offsetY = t1.clientY - clientRect.top

      this.redrawScroll(this.dragX - offsetX, this.dragY - offsetY)
    } else if (e.targetTouches.length === 2) {
      // zoom
      this.isDrag = false
      const t2 = e.targetTouches[1]
      const dist = t1.clientX < t2.clientX ? t2.clientX - t1.clientX : t1.clientX - t2.clientX
      if (!this.dragZoom) {
        this.dragZoom = this.zoom
        this.dragDist = dist
      }
      const pinchOrig = (t1.clientX + t2.clientX) / 2
      const pinchDist = dist / this.dragDist
      const zoom = this.dragZoom * pinchDist
      this.scroll = (this.scroll + pinchOrig) / this.zoom * zoom - pinchOrig
      this.zoom = zoom

      this.redrawCanvas()
      e.preventDefault()
    }

    e.stopPropagation()
  }

  debouncedResize () {
    this.width = this.opts.width || this.parent.clientWidth
    // this.width = this.opts.width || document.documentElement.clientWidth
    this.drawCanvas()
  }

  // drawing

  processData () {
    if (!this.data.pulses || !this.data.pulses.length) return

    let width = 0
    for (let j = 0; j < this.data.pulses.length; ++j) {
      width += this.data.pulses[j]
    }
    this.data.width = width

    // Run analyzer
    const timings = this.timingsNode
    const messages = this.messagesNode
    const analyzer = new Analyzer(this.data.pulses)
    analyzer.console_log()
    analyzer.print(timings, messages)
    this.analyzer = analyzer
    this.guess = analyzer.guess()

    // populate hints
    if (this.slicer) {
      // already set, skip
    } else if (this.data.modulation) {
      this.slicer = this.data
    } else {
      this.slicer = this.guess
    }
    const slice = sliceGuess(this.data.pulses, this.slicer)
    this.data.hints = slice.hints
    this.data.bits = slice.bits
    if (slice.bits) {
      console.log(slice.bits.toHexString())
      if (messages) {
        messages.innerHTML += `<div>Bits: <strong>${slice.bits.toHexString()}</strong></div>`
      }
    }

    this.buildInfo()

    this.drawCanvas()
  }

  redrawScroll (x/*, y */) {
    // console.log(`scroll ${x}, ${y}`)
    this.scroll = this.dragOrig + x
    // TODO: Y for zoom
    this.redrawCanvas()
  }

  redrawCanvas () {
    window.requestAnimationFrame(this.drawCanvas.bind(this))
  }

  drawCanvas () {
    this.width = this.opts.width || this.parent.clientWidth
    // this.width = this.opts.width || document.documentElement.clientWidth
    const width = this.width
    const height = this.height

    const canvas = this.canvasNode
    canvas.width = width
    canvas.height = height
    // canvas.style.width = canvas.width + 'px'
    // canvas.parentNode.style.width = canvas.width + 'px'
    // canvas.style.height = canvas.height + 'px'
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    })

    if (this.scroll <= -10) {
      this.scroll = -10
    } else if (this.scroll > width * this.zoom) {
      this.scroll = width * this.zoom
    }

    const scroll = -this.scroll
    const scale = width * this.zoom / this.data.width
    const yHi = this.yHi + 0.5
    const yLo = this.yLo + 0.5

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // time axis
    ctx.font = this.theme.font
    const textMeasure = ctx.measureText('8')
    const fontX = textMeasure.width
    const fontY = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent

    const total_time = this.data.width / 1000000 / this.zoom
    const time_offset = scroll / width * total_time
    const time_scale = autorange(total_time, 10.0)
    const total_time_scaled = total_time / time_scale.scale
    const time_offset_scaled = time_offset / time_scale.scale

    ctx.fillStyle = this.theme.timeLabelFill
    ctx.fillText(`t[${time_scale.prefix}s]`, 32, fontY)

    // extra info
    if (this.data.time) { ctx.fillText(`${this.data.time}`, 100, fontY) }
    if (this.data.format || this.data.mod) { ctx.fillText(`${(this.data.format || this.data.mod).toUpperCase()}`, 300, fontY) }
    if (this.data.pulses) { ctx.fillText(`${this.data.pulses.length / 2} pulses`, 330, fontY) }
    const rate_Hz = this.data.rate_Hz || this.data.samplerate_Hz || this.data.rate || this.data.samplerate
    if (rate_Hz) {
      const scale = autorange(rate_Hz, 10.0)
      ctx.fillText(`${rate_Hz / scale.scale} ${scale.prefix}Hz`, 400, fontY)
    }
    const freq_Hz = this.data.freq_Hz || this.data.centerfreq_Hz || this.data.centerfreq
    const freq1_Hz = this.data.freq1_Hz || this.data.freq1
    if (freq1_Hz) {
      const scale = autorange(freq1_Hz, 10.0)
      ctx.fillText(`${(freq1_Hz / scale.scale).toFixed(3)} ${scale.prefix}Hz`, 500, fontY)
    }
    if (freq_Hz && freq1_Hz) {
      ctx.fillStyle = this.theme.timeMinorFill
      ctx.fillRect(700, ~~(fontY / 2), 100, 1)
      ctx.fillStyle = this.theme.timeLabelFill

      const fr = (freq1_Hz - this.data.freq_Hz) * 100 / rate_Hz + 50
      ctx.lineWidth = this.theme.hiLine
      ctx.strokeStyle = this.theme.hiStroke
      ctx.beginPath()
      ctx.moveTo(700 + fr, 0)
      ctx.lineTo(700 + fr, fontY)
      ctx.stroke()
    }
    const freq2_Hz = this.data.freq2_Hz || this.data.freq2
    if (freq2_Hz) {
      const scale = autorange(freq2_Hz, 10.0)
      ctx.fillText(`${(freq2_Hz / scale.scale).toFixed(3)} ${scale.prefix}Hz`, 600, fontY)
    }
    if (freq_Hz && freq2_Hz) {
      const fr = (freq2_Hz - this.data.freq_Hz) * 100 / rate_Hz + 50
      ctx.lineWidth = this.theme.loLine
      ctx.strokeStyle = this.theme.loStroke
      ctx.beginPath()
      ctx.moveTo(700 + fr, 0)
      ctx.lineTo(700 + fr, fontY)
      ctx.stroke()
    }
    const range_dB = this.data.range_dB || this.data.range || 66
    const rssi_dB = this.data.rssi_dB || this.data.rssi
    const snr_dB = this.data.snr_dB || this.data.snr
    const noise_dB = this.data.noise_dB || this.data.noise
    if (rssi_dB && snr_dB && noise_dB) {
      ctx.lineWidth = 1
      ctx.strokeStyle = this.theme.loStroke
      ctx.beginPath()
      ctx.moveTo(900, fontY)
      ctx.lineTo(1000, fontY)
      ctx.stroke()

      ctx.lineWidth = this.theme.hiLine
      ctx.strokeStyle = this.theme.hiStroke
      ctx.beginPath()
      ctx.moveTo(1000 + noise_dB * 100 / range_dB, fontY)
      ctx.lineTo(1000 + rssi_dB * 100 / range_dB, fontY)
      ctx.stroke()

      ctx.fillText(`RSSI ${noise_dB.toFixed(1)} ${snr_dB.toFixed(1)} ${rssi_dB.toFixed(1)} dB`, 900, fontY)
    }

    // want a time marker for about every 85 pixels
    const num_time_markers = width / 85
    let time_markers_step = total_time_scaled / num_time_markers
    // round to 5
    time_markers_step = ~~(time_markers_step / 5) * 5
    if (time_markers_step < 1.0) time_markers_step = 1.0

    const time_per_pixel = width / total_time_scaled
    // console.log({ time_offset_scaled, total_time_scaled, time_markers_step, time_per_pixel })

    const y = 18
    ctx.fillStyle = this.theme.timeMinorFill
    for (let t = time_offset_scaled; t < total_time_scaled; t += time_markers_step / 5) {
      if (t >= total_time_scaled - time_markers_step) { t = total_time_scaled }
      const x = ~~(t * time_per_pixel)
      ctx.fillRect(x, y + 10, 1, 5)
    }

    ctx.fillStyle = this.theme.timeMajorFill
    for (let t = time_offset_scaled; t < total_time_scaled; t += time_markers_step) {
      if (t >= total_time_scaled - time_markers_step) { t = total_time_scaled }
      const x = ~~(t * time_per_pixel)
      ctx.fillRect(x, y + 5, 1, 10)

      const label = (t - time_offset_scaled).toFixed(0)
      let x1 = x - 3 * label.length
      if (t >= total_time_scaled) { x1 = x - 6 * fontX }
      // ctx.fillText(`${t.toFixed(0)}${time_scale.prefix}s`, x1, 18)
      ctx.fillText(label, x1, 20)
    }

    // hints
    ctx.lineWidth = this.theme.hintLine
    ctx.strokeStyle = this.theme.hintStroke
    ctx.setLineDash(this.theme.hintDash)
    ctx.beginPath()
    let xp // previous hint (end)
    for (let j = 0; this.data.hints && j < this.data.hints.length; j += 1) {
      const hint = this.data.hints[j]
      const x0 = hint[0] * scale + scroll // start pos
      const x1 = hint[1] * scale + scroll // end pos
      if (xp !== x0 && x0 >= 0 && x0 < width) {
        ctx.moveTo(~~x0 - 0.5, this.yHintLo - 0.5)
        ctx.lineTo(~~x0 - 0.5, this.yHintHi + 0.5)
      }
      if (x1 >= 0 && x1 < width) {
        ctx.moveTo(~~x1 - 0.5, this.yHintLo - 0.5)
        ctx.lineTo(~~x1 - 0.5, this.yHintHi + 0.5)
      }
      xp = x1
    }
    ctx.stroke()
    ctx.setLineDash([])

    // alt (error) hints
    ctx.lineWidth = this.theme.hintAltLine
    ctx.strokeStyle = this.theme.hintAltStroke
    ctx.setLineDash(this.theme.hintAltDash)
    ctx.beginPath()
    xp = null // previous hint (end)
    for (let j = 0; this.data.hints && j < this.data.hints.length; j += 1) {
      const hint = this.data.hints[j]
      const x0 = hint[0] * scale + scroll // start pos
      const x1 = hint[1] * scale + scroll // end pos
      if (xp !== x0) {
        if (xp && xp >= 0 && xp < width) {
          ctx.moveTo(~~xp - 0.5, this.yHintLo - 0.5)
          ctx.lineTo(~~xp - 0.5, this.yHintHi + 0.5)
        }
        if (x0 >= 0 && x0 < width) {
          ctx.moveTo(~~x0 - 0.5, this.yHintLo - 0.5)
          ctx.lineTo(~~x0 - 0.5, this.yHintHi + 0.5)
        }
      }
      xp = x1
    }
    ctx.stroke()
    ctx.setLineDash([])

    // hints text
    ctx.fillStyle = this.theme.hintFill
    ctx.beginPath()
    for (let j = 0; this.data.hints && j < this.data.hints.length; j += 1) {
      const hint = this.data.hints[j]
      const x0 = hint[0] * scale + scroll // start pos
      const x1 = hint[1] * scale + scroll // end pos
      const t = hint[2] // text
      const w = x1 - x0
      if (w > fontX) {
        const xt = x0 + w / 2
        if (xt >= 0 && xt < width) { ctx.fillText(t, xt - 5, this.yHintText) }
      }
    }
    ctx.stroke()

    if (!this.data.pulses || !this.data.pulses.length) return
    let pulses = this.data.pulses, shrinkRate = 1
    if (this.data.pulses.length > this.width) {
      pulses = []
      shrinkRate = Math.ceil(this.data.pulses.length / this.width)
      for (let i = 0; i < this.width; i++) {
        pulses.push(this.data.pulses[i * shrinkRate])
      }
    }

    // marks
    let x = scroll
    ctx.lineWidth = this.theme.hiLine
    ctx.strokeStyle = this.theme.hiStroke
    ctx.setLineDash(this.theme.hiDash)
    ctx.fillStyle = this.theme.hiFill
    ctx.beginPath()
    for (let j = 0; j < pulses.length; j += 2) {
      const x0 = x
      x += pulses[j] * scale * shrinkRate // mark
      if ((x0 >= 0 && x0 < width) || (x >= 0 && x < width) || (x0 < 0 && x > width)) {
        ctx.fillRect(~~x0, yHi, ~~(x - x0), yLo - yHi)
        ctx.moveTo(~~x0 - 1, yHi)
        ctx.lineTo(~~x + 0, yHi)
      }
      x += pulses[j + 1] * scale * shrinkRate // space
    }
    ctx.stroke()

    // spaces
    x = scroll
    ctx.lineWidth = this.theme.loLine
    ctx.strokeStyle = this.theme.loStroke
    ctx.setLineDash(this.theme.loDash)
    ctx.fillStyle = this.theme.loFill
    ctx.beginPath()
    for (let j = 0; j < this.data.pulses.length; j += 2) {
      x += pulses[j] * scale * shrinkRate // mark
      const x0 = x
      x += pulses[j + 1] * scale * shrinkRate // space
      if ((x0 >= 0 && x0 < width) || (x >= 0 && x < width) || (x0 < 0 && x > width)) {
        ctx.fillRect(~~x0, yHi, ~~(x - x0), yLo - yHi)
        ctx.moveTo(~~x0 - 1, yLo)
        ctx.lineTo(~~x + 0, yLo)
      }
    }
    ctx.stroke()

    // edges
    x = scroll
    ctx.lineWidth = this.theme.edgeLine
    ctx.strokeStyle = this.theme.edgeStroke
    ctx.setLineDash(this.theme.edgeDash)
    ctx.beginPath()
    for (let j = 0; j < pulses.length; j += 1) {
      if (x >= 0 && x < width) {
        ctx.moveTo(~~x - 0.5, yLo - 0.5)
        ctx.lineTo(~~x - 0.5, yHi + 0.5)
      }
      x += pulses[j] * scale * shrinkRate // mark or space
    }
    ctx.stroke()

    // text
    x = scroll
    ctx.fillStyle = this.theme.textFill
    const textY = yHi + (yLo - yHi + fontY) / 2
    for (let j = 0; j < pulses.length; j += 1) {
      const p = pulses[j] // mark or space
      const w = p * scale * shrinkRate
      if (w > 30) {
        const x0 = x + w / 2
        if (x0 >= 0 && x0 < width) { ctx.fillText(p, x0 - 10, textY) }
      }
      x += w
    }

    // dots
    const rate = 1000000 / this.data.rate * scale
    x = scroll
    if (rate > 2) {
      const dotW = rate > 4 ? 2 : 1
      ctx.fillStyle = this.theme.dotFill
      for (let j = 0; j < this.data.pulses.length; j += 2) {
        const mark = this.data.pulses[j] * scale // mark
        for (let k = 0; k < mark - rate; k += rate) {
          const x0 = ~~(x + k)
          if (x0 >= 0 && x0 < width) { ctx.fillRect(x0, yHi + 0.5, dotW, 3) }
        }
        x += mark
        const space = this.data.pulses[j + 1] * scale // space
        for (let k = 0; k < space - rate; k += rate) {
          const x0 = ~~(x + k)
          if (x0 >= 0 && x0 < width) { ctx.fillRect(x0, yLo - 3.5, dotW, 3) }
        }
        x += space
      }
    }
  }
}

export { Pulseplot }
