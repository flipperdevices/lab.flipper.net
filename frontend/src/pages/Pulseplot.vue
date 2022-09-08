<template>
  <q-page class="column items-center q-pa-md">
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
      <div class="pulseplot-timings q-py-sm"></div>
      <div class="pulseplot-messages q-py-sm" style="word-break: break-all;"></div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Pulseplot } from '../pulseplot/pulseplot'

export default defineComponent({
  name: 'Pulseplot',

  props: {
    passedFile: Object
  },

  setup () {
    return {
      flags: ref({
        wrongFileType: false
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

    draw () {
      this.plot = new Pulseplot({
        parent: '.pulseplot',
        data: this.data,
        height: 300
      })
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
  }
})
</script>
