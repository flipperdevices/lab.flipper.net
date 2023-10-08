import { defaults } from './costants.js'
const margin = defaults.margin

let width,
  height,
  dpi = null
let data = null
let theme = null

let context,
  labelContext,
  hintsContext = null

let size = 1
let pulses = []
let altHints = []
let barHeight = null
const breakpointZoom = defaults.breakpointZoom
let maxZoom = null
let maxWidth = null

self.onmessage = (e) => {
  switch (e.data.message) {
    case 'setConfigContext':
      width = e.data.width
      height = e.data.height
      dpi = 1
      break
    case 'setData':
      data = JSON.parse(e.data.data)
      break
    case 'setTheme':
      theme = e.data.theme
      break
    case 'setMaxZoom':
      maxZoom = e.data.maxZoom
      break
    case 'setMaxWidth':
      maxWidth = e.data.maxWidth
      break
    case 'setBarHeight':
      barHeight = e.data.barHeight
      break
    case 'setAltHints':
      altHints = JSON.parse(e.data.altHints)
      break

    case 'getContext':
      context = context2d(e.data.canvas, width, height, dpi)
      break
    case 'getLabelContext':
      labelContext = context2d(e.data.canvas, width, height, dpi)
      break
    case 'getHintsContext':
      hintsContext = context2d(e.data.canvas, width, height, dpi)
      break

    case 'redrawHintsCanvas':
      redrawHintsCanvas(e.data.transform)
      break
    case 'zoomed':
      zoomed(e.data.transform)
      break
  }
}

const context2d = (canvas, width, height, dpi) => {
  const context = canvas.getContext('2d', { desynchronized: true })
  context.scale(dpi, dpi)
  canvas.width = Math.floor(width * dpi)
  canvas.height = Math.floor(height * dpi)
  return context
}

const getSize = (maxWidth, width) => {
  return maxWidth / width
}

const getBoundaries = (transform) => {
  // const minLeftSide = 0
  const maxRightSide = width * transform.k
  const pulseInOneX = data.width / maxRightSide
  const leftSide = ~~(transform.x * -1)
  const rightSide = ~~(transform.x * -1 + width)
  // const pulseRate = data.width / transform.k
  const leftPulse = leftSide * pulseInOneX
  const rightPulse = rightSide * pulseInOneX

  return { leftPulse, rightPulse }
}

const getShrinkRate = (data, width) => {
  return Math.ceil(data.pulses.length / width)
}

const shrinkagePulses = (data, width) => {
  const pulses = []
  const shrinkRate = getShrinkRate(data, width)
  for (let i = 0; i < width; i++) {
    pulses.push(data.pulses[i * shrinkRate])
  }

  return pulses
}

const drawFill = (context, x, y, width, height, color) => {
  context.beginPath()
  context.fillStyle = color
  context.fillRect(x, y, width, height)
  context.closePath()
}

const drawLine = (context, coordinates, options) => {
  context.beginPath()
  context.lineWidth = options.lineWidth
  context.strokeStyle = options.strokeStyle
  context.moveTo(...coordinates.start)
  context.lineTo(...coordinates.end)
  context.stroke()
  context.closePath()
}

const drawText = (context, text, x, y, options = {}) => {
  let defaults = {
    color: theme.fontColor,
    font: `${theme.fontSize}px sans-serif`,
    align: theme.fontAlign,
    baseline: theme.fontBaseline
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

const drawHint = (context, x, height, options) => {
  context.lineWidth = options.hintLine
  context.strokeStyle = options.hintStroke
  context.setLineDash(options.hintDash)
  context.beginPath()
  context.moveTo(x, 0)
  context.lineTo(x, height)
  context.stroke()
  context.setLineDash([])
}

const drawAllHints = (transform) => {
  const { leftPulse, rightPulse } = getBoundaries(transform)

  const hints = data.hints.filter((d) => {
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

    if (prevHint !== x0 && x0 >= 0 && x0 < data.width) {
      drawHint(
        hintsContext,
        x0 * (transform.k / maxZoom) + transform.x,
        height,
        {
          hintLine: theme.hintLine,
          hintStroke: theme.hintStroke,
          hintDash: theme.hintDash
        }
      )
    }
    if (x1 >= 0 && x1 < data.width) {
      drawHint(
        hintsContext,
        x1 * (transform.k / maxZoom) + transform.x,
        height,
        {
          hintLine: theme.hintLine,
          hintStroke: theme.hintStroke,
          hintDash: theme.hintDash
        }
      )
    }
    prevHint = x1
  }

  const filteredAltHints = altHints.filter((d) => {
    const x0 = d[0]
    const x1 = d[1]
    if (x0 >= leftPulse && x0 <= rightPulse) return true
    if (x1 >= leftPulse && x1 <= rightPulse) return true
    return false
  })

  prevHint = null
  for (let i = 0; i < filteredAltHints.length; i += 1) {
    const hint = filteredAltHints[i]
    const x0 = hint[0]
    const x1 = hint[1]

    if (prevHint !== x0 && x0 >= 0 && x0 < data.width) {
      drawHint(
        hintsContext,
        x0 * (transform.k / maxZoom) + transform.x,
        height,
        {
          hintLine: theme.hintAltLine,
          hintStroke: theme.hintAltStroke,
          hintDash: theme.hintAltDash
        }
      )
    }
    if (x1 >= 0 && x1 < data.width) {
      drawHint(
        hintsContext,
        x1 * (transform.k / maxZoom) + transform.x,
        height,
        {
          hintLine: theme.hintAltLine,
          hintStroke: theme.hintAltStroke,
          hintDash: theme.hintAltDash
        }
      )
    }

    prevHint = x1
  }
}

const redrawHintsCanvas = (transform) => {
  hintsContext.save()
  hintsContext.clearRect(0, 0, width, height)

  drawAllHints(transform)

  hintsContext.restore()
}

const zoomed = (transform) => {
  labelContext.save()
  labelContext.clearRect(0, 0, width, height)

  hintsContext.save()
  hintsContext.clearRect(0, 0, width, height)

  context.save()
  context.clearRect(0, 0, width, height)
  context.translate(transform.x, 1)
  context.scale(transform.k, 1)

  drawFill(
    context,
    0,
    -1,
    width,
    barHeight + margin.top + margin.bottom,
    theme.spaceFill
  )

  const zoom = transform.k
  let prevX = 0
  let skipPulse = 0

  const { leftPulse, rightPulse } = getBoundaries(transform)

  if (zoom < breakpointZoom) {
    size = getSize(maxWidth, width)

    pulses = shrinkagePulses(data, width)
  } else {
    size = getSize(data.width, width)

    let sum = 0

    pulses = data.pulses.filter((d) => {
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

  for (let i = 0; i < pulses.length; i++) {
    const x = pulses[i]

    if (x) {
      if ((i + skipPulse) % 2 === 0) {
        drawFill(
          context,
          prevX / size,
          margin.top,
          x / size,
          barHeight,
          theme.hiFill
        )

        drawLine(
          context,
          {
            start: [prevX / size, height - margin.top],
            end: [prevX / size, height - barHeight - margin.top]
          },
          {
            lineWidth: theme.edgeLine / size,
            strokeStyle: theme.edgeStroke
          }
        )

        drawLine(
          context,
          {
            start: [(prevX + x) / size, height - barHeight - margin.top],
            end: [(prevX + x) / size, height - margin.top]
          },
          {
            lineWidth: theme.edgeLine / size,
            strokeStyle: theme.edgeStroke
          }
        )

        drawLine(
          context,
          {
            start: [
              prevX / size,
              height - barHeight - margin.top + theme.hiLine / 2
            ],
            end: [
              (prevX + x) / size,
              height - barHeight - margin.top + theme.hiLine / 2
            ]
          },
          {
            lineWidth: theme.hiLine,
            strokeStyle: theme.hiStroke
          }
        )
      } else {
        drawLine(
          context,
          {
            start: [prevX / size, height - margin.top - theme.loLine / 2],
            end: [(prevX + x) / size, height - margin.top - theme.loLine / 2]
          },
          {
            lineWidth: theme.loLine,
            strokeStyle: theme.loStroke
          }
        )
      }

      const w = x * ((width * transform.k) / data.width)
      if (w > theme.fontSize * 3) {
        drawText(
          labelContext,
          x,
          (prevX + x / 2) * (transform.k / maxZoom) + transform.x,
          height / 2
        )
      }

      prevX = prevX + x
    }
  }

  drawAllHints(transform)

  labelContext.restore()
  hintsContext.restore()
  context.restore()
}
