# VeriMod — Claude Code 안내

작업 원칙은 AGENTS.md를 따른다.

공통 프로젝트 맥락은 `MASTER_CONTEXT.md`를 먼저 읽는다. `docs/03-current-status.md`의 실제 계산·시뮬레이션·미연결 기능과 검증 시점을 구분하고, 다음 계약 검토는 `docs/04-interface-contract-draft.md`를 읽는다. 현재 시험 사양을 팀 승인으로 해석하지 않는다.

@AGENTS.md

## 구조

- `frontend/` — Vite + React + TypeScript. 판정 결과·영수증 검증 화면 (검증 계층: Web Crypto SHA-256, ethers.js 예정)
- `backend/` — Node.js + TypeScript + Express 5. 현재 GET /api/health만 구현. 판정 API·발급·앵커링은 P1 계획
- `backend/contracts/` — Hardhat 3 + Solidity 0.8.34, Mocha + ethers v6. backend와 별개의 npm 패키지
- `docs/` — 과거 점검(00), 상세 제안(01), 결정 기록(02), 최신 상태(03), 다음 계약 초안(04). 최신 기획서 원본은 `references/project-proposal-2026-09-12.pptx`다. `MASTER_CONTEXT.md`가 갱신 원본이고 기존 v1.0 PDF는 2026-09-11 과거 사본이다.

## 명령 (각 폴더에서 실행)

| 폴더 | 개발 서버 | 검증 |
|---|---|---|
| `backend` | `npm run dev` → http://localhost:3001 | `npm test`, `npm run typecheck`, `npm run build` |
| `frontend` | `npm run dev` → http://localhost:5173 (현재 흐름은 브라우저 시뮬레이션, `/api` 프록시 설정은 유지) | `npm test`, `npm run lint`, `npm run build` |
| `backend/contracts` | — | `npm test`, `npm run build` |

## 규칙

- 세 패키지는 node_modules와 package-lock.json을 각자 가진다. 설치는 해당 폴더에서 한다.
- `backend/contracts/contracts/ToolchainCheck.sol`은 툴체인 확인용 임시 컨트랙트다. 실제 판정 기록 컨트랙트를 구현할 때 삭제한다.
- 개인키·RPC URL은 코드와 커밋에 넣지 않는다. Hardhat은 `configVariable` 또는 hardhat-keystore를 쓴다.
- 기술 선택을 바꾸면 `docs/02-decision-register.md`의 결정 기록을 갱신한다.
- 구현 후 바뀐 폴더의 검증 명령을 실행하고 결과를 보고한다.

## 현재 검증 경계 (2026-09-13)

frontend의 `src/domain/`은 실제 계산과 synthetic scorer, `src/store/`는 seed·localStorage·합성 ledger, `src/pages/`와 `src/features/`는 7개 route와 검증 UI다. Node 24.19.0/npm 12.0.2에서 각 lockfile로 `npm ci` 후 위 명령을 사용한다. 실제 결과는 `docs/07-validation-2026-09-13.md`를 확인한다. ToolchainCheck는 실제 epoch 계약과 테스트가 준비된 뒤 제거한다.
