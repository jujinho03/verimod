import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { Wallet } from 'ethers'

const destination = process.env.VERIMOD_SIGNER_ENV_PATH
if (!destination) throw new Error('VERIMOD_SIGNER_ENV_PATH must be an absolute path outside the repository')
const envPath = resolve(destination)
if (!envPath.endsWith('.env')) throw new Error('Signer environment file must use a .env extension')
if (existsSync(envPath)) throw new Error('Refusing to overwrite existing signer environment file')

mkdirSync(dirname(envPath), { recursive: true })
const wallet = Wallet.createRandom()
writeFileSync(envPath, [
  '# Dedicated Base Sepolia demo signer. Keep this file outside the repository.',
  'VERIMOD_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org',
  'VERIMOD_BASE_SEPOLIA_BACKUP_RPC_URL=https://base-sepolia-rpc.publicnode.com',
  `VERIMOD_DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`,
  '',
].join('\n'), { encoding: 'utf8', mode: 0o600, flag: 'wx' })

console.log(`Dedicated Base Sepolia demo wallet created: ${wallet.address}`)
console.log(`Private key saved outside the repository: ${envPath}`)
console.log('Fund only the displayed public address with Base Sepolia test ETH.')
