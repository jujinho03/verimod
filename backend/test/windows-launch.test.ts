import { spawn, type ChildProcess } from 'node:child_process'
import { once } from 'node:events'
import { appendFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { dirname, join, resolve, sep } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { launchBackend, stopChild, waitForBackendHealth } from '../scripts/backend-process.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const children: ChildProcess[] = []
const directories: string[] = []
const temporaryBase = join(root, 'backend/private-data/windows-launch-smoke')
const log = (value: unknown) => {
  const line = JSON.stringify({ timestamp: new Date().toISOString(), ...value as object })
  console.log(line)
  if (process.env.VERIMOD_WINDOWS_SMOKE_LOG) appendFileSync(process.env.VERIMOD_WINDOWS_SMOKE_LOG, `${line}\n`)
}
async function freePort() {
  const server = createServer()
  server.listen(0, '127.0.0.1'); await once(server, 'listening')
  const port = (server.address() as { port: number }).port
  await new Promise<void>(done => server.close(() => done()))
  return port
}
async function expectPortReleased(port: number) {
  const server = createServer()
  server.listen(port, '127.0.0.1'); await once(server, 'listening')
  await new Promise<void>(done => server.close(() => done()))
}
function environment(port: number, db: string) {
  const env = { ...process.env }
  for (const name of Object.keys(env)) if (name.startsWith('VERIMOD_')) delete env[name]
  return { ...env, PORT: String(port), VERIMOD_DB_PATH: db }
}
function checkout(copyServer = true) {
  mkdirSync(temporaryBase, { recursive: true })
  const path = mkdtempSync(join(temporaryBase, 'VeriMod Windows ESM spaces '))
  directories.push(path)
  mkdirSync(join(path, 'backend'))
  cpSync(join(root, 'backend/package.json'), join(path, 'backend/package.json'))
  if (copyServer) cpSync(join(root, 'backend/src'), join(path, 'backend/src'), { recursive: true })
  // Other installed dependencies resolve through the real backend ancestor. No symlink privilege needed.
  cpSync(join(root, 'backend/node_modules/tsx'), join(path, 'backend/node_modules/tsx'), { recursive: true })
  // Only actual application source/dependencies are used. No inference service or model fixture.
  return path
}
function start(path: string, env: NodeJS.ProcessEnv) {
  const child = launchBackend(path, env)
  children.push(child)
  let stderr = ''
  child.stderr?.on('data', chunk => { stderr += String(chunk) })
  child.stdout?.resume()
  child.on('error', () => {}) // readiness reports failed spawn; avoid an unhandled EventEmitter error.
  return { child, stderr: () => stderr }
}
function emptyDatabase(db: string) {
  const database = new DatabaseSync(db, { readOnly: true })
  try {
    const counts = Object.fromEntries(['receipts', 'content_store', 'epochs', 'epoch_members', 'idempotency_records'].map(table =>
      [table, (database.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get() as { n: number }).n]))
    expect(Object.values(counts)).toEqual([0, 0, 0, 0, 0])
    return counts
  } finally { database.close() }
}
async function safe503(base: string) {
  const response = await fetch(`${base}/api/decisions`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-demo-role': 'DEMO_USER', 'x-demo-principal': 'windows-smoke', 'Idempotency-Key': 'no-model' },
    body: JSON.stringify({ text: 'Windows launch smoke without model' }), signal: AbortSignal.timeout(5000) })
  expect(response.status).toBe(503)
  return response.status
}

afterEach(async () => {
  for (const child of children.splice(0)) await stopChild(child)
  for (const directory of directories.splice(0)) {
    if (!resolve(directory).startsWith(resolve(temporaryBase) + sep)) throw new Error('Refusing cleanup outside owned temporary base')
    rmSync(directory, { recursive: true, force: true })
  }
})

describe.skipIf(process.platform !== 'win32')('Windows actual backend launcher', () => {
  it('reproduces the original drive-path ESM failure', async () => {
    const path = checkout()
    const child = spawn(process.execPath, ['--import', resolve(path, 'backend/node_modules/tsx/dist/loader.mjs'), 'src/server.ts'],
      { cwd: join(path, 'backend'), env: environment(await freePort(), join(path, 'unused.sqlite')), windowsHide: true })
    children.push(child)
    let stderr = ''; child.stderr.on('data', chunk => { stderr += String(chunk) }); child.stdout.resume()
    const [code] = await once(child, 'exit')
    expect(code).not.toBe(0); expect(stderr).toContain('ERR_UNSUPPORTED_ESM_URL_SCHEME')
    log({ case: 'original-drive-path', platform: process.platform, node: process.version,
      tsx: JSON.parse(readFileSync(join(root, 'backend/node_modules/tsx/package.json'), 'utf8')).version,
      exit_code: code, error: 'ERR_UNSUPPORTED_ESM_URL_SCHEME', result: 'REPRODUCED' })
  }, 20000)

  it('starts, returns safe 503 with zero candidates, and restarts the same SQLite in a path with spaces', async () => {
    const path = checkout(), port = await freePort(), db = join(path, 'same database.sqlite'), base = `http://127.0.0.1:${port}`
    expect(path).toMatch(/^[A-Za-z]:\\/); expect(path).toContain(' ')
    const env = environment(port, db)
    for (const phase of ['FIRST_BACKEND_START', 'BACKEND_RESTART']) {
      const { child, stderr } = start(path, env)
      expect(child.spawnargs[2]).toMatch(/^file:\/\//); expect(child.spawnargs[2]).toContain('%20')
      expect(await waitForBackendHealth(child, `${base}/api/health`, 20000)).toEqual({ status: 'ok', service: 'verimod-backend' })
      const status = await safe503(base)
      const counts = emptyDatabase(db)
      await stopChild(child); await expectPortReleased(port)
      expect(stderr()).not.toContain('ERR_UNSUPPORTED_ESM_URL_SCHEME')
      log({ case: phase, health: 200, decision: status, db_counts: counts, anchor_candidates: counts.receipts,
        child_exited: child.exitCode !== null || child.signalCode !== null, port_released: true,
        drive_path: true, spaces_path: true, loader_file_url: true, same_sqlite: true, model_fixture: false, result: 'PASS' })
    }
  }, 50000)

  it('cleans up a listening backend after a readiness timeout', async () => {
    const path = checkout(), port = await freePort(), base = `http://127.0.0.1:${port}`
    const { child } = start(path, environment(port, join(path, 'timeout.sqlite')))
    await waitForBackendHealth(child, `${base}/api/health`, 20000)
    await expect(waitForBackendHealth(child, `${base}/missing-health`, 300)).rejects.toThrow('Backend readiness timed out')
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true)
    await expectPortReleased(port)
    log({ case: 'readiness-timeout', child_exited: true, port_released: true, result: 'PASS' })
  }, 30000)

  it('cleans up an entry-point failure without leaving a process or port', async () => {
    const path = checkout(false), port = await freePort()
    const { child } = start(path, environment(port, join(path, 'failed.sqlite')))
    await expect(waitForBackendHealth(child, `http://127.0.0.1:${port}/api/health`, 10000)).rejects.toThrow('Backend exited before readiness')
    expect(child.exitCode !== null || child.signalCode !== null).toBe(true)
    await expectPortReleased(port)
    log({ case: 'entry-point-failure', child_exited: true, port_released: true, result: 'PASS' })
  }, 20000)
})
