import { ActionBadge, SyntheticPill } from '../ui/bits'

export function FalsePositiveCasePreview() {
  return (
    <article className="false-positive" aria-labelledby="false-positive-title">
      <header className="false-positive__head">
        <div>
          <p className="mono faint">W3 SHOULD · 레이아웃 초안</p>
          <h2 className="title-m" id="false-positive-title">오탐 사례 검토 카드</h2>
        </div>
        <SyntheticPill>합성 예시</SyntheticPill>
      </header>
      <div className="false-positive__grid">
        <blockquote>“배송이 일주일째 안 와서 너무 짜증나요. 고객센터 연결도 안 됩니다.”</blockquote>
        <dl className="kv">
          <dt>모델 조치</dt>
          <dd><ActionBadge action="RESTRICT" /></dd>
          <dt>기대 조치</dt>
          <dd><ActionBadge action="ALLOW" /></dd>
          <dt>주요 점수</dt>
          <dd><code>profanity 0.61</code> <span className="faint">· 미보정 합성 점수</span></dd>
          <dt>오탐 유형</dt>
          <dd>불만 표현을 공격 대상으로 잘못 해석</dd>
        </dl>
      </div>
      <div className="false-positive__notes">
        <div>
          <p className="mono faint">근거 구간</p>
          <p><mark>너무 짜증나요</mark> — 표현 강도만 잡고 대상·맥락을 구분하지 못한 예시</p>
        </div>
        <div>
          <p className="mono faint">검토 메모</p>
          <p>A의 W5 AI-13 실제 사례가 나오면 원문을 비식별화하고 expected action, failure mode, 개선 후보를 같은 틀에 기록합니다.</p>
        </div>
      </div>
    </article>
  )
}
