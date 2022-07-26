/* eslint-disable */
(function webpackUniversalModuleDefinition (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') { module.exports = factory() } else if (typeof define === 'function' && define.amd) { define([], factory) } else {
    const a = factory()
    for (const i in a) (typeof exports === 'object' ? exports : root)[i] = a[i]
  }
})(self, function () {
  return /******/ (function () { // webpackBootstrap
    /******/ 'use strict'
    /******/ const __webpack_modules__ = ({

      /***/ './lib/autorange.js':
      /*! **************************!*\
  !*** ./lib/autorange.js ***!
  \**************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ autorange: function () { return /* binding */ autorange },
          /* harmony export */ autorange_time: function () { return /* binding */ autorange_time }
          /* harmony export */ })
        /**
    Determine divisor and SI prefix.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/
        const autoranges = [{
          name: 'yotta',
          scale: 1e24,
          prefix: 'Y'
        }, {
          name: 'zetta',
          scale: 1e21,
          prefix: 'Z'
        }, {
          name: 'exa',
          scale: 1e18,
          prefix: 'E'
        }, {
          name: 'peta',
          scale: 1e15,
          prefix: 'P'
        }, {
          name: 'tera',
          scale: 1e12,
          prefix: 'T'
        }, {
          name: 'giga',
          scale: 1e9,
          prefix: 'G'
        }, {
          name: 'mega',
          scale: 1e6,
          prefix: 'M'
        }, {
          name: 'kilo',
          scale: 1e3,
          prefix: 'k'
        }, {
          name: '',
          scale: 1e0,
          prefix: ''
        }, {
          name: 'milli',
          scale: 1e-3,
          prefix: 'm'
        }, {
          name: 'micro',
          scale: 1e-6,
          prefix: 'µ'
        }, {
          name: 'nano',
          scale: 1e-9,
          prefix: 'n'
        }, {
          name: 'pico',
          scale: 1e-12,
          prefix: 'p'
        }, {
          name: 'femto',
          scale: 1e-15,
          prefix: 'f'
        }, {
          name: 'atto',
          scale: 1e-18,
          prefix: 'a'
        }, {
          name: 'zepto',
          scale: 1e-21,
          prefix: 'z'
        }, {
          name: 'yocto',
          scale: 1e-24,
          prefix: 'y'
        }]
        /** Determine divisor and SI prefix. */

        function autorange (num, min_int = 10.0) {
          if (num == 0.0) return autoranges[8]
          num = num / min_int

          for (let i = 0; i < autoranges.length; ++i) {
            if (num >= autoranges[i].scale) return autoranges[i]
          }

          return autoranges[autoranges.length - 1]
        }

        const autoranges_time = [{
          name: 'year',
          scale: 31557513,
          prefix: 'Y'
        }, {
          name: 'month',
          scale: 2635200,
          prefix: 'M'
        }, {
          name: 'day',
          scale: 86400,
          prefix: 'D'
        }, {
          name: 'hour',
          scale: 3600,
          prefix: 'h'
        }, {
          name: 'minute',
          scale: 60,
          prefix: 'm'
        }, {
          name: 'second',
          scale: 1e0,
          prefix: 's'
        }, {
          name: 'milli',
          scale: 1e-3,
          prefix: 'ms'
        }, {
          name: 'micro',
          scale: 1e-6,
          prefix: 'µs'
        }, {
          name: 'nano',
          scale: 1e-9,
          prefix: 'ns'
        }, {
          name: 'pico',
          scale: 1e-12,
          prefix: 'ps'
        }, {
          name: 'femto',
          scale: 1e-15,
          prefix: 'fs'
        }, {
          name: 'atto',
          scale: 1e-18,
          prefix: 'as'
        }, {
          name: 'zepto',
          scale: 1e-21,
          prefix: 'zs'
        }, {
          name: 'yocto',
          scale: 1e-24,
          prefix: 'ys'
        }]
        /** Determine SI divisor or Sexagesimal multiplier and suffix. */

        function autorange_time (num, min_int = 10.0) {
          if (num == 0.0) return autoranges_time[8]
          num = num / min_int

          for (let i = 0; i < autoranges_time.length; ++i) {
            if (num >= autoranges_time[i].scale) return autoranges_time[i]
          }

          return autoranges_time[autoranges_time.length - 1]
        }
        /***/ },

      /***/ './lib/bitbuffer.js':
      /*! **************************!*\
  !*** ./lib/bitbuffer.js ***!
  \**************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ Bitbuffer: function () { return /* binding */ Bitbuffer }
          /* harmony export */ })
        /**
    @file Bitbuffer JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/
        // function dec2hex(i) {
        //    return (i + 0x100).toString(16).substr(-2).toUpperCase()
        // }
        class Bitbuffer {
          constructor (bytes = [], len = 0) {
            if (Array.isArray(bytes)) {
              this.bytes = bytes
              this.len = len || bytes.length * 8
            } else {
              this.fromString(bytes)
            }
          }

          fromString (s) {
            this.bytes = []
            this.len = 0
            let len = -1
            s = s.trim() // parse length

            if (s.startsWith('{')) {
              const end = s.indexOf('}')
              if (end < 0) return
              len = parseInt(s.slice(1), 10)
              s = s.slice(end + 1)
            } // skip 0x prefix

            if (s.startsWith('0x')) {
              s = s.slice(2)
            } // parse nibbles

            for (const c of s) {
              const n = parseInt(c, 16)
              this.pushNibble(n)
            } // set length if given

            if (len >= 0) this.len = len
          }

          pushZero () {
            this.push(0)
          }

          pushOne () {
            this.push(1)
          }

          pushSymbol (s) {
            if (s == '0') this.push(0); else if (s == '1') this.push(1)
          }

          push (bit) {
            bit = bit ? 0x80 : 0
            this.bytes[~~(this.len / 8)] |= bit >> this.len % 8
            this.len += 1
          }

          pushNibble (n) {
            for (let j = 3; j >= 0; --j) {
              this.push(n >> j & 1)
            }
          }

          pushByte (n) {
            for (let j = 7; j >= 0; --j) {
              this.push(n >> j & 1)
            }
          }

          pushBreak () {
            const b = ~~((this.len + 7) / 8)
            this.bytes[b] = -1
            this.len = (b + 1) * 8
          }

          toBitArray () {
            const bits = []

            for (let j = 0; j < this.len; ++j) {
              const byte = this.bytes[~~(j / 8)] || 0
              const bit = byte >> 7 - j % 8 & 1
              bits.push(bit)
            }

            return bits
          }

          toHexString () {
            let s = `{${this.len}}`

            for (let j = 0; j < this.len; j += 8) {
              const b = this.bytes[~~(j / 8)] || 0

              if (b < 0) {
                s += ' / '
              } else {
                s += ' '
                s += (b >> 4).toString(16).toUpperCase()
                if (j + 4 < this.len) s += (b & 0xf).toString(16).toUpperCase()
              }
            }

            return s
          }
        }
        /***/ },

      /***/ './lib/builder.js':
      /*! ************************!*\
  !*** ./lib/builder.js ***!
  \************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ PulseBuilder: function () { return /* binding */ PulseBuilder }
          /* harmony export */ })
        /* harmony import */ const _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bitbuffer.js */ './lib/bitbuffer.js')
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

        function parsePulseString (pulseStr) {
          if (Array.isArray(pulseStr)) {
            return pulseStr
          }

          const pulses = pulseStr.split(/\D/).map(x => parseInt(x, 10))
          return pulses
        }

        class PulseBuilder {
          constructor (args) {
            Object.assign(this, args)
            this.build()
          }

          build () {
            this.pulses = [] // warmup

            if (this.warmup_raw) {
              this.addRaw(this, this.warmup_raw)
            }

            const repeat = this.repeat || 1

            for (let j = 0; j < repeat; ++j) {
              // packet gap
              if (this.gap && j > 0) {
                this.pulses.push(0) // mark

                this.pulses.push(this.gap) // space
              } // preamble

              if (this.preamble) {
                const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer(this.preamble)
                this.addCode(this, bits)
              }

              if (this.preamble_raw) {
                this.addRaw(this, this.preamble_raw)
              } // sync raw

              if (this.sync_raw) {
                this.addRaw(this, this.sync_raw)
              } // syncword

              if (this.syncword) {
                const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer(this.syncword)
                this.addCode(this, bits)
              } // payload

              const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer(this.payload)
              this.addCode(this, bits) // postamble

              if (this.postamble) {
                const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer(this.postamble)
                this.addCode(this, bits)
              }

              if (this.postamble_raw) {
                this.addRaw(this, this.postamble_raw)
              }
            }

            this.coalesce() // jitter

            if (this.jitter) {
              this.addJitter(this)
            }

            return this
          }

          addCode (arg, bits) {
            if (arg.modulation == 'PCM') this.buildPCM(arg, bits); else if (arg.modulation == 'MC') this.buildMC(arg, bits); else if (arg.modulation == 'PPM') this.buildPPM(arg, bits); else if (arg.modulation == 'PWM') this.buildPWM(arg, bits); else if (arg.modulation == 'DM') this.buildDM(arg, bits); else if (arg.modulation == 'NRZI') this.buildNRZI(arg, bits); else if (arg.modulation == 'CMI') this.buildCMI(arg, bits); else if (arg.modulation == 'PIWM') this.buildPIWM(arg, bits); else console.log('Unknown modulation!')
            return arg
          }

          addRaw (arg, pulses) {
            pulses = parsePulseString(pulses) // ensure even (mark/space) count

            if (pulses.length % 2) pulses.push(0)
            arg.pulses = arg.pulses.concat(pulses)
            return arg
          }

          coalesce () {
            const pulses = []
            let pulse = 0

            for (let j = 0; j < this.pulses.length; j += 2) {
              const m = this.pulses[j] || 0 // mark

              const s = this.pulses[j + 1] || 0 // space

              if (!m && !s) { // skip nulls
              } else if (!pulse && !m && pulses.length) {
                // no pulse, append to last
                pulses[pulses.length - 1] += ~~s
              } else if (!s) {
                // no space, buffer
                pulse += m
              } else {
                pulses.push(~~(m + pulse))
                pulses.push(~~s)
                pulse = 0
              }
            } // flush buffered pulse

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

              if (w == 0) {
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
          } // returned hints array contains triples of start,end,symbol
          /// Pulse-code modulation (PCM)
          /// https://en.wikipedia.org/wiki/Pulse-code_modulation
          /// either NRZ or RZ

          buildPCM (arg, bits) {
            if (!arg.long || arg.long == arg.short) {
              return this.buildNRZ(arg, bits)
            } else {
              return this.buildRZ(arg, bits)
            }
          } /// NRZ(L) NRZL Non-return-to-zero level
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
          } /// Return-to-zero level
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
          } /// Pulse-position modulation (PPM)
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
          } /// Pulse-width modulation (PWM)
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
          } /// Manchester code (MC)
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
          } /// Differential Manchester Encoding (DM) aka Biphase Mark Code (CC)
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
          } /// Non-return-to-zero, inverted (NRZI) https://en.wikipedia.org/wiki/Non-return-to-zero#NRZI
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
          } /// Coded Mark Inversion (CMI) https://en.wikipedia.org/wiki/Coded_mark_inversion
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
              } else {
                // if (state)
                pulses.push(0) // mark

                pulses.push(short * 2) // space

                state = !state
              }
            }

            return arg
          } /// Pulse-Interval-Width Modulation (PIWM)
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
            } // add a long trailing space if the bit count was uneven

            if (bit.length % 2) {
              pulses.push(short * 3) // space
            }

            return arg
          }
        }
        /***/ },

      /***/ './lib/demos.js':
      /*! **********************!*\
  !*** ./lib/demos.js ***!
  \**********************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ getDemos: function () { return /* binding */ getDemos },
          /* harmony export */ Demos: function () { return /* binding */ Demos }
          /* harmony export */ })
        function getDemos () {
          const demos = []

          for (const key in Demos) {
            const demo = Demos[key]
            demos.push({
              title: demo.name,
              key: key,
              value: demo
            })
          }

          return demos
        }
        const Demos = {
          thgr221_mc: {
            name: 'THGR221 MC',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'MC',
            warmup_raw: false,
            preamble: 'fffffe',
            preamble_raw: false,
            syncword: false,
            sync_raw: false,
            payload: 'be28512a95880d82e453fffffebe28512a95880d82e453fffffebe28512a95880d82e452',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            short: 500,
            gap: 0,
            repeat: 1,
            jitter: 5
          },
          vailant_dm: {
            name: 'Vailant DM',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'DM',
            warmup_raw: false,
            preamble: false,
            preamble_raw: false,
            syncword: false,
            sync_raw: false,
            payload: '{130}ffff814990fffbfffffed2ff4136807fc',
            // last byte is only 2 bits
            // payload: [0xff, 0xff, 0x81, 0x49, 0x90, 0xff, 0xfb, 0xff, 0xff, 0xfe, 0xd2, 0xff, 0x41, 0x36, 0x80, 0x7f, 0xc0], // last byte is only 2 bits
            // payload: [0xff, 0xff, 0x81, 0x49, 0x90, 0xff, 0xfb, 0xff, 0x7f, 0xfe, 0xd2, 0xff, 0x41, 0x76, 0x80, 0x7f, 0xc0], // last byte is only 2 bits
            payload_invert: false,
            postamble: false,
            postamble_raw: [0, 16764],
            short: 830,
            gap: 0,
            repeat: 2,
            jitter: 10
          },
          fody_pcm: {
            name: 'Fody PCM (NRZ)',
            format: 'FSK',
            rate: 250000,
            timescale: '1us',
            modulation: 'PCM',
            warmup_raw: false,
            preamble: '00aaaaaaaaaa',
            preamble_raw: false,
            syncword: '2dd4',
            sync_raw: false,
            payload: 'f4f5edffffffffffedc8ffffff0b0a12000000000012370000000000',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            short: 488,
            long: false,
            gap: 0,
            repeat: 1,
            jitter: 4
          },
          pcm_rz: {
            name: 'PCM (RZ) test',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'PCM',
            warmup_raw: false,
            preamble: 'aaaaaaa9',
            preamble_raw: false,
            syncword: false,
            sync_raw: false,
            payload: 'a0ff',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            short: 500,
            long: 1000,
            gap: 0,
            repeat: 1,
            jitter: 10
          },
          proove_ppm: {
            name: 'Proove PPM',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'PPM',
            warmup_raw: false,
            preamble: false,
            preamble_raw: [280, 2600],
            syncword: false,
            sync_raw: false,
            payload: '59A6A9AA66666955',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            pulse: 260,
            short: 270,
            long: 1300,
            gap: 10000,
            repeat: 15,
            jitter: 0.05
          },
          bresser3ch_pwm: {
            name: 'Bresser-3ch PWM',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'PWM',
            warmup_raw: false,
            preamble: false,
            preamble_raw: [750, 700, 750, 700, 750, 700, 750, 700],
            syncword: false,
            sync_raw: false,
            payload: 'e8d9f3bf76',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            short: 260,
            long: 500,
            sync: 750,
            short_gap: 470,
            long_gap: 227,
            gap: 1000,
            repeat: 15,
            jitter: 0.05
          },
          pwm_fixedgap: {
            name: 'PWM (fixed gap) test',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'PWM',
            warmup_raw: false,
            preamble: 'aaaaaaa9',
            preamble_raw: false,
            syncword: false,
            sync_raw: false,
            payload: 'a0ff',
            payload_invert: false,
            postamble: false,
            postamble_raw: false,
            short: 500,
            long: 1000,
            short_gap: 500,
            long_gap: 500,
            gap: 0,
            repeat: 1,
            jitter: 0.05
          },
          klimalogg_nrzi: {
            name: 'Klimalogg NRZI',
            format: 'OOK',
            rate: 250000,
            timescale: '1us',
            modulation: 'NRZI',
            warmup_raw: false,
            preamble: '067ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe',
            preamble_raw: false,
            syncword: false,
            sync_raw: false,
            payload: '619fe6600fffc3c333fcffcff30fffc3ffffc33333fcffffffffff8007e0',
            payload_invert: false,
            postamble: false,
            postamble_raw: [0, 10000],
            short: 12,
            long: false,
            gap: 0,
            repeat: 1,
            jitter: 2
          }
        }
        /***/ },

      /***/ './lib/dropzone.js':
      /*! *************************!*\
  !*** ./lib/dropzone.js ***!
  \*************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ DropZone: function () { return /* binding */ DropZone }
          /* harmony export */ })
        /* harmony import */ const _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ './lib/utils.js')
        /**
    @file DropZone JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

        /* eslint no-console: "off" */

        class DropZone {
          constructor (elementOrSelector, fileLoader) {
            elementOrSelector = elementOrSelector || '#dropZone'
            elementOrSelector = (0, _utils_js__WEBPACK_IMPORTED_MODULE_0__.selector)(elementOrSelector) // https://css-tricks.com/drag-and-drop-file-uploading/

            this.dropZone = elementOrSelector
            this.fileLoader = fileLoader
            this.inputEls = []
            this.dragEnteredEls = []
            window.addEventListener('dragenter', this)
            window.addEventListener('dragleave', this)
            window.addEventListener('dropleave', this)
            const events = ['dragenter', 'dragover', 'dragleave', 'drop']
            events.forEach(evt => this.dropZone.addEventListener(evt, this, false))
          }

          addInput (elementOrSelector) {
            elementOrSelector = elementOrSelector || '#inputfile'
            elementOrSelector = (0, _utils_js__WEBPACK_IMPORTED_MODULE_0__.selector)(elementOrSelector)
            elementOrSelector.addEventListener('change', this, false)
            this.inputEls.push(elementOrSelector)
          }

          destroy () {
            window.removeEventListener('dragenter', this, false)
            window.removeEventListener('dragleave', this, false)
            window.removeEventListener('dropleave', this, false)
            const events = ['dragenter', 'dragover', 'dragleave', 'drop']
            events.forEach(evt => this.dropZone.removeEventListener(evt, this, false))

            for (const el of this.inputEls) {
              el.removeEventListener('change', this, false)
            }
          }

          allowDrag (e) {
            // ...Test that the item being dragged is a valid one
            e.dataTransfer.dropEffect = 'copy'
            e.preventDefault()
          }

          handleDrop (e) {
            e.preventDefault()
            this.handleFileSelect(e)
          } // https://www.html5rocks.com/en/tutorials/file/dndfiles/

          handleFileSelect (evt) {
            evt.stopPropagation()
            evt.preventDefault() // const files = evt.dataTransfer.files // FileList object.
            // const files = evt.target.files // FileList object

            const files = 'dataTransfer' in evt ? evt.dataTransfer.files : evt.target.files // files is a FileList of File objects. List some properties.

            for (let i = 0, file; file = files[i]; i++) {
              // output some info right away?
              // Blob.arrayBuffer() promise isn't generally supported
              // use older FileReader.readAsArrayBuffer()
              const reader = new FileReader() // Closure to capture the file information.

              reader.onload = e => {
                // Process data
                file.fileBuffer = e.target.result // console.log(file.name)

                this.fileLoader(file)
              } // Read in the image file as a data URL.

              reader.readAsArrayBuffer(file)
            }
          } // events

          handleEvent (e) {
            const handler = e.type

            if (typeof this[handler] === 'function') {
              e.preventDefault()
              return this[handler](e)
            }
          }

          dragenter (e) {
            this.dragEnteredEls.push(e.target)
            document.documentElement.classList.add('dragdrop')
            this.dropZone.classList.add('active')
          }

          dragover (e) {
            this.dropZone.classList.add('hover')
            this.allowDrag(e)
          }

          dragleave (e) {
            const index = this.dragEnteredEls.indexOf(e.target)

            if (index > -1) {
              this.dragEnteredEls.splice(index, 1)
            }

            if (this.dragEnteredEls.indexOf(this.dropZone) < 0) {
              this.dropZone.classList.remove('hover')
            }

            if (this.dragEnteredEls.length === 0) {
              document.documentElement.classList.remove('dragdrop')
              this.dropZone.classList.remove('active')
            }
          }

          dropleave () {
            this.dragEnteredEls.splice(0)
            this.dropZone.classList.remove('hover')
            this.dropZone.classList.remove('active')
            document.documentElement.classList.remove('dragdrop')
          }

          drop (e) {
            const event = new Event('dropleave')
            window.dispatchEvent(event)
            this.handleDrop(e)
          }

          change (e) {
            this.handleFileSelect(e)
          }
        }
        /***/ },

      /***/ './lib/hexbuffer.js':
      /*! **************************!*\
  !*** ./lib/hexbuffer.js ***!
  \**************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ Hexbuffer: function () { return /* binding */ Hexbuffer }
          /* harmony export */ })
        /**
    @file Hexbuffer JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/
        function dec2hex (i, w = 2) {
          return (i + 0x10000).toString(16).substr(-w).toUpperCase()
        }

        class Hexbuffer {
          constructor (line = '') {
            this.fromString(line)
          }

          fromString (s) {
            this.line = s.replace(/\s/g, '')
            this.index = 0
          }

          hasNibble () {
            return this.index + 1 <= this.line.length
          }

          hasByte () {
            return this.index + 2 <= this.line.length
          }

          hasWord () {
            return this.index + 4 <= this.line.length
          }

          peekNibble () {
            return parseInt(this.line.substr(this.index, 1), 16)
          }

          peekByte () {
            return parseInt(this.line.substr(this.index, 2), 16)
          }

          peekWord () {
            return parseInt(this.line.substr(this.index, 4), 16)
          }

          getNibble () {
            const r = parseInt(this.line.substr(this.index, 1), 16)
            this.index += 1
            return r
          }

          getByte () {
            const r = parseInt(this.line.substr(this.index, 2), 16)
            this.index += 2
            return r
          }

          getWord () {
            const r = parseInt(this.line.substr(this.index, 4), 16)
            this.index += 4
            return r
          }

          pushNibble (v) {
            this.line += dec2hex(v, 1)
          }

          pushByte (v) {
            this.line += dec2hex(v, 2)
          }

          pushWord (v) {
            this.line += dec2hex(v, 4)
          }
        }
        /***/ },

      /***/ './lib/histogram.js':
      /*! **************************!*\
  !*** ./lib/histogram.js ***!
  \**************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ Histogram: function () { return /* binding */ Histogram },
          /* harmony export */ Analyzer: function () { return /* binding */ Analyzer }
          /* harmony export */ })
        /* harmony import */ const _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./hexbuffer.js */ './lib/hexbuffer.js')
        /**
    @file Histogram JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

        /* eslint no-console: "off" */

        const max_hist_bins = 16 /// Histogram data for single bin

        class Bin {
          constructor (num) {
            if (typeof num !== 'undefined') {
              this.count = 1
              this.sum = num
              this.mean = num
              this.devi = 0
              this.min = num
              this.max = num
            } else {
              this.count = 0
              this.sum = 0
              this.mean = null
              this.devi = 0
              this.min = null
              this.max = null
            }
          }

          add (num) {
            this.count++
            this.sum += num
            this.mean = this.sum / this.count
            this.min = this.min === null ? num : Math.min(num, this.min)
            this.max = this.max === null ? num : Math.max(num, this.max)
            this.devi = (this.max - this.min) / 2
          }

          fuse (bin) {
            this.count += bin.count
            this.sum += bin.sum
            this.mean = this.sum / this.count
            this.min = Math.min(this.min, bin.min)
            this.max = Math.max(this.max, bin.max)
            this.devi = (this.max - this.min) / 2
          }

          contains (num) {
            return num >= this.min && num <= this.max
          }
        } /// Histogram data for all bins

        class Histogram {
          constructor (data, tolerance = 0.2) {
            this.bins = []
            this.histogram_sum(data, tolerance)
          }

          get length () {
            return this.bins.length
          } /// Generate a histogram (unsorted)

          histogram_sum (data, tolerance = 0.2) {
            const len = data.length

            for (let n = 0; n < len; ++n) {
              // Search for match in existing bins
              let bin

              for (bin = 0; bin < this.bins.length; ++bin) {
                const bn = data[n]
                const bm = this.bins[bin].mean

                if (Math.abs(bn - bm) < tolerance * Math.max(bn, bm)) {
                  this.bins[bin].add(data[n])
                  break // Match found! Data added to existing bin
                }
              } // No match found? Add new bin

              if (bin == this.bins.length && bin < max_hist_bins) {
                this.bins.push(new Bin(data[n]))
              }
            }
          } /// Delete bin from histogram

          delete_bin (index) {
            this.bins.splice(index, 1)
          } /// Swap two bins in histogram

          swap_bins (index1, index2) {
            if (index1 < this.bins.length && index2 < this.bins.length) {
              // Avoid out of bounds
              const tempbin = this.bins[index1]
              this.bins[index1] = this.bins[index2]
              this.bins[index2] = tempbin
            }
          } /// Sort histogram with mean value (order lowest to highest)

          sort_mean () {
            if (this.bins.length < 2) return // Avoid underflow
            // Compare all bins (bubble sort)

            for (let n = 0; n < this.bins.length - 1; ++n) {
              for (let m = n + 1; m < this.bins.length; ++m) {
                if (this.bins[m].mean < this.bins[n].mean) {
                  this.swap_bins(m, n)
                }
              }
            }
          } /// Sort histogram with count value (order lowest to highest)

          sort_count () {
            if (this.bins.length < 2) return // Avoid underflow
            // Compare all bins (bubble sort)

            for (let n = 0; n < this.bins.length - 1; ++n) {
              for (let m = n + 1; m < this.bins.length; ++m) {
                if (this.bins[m].count < this.bins[n].count) {
                  this.swap_bins(m, n)
                }
              }
            }
          } /// Fuse histogram bins with means within tolerance

          fuse_bins (tolerance = 0.2) {
            if (this.bins.length < 2) return // Avoid underflow
            // Compare all bins

            for (let n = 0; n < this.bins.length - 1; ++n) {
              for (let m = n + 1; m < this.bins.length; ++m) {
                const bn = this.bins[n].mean
                const bm = this.bins[m].mean // if within tolerance

                if (Math.abs(bn - bm) < tolerance * Math.max(bn, bm)) {
                  // Fuse data for bin[n] and bin[m]
                  this.bins[n].fuse(this.bins[m]) // Delete bin[m]

                  this.delete_bin(m)
                  m-- // Compare new bin in same place!
                }
              }
            }
          } /// Trim zero-width bins

          trim_bins (tolerance = 0) {
            for (let n = 0; n < this.bins.length; ++n) {
              // if within tolerance
              if (this.bins[n].mean <= tolerance) {
                // Delete bin[n]
                this.delete_bin(n)
              }
            }
          } /// Find bin index

          find_bin_index (width) {
            for (let n = 0; n < this.bins.length; ++n) {
              if (this.bins[n].contains(width)) {
                return n
              }
            }

            return -1
          } /// Print a histogram

          console_print () {
            for (let n = 0; n < this.bins.length; ++n) {
              const b = this.bins[n]
              console.log(`[${n}] ${b.count} × ${b.mean.toFixed(1)} ±${b.devi.toFixed(1)} µs [${b.min};${b.max}]`)
            }
          }

          string_print (separator = ', ') {
            const ret = []

            for (let n = 0; n < this.bins.length; ++n) {
              const b = this.bins[n]
              ret.push(`${b.count}× ${b.mean.toFixed(1)} <small>±${b.devi.toFixed(1)}</small> µs`)
            }

            return ret.join(separator)
          }
        }
        class Analyzer {
          constructor (data, tolerance = 0.2) {
            this.analyse_pulses(data, tolerance)
            this.create_rfraw(data)
          } /// Create histograms from pulse data

          analyse_pulses (data, messages, tolerance = 0.2) {
            // Generate pulse/gap/period data
            this.pulses = []
            this.gaps = []
            this.periods = []
            this.pulse_sum = 0
            this.gap_sum = 0 // Leave out last gap (end)

            for (let j = 0; j < data.length - 2; j += 2) {
              const m = data[j] // mark

              const s = data[j + 1] // space

              this.pulses.push(m)
              this.gaps.push(s)
              this.periods.push(m + s)
              this.pulse_sum += m
              this.gap_sum += s
            }

            const m = data[data.length - 2] // last mark
            // const s = data[data.length - 1] // last space

            this.pulses.push(m)
            this.pulse_sum += m // this.gap_sum += s

            this.pulse_gap_ratio = this.pulse_sum / this.gap_sum
            this.pulse_gap_skew = this.pulse_gap_ratio - 1 // Generate statistics

            this.hist_pulses = new Histogram(this.pulses, tolerance)
            this.hist_gaps = new Histogram(this.gaps, tolerance)
            this.hist_periods = new Histogram(this.periods, tolerance)
            this.hist_timings = new Histogram(data, tolerance) // Trim zero-width bins

            this.hist_pulses.trim_bins(tolerance)
            this.hist_gaps.trim_bins(tolerance)
            this.hist_periods.trim_bins(tolerance)
            this.hist_timings.trim_bins(tolerance) // Fuse overlapping bins

            this.hist_pulses.fuse_bins(tolerance)
            this.hist_gaps.fuse_bins(tolerance)
            this.hist_periods.fuse_bins(tolerance)
            this.hist_timings.fuse_bins(tolerance)
          }

          guess () {
            const pulses = this.hist_pulses
            const gaps = this.hist_gaps
            const periods = this.hist_periods
            pulses.sort_mean() // Easier to work with sorted data

            gaps.sort_mean()

            if (pulses.bins.length > 0 && pulses.bins[0].mean == 0) {
              pulses.delete_bin(0) // Remove FSK initial zero-bin
            } // if (pulses.bins[0].mean <= 9 && pulses.bins[0].count <= 2) {
            //    pulses.delete_bin(0) // Remove stray pulses
            // }
            // Attempt to find a matching modulation
            // console.log(`${pulses.length} ${gaps.length} ${periods.length}`)

            if (this.pulses.length == 1) {
              return {
                name: 'Single pulse detected. Probably Frequency Shift Keying or just noise...'
              }
            } else if (pulses.length == 1 && gaps.length == 1) {
              return {
                name: 'Un-modulated signal. Maybe a preamble...'
              }
            } else if (pulses.length == 1 && gaps.length > 1) {
              return {
                name: 'Pulse Position Modulation with fixed pulse width',
                modulation: 'PPM',
                short: gaps.bins[0].mean,
                long: gaps.bins[1].mean,
                gap: gaps.bins[1].max * 1.2,
                // Set limit above next lower gap
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else if (pulses.length == 2 && gaps.length == 1) {
              const short = pulses.bins[0].mean
              const long = pulses.bins[1].mean
              return {
                name: 'Pulse Width Modulation with fixed gap',
                modulation: 'PWM',
                short: short,
                long: long,
                tolerance: (long - short) * 0.4,
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else if (pulses.length == 2 && gaps.length == 2 && periods.length == 1) {
              const short = pulses.bins[0].mean
              const long = pulses.bins[1].mean
              return {
                name: 'Pulse Width Modulation with fixed period',
                modulation: 'PWM',
                short: short,
                long: long,
                tolerance: (long - short) * 0.4,
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else if (pulses.length == 2 && gaps.length == 2 && periods.length == 3) {
              const short = pulses.bins[0].mean
              return {
                name: 'Manchester coding (PCM)',
                modulation: 'MC',
                short: short,
                // Assume shortest pulse is half period
                long: short,
                // Not used
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else if (pulses.length == 2 && gaps.length >= 3) {
              const short = pulses.bins[0].mean
              const long = pulses.bins[1].mean
              return {
                name: 'Pulse Width Modulation with multiple packets',
                modulation: 'PWM',
                short: short,
                long: long,
                gap: gaps.bins[1].max * 1.2,
                // Set limit above second gap
                tolerance: (long - short) * 0.4,
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else if (pulses.length >= 3 && gaps.length >= 3 && Math.abs(pulses.bins[1].mean - 2 * pulses.bins[0].mean) <= pulses.bins[0].mean / 8 && // Pulses are multiples of shortest pulse
    Math.abs(pulses.bins[2].mean - 3 * pulses.bins[0].mean) <= pulses.bins[0].mean / 8 && Math.abs(gaps.bins[0].mean - pulses.bins[0].mean) <= pulses.bins[0].mean / 8 && // Gaps are multiples of shortest pulse
    Math.abs(gaps.bins[1].mean - 2 * pulses.bins[0].mean) <= pulses.bins[0].mean / 8 && Math.abs(gaps.bins[2].mean - 3 * pulses.bins[0].mean) <= pulses.bins[0].mean / 8) {
              return {
                name: 'Pulse Code Modulation (Not Return to Zero)',
                modulation: 'PCM',
                short: pulses.bins[0].mean,
                // Shortest pulse is bit width
                long: pulses.bins[0].mean,
                // Bit period equal to pulse length (NRZ)
                reset: pulses.bins[0].mean * 1024 // No limit to run of zeros...

              }
            } else if (pulses.length == 3) {
              // Re-sort to find lowest pulse count index (is probably delimiter)
              pulses.sort_count()
              const p1 = pulses.bins[1].mean
              const p2 = pulses.bins[2].mean
              const short = p1 < p2 ? p1 : p2 // Set to shorter pulse width

              const long = p1 < p2 ? p2 : p1 // Set to longer pulse width

              return {
                name: 'Pulse Width Modulation with sync/delimiter',
                modulation: 'PWM',
                short: short,
                long: long,
                sync: pulses.bins[0].mean,
                // Set to lowest count pulse width
                reset: gaps.bins[gaps.length - 1].max * 1.2 // Set limit above biggest gap

              }
            } else {
              return {
                name: 'No clue...'
              }
            }
          }

          create_rfraw (data) {
            const timings = this.hist_timings

            if (timings.bins.length < 1) {
              return ''
            }

            if (timings.bins.length > 8) {
              return ''
            }

            if (data.length > 494) {
              return ''
            }

            const raw = new _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Hexbuffer()

            for (const b of timings.bins) {
              raw.pushWord(b.mean)
            }

            for (let j = 0; j < data.length - 1; j += 2) {
              const m = data[j] // mark

              const s = data[j + 1] // space

              const mi = timings.find_bin_index(m)
              const si = timings.find_bin_index(s)
              raw.pushNibble(mi | 8)
              raw.pushNibble(si)
            }

            raw.pushByte(0x55)
            const raw0 = new _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Hexbuffer()
            raw0.pushByte(0xaa)
            raw0.pushByte(0xb0)
            raw0.pushByte(2 + raw.line.length / 2 - 1)
            raw0.pushByte(timings.bins.length)
            raw0.pushByte(1) // repeats

            const raw1 = new _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Hexbuffer()
            raw1.pushByte(0xaa)
            raw1.pushByte(0xb1)
            raw1.pushByte(timings.bins.length)
            this.rfrawB0 = raw0.line + raw.line
            this.rfrawB1 = raw1.line + raw.line
          }

          console_log () {
            const guess = this.guess()
            console.log('Analyzing pulses...')
            console.log(`Total count: ${this.pulses.length}`)
            console.log('Pulse width distribution:')
            this.hist_pulses.console_print()
            console.log('Gap width distribution:')
            this.hist_gaps.console_print()
            console.log('Pulse period distribution:')
            this.hist_periods.console_print()
            console.log('Pulse timing distribution:')
            this.hist_timings.console_print()
            console.log(`DC bias (Pulse/Gap skew): ${(this.pulse_gap_skew * 100).toFixed(1)}`)
            console.log('Guessing modulation:')
            console.log(guess)
          }

          print_plain (messages) {
            const guess = this.guess()
            messages.innerHTML = `
        <div>Pulses: ${this.hist_pulses.string_print()}</div>
        <div>Gaps: ${this.hist_gaps.string_print()}</div>
        <div>Periods: ${this.hist_periods.string_print()}</div>
        <div>Timings: ${this.hist_timings.string_print()}</div>
        <div>${guess.name}</div>
        `
          }
          /*
  const locale = new Intl.NumberFormat().resolvedOptions().locale
  const formatter = new Intl.NumberFormat(locale, {
      style: 'percent',
      signDisplay: 'exceptZero',
      maximumFractionDigits: 1,
  })
  formatter.format(0.5)
  */

          print (timings, messages) {
            const guess = this.guess()

            if (timings) {
              timings.innerHTML = `<table>
            <tr><th>Pulses</th><td>${this.hist_pulses.string_print('</td><td>')}</td></tr>
            <tr><th>Gaps</th><td>${this.hist_gaps.string_print('</td><td>')}</td></tr>
            <tr><th>Periods</th><td>${this.hist_periods.string_print('</td><td>')}</td></tr>
            <tr><th>Timings</th><td>${this.hist_timings.string_print('</td><td>')}</td></tr>
            </table>
            `
            }

            if (messages) {
              messages.innerHTML = `
            <div><small>DC bias (Pulse/Gap skew): ${(this.pulse_gap_skew * 100).toFixed(1)}%</small><br>
            Guessing modulation: <strong>${guess.name}</strong><br>
            modulation: <strong>${guess.modulation}</strong>
            short: <strong>${guess.short ? guess.short.toFixed(1) : '-'}</strong>
            long: <strong>${guess.long ? guess.long.toFixed(1) : '-'}</strong>
            sync: <strong>${guess.sync ? guess.sync.toFixed(1) : '-'}</strong>
            gap: <strong>${guess.gap ? guess.gap.toFixed(1) : '-'}</strong>
            reset: <strong>${guess.reset ? guess.reset.toFixed(1) : '-'}</strong><br>
            <small>RfRaw (rx): <strong>${this.rfrawB1 ? this.rfrawB1 : '-'}</strong></small><br>
            <small>RfRaw (tx): <strong>${this.rfrawB0 ? this.rfrawB0 : '-'}</strong></small>
            </div>
            `
            }
          }
        }
        /***/ },

      /***/ './lib/pulseplot.js':
      /*! **************************!*\
  !*** ./lib/pulseplot.js ***!
  \**************************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ Pulseplot: function () { return /* binding */ Pulseplot }
          /* harmony export */ })
        /* harmony import */ const _autorange_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./autorange.js */ './lib/autorange.js')
        /* harmony import */ const _utils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils.js */ './lib/utils.js')
        /* harmony import */ const _dropzone_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./dropzone.js */ './lib/dropzone.js')
        /* harmony import */ const _histogram_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./histogram.js */ './lib/histogram.js')
        /* harmony import */ const _slicer_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./slicer.js */ './lib/slicer.js')
        /* harmony import */ const _builder_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./builder.js */ './lib/builder.js')
        /* harmony import */ const _rfraw_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./rfraw.js */ './lib/rfraw.js')
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
        } // Check for the various File API support.

        if (window.File && window.FileReader && window.FileList && window.Blob) { // Great success! All the File APIs are supported.
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
        const slicerOptions = [{
          text: 'off',
          value: ''
        }, {
          text: 'PCM',
          value: 'PCM'
        }, {
          text: 'PWM',
          value: 'PWM'
        }, {
          text: 'PPM',
          value: 'PPM'
        }, {
          text: 'MC',
          value: 'MC'
        }, {
          text: 'DM',
          value: 'DM'
        }, {
          text: 'NRZI',
          value: 'NRZI'
        }, {
          text: 'CMI',
          value: 'CMI'
        }, {
          text: 'PIWM',
          value: 'PIWM'
        }]
        const codingOptions = [{
          text: 'off',
          value: ''
        }, {
          text: 'Manchester G.E.Thomas',
          value: 'ManchesterGET'
        }, {
          text: 'Manchester IEEE',
          value: 'ManchesterIEEE'
        }, {
          text: 'Differential Manchester',
          value: 'DifferentialManchester'
        }]

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
              slicer: value => (0, _utils_js__WEBPACK_IMPORTED_MODULE_1__.lookup)(Slicers, value) || '',
              coding: value => (0, _utils_js__WEBPACK_IMPORTED_MODULE_1__.lookup)(Codings, value) || ''
            }
            const defaults = {
              width: 0,
              // 0 = auto
              scroll: 0,
              zoom: 1
            }
            this.setTheme(options.theme)
            const heights = this.heightDefaults(options.height)
            options = Object.assign({}, defaults, heights, options)
            this.tag = Math.random().toString().substring(2) // unique instance tag

            this.parent = (0, _utils_js__WEBPACK_IMPORTED_MODULE_1__.selector)(options.parent)
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
            if (options.data) this.setData(options.data, options.fileinfo)
            if (options.unlockable) this.enableUnlockable()
            if (options.scrollzoom) this.enableScrollZoom()

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
            if (this.unlockable) return
            this.unlockable = true
            const canvas = this.canvasNode
            const events = ['dblclick']
            events.forEach(evt => canvas.addEventListener(evt, this, false))
          }
          /**
      Disables mouse and touch scroll zoom on double click.
  */

          disableUnlockable () {
            if (!this.unlockable) return
            this.unlockable = false
            const canvas = this.canvasNode
            const events = ['dblclick']
            events.forEach(evt => canvas.removeEventListener(evt, this, false))
          }
          /**
      Enables mouse and touch scroll zoom.
  */

          enableScrollZoom () {
            if (this.unlocked) return
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
            if (!this.unlocked) return
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
            this.dropZone ? this.dropZone.destroy() : null // this.resizeObserver?.disconnect() // if we had optional chaining

            this.resizeObserver ? this.resizeObserver.disconnect() : null
            window.removeEventListener('debouncedResize', this, false)
            this.disableScrollZoom()
          }

          createDropZone (elementOrSelector) {
            elementOrSelector = elementOrSelector || this.parent.getElementsByClassName('dropzone')[0]
            const fileLoader = this.setData.bind(this)
            this.dropZone = new _dropzone_js__WEBPACK_IMPORTED_MODULE_2__.DropZone(elementOrSelector, fileLoader)
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
            const slice = (0, _slicer_js__WEBPACK_IMPORTED_MODULE_4__.sliceGuess)(this.data.pulses, this.slicer)
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
            if (data instanceof Blob) {
              // also File
              readFile(data).then(text => {
                this.data = this.parseData(text, data)
                this.processData()
              })
            } else if (Array.isArray(data)) {
              this.data = {
                pulses: data
              }
              this.processData()
            } else if (typeof data === 'string') {
              // if startsWith "http" or "/" then readUrl...
              this.data = this.parseData(data, fileinfo)
              this.processData()
            } else if (data.pulses) {
              this.data = data
              this.processData()
            } else {
              this.data = new _builder_js__WEBPACK_IMPORTED_MODULE_5__.PulseBuilder(data)
              this.processData()
            }
          }

          parseData (text, fileinfo = {}) {
            const data = {
              name: fileinfo.name || null,
              type: fileinfo.type || null,
              size: fileinfo.size || text.length,
              lastModifiedDate: fileinfo.lastModifiedDate,
              // use lastModifiedDate only on IE
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
                if (data.timescale.endsWith('ns')) data.scale = s * 1e-3; else if (data.timescale.endsWith('us')) data.scale = s; else if (data.timescale.endsWith('ms')) data.scale = s * 1e3; else if (data.timescale.endsWith('s')) data.scale = s * 1e6
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

              if (_rfraw_js__WEBPACK_IMPORTED_MODULE_6__.RfRaw.isRfRaw(line)) {
                const pulses = _rfraw_js__WEBPACK_IMPORTED_MODULE_6__.RfRaw.getPulses(line)
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
            } // console.log(JSON.stringify(data))

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
            const rate_scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange)(sampleRate, 10.0)
            const width_secs = data.width / 1000000
            const width_scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange_time)(width_secs, 10.0)
            const sampleCount = data.width / 1000000 * sampleRate
            const pulses = data.pulses || []
            const lastModified = data.lastModifiedDate || new Date(data.lastModified || 0) // use lastModifiedDate only on IE

            const infos = []
            infos.push({
              text: 'File name',
              value: (0, _utils_js__WEBPACK_IMPORTED_MODULE_1__.strip)(data.name)
            })
            infos.push({
              text: 'File type',
              value: data.type || 'n/a'
            })
            infos.push({
              text: 'File size',
              value: `${data.size} bytes`
            })
            infos.push({
              text: 'Last modified',
              value: lastModified.toISOString()
            })
            infos.push({
              text: 'Sample format',
              value: sampleFormat
            })
            infos.push({
              text: 'No. of samples',
              value: `${sampleCount.toFixed(0)} S`
            })
            if (sampleRate > 1) {
              infos.push({
                text: 'Sample rate',
                value: `${sampleRate / rate_scale.scale}${rate_scale.prefix}`
              })
            }
            infos.push({
              text: 'No. of pulses',
              value: `${pulses.length / 2} ×`
            })
            if (sampleRate > 1) {
              infos.push({
                text: 'Length (time)',
                value: `${(width_secs / width_scale.scale).toFixed(2)} ${width_scale.prefix}`
              })
            }

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
          } // events

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
            } // zoom (y)

            const zoomMin = 0.5
            const zoomMax = this.data.width / this.width * 10
            let zoom

            if (e.deltaY < 0) {
              zoom = this.zoom * (1 + e.deltaY * -0.2) // zoom in
            } else {
              zoom = this.zoom / (1 + e.deltaY * 0.2) // zoom out
            }

            if (zoom < zoomMin) zoom = zoomMin
            if (zoom > zoomMax) zoom = zoomMax // apply and fix scroll

            if (this.zoom != zoom) {
              this.scroll = (this.scroll + e.layerX) / this.zoom * zoom - e.layerX
              this.zoom = zoom
              refresh = true
            } // console.log(`${e.deltaX}, ${e.deltaY} at ${e.layerX}, ${e.layerY}: ${this.scroll} x ${this.zoom}`)

            if (refresh) this.redrawCanvas() // clientX, clientY
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
            } else if (this.zoom != 1 || this.scroll != 0) {
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
            if (e.targetTouches.length > 1) e.preventDefault() // don't allow multitouches
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

            if (!this.dragZoom && e.targetTouches.length == 1) {
              // scroll
              const offsetX = t1.clientX - clientRect.left
              const offsetY = t1.clientY - clientRect.top
              this.redrawScroll(this.dragX - offsetX, this.dragY - offsetY)
            } else if (e.targetTouches.length == 2) {
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
            this.width = this.opts.width || this.parent.clientWidth // this.width = this.opts.width || document.documentElement.clientWidth

            this.drawCanvas()
          } // drawing

          processData () {
            if (!this.data.pulses || !this.data.pulses.length) return
            let width = 0

            for (let j = 0; j < this.data.pulses.length; ++j) {
              width += this.data.pulses[j]
            }

            this.data.width = width // Run analyzer

            const timings = this.timingsNode
            const messages = this.messagesNode
            const analyzer = new _histogram_js__WEBPACK_IMPORTED_MODULE_3__.Analyzer(this.data.pulses)
            analyzer.console_log()
            analyzer.print(timings, messages)
            this.analyzer = analyzer
            this.guess = analyzer.guess() // populate hints

            if (this.slicer) { // already set, skip
            } else if (this.data.modulation) {
              this.slicer = this.data
            } else {
              this.slicer = this.guess
            }

            const slice = (0, _slicer_js__WEBPACK_IMPORTED_MODULE_4__.sliceGuess)(this.data.pulses, this.slicer)
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

          redrawScroll (x
            /*, y */
          ) {
            // console.log(`scroll ${x}, ${y}`)
            this.scroll = this.dragOrig + x // TODO: Y for zoom

            this.redrawCanvas()
          }

          redrawCanvas () {
            window.requestAnimationFrame(this.drawCanvas.bind(this))
          }

          drawCanvas () {
            this.width = this.opts.width || this.parent.clientWidth // this.width = this.opts.width || document.documentElement.clientWidth

            const width = this.width
            const height = this.height
            const canvas = this.canvasNode
            canvas.width = width
            canvas.height = height // canvas.style.width = canvas.width + 'px'
            // canvas.parentNode.style.width = canvas.width + 'px'
            // canvas.style.height = canvas.height + 'px'

            const ctx = canvas.getContext('2d', {
              alpha: false,
              desynchronized: true
            })
            const scroll = -this.scroll
            const scale = width * this.zoom / this.data.width
            const yHi = this.yHi + 0.5
            const yLo = this.yLo + 0.5 // time axis

            ctx.fillStyle = "#ffffff"
            ctx.fillRect(0, 0, canvas.width, canvas.height)

            ctx.font = this.theme.font
            const textMeasure = ctx.measureText('8')
            const fontX = textMeasure.width
            const fontY = textMeasure.actualBoundingBoxAscent + textMeasure.actualBoundingBoxDescent
            const total_time = this.data.width / 1000000 / this.zoom
            const time_offset = scroll / width * total_time
            const time_scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange)(total_time, 10.0)
            const total_time_scaled = total_time / time_scale.scale
            const time_offset_scaled = time_offset / time_scale.scale
            ctx.fillStyle = this.theme.timeLabelFill
            ctx.fillText(`t[${time_scale.prefix}s]`, 32, fontY) // extra info

            if (this.data.time) ctx.fillText(`${this.data.time}`, 100, fontY)
            if (this.data.format || this.data.mod) ctx.fillText(`${(this.data.format || this.data.mod).toUpperCase()}`, 300, fontY)
            if (this.data.pulses) ctx.fillText(`${this.data.pulses.length / 2} pulses`, 330, fontY)
            const rate_Hz = this.data.rate_Hz || this.data.samplerate_Hz || this.data.rate || this.data.samplerate

            if (rate_Hz) {
              const scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange)(rate_Hz, 10.0)
              ctx.fillText(`${rate_Hz / scale.scale} ${scale.prefix}Hz`, 400, fontY)
            }

            const freq_Hz = this.data.freq_Hz || this.data.centerfreq_Hz || this.data.centerfreq
            const freq1_Hz = this.data.freq1_Hz || this.data.freq1

            if (freq1_Hz) {
              const scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange)(freq1_Hz, 10.0)
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
              const scale = (0, _autorange_js__WEBPACK_IMPORTED_MODULE_0__.autorange)(freq2_Hz, 10.0)
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
            } // want a time marker for about every 85 pixels

            const num_time_markers = width / 85
            let time_markers_step = total_time_scaled / num_time_markers // round to 5

            time_markers_step = ~~(time_markers_step / 5) * 5
            if (time_markers_step < 1.0) time_markers_step = 1.0
            const time_per_pixel = width / total_time_scaled // console.log({ time_offset_scaled, total_time_scaled, time_markers_step, time_per_pixel })

            const y = 18
            ctx.fillStyle = this.theme.timeMinorFill

            for (let t = time_offset_scaled; t < total_time_scaled; t += time_markers_step / 5) {
              if (t >= total_time_scaled - time_markers_step) t = total_time_scaled
              const x = ~~(t * time_per_pixel)
              ctx.fillRect(x, y + 10, 1, 5)
            }

            ctx.fillStyle = this.theme.timeMajorFill

            for (let t = time_offset_scaled; t < total_time_scaled; t += time_markers_step) {
              if (t >= total_time_scaled - time_markers_step) t = total_time_scaled
              const x = ~~(t * time_per_pixel)
              ctx.fillRect(x, y + 5, 1, 10)
              const label = (t - time_offset_scaled).toFixed(0)
              let x1 = x - 3 * label.length
              if (t >= total_time_scaled) x1 = x - 6 * fontX // ctx.fillText(`${t.toFixed(0)}${time_scale.prefix}s`, x1, 18)

              ctx.fillText(label, x1, 20)
            } // hints

            ctx.lineWidth = this.theme.hintLine
            ctx.strokeStyle = this.theme.hintStroke
            ctx.setLineDash(this.theme.hintDash)
            ctx.beginPath()
            let xp // previous hint (end)

            for (let j = 0; this.data.hints && j < this.data.hints.length; j += 1) {
              const hint = this.data.hints[j]
              const x0 = hint[0] * scale + scroll // start pos

              const x1 = hint[1] * scale + scroll // end pos

              if (xp != x0 && x0 >= 0 && x0 < width) {
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
            ctx.setLineDash([]) // alt (error) hints

            ctx.lineWidth = this.theme.hintAltLine
            ctx.strokeStyle = this.theme.hintAltStroke
            ctx.setLineDash(this.theme.hintAltDash)
            ctx.beginPath()
            xp = null // previous hint (end)

            for (let j = 0; this.data.hints && j < this.data.hints.length; j += 1) {
              const hint = this.data.hints[j]
              const x0 = hint[0] * scale + scroll // start pos

              const x1 = hint[1] * scale + scroll // end pos

              if (xp != x0) {
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
            ctx.setLineDash([]) // hints text

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
                if (xt >= 0 && xt < width) ctx.fillText(t, xt - 5, this.yHintText)
              }
            }

            ctx.stroke()
            if (!this.data.pulses || !this.data.pulses.length) return // marks
            // console.log(this.data)
            let pulses = this.data.pulses, shrinkRate = 1
            if (this.data.pulses.length > this.width) {
              pulses = []
              shrinkRate = Math.ceil(this.data.pulses.length / this.width)
              for (let i = 0; i < this.width; i++) {
                pulses.push(this.data.pulses[i * shrinkRate])
              }
              // console.log(pulses)
              // console.log(this.width)
              // shrinkRate = 1
              // pulses = this.data.pulses
            }

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

            ctx.stroke() // spaces

            x = scroll
            ctx.lineWidth = this.theme.loLine
            ctx.strokeStyle = this.theme.loStroke
            ctx.setLineDash(this.theme.loDash)
            ctx.fillStyle = this.theme.loFill
            ctx.beginPath()

            for (let j = 0; j < pulses.length; j += 2) {
              x += pulses[j] * scale * shrinkRate // mark

              const x0 = x
              x += pulses[j + 1] * scale * shrinkRate // space

              if ((x0 >= 0 && x0 < width) || (x >= 0 && x < width) || (x0 < 0 && x > width)) {
                ctx.fillRect(~~x0, yHi, ~~(x - x0), yLo - yHi)
                ctx.moveTo(~~x0 - 1, yLo)
                ctx.lineTo(~~x + 0, yLo)
              }
            }

            ctx.stroke() // edges

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

            ctx.stroke() // text

            x = scroll
            ctx.fillStyle = this.theme.textFill
            const textY = yHi + (yLo - yHi + fontY) / 2

            for (let j = 0; j < pulses.length; j += 1) {
              const p = pulses[j] // mark or space

              const w = p * scale * shrinkRate

              if (w > 30) {
                const x0 = x + w / 2
                if (x0 >= 0 && x0 < width) ctx.fillText(p, x0 - 10, textY)
              }

              x += w
            } // dots

            const rate = 1000000 / this.data.rate * scale
            x = scroll

            if (rate > 2) {
              const dotW = rate > 4 ? 2 : 1
              ctx.fillStyle = this.theme.dotFill

              for (let j = 0; j < this.data.pulses.length; j += 2) {
                const mark = this.data.pulses[j] * scale // mark

                for (let k = 0; k < mark - rate; k += rate) {
                  const x0 = ~~(x + k)
                  if (x0 >= 0 && x0 < width) ctx.fillRect(x0, yHi + 0.5, dotW, 3)
                }

                x += mark
                const space = this.data.pulses[j + 1] * scale // space

                for (let k = 0; k < space - rate; k += rate) {
                  const x0 = ~~(x + k)
                  if (x0 >= 0 && x0 < width) ctx.fillRect(x0, yLo - 3.5, dotW, 3)
                }

                x += space
              }
            }
          }
        }
        /***/ },

      /***/ './lib/rfraw.js':
      /*! **********************!*\
  !*** ./lib/rfraw.js ***!
  \**********************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ RfRaw: function () { return /* binding */ RfRaw }
          /* harmony export */ })
        /* harmony import */ const _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./hexbuffer.js */ './lib/hexbuffer.js')
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

        class RfRaw {
          static isRfRaw (line) {
            return line.trim().startsWith('AA')
          }

          static getPulses (line) {
            let pulses = [] // split codes on '+' or space between '55 AAB'

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
            const buf = new _hexbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Hexbuffer(line)
            const sync = buf.getByte()

            if (sync != 0xaa) {
              return pulses
            }

            const fmt = buf.getByte()
            let len
            let buckets
            let repeats

            if (fmt == 0xb1) {
              // s.a. https://github.com/Portisch/RF-Bridge-EFM8BB1/wiki/Decode-0xB1-sniffed-data
              buckets = buf.getByte()
            } else if (fmt == 0xb0) {
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
                if (buf.peekByte() == 0x55) break // sync end

                const b = buf.getNibble()
                if (b > buckets) break // error

                pulses.push(bucket[b])
              }

              pulses.push(0) // rfraw ends with a pulse

              if (repeats) return new Array(repeats).fill(pulses).flat()
              return pulses
            }

            let dataHigh = true

            while (buf.hasNibble()) {
              if (buf.peekByte() == 0x55) break // sync end

              const n = buf.getNibble()
              const b = n & 7
              if (b > buckets) break // error

              if (n & 8) {
                if (!dataHigh) pulses.push(0)
                pulses.push(bucket[b])
                dataHigh = false
              } else {
                if (dataHigh) pulses.push(0)
                pulses.push(bucket[b])
                dataHigh = true
              }
            }

            if (!dataHigh) pulses.push(0) // add last gap

            if (repeats) return new Array(repeats).fill(pulses).flat()
            return pulses
          }
        }
        /***/ },

      /***/ './lib/slicer.js':
      /*! ***********************!*\
  !*** ./lib/slicer.js ***!
  \***********************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ sliceGuess: function () { return /* binding */ sliceGuess },
          /* harmony export */ slicePCM: function () { return /* binding */ slicePCM },
          /* harmony export */ sliceNRZ: function () { return /* binding */ sliceNRZ },
          /* harmony export */ sliceRZ: function () { return /* binding */ sliceRZ },
          /* harmony export */ slicePPM: function () { return /* binding */ slicePPM },
          /* harmony export */ slicePWM: function () { return /* binding */ slicePWM },
          /* harmony export */ sliceMC: function () { return /* binding */ sliceMC },
          /* harmony export */ sliceDM: function () { return /* binding */ sliceDM },
          /* harmony export */ sliceNRZI: function () { return /* binding */ sliceNRZI },
          /* harmony export */ sliceCMI: function () { return /* binding */ sliceCMI },
          /* harmony export */ slicePIWM: function () { return /* binding */ slicePIWM }
          /* harmony export */ })
        /* harmony import */ const _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./bitbuffer.js */ './lib/bitbuffer.js')
        /**
    @file Pulse Slicer JS.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2020
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

        function sliceGuess (pulses, guess) {
          if (guess.modulation == 'PCM') return slicePCM(pulses, guess); else if (guess.modulation == 'MC') return sliceMC(pulses, guess); else if (guess.modulation == 'PPM') return slicePPM(pulses, guess); else if (guess.modulation == 'PWM') return slicePWM(pulses, guess); else if (guess.modulation == 'DM') return sliceDM(pulses, guess); else if (guess.modulation == 'NRZI') return sliceNRZI(pulses, guess); else if (guess.modulation == 'CMI') return sliceCMI(pulses, guess); else if (guess.modulation == 'PIWM') return slicePIWM(pulses, guess); else return []
        } // returned hints array contains triples of start,end,symbol
        /// Pulse-code modulation (PCM)
        /// https://en.wikipedia.org/wiki/Pulse-code_modulation
        /// either NRZ or RZ

        function slicePCM (pulses, guess) {
          if (!guess.long || guess.long == guess.short) {
            return sliceNRZ(pulses, guess)
          } else {
            return sliceRZ(pulses, guess)
          }
        } /// NRZ(L) NRZL Non-return-to-zero level
        /// https://en.wikipedia.org/wiki/Non-return-to-zero

        function sliceNRZ (pulses, guess) {
          const short = guess.short
          const gap = guess.gap
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0

          for (let j = 0; j < pulses.length; j += 1) {
            const symbol = 1 - j % 2 // even: 1, odd: 0

            const w = pulses[j] // mark or space

            if (gap && w > gap) {
              bits.pushBreak()
            } else {
              const cnt = ~~(w / short + 0.5)

              for (let k = 0; k < cnt; ++k) {
                hints.push([x + w / cnt * k, x + w / cnt * (k + 1), symbol])
                bits.push(symbol)
              }
            }

            x += w
          }

          return {
            hints,
            bits
          }
        } /// Return-to-zero level
        /// https://en.wikipedia.org/wiki/Return-to-zero

        function sliceRZ (pulses, guess) {
          const short = guess.short
          const long = guess.long
          const gap = guess.gap
          const shortl = short * 0.5
          const shortu = short * 1.5
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0

          for (let j = 0; j < pulses.length; j += 2) {
            const m = pulses[j] // mark

            const s = pulses[j + 1] // space

            if (m < shortl || m > shortu) {
              bits.pushBreak()
              x += m + s
              continue
            }

            let onew = m * long / short // estimate the 1-bit width

            let zs = s + m - onew // estimate 0-bits width

            if (zs < long / 2) {
              onew = m + s // no 0-bits

              zs = 0
            }

            hints.push([x, x + onew, '1'])
            bits.pushOne()
            x += onew

            if (gap && s > gap) {
              bits.pushBreak()
              x += zs
              continue
            }

            const cnt = ~~(zs / long + 0.5)

            for (let k = 0; k < cnt; ++k) {
              hints.push([x + zs * k / cnt, x + zs * (k + 1) / cnt, '0'])
              bits.pushZero()
            }

            x += zs
          }

          return {
            hints,
            bits
          }
        } /// Pulse-position modulation (PPM)
        /// https://en.wikipedia.org/wiki/Pulse-position_modulation

        function slicePPM (pulses, guess) {
          const short = guess.short
          const long = guess.long
          const sync = guess.sync
          const gap = guess.gap
          const shortl = short * 0.5
          const shortu = short * 1.5
          const longl = long * 0.5
          const longu = long * 1.5
          const syncl = sync * 0.5
          const syncu = sync * 1.5
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0

          for (let j = 0; j < pulses.length; j += 2) {
            const m = pulses[j] // mark

            const s = pulses[j + 1] // space

            const x0 = x
            x += m + s

            if (s > shortl && s < shortu) {
              hints.push([x0, x, '1'])
              bits.pushOne()
            } else if (s > longl && s < longu) {
              hints.push([x0, x, '0'])
              bits.pushZero()
            } else if (s > syncl && s < syncu) {
              hints.push([x0, x, 'X'])
              bits.pushBreak()
            } else if (gap && s > gap) {
              bits.pushBreak()
            }
          }

          return {
            hints,
            bits
          }
        } /// Pulse-width modulation (PWM)
        /// https://en.wikipedia.org/wiki/Pulse-width_modulation

        function slicePWM (pulses, guess) {
          const short = guess.short
          const long = guess.long
          const sync = guess.sync
          const gap = guess.gap
          const shortl = short * 0.5
          const shortu = short * 1.5
          const longl = long * 0.5
          const longu = long * 1.5
          const syncl = sync * 0.5
          const syncu = sync * 1.5
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0

          for (let j = 0; j < pulses.length; j += 2) {
            const m = pulses[j] // mark

            const s = pulses[j + 1] // space

            const x0 = x
            let x1 = x + m + s // break on gaps

            if (s > gap) x1 = x + m + gap
            x += m + s

            if (m > shortl && m < shortu) {
              hints.push([x0, x1, '1'])
              bits.pushOne()
            } else if (m > longl && m < longu) {
              hints.push([x0, x1, '0'])
              bits.pushZero()
            } else if (m > syncl && m < syncu) {
              hints.push([x0, x1, 'X'])
              bits.pushBreak()
            }

            if (gap && s > gap) {
              bits.pushBreak()
            }
          }

          return {
            hints,
            bits
          }
        } /// get Manchester alignment, 1 if we are at the start of a bit, 0 if we are in the middle

        function manchesterAligned (pulses, offset, short) {
          for (let j = offset; j < pulses.length; j += 2) {
            const mw = pulses[j] // mark

            const cw = ~~(mw / short + 0.5)
            if (cw > 1) return 0 // middle

            const sw = pulses[j + 1] // space

            const sc = ~~(sw / short + 0.5)
            if (sc > 1) return 1 // start
          } // warning, no alignment found

          return 0
        } /// Manchester code (MC)
        /// https://en.wikipedia.org/wiki/Manchester_code

        function sliceMC (pulses, guess) {
          const short = guess.short
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = [] // Manchester align string by finding the position of the first long pulse or gap

          let aligned = manchesterAligned(pulses, 0, short)
          let x = 0
          let x1 = 0

          for (let j = 0; j < pulses.length; j += 2) {
            const mark = pulses[j] // mark

            const mcnt = ~~(mark / short + 0.5)
            const space = pulses[j + 1] // space

            const scnt = ~~(space / short + 0.5)

            if (mcnt == 1) {
              if (!aligned) {
                hints.push([x1, x + mark, '0'])
                bits.pushZero()
                x1 = x + mark
              } else {
                // aligned
                x1 = x
              }

              aligned = !aligned
            } else if (mcnt == 2) {
              if (!aligned) {
                hints.push([x1, x + mark / 2, '0'])
                bits.pushZero()
                x1 = x + mark / 2
              } else {
                // aligned
                // error
                bits.pushBreak()
                x1 = x + mark / 2
              }

              aligned = false
            } else if (mcnt > 2) {
              if (!aligned) {
                hints.push([x1, x + mark / mcnt, '0'])
                bits.pushZero()
                x1 = x + mark - mark / mcnt
              } else {
                // aligned
                // error
                x1 = x + mark - mark / mcnt
              }

              bits.pushBreak()
              aligned = manchesterAligned(pulses, j + 1, short)
            }

            if (scnt == 1) {
              if (!aligned) {
                hints.push([x1, x + mark + space, '1'])
                bits.pushOne()
                x1 = x + mark + space
              } else {
                // aligned
                x1 = x + mark
              }

              aligned = !aligned
            } else if (scnt == 2) {
              if (!aligned) {
                hints.push([x1, x + mark + space / 2, '1'])
                bits.pushOne()
                x1 = x + mark + space / 2
              } else {
                // aligned
                // error
                bits.pushBreak()
                x1 = x + mark + space / 2
              }

              aligned = false
            } else if (scnt > 2) {
              if (!aligned) {
                hints.push([x1, x + mark + space / scnt, '1'])
                bits.pushOne()
                x1 = x + mark + space - space / scnt
              } else {
                // aligned
                // error
                x1 = x + mark + space - space / scnt
              }

              bits.pushBreak()
              aligned = manchesterAligned(pulses, j + 1, short)
            }

            x += mark + space
          }

          return {
            hints,
            bits
          }
        } /// Differential Manchester Encoding (DM) aka Biphase Mark Code (CC)
        /// https://en.wikipedia.org/wiki/Differential_Manchester_encoding

        function sliceDM (pulses, guess) {
          const short = guess.short
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0
          let x1 = null

          for (let j = 0; j < pulses.length; j += 2) {
            const mark = pulses[j] // mark

            const mcnt = ~~(mark / short + 0.5)
            const space = pulses[j + 1] // space

            const scnt = ~~(space / short + 0.5)

            if (!x1 && mcnt == 1 && scnt == 1) {
              hints.push([x, x + mark + space, '0'])
              bits.pushZero()
            } else if (mcnt == 1 && scnt == 1) {
              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              x1 = x + mark
            } else if (x1 && mcnt == 1 && scnt == 2) {
              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              hints.push([x + mark, x + mark + space, '1'])
              bits.pushOne()
              x1 = null
            } else if (mcnt == 2 && scnt == 1) {
              hints.push([x, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark
            } else if (mcnt == 2 && scnt == 2) {
              hints.push([x, x + mark, '1'])
              bits.pushOne()
              hints.push([x + mark, x + mark + space, '1'])
              bits.pushOne()
            } else if (!x1 && mcnt == 1) {
              // error
              hints.push([x, x + mark + short, '0'])
              bits.pushZero()
              bits.pushBreak()
            } else if (!x1 && mcnt == 2) {
              // error
              hints.push([x, x + mark, '1'])
              bits.pushOne()
              bits.pushBreak()
            } else {
              // error (!x1 && mcnt == 1 && scnt == 2)
              if (x1) {
                hints.push([x1, x1 + short * 2, '0'])
                bits.pushZero()
              }

              x1 = null
              bits.pushBreak()
            }

            x += mark + space
          }

          return {
            hints,
            bits
          }
        } /// Non-return-to-zero, inverted (NRZI) https://en.wikipedia.org/wiki/Non-return-to-zero#NRZI
        /// NRZ(I) NRZI Non-return-to-zero inverted Refers to either an NRZ(M) or NRZ(S) code.
        /// NRZ(M) NRZM Non-return-to-zero mark Serializer mapping {0: constant, 1: toggle}.
        /// NRZ(S) NRZS Non-return-to-zero space Serializer mapping {0: toggle, 1: constant}.
        /// A 1 is transmitted as a transition, and a 0 is transmitted as no transition.

        function sliceNRZI (pulses, guess) {
          const short = guess.short
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0
          let x1 = 0

          for (let j = 0; j < pulses.length; j += 1) {
            const w = pulses[j] // mark or space

            const cnt = ~~(w / short + 0.5) // every edge is a 1, don't use the first edge

            if (x1) {
              hints.push([x1, x + short / 2, '1'])
              bits.pushOne()
            }

            x1 = x + short / 2 // count minus one amounts of 0

            for (let k = 1; k < cnt; ++k) {
              hints.push([x1, x1 + w / cnt, '0'])
              bits.pushZero()
              x1 += w / cnt
            }

            x += w
          }

          return {
            hints,
            bits
          }
        } /// Coded Mark Inversion (CMI) https://en.wikipedia.org/wiki/Coded_mark_inversion
        /// encodes zero bits as a half bit time of zero followed by a half bit time of one,
        /// and one bits are encoded as a full bit time of a constant level,
        /// the level used for one bits alternates each time one is coded.

        function sliceCMI (pulses, guess) {
          const short = guess.short
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0
          let x1 = null

          for (let j = 0; j < pulses.length; j += 2) {
            const mark = pulses[j] // mark

            const mcnt = ~~(mark / short + 0.5)
            const space = pulses[j + 1] // space

            const scnt = ~~(space / short + 0.5)

            if (mcnt == 1 && scnt == 1) {
              if (!x1) x1 = x - mark // first bit

              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              x1 = x + mark
            } else if (mcnt == 1 && scnt == 2) {
              if (!x1) x1 = x - mark // first bit

              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              x1 = x + mark + space
              hints.push([x + mark, x1, '1'])
              bits.pushOne()
            } else if (mcnt == 1 && scnt == 3) {
              if (!x1) x1 = x - mark // first bit

              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              x1 = x + mark + space * 2 / 3
              hints.push([x + mark, x1, '1'])
              bits.pushOne()
            } else if (mcnt == 2 && scnt == 1) {
              hints.push([x1, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark
            } else if (mcnt == 2 && scnt == 2) {
              hints.push([x1, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark + space
              hints.push([x + mark, x1, '1'])
              bits.pushOne()
            } else if (mcnt == 2 && scnt == 3) {
              hints.push([x1, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark + space * 2 / 3
              hints.push([x + mark, x1, '1'])
              bits.pushOne()
            } else if (mcnt == 3 && scnt == 1) {
              hints.push([x1, x + mark / 3, '0'])
              bits.pushZero()
              hints.push([x + mark / 3, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark
            } else if (mcnt == 3 && scnt == 2) {
              hints.push([x1, x + mark / 3, '0'])
              bits.pushZero()
              hints.push([x + mark / 3, x + mark, '1'])
              bits.pushOne()
              x1 = x + mark + space
              hints.push([x + mark, x1, '1'])
              bits.pushOne()
            } else if (mcnt == 3 && scnt == 3) {
              hints.push([x1, x + mark / 3, '0'])
              bits.pushZero()
              hints.push([x, x + mark / 3, '1'])
              bits.pushOne()
              hints.push([x + mark / 3, x + mark, '1'])
              bits.pushOne()
              hints.push([x + mark, x + mark + space * 3 / 2, '1'])
              bits.pushOne()
              x1 = x + mark + space * 3 / 2
            } else if (mcnt == 1) {
              // last zero
              hints.push([x1, x + mark, '0'])
              bits.pushZero()
              bits.pushBreak()
              x1 = x + mark
            } else if (mcnt == 2) {
              // last one
              hints.push([x1, x + mark, '1'])
              bits.pushOne()
              bits.pushBreak()
              x1 = x + mark
            } else {
              // error
              bits.pushBreak()
            }

            x += mark + space
          }

          return {
            hints,
            bits
          }
        } /// Pulse-Interval-Width Modulation (PIWM)
        /// Exotic differential coding

        function slicePIWM (pulses, guess) {
          const short = guess.short
          const bits = new _bitbuffer_js__WEBPACK_IMPORTED_MODULE_0__.Bitbuffer()
          const hints = []
          let x = 0

          for (let j = 0; j < pulses.length; j += 1) {
            const w = pulses[j] // mark or space

            const cnt = ~~(w / short + 0.5)

            if (cnt == 1) {
              hints.push([x, x + w, '1'])
              bits.pushOne()
            } else if (cnt == 2) {
              hints.push([x, x + w, '0'])
              bits.pushZero()
            } else {
              // error
              bits.pushBreak()
            }

            x += w
          }

          return {
            hints,
            bits
          }
        }
        /***/ },

      /***/ './lib/utils.js':
      /*! **********************!*\
  !*** ./lib/utils.js ***!
  \**********************/
      /***/ function (__unused_webpack_module, __webpack_exports__, __webpack_require__) {
        __webpack_require__.r(__webpack_exports__)
        /* harmony export */ __webpack_require__.d(__webpack_exports__, {
          /* harmony export */ selector: function () { return /* binding */ selector },
          /* harmony export */ lookup: function () { return /* binding */ lookup },
          /* harmony export */ strip: function () { return /* binding */ strip }
          /* harmony export */ })
        /**
    @file Various utils.

    @author Christian W. Zuckschwerdt <zany@triq.net>
    @copyright Christian W. Zuckschwerdt, 2019
    @license
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.
*/

        /** Returns element or expands selector. */
        function selector (elementOrSelector) {
          if (!elementOrSelector) {
            return elementOrSelector
          } else if (typeof elementOrSelector === 'string') {
            return document.querySelector(elementOrSelector)
          } else {
            return elementOrSelector // instanceof Element
          }
        }
        /** Returns array or expands key. */

        function lookup (table, arrayOrKey) {
          if (!arrayOrKey) return arrayOrKey
          if (typeof arrayOrKey !== 'string') return arrayOrKey
          if (table[arrayOrKey]) return table[arrayOrKey]
          const match = arrayOrKey.toLowerCase()

          for (const key in table) if (key.toLowerCase() == match) return table[key]

          for (const key in table) if (key.toLowerCase().startsWith(match)) return table[key]

          return null
        }
        /** Strips HTML tags. */

        function strip (html) {
          const doc = new DOMParser().parseFromString(html, 'text/html')
          return doc.body.textContent || ''
        }
        /***/ }

      /******/ })
    /************************************************************************/
    /******/ // The module cache
    /******/ const __webpack_module_cache__ = {}
    /******/
    /******/ // The require function
    /******/ function __webpack_require__ (moduleId) {
      /******/ // Check if module is in cache
      /******/ const cachedModule = __webpack_module_cache__[moduleId]
      /******/ if (cachedModule !== undefined) {
        /******/ return cachedModule.exports
        /******/ }
      /******/ // Create a new module (and put it into the cache)
      /******/ const module = __webpack_module_cache__[moduleId] = {
        /******/ // no module.id needed
        /******/ // no module.loaded needed
        /******/ exports: {}
        /******/ }
      /******/
      /******/ // Execute the module function
      /******/ __webpack_modules__[moduleId](module, module.exports, __webpack_require__)
      /******/
      /******/ // Return the exports of the module
      /******/ return module.exports
      /******/ }
    /******/
    /************************************************************************/
    /******/ /* webpack/runtime/define property getters */
    /******/ !(function () {
      /******/ // define getter functions for harmony exports
      /******/ __webpack_require__.d = function (exports, definition) {
        /******/ for (const key in definition) {
          /******/ if (__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
            /******/ Object.defineProperty(exports, key, { enumerable: true, get: definition[key] })
            /******/ }
          /******/ }
        /******/ }
      /******/ }())
    /******/
    /******/ /* webpack/runtime/hasOwnProperty shorthand */
    /******/ !(function () {
      /******/ __webpack_require__.o = function (obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop) }
      /******/ }())
    /******/
    /******/ /* webpack/runtime/make namespace object */
    /******/ !(function () {
      /******/ // define __esModule on exports
      /******/ __webpack_require__.r = function (exports) {
        /******/ if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
          /******/ Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' })
          /******/ }
        /******/ Object.defineProperty(exports, '__esModule', { value: true })
        /******/ }
      /******/ }())
    /******/
    /************************************************************************/
    const __webpack_exports__ = {}
    // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
    !(function () {
      /*! ******************!*\
  !*** ./index.js ***!
  \******************/
      __webpack_require__.r(__webpack_exports__)
      /* harmony export */ __webpack_require__.d(__webpack_exports__, {
        /* harmony export */ Pulseplot: function () { return /* reexport safe */ _lib_pulseplot_js__WEBPACK_IMPORTED_MODULE_0__.Pulseplot },
        /* harmony export */ DropZone: function () { return /* reexport safe */ _lib_dropzone_js__WEBPACK_IMPORTED_MODULE_1__.DropZone },
        /* harmony export */ getDemos: function () { return /* reexport safe */ _lib_demos_js__WEBPACK_IMPORTED_MODULE_2__.getDemos },
        /* harmony export */ RfRaw: function () { return /* reexport safe */ _lib_rfraw_js__WEBPACK_IMPORTED_MODULE_3__.RfRaw }
        /* harmony export */ })
      /* harmony import */ const _lib_pulseplot_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lib/pulseplot.js */ './lib/pulseplot.js')
      /* harmony import */ const _lib_dropzone_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./lib/dropzone.js */ './lib/dropzone.js')
      /* harmony import */ const _lib_demos_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./lib/demos.js */ './lib/demos.js')
      /* harmony import */ const _lib_rfraw_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./lib/rfraw.js */ './lib/rfraw.js')
    }())
    /******/ return __webpack_exports__
    /******/ })()
})
// # sourceMappingURL=pulseplot.js.map
