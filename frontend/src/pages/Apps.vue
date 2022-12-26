<template>
  <q-page
    class="column items-center q-py-lg full-width"
    :style="$q.screen.width >= 404 ? 'padding: 24px 26px; max-width: 1284px' : 'padding: 24px 6px'"
  >
    <div class="apps-navbar row justify-end items-center full-width q-mb-xl">
      <q-icon
        v-if="currentApp || flags.installedPage"
        name="mdi-chevron-left"
        size="50px"
        class="cursor-pointer"
        @click="flags.installedPage = false; router.push('/apps')"
      ></q-icon>
      <q-icon
        v-else
        name="svguse:common-icons.svg#apps"
        size="56px"
        class="q-mr-md"
      ></q-icon>
      <div class="text-h4 q-mr-lg">Apps</div>
      <q-space />
      <div
        class="col-grow"
        :style="$q.screen.width <= 353 ? 'margin-top: 16px; width: 100%' : 'max-width: 300px; min-width: 140px'"
      >
        <SearchBar
          :categories="categories"
          :apps="apps"
          @setCategory="setCategory"
          @openApp="openApp"
        />
      </div>
      <div class="q-ml-md" :style="$q.screen.width <= 365 ? 'margin-top: 16px' : ''">
        <div>
          <q-btn
            flat
            no-caps
            dense
            :color="flags.installedPage ? 'primary' : 'grey-7'"
            icon="svguse:common-icons.svg#installed"
            label="Installed"
            :stack="$q.screen.width <= 365"
            @click="toggleInstalled"
          />
        </div>
        <div class="q-ml-md">
          <q-btn
            flat
            no-caps
            dense
            color="grey-7"
            icon="mdi-github"
            label="Contribute"
            :stack="$q.screen.width <= 365"
          />
        </div>
      </div>
    </div>
    <template v-if="flags.installedPage">
      <InstalledApps
        :apps="apps"
        :flipper="flipper"
        @showNotif="passNotif"
        @openApp="openApp"
      />
    </template>
    <template v-else-if="!currentApp">
      <AppList
        :categories="categories"
        :apps="apps"
        :initialCategory="initialCategory"
        :flipper="flipper"
        :connected="connected"
        :rpcActive="rpcActive"
        :info="info"
        @showNotif="passNotif"
        @openApp="openApp"
      />
    </template>
    <template v-else>
      <AppPage
        :categories="categories"
        :app="currentApp"
        :flipper="flipper"
        :connected="connected"
        :rpcActive="rpcActive"
        :info="info"
        @showNotif="passNotif"
      />
    </template>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from 'components/SearchBar.vue'
import AppList from 'components/AppList.vue'
import AppPage from 'components/AppPage.vue'
import InstalledApps from 'components/InstalledApps.vue'
import asyncSleep from 'simple-async-sleep'

export default defineComponent({
  name: 'Apps',

  props: {
    flipper: Object,
    connected: Boolean,
    rpcActive: Boolean,
    info: Object
  },

  components: {
    SearchBar,
    AppList,
    AppPage,
    InstalledApps
  },

  setup () {
    const router = useRouter()
    return {
      router,
      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        installedPage: false
      }),
      initialCategory: ref(null),
      currentApp: ref(null),
      apps: ref([]),
      categories: ref([
        {
          name: 'Sub-GHz',
          icon: 'svguse:apps-categories.svg#subghz',
          color: '#7fffb8'
        },
        {
          name: 'RFID 125',
          icon: 'svguse:apps-categories.svg#rfid',
          color: '#eef269'
        },
        {
          name: 'NFC',
          icon: 'svguse:apps-categories.svg#nfc',
          color: '#7fe0ff'
        },
        {
          name: 'Infrared',
          icon: 'svguse:apps-categories.svg#infrared',
          color: '#ff8585'
        },
        {
          name: 'GPIO',
          icon: 'svguse:apps-categories.svg#gpio',
          color: '#85ffe1'
        },
        {
          name: 'iButton',
          icon: 'svguse:apps-categories.svg#ibutton',
          color: '#f4cfb3'
        },
        {
          name: 'USB',
          icon: 'svguse:apps-categories.svg#usb',
          color: '#ffc1fe'
        },
        {
          name: 'Games',
          icon: 'svguse:apps-categories.svg#games',
          color: '#ffc064'
        },
        {
          name: 'Media',
          icon: 'svguse:apps-categories.svg#media',
          color: '#e391ff'
        },
        {
          name: 'Tools',
          icon: 'svguse:apps-categories.svg#tools',
          color: '#d2d21e'
        }
      ])
    }
  },

  computed: {
  },

  methods: {
    openApp (app) {
      this.currentApp = app
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      this.router.push(prefix + encodeURIComponent(app.name.toLowerCase().replaceAll(' ', '-')))
    },

    setCategory (name) {
      const category = this.categories.find(e => e.name === name)
      let prefix = ''
      if (!location.pathname.startsWith('/apps/')) {
        prefix = 'apps/'
      }
      this.router.push(prefix + encodeURIComponent(category.name.toLowerCase().replaceAll(' ', '-')))
    },

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
        message: `Apps: RPC error in command '${command}': ${error}`
      })
    },

    watchParams () {
      this.currentApp = null
      this.initialCategory = null
      if (this.$route.params.path) {
        if (this.$route.params.path === 'installed') {
          this.flags.installedPage = true
        } else {
          this.flags.installedPage = false
          const category = this.categories.find(e => e.name.toLowerCase().replaceAll(' ', '-') ===
            this.$route.params.path.toLowerCase().replaceAll(' ', '-'))
          if (category) {
            this.initialCategory = category
          } else {
            const app = this.apps.find(e => e.name.toLowerCase().replaceAll(' ', '-') ===
              this.$route.params.path.toLowerCase().replaceAll(' ', '-'))
            if (app) {
              this.currentApp = app
              this.initialCategory = this.categories.find(e => e.name === app.category)
            }
          }
        }
      }
    },

    toggleInstalled () {
      if (this.flags.installedPage) {
        this.flags.installedPage = false
        this.router.push('/apps')
      } else {
        this.router.push('/apps/installed')
      }
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
      this.apps.push({
        name: 'Sample App ' + i,
        category: category.name,
        stars: Math.floor(Math.random() * 100),
        updated: Date.now() - Math.floor(Math.random() * 1000),
        published: Date.now() - 10000 - Math.floor(Math.random() * 1000),
        version: '1.0.1',
        icon: 'https://cdn.flipperzero.one/dap-link-mock-icon.png',
        screenshots: [
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=1',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=2',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=3',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=4',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=5',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=6',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=7',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=8',
          'https://cdn.flipperzero.one/bluetooth-remote-mock-screen.png?n=9'
        ],
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nEst nullam montes, sed elementum ligula. Dignissim in dignissim pulvinar iaculis sapien egestas enim sed semper. Diam eu porttitor maecenas nisl vel aliquam ultrices nunc. Lectus velit, dapibus nunc felis maecenas egestas iaculis semper sed. Lectus tellus sed maecenas purus tincidunt hac ut. Urna odio purus condimentum tempor non ultricies. Volutpat amet, integer sem id viverra nulla pellentesque. Egestas pharetra, pharetra accumsan sit ac, arcu.',
        changelog: 'Last update Oct 20, 2022\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Est nullam montes, sed elementum ligula.\nDignissim in dignissim pulvinar iaculis sapien egestas enim sed semper.\nDiam eu porttitor maecenas nisl vel aliquam ultrices nunc.\nLectus velit, dapibus nunc felis maecenas egestas iaculis semper sed.\nLectus tellus sed maecenas purus tincidunt hac ut. Urna odio purus condimentum tempor non ultricies.\nVolutpat amet, integer sem id viverra nulla pellentesque.\nEgestas pharetra, pharetra accumsan sit ac, arcu.',
        repository: 'https://github.com/developername/apprepository',
        manifest: 'https://github.com/developername/apprepository/manifest',
        email: 'contactdata@gmail.com'
      })
    }
    for (let i = 0; i < 10; i++) {
      const app = this.apps[i * 3]
      if (Math.random() > 0.6) {
        app.installedVersion = '1.0.0'
      }
      app.isInstalled = true
    }
    this.watchParams()
  },

  updated () {
    this.watchParams()
  }
})
</script>

<style lang="sass" scoped>
.apps-navbar
  div
    display: flex
    align-items: center
    height: 40px
</style>
