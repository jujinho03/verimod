import { bytesEqual, concatBytes, sha256, type Bytes } from './hash'

export const MERKLE_SPEC = 'ct-sha256-receipt-v1'

const LEAF_PREFIX = new Uint8Array([0x00])
const NODE_PREFIX = new Uint8Array([0x01])

export function leafHash(entry: Bytes): Promise<Bytes> {
  return sha256(concatBytes(LEAF_PREFIX, entry))
}

function nodeHash(left: Bytes, right: Bytes): Promise<Bytes> {
  return sha256(concatBytes(NODE_PREFIX, left, right))
}

/** n보다 작은 가장 큰 2의 거듭제곱 (RFC 9162 §2.1.1). */
function splitPoint(size: number): number {
  let k = 1
  while (k * 2 < size) k *= 2
  return k
}

export async function merkleRoot(entries: readonly Bytes[]): Promise<Bytes> {
  if (entries.length === 0) throw new Error('빈 epoch는 커밋하지 않습니다')
  if (entries.length === 1) return leafHash(entries[0])
  const k = splitPoint(entries.length)
  return nodeHash(await merkleRoot(entries.slice(0, k)), await merkleRoot(entries.slice(k)))
}

/** leaf에서 root 방향 순서의 sibling 목록 (RFC 9162 §2.1.3.1). */
export async function inclusionProof(entries: readonly Bytes[], index: number): Promise<Bytes[]> {
  if (!Number.isSafeInteger(index) || index < 0 || index >= entries.length) {
    throw new RangeError(`leaf index ${index}가 트리 크기 ${entries.length}를 벗어났습니다`)
  }
  if (entries.length === 1) return []
  const k = splitPoint(entries.length)
  if (index < k) {
    return [...(await inclusionProof(entries.slice(0, k), index)), await merkleRoot(entries.slice(k))]
  }
  return [...(await inclusionProof(entries.slice(k), index - k)), await merkleRoot(entries.slice(0, k))]
}

/** RFC 9162 §2.1.3.2 검증 절차. 경로 길이·index 범위가 맞지 않으면 실패한다. */
export async function verifyInclusion(
  entry: Bytes,
  index: number,
  treeSize: number,
  siblings: readonly Bytes[],
  root: Bytes,
): Promise<boolean> {
  if (!Number.isSafeInteger(index) || !Number.isSafeInteger(treeSize)) return false
  if (index < 0 || treeSize < 1 || index >= treeSize) return false
  if (root.length !== 32 || siblings.some((sibling) => sibling.length !== 32)) return false

  let fn = index
  let sn = treeSize - 1
  let r = await leafHash(entry)

  for (const sibling of siblings) {
    if (sn === 0) return false
    if (fn % 2 === 1 || fn === sn) {
      r = await nodeHash(sibling, r)
      if (fn % 2 === 0) {
        while (fn % 2 === 0 && fn !== 0) {
          fn = Math.floor(fn / 2)
          sn = Math.floor(sn / 2)
        }
      }
    } else {
      r = await nodeHash(r, sibling)
    }
    fn = Math.floor(fn / 2)
    sn = Math.floor(sn / 2)
  }

  return sn === 0 && bytesEqual(r, root)
}
