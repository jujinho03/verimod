# VeriMod

**User-Verifiable AI Moderation Protocol** · HTTP 451 · BLOCK AI 2026

Decide. Prove. Appeal.

한국어 AI moderation 판정과 이의제기 기록을 receipt로 제공하고, Merkle proof와 외부 블록체인 앵커를 통해 기록의 무결성을 이용자가 검증하는 프로젝트입니다.

현재 단계는 **프로젝트 뼈대 구성**입니다. frontend·backend·contracts 개발 환경과 연결 확인(health check)만 동작하며, AI 판정·receipt·해시·앵커링·검증 기능과 배포 및 성능 측정 결과는 아직 없습니다. `docs/`의 인터페이스 사양은 팀 합의 전 제안이며 확정 사양이 아닙니다.

## 문서

- [현재 상태 점검](docs/00-repository-audit.md)
- [도메인 모델과 핵심 인터페이스 제안](docs/01-domain-and-interfaces.md)
- [확정 우선순위와 구현 진입 조건](docs/02-decision-register.md)

## 구조

| 폴더 | 역할 | 스택 |
|---|---|---|
| `frontend/` | 판정 결과·영수증 검증 화면 | Vite, React, TypeScript |
| `backend/` | 판정 API, 레코드 해시, 앵커링 | Node.js, TypeScript, Express |
| `backend/contracts/` | 판정 기록 스마트 컨트랙트 | Hardhat 3, Solidity |
| `docs/` | 설계 문서 | — |

## 로컬 실행

Node.js 22.14.0에서 확인했습니다. 세 폴더는 의존성을 각자 설치합니다.

```powershell
# 터미널 1 — 백엔드 (http://localhost:3001)
cd backend
npm install
npm run dev

# 터미널 2 — 프론트엔드 (http://localhost:5173, /api 요청은 백엔드로 프록시)
cd frontend
npm install
npm run dev

# 컨트랙트 컴파일 + 테스트
cd backend/contracts
npm install
npm test
```

브라우저에서 http://localhost:5173 을 열면 "백엔드 연결 · 연결됨"이 표시됩니다.

## 검증 범위

판정 기록의 무결성과 특정 앵커에 대한 포함 여부를 검증합니다. 판정의 정확성·공정성, 실제 모델 실행, 신고 누락 없는 전체 기록, 정확한 판정 시각을 증명하지 않습니다. 원문·개인정보·이의제기 본문은 온체인에 저장하지 않습니다.

## 협업

- 저장소: https://github.com/jujinho03/verimod
- 기본 작업 브랜치: `main`
- 구현은 인터페이스 합의 후 사용자가 다음 단계 진행을 요청하면 시작합니다.
- 각 변경은 관련 문서와 검증 결과를 함께 기록합니다. 기존 receipt 해석을 바꾸는 변경에는 새 protocol version을 부여합니다.
- 데이터셋·모델·라이선스·성능을 검증 없이 확정하거나 주장하지 않습니다.
