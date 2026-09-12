import { APPEAL_REASONS } from '../domain/manifests'
import type { Action, EventKind, ReviewOutcome } from '../domain/types'
import type { SideState, StepId, VerifyCode } from '../domain/verify'
import type { AnchorStage } from '../store/ledger'
import type { StoredReceipt } from '../store/state'

export type StatusTone = 'pass' | 'fail' | 'pending' | 'neutral'

export const ACTION_LABEL: Record<Action, string> = {
  ALLOW: '승인',
  HUMAN_REVIEW: '검토 보류',
  RESTRICT: '제한',
}

export const EVENT_LABEL: Record<EventKind, string> = {
  DECISION: '최초 판정',
  APPEAL: '이의제기',
  REVIEW: '사람 검토',
}

export const OUTCOME_LABEL: Record<ReviewOutcome, string> = {
  UPHOLD: '조치 유지',
  OVERTURN: '조치 변경',
  RESOLVED: '검토 완료',
}

export const STAGE_ORDER: AnchorStage[] = ['ISSUED', 'BATCHED', 'SUBMITTED', 'CONFIRMING', 'ANCHORED']

export const STAGE_LABEL: Record<AnchorStage, string> = {
  ISSUED: '발급',
  BATCHED: '배치 포함',
  SUBMITTED: '트랜잭션 제출',
  CONFIRMING: '블록 확인',
  ANCHORED: '앵커 확인',
}

export const CODE_INFO: Record<VerifyCode, { tone: StatusTone; title: string; description: string }> = {
  VALID: {
    tone: 'pass',
    title: '기록 일치',
    description: '영수증이 신뢰한 원장의 root에 포함되고 블록 확인도 끝났습니다. 판정 내용이 옳다는 뜻은 아닙니다.',
  },
  HASH_MISMATCH: {
    tone: 'fail',
    title: '해시 불일치',
    description: '본문이 발급 당시와 다릅니다. 점수·정책·조치·근거 중 무언가가 바뀌었습니다.',
  },
  INVALID_PROOF: {
    tone: 'fail',
    title: '포함 증명 실패',
    description: '이 영수증 해시에서 출발한 경로가 원장에 기록된 root로 이어지지 않습니다.',
  },
  UNTRUSTED_ANCHOR: {
    tone: 'fail',
    title: '신뢰하지 않는 앵커',
    description: '검증기가 믿기로 정한 체인·컨트랙트·발급자가 아닙니다.',
  },
  PENDING_ANCHOR: {
    tone: 'pending',
    title: '앵커 대기',
    description: '원장 기록 확인이 아직 끝나지 않았습니다. 확정 전에는 일치로 표시하지 않습니다.',
  },
  RPC_UNAVAILABLE: {
    tone: 'pending',
    title: '원장 조회 불가',
    description: 'RPC가 응답하지 않았습니다. 변조로 판단하지 않으며 나중에 다시 확인해야 합니다.',
  },
  INVALID_SCHEMA: {
    tone: 'fail',
    title: '형식 오류',
    description: '영수증 형식이 명세와 맞지 않습니다.',
  },
  UNSUPPORTED_VERSION: {
    tone: 'fail',
    title: '지원하지 않는 버전',
    description: '이 검증기가 지원하지 않는 protocol version입니다.',
  },
}

export const STEP_LABEL: Record<StepId, string> = {
  schema: '형식 확인',
  hash: '해시 재계산',
  anchor: '신뢰 앵커 확인',
  epoch: '원장 조회',
  inclusion: '포함 증명',
  finality: '블록 확정',
}

export const SIDE_INFO: Record<SideState, { tone: StatusTone; label: string }> = {
  PASSED: { tone: 'pass', label: '통과' },
  FAILED: { tone: 'fail', label: '실패' },
  NOT_CHECKED: { tone: 'neutral', label: '확인 안 함' },
  INCOMPLETE_HISTORY: { tone: 'pending', label: '이력 불완전' },
}

const dateFormat = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'Asia/Seoul',
})

export function formatDateTime(value: number | string): string {
  return dateFormat.format(typeof value === 'string' ? new Date(value) : value)
}

export function shortHash(hash: string, head = 10, tail = 6): string {
  return hash.length <= head + tail + 1 ? hash : `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export function formatPpm(ppm: number): string {
  return ppm.toLocaleString('en-US')
}

export function relativeTime(ms: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - ms) / 1000))
  if (seconds < 5) return '방금'
  if (seconds < 60) return `${seconds}초 전`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}분 전`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export function receiptTitle(receipt: StoredReceipt): string {
  const body = receipt.body
  if (body.event_kind === 'DECISION') return `최초 판정 · ${ACTION_LABEL[body.payload.policy.action]}`
  if (body.event_kind === 'APPEAL') return `이의제기 · ${APPEAL_REASONS[body.payload.reason_code] ?? body.payload.reason_code}`
  return `사람 검토 · ${OUTCOME_LABEL[body.payload.outcome]} (${ACTION_LABEL[body.payload.resulting_action]})`
}

export function downloadJson(filename: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
