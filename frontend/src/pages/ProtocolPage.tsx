import { useEffect, useState } from 'react'
import type { Hex32 } from '../domain/hash'
import { LABEL_NAMES, MODEL_MANIFEST, POLICY_MANIFEST, manifestHashes, type ManifestHashes } from '../domain/manifests'
import { MERKLE_SPEC } from '../domain/merkle'
import { LABEL_IDS, PROTOCOL_VERSION } from '../domain/types'
import { REQUIRED_CONFIRMATIONS, type TrustConfig } from '../domain/verify'
import { PageHero } from '../features/PageHero'
import { thresholdsOf } from '../features/ScoreBars'
import { REPO_URL } from '../site/nav'
import { BATCH_WINDOW_MS, SIM_CHAIN, trustConfig } from '../store/ledger'
import { ArrowLink, CodeBadge, HashText } from '../ui/bits'
import { CODE_INFO, formatPpm } from '../ui/format'
import type { VerifyCode } from '../domain/verify'

const TOC = [
  ['receipt', 'Decision Receipt'],
  ['hash', '해시와 도메인 분리'],
  ['merkle', 'Merkle 배치'],
  ['anchor', 'Epoch 앵커'],
  ['codes', '검증 결과 코드'],
  ['policy', '정책과 기준값'],
  ['simulation', '시험 버전의 합성 요소'],
] as const

export function ProtocolPage() {
  const [hashes, setHashes] = useState<ManifestHashes | null>(null)
  const [trust, setTrust] = useState<TrustConfig | null>(null)

  useEffect(() => {
    void manifestHashes().then(setHashes)
    void trustConfig().then(setTrust)
  }, [])

  const live = (value: Hex32 | undefined) => (value ? <HashText value={value} /> : <span className="faint">계산 중</span>)

  return (
    <>
      <PageHero label="Protocol · 규칙" title="영수증을 만들고 검증하는 규칙">
        <p>
          이 페이지의 규칙은 팀 합의 전 제안(PROPOSED v0.1)을 시험 구현한 것입니다. 확정된 JSON Schema나 컨트랙트 ABI가 아니며, 공통 테스트 벡터로 교차 검증하기 전까지 상호운용을 주장하지 않습니다.
        </p>
        <ArrowLink to={`${REPO_URL}/blob/main/docs/01-domain-and-interfaces.md`} external>
          인터페이스 제안서 원문
        </ArrowLink>
      </PageHero>

      <section className="band" data-tone="mist"><div className="frame docs">
        <div>
          <h2>Implemented today</h2>
          <p>브라우저 Receipt 생성, 제한형 canonical hashing, SHA-256, Merkle proof, 변조 탐지와 연결 이력 계산.</p>
          <h2>Simulated today</h2>
          <p>키워드 점수는 UNCALIBRATED synthetic score입니다. chain 31337의 주소·publisher·tx·block·confirmations와 reviewer 역할은 simulation입니다. 실제 외부 원장이나 인증된 사람 검토가 아닙니다.</p>
          <h2>Next integration</h2>
          <p>공통 protocol 모듈 합의, authoritative backend·접근 통제 저장, 실제 AI 평가, epoch contract·EVM testnet·독립 chain reader. 현재 원문·salt·appeal 본문은 localStorage에 평문으로 보관하며 production secure storage가 아닙니다.</p>
        </div>
      </div></section>

      <section className="band" data-tone="white">
        <div className="frame docs">
          <nav className="docs__toc" aria-label="이 페이지 목차">
            <div className="docs__toc-inner">
              <p className="mono faint">목차</p>
              {TOC.map(([id, label]) => (
                <a key={id} href={`#${id}`}>
                  {label}
                </a>
              ))}
            </div>
          </nav>

          <div className="docs__body">
            <section className="docs-section" id="receipt">
              <h2 className="title-m">Decision Receipt</h2>
              <p className="muted">판정·이의제기·검토를 같은 틀의 불변 본문으로 기록합니다. 본문은 생성 후 고치지 않고, 바뀐 사실은 새 영수증으로 남깁니다.</p>
              <div className="table-wrap">
                <table className="table table--static">
                  <thead>
                    <tr>
                      <th>필드</th>
                      <th>규칙</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['protocol_version', `"${PROTOCOL_VERSION}". 모르는 버전은 거부합니다.`],
                      ['receipt_id', '무작위 UUID v4, 소문자'],
                      ['issuer_id', '공개 플랫폼 식별자. 개인 사용자 ID는 넣지 않습니다.'],
                      ['event_kind', 'DECISION / APPEAL / REVIEW'],
                      ['recorded_at', 'YYYY-MM-DDTHH:mm:ss.SSSZ. 발급자가 주장하는 기록 시각입니다.'],
                      ['content_commitment', 'SHA-256(verimod:content:v1 ‖ 0x00 ‖ salt32 ‖ UTF-8 원문)'],
                      ['subject_receipt_hash', '최초 판정은 null, 이의제기·검토는 최초 판정의 해시'],
                      ['previous_receipt_hash', '이의제기는 판정, 검토는 이의제기 또는 직접 검토한 판정의 해시'],
                      ['payload', '사건 종류별로 정해진 필드만 허용합니다.'],
                    ].map(([field, rule]) => (
                      <tr key={field}>
                        <td>
                          <code className="hash">{field}</code>
                        </td>
                        <td>{rule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="docs-grid">
                <div>
                  <h3 className="title-s">본문에 넣는 것</h3>
                  <ul className="plain-list">
                    <li>DECISION: 추론 출력(scores_ppm, 모델 manifest 해시, 근거 구간)과 정책 조치</li>
                    <li>APPEAL: 이의제기 본문의 commitment와 사유 코드</li>
                    <li>REVIEW: 결과, 최종 조치, 사유 코드, 검토 정책 manifest 해시</li>
                  </ul>
                </div>
                <div>
                  <h3 className="title-s">본문에 넣지 않는 것</h3>
                  <ul className="plain-list">
                    <li>자기 자신의 해시, Merkle 증명, epoch ID, tx hash, 확인 횟수, 검증 상태</li>
                    <li>원문, salt, 이의제기 본문, 검토자 개인정보</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="docs-section" id="hash">
              <h2 className="title-m">해시와 도메인 분리</h2>
              <p className="muted">
                본문을 키 정렬·공백 없는 JSON으로 직렬화한 뒤 용도별 도메인 문자열과 0x00을 앞에 붙여 SHA-256을 계산합니다. 시험 구현은 문자열·안전 정수·불리언·null·배열·객체만 받으며 RFC 8785 전체 호환을 주장하지 않습니다.
              </p>
              <dl className="kv">
                <dt>receipt_hash</dt>
                <dd>
                  <code className="hash">SHA-256("verimod:receipt:v1" ‖ 0x00 ‖ canonical(body))</code>
                </dd>
                <dt>모델 manifest</dt>
                <dd>{live(hashes?.model)}</dd>
                <dt>정책 manifest</dt>
                <dd>{live(hashes?.policy)}</dd>
                <dt>검토 정책 manifest</dt>
                <dd>{live(hashes?.review)}</dd>
                <dt>issuer commitment</dt>
                <dd>{live(trust?.issuer_commitment)}</dd>
              </dl>
              <p className="muted small">위 manifest 해시는 이 페이지를 열 때 브라우저가 아래 manifest JSON으로 직접 계산한 값입니다.</p>
            </section>

            <section className="docs-section" id="merkle">
              <h2 className="title-m">Merkle 배치</h2>
              <ul className="plain-list">
                <li>epoch는 receipt_id ASCII 오름차순으로 동결한 목록입니다. receipt_id나 해시가 겹치면 거부합니다.</li>
                <li>
                  leaf = SHA-256(0x00 ‖ receipt_hash 32바이트), 내부 노드 = SHA-256(0x01 ‖ left ‖ right). 트리 분할과 포함 증명은 RFC 9162 §2.1을 따릅니다.
                </li>
                <li>홀수 leaf를 복제하거나 쌍을 정렬하지 않습니다. 단일 leaf의 증명은 빈 배열이고, 빈 epoch는 커밋하지 않습니다.</li>
                <li>경로 모양이 같은 트리 크기는 root만으로 구분되지 않으므로, 증명의 tree_size를 원장의 receipt_count와 반드시 따로 대조합니다.</li>
              </ul>
              <dl className="kv">
                <dt>merkle_spec</dt>
                <dd>
                  <code className="hash">{MERKLE_SPEC}</code>
                </dd>
                <dt>proof 필드</dt>
                <dd>leaf_index, tree_size, siblings (leaf에서 root 방향)</dd>
              </dl>
            </section>

            <section className="docs-section" id="anchor">
              <h2 className="title-m">Epoch 앵커</h2>
              <p className="muted">원장에는 epoch 번호, root, receipt 수, protocol version만 기록합니다. 원문·영수증 목록·개인정보는 올리지 않습니다.</p>
              <dl className="kv">
                <dt>등록 입력</dt>
                <dd>
                  <code className="hash">registerEpoch(epoch_id, root, receipt_count, protocol_version)</code> <span className="faint">논리 인터페이스 제안</span>
                </dd>
                <dt>봉인 단계</dt>
                <dd>발급 → 배치 포함 → 트랜잭션 제출 → 블록 확인 → 앵커 확인</dd>
                <dt>확정 기준</dt>
                <dd>블록 확인 {REQUIRED_CONFIRMATIONS}회</dd>
                <dt>체인</dt>
                <dd>
                  {SIM_CHAIN.chain_id} <span className="faint">{SIM_CHAIN.name}</span>
                </dd>
                <dt>컨트랙트</dt>
                <dd>
                  <code className="hash">{SIM_CHAIN.contract_address}</code>
                </dd>
              </dl>
              <p className="muted small">
                검증기는 영수증에 적힌 앵커 위치를 믿지 않고 미리 정한 체인·컨트랙트·발급자만 조회합니다. RPC 공급자와 체인 확정성에 대한 신뢰 가정은 남습니다.
              </p>
            </section>

            <section className="docs-section" id="codes">
              <h2 className="title-m">검증 결과 코드</h2>
              <div className="table-wrap">
                <table className="table table--static">
                  <thead>
                    <tr>
                      <th>코드</th>
                      <th>의미</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(CODE_INFO) as VerifyCode[]).map((code) => (
                      <tr key={code}>
                        <td>
                          <CodeBadge code={code} />
                        </td>
                        <td>
                          <strong>{CODE_INFO[code].title}</strong>
                          <br />
                          <span className="muted">{CODE_INFO[code].description}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted small">
                manifest·원문 commitment·이의제기 연결은 통과 / 실패 / 확인 안 함으로 따로 표시합니다. 선행 기록을 찾지 못하면 이력 불완전으로 표시하고 완전한 이의제기 검증 성공을 보여주지 않습니다.
              </p>
            </section>

            <section className="docs-section" id="policy">
              <h2 className="title-m">정책과 기준값</h2>
              <p className="muted">
                아래 라벨과 수치는 합성 예시입니다. 실제 지원 라벨과 threshold는 데이터와 평가를 거쳐 정해야 하며, 기획서의 허위정보 항목은 사실 검증 범위가 달라 넣지 않았습니다.
              </p>
              <div className="table-wrap">
                <table className="table table--static">
                  <thead>
                    <tr>
                      <th>라벨</th>
                      <th>검토 보류 기준</th>
                      <th>제한 기준</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LABEL_IDS.map((label) => {
                      const t = thresholdsOf(label)
                      return (
                        <tr key={label}>
                          <td>
                            {LABEL_NAMES[label]} <span className="mono faint">{label}</span>
                          </td>
                          <td>{formatPpm(t.review)} 이상</td>
                          <td>{formatPpm(t.restrict)} 이상</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="muted small">우선순위: 입력이 잘리면 먼저 검토 보류 → 제한 기준 → 검토 기준 → 승인. 추론 실패는 가짜 승인으로 만들지 않고 오류로 돌려줍니다.</p>
              <div className="docs-grid">
                <div>
                  <h3 className="title-s">정책 manifest</h3>
                  <pre className="code">{JSON.stringify(POLICY_MANIFEST, null, 2)}</pre>
                </div>
                <div>
                  <h3 className="title-s">모델 manifest</h3>
                  <pre className="code">{JSON.stringify(MODEL_MANIFEST, null, 2)}</pre>
                </div>
              </div>
            </section>

            <section className="docs-section" id="simulation">
              <h2 className="title-m">시험 버전의 합성 요소</h2>
              <div className="docs-grid">
                <div>
                  <h3 className="title-s">브라우저가 실제로 계산하는 것</h3>
                  <ul className="plain-list">
                    <li>정규 직렬화와 SHA-256 영수증 해시</li>
                    <li>salt를 더한 원문·이의제기 commitment</li>
                    <li>Merkle root와 포함 증명, 증명 검증</li>
                    <li>형식 검사, 신뢰 앵커 대조, 확정 대기 판단</li>
                    <li>이의제기·검토의 연결 규칙 검사</li>
                  </ul>
                </div>
                <div>
                  <h3 className="title-s">합성인 것</h3>
                  <ul className="plain-list">
                    <li>점수: 키워드 일치 기반 합성 점수기. 실제 AI 모델이 아닙니다.</li>
                    <li>라벨과 threshold 수치: 평가를 거치지 않은 예시 값</li>
                    <li>원장: 브라우저 안의 시뮬레이션. chain_id·주소·tx hash는 합성 값이고 블록은 1초마다 생깁니다.</li>
                    <li>배치: 발급 후 {BATCH_WINDOW_MS / 1000}초 대기, 같은 epoch의 다른 영수증은 내용이 없는 합성 해시</li>
                    <li>시드 영수증 5건과 검토자 권한 확인 없음</li>
                    <li>저장: 이 브라우저의 localStorage. 서버에 보내지 않습니다.</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </>
  )
}
