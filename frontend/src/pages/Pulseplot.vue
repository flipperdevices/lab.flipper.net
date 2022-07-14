<template>
  <q-page class="column items-center q-pa-md">
    <div class="text-h6">Sub-GHz pulse plotter</div>
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
    <p v-if="flags.wrongFileType">Wrong file type. Only Flipper SubGhz RAW Files are accepted.</p>

    <div class="pulseplot fit">
      <canvas class="pulseplot-canvas"></canvas>
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
      data: ref(null)
    }
  },

  watch: {
    uploadedFile (newFile, oldFile) {
      this.flags.wrongFileType = false
      this.format(newFile)
    }
  },

  methods: {
    async format (file) {
      const text = new TextDecoder().decode(await file.arrayBuffer()).split(/\r?\n/)
      if (text[0] !== 'Filetype: Flipper SubGhz RAW File') {
        this.flags.wrongFileType = true
        return
      }

      let frequency, rawData = ''
      for (const line of text) {
        if (line.startsWith('Frequency')) {
          frequency = line.split(' ')[1]
        } else if (line.startsWith('RAW_Data')) {
          rawData += line.slice(10) + ' '
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

    draw () {
      this.plot = new Pulseplot({
        parent: '.pulseplot',
        data: this.data
      })
      this.plot.enableScrollZoom()
    }
  }
})
</script>
