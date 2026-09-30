# SEC-01 — Contracts Dependency Audit

- Status: **W1 SECURITY EVIDENCE — AUDIT / IMPACT ASSESSMENT**
- Recorded: **2026-09-30**, W1 late evidence closure. W1 nominal period로 소급하지 않는다.
- Repository SHA: `8fa24f28e6bea4b1ac11c2a50c78ae6c66a2f2c7`
- Lockfile: `backend/contracts/package-lock.json`, SHA-256 `e8318cc35ef3a0bd2674014fae96b906fb246782b6bd7d195c4c98ead67d8c49` (명령 실행 전후 동일)

## Scope

**backend/contracts dependency tree only.** Full application security audit, smart-contract audit, production penetration test 또는 supply-chain security guarantee가 아니다. frontend/backend manifest·lock·source는 이 affected tree의 production 전달 여부를 확인하는 데만 읽었다. 다른 package 전체의 취약점을 감사한 것은 아니다.

## Commands

Node `v24.19.0`, npm `12.0.2`. 현재 shell의 `npm` 명령은 PATH에서 발견되지 않아, 이미 설치된 workspace 외부 도구를 다음과 같이 실행했다. 새 설치·upgrade는 없었다. cwd는 `backend/contracts`다.

```powershell
node --version
node '..\..\..\.desktop-tools\npm-12.0.2\package\bin\npm-cli.js' --version
node '..\..\..\.desktop-tools\npm-12.0.2\package\bin\npm-cli.js' audit --json
node '..\..\..\.desktop-tools\npm-12.0.2\package\bin\npm-cli.js' audit --omit=dev --json
node '..\..\..\.desktop-tools\npm-12.0.2\package\bin\npm-cli.js' explain mocha serialize-javascript diff elliptic --json
```

Full audit exit **1**은 아래 vulnerability 보고 결과이며 도구 실행 실패가 아니다. Production-only audit exit **0**, explain exit **0**. 현재 registry 응답을 사용했으며 Stage 7A 숫자를 복사한 것이 아니다. Raw audit JSON은 repository에 추가하지 않았다. 아래는 실제 결과의 package/advisory·경로·처분 요약이다. Registry advisory는 이후 변할 수 있다.

## Current audit summary

| Scope | Critical | High | Moderate | Low | Total |
|---|---:|---:|---:|---:|---:|
| Full dependency tree | 0 | 1 | 1 | 12 | 14 |
| Production-only (`--omit=dev`) | 0 | 0 | 0 | 0 | 0 |

**npm production-dependency audit reports 0 vulnerabilities.** 이는 이 contracts package의 npm production-dependency 범위에 한한다. 프로젝트 전체 무위험을 뜻하지 않는다. Full tree의 **14 vulnerable package entries는 여전히 남아 있다**. package별 집계이므로 advisory 수와 같지 않다. 특히 serialize-javascript 안에는 HIGH와 MODERATE advisory가 모두 있지만 package count는 HIGH 1개다.

## Package boundary

[contracts package.json](../../backend/contracts/package.json)에 runtime `dependencies` 선언은 **없다**. 직접 선언 9개는 모두 `devDependencies`다.

| Direct devDependency | Declaration |
|---|---|
| @nomicfoundation/hardhat-toolbox-mocha-ethers | ^3.0.7 |
| @types/chai | ^5.2.3 |
| @types/mocha | ^10.0.10 |
| @types/node | ^22.20.2 |
| chai | ^6.2.2 |
| ethers | ^6.17.0 |
| hardhat | ^3.16.0 |
| mocha | ^11.8.0 |
| typescript | ~6.0.3 |

역할: `hardhat build`, `hardhat test`, 명시적 local wallet provisioning / read-only RPC helper. [CI](../../.github/workflows/ci.yml)는 contracts 디렉터리를 별도 matrix job으로 설치·시험·build한다. `devDependency`라는 선언만으로 무영향 판정하지 않는다. 개발자/CI 권한으로 실행되는 code이며 local helper는 별도의 admin/tooling context다.

### Production and bytecode exposure evidence

| Boundary | Observed evidence at the baseline | Assessment |
|---|---|---|
| Browser / backend service | [frontend manifest](../../frontend/package.json), [backend manifest](../../backend/package.json)와 각각의 lockfile에 아래 14 affected package 이름이 없음. `frontend/src`, `backend/src`에 해당 toolchain import 없음. [backend build](../../backend/tsconfig.build.json)는 src만 포함하며 [app](../../backend/src/app.ts)은 Express health scaffold | 현재 repository 구성에서 이 affected tree는 service/browser production dependency로 전달되지 않음. 실제 외부 배포 환경 전수 검증이나 전체 app 무취약성 주장은 아님 |
| Contracts development / CI | [Hardhat config](../../backend/contracts/hardhat.config.ts)가 toolbox를 load. 직접 Mocha 및 toolbox의 hardhat-mocha peer 경로 존재 | 개발·CI toolchain residual exposure 존재. CI가 외부 PR 코드를 실행할 때도 dev dependency는 실제 실행 코드임 |
| Local wallet / RPC helpers | [wallet helper](../../backend/contracts/scripts/provision-test-wallet.mjs), [RPC helper](../../backend/contracts/scripts/check-base-sepolia.mjs)는 `ethers` 6.17.0 사용. lock의 ethers 6 dependency는 @noble 계열이며 아래 ethersproject v5 → elliptic 경로와 구분됨. RPC는 fetch + JSON.parse 계열 응답 처리이며 serialize-javascript를 호출하지 않음 | helper를 Mocha serializer 또는 elliptic v5 signing 경로로 동일시하지 않음. helper 전체 보안 보증은 아님; 이번에 wallet/RPC 실행하지 않음 |
| On-chain runtime | [ToolchainCheck.sol](../../backend/contracts/contracts/ToolchainCheck.sol)은 자체 ping 함수뿐이며 affected npm JS import 없음 | 아래 취약 JS가 현재 Solidity deployed bytecode에 포함되는 경로 없음. compiler/build 환경의 위험은 별개이며 배포 또는 anchor 구현을 주장하지 않음 |

## Vulnerability assessment

Severity·range·fixAvailable은 **현재 npm audit 응답값**이다. Root 기준 direct/transitive와 root dependency class를 구분한다. npm explain의 Mocha → serializer edge가 `prod`여도 root Mocha가 dev이므로 contracts root에서 두 package는 `dev: true`다.

| Package | Severity | Advisory / vulnerable range | Dependency path | Runtime classification | VeriMod exposure | Fix availability | Disposition |
|---|---|---|---|---|---|---|---|
| serialize-javascript **6.0.2** | **HIGH** | [GHSA-5c6j-r48x-rmvq][S1]: RCE via RegExp.flags / Date.prototype.toISOString; **<=7.0.2** | root dev `mocha@11.8.0` → `serialize-javascript@6.0.2`; toolbox → hardhat-mocha → Mocha peer 경로도 존재 | transitive dev / CI | 공격자 제어 객체를 serialize하고 결과를 실행할 때 code injection 위험. Mocha 병렬 worker options 직렬화/평가 경로가 실제 존재함. 현재 tracked config/CI는 parallel을 활성화하지 않으며 서비스 입력에서 이 경로로 전달되는 연결 없음 | npm: `{name: mocha, version: 12.0.2, isSemVerMajor: true}`. 이 advisory upstream patch는 7.0.3 | **잔존 위험 기록 / 수정 보류**. 향후 Mocha/plugin 호환성 검토가 필요하며 무영향·수정 완료로 처리하지 않음 |
| serialize-javascript **6.0.2** | **MODERATE advisory** (위 HIGH package 안의 추가 advisory) | [GHSA-qj8w-gfj5-8c6v][S2]: CPU exhaustion via crafted array-like objects; **>=5.0.0 <7.0.5** | 위와 동일 | transitive dev / CI | 공격자 제어 array-like object를 serialize하면 CPU DoS 가능. 같은 옵션 직렬화 경로가 잠재적 접점이며 현재 service/RPC response 경로와는 연결 없음 | 동일 npm Mocha 12.0.2 major 제안. 이 advisory upstream patch는 7.0.5 | **잔존 위험 기록 / 수정 보류**. HIGH 수정 버전만으로 이 MODERATE까지 해결됐다고 간주하지 않음 |
| mocha **11.8.0** | **MODERATE package entry** | 독립 GHSA가 아니라 `via: diff, serialize-javascript`; npm aggregate range **8.2.0 - 12.0.0-beta-3** | root direct dev Mocha; toolbox와 hardhat-mocha는 peer `^11.0.0` 요구 | direct dev / CI | 실제 contracts test runner. 위 serializer와 아래 diff 취약성이 toolchain에 전파됨. npm의 aggregate severity를 임의로 HIGH 또는 무영향으로 재분류하지 않음 | npm: Mocha **12.0.2**, **semver-major** | **별도 dependency transition 검토 대상으로 보류**. 현재 peer ^11과의 호환성은 검증되지 않아 자동 upgrade 권고/실행하지 않음 |
| diff **7.0.0** | LOW | [GHSA-73rr-hh4g-fpgx][S3]: parsePatch/applyPatch DoS; advisory **>=6.0.0 <8.0.3**, npm package range **6.0.0 - 8.0.2** | root dev Mocha → diff | transitive dev / test reporting | Mocha reporter가 diff를 사용하지만 확인한 base reporter 호출은 createPatch/diffWordsWithSpace이며 취약 parsePatch/applyPatch 직접 호출은 찾지 못함. 이것이 모든 dependency 경로 안전 증명은 아님 | npm: Mocha 12.0.2 major 제안 | serializer/Mocha transition 검토와 함께 보류; 취약 package count에서 제외하지 않음 |
| elliptic **6.6.1** 및 전파 package 10개 | LOW **11 entries** | [GHSA-848j-6mx2-7j84][S4]: risky ECDSA implementation; **<=6.6.1**, audit package range `*` | toolbox peer → hardhat-verify → @ethersproject/abi → hash → abstract-signer → abstract-provider → transactions → signing-key → elliptic. Ignition peer 경로도 이 tree에 연결 | root toolbox는 direct dev, 나머지 transitive dev | 서명 primitive 위험은 남음. 현재 helper의 ethers v6 경로와 별개이며 프로젝트가 elliptic 기반 signing을 직접 호출하는 증거는 없음. 이 사실을 개발 toolchain 전체에 대한 무영향으로 확대하지 않음 | npm **fixAvailable: false**; advisory patched version 없음 | upstream remediation 추적 및 실제 signing/verification 사용 범위 확장 전 재검토 대상으로 기록. 이번 범위에서 dependency 수정 없음 |

### LOW entries reconciliation

LOW 총 **12** = `diff` 1 + elliptic 연결 tree 11. 후자의 전체 목록:

- `elliptic@6.6.1`
- `@ethersproject/abi`, `@ethersproject/abstract-provider`, `@ethersproject/abstract-signer`, `@ethersproject/hash`, `@ethersproject/signing-key`, `@ethersproject/transactions`: 각각 **5.8.0**
- `@nomicfoundation/hardhat-verify@3.1.1`
- `@nomicfoundation/hardhat-ignition@3.1.8`
- `@nomicfoundation/hardhat-ignition-ethers@3.1.6`
- `@nomicfoundation/hardhat-toolbox-mocha-ethers@3.0.7`

이 11개는 서로 다른 11개 root advisory라는 뜻이 아니다. npm의 dependency propagation entries이며 모두 fixAvailable false다. lockfile에서 versions와 dev flags, npm explain에서 root까지의 연결을 확인했다.

### Call-path evidence and limits

기존 설치 package의 버전이 lockfile과 일치함을 확인한 뒤 아래 source를 **읽기만** 했다. 새 설치나 exploit 실행은 없다.

- `node_modules/mocha/lib/nodejs/buffered-worker-pool.js:16,166–171`: serialize-javascript로 worker options 직렬화.
- `node_modules/mocha/lib/nodejs/worker.js:87`: serialized options 평가. 따라서 취약 serializer가 실행 가능한 경로 자체를 부정하지 않는다.
- `node_modules/@nomicfoundation/hardhat-mocha/dist/src/task-action.js:59` 및 `hookHandlers/config.js`: parallel은 optional이며 조건부 분기. 현재 repository Hardhat config와 CI 명령은 parallel 설정을 하지 않는다. 실행 추적을 했다는 주장은 아니다.
- `node_modules/mocha/lib/reporters/base.js:16,521` 및 diff 호출 검색: diff reporter 사용과 patch parser 호출을 구분.
- 위 package의 고정 version/dependency 근거는 [contracts lockfile](../../backend/contracts/package-lock.json). `node_modules`는 commit하지 않는다. 별도 독자가 동일 lock의 source와 명령으로 재검증할 수 있다.

## Residual risk

현재 확인된 노출은 contracts 개발/CI/admin tooling 경계다. 취약 package는 남아 있으며 개발 환경·CI·dependency supply-chain risk가 존재한다. 공격자 제어 test/config/options가 유입되거나 parallel/관련 도구 사용이 확대되면 현재의 제한된 경로 판단을 다시 해야 한다. `dev`라는 이유로 안전하거나 실행되지 않는다고 주장하지 않는다.

현재 CI는 contents:read, checkout persist-credentials:false이고 workflow에 wallet secret 전달은 없지만, 이것만으로 CI 격리나 모든 secret 보호를 보증하지 않는다. 기존 [협업 secret 규칙](../../CONTRIBUTING.md)을 따르며 이 task는 새로운 보안 통제를 구현하지 않는다.

Disposition의 의미는 **현재 영향과 후속 검토 필요성을 기록하고 사용자 지시에 따라 dependency 변경을 수행하지 않음**이다. 영구 risk acceptance, upstream patch 검증, owner 승인 완료 또는 취약점 해소가 아니다. npm이 제시한 major upgrade는 plugin peer compatibility와 회귀 확인이 필요한 별도 작업이다.

## W1 disposition

**SEC-01 = PASS — W1 AUDIT / IMPACT ASSESSMENT.** W1 DoD의 audit performed + impact/disposition documented를 충족한다. No dependency upgrade was performed. `npm audit fix`는 실행하지 않았다.

Closure guard: current critical **0**, production-only high/critical **0**, HIGH/MODERATE dependency paths 식별 완료, current service/runtime 경계 확인 완료. 전체 app security 또는 모든 취약점 수정의 PASS가 아니다.

D01~D17 ADOPTED / D18~D28 WORKING ASSUMPTION, Row-25/32 UNRESOLVED 유지. TRUST-01의 상세 freeze, FRZ-01, deployment/funding, OPS-01/02, W2는 이 security assessment의 완료 범위가 아니다.

## Sources

- npm `audit --json`, `audit --omit=dev --json`, `explain`의 **2026-09-30 실제 실행 결과**. 기준 package/lock SHA 및 commands는 위에 기록했다.
- Repository manifests, lockfiles, scripts/config, source, CI: 모두 기준 SHA `8fa24f28e6bea4b1ac11c2a50c78ae6c66a2f2c7`에서 검사. 문서 상대 링크는 파일 위치이며 감사 시점은 이 고정 SHA다.
- [S1 — serialize-javascript RCE advisory][S1], [S2 — serialize-javascript CPU DoS advisory][S2], [S3 — jsdiff patch DoS advisory][S3], [S4 — elliptic ECDSA advisory][S4]: GitHub Reviewed Advisory Database, accessed **2026-09-30**. 각각 공격 전제·affected/patched version 확인. npm aggregate package severity와 개별 advisory severity를 구분한다.

[S1]: https://github.com/advisories/GHSA-5c6j-r48x-rmvq
[S2]: https://github.com/advisories/GHSA-qj8w-gfj5-8c6v
[S3]: https://github.com/advisories/GHSA-73rr-hh4g-fpgx
[S4]: https://github.com/advisories/GHSA-848j-6mx2-7j84
