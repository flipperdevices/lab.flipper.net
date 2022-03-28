<template>
  <q-layout view="hhh LpR fff">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          v-if="$q.screen.width < 500"
          @click="drawer = !drawer"
          icon="menu"
          dense
          flat
          round
        ></q-btn>

        <img src="../assets/flipper-logo.svg" />

        <q-space></q-space>

        <q-btn
          v-if="flags.portSelectRequired || !flags.connected && !flags.portSelectRequired"
          @click="flags.portSelectRequired ? selectPort() : connect()"
          outline
          class="q-mx-sm"
        >
          Connect
        </q-btn>
        <div v-else style="margin: 0 0.85rem">{{ connectionStatus }}</div>
        <q-separator dark vertical inset class="q-mx-lg"></q-separator>

        <div class="nav-links">
          <a href="https://flipperzero.one/">Home</a>
          <a href="https://shop.flipperzero.one/">Shop</a>
          <a href="https://flipperzero.one/faq">FAQ</a>
          <a href="https://blog.flipperzero.one/">Blog</a>
          <a href="https://forum.flipperzero.one/">Forum</a>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="drawer"
      show-if-above
      :mini="miniState"
      @mouseover="miniState = false"
      @mouseout="miniState = true"
      mini-to-overlay
      bordered
      :width="180"
      :breakpoint="500"
    >
      <q-list>
        <EssentialLink
          v-for="link in essentialLinks"
          :key="link.title"
          v-bind="link"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view :flipper="flipper" :rpcActive="flags.rpcActive" @setRpcStatus="setRpcStatus"/>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, ref } from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import * as flipper from '../flipper/core'
import asyncSleep from 'simple-async-sleep'

const linksList = [
  {
    title: 'Device',
    icon: 'memory',
    link: '/'
  },
  {
    title: 'Archive',
    icon: 'inventory',
    link: '/archive'
  },
  {
    title: 'IDE',
    icon: 'code',
    link: '/ide'
  },
  {
    title: 'NFC',
    icon: 'nfc',
    link: '/nfc'
  },
  {
    title: 'Sub GHz',
    icon: 'cell_tower',
    link: '/subghz'
  },
  {
    title: 'Tools',
    icon: 'apps',
    link: '/tools'
  },
  {
    title: 'Settings',
    icon: 'settings',
    link: '/settings'
  }
]

export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink
  },

  setup () {
    return {
      essentialLinks: linksList,
      drawer: ref(true),
      miniState: ref(true),

      flipper: ref(flipper),
      flags: ref({
        portSelectRequired: false,
        connected: false,
        rpcActive: false
      }),
      connectionStatus: ref('Ready to connect')
    }
  },

  methods: {
    async connect () {
      await this.flipper.connect()
        .then(() => {
          this.flags.portSelectRequired = false
          this.connectionStatus = 'Flipper connected'
          this.flags.connected = true
        })
        .catch((error) => {
          if (error.toString() === 'Error: No known ports') {
            this.flags.portSelectRequired = true
          } else {
            this.connectionStatus = error.toString()
          }
        })
    },

    async selectPort () {
      const filters = [
        { usbVendorId: 0x0483, usbProductId: 0x5740 }
      ]
      await navigator.serial.requestPort({ filters })
      return this.connect()
    },

    async disconnect () {
      await this.flipper.disconnect()
        .then(() => {
          this.connectionStatus = 'Disconnected'
          this.flags.connected = false
          this.info = {}
          this.textInfo = ''
        })
        .catch(async error => {
          if (error.toString().includes('Cannot cancel a locked stream')) {
            if (this.flags.rpcActive) {
              await this.stopRpc()
            } else {
              this.flipper.closeReader()
              await asyncSleep(300)
            }
            return this.disconnect()
          } else {
            this.connectionStatus = error.toString()
          }
        })
    },

    setRpcStatus (s) {
      this.flags.rpcActive = s
    }
  },

  mounted () {
    this.connect()

    navigator.serial.addEventListener('disconnect', async () => {
      await this.disconnect()
    })
  }
})
</script>
