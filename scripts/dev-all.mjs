// 설경민 데모 UI + 이 저장소의 backend/ai/shared 코드를 함께 실행한다.
// npm run dev:all; 서버 비밀값은 .env.local 또는 프로세스 환경변수에서만 읽는다.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, resolve } from 'node:path'
import { w4BackendEnv } from './w4-env.mjs'
import { loadEnv } from 'vite'

const app = fileURLToPath(new URL('..', import.meta.url))
const upstream = app
const backend = join(upstream, 'backend')
const devDb = resolve(app, '.data/backend-dev.sqlite')
mkdirSync(resolve(app, '.data'), { recursive: true })
if (!existsSync(join(backend, 'node_modules'))) {
  console.error('backend 의존성이 없습니다: cd backend; npm ci')
  process.exit(1)
}

const baseEnv = { ...loadEnv('development', app, ''), ...process.env }
delete baseEnv.VERIMOD_DB_PATH // 셸에 남은 다른 DB 경로가 섞이지 않게

function envFile(path) {
  if (!path || !existsSync(path)) return null
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return []
    const at = trimmed.indexOf('=')
    return [[trimmed.slice(0, at), trimmed.slice(at + 1)]]
  }))
}
const secretDir = baseEnv.VERIMOD_LOCAL_SECRET_DIR ?? (baseEnv.USERPROFILE ? join(baseEnv.USERPROFILE, 'VeriModSecrets') : null)
const autoBackendEnv = envFile(baseEnv.VERIMOD_AUTO_BACKEND_ENV ?? (secretDir ? join(secretDir, 'auto-backend.env') : null))
const autoWorkerEnv = envFile(baseEnv.VERIMOD_AUTO_WORKER_ENV ?? (secretDir ? join(secretDir, 'auto-worker.env') : null))
const localAutoAnchor = autoBackendEnv?.VERIMOD_AUTO_ANCHOR === 'true' && Boolean(autoWorkerEnv)

const r01Package = baseEnv.VERIMOD_R01_PACKAGE ? resolve(baseEnv.VERIMOD_R01_PACKAGE) : null
const modelDir = baseEnv.VERIMOD_MODEL_DIR ?? (r01Package ? join(r01Package, 'model/selected_model') : join(app, 'ai/artifacts/checkpoints/beep-klue-roberta-base-w3-seed45126-cpu/selected_model'))
const hfCache = baseEnv.VERIMOD_HF_CACHE ?? (r01Package ? join(r01Package, 'tokenizer_hf_cache') : undefined)
const python = baseEnv.VERIMOD_PYTHON ?? join(app, process.platform === 'win32' ? 'ai/.venv/Scripts/python.exe' : 'ai/.venv/bin/python')
const AI_PORT = Number(baseEnv.VERIMOD_AI_PORT ?? 8765)
const realAi = existsSync(join(modelDir, 'model.safetensors')) && existsSync(python)

const children = []
function start(name, cwd, command, args, env) {
  const child = spawn(command, args, { cwd, env, windowsHide: true })
  const write = (chunk) => { for (const line of String(chunk).split(/\r?\n/)) if (line.trim() && !line.includes('ExperimentalWarning') && !line.includes('--trace-warnings')) process.stdout.write(`[${name}] ${line}\n`) }
  child.stdout.on('data', write)
  child.stderr.on('data', write)
  child.on('exit', (code) => process.stdout.write(`[${name}] exited (${code})\n`))
  children.push(child)
  return child
}

async function waitHealthy(url, seconds) {
  for (let i = 0; i < seconds; i += 1) {
    try { if ((await fetch(url)).ok) return true } catch { /* not yet */ }
    await new Promise((r) => setTimeout(r, 1000))
  }
  return false
}

const autoDb = autoBackendEnv?.VERIMOD_DB_PATH ? resolve(backend, autoBackendEnv.VERIMOD_DB_PATH) : devDb
let backendEnv = { ...baseEnv, ...(autoBackendEnv ?? {}), PORT: '3001', VERIMOD_DB_PATH: autoDb }
if (realAi) {
  console.log(`실제 AI 모드: 가중치 ${modelDir}`)
  start('ai:8765', join(upstream, 'ai'), python, ['-m', 'uvicorn', '--factory', 'verimod_ai.inference.service:create_app', '--host', '127.0.0.1', '--port', String(AI_PORT)],
    { ...baseEnv, PYTHONPATH: join(upstream, 'ai/src'), VERIMOD_MODEL_DIR: modelDir, ...(hfCache ? { VERIMOD_HF_CACHE: hfCache } : {}), HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' })
  const healthy = await waitHealthy(`http://127.0.0.1:${AI_PORT}/healthz`, 120)
  console.log(healthy ? 'AI 서비스 /healthz 200' : 'AI 서비스가 준비되지 않았습니다 — backend는 fail-closed로 동작합니다')
  backendEnv = { ...backendEnv, ...w4BackendEnv(backend, `http://127.0.0.1:${AI_PORT}/infer`), ...(autoBackendEnv ?? {}), VERIMOD_INFERENCE_URL: `http://127.0.0.1:${AI_PORT}/infer`, VERIMOD_DB_PATH: autoDb }
} else {
  console.log(`실제 AI: 꺼짐 — 가중치 없음(${join(modelDir, 'model.safetensors')}) 또는 ${python} 없음. 판정 요청은 영수증 없이 거절됩니다.`)
}

start('backend:3001', backend, process.execPath, ['node_modules/tsx/dist/cli.mjs', 'src/server.ts'], backendEnv)
if (localAutoAnchor) {
  start('signer-worker', backend, process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/signer-worker.mts'], { ...baseEnv, ...autoWorkerEnv })
  console.log('Auto Anchor: backend + Signer Worker 자동 실행')
} else {
  console.log('Auto Anchor: 외부 env 파일이 없어 비활성화')
}
start('svc:3101', app, process.execPath, ['node_modules/tsx/dist/cli.mjs', 'server/index.ts'], baseEnv)
start('web:5190', app, process.execPath, ['node_modules/vite/bin/vite.js', '--port', '5190', '--strictPort'], baseEnv)

const stop = () => { for (const child of children) child.kill(); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
console.log(`backend dev DB: ${autoDb}`)
console.log('open http://localhost:5190')
