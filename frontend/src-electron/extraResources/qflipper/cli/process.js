const { spawn } = require('child_process')

process.parentPort.once('message', (e) => {
  const args = e.data.args
  const qCliProcess = spawn('/Users/slipn3r/Documents/GitHub/lab.flipper.net/frontend/src-electron/extraResources/qflipper/cli/qFlipper-cli', args)// spawn('./qflipper/cli/qFlipper-cli', ['-h'])
  const decoder = new TextDecoder()
  qCliProcess.stdout.on('data', (data) => {
    process.parentPort.postMessage({
      type: 'stdout',
      data: decoder.decode(data)
    })
    // console.log(`stdout: ${data}`)
  })
  qCliProcess.stderr.on('data', (data) => {
    process.parentPort.postMessage({
      type: 'stderr',
      data: decoder.decode(data)
    })
    // console.error(`stderr: ${data}`)
  })
  qCliProcess.on('close', (code) => {
    process.parentPort.postMessage({
      type: 'exit',
      code
    })
    // console.log(`child process exited with code ${code}`)
  })
})
