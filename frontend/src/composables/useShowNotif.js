import { Notify } from 'quasar'

const showNotif = ({ message, color, reloadBtn }) => {
  const actions = []

  if (reloadBtn) {
    actions.push({ label: 'Reload', color: 'white', handler: () => { location.reload() } })
  }
  if (actions.length === 0) {
    actions.push({ icon: 'close', color: 'white', class: 'q-px-sm' })
  } else {
    actions.push({ label: 'Dismiss', color: 'white' })
  }

  Notify.create({
    message: message,
    color: color,
    textColor: 'white',
    position: 'bottom-right',
    timeout: 0,
    group: true,
    actions: actions
  })
}

export default showNotif
