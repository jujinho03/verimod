# W7 DOC-09 / OPS-04 멘토링 증거 감사 — 2026-10-30

> **대상:** 멘토·팀원 · **목적:** 원문, 권고, 팀 결정, 구현·시험과 제출·접수 증거를 각각 추적합니다. 요약은 [멘토링 자료 안내](README.md), 발표 질문은 [5회차 한눈에 보기](mentor-brief-20261031.md)를 참조하세요.

기준 main `e8ef51a205939ecb049705997b42cf131e294711` · Owner A · 범위: 읽기 전용 원문·저장소 대조. [기존 추적표](w5-mentoring-traceability.md), [3회차 기록](session-03-20261020-lee-jaewon.md), [W6 당시 감사](../evidence/w6-a-gap-closure-20261029.md), [W6 MUST](../handoffs/W6-MUST-plan.md), [결정 기록부](../02-decision-register.md), [W7 인계](../handoffs/W7-core-demo-approved-handoff-20261030.md)를 함께 읽는다. 과거 감사의 당시 원문 미확인 사실은 변경하지 않았다.

## 출처 목록과 검증 수준

PDF·메일은 개인정보가 포함될 수 있어 공개 저장소에 추가하지 않는다. 아래 SHA-256은 원본 파일의 바이트 식별자이며 작성자 신원이나 발송을 증명하지 않는다. 메일의 발신자·시각은 인증된 수신 메일함의 표시·헤더 기준이며 별도 서명이나 발신자 신원에 대한 독립 인증은 아니다. PDF 생성 시각도 발송·수신 시각이 아니다.

| 회차 | 확인한 출처와 형식 | 검증·시간·보관 경계 |
|---|---|---|
| 1 임명환 | 멘토 회신 PDF 13쪽, `HTTP 451 1회차 멘토링 회신(임명환).pdf`, SHA-256 `bcf51a61614c6ea707e03adcd8b8dc95cf75c283a0f6f208149cfb6ceba658bb`; 회신 EML SHA-256 `74e0983fdb55ae6c377ae9d635848b6b2d9058d7a644bfa41ddeb644f6dee4ea` | PDF는 로컬 `멘토링/1회차/`, EML은 Downloads. PDF 생성 메타 10/05 10:11:32 UTC, EML Date 10/02 18:01 KST는 서로 다른 파일의 시각이다. 연락처 포함 가능: 원본 비공개 |
| 1 팀 기록 | 팀 공유 결과 보고 PDF 6쪽, SHA-256 `fbe1ebb87ffe3cef6cce8823d2bdfd10112e0f2eaf41882564dc44228eeee043` | 로컬 `멘토링/1회차/`. 팀 작성, 멘토 원문이나 제출 증거 아님; 원본 비공개 |
| 2 금창섭 | 인증된 Gmail의 실제 이메일 대화, 10/08 및 10/11 멘토 회신 | **SOURCE_VERIFIED: EMAIL**. 10/11 11:10·15:55 KST의 멘토 회신과 팀 메시지를 구분했다. 이메일에는 주소 등 개인정보가 있어 비공개; PDF 페이지·파일 SHA는 적용하지 않는다. 별도 10쪽 이메일 스레드 PDF 및 팀 보고서·수행일지는 검색한 로컬 위치에서 미발견이며 원문 이메일 부재를 뜻하지 않는다 |
| 3 이재원 | 멘토 피드백 PDF 3쪽, `8팀-HTTP_451-3회차-멘토링-피드백.pdf`, SHA-256 `9a69a1ea8343e5a109823067d67ff27c20592b63367507b3d007fbc3af96abab`; 수행일지 PDF 1쪽, SHA-256 `c498db105a29910e32852cfdc0b1d57135dc647826023a9ab2fc5a4991d35917` | 로컬 `멘토링/3회차/`. 생성 메타 각각 10/19 22:29:59 UTC, 23:13:10 UTC; 실제 발신·수신 시간의 독립 검증과 별개. 수행일지는 팀 작성. 개인정보 가능성: 원본 비공개 |
| 4 이재원 | 인증된 Gmail의 멘토 회신 및 피드백 첨부 PDF 2쪽, `8팀-HTTP_451-4회차-멘토링-피드백.pdf`, SHA-256 `01766a4cdbe8116bc33f246469f8beb3377079845b639b2f6e22caf8b1e698b5` | **SOURCE_VERIFIED: PDF + EMAIL PATH**. 메일 수신함 표시 10/27 09:04:23 KST, PDF 생성·수정 메타 10/27 08:39:28(표시 시간대). PDF 두 쪽의 시각 검사에서 서명은 보이지 않았으며 독립적인 발신자 신원 확증은 별개다. 로컬 검색에서는 찾지 못해 첨부를 Git 밖 비공개 `private-mentoring-audit/mentor-04-feedback.pdf`에 보관. 원본에 개인정보가 있을 수 있음 |
| 운영 안내 | 멘티용 CNU Mate 매뉴얼 PDF 12쪽 SHA-256 `414e506c9a91ec600df6126973f5467426933c75b69b3a10bf10de80f54e08c2`, 운영 문의 회신 EML SHA-256 `190d38fee6ce9de4c265b2ec5ac3f3e01421c7565079d923b9e0c605594f0bb5` | 로컬 `멘토링/운영안내/` 및 Downloads. 회신 EML Date 10/02 16:36:34 KST. 절차 안내이지 실제 제출·접수 증거가 아니다. 이메일은 개인정보 포함 가능 |

그 밖의 확인 자료: `멘토링/1회차/`의 팀 사전 검토 PDF(5쪽, `2ef93bef24f3847afecf3e3653021ad0af0570b689ffa599ea3e48f9f16d6a1c`)와 HWP(`549eb53c85a68d64a6f8f85ea0947b8e877c2622ad047176f2e698662439137c`, 페이지·내용 미확인); `멘토링/3회차/`의 팀 사전검토 PDF(3쪽, `59e0be68c2e8de4893424f944ce98798b2585f1bd77d8b1f4d1409d549f8b40a`)와 팀 기획 PDF(3쪽, `9930a4585c3f0703c127ec684899daa1da347770d01e4c72852dfc1530e588fc`); `멘토링/운영안내/`의 운영계획 HWPX(`56a04755999591033bfa1df94779d61f31210e371bfa3b26be5e7eb5bc803ac3`, 페이지 미확인); Downloads의 1회차 자문 요청 EML(`36adbfe95b997994b60a15788861c419102de2894b2f1ad053bec10b7ae1a061`, Date 10/02 15:56:41 KST). 문서 이름이나 작성 시점만으로 제출·접수를 인정하지 않으며, 다른 파일의 작성·수신 시각은 미확인이다. 모두 개인정보 가능성이 있어 원본을 공개하지 않는다.

로컬 검색은 Desktop·Documents·Downloads·OneDrive의 파일명에 대해 Unicode 정규화와 중복 이름을 고려했다. 다른 위치·대화 첨부까지 부재라고 단정하지 않는다. 원문 내용 확보와 외부 발신자 신원 보증, 수행일지 작성, 플랫폼 제출·접수는 모두 별도다.

## 권고 → 결정 → 구현·시험 추적

표의 VERIFIED는 원문 내용 확인에 한정한다. 팀 결정은 [결정 기록부](../02-decision-register.md), 구현·시험은 명시된 기존 증거에 한정한다. 새 테스트는 실행하지 않았다. M3-01~14 상세는 [기존 표](w5-mentoring-traceability.md#3회차--권고별-반영과-검증)에 보존한다.

| Trace ID / 원문 | 멘토 권고 및 출처 검증 | 팀 결정 | 구현·시험 증거와 수준 | Owner | 잔여 공백 / W7 action |
|---|---|---|---|---|---|
| M1-SCOPE, 1차 PDF | VERIFIED: Scope Diet, 실제 Core E2E 우선, 합성 Appeal 분리 | ADOPTED 방향; 구체 W7 범위는 별도 Option B | [W4 공개 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md)는 과거 Anchor 검증 | A/T/F | 새 추론과 기존 Receipt는 별개; 새 전체 E2E로 표시하지 않음 |
| M1-TRUST, 1차 PDF | VERIFIED: 기록 무결성과 AI 정답성·발급자 진실성 구분 | ADOPTED 표현 경계 | W4 해시·Merkle 검증 증거; AI 정확성 인증이 아님 | A/T | 발표 화면·대본 표현 점검 |
| M2-TRIAGE, 10/11 이메일 | VERIFIED: AI triage와 HUMAN_REVIEW, 실제 E2E와 실제 Appeal 권고 | PARTIAL; 연구 정책 별도 승인 필요 | [정책 분석](../eval/w5-research-policy-scenarios.md), W4 과거 Anchor; 실제 운영 검증 아님 | A/F | S1 PENDING, 점수 UNCALIBRATED, 운영 성능·새 E2E 미입증 |
| M2-SCOPE-B, 10/11 이메일 | VERIFIED: Web 시연 우선·API/SDK 장기 확장. 멘토는 당시 실제 Appeal을 우선 권고; 팀의 합성 Lifecycle B안 질의에는 일정상 현실적이나 팀 판단이라고 답함 | M3-11 TEAM_ADOPTED는 당시 팀 결정; 10/30 W7 Option B는 별도 결정 | [결정 기록부](../02-decision-register.md), W7 인계. 합성 결과는 실제 Appeal backend가 아님 | A/F/T | 새 시연에서 합성·실제 구분; 실제 Appeal은 Post-MVP |
| M2-SCOPE-B 추가, 10/11 이메일 Q5 | VERIFIED: minConfirmations와 L1 관련 safe/finalized 구분, 과거 epoch 이용 제안 | PARTIAL | W4 확인 수 증거와 L1 finality는 별개 | T/F | safe/finalized 구현·실증 미확인. TrustProfile/publisher 질문 자체를 멘토 설계 승인으로 취급하지 않음 |
| M3-01~04, 3차 PDF p1 | VERIFIED: FRR 우선, UNCALIBRATED, HUMAN_REVIEW 완충; 수치는 예시 | PARTIAL / X·B와 S1 PENDING | Validation 분석과 연구 후보; TEST·정책 승인 아님 | A | 승인·calibration·실제 운영평가 별도 |
| M3-05~10, 3차 PDF p1~2 | VERIFIED: 무결성과 정확성, L2 확인과 L1 finality 구분; 변조·RPC 실패 구분 | 표현 경계 채택; 세부 구현·시험 별도 | [W4 증거](../handoffs/w4-anchored-epoch-public/20261020-r01/README.md); [F 실측 요약](../evidence/w6-f/20261029/README.md)은 원본 독립 미검증 | T/F/A | `RPC_UNAVAILABLE`은 변조가 아님. 새 실행의 SHA·모드·결과 기록 |
| M3-11~14, 3차 PDF p2~3 및 팀 기록 | VERIFIED: Web 중심과 API/SDK 장기 방향. 당시 B안 채택과 합성 경계 | TEAM_ADOPTED(당시 B안); 세부 발표는 별도 결정 | W7 인계의 5-Beat 계획은 리허설 결과 아님 | A/F/T | 480초 리허설·녹화·실제 결과 확보 |

기존 문서에는 `M4-01~06`이 대조 예정 번호로만 등장하고 정의는 찾지 못했다. 아래 정의는 2026-10-30 원문 대조를 위해 처음 부여한 매핑이며 기존에 이미 승인된 정의라고 주장하지 않는다.

| Trace ID / 원문 | 원문 권고 / Source Verification | 팀 결정 | 구현·시험 증거 | Owner | 잔여 공백 / W7 action |
|---|---|---|---|---|---|
| M4-01, 4차 PDF p1 Q1 | VERIFIED: 기존 플랫폼이 발급한 Receipt 무결성 검증 중심; YouTube URL 댓글 분석을 주 서비스로 전환하지 않음 | ADOPTED: W7 Option B Core 2 | W4 공개 Anchor·검증은 과거 실측 | A/F | 새 추론이 W4 Receipt의 원천인 것처럼 표시하지 않음 |
| M4-02, p1 Q1~Q2 | VERIFIED: YouTube 댓글 수집·분석·요약·Receipt 발급은 Post-MVP | DEFERRED 제안; 별도 팀 결정 확인 필요 | 새 기능 구현·시험 근거 없음 | A/F | 데모 완료 주장 금지; backlog |
| M4-03, p1~2 Q3 | VERIFIED: 온체인 무결성만으로 원문 진실성이나 실제 제재 이력을 입증하지 않음 | ADOPTED 표현 경계 | W4 공개 증거는 등록된 기록의 검증 | A/T | 실제 외부 사실 인증으로 확대하지 않음 |
| M4-04, p1~2 Q3~Q4 | VERIFIED: 외부 댓글 메타데이터는 개인정보·가스 비용을 고려해 오프체인; 외부 결과는 플랫폼 제재가 아닌 AI 분석 Risk로 보수적으로 표시하고 HUMAN_REVIEW·담당자 최종 판단을 강조 | PARTIAL / 미래 설계 권고 | 외부 댓글 서비스 구현·시험 근거 없음 | A/F | 개인정보 최소화 설계와 검증은 후속 |
| M4-05, p2 Q5·최종 권고 | VERIFIED: 본선 Core E2E 안정화와 fallback 우선 | PARTIAL: Option B의 5개 core 범위 승인 | W4 과거 Anchor와 AI-19 오프라인 실측은 각각 별도; [W7 인계](../handoffs/W7-core-demo-approved-handoff-20261030.md) | A/F/T | 멘토 목표인 새 AI→Receipt→Epoch→Anchor 전체 경로는 미실증. 480초 리허설·녹화 필수 준비 |
| M4-06, p2 Q5·최종 권고 | VERIFIED: HASH_MISMATCH와 RPC_UNAVAILABLE을 분리해 시연 | ADOPTED 시연 경계 | [F 공개 요약](../evidence/w6-f/20261029/README.md)의 rehash·route-abort 보고, private 원본 독립 미검증 | F/T | 새 발표 환경에서 실제 모드·결과 확인, 장애를 VALID나 변조로 표시 금지 |

## OPS-04: 작성·이메일·플랫폼을 구분

10/29 05:00:56 KST 인증된 메일함의 발신 기록에서 1~4회 수행일지를 ZIP으로 보냈다는 팀 이메일과 ZIP 첨부의 존재를 확인했다. 메일 내용상 제출 대상 범위이며 ZIP 내부의 각 파일이나 상대 수신 회신은 검증하지 않았다. 이는 **EMAIL_SENT_EVIDENCED / EMAIL_RECEIPT_PENDING**이지 CNU MATE 플랫폼 제출·접수 증명이 아니다. CNU MATE 기존 화면에 3·4차의 '제출' 표시가 렌더되어 있었으나 상세 조회에서 로그인 필요 화면이 나타나 세션 만료와 표시의 최신성을 확인하지 못했다. 이 화면만으로 플랫폼 제출·접수·승인 VERIFIED를 부여하지 않는다.

| 회차 | 작성·진행 및 원문 | 이메일 발송 | CNU MATE 제출 | CNU MATE 접수·승인 |
|---|---|---|---|---|
| 1 | 로컬 팀 결과 보고·멘토 회신 존재 | 1~4회 일지 발송 이메일의 대상에 포함된다고 기재; ZIP 내부 미확인 | NOT_VERIFIED | NOT_VERIFIED |
| 2 | 멘토 이메일 회신 확인; 로컬 수행일지 미발견 | 위와 같음 | NOT_VERIFIED | NOT_VERIFIED |
| 3 | 로컬 수행일지·멘토 피드백 확인 | 위와 같음 | NOT_VERIFIED; 만료 전 렌더 표시의 최신성 미확인 | NOT_VERIFIED |
| 4 | 멘토 이메일·피드백 첨부 확인; 로컬 수행일지 미발견 | 위와 같음 | NOT_VERIFIED; 만료 전 렌더 표시의 최신성 미확인 | NOT_VERIFIED |

원문 회신은 해당 멘토링의 상호작용 증거지만 행사 출석부나 플랫폼 승인 증거는 아니다. CNU MATE 재로그인 후 각 회차의 제출 이력·대상 문서·접수 번호·접수/승인 상태 또는 담당자의 수신 회신을 비식별 대조해야 한다. 새 제출·수정·재제출은 별도 허가 없이는 하지 않는다.

## 판정 및 인계

- DOC-09: 기존 **PARTIAL → PARTIAL**, 다만 2회 이메일과 4회 PDF 및 메일 경로의 원문 확인 범위가 개선됐다. 멘토 권고, 팀 선택, 코드·실측은 각각 별개다.
- OPS-04: **NOT_VERIFIED → NOT_VERIFIED**. 이메일 발송은 확인했으나 수신 회신과 플랫폼 제출·접수는 확인하지 못했다.
- E7 및 `ORIGINAL_W6_ENGINEERING_EXIT`는 **PARTIAL**. E6/E8도 PARTIAL; S1 PENDING_APPROVAL, LOCK NOT_EXECUTED, TEST SEALED를 유지한다. 기존 `W6_WORKSTREAM=CLOSED_WITH_ACCEPTED_RISKS`를 소급 취소하지 않는다.
- A/F는 W7 리허설을 진행하되 참석자와 각 Beat의 실제 결과를 기록한다. T의 불참을 3인 공동 리허설로 기재하지 않는다. 전체 녹화는 존재·재생·무결성 확인 전 `RECORDED_READY=false`. 문서 원문 확인은 새 E2E·리허설·플랫폼 완료를 대신하지 않는다.
