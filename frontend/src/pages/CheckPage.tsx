import { useState } from 'react'
import { useNavigate } from 'react-router'
import { VeriModApiClient } from '../api/client'
import { ApiClientError, type DecisionCreated } from '../api/types'
import { MAX_INPUT_CODE_POINTS } from '../domain/manifests'
import { InferenceError, codePointLength } from '../domain/scorer'
import { DecisionResult } from '../features/DecisionResult'
import { ScoreBars } from '../features/ScoreBars'
import { PageHero } from '../features/PageHero'
import { useStore } from '../store/context'
import { draftDecision, type DecisionDraft } from '../store/store'
import { ActionBadge, ArrowLink } from '../ui/bits'
import { downloadJson, shortHash } from '../ui/format'
import { createPrivatePackage } from '../domain/privatePackage'
import { browserStorage, clearLegacyPrivacy, inspectLegacyPrivacy, legacyPrivacyPresent, readLegacyPrivacyBackup } from '../store/state'

const HARD_LIMIT = 5000
const LIVE_API_URL = String(import.meta.env.VITE_VERIMOD_API_URL ?? '').trim()
const LIVE_ENABLED = String(import.meta.env.VITE_VERIMOD_LIVE_ENABLED ?? '') === 'true'
const liveClient = LIVE_ENABLED ? new VeriModApiClient({ baseUrl: LIVE_API_URL }) : null

interface StoredLiveDecision { created: DecisionCreated; original_text: string; saved_at: string }

// Never read/write the legacy private cache automatically; its owner may explicitly remove it.

const SAMPLES = [
  { label: '승인 예시', text: '오늘 동네 도서관에서 열린 그림책 읽기 모임에 다녀왔어요. 아이들이 정말 즐거워했습니다.' },
  { label: '검토 보류 예시', text: '배송이 일주일째 안 와서 너무 짜증나요. 고객센터 연결도 안 됩니다.' },
  { label: '제한 예시', text: '무료 당첨 이벤트! 지금 바로 클릭하고 할인코드를 받으세요 http://example.com' },
  { label: '긴 글 예시', text: '시험용으로 만든 아주 긴 게시글입니다. 문장이 계속 이어집니다. '.repeat(16) },
]

export function CheckPage() {
  const store = useStore()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [draft, setDraft] = useState<DecisionDraft | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'score' | 'issue' | null>(null)
  const [mode, setMode] = useState<'LIVE' | 'SYNTHETIC'>(() => liveClient ? 'LIVE' : 'SYNTHETIC')
  const [live, setLive] = useState<StoredLiveDecision | null>(null)
  const [legacyPrivacy, setLegacyPrivacy] = useState(() => inspectLegacyPrivacy(browserStorage()))
  const [legacyNotice, setLegacyNotice] = useState<string | null>(null)

  const length = codePointLength(text)
  const stale = draft !== null && draft.text !== text

  const reset = (next: string) => {
    setText(next)
    setDraft(null)
    setLive(null)
    setError(null)
  }

  const backupLegacyPrivacy = () => {
    try {
      const backup = readLegacyPrivacyBackup(browserStorage())
      if (!backup) { setLegacyNotice('백업할 레거시 비공개 자료를 찾지 못했습니다.'); return }
      downloadJson('verimod-legacy-private-backup.json', backup)
      setLegacyNotice('기존 비공개 자료를 소유자 파일로 저장했습니다. 파일을 확인한 뒤 정리할 수 있습니다.')
    } catch { setLegacyNotice('기존 비공개 자료를 백업하지 못했습니다. 브라우저 저장소 설정을 확인하세요.') }
  }

  const clearLegacyPrivateData = () => {
    try {
      const cleaned = clearLegacyPrivacy(browserStorage())
      setLegacyPrivacy(inspectLegacyPrivacy(browserStorage()))
      if (cleaned.live_cache_removed || cleaned.state_snapshot_sanitized || cleaned.malformed_state_removed) {
        setLegacyNotice('명시적으로 선택한 레거시 비공개 자료를 정리했습니다. 공개 영수증·epoch 상태는 정제 가능한 경우 유지했습니다.')
      } else setLegacyNotice('정리할 레거시 비공개 자료를 찾지 못했습니다.')
    } catch { setLegacyNotice('기존 비공개 자료를 정리하지 못했습니다. 브라우저 저장소 설정을 확인하세요.') }
  }

  const score = async () => {
    setError(null)
    setBusy('score')
    try {
      setDraft(await draftDecision(text, store.now()))
    } catch (caught) {
      setDraft(null)
      setError(caught instanceof InferenceError ? caught.message : '점수를 계산하지 못했습니다. 다시 시도하세요.')
    } finally {
      setBusy(null)
    }
  }

  const issue = async () => {
    if (!draft || stale) return
    setBusy('issue')
    try {
      const receipt = await store.issueDecision(draft)
      navigate(`/receipts/${receipt.body.receipt_id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '영수증을 발급하지 못했습니다.')
      setBusy(null)
    }
  }

  const issueLive = async () => {
    if (!liveClient || text.trim().length === 0) return
    setError(null)
    setLive(null)
    setBusy('issue')
    try {
      const response = await liveClient.postDecision({ text }, crypto.randomUUID())
      const saved = { created: response.data, original_text: text, saved_at: new Date().toISOString() }
      setLive(saved)
    } catch (caught) {
      setError(caught instanceof ApiClientError && caught.code === 'INFERENCE_UNAVAILABLE'
        ? '실제 AI 추론을 사용할 수 없어 판정서를 발급하지 않았습니다. 잠시 후 다시 시도하세요.'
        : caught instanceof Error ? caught.message : '실제 판정서를 발급하지 못했습니다.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHero label="Decide · 판정 요청" title="글을 넣으면 항목별 점수와 조치를 보여드립니다">
        <p>{mode === 'LIVE' ? '실제 AI 서비스 응답을 서버 정책과 판정서 발급으로 연결합니다. 점수는 UNCALIBRATED이며 새 판정은 기존 W4 앵커와 별개입니다.' : '시험 버전의 점수는 키워드 기반 합성 점수기가 만듭니다. 실제 AI 모델의 판단이나 성능이 아닙니다.'}</p>
        <ArrowLink to="/protocol#policy">적용 정책과 기준값 보기</ArrowLink>
      </PageHero>

      <section className="band" data-tone="white">
        <div className="frame work">
          <form
            className="work__main"
            onSubmit={(event) => {
              event.preventDefault()
              void (mode === 'LIVE' ? issueLive() : score())
            }}
          >
            <h2 className="title-s">판정할 글</h2>
            <div className="field">
              <label className="field__label" htmlFor="decision-mode">실행 경로</label>
              <select id="decision-mode" className="select" value={mode} disabled={busy !== null} onChange={(event) => {
                setMode(event.target.value as 'LIVE' | 'SYNTHETIC')
                setError(null)
                setDraft(null)
                setLive(null)
              }}>
                {liveClient && <option value="LIVE">LIVE · 실제 AI → 서버 판정서</option>}
                <option value="SYNTHETIC">SYNTHETIC · 브라우저 합성 데모</option>
              </select>
              {!liveClient && <p className="inline-warn">실제 AI 경로가 비활성화되어 있습니다. LIVE 설정과 백엔드 준비가 필요합니다.</p>}
            </div>
            <div className="chips" role="group" aria-label="예시 문장">
              {SAMPLES.map((sample) => (
                <button key={sample.label} type="button" className="chip" disabled={busy !== null} onClick={() => reset(sample.text)}>
                  {sample.label}
                </button>
              ))}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="check-text">
                내용
                <span className={`field__hint${length > MAX_INPUT_CODE_POINTS ? ' is-warn' : ''}`}>
                  {length.toLocaleString('ko-KR')} / {MAX_INPUT_CODE_POINTS}자
                </span>
              </label>
              <textarea
                id="check-text"
                className="textarea"
                rows={10}
                maxLength={HARD_LIMIT}
                disabled={busy !== null}
                value={text}
                onChange={(event) => { setText(event.target.value); setLive(null); setError(null) }}
                placeholder="판정받고 싶은 게시글이나 댓글을 붙여 넣으세요"
              />
              {length > MAX_INPUT_CODE_POINTS && (
                <p className="field__hint is-warn">{MAX_INPUT_CODE_POINTS}자를 넘는 부분은 점수에 쓰지 않고, 정책에 따라 검토 보류로 보냅니다.</p>
              )}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="btn-row">
              <button type="submit" className="btn btn--blue" disabled={busy !== null || text.trim().length === 0}>
                {busy ? (mode === 'LIVE' ? '발급 중' : '계산 중') : mode === 'LIVE' ? '실제 판정서 발급' : '판정 요청'}
              </button>
              {text && (
                <button type="button" className="btn btn--outline" disabled={busy !== null} onClick={() => reset('')}>
                  지우기
                </button>
              )}
            </div>
            <p className="muted small">원문과 salt는 공개 bundle에 넣지 않습니다. 실제 발급에서는 브라우저가 Private Receipt Package를 별도로 보관합니다.</p>
            <p className="muted small">새로 입력한 LIVE·합성 자료는 이번 방문의 메모리에만 보관합니다. 필요한 Package는 직접 다운로드하세요.</p>
            {legacyPrivacyPresent(legacyPrivacy) && <div className="inline-warn" role="status">
              <p>이 브라우저에서 이전 W4 비공개 저장자료가 감지되었습니다. 원문이나 salt는 화면에 표시하지 않습니다. 먼저 본인 파일로 백업한 뒤, 동의한 경우에만 정리하세요.</p>
              <div className="btn-row">
                <button type="button" className="btn btn--outline btn--compact" onClick={backupLegacyPrivacy}>기존 비공개 자료 백업</button>
                <button type="button" className="btn btn--outline btn--compact" onClick={clearLegacyPrivateData}>동의하고 레거시 비공개 자료 정리</button>
              </div>
            </div>}
            {!legacyPrivacy.storage_available && <p className="inline-warn">브라우저 저장소에 접근할 수 없어 기존 자료 존재 여부를 확인하지 못했습니다.</p>}
            {legacyNotice && <p className="muted small" role="status">{legacyNotice}</p>}
          </form>

          <aside className="work__side" aria-live="polite">
            {mode === 'LIVE' && live ? (
              <div className="result">
                <div className="result__head"><ActionBadge action={live.created.bundle.receipt_body.event_kind === 'DECISION' ? live.created.bundle.receipt_body.payload.policy.action : 'HUMAN_REVIEW'} large /></div>
                {live.created.bundle.receipt_body.event_kind === 'DECISION' && <>
                  <p className="summary-line">실제 모델 score를 서버 정책이 평가해 판정서를 발급했습니다. 새 판정서는 공개 체인 anchor 전까지 PENDING입니다.</p>
                  <ScoreBars scores={live.created.bundle.receipt_body.payload.inference.scores_ppm} />
                  <dl className="kv">
                    <dt>상태</dt><dd>PENDING_ANCHOR · 아직 공개 Base 검증 결과가 아닙니다</dd>
                    <dt>판정서</dt><dd><code className="hash">{live.created.bundle.receipt_body.receipt_id}</code></dd>
                    <dt>모델 manifest</dt><dd><code className="hash">{shortHash(live.created.bundle.receipt_body.payload.inference.model_manifest_hash)}</code></dd>
                    <dt>정책 manifest</dt><dd><code className="hash">{shortHash(live.created.bundle.receipt_body.payload.policy.policy_manifest_hash)}</code></dd>
                  </dl>
                </>}
                <div className="btn-row">
                  <button type="button" className="btn btn--blue" onClick={() => downloadJson(`verimod-live-${live.created.bundle.receipt_body.receipt_id}.json`, live.created.bundle)}>공개 bundle 저장</button>
                  <button type="button" className="btn btn--outline" onClick={async () => {
                    try { downloadJson(`verimod-private-${live.created.bundle.receipt_body.receipt_id}.json`,
                      await createPrivatePackage(live.created.bundle.receipt_body, live.original_text, live.created.private_package.content_salt)) }
                    catch { setError('소유자 자료를 확인할 수 없어 Package를 저장하지 않았습니다.') }
                  }}>Private Package 저장</button>
                  <button type="button" className="btn btn--outline" onClick={() => { setLive(null); setText('') }}>소유자 자료 지우기</button>
                </div>
                <p className="muted small">비공개 자료는 이번 화면의 메모리에만 있습니다. 본인 파일로 저장한 뒤 안전하게 보관하세요. 화면을 떠나면 사라집니다.</p>
              </div>
            ) : !draft ? (
              <div className="empty">
                <p className="mono faint">결과</p>
                <h2 className="title-s">왼쪽에 글을 넣고 판정을 요청하세요</h2>
                <ol className="empty__steps">
                  <li>{mode === 'LIVE' ? '실제 모델 점수와 서버 정책 조치' : '항목별 합성 점수와 검토·제한 기준선'}</li>
                  <li>정책이 정한 조치와 적용된 규칙</li>
                  <li>근거로 기록된 문장 구간</li>
                  <li>영수증 발급 후 봉인과 검증</li>
                </ol>
              </div>
            ) : mode === 'SYNTHETIC' ? (
              <DecisionResult draft={draft} stale={stale} busy={busy !== null} issuing={busy === 'issue'} onIssue={() => void issue()} />
            ) : null}
          </aside>
        </div>
      </section>
    </>
  )
}
