# SEC-W5-01 — Windows SQLite 재열기 수정 보류 (BLOCKED)

등록: 2026-10-23 · 관리: A / 주진호(팀장) · 수정 담당: T / 설경민(+F 리뷰) · 상태: **OPEN / 수정 미승인 / 어떤 브랜치에도 미반영**

## 요약

T가 Windows에서 backend DB를 다시 열 때 생기는 문제를 고치려고 `DatabaseSync(absolutePath)` 방식을 시도했다. 그런데 이 방식에서는 파일 삭제 경쟁 상황에서 **SQLite가 빈 DB를 새로 만드는 문제**가 재현됐다. authoritative DB가 사라졌는데도 서비스가 빈 DB로 계속 동작하면 기존 no-create/fail-closed 원칙(DB가 없으면 만들지 않고 실패해야 함)이 깨진다. Receipt·Epoch 상태를 잃은 채 정상처럼 보이게 된다.

## 현재 조치

- 해당 수정은 **커밋하지 않는다.** main, F PR #29, A PR #30 등 어떤 통합에도 넣지 않는다.
- 2026-10-23 확인: PR #28·#29·#30의 변경 파일에 backend DB 열기 코드 변경이 없다. F PR의 backend 변경은 `backend/test/decisions.test.ts`의 테스트 추가뿐이다.
- 기존 DB identity 검사와 경로 보호 설정을 완화하지 않는다.
- Backend 203 PASS나 W5 CI SUCCESS는 이 문제가 해결됐다는 근거가 아니다.

## 수정안이 통과해야 할 부정 검증 (전부 필요)

| # | 시나리오 | 기대 결과 |
|---|---|---|
| 1 | 열기 직전·도중 파일 삭제 경쟁 | 열기 실패. 새 파일 생성 0건 |
| 2 | 같은 경로를 다른 DB 파일로 교체 | identity 불일치로 거부 |
| 3 | DB identity(기존 식별자·schema 지문) 불일치 | 거부. 자동 마이그레이션·재생성 없음 |
| 4 | symlink / Windows reparse point(junction 포함) | 거부 또는 실제 대상 identity 검증 후에만 허용 |
| 5 | 승인되지 않은 경로의 DB | 거부 |
| 6 | SQLite header 손상·비 SQLite 파일·schema 불일치 | 거부 |
| 7 | 파일이 없는 경로 | **생성하지 않고** 실패 (예: SQLite URI `mode=rw` 같은 no-create 열기) |
| 8 | durability 설정(journal mode, synchronous 등) | 기존 값을 유지하고, 열고 나서도 검증 |

모든 시나리오는 격리된 임시 디렉터리의 합성 DB로만 실행한다. **원본 authoritative DB와 그 보호 경로는 열거나 복사하지 않는다.**

## 종료 조건

1. 위 8개 시나리오의 테스트와 실행 로그, 커밋 SHA가 있다.
2. A와 F의 리뷰를 받는다.
3. 별도 PR로 제출하며, 다른 기능 PR에 섞지 않는다.
4. 팀장이 merge를 승인한다.

이 조건을 다 채울 때까지 상태는 **OPEN**이다. W6 T 작업으로 이월한다. 원격 공개 Issue 등록은 저장소가 공개 상태이므로 하지 않았다. 팀장이 판단해 비공개 채널로 공유한다.

## 2026-10-25 후속 — fail-closed 수정 (F PR #29에 포함, main 미병합)

- 처음 거부한 direct-path 재열기 패치는 **어느 브랜치에도 들어가지 않았다.**
- 대신 T가 `baf8b36`("fail closed Windows callback DB reopen")을 냈고, F PR #29(head `19be2b79`)에 포함됐다. `openApprovedDatabase`는 이제 `process.platform === 'win32'`이면 `WINDOWS_WRITABLE_NO_CREATE_UNSUPPORTED`로 열기를 거부한다. 비 Windows 경로(`mode=rw` no-create + 경로·identity 검사)는 바뀌지 않았다.
- F 보고: Windows backend 153 PASS / 53 SKIP, Linux backend 199 PASS / 7 SKIP. 53 SKIP의 내역은 F 증거를 따르며 A가 직접 분류하지 않았다(Windows에서 실행할 수 없게 된 callback 경로로 추정). **SKIP은 PASS가 아니다.**
- **운영 영향:** authoritative DB는 A의 Windows 노트북에 있다. 이 수정이 main에 들어가면 그 노트북에서 F callback(prepare/submitted/confirmed)을 **실행할 수 없다.** 새 Epoch 등록(예: W6 SEED-01)에는 비 Windows 실행 환경이나 별도 승인된 방식이 필요하다.
- **상태 변경:** 위험한 동작(빈 DB 생성)은 차단됐다(Windows에서는 지원하지 않는 방식으로 차단). Windows에서 쓰기 가능한 callback 지원은 여전히 **OPEN**이다. 위 8개 부정 검증 중 이 수정으로 직접 확인된 것은 "Windows 경로 거부"뿐이다. 나머지는 Linux 경로의 기존 테스트에 의존한다.

## 2026-10-25 — main 반영

- `baf8b36`가 F PR #29와 함께 main `03296595`에 병합됐다(`k0ng-min` APPROVED, CI #264 SUCCESS). 위험 경로는 이제 main에서 fail-closed다.
- Windows의 승인된 writable callback은 **UNSUPPORTED**다. 비 Windows no-create 지원과 Windows 실행 방안은 **OPEN**이며 W6에 넘긴다.
- A의 Windows 노트북에서는 F callback을 실행할 수 없다. W6에서 새 Epoch가 필요하면 실행 환경을 먼저 정한다.
