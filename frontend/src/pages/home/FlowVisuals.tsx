/* 작동 방식 탭의 왼쪽 카드. 각 단계에서 이용자가 실제로 보는 화면 조각을 줄여 보여준다. */

export function ScoresVisual() {
  const rows: [string, number, boolean][] = [
    ['스팸', 990_000, true],
    ['욕설', 61_204, false],
    ['폭력', 43_918, false],
    ['혐오', 127_551, false],
    ['성적 표현', 22_087, false],
  ]
  return (
    <div className="mini">
      <div className="mini__head">
        <span className="mono">SCORES_PPM</span>
        <span className="action action--RESTRICT">제한</span>
      </div>
      {rows.map(([label, ppm, hit]) => (
        <div className="mini-bar" key={label}>
          <span>{label}</span>
          <div className="mini-bar__rail">
            <i style={{ width: `${ppm / 10_000}%` }} className={hit ? 'is-hit' : ''} />
            <b style={{ left: '85%' }} aria-hidden />
          </div>
          <code>{ppm.toLocaleString('en-US')}</code>
        </div>
      ))}
      <p className="mini__foot mono">합성 점수 · threshold 850,000</p>
    </div>
  )
}

export function ReceiptVisual() {
  return (
    <pre className="mini mini--code">
      {`{
  "protocol_version": "verimod/1",
  "event_kind": "DECISION",
  "recorded_at": "2026-09-08T01:12:30.000Z",
  "content_commitment": "0x5a1f…c09e",
  "payload": {
    "inference": {
      "model_manifest_hash": "0x9e02…71ab",
      "scores_ppm": { "violence": 902331, … }
    },
    "policy": { "action": "RESTRICT", … }
  }
}`}
    </pre>
  )
}

export function MerkleVisual() {
  return (
    <div className="mini">
      <svg viewBox="0 0 340 200" className="mini__svg" aria-hidden>
        <g stroke="currentColor" strokeOpacity="0.3" fill="none">
          <path d="M170 34v18M90 70V52h160v18M50 118v-18h80v18M210 118v-18h80v18" />
        </g>
        <rect x="140" y="10" width="60" height="24" fill="#0847f7" />
        <text x="170" y="26" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="#fff">
          root
        </text>
        {[60, 220].map((x) => (
          <rect key={x} x={x} y="70" width="60" height="24" fill="none" stroke="currentColor" strokeOpacity="0.5" />
        ))}
        {[20, 100, 180, 260].map((x, i) => (
          <rect key={x} x={x} y="118" width="60" height="24" fill={i === 1 ? '#fbbd11' : 'none'} stroke="currentColor" strokeOpacity={i === 1 ? 0 : 0.5} />
        ))}
        <text x="130" y="134" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="#0e1119">
          내 영수증
        </text>
        <text x="170" y="180" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="10" fill="currentColor" opacity="0.6">
          epoch #3 · receipt 4건 · 확인 12/12
        </text>
      </svg>
    </div>
  )
}

export function ChecklistVisual() {
  const rows = ['형식 확인', '해시 재계산', '신뢰 앵커 확인', '원장 조회', '포함 증명', '블록 확정']
  return (
    <div className="mini">
      {rows.map((row) => (
        <div className="mini-check" key={row}>
          <span className="mini-check__icon" aria-hidden>
            ✓
          </span>
          <span>{row}</span>
        </div>
      ))}
      <div className="mini__result">
        <span className="status status--pass">VALID</span>
      </div>
    </div>
  )
}

export function TamperVisual() {
  return (
    <div className="mini">
      <div className="mini-diff">
        <span className="mono">violence</span>
        <del>902331</del>
        <ins>120000</ins>
      </div>
      <div className="mini-hash">
        <span className="mono">원래 해시</span>
        <code>0x7e4c19a2…b20f</code>
      </div>
      <div className="mini-hash is-bad">
        <span className="mono">사본에서 계산</span>
        <code>0xd03b77e1…41ca</code>
      </div>
      <div className="mini__result">
        <span className="status status--fail">HASH_MISMATCH</span>
      </div>
    </div>
  )
}

export function TimelineVisual() {
  const rows = [
    ['DECISION', '제한', '09.08 10:12'],
    ['APPEAL', '맥락이 반영되지 않았습니다', '09.08 11:41'],
    ['REVIEW', '조치 변경 → 승인', '09.09 18:48'],
  ]
  return (
    <div className="mini">
      {rows.map(([kind, text, at], i) => (
        <div className="mini-step" key={kind}>
          <span className={`mini-step__node${i === rows.length - 1 ? ' is-last' : ''}`} aria-hidden />
          <div>
            <span className="mono">{kind}</span>
            <p>{text}</p>
          </div>
          <code>{at}</code>
        </div>
      ))}
    </div>
  )
}
