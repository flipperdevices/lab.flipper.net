/**
    @file RfRaw JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

import { Hexbuffer } from './hexbuffer.js'

export class RfRaw {
  static isRfRaw (line) {
    return line.trim().startsWith('AA')
  }

  static getPulses (line) {
    let pulses = []
    // split codes on '+' or space between '55 AAB'
    line = line.replace(/5\s*5[+\s]+A\s*A\s*B/g, '55;AAB')
    const codes = line.split(';')
    for (const code of codes) {
      const p = RfRaw.getCodePulses(code)
      pulses = pulses.concat(p)
    }
    return pulses
  }

  static getCodePulses (line) {
    // AA B1 04 017C 046A 0BCC 2378 3818190908181908190909090908190819081818190909091A 55
    console.log('parsing rfraw data: ', line)
    const pulses = []
    const buf = new Hexbuffer(line)

    const sync = buf.getByte()
    if (sync !== 0xaa) {
      return pulses
    }

    const fmt = buf.getByte()
    let len
    let buckets
    let repeats
    if (fmt === 0xb1) {
      // s.a. https://github.com/Portisch/RF-Bridge-EFM8BB1/wiki/Decode-0xB1-sniffed-data
      buckets = buf.getByte()
    } else if (fmt === 0xb0) {
      // s.a. https://github.com/Portisch/RF-Bridge-EFM8BB1/wiki/0xB0
      len = buf.getByte()
      buckets = buf.getByte()
      repeats = buf.getByte()
    } else {
      return pulses
    }

    const bucket = []
    for (let b = 0; b < buckets; ++b) {
      bucket[b] = buf.getWord()
    }
    console.log(`buckets: ${buckets} (len ${len} repeats ${repeats}): `, bucket)
    let v3format = false
    const bufSafe = buf.index
    while (buf.hasNibble()) {
      const n = buf.getNibble()
      if (n > 7) {
        v3format = true
        break
      }
    }
    buf.index = bufSafe
    console.log('RfRaw v3 format: ', v3format)

    if (!v3format) {
      pulses.push(0) // rfraw starts with a gap
      while (buf.hasNibble()) {
        if (buf.peekByte() === 0x55) break // sync end
        const b = buf.getNibble()
        if (b > buckets) break // error
        pulses.push(bucket[b])
      }
      pulses.push(0) // rfraw ends with a pulse

      if (repeats) { return new Array(repeats).fill(pulses).flat() }
      return pulses
    }

    let dataHigh = true
    while (buf.hasNibble()) {
      if (buf.peekByte() === 0x55) break // sync end
      const n = buf.getNibble()
      const b = n & 7
      if (b > buckets) break // error
      if (n & 8) {
        if (!dataHigh) { pulses.push(0) }
        pulses.push(bucket[b])
        dataHigh = false
      } else {
        if (dataHigh) { pulses.push(0) }
        pulses.push(bucket[b])
        dataHigh = true
      }
    }
    if (!dataHigh) { pulses.push(0) } // add last gap

    if (repeats) { return new Array(repeats).fill(pulses).flat() }
    return pulses
  }
}
