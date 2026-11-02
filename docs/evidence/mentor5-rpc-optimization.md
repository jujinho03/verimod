# Mentor 5 — RPC 최적화와 보안 의미

결론: 기존 엄격한 전체 구간 검색을 유지한다. 번들의 거래 locator만 읽는 빠른 후보는 **SECURITY_SEMANTICS_CHANGE**이며 이 작업에서 기존 `VALID` 경로로 채택하지 않았다. 성능 개선 및 개선율은 **NOT_VERIFIED**이다. 측정치는 [기준 측정](mentor5-rpc-baseline.md)에 있다.

## 현재 구현의 실제 성질

`rpcLedger.ts`는 승인된 profile의 체인 ID를 각 논리적 호출 직전에 검사하고 publisher getter, epoch getter, deployment부터 고정된 head까지 50,000블록 단위의 전체 로그 검색, 반환된 로그 하나와 getter의 root/count/version 일치, 성공한 거래 receipt의 `to`·block number·block hash를 확인한다. 반환된 로그가 정확히 하나가 아니면 fail closed한다. 별도의 `blockNumber()`로 확인 수를 검사하며 Base profile은 12 L2 confirmations를 요구한다. 이는 L1 finality가 아니다. chainId 검사 결과를 캐시하면 중간 체인 변경 검출 보장이 줄어든다. 경로는 provider가 완전하고 정직한 로그 필터 결과를 반환한다는 전제 아래 해당 검색 범위에서 중복을 탐지한다. 서로 다른 endpoint는 장애 시 순차 fallback이며 응답 교차 합의가 아니다.

현재 코드는 RPC가 반환한 각 로그의 `address`·`topics`·범위 및 거래 receipt의 `logs` 포함 여부를 독립적으로 재검증하지 않고, provider의 필터 결과에 의존한다. receipt 검사에서 송신자 `from`을 확인하는 것이 아니라 컨트랙트의 `publisher()` 값을 확인한다. 같은 응답의 블록 해시 일치도 정직한 canonical 체인을 암호학적으로 입증하지 않는다. 이런 제약 때문에 악의적 또는 일관되게 잘못 응답하는 RPC는 위 검사의 일부를 속일 수 있다. 최신 상태 getter와 고정 head 검색, 이후 head 조회가 원자적 스냅샷이 아니므로 reorg나 endpoint 전환의 영향도 남는다. 테스트나 문서에서 이 구현을 RPC 불신 검증으로 설명하지 않는다.

## 거래 locator 후보

승인된 체인과 contract 및 publisher를 별도 확인하고, 번들의 tx hash/block number/hash를 신뢰 루트가 아닌 조회 힌트로 사용하여 실제 거래 receipt, 해당 이벤트, getter, epoch ID/root/count/version, 확인 수를 대조할 수 있다. 이때 거래의 성공 여부, 목적지와 발신자, 이벤트의 주소와 topic, receipt 내 포함 및 block hash, 현재 canonical block과의 관계를 확인해야 한다. 조회된 block에 대한 reorg·서로 다른 시점의 상태 및 fallback endpoint 불일치를 다뤄야 한다. 해당 검색은 다른 블록의 중복 이벤트를 현재 전체 스캔과 같은 방식으로 검사하지 못한다. 명세·신뢰 규칙의 승인 없이 기존 결과에 동등한 `VALID`로 대체하지 않는다.

`VeriModAnchor.sol`은 immutable `publisher`에만 등록을 허용하고, 이미 count가 존재하는 epoch에 대해 `EpochExists`로 재등록을 거부한다. 이 제약은 올바른 배포 코드와 정직한 체인 실행을 전제로 강력하지만, RPC가 제공한 로그 전체의 완전성과 canonical 상태를 검증하는 것과는 별개다. 새 경로를 채택하려면 이 전제와 전체 구간 중복 탐지의 차이를 명시적으로 승인하고 악성 응답·reorg·chain switch·변조 회귀 및 실제 전후 측정을 수행해야 한다. ABI, 컨트랙트, TrustProfile 및 프로토콜은 변경하지 않았다.
