import { Link, useParams } from 'react-router'
import { AnchorProgress } from '../features/AnchorProgress'
import { AppealForm } from '../features/AppealForm'
import { DetailSection, PageHero } from '../features/PageHero'
import { EpochMembers, LifecycleTimeline, ProofDetails, ReceiptSummary } from '../features/ReceiptParts'
import { TamperPanel } from '../features/TamperPanel'
import { useVerify } from '../features/useVerify'
import { VerifyReportView } from '../features/VerifyReportView'
import { useAppState, useNow, useStore } from '../store/context'
import type { StoredReceipt } from '../store/state'
import { ActionBadge, AnchorBadge } from '../ui/bits'
import { EVENT_LABEL, downloadJson, formatDateTime, shortHash } from '../ui/format'

function VerifyBox({ receipt }: { receipt: StoredReceipt }) {
  const store = useStore()
  const verify = useVerify()
  return (
    <div className="side-card">
      <div className="side-card__head">
        <h2 className="title-s">직접 검증</h2>
        <button type="button" className="btn btn--blue btn--compact" onClick={() => void verify.run(store.bundle(receipt))} disabled={verify.running}>
          {verify.report ? '다시 검증' : '검증하기'}
        </button>
      </div>
      {verify.report ? (
        <VerifyReportView report={verify.report} />
      ) : (
        <p className="muted">이 브라우저가 본문 해시를 다시 계산하고, 포함 증명을 따라 원장에 기록된 root와 비교합니다. 서버의 성공 문구에 기대지 않습니다.</p>
      )}
    </div>
  )
}

export function ReceiptDetailPage() {
  const { receiptId = '' } = useParams()
  const store = useStore()
  useAppState()
  const now = useNow(1000)
  const receipt = store.receiptById(receiptId)

  if (!receipt) {
    return (
      <section className="band" data-tone="dark">
        <div className="frame inset missing">
          <p className="mono faint">영수증 없음</p>
          <h1 className="title-l">이 브라우저에서 영수증을 찾지 못했습니다</h1>
          <p className="lead">
            영수증 ID <code className="hash">{receiptId}</code>에 해당하는 기록이 이 기기의 저장소에 없습니다. 다른 기기에서 받은 영수증이라면 JSON을 검증기에 붙여 넣어 확인할 수 있습니다.
          </p>
          <div className="btn-row">
            <Link to="/receipts" className="btn btn--blue">
              내 영수증으로
            </Link>
            <Link to="/verify" className="btn btn--outline">
              검증기 열기
            </Link>
          </div>
        </div>
      </section>
    )
  }

  const body = receipt.body
  const status = store.status(receipt, now)
  const epoch = store.epochOf(receipt)
  const bundle = store.bundle(receipt, now)

  return (
    <>
      <PageHero
        label={`${EVENT_LABEL[body.event_kind]} 영수증`}
        title={
          <>
            {body.event_kind === 'DECISION' && '판정 영수증'}
            {body.event_kind === 'APPEAL' && '이의제기 영수증'}
            {body.event_kind === 'REVIEW' && '검토 영수증'}
          </>
        }
      >
        <dl className="hero-facts">
          <div>
            <dt className="mono faint">영수증 ID</dt>
            <dd>
              <code className="hash">{body.receipt_id}</code>
            </dd>
          </div>
          <div>
            <dt className="mono faint">기록 시각</dt>
            <dd>{formatDateTime(body.recorded_at)}</dd>
          </div>
          <div>
            <dt className="mono faint">{body.event_kind === 'REVIEW' ? '최종 조치' : '조치'}</dt>
            <dd>
              {body.event_kind === 'DECISION' && <ActionBadge action={body.payload.policy.action} />}
              {body.event_kind === 'REVIEW' && <ActionBadge action={body.payload.resulting_action} />}
              {body.event_kind === 'APPEAL' && '원래 조치 유지 중'}
            </dd>
          </div>
          <div>
            <dt className="mono faint">봉인 상태</dt>
            <dd>
              <AnchorBadge status={status} />
            </dd>
          </div>
        </dl>
        <div className="btn-row">
          <button
            type="button"
            className="btn btn--outline btn--compact"
            onClick={() => downloadJson(`verimod-receipt-${body.receipt_id}.json`, store.bundle(receipt))}
          >
            영수증 JSON 받기
          </button>
          <Link to={`/verify?receipt=${body.receipt_id}`} className="btn btn--outline btn--compact">
            검증기로 열기
          </Link>
        </div>
      </PageHero>

      <section className="band" data-tone="dark">
        <div className="frame inset progress-band">
          <AnchorProgress status={status} />
          <p className="mono faint">
            {epoch
              ? `시뮬레이션 원장 · epoch #${epoch.record.epoch_id} · block ${epoch.record.anchored_block} · tx ${shortHash(epoch.tx_hash)}`
              : '다음 배치를 기다리는 중 · 발급 후 약 6초 안에 epoch로 묶입니다'}
          </p>
        </div>
      </section>

      <section className="band" data-tone="white">
        <div className="frame detail">
          <div className="detail__main">
            <ReceiptSummary receipt={receipt} />
            <DetailSection title="영수증 본문" note="생성 후 바뀌지 않는 부분입니다. 해시·증명·앵커 정보는 이 안에 넣지 않고 따로 붙입니다.">
              <pre className="code">{JSON.stringify(body, null, 2)}</pre>
            </DetailSection>
            <DetailSection title="해시와 포함 증명">
              <ProofDetails receipt={receipt} bundle={bundle} />
            </DetailSection>
            <DetailSection title="같은 epoch에 묶인 영수증" note="원장에는 이 목록이 아니라 root와 건수만 올라갑니다. 다른 이용자의 영수증 내용은 볼 수 없습니다.">
              <EpochMembers receipt={receipt} />
            </DetailSection>
          </div>
          <aside className="detail__side">
            <VerifyBox key={`verify-${receipt.hash}`} receipt={receipt} />
            <div className="side-card" id="tamper">
              <h2 className="title-s">변조 테스트</h2>
              <TamperPanel key={`tamper-${receipt.hash}`} receipt={receipt} />
            </div>
            {body.event_kind === 'DECISION' && (
              <div className="side-card" id="appeal">
                <h2 className="title-s">이의제기</h2>
                <AppealForm key={`appeal-${receipt.hash}`} decision={receipt} />
              </div>
            )}
          </aside>
        </div>
      </section>

      <section className="band" data-tone="mist">
        <div className="frame inset history">
          <h2 className="title-m">이 판정의 이력</h2>
          <LifecycleTimeline receipt={receipt} />
        </div>
      </section>
    </>
  )
}
