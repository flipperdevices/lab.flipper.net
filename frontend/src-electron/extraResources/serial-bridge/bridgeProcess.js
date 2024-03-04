const { spawn } = require('child_process')
const path = require('path')
const decoder = new TextDecoder()

const bridgeProcess = spawn(path.join(__dirname, 'flipper_lab_bridge'))
// bridgeProcess.stdin.setEncoding('utf-8')

bridgeProcess.stdout.on('data', (data) => {
  process.parentPort.postMessage({
    type: 'stdout',
    data: decoder.decode(data)
  })
  // console.log(`stdout: ${data}`)
})
bridgeProcess.stderr.on('data', (data) => {
  process.parentPort.postMessage({
    type: 'stderr',
    data: decoder.decode(data)
  })
  // console.error(`stderr: ${data}`)
})
bridgeProcess.on('close', (code) => {
  process.parentPort.postMessage({
    type: 'exit',
    code
  })
  // console.log(`child process exited with code ${code}`)
})

process.parentPort.on('message', (e) => {
  if (e.data.type === 'stdin') {
    const json = typeof e.data.json === 'string' ? e.data.json : JSON.stringify(e.data.json)
    console.log(json)
    bridgeProcess.stdin.write(json + '\n')
  } else if (e.data.type === 'kill') {
    bridgeProcess.kill()
  }
})

function killBeforeExit () {
  if (bridgeProcess) {
    try {
      bridgeProcess.kill()
    } catch (error) {
      console.error(error)
    }
  }
}

// FIXME desperate attempt to kill the bridge process before the main process exits, doesn't work
process.on('exit', killBeforeExit)
process.on('SIGINT', killBeforeExit)
process.on('SIGTERM', killBeforeExit)
