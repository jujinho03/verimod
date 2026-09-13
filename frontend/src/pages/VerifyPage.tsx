import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import type { TrustConfig } from '../domain/verify'
import { MAX_JSON_BYTES } from '../domain/json'
import { REQUIRED_CONFIRMATIONS } from '../domain/verify'
import { PageHero } from '../features/PageHero'
import { TamperPanel } from '../features/TamperPanel'
import { useVerify } from '../features/useVerify'
import { VerifyReportView } from '../features/VerifyReportView'
import { SIM_CHAIN, trustConfig } from '../store/ledger'
import { useAppState, useStore } from '../store/context'
import { ArrowLink } from '../ui/bits'
import { formatDateTime, receiptTitle, shortHash } from '../ui/format'

type Source = 'mine' | 'paste' | 'file'

export function VerifyPage() {
  const store = useStore()
  const state = useAppState()
  const [params] = useSearchParams()
  const receipts = [...state.receipts].sort((a, b) => b.issued_at - a.issued_at)
  const initial = (params.get('receipt') && store.receiptById(params.get('receipt') ?? '')) || receipts[0] || null

  const [source, setSource] = useState<Source>('mine')
  const [selectedId, setSelectedId] = useState(initial?.body.receipt_id ?? '')
  const [json, setJson] = useState(() => (initial ? JSON.stringify(store.bundle(initial), null, 2) : ''))
  const [notice, setNotice] = useState<string | null>(null)
  const [trust, setTrust] = useState<TrustConfig | null>(null)
  const [tamperId, setTamperId] = useState(
    receipts.find((r) => r.body.receipt_id === 'a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63')?.body.receipt_id ?? receipts[0]?.body.receipt_id ?? '',
  )
  const verify = useVerify()

  useEffect(() => {
    void trustConfig().then(setTrust)
  }, [])

  const load = (id: string) => {
    setSelectedId(id)
    const receipt = store.receiptById(id)
    if (receipt) setJson(JSON.stringify(store.bundle(receipt), null, 2))
    setNotice(null)
    verify.clear()
  }

  const run = async () => {
    setNotice(null)
    await verify.run(json)
  }

  const selected = store.receiptById(selectedId)
  const tamperTarget = store.receiptById(tamperId)

  return (
    <>
      <PageHero label="Verify · 독립 검증기" title="받은 영수증을 직접 다시 계산합니다">
        <p>서버의 성공 문구 대신 이 브라우저가 해시, 포함 증명, 원장의 root를 계산해 대조합니다. 기록 무결성 확인이며 판정의 정확성을 증명하지 않습니다.</p>
        <ArrowLink to="/protocol#codes">결과 코드 설명</ArrowLink>
      </PageHero>

      <section className="band" data-tone="white">
        <div className="frame work">
          <div className="work__main">
            <div className="segmented" role="tablist" aria-label="영수증 가져오기">
              {(
                [
                  ['mine', '내 영수증에서 고르기'],
                  ['paste', 'JSON 붙여넣기'],
                  ['file', '파일 올리기'],
                ] as const
              ).map(([id, label]) => (
                <button key={id} type="button" role="tab" aria-selected={source === id} onClick={() => { setSource(id); verify.clear() }}>
                  {label}
                </button>
              ))}
            </div>

            {source === 'mine' && (
              <div className="field">
                <label className="field__label" htmlFor="verify-select">
                  영수증
                </label>
                <select id="verify-select" className="select" value={selectedId} onChange={(event) => load(event.target.value)}>
                  {receipts.map((r) => (
                    <option key={r.hash} value={r.body.receipt_id}>
                      {receiptTitle(r)} · {r.body.receipt_id.slice(0, 8)} · {formatDateTime(r.issued_at)}
                    </option>
                  ))}
                </select>
                {selected && (
                  <button type="button" className="arrow-link" onClick={() => load(selected.body.receipt_id)}>
                    최신 봉인 상태로 다시 불러오기
                  </button>
                )}
              </div>
            )}

            {source === 'file' && (
              <div className="field">
                <label className="field__label" htmlFor="verify-file">
                  영수증 JSON 파일
                </label>
                <input
                  id="verify-file"
                  className="input"
                  type="file"
                  accept="application/json,.json"
                  onChange={async (event) => {
                    const file = event.target.files?.[0]
                    if (!file) return
                    verify.clear()
                    try {
                      if (file.size > MAX_JSON_BYTES) throw new Error('파일은 1 MiB 이하여야 합니다')
                      setJson(await file.text())
                      setNotice(`${file.name}을 불러왔습니다. 아래 내용을 확인하고 검증하세요.`)
                    } catch {
                      setJson('')
                      setNotice('파일을 읽을 수 없습니다. 1 MiB 이하의 JSON을 사용하세요.')
                    }
                  }}
                />
              </div>
            )}

            <div className="field">
              <label className="field__label" htmlFor="verify-json">
                검증할 영수증 JSON
                <span className="field__hint">값을 직접 고쳐 보면 변조 결과를 볼 수 있습니다</span>
              </label>
              <textarea
                id="verify-json"
                className="textarea textarea--code"
                rows={16}
                spellCheck={false}
                value={json}
                onChange={(event) => { setJson(event.target.value); verify.clear() }}
                placeholder='{"receipt_body": {…}, "receipt_hash": "0x…", "proof": {…}, "anchor": {…}}'
              />
            </div>
            {notice && <p className="inline-warn">{notice}</p>}
            <div className="btn-row">
              <button type="button" className="btn btn--blue" onClick={() => void run()} disabled={verify.running || json.trim() === ''}>
                {verify.running ? '검증 중' : '검증하기'}
              </button>
            </div>

            <div className="trust-card" id="rpc">
              <h2 className="title-s">신뢰 설정</h2>
              <p className="muted small">영수증에 적힌 앵커 위치는 믿지 않고, 검증기가 미리 정한 아래 값과만 비교합니다.</p>
              <dl className="kv">
                <dt>체인</dt>
                <dd>
                  {SIM_CHAIN.chain_id} <span className="faint">{SIM_CHAIN.name} · 실제 네트워크 아님</span>
                </dd>
                <dt>컨트랙트</dt>
                <dd>
                  <code className="hash">{SIM_CHAIN.contract_address}</code>
                </dd>
                <dt>등록 주체</dt>
                <dd>
                  <code className="hash">{SIM_CHAIN.publisher}</code>
                </dd>
                <dt>발급자</dt>
                <dd>
                  {trust?.issuer_id ?? '계산 중'} <code className="hash faint">{trust ? shortHash(trust.issuer_commitment) : ''}</code>
                </dd>
                <dt>확정 기준</dt>
                <dd>블록 확인 {REQUIRED_CONFIRMATIONS}회 · protocol 1</dd>
              </dl>
              <label className="check-line">
                <input type="checkbox" checked={state.rpc_down} onChange={(event) => store.setRpcDown(event.target.checked)} />
                <span>RPC 장애 가정 · 원장 조회가 실패하면 변조가 아니라 RPC_UNAVAILABLE로 나옵니다</span>
              </label>
            </div>
          </div>

          <aside className="work__side" aria-live="polite">
            {verify.report ? (
              <VerifyReportView report={verify.report} />
            ) : (
              <div className="empty">
                <p className="mono faint">검증 순서</p>
                <h2 className="title-s">영수증을 고르고 검증하기를 누르세요</h2>
                <ol className="empty__steps">
                  <li>형식과 protocol version 확인</li>
                  <li>본문으로 영수증 해시 재계산</li>
                  <li>신뢰 설정의 체인·컨트랙트인지 확인</li>
                  <li>원장에서 epoch root 조회</li>
                  <li>포함 증명으로 root까지 경로 계산</li>
                  <li>블록 확인 {REQUIRED_CONFIRMATIONS}회 이상인지 확인</li>
                </ol>
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="band" data-tone="mist" id="tamper">
        <div className="frame tamper-section">
          <div className="tamper-section__intro">
            <p className="mono faint">변조 테스트</p>
            <h2 className="title-m">정상 검증 뒤 기록을 바꾸면 무엇이 달라지나요</h2>
            <p className="muted">
              보관한 원본 영수증의 사본에서 값 하나를 바꾸고 원래 앵커 기준으로 다시 검증합니다. 변조한 기록을 새로 봉인하면 새 앵커가 생길 뿐, 이용자가 가진 원래 앵커를 덮어쓰지는 못합니다.
            </p>
            <div className="field">
              <label className="field__label" htmlFor="tamper-select">
                원본 영수증
              </label>
              <select id="tamper-select" className="select" value={tamperId} onChange={(event) => setTamperId(event.target.value)}>
                {receipts.map((r) => (
                  <option key={r.hash} value={r.body.receipt_id}>
                    {receiptTitle(r)} · {r.body.receipt_id.slice(0, 8)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="tamper-section__panel">{tamperTarget && <TamperPanel key={tamperTarget.hash} receipt={tamperTarget} />}</div>
        </div>
      </section>
    </>
  )
}
