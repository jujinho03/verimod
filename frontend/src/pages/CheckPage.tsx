import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MAX_INPUT_CODE_POINTS } from '../domain/manifests'
import { InferenceError, codePointLength } from '../domain/scorer'
import { EvidenceText } from '../features/EvidenceText'
import { decisionSentence } from '../features/explain'
import { PageHero } from '../features/PageHero'
import { ScoreBars } from '../features/ScoreBars'
import { useStore } from '../store/context'
import { draftDecision, type DecisionDraft } from '../store/store'
import { ActionBadge, ArrowLink, SyntheticPill } from '../ui/bits'
import { shortHash } from '../ui/format'

const HARD_LIMIT = 5000

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

  const length = codePointLength(text)
  const stale = draft !== null && draft.text !== text

  const reset = (next: string) => {
    setText(next)
    setDraft(null)
    setError(null)
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

  return (
    <>
      <PageHero label="Decide · 판정 요청" title="글을 넣으면 항목별 점수와 조치를 보여드립니다">
        <p>시험 버전의 점수는 키워드 기반 합성 점수기가 만듭니다. 실제 AI 모델의 판단이나 성능이 아닙니다.</p>
        <ArrowLink to="/protocol#policy">적용 정책과 기준값 보기</ArrowLink>
      </PageHero>

      <section className="band" data-tone="white">
        <div className="frame work">
          <form
            className="work__main"
            onSubmit={(event) => {
              event.preventDefault()
              void score()
            }}
          >
            <h2 className="title-s">판정할 글</h2>
            <div className="chips" role="group" aria-label="예시 문장">
              {SAMPLES.map((sample) => (
                <button key={sample.label} type="button" className="chip" onClick={() => reset(sample.text)}>
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
                value={text}
                onChange={(event) => setText(event.target.value)}
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
                {busy === 'score' ? '계산 중' : '판정 요청'}
              </button>
              {text && (
                <button type="button" className="btn btn--outline" onClick={() => reset('')}>
                  지우기
                </button>
              )}
            </div>
            <p className="muted small">원문은 이 브라우저에만 저장합니다. 영수증에는 무작위 salt를 더해 계산한 commitment만 들어갑니다.</p>
          </form>

          <aside className="work__side" aria-live="polite">
            {!draft ? (
              <div className="empty">
                <p className="mono faint">결과</p>
                <h2 className="title-s">왼쪽에 글을 넣고 판정을 요청하세요</h2>
                <ol className="empty__steps">
                  <li>항목별 합성 점수와 검토·제한 기준선</li>
                  <li>정책이 정한 조치와 적용된 규칙</li>
                  <li>근거로 기록된 문장 구간</li>
                  <li>영수증 발급 후 봉인과 검증</li>
                </ol>
              </div>
            ) : (
              <div className="result">
                <div className="result__head">
                  <ActionBadge action={draft.policy.action} large />
                  <SyntheticPill />
                </div>
                <p className="summary-line">{decisionSentence(draft.inference, draft.policy)}</p>
                {stale && <p className="inline-warn">입력이 바뀌었습니다. 다시 판정을 요청해야 영수증을 발급할 수 있습니다.</p>}

                <h3 className="mono faint sub-label">항목별 점수</h3>
                <ScoreBars scores={draft.inference.scores_ppm} />

                <h3 className="mono faint sub-label">근거 구간</h3>
                {draft.inference.evidence.length > 0 ? (
                  <EvidenceText
                    text={draft.text}
                    evidence={draft.inference.evidence}
                    truncatedAt={draft.inference.input_status === 'TRUNCATED' ? MAX_INPUT_CODE_POINTS : undefined}
                  />
                ) : (
                  <p className="muted">표시할 근거 구간이 없습니다. 합성 점수기는 키워드가 일치한 구간만 근거로 기록합니다.</p>
                )}

                <dl className="kv">
                  <dt>적용 규칙</dt>
                  <dd>{draft.policy.triggered_rule_ids.length ? draft.policy.triggered_rule_ids.join(', ') : '없음'}</dd>
                  <dt>입력 상태</dt>
                  <dd>{draft.inference.input_status === 'FULL' ? '전체 사용' : `앞 ${MAX_INPUT_CODE_POINTS}자만 사용`}</dd>
                  <dt>모델 manifest</dt>
                  <dd>
                    <code className="hash">{shortHash(draft.inference.model_manifest_hash)}</code> <span className="faint">합성 점수기 0.1.0</span>
                  </dd>
                  <dt>정책 manifest</dt>
                  <dd>
                    <code className="hash">{shortHash(draft.policy.policy_manifest_hash)}</code> <span className="faint">2026-09-synthetic</span>
                  </dd>
                  <dt>commitment</dt>
                  <dd>
                    <code className="hash">{shortHash(draft.inference.content_commitment)}</code>
                  </dd>
                </dl>

                <div className="btn-row">
                  <button type="button" className="btn btn--blue" onClick={() => void issue()} disabled={stale || busy !== null}>
                    {busy === 'issue' ? '발급 중' : '영수증 발급'}
                  </button>
                </div>
                <p className="muted small">영수증을 발급해야 기록이 남습니다. 발급 후 약 20초 동안 배치 포함, 트랜잭션 제출, 블록 확인을 거칩니다.</p>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
