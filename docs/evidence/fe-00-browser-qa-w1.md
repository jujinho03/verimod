# FE-00 — W1 Browser / Routing Evidence

## Metadata
- Owner: 노유신 / F
- Actual verification date: 2026-09-30, 20:11–20:24 KST (UTC+09:00)
- Latest main SHA used: `19f77a2079f118e71a1a7c3ef83dd469c99e2b48`
- Branch: `evidence/w1-f-browser-closure`
- OS: Windows, build 10.0.26200
- Node: v24.16.0
- npm: 11.13.0
- Browser: Codex In-app Browser (real browser tab). Exact engine version unavailable through the supported browser API; internal version-page access was blocked. No version was inferred from other installed browsers.
- Local URL: `http://127.0.0.1:5179/`
- Startup: `npm run dev -- --host 127.0.0.1 --port 5179 --strictPort`
- Preflight: origin URL verified; clean working tree; fetched main matched the expected SHA. Fresh branch created from origin/main. Historical no_usin was not merged or cherry-picked.

## Build / Test
Commands ran in frontend with a workspace-local npm cache. All exit statuses were 0.

| Command | Result | Important output |
|---|---|---|
| npm ci | PASS (0) | 55 packages added; 56 audited; 0 reported vulnerabilities |
| npm test | PASS (0) | 10 test files, 104 tests; start 20:12:23 KST; 6.72s |
| npm run lint | PASS (0) | oxlint completed, no diagnostics |
| npm run build | PASS (0) | TypeScript + Vite 8.3.0; 86 modules; built in 1.62s |

These are frontend execution results, not security certification or API/DB/AI/chain integration evidence.

## Route Matrix
Routes were re-read from frontend/src/main.tsx. Real browser DOM/accessibility observations confirmed page content and shared Layout/navigation. Navigation links were activated with Enter. The wildcard was opened directly. Console warning/error logs were checked during the session and were empty; no app fatal error or error overlay was observed. This is a bounded smoke check, not exhaustive browser instrumentation.

| Route | Rendered | Fatal Error | Observed UI | Result | Notes |
|---|---|---|---|---|---|
| / | YES | None observed | VeriMod heading, navigation, Prototype mode, demo links | PASS | Direct load |
| /check | YES | None observed | 판정할 글, empty input, synthetic warning, example buttons | PASS | Footer 판정 요청 link; screenshot |
| /receipts | YES | None observed | 발급받은 영수증과 봉인 상태, five synthetic seeds, filters | PASS | 내 영수증 link; screenshot |
| /receipts/a91d3c07-6e2b-4b58-9f14-2c7e8d0b5a63 | YES | None observed | 판정 영수증, anchor stage, synthetic summary, verification controls | PASS | Existing seed link; no fixture/code modification |
| /verify | YES | None observed | 받은 영수증을 직접 다시 계산합니다, selector, verification result | PASS | 영수증 검증 link; VALID then RPC_UNAVAILABLE |
| /review | YES | None observed | 대기 중인 이의제기와 검토 보류 건, queue, review form | PASS | 검토 콘솔 link; no review submitted |
| /protocol | YES | None observed | 영수증을 만들고 검증하는 규칙, implemented/simulated/next sections | PASS | 영수증 형식 link to /protocol#receipt |
| /w1-route-not-found | YES | None observed | 404, 페이지를 찾지 못했습니다, home/receipts links | PASS | Wildcard route |

Observed limitation: /review still contains the historical “RESOLVED는 팀 합의 전 임시 값” wording already identified in the static audit. Rendering PASS does not endorse this wording or supersede D08. Product code was not changed.

Keyboard activation sometimes left the browser capture at an unhelpful scroll position. Ctrl+Home restored the captured viewport. Screenshots were inspected and the unusable initial badge capture was replaced; this is not a blanket claim about scroll behavior across browsers.

## Status / Badge Matrix
Existing components were inspected in frontend/src/ui/bits.tsx; no new component was created.

| Component/state | Where observed | Actual rendering result | Boundary |
|---|---|---|---|
| AnchorBadge -> StatusBadge(pass) | /receipts and seed detail | 앵커 확인 shown; list screenshot includes green badges | Simulated ledger, not Base Sepolia |
| SyntheticPill | /receipts and detail | 합성 시드 / 합성 점수 shown | Built-in synthetic data |
| VerifyReportView VALID | /verify, default REVIEW seed | Green VALID / 기록 일치 and passed steps | Real local hash/proof computation against simulated ledger |
| VerifyReportView RPC_UNAVAILABLE | /verify, existing RPC 장애 가정 checkbox | 원장 조회 불가, 대기/skipped steps; no tampering claim | Simulated failure control, not real RPC outage |
| CodeBadge | /protocol#codes | Existing code table DOM includes VALID, HASH_MISMATCH, INVALID_PROOF, PENDING_ANCHOR, RPC_UNAVAILABLE, INVALID_SCHEMA | Static reference table; no runtime execution claimed for every listed code; separate visual capture not obtained |

Normal verification used the built-in REVIEW seed 0f6a9e3b-4d2c-4a17-b8e5-7c1d2f6a9e30. No real user input, appeal, package, network anchor or authenticated reviewer action was used.

## Screenshots
New browser-content-only captures made on 2026-09-30 during this closure:

- [Routing](../assets/w1-fe-routing-2026-09-30.png): /check heading, shared navigation, Prototype mode and empty input.
- [Verification status](../assets/w1-fe-status-badges-2026-09-30.png): /verify, green VALID result and explicit simulation banner.
- [Anchor badges](../assets/w1-fe-anchor-badges-2026-09-30.png): /receipts, built-in seed pills and existing AnchorBadge/StatusBadge rendering.

The dates inside seed receipts are fixture timestamps, not screenshot dates. No older screenshot was reused. No visual content was synthesized or retouched.

## Security / Privacy Check
- secrets visible: NO
- personal data visible: NO
- actual private receipt data: NO
- screenshot generated during current W1 closure: YES
- Raw salt values, private packages, authentication tokens, account chrome and real user text are absent from the three screenshots. Only public synthetic demo fields appear.

## Scope Boundary
- Static frontend skeleton and browser rendering evidence only.
- Not evidence of completed API implementation.
- Not SQLite integration evidence.
- Not real AI inference integration evidence.
- Not actual Base Sepolia anchoring evidence.
- Not a declaration of production browser QA completion.
- W2 implementation was not started.
- Existing FE-00a/b/c and screen requirements were preserved; no new scaffold was necessary.
- docs/progress/W1.md and docs/03-current-status.md were not modified. Team-wide tracker linkage remains the team lead's follow-up.

## Final Result
FE-00 W1 BROWSER / ROUTING EVIDENCE = PASS

Scope: the routes and states observed above in one browser session. Exact browser engine version remains unverified. PR/CI approval and team-wide W1 closure are separate from this local rendering result.
