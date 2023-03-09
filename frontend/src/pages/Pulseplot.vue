<template>
  <q-page class="column no-wrap items-center q-pa-md full-width">
    <div class="text-h6">Sub-GHz/Infrared pulse plotter</div>
    <q-file
      outlined
      v-model="uploadedFile"
      label="Drop or select file"
      class="q-py-md"
      style="min-width: 200px"
    >
      <template v-slot:prepend>
        <q-icon name="file_upload"></q-icon>
      </template>
    </q-file>
    <p v-if="flags.wrongFileType">Wrong file type. Only <b>SubGhz RAW</b> and <b>Infrared RAW</b> files are accepted.</p>

    <q-select
      v-if="currentSignal"
      v-model="currentSignal"
      :options="signals"
      option-label="name"
      label="Select signal"
      style="min-width: 200px;"
    />

    <div class="pulseplot fit" v-show="!flags.wrongFileType">
      <q-scroll-area class="scroll-area">
        <div class="control-layer"></div>
      </q-scroll-area>
      <canvas class="pulseplot-canvas" style="image-rendering: pixelated;"></canvas>
      <div v-show="plot" class="flex q-py-sm">
        <q-select
          v-model="slicer.modulation"
          :options="slicerModulations"
          label="Slicer"
          class="q-px-sm"
          style="width: 100px"
        />
        <q-input
          v-model.number="slicer.short"
          type="number"
          label="Short"
          class="q-px-sm"
          style="width: 100px"
        />
        <q-input
          v-model.number="slicer.long"
          type="number"
          label="Long"
          class="q-px-sm"
          style="100px"
        />
        <q-input
          v-model.number="slicer.sync"
          type="number"
          label="Sync"
          class="q-px-sm"
          style="100px"
        />
        <q-input
          v-model.number="slicer.gap"
          type="number"
          label="Gap"
          class="q-px-sm"
          style="max-width: 200px"
        />
        <div class="flex flex-center q-px-md">
          <q-btn @click="setSlicer" label="Submit" size="16px"/>
        </div>
      </div>
      <div class="pulseplot-timings overflow-auto q-py-sm"></div>
      <div class="pulseplot-messages q-py-sm" style="word-break: break-all;"></div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Pulseplot as PulseplotOffscreen } from '../pulseplot/pulseplot-offscreen'
import { Pulseplot } from '../pulseplot/pulseplot'

export default defineComponent({
  name: 'Pulseplot',

  props: {
    passedFile: Object
  },

  setup () {
    return {
      flags: ref({
        wrongFileType: false,
        offscreenCanvasSupported: true
      }),
      uploadedFile: ref(null),
      plot: ref(null),
      data: ref(null),
      signals: ref(null),
      currentSignal: ref(null),
      slicer: ref({
        long: 0,
        modulation: '',
        short: 0,
        sync: 0,
        gap: 0
      }),
      slicerModulations: [
        'PCM',
        'PWM',
        'PPM',
        'MC',
        'DM',
        'NRZI',
        'CMI',
        'PIWM'
      ]
    }
  },

  watch: {
    uploadedFile (newFile, oldFile) {
      if (this.plot) {
        this.plot.destroy()
      }
      this.flags.wrongFileType = false
      this.signals = null
      this.currentSignal = null
      this.switchFiletype(newFile)
    },
    currentSignal (newSignal, oldSignal) {
      if (newSignal) {
        if (this.plot) {
          this.plot.destroy()
        }
        this.data = {
          centerfreq_Hz: newSignal.frequency,
          pulses: newSignal.data
        }
        this.draw()
      }
    }
  },

  methods: {
    async switchFiletype (file, isBuffer) {
      let buffer
      if (isBuffer) {
        buffer = file
      } else {
        buffer = await file.arrayBuffer()
      }
      const text = new TextDecoder().decode(buffer).split(/\r?\n/)

      if (text[0].startsWith('RIFL')) {
        return this.processRfid(new Uint8Array(buffer))
      }

      switch (text[0]) {
        case 'Filetype: Flipper SubGhz RAW File':
          return this.processSubGhz(text)
        case 'Filetype: IR signals file':
          return this.processIr(text)
        default:
          this.flags.wrongFileType = true
          break
      }
    },

    processSubGhz (text) {
      let frequency, rawData = ''
      for (const line of text) {
        if (line.startsWith('Frequency')) {
          frequency = line.split(' ')[1]
        } else if (line.startsWith('RAW_Data')) {
          let raw = line.replaceAll('RAW_Data: ', ' ')
          const deviations = raw.match(/(\s\d+\s\d+)|(\s-\d+\s-\d+)/g)
          if (deviations) {
            for (const match of deviations) {
              const s = match.trim().split(' ')
              if (s[1].startsWith('-')) {
                s.splice(1, 0, '1')
              } else {
                s.splice(1, 0, '-1')
              }
              raw = raw.replace(match, ' ' + s.join(' '))
              console.log(`Fixed deviation:${match} ->${' ' + s.join(' ')}`)
            }
          }
          rawData += raw
        }
      }

      rawData = rawData.trim()

      if (rawData.startsWith('-')) {
        rawData = '0 ' + rawData
      }
      rawData = rawData.replaceAll('-', '').split(' ')
      rawData = rawData.map(e => Number(e))

      this.data = {
        centerfreq_Hz: frequency,
        pulses: rawData
      }
      this.draw()
    },

    processIr (text) {
      let signals = [], i = -1
      for (const line of text) {
        if (line.startsWith('#')) {
          i++
          signals[i] = {}
        } else if (line.startsWith('name')) {
          signals[i].name = line.split(' ')[1]
        } else if (line.startsWith('type')) {
          signals[i].type = line.split(' ')[1]
        } else if (line.startsWith('frequency')) {
          signals[i].frequency = line.split(' ')[1]
        } else if (line.startsWith('data')) {
          signals[i].data = line.split(': ')[1]
        }
      }

      signals = signals.filter(e => e.type === 'raw')
      if (signals.length === 0) {
        this.flags.wrongFileType = true
        return
      }

      for (const signal of signals) {
        signal.data = signal.data.split(' ')
        signal.data = signal.data.map(e => Number(e))
      }

      this.signals = signals
      this.currentSignal = signals[0]
    },

    processRfid (data) {
      function sliceView (from, to) {
        const view = new DataView(new ArrayBuffer(to - from))
        data.slice(from, to).reverse().forEach((b, i) => {
          view.setUint8(i, b)
        })
        return view
      }

      const header = {
        magic: sliceView(0, 4).getUint32(),
        version: sliceView(4, 8).getUint32(),
        frequency: sliceView(8, 12).getFloat32(0),
        dutyCycle: sliceView(12, 16).getFloat32(0),
        maxBufferSize: sliceView(16, 20).getUint32()
      }
      console.log(header)

      function readVarInt (buffer) {
        let value = 0
        let length = 0
        let currentByte

        while (true) {
          currentByte = buffer[length]
          value |= (currentByte & 0x7F) << (length * 7)
          length += 1
          if (length > 5) {
            throw new Error('VarInt exceeds allowed bounds.')
          }
          if ((currentByte & 0x80) !== 0x80) break
        }
        return { value, length }
      }

      let dataOffset = 20, bufferSize = sliceView(dataOffset, dataOffset + 4).getUint32()
      const varints = []
      if (bufferSize > header.maxBufferSize) {
        throw new Error(`Buffer size (${bufferSize}) exceeds max_buffer_size (${header.maxBufferSize})`)
      }
      while (data.length > dataOffset) {
        const buffer = data.slice(dataOffset, dataOffset + bufferSize)
        let bufferOffset = 4
        while (bufferOffset < buffer.length) {
          const varint = readVarInt(buffer.slice(bufferOffset))
          bufferOffset += varint.length
          varints.push(varint.value)
        }
        dataOffset += bufferSize + 4
        bufferSize = sliceView(dataOffset, dataOffset + 4).getUint32()
      }

      this.data = {
        centerfreq_Hz: header.frequency,
        pulses: varints
      }
      this.draw()
    },

    draw () {
      const config = {
        parent: '.pulseplot',
        data: this.data,
        height: 300
      }
      if (this.flags.offscreenCanvasSupported) {
        this.plot = new PulseplotOffscreen(config)
      } else {
        this.plot = new Pulseplot(config)
      }
      this.plot.enableScrollZoom()
      if (this.plot.slicer.name !== 'No clue...' && this.plot.slicer.modulation) {
        this.slicer.modulation = this.plot.slicer.modulation
        this.slicer.short = this.plot.slicer.short || 0
        this.slicer.long = this.plot.slicer.long || 0
        this.slicer.sync = this.plot.slicer.sync || 0
        this.slicer.gap = this.plot.slicer.gap || 0
        this.setSlicer()
      }
    },

    setSlicer () {
      this.plot.setSlicer(this.slicer)
    }
  },

  mounted () {
    if (this.passedFile) {
      this.switchFiletype(this.passedFile.data, true)
    }
    if (typeof OffscreenCanvas !== 'undefined') {
      this.flags.offscreenCanvasSupported = true
    } else {
      this.flags.offscreenCanvasSupported = false
    }
  }
})
</script>

<style lang="sass" scoped>
.scroll-area
  width: 100%
  height: 316px
  position: absolute
  .control-layer
    height: 316px
</style>
