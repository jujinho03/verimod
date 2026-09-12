import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { APPEAL_REASONS } from '../domain/manifests'
import { useAppState, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import { ArrowLink } from '../ui/bits'

export function AppealForm({ decision }: { decision: StoredReceipt }) {
  const store = useStore()
  useAppState()
  const navigate = useNavigate()
  const name = useId()
  const [reason, setReason] = useState('CONTEXT_MISSING')
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const eligibility = store.canAppeal(decision)
  const existing = store.appealOf(decision.hash)

  if (!eligibility.ok) {
    return (
      <div className="notice-box">
        <p>{eligibility.reason}</p>
        {existing && <ArrowLink to={`/receipts/${existing.body.receipt_id}`}>접수된 이의제기 보기</ArrowLink>}
      </div>
    )
  }

  const submit = async () => {
    setError(null)
    setBusy(true)
    try {
      const appeal = await store.issueAppeal(decision.hash, reason, text)
      navigate(`/receipts/${appeal.body.receipt_id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
      setBusy(false)
    }
  }

  return (
    <form
      className="appeal-form"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <p className="muted">원래 판정은 지우지 않습니다. 이의제기는 이 판정에 연결된 새 영수증으로 남습니다.</p>
      <fieldset className="choices">
        <legend className="field__label">사유</legend>
        {Object.entries(APPEAL_REASONS).map(([code, label]) => (
          <label className="choice" key={code}>
            <input type="radio" name={name} checked={reason === code} onChange={() => setReason(code)} />
            <span>
              <strong>{label}</strong>
              <span className="choice__hint mono">{code}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label className="field__label" htmlFor={`${name}-text`}>
          내용 <span className="field__hint">{text.length} / 1000</span>
        </label>
        <textarea
          id={`${name}-text`}
          className="textarea"
          rows={4}
          maxLength={1000}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="어떤 맥락이 빠졌는지 적어 주세요"
        />
        <p className="field__hint">본문은 이 브라우저에만 저장하고, 영수증에는 salt를 더한 commitment만 넣습니다.</p>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn btn--blue" disabled={busy || text.trim().length === 0}>
        {busy ? '접수 중' : '이의제기 접수'}
      </button>
    </form>
  )
}
