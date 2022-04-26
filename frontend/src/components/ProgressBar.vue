<template>
  <q-linear-progress
    rounded
    size="2.25rem"
    :value="progress"
    :instant-feedback="!interpolated"
    color="positive"
    class="q-mt-sm q-mb-lg"
  >
    <div class="absolute-full flex flex-center">
      <q-badge
        v-if="title.length > 0"
        color="white"
        text-color="positive"
        :label="title"
      ></q-badge>
    </div>
  </q-linear-progress>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'ProgressBar',
  props: {
    title: {
      type: String,
      default: ''
    },
    progress: {
      type: Number,
      required: true
    },
    interpolated: {
      type: Boolean,
      default: false
    }
  }
})
</script>
