# HTTP 451 VeriMod — 5회차 멘토링 기술 보고 초안

기준: 2026-10-30 조회 시 main `a3f9b25437b4bfb1143c0fceb49d8223b868d3ad`, F 후보 PR #37 HEAD `16880b45`. 이후 병합·리뷰 결과는 발표 직전에 재확인한다.

## 구현과 검증

- **무결성:** W4 Epoch 1은 실제 Base Sepolia에 앵커됐고 기존 공개 Receipt 검증 증거가 있다. W4 공개 증거 tree `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`는 기준 main에서 불변이다. 온체인 일치는 기록과 proof의 무결성을 뜻하며 AI 분류의 정확도를 보장하지 않는다.
- **팀 통합:** A/F/T의 W6 최초 PR #31·#32·#33은 main에 반영됐다. #36은 Windows 보안 테스트 보강이 병합됐으며 병합 전 독립 승인 없이 병합된 사실과 후속 독립 감사는 구분한다. #34와 #35는 F의 독립 승인 후 일반 병합됐고 각 main CI 세 job이 성공했다. #37은 미병합 후보이며 발표 직전 GitHub 상태를 확인한다.
- **Windows 보안:** SEC-W5-01은 Windows 경로에서 fail-closed를 검증했다. 53개 SKIP 및 writable callback UNSUPPORTED는 유지한다. 비 Windows 테스트와 실사용 지원 완료를 의미하지 않는다.
- **RPC 보안:** 성공한 chain ID를 캐시한 후보에서 검증 중 체인 전환이 탐지되지 않는 회귀를 발견해 수정을 요청했다. 수정 후보는 각 논리 RPC 전에 chain ID를 다시 확인한다. A는 수정에도 기여했으므로 독립 제3자의 전문 보안 승인으로 표현하지 않는다. 검증과 데이터 요청 사이 TOCTOU 한계는 남는다.
- **새 실측(F 공개 보고):** 수정 후보 `d90335b4`에서 동일 W4 Receipt 10회 중 8 VALID, 2 RPC_UNAVAILABLE, 0 SKIP. 10회 연속 성공은 NOT_MET이다. body 변경은 HASH_MISMATCH, rehash와 기존 proof/root 조합은 INVALID_PROOF로 보고됐다. 원본 private 실행 로그는 독립 검증하지 않았다. 결과는 실행 후보 보고이며 아직 main 결과라고 단정하지 않는다.
- **장애와 복구:** primary에서 HTTP 429가 발생했고, backup은 getLogs 50,000-block 요청을 HTTP 413으로 거부하며 응답에 200-block 제한을 명시했다. 실패는 RPC_UNAVAILABLE로 닫힌다. Desktop 14.634초와 mobile emulation 14.669초 복구는 Playwright route abort를 사용한 F 보고다. 실기기 mobile은 NOT_EXECUTED다.
- **AI:** AI-19 R01 오프라인 추론은 기존 실행 JSON에 기록됐다. 새 AI 추론이 기존 W4 앵커 Receipt에 연결된 새 거래라고 주장하지 않는다. tokenizer hash 수집은 Runtime Binding 완료가 아니다.

## 미완료와 멘토 검토 요청

- BASE 연속 10회, 실제 Hardhat LOCAL, 물리 모바일, 공동 480초 리허설과 전체 시연 녹화는 미완료 또는 미검증이다. 합성 브라우저 원장과 실제 LOCAL을 구분한다.
- S1 PENDING_APPROVAL, Model/Policy LOCK 미실행, TEST SEALED, Scope Cut 미승인. A/F 정책 계약·manifest parity·runtime binding도 남아 있다.
- 검토 요청: 공개 RPC의 200-block backup 제한 아래 fail-closed 시연 대응, chain 재확인과 남는 TOCTOU 위험, 실기기 대체 증거의 한계, W4 provisional 정책과 별도 AI 추론을 사용하는 데모 범위의 명확한 표기.

본 문서는 준비 초안이며 480초 리허설 실행이나 팀장 범위 승인을 기록하지 않는다.
