import { boot } from 'quasar/wrappers'
import axios from 'axios'

let API_ENDPOINT = process.env.ARCHIVARIUS_API_ENDPOINT
if (localStorage.getItem('catalogChannel') !== null) {
  if (localStorage.getItem('catalogChannel') === 'production') {
    API_ENDPOINT = 'https://catalog.flipperzero.one/api/v0'
  } else {
    API_ENDPOINT = 'https://catalog.flipp.dev/api/v0'
  }
}

const api = axios.create({
  baseURL: API_ENDPOINT,
  timeout: 25000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
})

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
})

export { axios, api }
