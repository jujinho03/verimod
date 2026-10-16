import { spawn } from 'node:child_process'

export type FrozenEpoch = {
  epochId: string
  root: string
  count: string
  protocolVersion: string
  chainId: string
  contractAddress: string
}

export type DurableSubmissionAck = FrozenEpoch & {
  status: 'SUBMITTING'
  txHash: string
  nonce: string
}

export function assertDurableSubmissionAck(expected: FrozenEpoch & { txHash: string; nonce: string }, actual: unknown): asserts actual is DurableSubmissionAck {
  if (!actual || typeof actual !== 'object') throw new Error('F durability callback returned no acknowledgement')
  const ack = actual as Record<string, unknown>
  const fields: Array<[keyof FrozenEpoch, string]> = [
    ['epochId', 'epoch_id'], ['root', 'merkle_root'], ['count', 'receipt_count'],
    ['protocolVersion', 'protocol_version'], ['chainId', 'chain_id'], ['contractAddress', 'contract_address'],
  ]
  for (const [expectedKey, actualKey] of fields) {
    if (String(ack[actualKey]).toLowerCase() !== expected[expectedKey].toLowerCase()) {
      throw new Error(`F durability acknowledgement mismatch: ${actualKey}`)
    }
  }
  if (ack.status !== 'SUBMITTING') throw new Error('F durability acknowledgement is not SUBMITTING')
  if (String(ack.tx_hash).toLowerCase() !== expected.txHash.toLowerCase()) throw new Error('F durability acknowledgement mismatch: tx_hash')
  if (String(ack.nonce) !== expected.nonce) throw new Error('F durability acknowledgement mismatch: nonce')
}

export async function requestDurableSubmissionAck(
  request: FrozenEpoch & { rawTransaction: string; txHash: string; nonce: string },
  executable: string,
  args: readonly string[],
  timeoutMs = 15_000,
): Promise<DurableSubmissionAck> {
  let output: string
  try {
    output = await new Promise<string>((resolve, reject) => {
      const child = spawn(executable, [...args], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
      let stdout = ''
      const timer = setTimeout(() => { child.kill(); reject(new Error('timeout')) }, timeoutMs)
      child.once('error', reject)
      child.stdout.setEncoding('utf8')
      child.stdout.on('data', (chunk: string) => {
        stdout += chunk
        if (stdout.length > 16 * 1024) { child.kill(); reject(new Error('oversized acknowledgement')) }
      })
      child.once('close', (code) => {
        clearTimeout(timer)
        if (code === 0) resolve(stdout)
        else reject(new Error('callback process failed'))
      })
      child.stdin.end(JSON.stringify(request))
    })
  } catch {
    throw new Error('F durability callback failed before broadcast')
  }
  let ack: unknown
  try { ack = JSON.parse(output) } catch { throw new Error('F durability callback returned invalid acknowledgement') }
  assertDurableSubmissionAck(request, ack)
  return {
    epochId: String((ack as Record<string, unknown>).epoch_id), root: String((ack as Record<string, unknown>).merkle_root),
    count: String((ack as Record<string, unknown>).receipt_count), protocolVersion: String((ack as Record<string, unknown>).protocol_version),
    chainId: String((ack as Record<string, unknown>).chain_id), contractAddress: String((ack as Record<string, unknown>).contract_address),
    status: 'SUBMITTING', txHash: String((ack as Record<string, unknown>).tx_hash), nonce: String((ack as Record<string, unknown>).nonce),
  }
}

export async function broadcastAfterDurableAck<T>(
  acknowledge: () => Promise<unknown>,
  expected: FrozenEpoch & { txHash: string; nonce: string },
  broadcast: () => Promise<T>,
): Promise<T> {
  const ack = await acknowledge()
  assertDurableSubmissionAck(expected, ack)
  return broadcast()
}
