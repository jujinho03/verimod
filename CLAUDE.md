# VeriMod — Claude Code 안내

작업 원칙은 AGENTS.md를 따른다.

공통 프로젝트 맥락은 `MASTER_CONTEXT.md`를 먼저 읽는다. 기획서 제안과 실제 골격 적용 상태를 구분하고, 16절의 미정 쟁점과 17절의 확인 시점을 확인한다.

@AGENTS.md

## 구조

- `frontend/` — Vite + React + TypeScript. 판정 결과·영수증 검증 화면 (검증 계층: Web Crypto SHA-256, ethers.js 예정)
- `backend/` — Node.js + TypeScript + Express 5. 판정 API, 레코드 직렬화·해시, 앵커링
- `backend/contracts/` — Hardhat 3 + Solidity 0.8.34, Mocha + ethers v6. backend와 별개의 npm 패키지
- `docs/` — 상세 설계 문서 00~02 및 `references/project-proposal-2026-09-11.pdf` 원본. 전체 기준은 루트의 `MASTER_CONTEXT.md`, 읽기용 사본은 `output/pdf/VeriMod_Project_Master_v1.0.pdf`다.

## 명령 (각 폴더에서 실행)

| 폴더 | 개발 서버 | 검증 |
|---|---|---|
| `backend` | `npm run dev` → http://localhost:3001 | `npm test`, `npm run typecheck`, `npm run build` |
| `frontend` | `npm run dev` → http://localhost:5173 (`/api`는 3001로 프록시) | `npm run lint`, `npm run build` |
| `backend/contracts` | — | `npm test`, `npm run build` |

## 규칙

- 세 패키지는 node_modules와 package-lock.json을 각자 가진다. 설치는 해당 폴더에서 한다.
- `backend/contracts/contracts/ToolchainCheck.sol`은 툴체인 확인용 임시 컨트랙트다. 실제 판정 기록 컨트랙트를 구현할 때 삭제한다.
- 개인키·RPC URL은 코드와 커밋에 넣지 않는다. Hardhat은 `configVariable` 또는 hardhat-keystore를 쓴다.
- 기술 선택을 바꾸면 `docs/02-decision-register.md`의 결정 기록을 갱신한다.
- 구현 후 바뀐 폴더의 검증 명령을 실행하고 결과를 보고한다.
