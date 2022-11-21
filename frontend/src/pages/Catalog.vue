<template>
  <q-page
    class="column items-center q-py-lg"
    :style="$q.screen.width >= 404 ? 'padding: 24px 60px; max-width: 1400px' : 'padding: 24px 18px'"
  >
    <div class="catalog-navbar row justify-end full-width q-mb-lg">
      <div class="text-h4 q-mr-lg">{{ title }}</div>
      <q-space />
      <div
        class="col-grow bg-grey-5"
        :style="$q.screen.width <= 353 ? 'margin-top: 16px; width: 100%' : 'max-width: 300px; min-width: 140px'"
      >search bar</div>
      <div class="q-ml-md" :style="$q.screen.width <= 365 ? 'margin-top: 16px' : ''">
        <div>
          <q-btn flat no-caps dense color="grey-7" icon="mdi-package-down" label="Installed" :stack="$q.screen.width <= 365" />
        </div>
        <div class="q-ml-md">
          <q-btn flat no-caps dense color="grey-7" icon="mdi-github" label="Upload guide" :stack="$q.screen.width <= 365" />
        </div>
      </div>
    </div>
    <template v-if="!currentApp">
      <AppList :categories="categories" :apps="apps" :initialCategory="initialCategory"/>
    </template>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import AppList from 'components/AppList.vue'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'Catalog',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  components: {
    AppList
  },

  setup () {
    return {
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false
      }),
      title: ref('Catalog'),
      initialCategory: ref(null),
      currentApp: ref(null),
      apps: ref([]),
      categories: ref([
        {
          name: 'Sub-GHz',
          icon: 'archive:subghz',
          amount: 0
        },
        {
          name: 'NFC',
          icon: 'archive:nfc',
          amount: 0
        },
        {
          name: 'iButton',
          icon: 'archive:ibutton',
          amount: 0
        },
        {
          name: 'Tools',
          icon: 'archive:file',
          amount: 0
        },
        {
          name: 'Media',
          icon: 'archive:file',
          amount: 0
        },
        {
          name: 'RFID 125',
          icon: 'archive:rfid',
          amount: 0
        },
        {
          name: 'Infrared',
          icon: 'archive:infrared',
          amount: 0
        },
        {
          name: 'Bad USB',
          icon: 'archive:badusb',
          amount: 0
        },
        {
          name: 'Games',
          icon: 'archive:file',
          amount: 0
        },
        {
          name: 'Misc',
          icon: 'archive:file',
          amount: 0
        }
      ])
    }
  },

  computed: {
  },

  methods: {
    async startRpc () {
      this.flags.rpcToggling = true
      const ping = await this.flipper.commands.startRpcSession(this.flipper)
      if (!ping.resolved || ping.error) {
        this.$emit('showNotif', {
          message: 'Unable to start RPC session. Reload the page or reconnect Flipper manually.',
          color: 'negative',
          reloadBtn: true
        })
        this.$emit('log', {
          level: 'error',
          message: 'Device: Couldn\'t start rpc session'
        })
        throw new Error('Couldn\'t start rpc session')
      }
      this.flags.rpcActive = true
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', true)
      this.$emit('log', {
        level: 'info',
        message: 'Device: RPC started'
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.commands.stopRpcSession()
      this.flags.rpcActive = false
      this.flags.rpcToggling = false
      this.$emit('setRpcStatus', false)
      this.$emit('log', {
        level: 'info',
        message: 'Device: RPC stopped'
      })
    },

    async restartRpc (force) {
      if ((this.connected && this.flags.rpcActive && !this.flags.restarting) || force) {
        this.flags.restarting = true
        await this.flipper.closeReader()
        await asyncSleep(300)
        await this.flipper.disconnect()
        await asyncSleep(300)
        await this.flipper.connect()
        await this.startRpc()
        this.$emit('log', {
          level: 'info',
          message: 'Device: Restarted RPC'
        })
        return this.startScreenStream()
      }
    },

    passNotif (config) {
      this.$emit('showNotif', config)
    },
    passLog (config) {
      this.$emit('log', config)
    },

    rpcErrorHandler (error, command) {
      error = error.toString()
      this.$emit('showNotif', {
        message: `RPC error in command '${command}': ${error}`,
        color: 'negative'
      })
      this.$emit('log', {
        level: 'error',
        message: `Catalog: RPC error in command '${command}': ${error}`
      })
    },

    async start () {
      this.flags.rpcActive = this.rpcActive
      if (this.connected && !this.rpcActive) {
        setTimeout(() => {
          if (!this.rpcActive) {
            return this.restartRpc(true)
          }
        }, 1000)
        await this.startRpc()
      }
    }
  },

  mounted () {
    for (let i = 0; i < 30; i++) {
      const category = this.categories[Math.floor(Math.random() * this.categories.length)]
      category.amount++
      this.apps.push({
        name: 'Sample App ' + i,
        category: category.name,
        stars: Math.floor(Math.random() * 100),
        updated: Date.now() - Math.floor(Math.random() * 1000),
        icon: 'https://cdn.flipperzero.one/dap-link-mock-icon.png',
        screenshots: [
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png'
        ],
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nEst nullam montes, sed elementum ligula. Dignissim in dignissim pulvinar iaculis sapien egestas enim sed semper. Diam eu porttitor maecenas nisl vel aliquam ultrices nunc. Lectus velit, dapibus nunc felis maecenas egestas iaculis semper sed. Lectus tellus sed maecenas purus tincidunt hac ut. Urna odio purus condimentum tempor non ultricies. Volutpat amet, integer sem id viverra nulla pellentesque. Egestas pharetra, pharetra accumsan sit ac, arcu.',
        changelog: 'Last update Oct 20, 2022\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Est nullam montes, sed elementum ligula.\nDignissim in dignissim pulvinar iaculis sapien egestas enim sed semper.\nDiam eu porttitor maecenas nisl vel aliquam ultrices nunc.\nLectus velit, dapibus nunc felis maecenas egestas iaculis semper sed.\nLectus tellus sed maecenas purus tincidunt hac ut. Urna odio purus condimentum tempor non ultricies.\nVolutpat amet, integer sem id viverra nulla pellentesque.\nEgestas pharetra, pharetra accumsan sit ac, arcu.',
        repository: 'https://github.com/developername/apprepository',
        email: 'contactdata@gmail.com'
      })
    }
    console.log(this.apps)

    if (this.$route.params.path) {
      const category = this.categories.find(e => e.name.toLowerCase().replaceAll(' ', '-') === this.$route.params.path.toLowerCase().replaceAll(' ', '-'))
      if (category) {
        this.initialCategory = category
      } else {
        const app = this.apps.find(e => e.name.toLowerCase() === this.$route.params.path.toLowerCase())
        if (app) {
          this.currentApp = app
          this.initialCategory = this.categories.find(e => e.name === app.category)
        }
      }
    }
  }
})
</script>

<style lang="sass" scoped>
.catalog-navbar
  div
    display: flex
    align-items: center
    height: 40px
</style>
