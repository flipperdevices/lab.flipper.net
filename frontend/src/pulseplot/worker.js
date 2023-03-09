/* eslint-disable camelcase */
import { autorange } from './autorange.js'

let canvas, redrawContext = null

onmessage = function (e) {
  switch (e.data.message) {
    case 'getCanvas':
      canvas = e.data.canvas
      break
    case 'drawCanvas':
      drawCanvas(e.data.context)
      break
    case 'redrawCanvas':
      redrawCanvas(e.data.context)
      break
  }
}

function redrawCanvas (context) {
  redrawContext = context
  requestAnimationFrame(drawCanvas)
}

function drawCanvas (context) {
  if (!context.width) {
    context = redrawContext
  }
  canvas.width = context.width
  canvas.height = context.height
  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: true
  })

  if (context.scroll <= -10) {
    context.scroll = -10
  } else if (context.scroll > context.width * context.zoom) {
    context.scroll = context.width * context.zoom
  }

  const scroll = -context.scroll
  const scale = context.width * context.zoom / context.data.width
  const yHi = context.yHi + 0.5
  const yLo = context.yLo + 0.5

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // time axis
  ctx.font = context.theme.font
  const textMeasure = ctx.measureText('8')
  const fontX = textMeasure.width
  const fontY = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent

  const total_time = context.data.width / 1000000 / context.zoom
  const time_offset = scroll / context.width * total_time
  const time_scale = autorange(total_time, 10.0)
  const total_time_scaled = total_time / time_scale.scale
  const time_offset_scaled = time_offset / time_scale.scale

  ctx.fillStyle = context.theme.timeLabelFill
  ctx.fillText(`t[${time_scale.prefix}s]`, 32, fontY)

  // extra info
  if (context.data.time) { ctx.fillText(`${context.data.time}`, 100, fontY) }
  if (context.data.format || context.data.mod) { ctx.fillText(`${(context.data.format || context.data.mod).toUpperCase()}`, 300, fontY) }
  if (context.data.pulses) { ctx.fillText(`${context.data.pulses.length / 2} pulses`, 330, fontY) }
  const rate_Hz = context.data.rate_Hz || context.data.samplerate_Hz || context.data.rate || context.data.samplerate
  if (rate_Hz) {
    const scale = autorange(rate_Hz, 10.0)
    ctx.fillText(`${rate_Hz / scale.scale} ${scale.prefix}Hz`, 400, fontY)
  }
  const freq_Hz = context.data.freq_Hz || context.data.centerfreq_Hz || context.data.centerfreq
  const freq1_Hz = context.data.freq1_Hz || context.data.freq1
  if (freq1_Hz) {
    const scale = autorange(freq1_Hz, 10.0)
    ctx.fillText(`${(freq1_Hz / scale.scale).toFixed(3)} ${scale.prefix}Hz`, 500, fontY)
  }
  if (freq_Hz && freq1_Hz) {
    ctx.fillStyle = context.theme.timeMinorFill
    ctx.fillRect(700, ~~(fontY / 2), 100, 1)
    ctx.fillStyle = context.theme.timeLabelFill

    const fr = (freq1_Hz - context.data.freq_Hz) * 100 / rate_Hz + 50
    ctx.lineWidth = context.theme.hiLine
    ctx.strokeStyle = context.theme.hiStroke
    ctx.beginPath()
    ctx.moveTo(700 + fr, 0)
    ctx.lineTo(700 + fr, fontY)
    ctx.stroke()
  }
  const freq2_Hz = context.data.freq2_Hz || context.data.freq2
  if (freq2_Hz) {
    const scale = autorange(freq2_Hz, 10.0)
    ctx.fillText(`${(freq2_Hz / scale.scale).toFixed(3)} ${scale.prefix}Hz`, 600, fontY)
  }
  if (freq_Hz && freq2_Hz) {
    const fr = (freq2_Hz - context.data.freq_Hz) * 100 / rate_Hz + 50
    ctx.lineWidth = context.theme.loLine
    ctx.strokeStyle = context.theme.loStroke
    ctx.beginPath()
    ctx.moveTo(700 + fr, 0)
    ctx.lineTo(700 + fr, fontY)
    ctx.stroke()
  }
  const range_dB = context.data.range_dB || context.data.range || 66
  const rssi_dB = context.data.rssi_dB || context.data.rssi
  const snr_dB = context.data.snr_dB || context.data.snr
  const noise_dB = context.data.noise_dB || context.data.noise
  if (rssi_dB && snr_dB && noise_dB) {
    ctx.lineWidth = 1
    ctx.strokeStyle = context.theme.loStroke
    ctx.beginPath()
    ctx.moveTo(900, fontY)
    ctx.lineTo(1000, fontY)
    ctx.stroke()

    ctx.lineWidth = context.theme.hiLine
    ctx.strokeStyle = context.theme.hiStroke
    ctx.beginPath()
    ctx.moveTo(1000 + noise_dB * 100 / range_dB, fontY)
    ctx.lineTo(1000 + rssi_dB * 100 / range_dB, fontY)
    ctx.stroke()

    ctx.fillText(`RSSI ${noise_dB.toFixed(1)} ${snr_dB.toFixed(1)} ${rssi_dB.toFixed(1)} dB`, 900, fontY)
  }

  // want a time marker for about every 85 pixels
  const num_time_markers = context.width / 85
  let time_markers_step = total_time_scaled / num_time_markers
  // round to 5
  time_markers_step = ~~(time_markers_step / 5) * 5
  if (time_markers_step < 1.0) time_markers_step = 1.0

  const time_per_pixel = context.width / total_time_scaled
  // console.log({ time_offset_scaled, total_time_scaled, time_markers_step, time_per_pixel })

  const y = 18
  ctx.fillStyle = context.theme.timeMinorFill
  for (let t = time_offset_scaled; t < total_time_scaled; t += time_markers_step / 5) {
    if (t >= total_time_scaled - time_markers_step) { t = total_time_scaled }
    const x = ~~(t * time_per_pixel)
    ctx.fillRect(x, y + 10, 1, 5)
  }

  ctx.fillStyle = context.theme.timeMajorFill
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
  ctx.lineWidth = context.theme.hintLine
  ctx.strokeStyle = context.theme.hintStroke
  ctx.setLineDash(context.theme.hintDash)
  ctx.beginPath()
  let xp // previous hint (end)
  for (let j = 0; context.data.hints && j < context.data.hints.length; j += 1) {
    const hint = context.data.hints[j]
    const x0 = hint[0] * scale + scroll // start pos
    const x1 = hint[1] * scale + scroll // end pos
    if (xp !== x0 && x0 >= 0 && x0 < context.width) {
      ctx.moveTo(~~x0 - 0.5, context.yHintLo - 0.5)
      ctx.lineTo(~~x0 - 0.5, context.yHintHi + 0.5)
    }
    if (x1 >= 0 && x1 < context.width) {
      ctx.moveTo(~~x1 - 0.5, context.yHintLo - 0.5)
      ctx.lineTo(~~x1 - 0.5, context.yHintHi + 0.5)
    }
    xp = x1
  }
  ctx.stroke()
  ctx.setLineDash([])

  // alt (error) hints
  ctx.lineWidth = context.theme.hintAltLine
  ctx.strokeStyle = context.theme.hintAltStroke
  ctx.setLineDash(context.theme.hintAltDash)
  ctx.beginPath()
  xp = null // previous hint (end)
  for (let j = 0; context.data.hints && j < context.data.hints.length; j += 1) {
    const hint = context.data.hints[j]
    const x0 = hint[0] * scale + scroll // start pos
    const x1 = hint[1] * scale + scroll // end pos
    if (xp !== x0) {
      if (xp && xp >= 0 && xp < context.width) {
        ctx.moveTo(~~xp - 0.5, context.yHintLo - 0.5)
        ctx.lineTo(~~xp - 0.5, context.yHintHi + 0.5)
      }
      if (x0 >= 0 && x0 < context.width) {
        ctx.moveTo(~~x0 - 0.5, context.yHintLo - 0.5)
        ctx.lineTo(~~x0 - 0.5, context.yHintHi + 0.5)
      }
    }
    xp = x1
  }
  ctx.stroke()
  ctx.setLineDash([])

  // hints text
  ctx.fillStyle = context.theme.hintFill
  ctx.beginPath()
  for (let j = 0; context.data.hints && j < context.data.hints.length; j += 1) {
    const hint = context.data.hints[j]
    const x0 = hint[0] * scale + scroll // start pos
    const x1 = hint[1] * scale + scroll // end pos
    const t = hint[2] // text
    const w = x1 - x0
    if (w > fontX) {
      const xt = x0 + w / 2
      if (xt >= 0 && xt < context.width) { ctx.fillText(t, xt - 5, context.yHintText) }
    }
  }
  ctx.stroke()

  if (!context.data.pulses || !context.data.pulses.length) return
  let pulses = context.data.pulses, shrinkRate = 1
  if (context.zoom < 10 && context.data.pulses.length > context.width) {
    pulses = []
    shrinkRate = Math.ceil(context.data.pulses.length / context.width)
    for (let i = 0; i < context.width; i++) {
      pulses.push(context.data.pulses[i * shrinkRate])
    }
  }

  // marks
  let x = scroll
  ctx.lineWidth = context.theme.hiLine
  ctx.strokeStyle = context.theme.hiStroke
  ctx.setLineDash(context.theme.hiDash)
  ctx.fillStyle = context.theme.hiFill
  ctx.beginPath()
  for (let j = 0; j < pulses.length; j += 2) {
    const x0 = x
    x += pulses[j] * scale * shrinkRate // mark
    if ((x0 >= 0 && x0 < context.width) || (x >= 0 && x < context.width) || (x0 < 0 && x > context.width)) {
      ctx.fillRect(~~x0, yHi, ~~(x - x0), yLo - yHi)
      ctx.moveTo(~~x0 - 1, yHi)
      ctx.lineTo(~~x + 0, yHi)
    }
    x += pulses[j + 1] * scale * shrinkRate // space
  }
  ctx.stroke()

  // spaces
  x = scroll
  ctx.lineWidth = context.theme.loLine
  ctx.strokeStyle = context.theme.loStroke
  ctx.setLineDash(context.theme.loDash)
  ctx.fillStyle = context.theme.loFill
  ctx.beginPath()
  for (let j = 0; j < context.data.pulses.length; j += 2) {
    x += pulses[j] * scale * shrinkRate // mark
    const x0 = x
    x += pulses[j + 1] * scale * shrinkRate // space
    if ((x0 >= 0 && x0 < context.width) || (x >= 0 && x < context.width) || (x0 < 0 && x > context.width)) {
      ctx.fillRect(~~x0, yHi, ~~(x - x0), yLo - yHi)
      ctx.moveTo(~~x0 - 1, yLo)
      ctx.lineTo(~~x + 0, yLo)
    }
  }
  ctx.stroke()

  // edges
  x = scroll
  ctx.lineWidth = context.theme.edgeLine
  ctx.strokeStyle = context.theme.edgeStroke
  ctx.setLineDash(context.theme.edgeDash)
  ctx.beginPath()
  for (let j = 0; j < pulses.length; j += 1) {
    if (x >= 0 && x < context.width) {
      ctx.moveTo(~~x - 0.5, yLo - 0.5)
      ctx.lineTo(~~x - 0.5, yHi + 0.5)
    }
    x += pulses[j] * scale * shrinkRate // mark or space
  }
  ctx.stroke()

  // text
  x = scroll
  ctx.fillStyle = context.theme.textFill
  const textY = yHi + (yLo - yHi + fontY) / 2
  for (let j = 0; j < pulses.length; j += 1) {
    const p = pulses[j] // mark or space
    const w = p * scale * shrinkRate
    if (w > 30) {
      const x0 = x + w / 2
      if (x0 >= 0 && x0 < context.width) { ctx.fillText(p, x0 - 10, textY) }
    }
    x += w
  }

  // dots
  const rate = 1000000 / context.data.rate * scale
  x = scroll
  if (rate > 2) {
    const dotW = rate > 4 ? 2 : 1
    ctx.fillStyle = context.theme.dotFill
    for (let j = 0; j < context.data.pulses.length; j += 2) {
      const mark = context.data.pulses[j] * scale // mark
      for (let k = 0; k < mark - rate; k += rate) {
        const x0 = ~~(x + k)
        if (x0 >= 0 && x0 < context.width) { ctx.fillRect(x0, yHi + 0.5, dotW, 3) }
      }
      x += mark
      const space = context.data.pulses[j + 1] * scale // space
      for (let k = 0; k < space - rate; k += rate) {
        const x0 = ~~(x + k)
        if (x0 >= 0 && x0 < context.width) { ctx.fillRect(x0, yLo - 3.5, dotW, 3) }
      }
      x += space
    }
  }
}
