/* 홈 화면 카드·섹션에 쓰는 도식. 실제 구조(영수증 → 해시 → Merkle → 앵커)를 그린다. */

export function DecideArt() {
  const rows = [
    ['스팸', 0.96],
    ['폭력', 0.08],
    ['욕설', 0.11],
    ['혐오', 0.05],
  ] as const
  return (
    <div className="card-art card-art--blue">
      <p className="card-art__quote">“무료 당첨! 지금 바로 클릭…”</p>
      <div className="card-art__bars">
        {rows.map(([label, value]) => (
          <div key={label} className="card-art__bar">
            <span>{label}</span>
            <i style={{ width: `${value * 100}%` }} />
          </div>
        ))}
      </div>
      <span className="card-art__stamp">제한</span>
    </div>
  )
}

export function ReceiptArt() {
  return (
    <div className="card-art card-art--dark">
      <svg viewBox="0 0 292 224" className="card-art__svg" aria-hidden>
        <path d="M96 26h100v164l-12.5-8-12.5 8-12.5-8-12.5 8-12.5-8-12.5 8-12.5-8-12.5 8z" fill="#f5f7fa" />
        {[52, 70, 88, 106].map((y, i) => (
          <rect key={y} x="112" y={y} width={[68, 52, 60, 40][i]} height="6" fill="#0e1119" opacity="0.18" />
        ))}
        <rect x="112" y="132" width="68" height="18" fill="#0847f7" />
        <text x="146" y="145" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9" fill="#fff">
          0x7e4c…b20f
        </text>
        <path d="M196 141h50v-60" stroke="#639cff" strokeDasharray="3 4" fill="none" />
        <rect x="232" y="54" width="28" height="28" fill="none" stroke="#639cff" />
        <rect x="239" y="61" width="14" height="14" fill="#fbbd11" />
      </svg>
    </div>
  )
}

export function TamperArt() {
  return (
    <div className="card-art card-art--paper">
      <div className="card-art__hashes">
        <p>
          <span className="mono">원본</span>
          <code>0x7e4c19a2…b20f</code>
        </p>
        <p className="is-bad">
          <span className="mono">사본</span>
          <code>0xd03b77e1…41ca</code>
        </p>
      </div>
      <span className="card-art__code">HASH_MISMATCH</span>
    </div>
  )
}

export function AppealArt() {
  return (
    <div className="card-art card-art--teal">
      <svg viewBox="0 0 292 224" className="card-art__svg" aria-hidden>
        <path d="M40 112h212" stroke="#ffffff" strokeOpacity="0.5" />
        {[
          [52, '판정'],
          [146, '이의'],
          [240, '검토'],
        ].map(([x, label], i) => (
          <g key={label}>
            <rect x={Number(x) - 12} y="100" width="24" height="24" fill={i === 2 ? '#fbbd11' : '#ffffff'} />
            <text x={x} y="150" textAnchor="middle" fontSize="13" fontWeight="600" fill="#ffffff">
              {label}
            </text>
          </g>
        ))}
        <text x="99" y="96" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9" fill="#ffffff" opacity="0.8">
          hash
        </text>
        <text x="193" y="96" textAnchor="middle" fontFamily="DM Mono, monospace" fontSize="9" fill="#ffffff" opacity="0.8">
          hash
        </text>
      </svg>
    </div>
  )
}

/** 판정에서 앵커까지의 실제 데이터 흐름. 검증기는 영수증·증명·앵커 세 곳에서 따로 읽는다. */
export function PipelineDiagram() {
  const node = (x: number, y: number, w: number, label: string, sub: string, fill = 'none', ink = '#f5f7fa') => (
    <g>
      <rect x={x} y={y} width={w} height="56" fill={fill} stroke={fill === 'none' ? 'rgba(217,226,242,0.35)' : fill} />
      <text x={x + 16} y={y + 24} fontSize="15" fontWeight="600" fill={ink}>
        {label}
      </text>
      <text x={x + 16} y={y + 43} fontFamily="DM Mono, monospace" fontSize="10.5" fill={ink} opacity="0.62">
        {sub}
      </text>
    </g>
  )
  return (
    <svg viewBox="0 0 560 540" className="pipeline" role="img" aria-labelledby="pipeline-title">
      <title id="pipeline-title">AI 출력에서 영수증, 해시, Merkle root, 원장 앵커로 이어지고 검증기가 세 지점을 대조하는 구조</title>
      <defs>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0v28" fill="none" stroke="rgba(217,226,242,0.06)" />
        </pattern>
      </defs>
      <rect width="560" height="540" fill="url(#grid)" />
      <g stroke="rgba(217,226,242,0.4)" fill="none">
        <path d="M130 96v38M130 190v38M130 284v38M130 378v38" />
        <path d="M250 162h110M250 256h110M250 444h110" strokeDasharray="4 5" />
        <path d="M360 162v282" strokeDasharray="4 5" />
      </g>
      {node(30, 40, 220, 'AI 출력과 정책 조치', 'scores_ppm · action')}
      {node(30, 134, 220, '영수증 본문', 'DECISION · APPEAL · REVIEW')}
      {node(30, 228, 220, '영수증 해시', 'domain · 0x00 · restricted JSON')}
      {node(30, 322, 220, 'Merkle root', 'RFC 9162 · epoch', '#0847f7', '#ffffff')}
      {node(30, 416, 220, '원장 앵커', 'root · count · version')}
      {node(360, 256, 170, '독립 검증기', '재계산 · 대조', '#fbbd11', '#0e1119')}
      <text x="372" y="150" fontFamily="DM Mono, monospace" fontSize="10.5" fill="rgba(217,226,242,0.62)">
        본문
      </text>
      <text x="372" y="432" fontFamily="DM Mono, monospace" fontSize="10.5" fill="rgba(217,226,242,0.62)">
        신뢰한 컨트랙트만
      </text>
    </svg>
  )
}

export function CtaArt() {
  return (
    <svg viewBox="0 0 760 404" className="cta__art" aria-hidden preserveAspectRatio="xMaxYMax meet">
      <g stroke="rgba(217,226,242,0.22)" fill="none">
        {Array.from({ length: 9 }, (_, i) => (
          <path key={`a${i}`} d={`M${120 + i * 80} 404 L${440 + i * 80} 220`} />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <path key={`b${i}`} d={`M${360 + i * 70} ${404 - i * 40} H760`} />
        ))}
        <path d="M440 220 L760 36 M520 404 V174 M600 404 V128 M680 404 V82" />
      </g>
      <path d="M470 404V240l46-26v190z" fill="#fbbd11" />
      <path d="M520 404V212l150-86v278z" fill="#0847f7" />
      <path d="M670 404V126l40-23v301z" fill="#2e7bff" />
      <path d="M300 404l60-34v34z" fill="#217d6b" />
      <path d="M728 404V260l32-18v162z" fill="#e5471e" />
    </svg>
  )
}

export function RoleArt({ tone, title, index }: { tone: 'blue' | 'teal' | 'navy' | 'ink' | 'yellow'; title: string; index: number }) {
  return (
    <div className={`role-art role-art--${tone}`}>
      <span className="role-art__dot" aria-hidden />
      <span className="role-art__title">{title}</span>
      <span className="role-art__index mono" aria-hidden>
        0{index}
      </span>
    </div>
  )
}
