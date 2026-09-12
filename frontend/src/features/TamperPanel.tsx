import { useId, useMemo, useState } from 'react'
import type { Hex32 } from '../domain/hash'
import { receiptHash } from '../domain/receipt'
import { useNow, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import { tamperOptions, type TamperChange } from './tamper'
import { useVerify } from './useVerify'
import { VerifyReportView } from './VerifyReportView'

export function TamperPanel({ receipt }: { receipt: StoredReceipt }) {
  const store = useStore()
  const now = useNow(1000)
  const name = useId()
  const options = useMemo(() => tamperOptions(receipt.body), [receipt.body])
  const [choice, setChoice] = useState(options[0].id)
  const [rehash, setRehash] = useState(false)
  const [change, setChange] = useState<{ change: TamperChange; copyHash: Hex32 } | null>(null)
  const verify = useVerify()
  const anchored = store.status(receipt, now).stage === 'ANCHORED'

  const runCopy = async () => {
    const option = options.find((o) => o.id === choice) ?? options[0]
    const copy = structuredClone(store.bundle(receipt))
    const applied = option.apply(copy.receipt_body)
    const copyHash = await receiptHash(copy.receipt_body)
    if (rehash) copy.receipt_hash = copyHash
    setChange({ change: applied, copyHash })
    await verify.run(copy)
  }

  const runOriginal = async () => {
    setChange(null)
    await verify.run(store.bundle(receipt))
  }

  return (
    <div className="tamper">
      <p className="muted">원본 영수증은 그대로 두고, 사본의 값 하나를 바꾼 뒤 원래 앵커 기준으로 다시 검증합니다.</p>
      <fieldset className="choices">
        <legend className="sr-only">바꿀 값</legend>
        {options.map((option) => (
          <label className="choice" key={option.id}>
            <input type="radio" name={name} checked={choice === option.id} onChange={() => setChoice(option.id)} />
            <span>
              <strong>{option.label}</strong>
              <span className="choice__hint">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <label className="check-line">
        <input type="checkbox" checked={rehash} onChange={(event) => setRehash(event.target.checked)} />
        <span>바뀐 본문으로 해시도 새로 계산해 적기 (위장 시도)</span>
      </label>
      <div className="btn-row">
        <button type="button" className="btn btn--ink" onClick={() => void runCopy()} disabled={verify.running}>
          사본 만들어 검증
        </button>
        <button type="button" className="btn btn--outline" onClick={() => void runOriginal()} disabled={verify.running}>
          원본 검증
        </button>
      </div>
      {!anchored && (
        <p className="inline-warn">이 영수증은 아직 앵커 확인 전이라 원본도 PENDING_ANCHOR로 나옵니다. 사본의 변조는 해시 단계에서 먼저 드러납니다.</p>
      )}
      {verify.report && (
        <div className="tamper__result">
          {change ? (
            <>
              <p className="mono faint">사본에서 바꾼 값</p>
              <div className="diff">
                <span className="mono">{change.change.path}</span>
                <del>{change.change.before}</del>
                <ins>{change.change.after}</ins>
              </div>
              <dl className="kv">
                <dt>원래 해시</dt>
                <dd>
                  <code className="hash">{receipt.hash}</code>
                </dd>
                <dt>사본의 해시</dt>
                <dd>
                  <code className="hash is-bad">{change.copyHash}</code>
                </dd>
              </dl>
            </>
          ) : (
            <p className="mono faint">원본 영수증 검증 결과</p>
          )}
          <VerifyReportView report={verify.report} />
        </div>
      )}
    </div>
  )
}
