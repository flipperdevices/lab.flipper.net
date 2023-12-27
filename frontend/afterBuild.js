const { exec } = require('child_process')

const cpVendor = () => {
  return new Promise((resolve, reject) => {
    exec('mkdir ./dist/electron/UnPackaged/js/js/ && cp ./dist/electron/UnPackaged/js/vendor.js ./dist/electron/UnPackaged/js/js/vendor.js', (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      if (stderr) {
        console.error(stderr)
      }
      resolve()
    })
  })
}

const packAsar = () => {
  return new Promise((resolve, reject) => {
    exec('npx asar pack ./dist/electron/UnPackaged ./dist/electron/Packaged/mac-arm64/lab.flipper.net.app/Contents/Resources/app.asar', (err, stdout, stderr) => {
      if (err) {
        reject(err)
      }
      if (stderr) {
        reject(stderr)
      }
      resolve()
    })
  })
}

module.exports = {
  cpVendor,
  packAsar
}
