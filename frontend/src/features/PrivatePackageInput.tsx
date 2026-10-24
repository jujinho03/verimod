import { MAX_JSON_BYTES } from '../domain/json'

/** Private bytes stay in component memory and are never rendered or uploaded. */
export function PrivatePackageInput({ present, onChange }: { present: boolean; onChange(value: unknown): void }) {
  return <section className="trust-card" aria-label="Private Package">
    <h2 className="title-s">Private Receipt Package</h2>
    <p className="muted small">본인 소유 파일만 선택하세요. 이 기기의 메모리에서만 대조하며 서버·RPC에 전송하지 않습니다. Core VALID와 Content PASSED는 별도 결과입니다.</p>
    <label className="field__label" htmlFor="private-package">Private Package 가져오기</label>
    <input id="private-package" type="file" accept="application/json,.json" className="input" onChange={async (event) => {
      const file = event.currentTarget.files?.[0]
      event.currentTarget.value = ''
      if (!file) return
      try { onChange(file.size <= MAX_JSON_BYTES ? await file.text() : false) } catch { onChange(false) }
    }} />
    <p aria-live="polite">{present ? '비공개 자료를 메모리에 불러왔습니다. 검증하기를 눌러 대조하세요.' : '자료 없음 · Content NOT_CHECKED'}</p>
    <button className="btn btn--outline btn--compact" type="button" disabled={!present} onClick={() => onChange(null)}>비공개 자료 지우기</button>
  </section>
}
