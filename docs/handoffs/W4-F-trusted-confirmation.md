# W4 F 신뢰된 confirmation — 한국어 계약·운영 안내

F `c1f750ea3752037d749324f1535df051ce6b37f9` 기준입니다.
[소스 원문](https://github.com/jujinho03/verimod/blob/c1f750ea3752037d749324f1535df051ce6b37f9/docs/handoffs/W4-F-trusted-confirmation.md)을
보존하며 T journal의 SUBMITTED나 단순 mined receipt를 F의 CONFIRMED로 간주하지 않습니다.
실제 A 원본 DB의 confirmation·실제 RPC 검증은 아직 미실행입니다.

## 승격 전 독립 확인

F의 trustedConfirmation은 다음을 검증합니다.

1. 별도 호스트 confirmation 승인과 실제 DB/epoch binding, 지속 journal/synchronous FULL 이상.
2. 저장된 동일 signed tx/hash/nonce, recovered publisher, chain 84532, 승인 contract,
   zero value와 exact registerEpoch calldata/epoch/root/count/version.
3. RPC transaction과 성공 receipt의 hash/from/to/block/index 및 canonical block 내 포함.
4. 승인 계약의 정확한 EpochRegistered 한 개, removed=false, ABI/topic/data·모든 epoch 값.
5. **receipt block hash에 requireCanonical=true로 고정한** publisher()/epochs() 결과.
6. `head - receiptBlock + 1`로 최소 12 confirmations. 승인 정책은 늘릴 수 있으나 낮추지 않음.
7. chain/transaction/receipt/block/head/getter 재조회에서 reorg/불일치가 없고, DB write lock
   아래 최초 epoch/member snapshot도 유지되는지 확인.

EIP-1898 미지원은 실패로 처리하고 latest/블록 번호로 강등하지 않습니다. 승인 RPC는
신뢰 의존성입니다. 재조회는 관측된 모순을 찾지만 일관되게 거짓을 말하는 provider나
미래의 모든 deep reorg를 배제하는 합의 증명은 아닙니다.

## 저장과 공개 경계

기존 schema v2 DB에서 승인된 confirmation 성공 시 epoch_confirmation_evidence를
생성합니다. state/evidence는 같은 트랜잭션으로 저장되며 evidence 실패는 승격을 rollback합니다.
binding/digest는 epoch/member/tx/대상/블록/publisher와 비공개 raw bytes digest를 고정합니다.
raw bytes·DB/config 경로는 공개 ACK에 넣지 않습니다.

Bundle은 CONFIRMED 문자열만으로 proof/anchor를 내보내지 않습니다. 일치하는 verifier
evidence와 release_valid가 필요합니다. 기존 CONFIRMED의 재검증은 RPC 전에 release를
차단하고 성공한 동일 확인 후에만 다시 엽니다. 실패/timeout/모순이면 공개 자료를 보류하며
이전 신뢰 블록 기록을 덮어쓰지 않습니다. 브라우저 GET마다 live RPC를 호출하는 구조는 아닙니다.

## 승인된 미래 실행 순서

F durable prepare ACK → T 동일 bytes 송신 → node acceptance를 독립 확인한 F submitted
→ 12 이상 depth와 별도 confirmation 승인 → A 로컬 F confirmed → DB reopen/evidence/
public release 확인 순서입니다. T에 후속 호출 기능을 추가하지 않아도 A가 운영할 수 있습니다.

config의 allow_confirmed_return, confirmation_approval_id, minimum_confirmations,
rpc_url은 보호된 호스트 운영값입니다. 기본 비활성이고 이번 문서 작업에서 설정하지 않았습니다.
confirmed는 T가 준 receipt JSON을 신뢰 입력으로 받지 않고 DB에 저장된 tx를 독립 조회합니다.

성공 stdout은 epoch_id/status=CONFIRMED/tx_hash/block_number/block_hash/confirmations/
minimum_confirmations입니다. 실패는 nonzero exit, 빈 stdout, 정제된 stderr입니다.
F verifier window 12초와 시작 시간을 수용하는 별도 운영 timeout이 필요합니다.
T의 15초 **사전 ACK** 명령을 confirmation 명령으로 바꾸면 안 됩니다.

## 현재 증거

[192개 검사](../evidence/w4-f-confirmation/20261017/README.md)는 합성 SQLite와 inert
signature/RPC stub 범위입니다. 실제 Windows CLI/API 검사와 외부 브라우저·공개 체인을
구별합니다. 실제 A DB CONFIRMED=NO, 실제 Epoch 송신=NO, GATE-4=PARTIAL입니다.
