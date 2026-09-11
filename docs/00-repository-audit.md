# 로컬 상태 점검

점검일: 2026-09-11. 이 문서는 생성 작업 직전 상태와 이번 단계에서 준비한 저장소를 구분한다.

## 작업 직전

작업 폴더 `C:\Users\jinho\Desktop\BLOCK AI`의 숨김 파일과 하위 경로를 확인했다.

| 항목 | 실제 확인 결과 |
|---|---|
| 기존 파일 | `참가 안내문.pdf`, 241,489 bytes |
| 소스 코드 | 없음 |
| 설정·의존성 명세·테스트 | 없음 |
| AGENTS.md | 작업 폴더 및 확인한 상위 경로에 없음 |
| Git | 저장소 아님. `.git`, 브랜치, 커밋, remote 없음 |
| 재사용 가능한 자료 | 안내 PDF와 사용자가 제공한 VeriMod 마스터 컨텍스트 |

PDF 본문 및 대회 조건은 이번 단계에서 검증하지 않았다. 마스터 컨텍스트의 대회 정보도 공식 확인을 마친 사실로 취급하지 않는다.

## 앞선 환경 점검에서 확인한 사항

Windows 11 Home 64비트, RAM 약 15.8 GiB, Intel Iris Plus Graphics.
Git 2.53.0, Node.js 24.19.0, pnpm 11.19.0이 실행됐다.
기본 Python은 3.8.4 32비트이고 별도 Python 3.8.10 64비트도 실행됐다.
기본 Python에서 torch, transformers, sklearn, fastapi, web3, pytest를 찾지 못했다.
npm, npx, uv, Docker, solc, forge, cast, anvil은 당시 PATH에서 찾지 못했다.
PC 전체 미설치를 의미하지 않으며 다른 Python 환경의 패키지는 확인하지 않았다.

이번 재점검에서 `gh`는 PATH에 없었다. Git credential helper는 `manager`이고, 새 비공개 저장소를 HTTPS로 clone하는 데 성공했다. 자격증명 내용을 조회하거나 문서에 기록하지 않았다.

## 이번 단계의 새 구조

기존 PDF는 상위 폴더에 보존하고, 새 저장소를 `BLOCK AI\verimod`에 분리한다.

```text
BLOCK AI/
├── 참가 안내문.pdf
└── verimod/
    ├── .git/
    ├── .gitignore
    ├── AGENTS.md
    ├── README.md
    └── docs/
        ├── 00-repository-audit.md
        ├── 01-domain-and-interfaces.md
        └── 02-decision-register.md
```

기존 코드 의존성이나 마이그레이션 제약은 없다. frontend/backend/ml/blockchain 폴더는 인터페이스와 구현 순서 합의 후 만든다. 현재 문서 구조는 런타임 아키텍처를 확정하지 않는다. (2026-09-11 사용자 요청으로 frontend/backend 뼈대를 먼저 추가했다. 아래 "뼈대 추가" 참고.)

## 검증 범위

파일 목록·Git 상태·GitHub 저장소 생성 및 clone을 확인했다. 설계 검토와 문서 검사를 수행하며, 구현 테스트·교차 언어 hash 검증·실제 온체인 검증은 아직 수행할 수 없다. 추후 검증 계획은 별도 문서에 명시한다.

## 뼈대 추가 (2026-09-11)

사용자 요청으로 프로젝트 기획제안서의 역할 분담(AI·프론트엔드 / 블록체인·백엔드)에 맞춰 frontend와 backend를 나눈 뼈대를 추가했다. 기술 선택 기록은 [02-decision-register.md](02-decision-register.md#결정-기록)에 있다.

```text
verimod/
├── CLAUDE.md
├── frontend/          # Vite 8 + React 19 + TypeScript 6, oxlint
└── backend/           # Node.js + TypeScript 7 + Express 5, Vitest
    └── contracts/     # Hardhat 3.16 + Solidity 0.8.34, Mocha + ethers v6
```

작업 PC: Windows 11 Pro, Node.js 22.14.0, npm 10.9.2, Python 3.13.2, uv 0.11.27. pnpm은 PATH에 없다.

확인한 결과:

- backend: `npm test` 1 passed, `npm run typecheck`와 `npm run build` 오류 없음
- frontend: `npm run lint`와 `npm run build` 오류 없음
- backend/contracts: `npm test`로 solc 0.8.34 컴파일과 Mocha 1 passing
- 개발 서버 실행 중 `/api/health`를 백엔드에 직접, 그리고 Vite 프록시를 거쳐 호출해 둘 다 `{"status":"ok","service":"verimod-backend"}` 응답

판정·receipt·해시·앵커링 로직은 아직 없다. `backend/contracts/contracts/ToolchainCheck.sol`은 툴체인 확인용 임시 컨트랙트다. contracts 의존성에서 `npm audit`이 15건(low 8, moderate 6, high 1)을 보고했으며 아직 조치하지 않았다.
