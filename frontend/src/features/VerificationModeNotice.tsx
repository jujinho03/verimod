export function VerificationModeNotice({ mode }: { mode: 'BASE_SEPOLIA_DEMO' | 'SYNTHETIC_LOCAL' | 'SERVICE' }) {
  return <div className="band notice" data-tone="dark"><div className="frame">
    <span className="notice__tag mono">{mode}</span>
    <p>{mode === 'BASE_SEPOLIA_DEMO'
      ? 'Base Sepolia · 공개 RPC 독립 검증. L2 Confirmed (≥12 blocks)는 Ethereum L1 finality를 보장하지 않습니다. 새 LIVE 발급과 기존 W4 anchor seed는 다른 기록입니다.'
      : mode === 'SYNTHETIC_LOCAL'
        ? 'SYNTHETIC LIFECYCLE DEMO · Mock ledger · 공개 체인 증거 아님. 실제 이의신청 접수·사람 심사·게시물 복구 기능은 POST-MVP입니다.'
        : 'LIVE 발급 · BASE 공개 검증 · SYNTHETIC 데모는 각 화면의 실행 경로로 구분합니다. 새 Receipt는 anchor 전 PENDING이며 기존 W4 Base seed와 다릅니다.'}</p>
  </div></div>
}
