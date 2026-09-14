import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Independent lockfiles remain in their packages; this is not an npm workspace.
const checks = [
  ['frontend', ['lint']],
  ['backend', ['typecheck']],
  ['backend/contracts', []],
]

for (const [directory, extra] of checks) {
  const cwd = fileURLToPath(new URL(`../${directory}/`, import.meta.url))
  for (const args of [['ci'], ['test'], ...extra.map((name) => ['run', name]), ['run', 'build']]) {
    console.log(`\n[${directory}] npm ${args.join(' ')}`)
    const cli = process.env.npm_execpath
    const result = spawnSync(cli ? process.execPath : 'npm', cli ? [cli, ...args] : args, {
      cwd,
      stdio: 'inherit',
      shell: !cli && process.platform === 'win32',
    })
    if (result.error) console.error(result.error.message)
    if (result.status !== 0) process.exit(result.status ?? 1)
  }
}
