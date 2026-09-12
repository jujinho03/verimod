import { describe, expect, it } from 'vitest'
import { CanonicalizationError, canonicalize } from './canonical'

describe('canonicalize', () => {
  it('키 입력 순서와 관계없이 같은 문자열을 만든다', () => {
    const a = canonicalize({ b: 1, a: { d: [1, 'x'], c: null } })
    const b = canonicalize({ a: { c: null, d: [1, 'x'] }, b: 1 })
    expect(a).toBe(b)
    expect(a).toBe('{"a":{"c":null,"d":[1,"x"]},"b":1}')
  })

  it('배열 순서는 보존한다', () => {
    expect(canonicalize([2, 1])).not.toBe(canonicalize([1, 2]))
  })

  it('한글과 이모지를 정규화하지 않고 그대로 둔다', () => {
    expect(canonicalize('한글😀')).toBe('"한글😀"')
  })

  it.each([0.5, Number.NaN, 2 ** 53, Number.POSITIVE_INFINITY])('안전 정수가 아닌 숫자 %s는 거부한다', (value) => {
    expect(() => canonicalize({ value })).toThrow(CanonicalizationError)
  })

  it('짝이 없는 surrogate 문자열은 거부한다', () => {
    expect(() => canonicalize('\uD800')).toThrow(CanonicalizationError)
    expect(() => canonicalize({ ['\uDC00']: 1 })).toThrow(CanonicalizationError)
  })

  it('undefined와 Date 같은 값은 거부한다', () => {
    expect(() => canonicalize({ a: undefined })).toThrow(CanonicalizationError)
    expect(() => canonicalize({ a: new Date(0) })).toThrow(CanonicalizationError)
  })
})
