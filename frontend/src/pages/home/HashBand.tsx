import { useEffect, useState } from 'react'
import { receiptHash } from '../../domain/receipt'
import { useAppState } from '../../store/context'
import { ArrowLink, InfoTip } from '../../ui/bits'

const SAMPLE_ID = 'a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63'

function compact(hash: string) {
  return `${hash.slice(0, 10)}…${hash.slice(-4)}`
}

/** chain.link의 거대한 지표 자리에, 이 브라우저가 방금 계산한 영수증 해시를 보여준다. */
export function HashBand() {
  const state = useAppState()
  const sample = state.receipts.find((r) => r.body.receipt_id === SAMPLE_ID) ?? state.receipts[0]
  const [hash, setHash] = useState<string | null>(null)

  useEffect(() => {
    if (!sample) return
    let active = true
    void receiptHash(sample.body).then((value) => {
      if (active) setHash(value)
    })
    return () => {
      active = false
    }
  }, [sample])

  if (!sample) return null

  return (
    <section className="band" data-tone="dark" aria-labelledby="hashband-title">
      <div className="frame hashband">
        <h2 id="hashband-title" className="sr-only">
          이 브라우저에서 계산한 영수증 해시
        </h2>
        <p className="hashband__value display" aria-label={hash ?? '계산 중'} title={hash ?? undefined}>
          {hash ? compact(hash) : '계산 중'}
        </p>
        <div className="hashband__meta">
          <p className="mono faint hashband__caption">
            Receipt hash · 이 브라우저에서 방금 SHA-256으로 계산
            <InfoTip label="해시 계산 방식">
              합성 시드 영수증 본문을 정규 직렬화한 뒤 “verimod:receipt:v1”과 0x00을 앞에 붙여 SHA-256으로 계산했습니다. 본문이 같으면 새로고침해도 같은 값이 나옵니다.
            </InfoTip>
          </p>
          <ArrowLink to={`/receipts/${sample.body.receipt_id}`}>이 영수증 검증해 보기</ArrowLink>
        </div>
      </div>
    </section>
  )
}
