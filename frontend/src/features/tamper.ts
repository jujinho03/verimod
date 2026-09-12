import type { Hex32 } from '../domain/hash'
import { APPEAL_REASONS } from '../domain/manifests'
import { LABEL_IDS, type ReceiptBody } from '../domain/types'

export interface TamperChange {
  path: string
  before: string
  after: string
}

export interface TamperOption {
  id: string
  label: string
  hint: string
  apply: (body: ReceiptBody) => TamperChange
}

const flipLast = (hash: Hex32): Hex32 => `${hash.slice(0, -1)}${hash.endsWith('0') ? '1' : '0'}` as Hex32

/** 사본 본문에 적용할 수 있는 변조. 원본 영수증은 건드리지 않는다. */
export function tamperOptions(body: ReceiptBody): TamperOption[] {
  const options: TamperOption[] = []

  if (body.event_kind === 'DECISION') {
    options.push(
      {
        id: 'score',
        label: '점수 한 항목 바꾸기',
        hint: '가장 높은 항목의 점수를 낮추거나 높입니다',
        apply: (b) => {
          if (b.event_kind !== 'DECISION') throw new Error('판정 영수증이 아닙니다')
          const scores = b.payload.inference.scores_ppm
          const label = LABEL_IDS.reduce((top, id) => (scores[id] > scores[top] ? id : top), LABEL_IDS[0])
          const before = scores[label]
          scores[label] = before >= 400_000 ? 120_000 : 910_000
          return { path: `scores_ppm.${label}`, before: String(before), after: String(scores[label]) }
        },
      },
      {
        id: 'action',
        label: '조치 바꾸기',
        hint: '점수는 그대로 두고 결과만 고칩니다',
        apply: (b) => {
          if (b.event_kind !== 'DECISION') throw new Error('판정 영수증이 아닙니다')
          const before = b.payload.policy.action
          b.payload.policy.action = before === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
          return { path: 'policy.action', before, after: b.payload.policy.action }
        },
      },
      {
        id: 'policy',
        label: '정책 manifest 해시 바꾸기',
        hint: '다른 정책 버전을 썼다고 주장합니다',
        apply: (b) => {
          if (b.event_kind !== 'DECISION') throw new Error('판정 영수증이 아닙니다')
          const before = b.payload.policy.policy_manifest_hash
          b.payload.policy.policy_manifest_hash = flipLast(before)
          return { path: 'policy.policy_manifest_hash', before, after: b.payload.policy.policy_manifest_hash }
        },
      },
    )
    if (body.payload.inference.evidence.length > 0) {
      options.push({
        id: 'evidence',
        label: '근거 구간 지우기',
        hint: '판정 근거로 기록된 구간을 없앱니다',
        apply: (b) => {
          if (b.event_kind !== 'DECISION') throw new Error('판정 영수증이 아닙니다')
          const before = `${b.payload.inference.evidence.length}개 구간`
          b.payload.inference.evidence = []
          return { path: 'inference.evidence', before, after: '0개 구간' }
        },
      })
    }
  }

  if (body.event_kind === 'APPEAL') {
    options.push({
      id: 'reason',
      label: '이의제기 사유 바꾸기',
      hint: '접수된 사유 코드를 다른 코드로 바꿉니다',
      apply: (b) => {
        if (b.event_kind !== 'APPEAL') throw new Error('이의제기 영수증이 아닙니다')
        const before = b.payload.reason_code
        b.payload.reason_code = Object.keys(APPEAL_REASONS).find((code) => code !== before) ?? before
        return { path: 'payload.reason_code', before, after: b.payload.reason_code }
      },
    })
  }

  if (body.event_kind === 'REVIEW') {
    options.push({
      id: 'result',
      label: '검토 결과 조치 바꾸기',
      hint: '검토자가 내린 최종 조치를 뒤집습니다',
      apply: (b) => {
        if (b.event_kind !== 'REVIEW') throw new Error('검토 영수증이 아닙니다')
        const before = b.payload.resulting_action
        b.payload.resulting_action = before === 'ALLOW' ? 'RESTRICT' : 'ALLOW'
        return { path: 'payload.resulting_action', before, after: b.payload.resulting_action }
      },
    })
  }

  options.push({
    id: 'time',
    label: '기록 시각 1초 늦추기',
    hint: '발급 시각만 아주 조금 바꿉니다',
    apply: (b) => {
      const before = b.recorded_at
      b.recorded_at = new Date(Date.parse(before) + 1000).toISOString()
      return { path: 'recorded_at', before, after: b.recorded_at }
    },
  })

  return options
}
