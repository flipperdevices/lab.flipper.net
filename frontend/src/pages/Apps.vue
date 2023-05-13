<template>
  <q-page
    class="column items-center q-py-lg full-width"
    :style="$q.screen.width >= 404 ? 'padding: 24px 26px; max-width: 1284px' : 'padding: 24px 6px'"
  >
    <div class="apps-navbar row justify-end items-center full-width q-mb-xl">
      <q-icon
        v-if="currentApp || flags.installedPage"
        name="mdi-chevron-left"
        size="56px"
        class="cursor-pointer q-mr-md"
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
            :color="flags.installedPage ? 'primary' : 'black'"
            style="font-weight: 400"
            icon="svguse:common-icons.svg#installed"
            :stack="$q.screen.width <= 365"
            @click="toggleInstalled"
            label="Installed"
          >
            <q-badge
              v-if="$q.screen.width > 365"
              color="positive"
              floating
              class="outdated-badge"
            >{{ outdatedAppsAmount }}</q-badge>
          </q-btn>
        </div>
        <div class="q-ml-md">
          <q-btn
            flat
            no-caps
            dense
            color="black"
            style="font-weight: 400"
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

    <q-dialog v-model="flags.outdatedFirmwareDialog">
      <q-card class="dialog">
        <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

        <q-card-section class="q-pa-none q-ma-md" align="center">
          <q-icon name="mdi-alert-circle" color="negative" size="64px" />
          <div class="text-h6 q-my-sm">Outdated Firmware Version</div>
          <p>Firmware version on your Flipper is not supported.<br />Click the link below to update your device.</p>
        </q-card-section>

        <q-card-section class="q-pt-none" align="center">
          <q-btn
            outline
            color="primary"
            label="Update"
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="flags.outdatedAPIDialog">
      <q-card class="dialog">
        <q-btn icon="close" flat round dense v-close-popup class="dialog-close-btn"/>

        <q-card-section class="q-pa-none q-ma-md" align="center">
          <q-icon name="mdi-alert-circle" color="negative" size="64px" />
          <div class="text-h6 q-my-sm">Outdated API Version</div>
          <p>Firmware on your Flipper is outdated.<br />Click the link below to update your device.</p>
        </q-card-section>

        <q-card-section class="q-pt-none" align="center">
          <q-btn
            outline
            color="primary"
            label="Update"
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
    <q-dialog v-model="flags.TOSDialog">
      <q-card class="dialog">
        <q-card-section>
          <div class="text-h6">Terms of Service</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <p>You accept our full Terms of Service by pressing Agree button.<br />The main ideas and rules fot this platform are listed below:</p>
          <ul>
            <li>Adipiscing ut tellus nibh pulvinar massa blandit. Ut rhoncus mi pulvinar nec nibh tortor turpis turpis.</li>
            <li>Et diam nisl tempor morbi mattis turpis gravida congue nisi.  nibh euismod tristique. </li>
            <li>Id quisque enim dictum gravida non fames semper at.</li>
            <li>Adipiscing ut tellus nibh pulvinar massa blandit. Ut rhoncus mi pulvinar nec nibh tortor turpis turpis.</li>
            <li>Et diam nisl tempor morbi mattis turpis gravida congue nisi.  nibh euismod tristique.</li>
            <li>Id quisque enim dictum gravida non fames semper at.</li>
          </ul>
        </q-card-section>

        <q-card-section class="q-pt-none text-center">
          <a href="" class="text-dark" style="text-decoration: none">
            <q-icon name="svguse:common-icons.svg#link" style="position: relative; top: -2px; left: -2px"/>
            Open Full Terms of Service
          </a>
        </q-card-section>

        <q-card-section class="q-pt-none flex justify-between">
          <q-btn
            outline
            color="primary"
            label="Reject"
            v-close-popup
          ></q-btn>
          <q-btn
            unelevated
            color="primary"
            label="Agree"
            v-close-popup
          ></q-btn>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from 'components/SearchBar.vue'
import AppList from 'components/AppList.vue'
import AppPage from 'components/AppPage.vue'
import InstalledApps from 'components/InstalledApps.vue'
import semver from 'semver'

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
      componentName: 'Apps',

      flags: ref({
        restarting: false,
        rpcActive: false,
        rpcToggling: false,
        installedPage: false,
        outdatedFirmwareDialog: false,
        outdatedAPIDialog: false,
        TOSDialog: false
      }),
      router,
      initialCategory: ref(null),
      currentApp: ref(null),
      apps: ref([]),
      categories: ref([
        {
          name: 'Sub-GHz',
          icon: 'svguse:apps-categories.svg#subghz',
          color: '#A5F4BE'
        },
        {
          name: 'RFID 125',
          icon: 'svguse:apps-categories.svg#rfid',
          color: '#FFF493'
        },
        {
          name: 'NFC',
          icon: 'svguse:apps-categories.svg#nfc',
          color: '#98CEFE'
        },
        {
          name: 'Infrared',
          icon: 'svguse:apps-categories.svg#infrared',
          color: '#FE938C'
        },
        {
          name: 'GPIO',
          icon: 'svguse:apps-categories.svg#gpio',
          color: '#A7F2EA'
        },
        {
          name: 'iButton',
          icon: 'svguse:apps-categories.svg#ibutton',
          color: '#E1BBA6'
        },
        {
          name: 'USB',
          icon: 'svguse:apps-categories.svg#usb',
          color: '#FFBEE9'
        },
        {
          name: 'Games',
          icon: 'svguse:apps-categories.svg#games',
          color: '#FFC486'
        },
        {
          name: 'Media',
          icon: 'svguse:apps-categories.svg#media',
          color: '#DFB5FF'
        },
        {
          name: 'Tools',
          icon: 'svguse:apps-categories.svg#tools',
          color: '#DFF159'
        }
      ])
    }
  },

  computed: {
    outdatedAppsAmount () {
      return this.apps.filter(e => e.isInstalled === true && e.installedVersion && semver.lt(e.installedVersion, e.version)).length
    }
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
      await this.flipper.startRPCSession()
        .catch(error => {
          console.error(error)
          this.$emit('log', {
            level: 'error',
            message: `${this.componentName}: Error while starting RPC: ${error.toString()}`
          })
        })
      this.flags.rpcActive = true
      this.$emit('setRpcStatus', true)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC started`
      })
    },

    async stopRpc () {
      this.flags.rpcToggling = true
      await this.flipper.setReadingMode('text', 'promptBreak')
      this.flags.rpcActive = false
      this.$emit('setRpcStatus', false)
      this.flags.rpcToggling = false
      this.$emit('log', {
        level: 'info',
        message: `${this.componentName}: RPC stopped`
      })
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
    if (localStorage.getItem('dev') !== 'true') {
      this.$router.push('/')
    }
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

.outdated-badge
  height: 17px !important
  position: relative
  top: -11px
  left: -72px
  font-size: 10px
  border: 1px #ffffff solid
  border-radius: 17px

// Dialogs
.dialog
  border-radius: 20px
  padding: 16px
.dialog-close-btn
  position: absolute
  top: 0.5rem
  right: 0.5rem
</style>
