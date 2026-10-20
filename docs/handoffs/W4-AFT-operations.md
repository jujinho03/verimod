# W4 A/F/T 최소 운영 인계와 다섯 승인

2026-10-17 작성, 2026-10-18 갱신. 승인 1~4 범위의 호스트 구성과 실제 status 왕복은 끝났고,
실제 송신(승인 5)만 남아 있습니다.
F는 `c1f750ea3752037d749324f1535df051ce6b37f9`, T는 `7534907fa3ad66cc6ed29cfbee2efd8c2c75369e`에 고정합니다.
이 문서는 승인이나 실제 실행 결과를 대신하지 않습니다.

## 두 호스트와 현재 상태

- 원본 authoritative SQLite는 A Windows 노트북에 유지합니다.
- 승인 Publisher signer/개인키는 별도 T 노트북에 유지합니다. DB·키를 서로 이동하지 않습니다.
- 실제 Epoch 1/count 2/version 1은 2026-10-20 Base Sepolia에 등록됐고(tx `0x175b3c1ad237a087984b17b47c0343fedfd314a5eb1c34ba7a22511b5cc67286`, 블록 48358039) 원본 DB는 CONFIRMED입니다.
- 관리자 작업은 운영자가 UAC를 직접 승인해 실행했습니다. 실행 정책은 바꾸지 않았습니다.
- 2026-10-18: T → A 사설망 SSH로 고정 status 왕복 PASS. 원격 명령(exit 126)·PTY·원격 포워딩·SFTP·다른 계정 차단,
  시험 전후 원본 DB identity·bytes·Epoch·member·행 수 동일. 시험 후 sshd·F 계정·신규 방화벽 규칙을 다시 비활성화했습니다.
- A RPC는 운영자 보호 파일에 저장된 endpoint로 읽기 검증(chain/contract/publisher, EIP-1898 canonical `eth_call`)을 마쳤습니다.
  보호 설정은 그대로 두고, 2026-10-20 단계별 승인 후 운영자 전용 비공개 설정으로 `submitted`/`confirmed`를 실행했습니다.
- 2026-10-20: prepare 전용 SSH 강제 명령과 2시간 승인 창으로 T 서명 tx를 원본 DB에 SUBMITTING으로 먼저 기록한 뒤 송신했습니다. 사용 후 연결을 다시 닫았습니다.

## 승인 단위

| 승인 | 범위 | 권한·현재 상태 |
| --- | --- | --- |
| APPROVAL_1 | DB 전용 최소 ACL, 원래 DACL 백업/복구 | 적용·사후 검증 완료 (정확히 7개 객체, DB identity 보존) |
| APPROVAL_2 | 비관리자 F 계정, 최소 권한, Windows OpenSSH·공개키·강제 명령 | 구성 완료, 실제 status 왕복 PASS, 현재 비활성 |
| APPROVAL_3 | Tailscale 사설망, T→A TCP 22 한정 방화벽 | 적용 완료 (사설망 grant 1개 + Windows T 허용/비T 차단 규칙), 현재 규칙 비활성 |
| APPROVAL_4 | A 내부 일관성 DB backup, RPC·confirmation evidence 구조 | backup·RPC 읽기 검증 완료; confirmation evidence 구조는 미생성 |
| APPROVAL_5 | 실제 Epoch 1 prepare·T 서명·송신 | **승인·실행 완료 (2026-10-20, W4-A5-20261020)**. tx 1건 |
| POST_SUBMISSION / CONFIRMATION | F submitted·confirmed | 승인·실행 완료 (W4-PS-20261020, W4-CF-20261020). 확인 339회 |
| PUBLIC_RELEASE | proof/anchor 포함 공개 bundle | 승인·공개 (W4-PR-20261020) |

status JSON은 송신 전 durable ACK(prepare)가 아닙니다. 현재 status wrapper는 prepare를 제공하지 않으므로,
승인 5에는 제한된 prepare 경로의 계약 검증이 함께 필요합니다.

## ACL과 복구

직접 변경 대상은 DB 바로 위의 전용 private 실행 디렉터리 한 곳, 원본 f.sqlite,
존재하는 동일 DB의 journal/WAL/shm입니다. 상위 Desktop/workspace/worktree는 변경하지 않습니다.
전용 디렉터리에는 비DB 파일 5개도 있어 부모 DACL의 상속 전파 영향을 승인 1에 명시해야
합니다. 이 영향이 허용되지 않으면 현재 계획을 적용하지 않습니다.

원래 운영자 SID는 기존 승인 백업에서 고정합니다. 다른 관리자 자격으로 상승해도 바꾸지
않습니다. 예상 외 principal/Deny/재분석 지점·동시 writer가 있으면 쓰기 전에 중단합니다.
대상과 전파 대상의 원래 owner/group/DACL SDDL을 새로운 비공개 백업에 보존한 뒤,
상속 차단→Users 제거→기존 운영자/Administrators/SYSTEM ACE 재구성으로 제한합니다.
전용 F 계정은 DB/저널 디렉터리 Modify, 실행 코드 ReadAndExecute, config Read,
별도 로그 쓰기만 부여하며 설정/Node/코드를 수정하지 못하게 합니다.

오류 시 후속 실행을 멈추고 동일 경로의 부모 DACL부터 원복한 뒤 자식의 저장 DACL과
protected/inherited 상태를 복구합니다. DB를 교체하거나 소유권을 탈취하지 않습니다.
변경 후 실제 계정 접근과 비DB 파일 생성/flush/삭제 probe, DB identity/bytes/epoch/member
보존을 한 번 확인합니다. 기존 status를 변경 없이 반복 실행하지 않습니다.

## 관리자 접근 후 최소 순서

1. 승인 1~4와 필요한 인증을 확정하고 사람이 UAC를 처리합니다. 승인 5는 보류합니다.
2. DACL 및 A 내부 SQLite 일관성 backup을 확보하고 최소 ACL을 적용·검증합니다.
3. 공식 OpenSSH Server와 Tailscale을 설치하되 sshd는 아직 시작하지 않습니다.
4. A/T를 승인 tailnet에 인증하고 T 장치→A 장치 TCP 22만 허용합니다.
5. 전용 F 계정·T의 **SSH 공개키**·최소 NTFS 권한을 구성합니다. Publisher 키와는 별개입니다.
6. ListenAddress를 A 사설 IP로, 방화벽도 그 local interface/address와 T source로 제한합니다.
   설치로 광역 SSH allow rule이 생겼다면 시작 전에 승인된 범위로 좁힙니다.
7. 고정 status ForceCommand, 공개키 전용 인증, shell/SFTP/TTY/포워딩 차단을 검토하고
   sshd 유효 설정 확인 후 시작합니다. T가 호스트키 지문을 별도 채널로 확인합니다.
8. status 왕복/금지 명령/timeout 차단과 승인 RPC EIP-1898 지원을 한 번 확인합니다.
9. 결과를 보고하고 승인 5 전에는 prepare/서명/송신을 하지 않습니다.

Tailscale은 사설 연결만 제공하고 **SSH 서버는 Windows OpenSSH**입니다. Windows에서
Tailscale 내장 SSH 서버를 사용하지 않습니다. 공인 포트 개방·공유기 port-forward·Funnel·
공개 raw-tx HTTP는 없습니다. T는 StrictHostKeyChecking=yes/BatchMode=yes/IdentitiesOnly=yes,
별도 known_hosts와 SSH 키를 사용합니다. T가 operation/DB/실행 파일을 선택할 수 없어야 합니다.

## 실제 송신과 후속 반영의 구별

승인 5 후에만 고정 prepare 경로를 활성화합니다. T는 서명 JSON을 stdin으로 보내고 A F는
실제 DB에 동일 raw bytes/hash/nonce를 SUBMITTING으로 durable commit한 뒤 단일 ACK를
반환합니다. T가 정확한 ACK와 exit 0을 검증한 뒤 동일 bytes만 송신합니다. timeout/오류는
송신을 차단하며 DB 미커밋을 의미하지 않습니다. 민감 stdin은 history/공개 로그에 넣지 않습니다.

송신 후 A 운영자가 별도 승인 아래 기존 F CLI의 submitted를 실행할 수 있습니다.
확정 깊이 12 이상과 독립 canonical receipt/event/hash-bound getter 검증 뒤 confirmed를
실행합니다. T에 새 후속 전송 기능을 개발할 필요는 없습니다. prepare용 15초 ACK 경로와
12초 verifier window를 수용하는 confirmation 운영 경로는 구별합니다.

## DB backup·confirmation·RPC 조건

backup은 A 내부 보호된 비공개 경로에만 만듭니다. SQLite Online Backup API 또는
quiesced 일관성 backup을 사용하고 열린 DB의 단순 파일 복사는 피합니다. backup을
authoritative로 지정하거나 T에 보내지 않습니다. prepare 직전 FROZEN과 confirmation
직전 SUBMITTED를 각 복구 지점으로 구별합니다.

F latest는 confirmation 성공의 쓰기 트랜잭션 안에서 epoch_confirmation_evidence를
생성하고 상태와 evidence를 함께 저장합니다. 기존 schema v2에 대한 정적 호환은 확인됐지만
2026-10-20 실제 원본 DB에서 confirmed 실행 시 이 테이블이 한 트랜잭션으로 생성·기록됐습니다. 테이블을 미리 생성하거나 migration 함수로
원본을 열지 않습니다. 실제 확인 실행 전 flags는 비활성으로 유지합니다.

복구는 atomic rollback/동일 tx 재조정이 우선입니다. 송신 뒤 FROZEN backup으로
되돌려 nonce/hash/raw bytes를 지우거나 재송신하지 않습니다. DB identity가 바뀌는 교체·
재바인딩이나 release_valid 강제 복구는 별도 승인 없이는 하지 않습니다.

RPC에는 승인 provider, 보호된 HTTPS endpoint/인증 설정 위치, 만료/허용 method/요청 한도가
필요합니다. Base Sepolia 84532, receipt-block 상태 조회, EIP-1898
`{blockHash,requireCanonical:true}` eth_call을 지원해야 합니다. chain/tx/receipt/block/
eth_call 조회, 3초/request·12초 verifier window를 수용해야 합니다. 지원 불가 시 latest/
block-number로 fallback하지 않습니다. 비밀 토큰은 Git/채팅에 기록하지 않습니다.

## 종료 조건

같은 실제 root의 tx/event/getter, 원본 F confirmed/evidence, 공개 Bundle release와 외부
브라우저 VALID·조작 실패 증거가 있어야 팀 GATE 판정을 합니다. 2026-10-20 모두 확보해 GATE-4는 PASS(기술 조건 14/14)입니다.
정책 provisional/team_approved=false, TEST SEALED입니다. W5 이후 작업·재학습·LOCK은 없습니다.
