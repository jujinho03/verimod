import { spawn, type ChildProcess } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

type Start = (command: string, args: string[], cwd: string, env: NodeJS.ProcessEnv) => ChildProcess

/** Shared by the actual R01 runner (first start/reopen) and Windows process smoke tests. */
export function launchBackend(root: string, env: NodeJS.ProcessEnv, start: Start =
  (command, args, cwd, childEnv) => spawn(command, args, { cwd, env: childEnv, windowsHide: true })) {
  const loaderUrl = pathToFileURL(resolve(root, 'backend/node_modules/tsx/dist/loader.mjs')).href
  return start(process.execPath, ['--import', loaderUrl, 'src/server.ts'], resolve(root, 'backend'), env)
}

export async function stopChild(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
  await new Promise<void>((done, reject) => {
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      forceTimer = setTimeout(() => { cleanup(); reject(new Error('Child termination timed out')) }, 5000)
    }, 5000)
    let forceTimer: ReturnType<typeof setTimeout> | undefined
    const cleanup = () => { clearTimeout(timer); clearTimeout(forceTimer); child.off('exit', exited); child.off('error', failed) }
    const exited = () => { cleanup(); done() }
    const failed = (error: Error) => { cleanup(); reject(error) }
    child.once('exit', exited); child.once('error', failed)
    if (!child.kill()) { cleanup(); reject(new Error('Could not terminate owned child')) }
  })
}

/** A failed readiness check owns cleanup, including a still-listening child on timeout. */
export async function waitForBackendHealth(child: ChildProcess, url: string, timeoutMs = 120000): Promise<unknown> {
  const deadline = Date.now() + timeoutMs
  try {
    while (Date.now() < deadline) {
      if (!child.pid || child.exitCode !== null || child.signalCode !== null) throw new Error('Backend exited before readiness')
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(Math.max(1, Math.min(1000, deadline - Date.now()))) })
        if (response.status === 200) return await response.json()
      } catch {}
      await new Promise(done => setTimeout(done, 100))
    }
    throw new Error('Backend readiness timed out')
  } catch (error) {
    await stopChild(child)
    throw error
  }
}
