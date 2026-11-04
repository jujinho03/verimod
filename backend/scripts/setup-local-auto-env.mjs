import { randomBytes } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const directory = process.env.VERIMOD_LOCAL_SECRET_DIR
if (!directory) throw new Error('VERIMOD_LOCAL_SECRET_DIR required')
const source = resolve(directory, 'signer-worker.env')
const backend = resolve(directory, 'auto-backend.env')
const worker = resolve(directory, 'auto-worker.env')
if (!existsSync(source) || existsSync(backend) || existsSync(worker)) throw new Error('missing source or destination already exists')
const original = readFileSync(source, 'utf8')
if (!/^VERIMOD_DEPLOYER_PRIVATE_KEY=0x[0-9a-f]{64}$/m.test(original)) throw new Error('dedicated key missing')
const token = randomBytes(32).toString('hex')
const contract = '0x05dc13b9f35f0bbc37f662c621831a2394f66312'
const publisher = '0x8ef5f1e4ac6afcd780b0966407b5f32fd06b918d'
const common = [
  'VERIMOD_AUTO_ANCHOR=true', `VERIMOD_AUTO_ANCHOR_TOKEN=${token}`,
  `VERIMOD_AUTO_ANCHOR_CONTRACT=${contract}`, `VERIMOD_AUTO_ANCHOR_PUBLISHER=${publisher}`,
  'VERIMOD_AUTO_ANCHOR_RPC_URL=https://sepolia.base.org',
]
writeFileSync(backend, [
  ...common, 'VERIMOD_AUTO_ANCHOR_COOLDOWN_MS=30000',
  'VERIMOD_DB_PATH=./data/auto-demo.sqlite', 'PORT=3001',
  'VERIMOD_W4_PROVISIONAL_E2E_ONLY=true',
  'VERIMOD_INFERENCE_URL=http://127.0.0.1:8099/infer',
  'VERIMOD_MODEL_MANIFEST_PATH=./config/w4-r01.model_manifest.json',
  'VERIMOD_POLICY_MANIFEST_PATH=./config/w4-provisional.policy_manifest.json',
  'VERIMOD_POLICY_MANIFEST_HASH=0xa4559132db0d048483c43b258d189027b5de59067ae0b0f4365da2b222299a1e',
  'VERIMOD_HATE_REVIEW_PPM=24495', 'VERIMOD_HATE_RESTRICT_PPM=216950',
  'VERIMOD_OFFENSIVE_REVIEW_PPM=180483', 'VERIMOD_OFFENSIVE_RESTRICT_PPM=646501',
  '',
].join('\n'), { flag: 'wx', mode: 0o600 })
writeFileSync(worker, [original.trim(), ...common, 'VERIMOD_BACKEND_URL=http://127.0.0.1:3001',
  'VERIMOD_WORKER_JOURNAL=./private-data/auto-demo-worker.jsonl', ''].join('\n'), { flag: 'wx', mode: 0o600 })
console.log('Separate backend and worker environment files created outside the repository.')
