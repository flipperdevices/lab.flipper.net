<template>
  <GenericPageLayout
    title="Pulse Plotter"
    icon="flipper:subtools"
    description="Raw Sub-GHz/Infrared/RFID pulse plotter"
  >
    <PulsePlotter />

    <template #info>
      <h6 class="q-mt-none q-mb-sm">About Pulse plotter</h6>
      <p>
        Sub-GHz/RFID/Infrared signal plotter, or Pulse plotter in short, is a
        tool to visualize raw signals (aka pulses) from various sources. Aside from
        visualizing saved signals, it can also be helpful to analyze raw
        captures.
      </p>
      <p>
        Accepted file formats are:
        <ul class="q-mt-none q-pl-lg">
          <li>Sub-GHz RAW captures (<b>.sub</b>)</li>
          <li>RFID RAW captures (<b>.raw</b>)</li>
          <li>Infrared signal/remote files (<b>.ir</b>)</li>
          <li>other <b>Flipper File Format RAW</b>-compatible files</li>
        </ul>
      </p>
      <p>After parsing the file, plotter will try to guess signal modulation. You can also use the slicer to figure it out manually.</p>
      <p class="q-mb-none">
        <a href="https://docs.flipper.net/sub-ghz/read-raw" target="_blank"
          >Read more about capturing RAW signals</a
        >
        on Flipper Docs
      </p>
    </template>
  </GenericPageLayout>
</template>

<script setup lang="ts">
import { GenericPageLayout } from 'shared/components/GenericPageLayout'
import { PulsePlotter } from 'widgets/PulsePlotter'
</script>
