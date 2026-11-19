import { spawn } from 'node:child_process'

const env = { ...process.env }

if (process.platform === 'linux') {
  // Linux developer machines can lack Electron's SUID sandbox helper.
  env.ELECTRON_DISABLE_SANDBOX = '1'
} else {
  delete env.ELECTRON_DISABLE_SANDBOX
}

const child = spawn('electron-vite', ['dev', '-w'], {
  env,
  shell: process.platform === 'win32',
  stdio: 'inherit',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 0)
})

child.on('error', (error) => {
  console.error(error)
  process.exit(1)
})
