# W4 F 최종 통합 준비·검증 — 2026-10-16

담당: 노유신(F). **로컬 회귀 64/64 PASS. 신규 실제 R01 발급·Freeze와 T 송신 연결은 BLOCKED.**

## 고정 기준과 기존 결과

- A: [`9bcbec677d89d10364b327aae7e60955e2e4315d`](https://github.com/jujinho03/verimod/commit/9bcbec677d89d10364b327aae7e60955e2e4315d). [독립 재검증 증빙](https://github.com/jujinho03/verimod/blob/9bcbec677d89d10364b327aae7e60955e2e4315d/docs/evidence/w4-a-final-revalidation.md)을 읽었다. 실제 FULL/TRUNCATED 2건, Fail Closed 17/17, parity 21/21, issuer MATCH, 당시 F 회귀 51/51의 기존 PASS를 보존한다. 해당 실행은 epoch를 만들지 않았으며 그 임시 DB를 이번 F DB로 전용하지 않았다.
- F Manifest 기준: `2c99260c0eb6229d34b3f94191c2dab3238c1727`.
- 이번 게시 코드·사전 점검·최종 회귀 기준 F: [`6e53bc8de9e165a257a7e8f98c1a86a6432b42e2`](https://github.com/jujinho03/verimod/commit/6e53bc8de9e165a257a7e8f98c1a86a6432b42e2). 이후 이 결과 디렉터리를 추가하는 증거 커밋은 실행 코드 변경을 포함하지 않는다.
- T: `fbcb3e9e99ae8dda2f9c70a32f35ec2c039b73de`. issuer 정렬 `60600d50174749f24f54b87b5f9d4a7b79775304`의 조상 관계를 확인했다. T/main/A 브랜치를 변경하거나 병합하지 않았다.
- 게시 브랜치: `f-w4-service-verifier` (2026-10-18 main 병합 후 브랜치 정리; 마지막 커밋 [`c1f750e`](https://github.com/jujinho03/verimod/tree/c1f750ea3752037d749324f1535df051ce6b37f9)). 터미널 credential helper가 실행되지 않아 로그인된 GitHub 웹 업로드로 반영한 뒤 fetch와 diff로 로컬 검증 코드와의 내용 일치를 확인했다.

## 실제 환경과 최종 상태

F 체크아웃에서 A 소스가 정의한 selected R01 `model.safetensors`와 `ai/.venv/Scripts/python.exe`가 존재하지 않았다. 알려진 AI-09 `127.0.0.1:8099/healthz`도 `ECONNREFUSED`였다. 별도 A 호스트의 localhost를 F 호스트로 간주하지 않았다. 실제 모델 실행에 필요한 A 체크아웃 경로가 이 호스트에 제공되지 않아 사전 점검에서 실행을 닫았다.

| 구분 | 결과 | 근거·다음 조건 |
|---|---|---|
| ACTUAL_R01_ISSUANCE | BLOCKED | 이번 실행 신규 실제 모델 Receipt **0건**. A R01 호스트에서 새 실행 필요 |
| EPOCH_FREEZE | BLOCKED | 새 실제 Receipt가 없어 authoritative Freeze 실행 없음. 실제 root/count/member 값 없음 |
| F_T_HANDOFF | BLOCKED | 실제 `frozen-epoch-handoff.json` 미생성. 실행 도구·스키마·A 요청서는 준비됨 |
| PRE_BROADCAST_DURABILITY | BLOCKED | F 저장 adapter 로컬 검증 PASS, T의 기존 sender는 F DB 확인값을 기다리지 않음 |
| PUBLIC_CHAIN | NOT_EXECUTED | 실제 서명 0, broadcast 0, Base Sepolia 송신 0 |

실행 결과는 [execution-status.json](execution-status.json)에 있다. F commit/clean/code identity, Model Manifest, Policy Manifest, T issuer 소스 연결은 PASS이며 A 경로·Python·weight 조건은 BLOCKED다. 도구는 실제 발급/Freeze를 시작하지 않았다. 채워진 가짜 인계 JSON이나 과거 root를 생성하지 않았다.

## 완료한 독립 작업과 변경 이유

| 변경 파일 | 이유·검증 범위 |
|---|---|
| `backend/src/senderHandoff.ts` | 새 F `EpochSenderHandoff.persistBeforeBroadcast` 인터페이스. 서명된 bytes를 오프라인 해석해 recovered publisher, chain 84532, 계약, value=0, 정확한 registerEpoch calldata와 DB epoch/root/count/version을 대조한다. 파일 SQLite의 FULL/EXTRA synchronous 및 지속 journal을 요구하고 SUBMITTING raw/hash/nonce를 커밋한 뒤 확인값을 반환한다. signer/RPC/broadcast 없음 |
| `backend/src/epochs.ts` | anchor 필드가 채워졌더라도 **CONFIRMED 상태**여야 proof/anchor를 공개하도록 상태 조건 1개 추가 |
| `backend/scripts/w4-final-integration.mts` | A 호스트에서 실행할 실제 모델 전용 도구. A/F/T SHA, weight·manifest·서비스 health를 확인하고 새 F 서버·DB에 FULL/TRUNCATED 발급, replay/409, Freeze, 독립 Merkle 계산, 재개방, 공개 범위와 인계 JSON을 검사한다. fixture 실행 모드 없음. 실제 happy path는 이번 호스트에서 미실행 |
| `backend/test/w4-freeze-handoff.test.ts` | 새 13개 로컬 회귀: HTTP freeze 동시성·멱등성·EMPTY_EPOCH·순서·독립 root·재시작, SUBMITTING 영속 저장/replay/충돌, tx 필드 불일치 거부, unsigned/malformed 거부, durability OFF 거부, raw bytes 비공개, 미확인 상태 Bundle 공개 거부 |
| `backend/package.json`, `package-lock.json`, `tsconfig.w4-tools.json` | T와 같은 ethers 6.17.0을 서명 tx 오프라인 해석에 사용. 통합 실행 및 도구 typecheck 명령 추가 |
| `docs/handoffs/W4-F-actual-host-run-request.md` | A의 기존 private R01 호스트에서 실행할 경로·전제조건·정확한 PowerShell 명령과 반환 자료 |
| `docs/handoffs/W4-F-prebroadcast-durability.md` | T의 현재 간극, 필수 F callback 순서, 재시작·확인·공개 Bundle 계약 |
| `docs/handoffs/W4-F-frozen-epoch.schema.json` | 실제 인계 JSON의 필수 필드·제약. 실행 결과가 아닌 스키마임을 명시 |
| 이번 결과 디렉터리 | 기존 증거를 덮어쓰지 않고 상태·소스 감사·회귀 요약 저장 |

F 기존 `inference.ts`, 모델/정책 설정 JSON 및 shared `receipt.ts`는 Manifest 기준 SHA 대비 변경 없음이다. 승인 issuer는 `verimod-example-platform`을 유지했다. 정책은 **W4_PROVISIONAL_E2E_ONLY, team_approved=false**, X/B 미승인이다.

## 회귀 결과와 공개 범위

게시 코드 기준 `npm run typecheck`, `npm run w4:typecheck`, `npm run build` 모두 PASS. `npm test -- --reporter=json`은 **8개 파일, 64/64 PASS, 실패 0**이며 기존 51개와 신규 13개를 포함한다. 기존 A/Python 기대 벡터 21개와 F 평가기의 일치 회귀도 통과했다. [regression-summary.json](regression-summary.json)에 파일별 결과와 시각을 기록했다.

처음 지정한 외부 temp 폴더는 이 세션의 OS 쓰기 권한 때문에 생성되지 않아 Vitest가 시작 전에 EPERM으로 중단됐다. 실제 테스트는 실행되지 않았으며 PASS로 세지 않았다. 허용된 Git ignored private temp로 바꾼 후 정상 회귀와 최종 JSON 회귀를 완료했다. 로컬 SQLite·테스트 원본 로그는 private 경로에만 보관한다.

새 로컬 회귀는 합성 DB 및 고정 inert 서명 bytes만 사용하며 실제 서명·네트워크 호출이 없다. 이를 실제 R01 발급/Freeze 실적으로 계산하지 않는다. public epoch 응답의 raw signed bytes 제외와 FROZEN/SUBMITTING/SUBMITTED/FAILED 상태의 proof=null, anchor=null을 검사했다. 신규 실제 Frozen Bundle 공개 검증은 A 호스트 도구 실행에 남아 있다.

## T 소스 감사와 남은 담당 작업

[source-audit.json](source-audit.json)에 pinned 소스 digest와 결과를 기록했다. T `BASE_SEPOLIA_DEMO`와 `baseSepoliaProfileFromEnv()`가 shared ISSUER_ID를 사용하고, 이전 issuer는 거부 테스트에만 남아 있다. verifier의 issuer mismatch → UNTRUSTED_ANCHOR 경계는 유지된다. T 소스를 수정하지 않았다.

T `register-epoch.ts`의 실제 흐름은 `writeJournal(journal)` 다음 `broadcastTransaction(journal.rawTransaction)`이다. F SQLite 저장 함수나 확인값을 기다리는 호출은 없다. **자체 journal을 F DB 영속성으로 간주할 수 없으므로 송신 전 통합은 BLOCKED다.** F adapter가 준비됐다는 사실만으로 기존 T CLI가 안전하게 연결됐다고 주장하지 않는다.

1. **A:** [A 호스트 실행 요청서](../../../handoffs/W4-F-actual-host-run-request.md)의 명령으로 신규 실제 발급 2건과 Freeze를 수행하고 새 공개 결과만 전달한다. 새 F 코드는 기존 A 재검증 이후 추가됐으므로 이 도구의 실제 happy path와 변경 F SHA 재검증은 아직 필요하다.
2. **T:** [송신 전 영속성 계약](../../../handoffs/W4-F-prebroadcast-durability.md)에 따라 F DB callback을 sender에 연결하고, callback 실패/미응답에서 zero broadcast임을 자신의 stub로 검증한다. frozen epoch ID의 실제 온체인 충돌 여부도 송신 전에 확인한다.
3. **팀:** 이 잠정 정책 epoch의 전송 승인과 X/B·운영 정책 결정을 별도로 관리한다. 이번 준비 작업은 전송 승인이 아니다.
4. **향후 T→F:** 신뢰된 tx receipt/event/getter/root/count/version 및 승인 confirmation 확인 후 tx hash, chain/contract, block number/hash를 반환한다. 그때 F가 CONFIRMED를 저장하고 공개 proof/anchor를 내보낸다. 현재 실제 CONFIRMED 저장은 수행하지 않았다.

이 문서와 실행 요청서는 저장소 산출물로 준비했다. 별도 사람·채팅에 메시지를 발송하지 않았다. TEST 접근·재학습·AI-21 전체 재추론·W5 정책 LOCK은 수행하지 않았다.
