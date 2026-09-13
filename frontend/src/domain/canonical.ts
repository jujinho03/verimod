import { utf8, type Bytes } from './hash'

export class CanonicalizationError extends Error {}

const LONE_SURROGATE = /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/

function assertWellFormed(text: string) {
  if (LONE_SURROGATE.test(text)) throw new CanonicalizationError('잘못된 Unicode 문자열')
}

function isPlainObject(value: object): boolean {
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

/**
 * 영수증 body가 쓰는 값(문자열·안전 정수·불리언·null·배열·일반 객체)만 받아
 * 객체 키를 UTF-16 코드 단위 순으로 정렬해 공백 없이 직렬화한다.
 * 시험 구현이며 RFC 8785 전체 호환을 주장하지 않는다.
 */
export function canonicalize(value: unknown): string {
  return encode(value, new Set())
}

function encode(value: unknown, ancestors: Set<object>): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new CanonicalizationError(`안전 정수가 아닌 숫자: ${value}`)
    }
    return String(value)
  }
  if (typeof value === 'string') {
    assertWellFormed(value)
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new CanonicalizationError('순환 참조')
    ancestors.add(value)
    try {
      return `[${Array.from({ length: value.length }, (_, i) => {
        if (!Object.hasOwn(value, i)) throw new CanonicalizationError('희소 배열은 허용하지 않습니다')
        return encode(value[i], ancestors)
      }).join(',')}]`
    } finally {
      ancestors.delete(value)
    }
  }
  if (typeof value === 'object' && isPlainObject(value)) {
    if (ancestors.has(value)) throw new CanonicalizationError('순환 참조')
    ancestors.add(value)
    try {
      const record = value as Record<string, unknown>
      const members = Object.keys(record)
        .sort()
        .map((key) => {
          assertWellFormed(key)
          return `${JSON.stringify(key)}:${encode(record[key], ancestors)}`
        })
      return `{${members.join(',')}}`
    } finally {
      ancestors.delete(value)
    }
  }
  throw new CanonicalizationError(`직렬화할 수 없는 값: ${typeof value}`)
}

export function canonicalBytes(value: unknown): Bytes {
  return utf8(canonicalize(value))
}
