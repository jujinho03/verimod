# @verimod/protocol — 영수증·hash·Merkle 공통 규칙

판정 영수증(Decision Receipt)을 어떤 바이트로 만들고, 어떻게 hash하고, 어떻게 Merkle root로 묶는지 정한 공통 패키지입니다. frontend 검증기와 backend 발급기가 이 코드를 함께 씁니다. 담당: T / 설경민.

| 파일 | 하는 일 |
| --- | --- |
| `src/canonical.ts` | 객체를 항상 같은 바이트로 만드는 canonical JSON 직렬화 |
| `src/hash.ts` | 용도별 domain이 붙은 SHA-256 (`verimod:model:v1` 등) |
| `src/receipt.ts` | 영수증 hash, 원문+salt로 만드는 content commitment, issuer 식별자 |
| `src/merkle.ts` | Merkle leaf·root·포함 증명 계산과 검증 |
| `src/epoch.ts` | 영수증 묶음(Epoch) 고정: 정렬·root·증명 생성 |
| `src/schema.ts` | 영수증·bundle 스키마 검증 (BEEP `hate/offensive` 점수 포함) |
| `src/manifests.ts`, `src/types.ts`, `src/json.ts` | Manifest hash, 타입 정의, 중복 key 거부 JSON 파서 |

이 규칙을 바꾸면 기존 영수증 hash와 이미 고정한 root가 달라집니다. 변경 절차는 [협업 규칙](../../CONTRIBUTING.md)을 따릅니다. 상세 규격은 [canonical](../../docs/spec/canonical-profile-v1.md), [Merkle](../../docs/spec/merkle-spec.md) 문서에 있습니다.
