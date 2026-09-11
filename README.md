# VeriMod

**User-Verifiable AI Moderation Protocol** · HTTP 451 · BLOCK AI 2026

Decide. Prove. Appeal.

한국어 AI moderation 판정과 이의제기 기록을 receipt로 제공하고, Merkle proof와 외부 블록체인 앵커를 통해 기록의 무결성을 이용자가 검증하는 프로젝트입니다.

현재 단계는 **구현 전 인터페이스 설계**입니다. 실행 가능한 AI, API, UI, 스마트 컨트랙트, 배포 및 성능 측정 결과는 아직 없습니다. 문서의 기술 선택은 팀 합의 전 제안이며 확정 사양이 아닙니다.

## 문서

- [현재 상태 점검](docs/00-repository-audit.md)
- [도메인 모델과 핵심 인터페이스 제안](docs/01-domain-and-interfaces.md)
- [확정 우선순위와 구현 진입 조건](docs/02-decision-register.md)

## 검증 범위

판정 기록의 무결성과 특정 앵커에 대한 포함 여부를 검증합니다. 판정의 정확성·공정성, 실제 모델 실행, 신고 누락 없는 전체 기록, 정확한 판정 시각을 증명하지 않습니다. 원문·개인정보·이의제기 본문은 온체인에 저장하지 않습니다.

## 협업

- 저장소: https://github.com/jujinho03/verimod
- 기본 작업 브랜치: `main`
- 구현은 인터페이스 합의 후 사용자가 다음 단계 진행을 요청하면 시작합니다.
- 각 변경은 관련 문서와 검증 결과를 함께 기록합니다. 기존 receipt 해석을 바꾸는 변경에는 새 protocol version을 부여합니다.
- 데이터셋·모델·라이선스·성능을 검증 없이 확정하거나 주장하지 않습니다.
- 협업자를 위한 애플리케이션 실행 안내는 구현 이후 추가합니다.
