import { bytesToHex, hexToBytes, type Hex32 } from './hash'
import { MERKLE_SPEC, inclusionProof, merkleRoot } from './merkle'
import type { InclusionProof } from './types'

export interface EpochMember {
  receipt_id: string
  receipt_hash: Hex32
}

export interface FrozenEpoch {
  members: EpochMember[]
  root: Hex32
  proofs: Record<Hex32, InclusionProof>
}

/** receipt_id ASCII 오름차순으로 동결하고 root와 각 receipt의 포함 증명을 만든다 (docs/01 §5). */
export async function freezeEpoch(members: readonly EpochMember[]): Promise<FrozenEpoch> {
  if (members.length === 0) throw new Error('빈 epoch는 커밋하지 않습니다')
  const ids = new Set(members.map((m) => m.receipt_id))
  const hashes = new Set(members.map((m) => m.receipt_hash))
  if (ids.size !== members.length || hashes.size !== members.length) {
    throw new Error('epoch에 중복된 receipt_id 또는 receipt_hash가 있습니다')
  }

  const ordered = [...members].sort((a, b) => (a.receipt_id < b.receipt_id ? -1 : 1))
  const entries = ordered.map((m) => hexToBytes(m.receipt_hash))
  const root = bytesToHex(await merkleRoot(entries))

  const proofs: Record<Hex32, InclusionProof> = {}
  for (let i = 0; i < ordered.length; i++) {
    proofs[ordered[i].receipt_hash] = {
      merkle_spec: MERKLE_SPEC,
      leaf_index: i,
      tree_size: ordered.length,
      siblings: (await inclusionProof(entries, i)).map(bytesToHex),
    }
  }
  return { members: ordered, root, proofs }
}
