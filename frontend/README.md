# frontend — 서비스 화면과 브라우저 검증기

React + Vite 웹 앱입니다. 이용자가 판정을 받고, 영수증을 보관하고, 영수증이 바뀌지 않았는지 브라우저에서 직접 검증하는 흐름을 보여줍니다.

> 기본 데모는 **합성 점수와 모의 원장**으로 동작합니다. 실제 R01 모델과 공개 블록체인 실행 결과는 [W4 현황](../docs/progress/W4.md)을 봅니다.

## 화면

| 경로 | 화면 | 하는 일 |
| --- | --- | --- |
| `/` | 홈 | Decide · Prove · Verify · Appeal 흐름 소개 |
| `/check` | 판정 | 문장을 넣으면 항목별 점수와 조치(허용/검토/제한)를 보여줌 |
| `/receipts` | 영수증 | 판정마다 발급된 영수증 목록(최초 판정·이의제기·사람 검토) |
| `/receipts/:receiptId` | 영수증 상세 | 영수증 한 건의 내용·hash·연결 기록 |
| `/verify` | 검증 | 영수증 hash·Merkle 포함 증명·앵커를 대조. 점수 하나만 바꿔도 실패함을 보여줌 |
| `/review` | 이의제기·검토 | 이의제기와 사람 검토가 최초 판정에 새 기록으로 이어짐(합성 데모) |
| `/protocol` | 프로토콜 | 영수증·hash·Merkle 규칙 설명 |

## 코드 구성

| 폴더 | 내용 |
| --- | --- |
| `src/pages/` | 위 화면들 |
| `src/domain/` | 영수증 스키마·hash·Merkle 검증, 승인된 체인 프로필(`approvedProfiles.ts`) |
| `src/api/` | backend API client |
| `src/features/` | 점수 막대, 검증 단계 표시 등 화면 부품 |
| `src/store/`, `src/ui/`, `src/site/`, `src/styles/` | 상태 관리, 공통 UI, 머리말·꼬리말, 스타일 |
| `e2e/` | Playwright 브라우저 회귀 시험 |

## 실행

```sh
npm ci
npm run dev           # 개발 서버 (터미널의 localhost 주소를 엽니다)
npm test              # 단위 테스트 (vitest)
npm run test:browser  # 브라우저 회귀 (playwright)
npm run lint
npm run build
```
