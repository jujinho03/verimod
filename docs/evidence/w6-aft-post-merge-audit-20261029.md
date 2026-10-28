# W6 A/F/T 통합 결과 — 사후 기록

기준: 2026-10-29 KST, 세 PR 병합 직후 main `f7c84f27ff964d114cacc8c5c181b4df8b9f766b`. 이 기록은 이전 감사 문서의 역사적 시점과 판정을 대체하지 않는다.

| PR | 독립 리뷰어 / 승인 HEAD | 일반 merge SHA | 병합 후 main CI |
| --- | --- | --- | --- |
| [#31 F](https://github.com/jujinho03/verimod/pull/31) | [k0ng-min](https://github.com/jujinho03/verimod/pull/31#pullrequestreview-5683029513) / `1620f82c6cf523d7796273f7f816ed022e50953f` | `780f2cf5559212460b1aa283db537e172a4373d9` | [40756185089](https://github.com/jujinho03/verimod/actions/runs/40756185089) SUCCESS |
| [#32 T](https://github.com/jujinho03/verimod/pull/32) | [jujinho03](https://github.com/jujinho03/verimod/pull/32#pullrequestreview-5688679700) / `681e3743f38a505be680a195232b1aef3d0fa997` | `0f0531cf0c621c446c6f5ee12d928d1cf617ec6c` | [40756691953](https://github.com/jujinho03/verimod/actions/runs/40756691953) SUCCESS |
| [#33 A](https://github.com/jujinho03/verimod/pull/33) | [k0ng-min](https://github.com/jujinho03/verimod/pull/33#pullrequestreview-5690840950) / `7e63af6c96cc2474e87bd22d5c6e6cb0cd2c22b5` | `f7c84f27ff964d114cacc8c5c181b4df8b9f766b` | [40785603829](https://github.com/jujinho03/verimod/actions/runs/40785603829) SUCCESS |

각 병합 후 CI의 frontend, backend, contracts가 모두 성공했다. #33의 두 부모는 `0f0531cf0c621c446c6f5ee12d928d1cf617ec6c`와 `7e63af6c96cc2474e87bd22d5c6e6cb0cd2c22b5`다. GitHub 테스트 merge `254d9ee37cc09c5ee5538a9f35958f53c872b260`은 실제 merge SHA가 아니다. 실제 tree는 테스트 tree `680387f8f7499c053d479ad47933b075823a53ef`와 같다. #31의 12파일과 #32의 4파일은 최종 main에서 각 PR의 blob과 동일하다. #33은 28파일 추가·기존 파일 수정 및 삭제 0이다.

W4 `docs/handoffs/w4-anchored-epoch-public/20261020-r01` tree는 `1911f46c9e19000d25a7ffb5f86f1c2ba781a1ee`로 불변이다. frontend tree는 #33 전후 `45249d5624eb094a6ba379826a9d52a5687783f6`로 동일하다. AI-19 증빙, Data Card, Model Card가 main에 존재한다. 새로 변경된 44파일의 경로·알려진 비밀정보 패턴 검사에서 private-data, 모델 가중치 및 자격증명 일치는 없었다. 패턴 검사는 모든 개인정보나 비밀의 부재를 증명하지 않는다.

## E1~E8 재평가 — 권고, 팀장 최종 판정 별도

- E1 **PASS 권고**: W4 공개 evidence tree 불변 및 기존 W6 동일 receipt 공개 RPC VALID 2회. 별도 10회 안정성 기록은 8회 unavailable이며 재실행하지 않았다.
- E2 **PARTIAL**: 기존 VALID·HASH_MISMATCH·proof sibling 변조 INVALID_PROOF 근거가 있다. 신규 rehash INVALID_PROOF live 실측은 BLOCKED이며 별개다.
- E3 **PARTIAL**: 동일 receipt desktop 복구 1회 기록은 route abort 주입이며 원본 로그는 직접 확인하지 않았다. 반복 불안정, mobile timeout 및 physical mobile NOT_EXECUTED.
- E4 **PASS 후보**: 세 PR의 독립 승인, 일반 merge 및 각 병합 후 main CI 성공을 확인했다. Git 통합만의 평가다.
- E5 **PARTIAL**: fail-closed 근거는 있으나 SEC-W5-01 일부 부정 검증 부재, Windows 53 SKIP, writable callback UNSUPPORTED. T의 테스트 수치는 로컬 보고이며 원본 로그는 직접 확인하지 않았다.
- E6 **PARTIAL**: BASE 10회 NOT_MET(기존 A 기록 2/10), 실제 Hardhat LOCAL NOT_VERIFIED, RECORDED_READY=false. AI-19는 해당 PC의 물리 오프라인 추론 1회 근거다.
- E7 **PARTIAL**: Data/Model Card 및 증거 통합, T 문서 파일명 정정을 확인했다. `ai/README.md`는 10/18 기준으로 이후 W4 온체인 및 W6 현황이 반영되지 않았다. DOC-09·OPS-04 미확인.
- E8 **PARTIAL**: 480초 공동 리허설·녹화본 및 Beat 5 원본 미확인.

S1 PENDING_APPROVAL, A/F 정책 계약 미확정, A3 manifest/parity 미완료, A4 binding 미완료 또는 별도 승인 의존, LOCK 미실행, TEST SEALED, Scope Cut 미승인 상태를 유지한다. CI SUCCESS는 공개 RPC 수동 실측 또는 팀 전체 Engineering Exit PASS를 뜻하지 않는다.
