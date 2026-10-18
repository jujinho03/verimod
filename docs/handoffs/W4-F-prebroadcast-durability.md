# W4 F → T: 송신 전 필수 F SQLite 경계

현재 confirmation 계약: [W4-F-trusted-confirmation.md](W4-F-trusted-confirmation.md). T ecc4edc에 ACK 정규화 수정이 들어 있으며, 아래 T 3444750 결함은 과거 맥락으로 보존합니다. 실제 호스트 연결과 confirmation은 여전히 승인된 실행이 필요합니다.

F 기준: `f157b9aa7506093207e6695cc4b0ff7b83b69088`과 이 브랜치의 F 소유 callback runner.
T 감사 소스: `34447502f8843f1be585b56fb31c51b41c0f2fc7`, `backend/contracts/scripts/fDurabilityGate.ts`와 `register-epoch.ts`.

**T ACK 조합 수정과 승인된 DB 호스트 연결 전까지 BLOCKED.** T는 이제 송신 전 gate를 호출합니다. F는 실제 adapter와 SQLite를 쓰는 로컬 CLI를 제공합니다. 그러나 T의 요청 함수는 camelCase를 반환하고 broadcast gate는 snake_case를 검사하므로, 고정 조합은 유효한 durable F ACK까지 거부합니다. 읽기 전용 고정 T 통합 테스트가 broadcast stub 호출 0회로 이를 재현합니다. 구체적인 T 수정 요청, 비공개 DB 승인/결합, 정확한 T 설정, 배치 선택지, 남은 호스트/송신 후 상태 차단사항은 [F callback 실행 계약](W4-F-durable-callback-runner.md)을 봅니다. 이 작업에서 실제 sender를 실행하지 않습니다.

## F adapter와 필요한 T 순서

`backend/src/senderHandoff.ts`는 `EpochSenderHandoff`를 export합니다. signer, 개인키, RPC client, broadcast 메서드가 없습니다. 같은 신뢰 호스트의 T 소유 통합은 다음을 해야 합니다.

1. 실제 F frozen epoch와 승인된 chain/contract/publisher를 읽습니다. 이 provisional 정책 epoch에 대한 팀의 명시적 승인을 요구합니다.
2. T의 승인된 키 처리 방식으로 정확한 `registerEpoch(uint64,bytes32,uint32,uint16)` 트랜잭션을 준비/서명하고, 비공개 T journal에 저장합니다.
3. **authoritative F DB**에 대해 `persistBeforeBroadcast({ epochId, rawTransaction })`를 호출하고 성공 반환을 기다립니다. 예를 들어 sender가 `EpochSenderHandoff`를 같은 프로세스에서 import해 기존 F `DatabaseSync` 연결을 넘길 수 있습니다. 생성자는 승인된 `SenderTarget`도 요구합니다.
4. adapter는 서명한 sender를 복원하고, Ethereum 트랜잭션 hash를 계산하며, chain `84532`, 수신자, publisher, value 0, 정확한 ABI calldata, epoch ID, root, count, version을 F의 frozen 행과 대조합니다. 미승인되거나 바뀐 트랜잭션은 거부합니다.
5. adapter는 synchronous FULL/EXTRA와 persistent journal을 쓰는 파일 기반 SQLite를 요구하고, raw 트랜잭션/hash/nonce/chain/contract를 `SUBMITTING` 상태로 commit합니다. ACK에는 공개 epoch와 트랜잭션 식별자만 있고 raw bytes는 없습니다.
6. ACK의 hash를 T journal hash와 비교합니다. 이 ACK를 받은 뒤에만 T가 **동일한 bytes**를 송신할 수 있습니다. callback 오류, 충돌하는 재시도, DB 오류, ACK 없음은 송신을 막아야 합니다.
7. 노드가 받아들인 뒤 `markSubmitted`를 저장합니다. 재시작 후에는 저장된 같은 hash/nonce/bytes로 재조정합니다. 전송 호출이 timeout됐다는 이유만으로 대체 epoch, nonce, 트랜잭션을 새로 만들지 않습니다.

F CLI는 이제 이 adapter를 호출합니다. 서명된 raw 트랜잭션을 받는 인증 없는 새 HTTP endpoint는 없습니다. T는 ACK 조합 수정과 승인된 로컬/SSH callback 설정을 맡습니다. F 테스트는 합성 SQLite/비활성 트랜잭션 bytes로 정확한 T gate와 F CLI를 호출하며, 거부/timeout/없음/잘못된 ACK와 송신 0회 검사를 포함합니다.

## 신뢰된 confirmation 반환

T는 F에게 `markConfirmed` 호출을 요청하기 전에 다음을 모두 인증해야 합니다. receipt 성공 상태, 신뢰된 chain/contract/publisher, 트랜잭션 hash, `receipt.to`, block number/hash, canonical `EpochRegistered` event, `epochs()` getter, 정확한 frozen root/count/version, 승인된 confirmation 정책(T profile은 현재 12). root가 같은 기존 epoch도 근거 없는 성공 메시지가 아니라 같은 증거로 재조정해야 합니다.

F는 `SUBMITTING` 시점에 이미 `tx_hash`, `nonce`, `chain_id`, `contract_address`, 비공개 `signed_tx`를 저장합니다. 신뢰된 반환은 `markConfirmed`에 `epochId`, 10진수 `blockNumber`, 소문자 bytes32 `blockHash`를 제공합니다. T는 검증 증거를 비공개로 보관하고 정리된 confirmation 기록만 공개해야 합니다. F 메서드 자체는 온체인 검증기가 아니므로 호출자가 이 계약을 지켜야 합니다.

신뢰된 confirmation 전까지 frozen 공개 bundle은 `proof=null`, `anchor=null`입니다. F는 이제 미확인 행에 준비된 block metadata가 있어도 두 필드를 내보내기 전에 epoch 상태 `CONFIRMED`를 요구합니다. `FAILED` 행은 이 필드를 노출할 수 없습니다.

## 로컬 검증 경계

F adapter 테스트는 고정된 비활성 트랜잭션 서명 bytes, 합성 epoch, 새 임시 SQLite를 씁니다. **서명 0회, RPC/broadcast 호출 0회**입니다. 테스트 범위는 지속 재개방, 같은 bytes replay, 충돌 재시도, 잘못된 chain/publisher/수신자/epoch/root/count/version/calldata/value, 형식 오류/미서명 envelope, SQLite durability 비활성, 공개 raw-byte 제외, 동시 freeze, EMPTY_EPOCH, 미확인 bundle 보류입니다.

이 테스트는 로컬 F callback과 T wire parser 호환성을 확인합니다. 고정 T gate 조합이 여전히 실패한다는 것도 증명하며, 보여준 wire 형태 bridge는 제안한 T 수정일 뿐 운영 T 변경이 아닙니다. 사용자는 실제 A 호스트 frozen epoch를 보고했지만 그 비공개 DB에 여기서 접근할 수 없으므로, 실제 호스트 결합과 송신 후 전파는 BLOCKED로 남습니다. 그 보고에서 confirmation 상태를 추론하지 않습니다.
