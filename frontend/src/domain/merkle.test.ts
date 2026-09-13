import { describe, expect, it } from 'vitest'
import { bytesEqual, concatBytes, sha256, utf8, type Bytes } from './hash'
import { inclusionProof, merkleRoot, verifyInclusion } from './merkle'

const entries = (n: number) => Promise.all(Array.from({ length: n }, (_, i) => sha256(utf8(`entry-${i}`))))
const leaf = (x: Bytes) => sha256(concatBytes(new Uint8Array([0]), x))
const node = (l: Bytes, r: Bytes) => sha256(concatBytes(new Uint8Array([1]), l, r))

describe('RFC 9162 Merkle tree', () => {
  it('n=3 root가 정의 MTH = node(node(l0, l1), l2)와 같다', async () => {
    const [a, b, c] = await entries(3)
    const expected = await node(await node(await leaf(a), await leaf(b)), await leaf(c))
    expect(bytesEqual(await merkleRoot([a, b, c]), expected)).toBe(true)
  })

  it('n=5 root가 정의 MTH = node(MTH(0..4), l4)와 같다', async () => {
    const e = await entries(5)
    const l = await Promise.all(e.map(leaf))
    const expected = await node(await node(await node(l[0], l[1]), await node(l[2], l[3])), l[4])
    expect(bytesEqual(await merkleRoot(e), expected)).toBe(true)
  })

  it('단일 leaf는 root가 leaf hash이고 proof는 빈 배열이다', async () => {
    const [a] = await entries(1)
    expect(bytesEqual(await merkleRoot([a]), await leaf(a))).toBe(true)
    expect(await inclusionProof([a], 0)).toEqual([])
  })

  it('빈 epoch는 root를 만들지 않는다', async () => {
    await expect(merkleRoot([])).rejects.toThrow()
  })

  it.each([1, 2, 3, 4, 5, 7, 8, 9])('n=%i의 모든 index에서 포함 증명이 통과한다', async (n) => {
    const e = await entries(n)
    const root = await merkleRoot(e)
    for (let i = 0; i < n; i++) {
      const proof = await inclusionProof(e, i)
      expect(await verifyInclusion(e[i], i, n, proof, root)).toBe(true)
      if (proof.length) {
        const changed = proof.map((p) => p.slice())
        changed[0][0] ^= 1
        expect(await verifyInclusion(e[i], i, n, changed, root)).toBe(false)
      }
    }
  })

  describe('잘못된 증명은 실패한다 (n=5, index 2)', () => {
    const setup = async () => {
      const e = await entries(5)
      return { e, root: await merkleRoot(e), proof: await inclusionProof(e, 2) }
    }

    it('바뀐 entry', async () => {
      const { root, proof } = await setup()
      expect(await verifyInclusion(await sha256(utf8('tampered')), 2, 5, proof, root)).toBe(false)
    })

    it('다른 root', async () => {
      const { e, proof } = await setup()
      expect(await verifyInclusion(e[2], 2, 5, proof, await sha256(utf8('other root')))).toBe(false)
    })

    it('경로 모양이 다른 tree size와 틀린 index', async () => {
      const { e, root, proof } = await setup()
      expect(await verifyInclusion(e[2], 2, 4, proof, root)).toBe(false)
      expect(await verifyInclusion(e[2], 2, 3, proof, root)).toBe(false)
      expect(await verifyInclusion(e[2], 3, 5, proof, root)).toBe(false)
      expect(await verifyInclusion(e[2], 5, 5, proof, root)).toBe(false)
    })

    it('경로 모양이 같은 tree size(6)는 root만으로 구분되지 않으므로 원장의 count와 따로 대조해야 한다', async () => {
      const { e, root, proof } = await setup()
      expect(await verifyInclusion(e[2], 2, 6, proof, root)).toBe(true)
    })

    it('누락되거나 남는 sibling', async () => {
      const { e, root, proof } = await setup()
      expect(await verifyInclusion(e[2], 2, 5, proof.slice(0, -1), root)).toBe(false)
      expect(await verifyInclusion(e[2], 2, 5, [...proof, proof[0]], root)).toBe(false)
    })
  })
})
