import { bytesToHex, hexToBytes, type Hex32 } from './hash.js'
import { MERKLE_SPEC, inclusionProof, merkleRoot } from './merkle.js'
import type { InclusionProof } from './types.js'

export interface EpochMember {
  receipt_id: string
  receipt_hash: Hex32
  /** 이 epoch를 동결하는 발급자의 순번. 외부 filler에는 넣지 않는다. */
  issuer_seq?: number
}

export interface FrozenEpoch {
  members: EpochMember[]
  root: Hex32
  proofs: Record<Hex32, InclusionProof>
  issuer_seq_min: number | null
  issuer_seq_max: number | null
}

/** receipt_id ASCII 오름차순으로 동결하고 root와 각 receipt의 포함 증명을 만든다 (docs/01 §5). */
export async function freezeEpoch(members: readonly EpochMember[]): Promise<FrozenEpoch> {
  if (members.length === 0) throw new Error('빈 epoch는 커밋하지 않습니다')
  const ids = new Set(members.map((m) => m.receipt_id))
  const hashes = new Set(members.map((m) => m.receipt_hash))
  if (ids.size !== members.length || hashes.size !== members.length) {
    throw new Error('epoch에 중복된 receipt_id 또는 receipt_hash가 있습니다')
  }
  const issuerSeqs = members.flatMap((member) => member.issuer_seq === undefined ? [] : [member.issuer_seq])
  if (issuerSeqs.some((seq) => !Number.isSafeInteger(seq) || seq < 1)) {
    throw new Error('issuer_seq는 1 이상의 안전한 정수여야 합니다')
  }
  const distinctSeqs = [...new Set(issuerSeqs)].sort((a, b) => a - b)
  if (distinctSeqs.length !== issuerSeqs.length) throw new Error('epoch에 중복된 issuer_seq가 있습니다')
  if (distinctSeqs.some((seq, index) => index > 0 && seq !== distinctSeqs[index - 1] + 1)) {
    throw new Error('epoch의 issuer_seq에 구멍이 있습니다')
  }

  // Await 중 호출자가 입력 객체를 바꿔도 root와 members/proofs는 같은 snapshot을 쓴다.
  const ordered = members.map((m) => ({ ...m })).sort((a, b) => (a.receipt_id < b.receipt_id ? -1 : 1))
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
  return {
    members: ordered,
    root,
    proofs,
    issuer_seq_min: distinctSeqs[0] ?? null,
    issuer_seq_max: distinctSeqs.at(-1) ?? null,
  }
}
