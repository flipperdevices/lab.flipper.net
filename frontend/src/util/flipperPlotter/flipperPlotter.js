/* eslint-disable-next-line camelcase */
import { autorange, autorange_time } from './autorange.js'
import { sliceGuess } from './slicer.js'
import { selector } from './utils.js'
import { Analyzer } from './histogram.js'
import { defaults, styles, slicerOptions } from './costants.js'
import * as d3 from 'd3'

class FlipperPlotter {
  get slicerOptions () {
    return slicerOptions
  }

  constructor (options = {}) {
    if (!options.data) {
      console.error(new Error('Required data missing for flipperPlotter'))
      return
    } else {
      this.data = options.data
    }

    if (options.parent) {
      this.parent = selector(options.parent)
    } else {
      this.parent = selector(defaults.selector)
    }

    if (options.timings) {
      this.timings = selector(options.timings)
    }

    if (options.messages) {
      this.messages = selector(options.messages)
    }

    if (!this.parent) {
      console.error(new Error('Missing mount element for flipperPlotter'))
      return
    }

    this.setTheme(options.theme)

    this.createNode()

    this.initialCanvas()

    this.processData(this.data)

    this.drawCanvas(this.data)
  }

  setTheme (options) {
    this.theme = { ...defaults.theme, ...options }
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

    this.setSlicerData(this.data.pulses, this.slicer)

    this.redrawHintsCanvas(d3.zoomTransform(this.labelCanvasNode))
  }

  setSlicerData (pulses, slicer) {
    const slice = sliceGuess(pulses, slicer)
    const timings = this.timingsNode
    const messages = this.messagesNode
    this.analyzer.print(timings, messages)

    if (slice.hints) {
      this.data.hints = slice.hints
      this.altHints = this.getAltHints(slice.hints)
    }

    if (slice.bits) {
      this.data.bits = slice.bits

      if (messages) {
        messages.innerHTML += `<div>Bits: <strong>${slice.bits.toHexString()}</strong></div>`
      }
    }
  }

  getBoundaries (transform) {
    // const minLeftSide = 0
    const maxRightSide = this.width * transform.k
    const pulseInOneX = this.data.width / maxRightSide
    const leftSide = ~~(transform.x * -1)
    const rightSide = ~~(transform.x * -1 + this.width)
    // const pulseRate = data.width / transform.k
    const leftPulse = leftSide * pulseInOneX
    const rightPulse = rightSide * pulseInOneX

    return { leftPulse, rightPulse }
  }

  getAltHints (hints) {
    const altHints = []
    if (hints) {
      let prevHint
      for (let i = 0; i < hints.length; i++) {
        const d = hints[i]
        const x0 = d[0]

        if (i > 0 && prevHint[1] !== x0) {
          altHints.push([prevHint[1], x0])
        }

        prevHint = d
      }
    }

    return altHints
  }

  createNode () {
    const flipperPlotter = d3.select(this.parent)
    this.flipperPlotterNode = flipperPlotter.node()

    this.axisSvg = d3.create('svg')
    const axisSvgNode = this.axisSvg.node()

    const wrapper = d3
      .create('div')
      .attr('style', styles.relativePosition + styles.fullWidth)
    const wrapperNode = wrapper.node()

    const labelCanvas = d3
      .create('canvas')
      .attr('style', styles.absoluteTopLeft + styles.fullWidth)
    this.labelCanvasNode = labelCanvas.node()

    const hintsCanvas = d3
      .create('canvas')
      .attr('style', styles.absoluteTopLeft + styles.fullWidth)
    this.hintsCanvasNode = hintsCanvas.node()

    const pulsesCanvas = d3.create('canvas').attr('style', styles.fullWidth)
    this.pulsesCanvasNode = pulsesCanvas.node()

    let timingsDiv
    if (this.timings) {
      timingsDiv = d3.select(this.timings)
    } else {
      timingsDiv = d3.create('div')
    }
    this.timingsNode = timingsDiv.node()

    let messagesDiv
    if (this.messages) {
      messagesDiv = d3.select(this.messages)
    } else {
      messagesDiv = d3.create('div')
    }
    this.messagesNode = messagesDiv.node()

    this.flipperPlotterNode.append(axisSvgNode)
    wrapperNode.append(this.hintsCanvasNode)
    wrapperNode.append(this.labelCanvasNode)
    wrapperNode.append(this.pulsesCanvasNode)
    this.flipperPlotterNode.append(wrapperNode)

    if (!this.timings) {
      this.flipperPlotterNode.append(this.timingsNode)
    }
    if (!this.messages) {
      this.flipperPlotterNode.append(this.messagesNode)
    }
  }

  initialCanvas () {
    this.width = this.pulsesCanvasNode.clientWidth
    this.height = defaults.height

    this.context = this.context2d(
      this.pulsesCanvasNode,
      this.width,
      this.height
    )
    this.labelContext = this.context2d(
      this.labelCanvasNode,
      this.width,
      this.height
    )
    this.hintsContext = this.context2d(
      this.hintsCanvasNode,
      this.width,
      this.height
    )
  }

  processData (data) {
    let width = 0
    for (let j = 0; j < this.data.pulses.length; ++j) {
      width += this.data.pulses[j]
    }
    this.data.width = width

    this.data.hints = []
    this.altHints = []

    this.analyzer = new Analyzer(data.pulses)
    this.guess = this.analyzer.guess()
    this.slicer = this.guess

    this.setSlicerData(data.pulses, this.slicer)
  }

  context2d (canvas, width, height, dpi) {
    const context = canvas.getContext('2d', { desynchronized: true })
    if (dpi == null) dpi = window.devicePixelRatio
    canvas.width = Math.floor(width * dpi)
    canvas.height = Math.floor(height * dpi)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.scale(dpi, dpi)
    return context
  }

  getShrinkRate (data, width) {
    return Math.ceil(data.pulses.length / width)
  }

  shrinkagePulses (data, width) {
    const pulses = []
    const shrinkRate = this.getShrinkRate(data, width)
    for (let i = 0; i < width; i++) {
      pulses.push(data.pulses[i * shrinkRate])
    }

    return pulses
  }

  getSize (maxWidth, width) {
    return maxWidth / width
  }

  drawFill (context, x, y, width, height, color) {
    context.beginPath()
    context.fillStyle = color
    context.fillRect(x, y, width, height)
    context.closePath()
  }

  drawLine (context, coordinates, options) {
    context.beginPath()
    context.lineWidth = options.lineWidth
    context.strokeStyle = options.strokeStyle
    context.moveTo(...coordinates.start)
    context.lineTo(...coordinates.end)
    context.stroke()
    context.closePath()
  }

  drawText (context, text, x, y, options = {}) {
    let defaults = {
      color: this.theme.fontColor,
      font: `${this.theme.fontSize}px sans-serif`,
      align: this.theme.fontAlign,
      baseline: this.theme.fontBaseline
    }

    defaults = { ...defaults, ...options }

    context.beginPath()
    context.fillStyle = defaults.color
    context.font = defaults.font
    context.textAlign = defaults.align
    context.textBaseline = defaults.baseline
    context.fillText(text, x, y)
    context.closePath()
  }

  drawHint (context, x, height, options) {
    context.lineWidth = options.hintLine
    context.strokeStyle = options.hintStroke
    context.setLineDash(options.hintDash)
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, height)
    context.stroke()
    context.setLineDash([])
  }

  drawAllHints (transform) {
    const { leftPulse, rightPulse } = this.getBoundaries(transform)

    const hints = this.data.hints.filter((d) => {
      const x0 = d[0]
      const x1 = d[1]
      if (x0 >= leftPulse && x0 <= rightPulse) return true
      if (x1 >= leftPulse && x1 <= rightPulse) return true
      return false
    })

    let prevHint
    for (let i = 0; i < hints.length; i += 1) {
      const hint = hints[i]
      const x0 = hint[0]
      const x1 = hint[1]

      if (prevHint !== x0 && x0 >= 0 && x0 < this.data.width) {
        this.drawHint(
          this.hintsContext,
          x0 * (transform.k / this.maxZoom) + transform.x,
          this.height,
          {
            hintLine: this.theme.hintLine,
            hintStroke: this.theme.hintStroke,
            hintDash: this.theme.hintDash
          }
        )
      }
      if (x1 >= 0 && x1 < this.data.width) {
        this.drawHint(
          this.hintsContext,
          x1 * (transform.k / this.maxZoom) + transform.x,
          this.height,
          {
            hintLine: this.theme.hintLine,
            hintStroke: this.theme.hintStroke,
            hintDash: this.theme.hintDash
          }
        )
      }
      prevHint = x1
    }

    const altHints = this.altHints.filter((d) => {
      const x0 = d[0]
      const x1 = d[1]
      if (x0 >= leftPulse && x0 <= rightPulse) return true
      if (x1 >= leftPulse && x1 <= rightPulse) return true
      return false
    })

    prevHint = null
    for (let i = 0; i < altHints.length; i += 1) {
      const hint = altHints[i]
      const x0 = hint[0]
      const x1 = hint[1]

      if (prevHint !== x0 && x0 >= 0 && x0 < this.data.width) {
        this.drawHint(
          this.hintsContext,
          x0 * (transform.k / this.maxZoom) + transform.x,
          this.height,
          {
            hintLine: this.theme.hintAltLine,
            hintStroke: this.theme.hintAltStroke,
            hintDash: this.theme.hintAltDash
          }
        )
      }
      if (x1 >= 0 && x1 < this.data.width) {
        this.drawHint(
          this.hintsContext,
          x1 * (transform.k / this.maxZoom) + transform.x,
          this.height,
          {
            hintLine: this.theme.hintAltLine,
            hintStroke: this.theme.hintAltStroke,
            hintDash: this.theme.hintAltDash
          }
        )
      }

      prevHint = x1
    }
  }

  zoomed (transform) {
    if (transform.x > 0) transform.x = 0
    if (transform.x + this.width * transform.k < this.width) {
      transform.x = this.width - this.width * transform.k
    }

    this.xScale = transform.rescaleX(this.xScaleCopy)

    const currentRange = autorange(this.data.width / transform.k)
    const currentTimeRange = autorange_time(this.data.width / 1e6 / transform.k)

    this.axisSvg.select('.x-axis').call(
      d3
        .axisTop(this.xScale)
        .ticks(this.width / 100)
        .tickFormat(
          (x) =>
            (x / currentRange.scale).toFixed(2).replace(/[.,]00$/, '') +
            `${currentTimeRange.prefix}`
        )
    )

    this.labelContext.save()
    this.labelContext.clearRect(0, 0, this.width, this.height)

    this.hintsContext.save()
    this.hintsContext.clearRect(0, 0, this.width, this.height)

    this.context.save()
    this.context.clearRect(0, 0, this.width, this.height)
    this.context.translate(transform.x, 1)
    this.context.scale(transform.k, 1)

    this.drawFill(
      this.context,
      0,
      -1,
      this.width,
      this.barHeight + this.margin.top + this.margin.bottom,
      this.theme.spaceFill
    )

    const zoom = transform.k
    let prevX = 0
    let skipPulse = 0

    const { leftPulse, rightPulse } = this.getBoundaries(transform)

    if (zoom < this.breakpointZoom) {
      this.size = this.getSize(this.maxWidth, this.width)

      this.pulses = this.shrinkagePulses(this.data, this.width)
    } else {
      this.size = this.getSize(this.data.width, this.width)

      let sum = 0

      this.pulses = this.data.pulses.filter((d) => {
        const minX = sum
        sum += d
        const maxX = sum
        if (maxX >= leftPulse && minX <= rightPulse) return true
        if (minX < leftPulse) {
          prevX += d
          skipPulse += 1
        }
        return false
      })
    }

    for (let i = 0; i < this.pulses.length; i++) {
      const x = this.pulses[i]

      if (x) {
        if ((i + skipPulse) % 2 === 0) {
          this.drawFill(
            this.context,
            prevX / this.size,
            this.margin.top,
            x / this.size,
            this.barHeight,
            this.theme.hiFill
          )

          this.drawLine(
            this.context,
            {
              start: [prevX / this.size, this.height - this.margin.top],
              end: [
                prevX / this.size,
                this.height - this.barHeight - this.margin.top
              ]
            },
            {
              lineWidth: this.theme.edgeLine / this.size,
              strokeStyle: this.theme.edgeStroke
            }
          )

          this.drawLine(
            this.context,
            {
              start: [
                (prevX + x) / this.size,
                this.height - this.barHeight - this.margin.top
              ],
              end: [(prevX + x) / this.size, this.height - this.margin.top]
            },
            {
              lineWidth: this.theme.edgeLine / this.size,
              strokeStyle: this.theme.edgeStroke
            }
          )

          this.drawLine(
            this.context,
            {
              start: [
                prevX / this.size,
                this.height -
                  this.barHeight -
                  this.margin.top +
                  this.theme.hiLine / 2
              ],
              end: [
                (prevX + x) / this.size,
                this.height -
                  this.barHeight -
                  this.margin.top +
                  this.theme.hiLine / 2
              ]
            },
            {
              lineWidth: this.theme.hiLine,
              strokeStyle: this.theme.hiStroke
            }
          )
        } else {
          this.drawLine(
            this.context,
            {
              start: [
                prevX / this.size,
                this.height - this.margin.top - this.theme.loLine / 2
              ],
              end: [
                (prevX + x) / this.size,
                this.height - this.margin.top - this.theme.loLine / 2
              ]
            },
            {
              lineWidth: this.theme.loLine,
              strokeStyle: this.theme.loStroke
            }
          )
        }

        const w = x * ((this.width * transform.k) / this.data.width)
        if (w > this.theme.fontSize * 3) {
          this.drawText(
            this.labelContext,
            x,
            (prevX + x / 2) * (transform.k / this.maxZoom) + transform.x,
            this.height / 2
          )
        }

        prevX = prevX + x
      }
    }

    this.drawAllHints(transform)

    this.labelContext.restore()
    this.hintsContext.restore()
    this.context.restore()
  }

  redrawHintsCanvas (transform) {
    this.hintsContext.save()
    this.hintsContext.clearRect(0, 0, this.width, this.height)

    this.drawAllHints(transform)

    this.hintsContext.restore()
  }

  drawCanvas () {
    this.margin = defaults.margin
    this.barHeight = this.height - this.margin.top - this.margin.bottom

    this.size = 1
    this.pulses = []
    this.breakpointZoom = defaults.breakpointZoom

    const shrinkRate = this.getShrinkRate(this.data, this.width)
    this.maxWidth = this.data.pulses
      .filter((d, i) => i % shrinkRate === 0 && d)
      .reduce((acc, cur) => acc + cur, 0)

    const minZoom = 1
    this.maxZoom = this.data.width / this.width

    this.xScale = d3
      .scaleLinear()
      .range([0, this.width])
      .domain([0, this.data.width])

    this.xScaleCopy = this.xScale.copy()

    const xAxis = d3
      .axisTop(this.xScale)
      .ticks(this.width / 100)
      .tickFormat((x) => `(${x.toFixed(1)})`)

    // d3.select(this.pulsesCanvasNode)
    //   .call(
    //     d3
    //       .zoom()
    //       .scaleExtent([minZoom, this.maxZoom])
    //       .on('zoom', ({ transform }) => this.zoomed(transform))
    //   )

    const labelСanvas = d3
      .select(this.labelCanvasNode)
      .style('cursor', 'grab')
      .call(
        d3
          .zoom()
          .scaleExtent([minZoom, this.maxZoom])
          .on('start', () => {
            labelСanvas.style('cursor', 'grabbing')
          })
          .on('zoom', (e) => {
            if (e.sourceEvent.type === 'wheel') {
              labelСanvas.style('cursor', 'ns-resize')
            }
            this.zoomed(e.transform)
          })
          .on('end', () => {
            labelСanvas.style('cursor', 'grab')
          })
      )

    const axisHeight = 18
    this.axisSvg
      .attr('viebox', [0, 0, this.width, axisHeight])
      .attr('width', this.width)
      .attr('height', axisHeight)
    this.axisSvg.append('g').classed('x-axis', true).call(xAxis)

    d3.select('.x-axis').attr('transform', `translate(${[0, axisHeight]})`)

    this.zoomed(d3.zoomTransform(this.labelCanvasNode))
  }

  destroy () {
    this.flipperPlotterNode.innerHTML = ''
  }
}

export { FlipperPlotter }
