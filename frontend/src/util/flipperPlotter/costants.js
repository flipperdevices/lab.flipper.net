const defaults = {
  selector: '#flipperPlotter',
  height: 300,
  margin: {
    top: 50,
    right: 0,
    bottom: 50,
    left: 0
  },
  breakpointZoom: 10
}

const styles = {
  relativePosition: 'position: relative;',
  fullWidth:
    'width: 100% !important; margin-left: 0 !important; margin-right: 0 !important;',
  absoluteTopLeft: 'position: absolute; top: 0; left: 0;'
}

// const Slicers = {
//   PCM: 'PCM',
//   PWM: 'PWM',
//   PPM: 'PPM',
//   MC: 'MC',
//   DM: 'DM',
//   NRZI: 'NRZI',
//   CMI: 'CMI',
//   PIWM: 'PIWM'
// }

const slicerOptions = [
  // { text: 'off', value: '' },
  { text: 'PCM', value: 'PCM' },
  { text: 'PWM', value: 'PWM' },
  { text: 'PPM', value: 'PPM' },
  { text: 'MC', value: 'MC' },
  { text: 'DM', value: 'DM' },
  { text: 'NRZI', value: 'NRZI' },
  { text: 'CMI', value: 'CMI' },
  { text: 'PIWM', value: 'PIWM' }
]

export { defaults, styles, slicerOptions }