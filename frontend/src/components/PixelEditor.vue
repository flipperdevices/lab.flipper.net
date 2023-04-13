<template>
  <div class="fit flex justify-center paint" @mouseup="mouseUp">
    <div v-if="pe" class="controls q-pa-xs rounded-borders bg-grey-2">
      <q-btn-toggle
        v-model="toolModel"
        flat
        dense
        :options="[
          { value: 'pencil', slot: 'pencil' },
          { value: 'eraser', slot: 'eraser' },
          { value: 'line', slot: 'line' },
          { value: 'rectangle', slot: 'rectangle' },
          { value: 'fill', slot: 'fill' },
        ]"
      >
        <template v-slot:pencil><q-icon name="mdi-pencil" class="q-px-sm"/></template>
        <template v-slot:eraser><q-icon name="mdi-eraser" class="q-px-sm"/></template>
        <template v-slot:line><q-icon name="mdi-vector-line" class="q-px-sm"/></template>
        <template v-slot:rectangle><q-icon name="mdi-vector-rectangle" class="q-px-sm"/></template>
        <template v-slot:fill><q-icon name="mdi-format-color-fill" class="q-px-sm q-pt-xs"/></template>
      </q-btn-toggle>

      <input type="file" class="file-upload hidden" @change="upload"/>
      <q-btn flat dense @click="triggerUpload" :loading="flags.imageFileLoading" class="q-px-sm" icon="mdi-file-image-outline"></q-btn>

      <q-btn
        flat
        dense
        :color="flags.checkerboard ? 'primary' : 'black'"
        icon="mdi-checkerboard"
        class="q-px-sm"
        @click="flags.checkerboard = !flags.checkerboard"
      ></q-btn>

      <q-separator vertical class="q-mx-xs"></q-separator>

      <q-btn flat dense icon="mdi-undo" class="q-px-sm" @click="undo"></q-btn>
      <q-btn flat dense icon="mdi-redo" class="q-px-sm" @click="redo"></q-btn>

      <q-separator vertical class="q-mx-xs"></q-separator>

      <div>
        <div class="flex no-wrap">
          <q-btn flat icon="mdi-magnify-minus-outline" class="q-px-sm" @click="zoom({ offset: -1 })"></q-btn>
          <!--<q-input
            dense
            outlined
            :model-value="zoomModel"
            @change="val => { zoomModel = /^[0-9]*$/.test(val) ? Number(val) : zoomModel }"
            @update:modelValue="val => { zoomModel = Number(val); zoom({ val }) }"
            :rules="[val => /^[0-9]*$/.test(val)]"
            hide-bottom-space
            style="width: 52px"
            label="Zoom"
            class="q-mx-xs"
         />-->
          <q-btn flat icon="mdi-magnify-plus-outline" class="q-px-sm" @click="zoom({ offset: 1 })"></q-btn>
        </div>
      </div>

      <q-separator vertical class="q-mx-xs"></q-separator>

      <q-btn flat icon="mdi-file-download-outline" class="q-px-sm" @click="download"></q-btn>

      <q-btn flat icon="mdi-delete-outline" class="q-px-sm" color="negative" @click="clear"></q-btn>
    </div>

    <div class="drawing-board fit flex flex-center">
      <div class="pe-container">
        <div v-if="flags.checkerboard" class="checkerboard" :style="`background-size: ${zoomModel * 2}px ${zoomModel * 2}px`"></div>
      </div>
    </div>

    <canvas class="mirror" width="128" height="64"></canvas>

    <q-dialog v-model="flags.ditherDialog">
      <DitherDialog
        :img="uploadedImage"
        @cancel="flags.ditherDialog = false"
        @select="drawImage"
      />
    </q-dialog>
  </div>
</template>

<script>
import { defineComponent, ref } from 'vue'
import PixelEditor from '../util/pixeleditor/pixeleditor'
import DitherDialog from 'src/components/DitherDialog.vue'
import { exportFile } from 'quasar'

export default defineComponent({
  name: 'PixelEditor',

  components: {
    DitherDialog
  },

  setup () {
    return {
      flags: ref({
        checkerboard: false,
        imageFileLoading: false,
        ditherDialog: false
      }),
      zoomModel: ref(4),
      toolModel: ref('pencil'),
      pe: ref(null),
      uploadedImage: ref(null)
    }
  },

  watch: {
    zoomModel (newValue, oldValue) {
      if (!/^[0-9]*$/.test(newValue)) {
        return
      }
      this.pe.resize({ zoom: newValue })
    },
    toolModel (newValue, oldValue) {
      switch (newValue) {
        case 'pencil':
          this.pe.currentColor = 1
          this.pe.mode = 'draw'
          break
        case 'eraser':
          this.pe.currentColor = 0
          this.pe.mode = 'draw'
          break
        case 'line':
          this.pe.currentColor = 1
          this.pe.mode = 'line'
          break
        case 'rectangle':
          this.pe.currentColor = 1
          this.pe.mode = 'rect'
          break
        case 'fill':
          this.pe.currentColor = 1
          this.pe.mode = 'fill'
          break
      }
    }
  },

  computed: {
    zoomLimit () {
      /* const containerWidth = document.querySelector('.paint').clientWidth
      const containerHeight = document.querySelector('.paint').clientHeight
      let max = 10
      if (containerWidth) {
        max = Math.round(Math.min(containerWidth / 128, containerHeight / 64))
      } */
      return {
        min: 1,
        max: 8
      }
    }
  },

  methods: {
    zoom ({ mul, val, offset }) {
      let result
      if (mul) {
        result = this.zoomModel * mul
      } else if (val) {
        result = val
      } else if (offset) {
        result = this.zoomModel + offset
      }
      if (result < this.zoomLimit.min) {
        this.zoomModel = this.zoomLimit.min
      } else if (result > this.zoomLimit.max) {
        this.zoomModel = this.zoomLimit.max
      } else {
        this.zoomModel = result
      }
    },

    undo () {
      this.pe.undo()
    },
    redo () {
      this.pe.redo()
    },
    clear () {
      this.pe.clear()
      this.updateMirror()
    },

    mouseUp () {
      if (!this.pe) {
        return
      }
      if (this.pe.drawing) {
        if (this.pe.mode === 'line') {
          this.pe.save()
          this.pe.plotLine(this.pe.p0, this.pe.p1)
          this.pe.draw()
          this.pe.updated()
        } else if (this.pe.mode === 'rect') {
          this.pe.save()
          this.pe.plotRect(this.pe.p0, this.pe.p1)
          this.pe.draw()
          this.pe.updated()
        }
        this.pe.drawing = false
      }
    },

    triggerUpload () {
      document.querySelector('.file-upload').click()
    },
    upload (event) {
      this.flags.imageFileLoading = true
      try {
        const file = event.target.files[0]
        if (file) {
          const reader = new FileReader()
          reader.readAsDataURL(file)

          const img = new Image()
          reader.onload = event => {
            if (event.target.readyState !== FileReader.DONE) {
              return
            }
            img.onload = () => {
              document.querySelector('.file-upload').value = null
              this.flags.imageFileLoading = false
              this.uploadedImage = img
              this.flags.ditherDialog = true
            }
            img.src = event.target.result
          }
        }
      } catch (error) {
        this.flags.imageFileLoading = false
        console.error(error)
      }
    },

    drawImage (imageData) {
      // console.log(imageData)
      this.flags.ditherDialog = false
      const pixelData = []
      for (let i = 0; i < imageData.data.length; i += 4) {
        if (imageData.data[i] + imageData.data[i + 1] + imageData.data[i + 2] === 0) {
          pixelData.push(1)
        } else {
          pixelData.push(0)
        }
      }
      this.pe.setData(pixelData)
      this.updateMirror()
      // console.log(this.pe)
    },

    async download () {
      const blob = await this.pe.toBlob()
      const status = exportFile(`Paint_${new Date().toISOString()}.png`, blob)
      if (!status) {
        console.error('Failed to download image: permission denied')
        this.$emit('showNotif', {
          message: 'Failed to download image: permission denied',
          color: 'negative'
        })
      }
    },

    updateMirror () {
      const mirror = document.querySelector('.mirror')
      const imageData = this.pe.toImageData()
      mirror.getContext('2d').putImageData(imageData, 0, 0)
    },

    createEditor () {
      this.pe = new PixelEditor({
        width: 128,
        height: 64,
        container: document.querySelector('.pe-container'),
        onUpdate: this.updateMirror
      })
    }
  },

  mounted () {
    this.createEditor()
  }
})
</script>

<style src="../util/pixeleditor/pixeleditor.css"></style>
<style lang="sass">
.paint
  .controls
    display: flex
    position: absolute
    z-index: 1

  .mirror
    position: fixed
    bottom: 8px
    right: 8px
    border: 1px solid
    background: #fff
    z-index: 1
    image-rendering: pixelated

  .drawing-board
    padding: 48px 8px 80px 8px
    background: #00000014

  .pe-container
    position: relative
    .checkerboard
      width: calc(100% - 1px)
      height: calc(100% - 1px)
      position: absolute
      top: 1px
      left: 1px
      background-position: 0px 0px
      background-image: repeating-conic-gradient( #fff0 0deg 90deg, #00000012 0 180deg)
      pointer-events: none
      z-index: 1

  .pixeleditor
    width: fit-content
    display: flex
    padding: 0
    align-items: center
    justify-content: center

  .pE
    border: none
</style>
