import type { StepId, StepState, VerifyReport } from '../domain/verify'

export interface W3VerificationStage {
  id: 'body_hash' | 'leaf' | 'proof' | 'rpc'
  formula: string
  title: string
  state: StepState
  detail: string
}

function unstarted(id: W3VerificationStage['id'], formula: string, title: string): W3VerificationStage {
  return { id, formula, title, state: 'SKIPPED', detail: '검증을 실행하면 이 단계의 결과와 중단 지점을 표시합니다.' }
}

export function toW3VerificationStages(report: VerifyReport | null): W3VerificationStage[] {
  if (!report) {
    return [
      unstarted('body_hash', 'body → JCS → SHA-256', '본문 해시 재계산'),
      unstarted('leaf', '0x00 || receipt_hash', 'Merkle leaf 구성'),
      unstarted('proof', 'proof N단계 → root', '포함 증명 경로 계산'),
      unstarted('rpc', 'eth_call epochs(epoch_id)', '공개 원장 root 조회'),
    ]
  }
  const step = (id: StepId) => report.steps.find((item) => item.id === id)!
  const hash = step('hash')
  const inclusion = step('inclusion')
  const epoch = step('epoch')
  const finality = step('finality')
  const leafState: StepState = hash.state === 'PASSED' ? 'PASSED' : hash.state === 'FAILED' ? 'SKIPPED' : hash.state
  const rpcState = epoch.state === 'PASSED' && finality.state !== 'SKIPPED' ? finality.state : epoch.state

  return [
    { id: 'body_hash', formula: 'body → JCS → SHA-256', title: '본문 해시 재계산', state: hash.state, detail: hash.detail },
    {
      id: 'leaf',
      formula: '0x00 || receipt_hash',
      title: 'Merkle leaf 구성',
      state: leafState,
      detail: leafState === 'PASSED' ? '검증된 receipt hash를 shared Merkle 입력으로 사용합니다.' : '해시 단계가 끝나지 않아 leaf 계산을 진행하지 않았습니다.',
    },
    { id: 'proof', formula: `proof ${report.body && report.code !== 'PENDING_ANCHOR' ? 'N' : '0'}단계 → root`, title: '포함 증명 경로 계산', state: inclusion.state, detail: inclusion.detail },
    {
      id: 'rpc',
      formula: 'eth_call epochs(epoch_id)',
      title: '공개 원장 root 조회',
      state: rpcState,
      detail: epoch.state === 'PASSED' ? `${epoch.detail} · ${finality.detail}` : epoch.detail,
    },
  ]
}
