import { describe, expect, it, vi } from 'vitest'
import { buildSeedState } from './seed'
import { STORAGE_KEY, validateState } from './state'
import { VeriModStore, draftDecision } from './store'

function memoryStorage(raw: string | null = null): Storage {
  const map = new Map<string, string>(raw === null ? [] : [[STORAGE_KEY, raw]])
  return {
    get length() { return map.size },
    key: (i) => [...map.keys()][i] ?? null,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => { map.set(key, value) },
    removeItem: (key) => { map.delete(key) },
    clear: () => map.clear(),
  }
}

describe('persistent state recovery', () => {
  it('loads a valid snapshot and permits unavailable private content', async () => {
    const seed = await buildSeedState()
    await expect(validateState(seed)).resolves.toBeUndefined()
    const storage = memoryStorage(JSON.stringify({ ...seed, contents: undefined, appeals: undefined }))
    const store = await VeriModStore.open(storage)
    expect(store.recoveryReason).toBeNull()
    expect(store.getState().receipts).toEqual(seed.receipts)
    expect(store.getState().contents).toEqual({})
  })
  it('preserves malformed/stale JSON until explicit reset', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      for (const raw of ['', '{', 'null', '{"schema":0}', '{"schema":1,"receipts":[{}],"epochs":[]}']) {
        const storage = memoryStorage(raw)
        const store = await VeriModStore.open(storage)
        expect(store.recoveryReason).toBeTruthy()
        store.setRpcDown(true)
        expect(storage.getItem(STORAGE_KEY)).toBe(raw)
        await store.reset()
        expect(store.recoveryReason).toBeNull()
        expect(JSON.parse(storage.getItem(STORAGE_KEY)!).receipts).toHaveLength(5)
      }
      expect(warning).toHaveBeenCalled()
    } finally { warning.mockRestore() }
  })
  it('rejects malformed epochs, modified receipt hashes, bad proofs and impossible lifecycle', async () => {
    const seed = await buildSeedState()
    const mutations = [
      (s: typeof seed) => { s.epochs[0].record.anchored_block = -1 },
      (s: typeof seed) => { s.epochs[0].record.receipt_count += 1 },
      (s: typeof seed) => { s.receipts[0].body.issuer_id = 'changed' },
      (s: typeof seed) => { s.receipts[0].proof!.siblings.pop() },
      (s: typeof seed) => { s.receipts[0].epoch_id = '999' },
      (s: typeof seed) => { s.receipts = s.receipts.filter((r) => r.body.event_kind !== 'APPEAL') },
      (s: typeof seed) => { s.receipts.push(s.receipts[0]) },
    ]
    for (const mutate of mutations) {
      const copy = structuredClone(seed); mutate(copy)
      await expect(validateState(copy)).rejects.toThrow()
    }
  })
  it('keeps the live snapshot on invalid cross-tab reload', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const storage = memoryStorage(); const store = await VeriModStore.open(storage)
      const before = store.getState().receipts
      storage.setItem(STORAGE_KEY, '{bad')
      await store.reloadFromStorage()
      expect(store.getState().receipts).toEqual(before)
      expect(store.recoveryReason).toBeTruthy()
      store.setRpcDown(true)
      expect(storage.getItem(STORAGE_KEY)).toBe('{bad')
    } finally { warning.mockRestore() }
  })
})

describe('asynchronous issuance and reset', () => {
  it('rejects new issuance started during reset', async () => {
    const store = await VeriModStore.open(null)
    const draft = await draftDecision('합성 초기화 검증', store.now())
    const resetting = store.reset()
    await expect(store.issueDecision(draft)).rejects.toThrow('초기화 중')
    await resetting
    expect(store.getState().receipts).toHaveLength(5)
  })
  it('does not overwrite a new local commit with a slow storage reload', async () => {
    const storage = memoryStorage()
    const store = await VeriModStore.open(storage)
    const reloading = store.reloadFromStorage()
    store.setRpcDown(true)
    await reloading
    expect(store.getState().rpc_down).toBe(true)
  })
  it('admits only one concurrent appeal and review per decision', async () => {
    const store = await VeriModStore.open(null)
    const decision = await store.issueDecision(await draftDecision('무료 당첨! 지금 바로 클릭하세요', store.now()))
    const appeals = await Promise.allSettled([1, 2].map(() => store.issueAppeal(decision.hash, 'FALSE_POSITIVE_CLAIM', '행사 안내')))
    expect(appeals.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const reviews = await Promise.allSettled([1, 2].map(() => store.issueReview(decision.hash, 'ALLOW', ['CONTEXT_NOT_HARMFUL'])))
    expect(reviews.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    expect(store.history(decision)).toHaveLength(3)
  })
  it('snapshots the issuance draft before awaiting hashing', async () => {
    const store = await VeriModStore.open(null)
    const draft = await draftDecision('평범한 문장', store.now())
    const original = structuredClone(draft)
    const issuing = store.issueDecision(draft)
    draft.inference.scores_ppm.hate = 990_000
    draft.text = 'changed'
    const receipt = await issuing
    if (receipt.body.event_kind !== 'DECISION') throw new Error('fixture')
    expect(receipt.body.payload.inference).toEqual(original.inference)
    expect(store.getState().contents[receipt.body.content_commitment].text).toBe(original.text)
  })
  it('does not append an old batch or pending issuance after reset', async () => {
    let time = Date.parse('2026-09-13T00:00:00.000Z')
    const store = await VeriModStore.open(null, () => time)
    await store.issueDecision(await draftDecision('새 기록', time))
    time += 7000
    await Promise.all([store.tick(), store.reset()])
    expect(store.getState().epochs).toHaveLength(3)
    expect(store.getState().receipts).toHaveLength(5)
    const draft = await draftDecision('초기화 중 발급', time)
    const results = await Promise.allSettled([store.issueDecision(draft), store.reset()])
    expect(results[0].status).toBe('rejected')
    expect(store.getState().receipts).toHaveLength(5)
  })
})
