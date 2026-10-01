import { describe, expect, it } from 'vitest'
import { CanonicalizationError, canonicalize } from './canonical'
import { bytesToHex, sha256, utf8 } from './hash'

const GOLDEN_VECTORS = [
  {
    id: 'ascii-key-order',
    input: { z: 1, a: null, middle: true },
    canonical: '{"a":null,"middle":true,"z":1}',
    sha256: '0x492a5b7685b78971b520762a7fef0055a6ddecf103d2181fcb6616b94f006053',
  },
  {
    id: 'korean-string',
    input: { message: '한글', tags: ['검증', '영수증'] },
    canonical: '{"message":"한글","tags":["검증","영수증"]}',
    sha256: '0xae2711606e73ecd8d6572dbf84e5647582b2b33450ee3c229934638e57ba2677',
  },
  {
    id: 'astral-key-order',
    input: { '😀': 'grinning', '\uffff': 'bmp', a: 'ascii' },
    canonical: '{"a":"ascii","😀":"grinning","\uffff":"bmp"}',
    sha256: '0xfd567e89636ad558c2b8e9e8a1d2bc0683c48fea57b113ba6fa51caf2ff85cda',
  },
  {
    id: 'json-escaping',
    input: { text: 'quote: " newline: \n tab: \t slash: \\' },
    canonical: '{"text":"quote: \\" newline: \\n tab: \\t slash: \\\\"}',
    sha256: '0x1ec499f9abf9229bce615e21b8bd589cdf3f56d7c17eb823635d888c9eebfc1e',
  },
  {
    id: 'safe-integer-boundaries',
    input: { min: -9007199254740991, max: 9007199254740991, zero: 0 },
    canonical: '{"max":9007199254740991,"min":-9007199254740991,"zero":0}',
    sha256: '0xb7b2401ddca2165824e98c61890c0aaec470258d3119dd265d02be9438bf47e6',
  },
  {
    id: 'null-vs-present',
    input: { present: null, nested: { kept: null } },
    canonical: '{"nested":{"kept":null},"present":null}',
    sha256: '0x0cb32eed600e1c9a434445c1a0c1f3bc8a5e6ad84f273e7a5e4145776ab049df',
  },
] as const

describe('canonicalize', () => {
  it.each(GOLDEN_VECTORS)('독립 golden vector $id의 bytes와 SHA-256이 일치한다', async (vector) => {
    expect(canonicalize(vector.input)).toBe(vector.canonical)
    expect(bytesToHex(await sha256(utf8(vector.canonical)))).toBe(vector.sha256)
  })

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
