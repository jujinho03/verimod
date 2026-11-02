import type { StepId, StepState, VerifyReport } from '../domain/verify'

export interface W3VerificationStage {
  id: StepId
  formula: string
  title: string
  state: StepState
  detail: string
}

// The order mirrors verifyCore: the proof is not checked until the RPC root is available.
const STAGES: { id: StepId; formula: string; title: string }[] = [
  { id: 'schema', formula: 'bundle → schema', title: '형식 확인 · 로컬' },
  { id: 'hash', formula: 'SHA-256("verimod:receipt:v1" || 0x00 || JCS(body))', title: '본문 해시 재계산 · 로컬' },
  { id: 'anchor', formula: 'anchor → TrustProfile', title: '승인된 앵커 확인 · 로컬' },
  { id: 'epoch', formula: 'ledger → epochs(epoch_id)', title: '선택한 원장 root 조회 · 원장 의존' },
  { id: 'inclusion', formula: 'leaf + proof → 원장 root', title: '포함 증명 대조 · 원장 root 의존' },
  { id: 'finality', formula: 'head − anchor block + 1', title: '블록 확인 수 · 원장 의존' },
]

export function toW3VerificationStages(report: VerifyReport | null): W3VerificationStage[] {
  return STAGES.map((stage) => {
    const result = report?.steps.find((step) => step.id === stage.id)
    return {
      ...stage,
      state: result?.state ?? 'SKIPPED',
      detail: result?.detail ?? '검증을 실행하면 이 단계의 결과와 중단 지점을 표시합니다.',
    }
  })
}
