export default ({ store }) => {
  store.toggleFlag = (flag, condition) => {
    store.$patch(($state) => {
      if (typeof flag !== 'string' && typeof flag !== 'number') {
        return console.error(
          new Error(
            `Flag ${flag} in store ${store.$id} is not a string or number`
          )
        )
      }

      if (!flag) {
        return console.error(
          new Error(`No flag is specified for store ${store.$id}`)
        )
      }

      if (typeof $state.flags[flag] === 'undefined') {
        return console.error(
          new Error(`Flag ${flag} does not exist in store ${store.$id}`)
        )
      }

      if (typeof condition !== 'boolean') {
        return console.error(
          new Error(
            `The condition of flag ${flag} for store ${store.$id} is not boolean`
          )
        )
      }

      if (!condition && typeof condition !== 'boolean') {
        return console.error(
          new Error(
            `The condition for flag ${flag} in store ${store.$id} is not specified`
          )
        )
      }

      $state.flags[flag] = condition
    })
  }
}
