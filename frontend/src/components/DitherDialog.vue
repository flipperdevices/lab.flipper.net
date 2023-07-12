<template>
  <q-card style="width: 616px; min-width: 300px">
    <q-card-section>
      <div class="text-h6">Uploaded image</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <canvas ref="sourceCanvasRef" width="128" height="64" class="q-ml-sm"></canvas>
    </q-card-section>

    <q-card-section class="q-pt-none" v-if="ditherProcesses.length">
      <div class="text-h6">Select dithering method:</div>
    </q-card-section>

    <q-card-section class="q-py-none row justify-start">
      <div
        v-for="p in ditherProcesses"
        :key="p.id"
        class="column flex-center q-ma-sm"
      >
        <div v-if="!p.imageData" class="canvas-placeholder flex flex-center">
          <q-spinner
            color="primary"
            size="3em"
          />
        </div>
        <canvas v-else :class="p.id" width="128" height="64" @click="select(p.imageData)"></canvas>
        <q-tooltip :offset="[0, 3]" class="bg-primary">{{ p.title }}</q-tooltip>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Cancel" @click="cancel"/>
    </q-card-actions>
  </q-card>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { dither, emitter } from '../util/ditherpunk/monochrome'

export default defineComponent({
  name: 'DitherDialog',

  props: {
    img: Object
  },

  setup () {
    return {
      flags: ref({
      }),
      sourceImageData: ref(null),
      ditherProcesses: ref([])
    }
  },

  methods: {
    drawSourceImg () {
      const sourceCtx = this.$refs.sourceCanvasRef.getContext('2d')
      sourceCtx.fillStyle = 'white'
      sourceCtx.fillRect(0, 0, 128, 64)
      sourceCtx.drawImage(this.img, 0, 0, 128, 64)
      this.sourceImageData = sourceCtx.getImageData(0, 0, 128, 64)

      this.dither()
    },

    dither () {
      this.unbindDitherStart = emitter.on('dither/start', this.onDitherStart)
      this.unbindDitherResult = emitter.on('dither/result', this.onDitherResult)
      dither(this.sourceImageData)
    },

    onDitherStart ({ id, title }) {
      if (this.ditherProcesses.find(e => e.id === id)) {
        return
      }
      this.ditherProcesses.push({ id, title })
    },

    onDitherResult ({ id, imageData }) {
      const p = this.ditherProcesses.find(e => e.id === id)
      if (!p) {
        return
      }
      p.imageData = imageData
      setTimeout(() => {
        const ditherCanvas = document.querySelector(`canvas.${p.id}`)
        if (ditherCanvas) {
          ditherCanvas.getContext('2d').putImageData(imageData, 0, 0)
        }
      }, 150)
    },

    cancel () {
      this.ditherProcesses = []
      this.$emit('cancel')
    },

    select (imageData) {
      this.$emit('select', imageData)
    }
  },

  mounted () {
    this.drawSourceImg()
  }
})
</script>

<style lang="sass" scoped>
canvas
  border: 1px solid
  image-rendering: pixelated
  cursor: pointer
  &:hover
    box-shadow: 0 0 0 1px $primary
    border-color: $primary

.canvas-placeholder
  width: 128px
  height: 64px
  border: 1px solid
</style>
