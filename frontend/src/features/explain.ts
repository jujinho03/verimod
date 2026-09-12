import { LABEL_NAMES, MAX_INPUT_CODE_POINTS, POLICY_MANIFEST } from '../domain/manifests'
import type { InferenceOutput, PolicyEvaluation } from '../domain/types'

/** 정책 판단을 이용자가 읽을 한 문장으로 옮긴다. 판정이 옳다는 표현은 쓰지 않는다. */
export function decisionSentence(inference: Pick<InferenceOutput, 'input_status'>, policy: PolicyEvaluation): string {
  if (inference.input_status === 'TRUNCATED') {
    return `입력이 ${MAX_INPUT_CODE_POINTS}자를 넘어 앞부분만 점수를 매겼고, 정책에 따라 사람 검토로 보냈습니다.`
  }
  const labels = policy.triggered_rule_ids
    .map((id) => POLICY_MANIFEST.rules.find((rule) => rule.rule_id === id)?.label_id)
    .filter((label) => label !== undefined)
    .map((label) => LABEL_NAMES[label])
  if (policy.action === 'RESTRICT') return `${labels.join('·')} 점수가 제한 기준 이상이라 제한으로 기록했습니다.`
  if (policy.action === 'HUMAN_REVIEW') return `${labels.join('·')} 점수가 검토 기준 이상이라 사람 검토로 보냈습니다.`
  return '어떤 항목도 검토 기준에 닿지 않아 승인으로 기록했습니다.'
}
