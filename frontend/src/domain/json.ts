/** 외부 JSON의 문법은 native parser로, 중복 키는 소실 전 토큰으로 검사한다. */
export const MAX_JSON_BYTES = 1_048_576

export function parseUniqueJson(text: string): unknown {
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw new Error('JSON은 1 MiB 이하여야 합니다')
  const parsed: unknown = JSON.parse(text)
  const stack: { keys: Set<string> | null; expectingKey: boolean }[] = []
  const tokens = text.match(/"(?:\\[\s\S]|[^"\\])*"|[{}[\]:,]|[^\s{}[\]:,"]+/g) ?? []
  for (const token of tokens) {
    const frame = stack[stack.length - 1]
    if (token === '{' || token === '[') {
      stack.push({ keys: token === '{' ? new Set() : null, expectingKey: token === '{' })
      if (stack.length > 64) throw new Error('JSON 중첩은 64단계 이하여야 합니다')
    } else if (token === '}' || token === ']') stack.pop()
    else if (token === ',' && frame?.keys) frame.expectingKey = true
    else if (token === ':' && frame?.keys) frame.expectingKey = false
    else if (token.startsWith('"') && frame?.keys && frame.expectingKey) {
      const key = JSON.parse(token) as string
      if (frame.keys.has(key)) throw new Error('중복 JSON key는 허용하지 않습니다')
      frame.keys.add(key)
    }
  }
  return parsed
}
