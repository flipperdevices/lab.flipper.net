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
      <div class="pulseplot-timings"></div>
    </div>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { Pulseplot } from '../util/pulseplot'

export default defineComponent({
  name: 'Pulseplot',

  setup () {
    return {
      flags: ref({
        wrongFileType: false
      }),
      uploadedFile: ref(null),
      plot: ref(null),
      data: ref(null),
      signals: ref(null),
      currentSignal: ref(null)
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
    async switchFiletype (file) {
      const text = new TextDecoder().decode(await file.arrayBuffer()).split(/\r?\n/)

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
    }
  }
})
</script>
