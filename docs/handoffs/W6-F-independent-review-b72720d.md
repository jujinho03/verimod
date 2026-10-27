# W6 F independent review packet — b72720d

대상 리뷰어: T / 설경민

상태: noreply 이력 정리 완료, 원격 push 전

## 1. 고정 커밋과 diff 식별자

역사적 실행 SHA와 noreply 리뷰 SHA 대응:

- `b72720d8074516daaabc18408c36a15c59d452e9` → `50f2061bead31f971df692d78179af27784f0d47`
- `f7cf470414eef0ba803bd796a7eae912113113a4` → `dc9cbae227f899994f2289374b524219783f5305`
- 두 대응 커밋은 각각 tree와 code diff가 동일하며 작성자·커미터 이메일만 GitHub noreply로 바뀌었다.

- 현재 리뷰 SHA: `50f2061bead31f971df692d78179af27784f0d47`
- 커밋 메시지: `test(f): add W6 live RPC recovery evidence`
- stable patch-id: `363e423c4fdf874f5ab8bd146031488681a69160`
- 변경량: 8 files, 332 insertions, 2 deletions

변경 파일:

| 파일 | 상태 | + / - |
|---|---:|---:|
| `docs/evidence/w6-f/20261027/README.md` | A | 26 / 0 |
| `docs/evidence/w6-f/20261027/validation.json` | A | 55 / 0 |
| `docs/progress/W6-F.md` | A | 51 / 0 |
| `frontend/e2e/w6.spec.ts` | A | 158 / 0 |
| `frontend/package.json` | M | 1 / 0 |
| `frontend/playwright.config.ts` | M | 1 / 1 |
| `frontend/playwright.w6.config.ts` | A | 33 / 0 |
| `frontend/tsconfig.w5-tools.json` | M | 7 / 1 |

원격 반영 후 정확한 diff는 다음 명령으로 확인한다.

```bash
git show --no-ext-diff --find-renames 50f2061bead31f971df692d78179af27784f0d47
git show --format= 50f2061bead31f971df692d78179af27784f0d47 | git patch-id --stable
```

## 2. 리뷰 대상과 원본 증거의 공개 경계

- 실행 코드: `frontend/e2e/w6.spec.ts`
- 공개 요약: `docs/evidence/w6-f/20261027/README.md`
- 기계 판독 결과: `docs/evidence/w6-f/20261027/validation.json`
- 경로 비식별 실측 로그: `docs/evidence/w6-f/20261027/rpc-recovery-review.json`
- 원본 Playwright JSON, screenshot, trace는 로컬 절대경로를 포함하므로 공유하지 않는다.
- `private-data/`의 파일 자체는 tracked diff나 이 리뷰 묶음에 포함하지 않는다.

동일 W4 공개 Receipt의 공개 식별자는 receipt hash `0x96684f068edaaec7b2ae8abafdaae40c90c118f2d7bede9e4b0dec2278eed3b6`, 입력 JSON SHA-256 `0b73aa5285934b097c8d4aa564021c64ff5173ac555a3b4c1e61c92085f52235`이다.

Desktop에서 Playwright route abort로 승인 RPC 두 곳만 차단했다. 이는 물리 네트워크 차단이 아니다. 관측 순서는 `VALID → RPC_UNAVAILABLE → VALID`, 실행 시간은 247,530 ms, 초기·복구 재시도는 각각 0이다.

반복 tamper 실행에서는 body 변경 후 `HASH_MISMATCH`를 관측했다. body를 재해시한 뒤 기존 proof가 `INVALID_PROOF`가 되는 단계는 승인 RPC가 세 번 연속 `RPC_UNAVAILABLE`이어서 도달하지 못했다. 따라서 `INVALID_PROOF`는 BLOCKED이며 PASS로 집계하지 않는다. max failure 이후 Mobile emulation 두 사례는 실행되지 않았고 실기기 Mobile QA도 수행하지 않았다.

## 3. 민감정보 및 원본 불변 감사

커밋의 tracked file content에서 private-key PEM, GitHub token, AWS access key, Windows 사용자 절대경로, 계정 이메일은 발견되지 않았다. 테스트 코드에는 증거가 저장될 Git 제외 상대 디렉터리 이름만 있으며, 해당 디렉터리의 내용은 공유 대상이 아니다.

주의: Git commit metadata에는 작성자 이메일이 들어 있다. 공개 원격 push 전에 현재 이메일 노출을 허용할지, GitHub noreply 주소로 로컬 커밋 이력을 다시 작성할지 소유자 결정이 필요하다. 이력 재작성 시 SHA와 patch-id가 바뀌므로 리뷰 기준도 새 SHA로 다시 고정해야 한다.

W4 공개 증거 tree는 부모와 대상 커밋에서 모두 `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`이며 W4 경로 diff는 0개다. 비밀키·원문·salt·운영 DB·신규 트랜잭션은 접근하거나 생성하지 않았다.

## 4. RPC 조회량 최적화 검토

현재 cold verification은 각 JSON-RPC method 앞에서 `eth_chainId`를 다시 호출하고, deployment block부터 head까지 `eth_getLogs`를 10,000 block 단위로 전부 스캔한다. W4 browser 증거의 정상 사례가 80 RPC calls인 주원인이다.

보안 검증을 약화하지 않는 후보는 다음 순서다.

1. 검증 작업 단위 RPC session을 만들고 endpoint별 `eth_chainId`를 한 번 확인한다. failover가 발생하면 새 endpoint에서 chain ID부터 전체 작업을 다시 시작한다.
2. provider 허용 상한 이내에서 log window를 10,000에서 최대 50,000 block으로 확대하되, deployment부터 head까지 전 범위를 계속 스캔하여 중복 Event 거부를 보존한다.
3. 완전 검증된 epoch 결과를 `chain/contract/epoch/txHash/blockHash` 키의 메모리 캐시에 저장한다. 다음 조회에서는 이전 head 이후 범위만 추가 스캔하여 뒤늦게 생긴 중복 Event도 계속 거부한다.
4. 같은 epoch의 동시 요청은 하나의 in-flight Promise로 합친다. 실패 결과나 `RPC_UNAVAILABLE`은 성공 캐시로 저장하지 않는다.
5. 번들의 tx hash/block number/block hash를 이용해 transaction receipt와 canonical block을 먼저 확인하되, 이것으로 전체 Event 중복 검사를 대체하지 않는다.

계속 유지해야 하는 불변식은 승인 TrustProfile, chain ID, publisher, `epochs()` getter, 전체 범위의 단일 `EpochRegistered` Event, 성공 transaction receipt, canonical block hash, root/count/version 일치, minimum confirmations, Merkle inclusion이다. 현 단계에서는 분석만 했으며 제품 코드는 변경하지 않았다.

## 5. 독립 리뷰 요청 범위

T는 새 원격 SHA에서 다음을 확인한다.

1. route abort가 두 승인 RPC host만 차단하고 원본 Receipt digest를 바꾸지 않는지
2. RPC 장애가 tamper/INVALID_PROOF로 오분류되지 않는지
3. 반복 실패와 Mobile 미실행이 PASS로 집계되지 않는지
4. W4 공개 evidence tree와 protocol/security 코드를 변경하지 않았는지
5. sanitized log와 tracked evidence가 원본 결과를 과장하지 않는지

main merge는 이 독립 리뷰 이후 별도 결정한다.
