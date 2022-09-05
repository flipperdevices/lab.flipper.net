/* eslint-disable camelcase */
/**
    @file Pulse Builder JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

/* eslint no-console: "off" */

import { Bitbuffer } from './bitbuffer.js'

function parsePulseString (pulseStr) {
  if (Array.isArray(pulseStr)) {
    return pulseStr
  }
  const pulses = pulseStr.split(/\D/).map(x => parseInt(x, 10))
  return pulses
}

export class PulseBuilder {
  constructor (args) {
    Object.assign(this, args)
    this.build()
  }

  build () {
    this.pulses = []
    // warmup
    if (this.warmup_raw) {
      this.addRaw(this, this.warmup_raw)
    }
    const repeat = this.repeat || 1
    for (let j = 0; j < repeat; ++j) {
      // packet gap
      if (this.gap && j > 0) {
        this.pulses.push(0) // mark
        this.pulses.push(this.gap) // space
      }
      // preamble
      if (this.preamble) {
        const bits = new Bitbuffer(this.preamble)
        this.addCode(this, bits)
      }
      if (this.preamble_raw) {
        this.addRaw(this, this.preamble_raw)
      }
      // sync raw
      if (this.sync_raw) {
        this.addRaw(this, this.sync_raw)
      }
      // syncword
      if (this.syncword) {
        const bits = new Bitbuffer(this.syncword)
        this.addCode(this, bits)
      }
      // payload
      const bits = new Bitbuffer(this.payload)
      this.addCode(this, bits)
      // postamble
      if (this.postamble) {
        const bits = new Bitbuffer(this.postamble)
        this.addCode(this, bits)
      }
      if (this.postamble_raw) {
        this.addRaw(this, this.postamble_raw)
      }
    }
    this.coalesce()

    // jitter
    if (this.jitter) {
      this.addJitter(this)
    }
    return this
  }

  addCode (arg, bits) {
    if (arg.modulation === 'PCM') { this.buildPCM(arg, bits) } else if (arg.modulation === 'MC') { this.buildMC(arg, bits) } else if (arg.modulation === 'PPM') { this.buildPPM(arg, bits) } else if (arg.modulation === 'PWM') { this.buildPWM(arg, bits) } else if (arg.modulation === 'DM') { this.buildDM(arg, bits) } else if (arg.modulation === 'NRZI') { this.buildNRZI(arg, bits) } else if (arg.modulation === 'CMI') { this.buildCMI(arg, bits) } else if (arg.modulation === 'PIWM') { this.buildPIWM(arg, bits) } else { console.log('Unknown modulation!') }
    return arg
  }

  addRaw (arg, pulses) {
    pulses = parsePulseString(pulses)
    // ensure even (mark/space) count
    if (pulses.length % 2) { pulses.push(0) }
    arg.pulses = arg.pulses.concat(pulses)
    return arg
  }

  coalesce () {
    const pulses = []

    let pulse = 0
    for (let j = 0; j < this.pulses.length; j += 2) {
      const m = this.pulses[j] || 0 // mark
      const s = this.pulses[j + 1] || 0 // space
      if (!m && !s) {
        // skip nulls
      } else if (!pulse && !m && pulses.length) {
        // no pulse, append to last
        pulses[pulses.length - 1] += ~~s
      } else if (!s) {
        // no space, buffer
        pulse += m
      } else {
        pulses.push(~~(m + pulse))
        pulses.push(~~(s))
        pulse = 0
      }
    }
    // flush buffered pulse
    if (pulse) {
      pulses.push(~~pulse)
      pulses.push(0)
    }

    this.pulses = pulses
    return this
  }

  addJitter (arg) {
    const jitter = arg.jitter
    const pulses = []

    for (let j = 0; j < arg.pulses.length; ++j) {
      const w = arg.pulses[j] // mark or space
      if (w === 0) {
        pulses.push(w) // keep empty pulses
      } else if (jitter < 1) {
        // relative jitter
        const s = Math.random() * 2 * jitter + 1 - jitter
        pulses.push(~~(w * s))
      } else {
        // absolute jitter
        const s = Math.random() * 2 * jitter - jitter
        pulses.push(~~(w + s))
      }
    }

    arg.pulses = pulses
    return arg
  }

  // returned hints array contains triples of start,end,symbol

  /// Pulse-code modulation (PCM)
  /// https://en.wikipedia.org/wiki/Pulse-code_modulation
  /// either NRZ or RZ
  buildPCM (arg, bits) {
    if (!arg.long || arg.long === arg.short) {
      return this.buildNRZ(arg, bits)
    } else {
      return this.buildRZ(arg, bits)
    }
  }

  /// NRZ(L) NRZL Non-return-to-zero level
  /// https://en.wikipedia.org/wiki/Non-return-to-zero
  buildNRZ (arg, bits) {
    // TODO: wip
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        pulses.push(short)
        pulses.push(0)
      } else {
        pulses.push(0)
        pulses.push(short)
      }
    }

    return arg
  }

  /// Return-to-zero level
  /// https://en.wikipedia.org/wiki/Return-to-zero
  buildRZ (arg, bits) {
    // TODO: wip
    const short = arg.short
    const long = arg.long
    const short_gap = long - short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        pulses.push(short)
        pulses.push(short_gap)
      } else {
        pulses.push(0)
        pulses.push(long)
      }
    }

    return arg
  }

  /// Pulse-position modulation (PPM)
  /// https://en.wikipedia.org/wiki/Pulse-position_modulation
  buildPPM (arg, bits) {
    const pulse = arg.pulse || ~~(arg.short / 3)
    const short = arg.short
    const long = arg.long

    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      pulses.push(pulse) // mark
      if (bit[j]) {
        pulses.push(short) // space
      } else {
        pulses.push(long) // space
      }
    }

    return arg
  }

  /// Pulse-width modulation (PWM)
  /// https://en.wikipedia.org/wiki/Pulse-width_modulation
  buildPWM (arg, bits) {
    const short = arg.short
    const long = arg.long
    const short_gap = arg.short_gap || arg.long
    const long_gap = arg.long_gap || arg.short

    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        pulses.push(short) // mark
        pulses.push(short_gap) // space
      } else {
        pulses.push(long) // mark
        pulses.push(long_gap) // space
      }
    }

    return arg
  }

  /// Manchester code (MC)
  /// https://en.wikipedia.org/wiki/Manchester_code
  buildMC (arg, bits) {
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        pulses.push(short) // mark
        pulses.push(short) // space
      } else {
        pulses.push(0) // mark
        pulses.push(short) // space
        pulses.push(short) // mark
        pulses.push(0) // space
      }
    }

    return arg
  }

  /// Differential Manchester Encoding (DM) aka Biphase Mark Code (CC)
  /// https://en.wikipedia.org/wiki/Differential_Manchester_encoding
  buildDM (arg, bits) {
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    let state = false
    for (let j = 0; j < bit.length; ++j) {
      const b = bit[j]
      if (!b && !state) {
        pulses.push(short) // mark
        pulses.push(short) // space
      } else if (!b && state) {
        pulses.push(0) // mark
        pulses.push(short) // space
        pulses.push(short) // mark
        pulses.push(0) // space
      } else if (b && !state) {
        pulses.push(short * 2) // mark
        pulses.push(0) // space
        state = !state
      } else if (b && state) {
        pulses.push(0) // mark
        pulses.push(short * 2) // space
        state = !state
      }
    }

    return arg
  }

  /// Non-return-to-zero, inverted (NRZI) https://en.wikipedia.org/wiki/Non-return-to-zero#NRZI
  /// NRZ(I) NRZI Non-return-to-zero inverted Refers to either an NRZ(M) or NRZ(S) code.
  /// NRZ(M) NRZM Non-return-to-zero mark Serializer mapping {0: constant, 1: toggle}.
  /// NRZ(S) NRZS Non-return-to-zero space Serializer mapping {0: toggle, 1: constant}.
  /// A 1 is transmitted as a transition, and a 0 is transmitted as no transition.
  buildNRZI (arg, bits) {
    // TODO: wip
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    let state = !bit[0] // force an edge at start
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        state = !state
      }
      if (state) {
        pulses.push(short) // mark
        pulses.push(0) // space
      } else {
        pulses.push(0) // mark
        pulses.push(short) // space
      }
    }

    return arg
  }

  /// Coded Mark Inversion (CMI) https://en.wikipedia.org/wiki/Coded_mark_inversion
  /// encodes zero bits as a half bit time of zero followed by a half bit time of one,
  /// and one bits are encoded as a full bit time of a constant level,
  /// the level used for one bits alternates each time one is coded.
  buildCMI (arg, bits) {
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    let state = false
    for (let j = 0; j < bit.length; ++j) {
      if (!bit[j]) {
        pulses.push(0) // mark
        pulses.push(short) // space
        pulses.push(short) // mark
        pulses.push(0) // space
      } else if (!state) {
        pulses.push(short * 2) // mark
        pulses.push(0) // space
        state = !state
      } else { // if (state)
        pulses.push(0) // mark
        pulses.push(short * 2) // space
        state = !state
      }
    }

    return arg
  }

  /// Pulse-Interval-Width Modulation (PIWM)
  /// Exotic differential coding
  buildPIWM (arg, bits) {
    const short = arg.short
    const pulses = arg.pulses

    const bit = bits.toBitArray()
    for (let j = 0; j < bit.length; ++j) {
      if (bit[j]) {
        pulses.push(short) // mark or space
      } else {
        pulses.push(short * 2) // mark or space
      }
    }
    // add a long trailing space if the bit count was uneven
    if (bit.length % 2) {
      pulses.push(short * 3) // space
    }

    return arg
  }
}
