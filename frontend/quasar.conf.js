/* eslint-env node */
const ESLintPlugin = require('eslint-webpack-plugin')
const { configure } = require('quasar/wrappers')
const path = require('node:path')

const { compileProtofiles, moveWorkers } = require('./beforeBuild.js')
const { cpVendor, packAsar } = require('./afterBuild.js')

module.exports = configure(function (ctx) {
  return {
    supportTS: false,
    boot: [
      'axios'
    ],

    css: [
      'app.sass'
    ],

    extras: [
      'roboto-font',
      'material-icons',
      'mdi-v5'
    ],

    build: {
      vueRouterMode: 'history',

      env: {
        ARCHIVARIUS_API_ENDPOINT: process.env.PRODUCTION
          ? 'https://catalog.flipperzero.one/api/v0'
          : 'https://catalog.flipp.dev/api/v0',
        PRODUCTION: process.env.PRODUCTION
      },

      beforeBuild: async ({ quasarConf }) => {
        await compileProtofiles()
        if (quasarConf.ctx.mode.electron) {
          await moveWorkers()
        }
      },

      afterBuild: async ({ quasarConf }) => {
        if (quasarConf.ctx.mode.electron) {
          await cpVendor()
          await packAsar()
        }
      },

      beforeDev: async ({ quasarConf }) => {
        await compileProtofiles()
        if (quasarConf.ctx.mode.electron) {
          await moveWorkers()
        }
      },

      chainWebpack (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js', 'vue'] }]),
        chain.resolve.alias
          .set('util', path.resolve(__dirname, './src/util'))
        chain.resolve.alias
          .set('composables', path.resolve(__dirname, './src/composables'))
      }
    },

    devServer: {
      server: {
        type: 'http'
      },
      port: 8080,
      open: false
    },

    framework: {
      config: {},
      plugins: [
        'Notify'
      ]
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      chainWebpackWebserver (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }])
      },

      middlewares: [
        ctx.prod ? 'compression' : '',
        'render' // keep this as last one
      ]
    },

    pwa: {
      workboxPluginMode: 'GenerateSW',
      workboxOptions: {},

      chainWebpackCustomSW (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }])
      },

      manifest: {
        name: 'lab.flipper.net',
        short_name: 'lab.flipper.net',
        description: 'Web platform for your Flipper',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#ffffff',
        theme_color: '#027be3',
        icons: [
          {
            src: 'icons/icon-128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'icons/icon-384x384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    },

    cordova: {
    },

    capacitor: {
      hideSplashscreen: true
    },

    electron: {
      bundler: 'builder',

      packager: {
      },

      builder: {
        appId: 'lab.flipper.net',
        publish: {
          provider: 'github',
          publishAutoUpdate: false
        },
        /* files: [
          {
            from: "src/util/untar/",
            to: "src-electron/extraResources/",
            filter: [
              "untar-worker.js"
            ]
          }
        ], */
        extraResources: [
          {
            from: "src-electron/extraResources/",
            to: "extraResources",
            filter: [
              "**/*"
            ]
          }
        ],
        /* asarUnpack: [
          "src/util/untar/untar-worker.js"
        ], */
        mac: {
          target: {
            target: 'default',
            // arch: 'universal'
            arch: ['x64', 'arm64']
          }
        }
      },

      chainWebpackMain (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }])
      },

      chainWebpackPreload (chain) {
        chain.plugin('eslint-webpack-plugin')
          .use(ESLintPlugin, [{ extensions: ['js'] }])
      }
    }
  }
})
