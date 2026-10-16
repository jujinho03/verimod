# W4 F durable callback runner — A/T execution request

Scope: `W4_PROVISIONAL_E2E_ONLY`, `team_approved=false`. No permission to sign or broadcast is granted by this document or by an ACK. All actual-host connections remain **BLOCKED** until explicitly provisioned. No private A database path is known on F's host.

## Source pins and current result

- A: `9bcbec677d89d10364b327aae7e60955e2e4315d`.
- F starting revision: `f157b9aa7506093207e6695cc4b0ff7b83b69088`; use the **new full F SHA from the final implementation report** for execution.
- T: `34447502f8843f1be585b56fb31c51b41c0f2fc7`. Its gate/sender source is extracted read-only with `git show` into F test fixtures, with SHA-256 checks before executing the actual gate. This works in shallow CI without fetching T during tests. T files/branches are not modified.
- F entry point: `backend/scripts/f-durability-callback.mts`; Node `24.16.0`, tsx `4.23.13`, installed backend dependencies. Windows `--import` uses a file URL, including spaces and drive paths.
- Target: chain `84532`, contract `0xd17ba590b23e984e3f3408bcdc3529be9868ec50`, publisher `0xd47675be41ec3476f541c1d8d8a9f622c90182ed`.
- Reported actual epoch: ID `1`, root `0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82`, count `2`, version `1`, FROZEN, issuer `verimod-example-platform`. These are **identifiers, not evidence that F has opened A's database**.

### T composition blocker (must be fixed by T)

The exact pinned `requestDurableSubmissionAck()` validates snake_case stdout, then returns a new camelCase object. `register-epoch.ts` passes that object directly to `broadcastAfterDurableAck()`, whose assertion still reads snake_case. Consequently the valid real F CLI result is rejected at `epoch_id` and the broadcast stub stays at zero calls. F's wire protocol passes T's request function; the **complete pinned T composition fails**. No alternate stdout object can fix the fields stripped by T's request function.

T must normalize the returned object back to the wire shape before the gate (or consistently change both T types/assertions). Minimal proposed callback change in T's `register-epoch.ts`:

```ts
async () => {
  const ack = await requestDurableSubmissionAck(expected, executable, args)
  return {
    epoch_id: ack.epochId, merkle_root: ack.root, receipt_count: ack.count,
    protocol_version: ack.protocolVersion, chain_id: ack.chainId,
    contract_address: ack.contractAddress, status: ack.status,
    tx_hash: ack.txHash, nonce: ack.nonce,
  }
}
```

F tests demonstrate this explicit bridge with the actual T request function, F CLI, F adapter and SQLite, followed only by a broadcast stub. This is a proposed T fix, **not a change to the pinned production sender**. T must publish a new SHA and rerun its actual composition before claiming T/F integration PASS. Callback timeout/error/missing/bad ACK all prevent the stub. Same-byte retries succeed; conflicting retries fail.

## Host-owned private approval configuration

T stdin must never select a database, publisher, approval mode or lifecycle operation. The DB-host operator provisions an existing private config file and restricts it and its parent directories against modification by the sender identity. The sender may execute the approved wrapper, not edit its code/config or access arbitrary DBs. On Windows enforce service-account NTFS ACLs; on Unix use an equivalent dedicated account/owner-only config. Do not place this config or DB in Git.

The operator must independently identify the authoritative A run and inspect its existing `frozen-epoch-handoff.json`, private F SQLite, source pins and original evidence. Do not pick a synthetic/copy DB because its root/count look right. Configure its canonical `realpathSync()` path and `statSync(path,{bigint:true})` values for `dev` and `ino`. The runner binds to those values, checks the SQLite header, opens with `file:` URL `mode=rw` (no creation), checks the opened main database, schema version 2, FULL synchronous and persistent journaling, and does not run migrations or delete idempotency records. File replacement/restoration changes identity and requires a new reviewed binding.

**Template only — placeholders must come from A's actual host. No actual path or identity is supplied here.**

```json
{
  "schema_version": "w4-f-callback-approval/1",
  "mode": "AUTHORITATIVE",
  "approval_id": "<HOST_OPERATOR_APPROVAL_ID>",
  "database_path": "<A_OPERATOR_CANONICAL_REALPATH>",
  "database_identity": {"dev": "<ACTUAL_DEV_DECIMAL>", "ino": "<ACTUAL_INO_DECIMAL>"},
  "epoch": {
    "epochId": "1",
    "root": "0x32bf54ab91c8727e476bd4aaa13dacc6af4eaa8273656317ce7f331e29a29f82",
    "count": "2", "protocolVersion": "1"
  },
  "target": {
    "chainId": "84532",
    "contractAddress": "0xd17ba590b23e984e3f3408bcdc3529be9868ec50",
    "publisher": "0xd47675be41ec3476f541c1d8d8a9f622c90182ed"
  },
  "policy_status": "W4_PROVISIONAL_E2E_ONLY",
  "team_approved": false,
  "allow_submitted_return": false
}
```

`approval_id` identifies host authorization to use this DB; it does not assert policy/team approval. The config is the trust root, not a cryptographic certificate: a caller able to replace the trusted config/code is outside this boundary. Tests explicitly use `SYNTHETIC_TEST_ONLY` plus `--synthetic-test-only`; production mode refuses that config and pins the actual epoch/target. No synthetic config is generated for A. A static root/count alone never produces an ACK.

## Exact T execution settings

After the reviewed new F commit is fetched into a clean checkout on the DB host and dependencies installed, the following derives the settings. `VERIMOD_F_CALLBACK_CONFIG` must already name the operator's existing private absolute config file; do not invent it. `<F_CHECKOUT>` is the pinned new F checkout, not the old failed checkout.

```powershell
$fRoot = '<F_CHECKOUT>'
$fSha = '<FINAL_F_FULL_SHA_FROM_F_REPORT>'
if ((git -C $fRoot rev-parse HEAD).Trim() -ne $fSha) { throw 'Wrong F checkout' }
if ((node -p 'process.platform').Trim() -ne 'win32') { throw 'Windows acceptance requires Windows' }
$config = $env:VERIMOD_F_CALLBACK_CONFIG
if (-not $config -or -not (Test-Path -LiteralPath $config -PathType Leaf)) { throw 'A host operator must provision the private approval config' }
$loader = Join-Path $fRoot 'backend/node_modules/tsx/dist/loader.mjs'
$loaderUrl = ([System.Uri]::new((Resolve-Path -LiteralPath $loader).Path)).AbsoluteUri
$runner = Join-Path $fRoot 'backend/scripts/f-durability-callback.mts'
$env:VERIMOD_F_PREBROADCAST_ACK_EXECUTABLE = (node -p 'process.execPath').Trim()
$env:VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON = ConvertTo-Json -Compress -InputObject @('--import', $loaderUrl, $runner, '--config', $config)
# First inspect only: no signing, preparation, submission or confirmation.
& $env:VERIMOD_F_PREBROADCAST_ACK_EXECUTABLE --import $loaderUrl $runner --config $config --operation status
if ($LASTEXITCODE -ne 0) { throw 'Authoritative DB binding/status validation failed' }
```

Do not run `epoch:register` now: it signs/broadcasts, the T composition fix is pending, team authorization is absent, and post-submission propagation is incomplete. For a future approved invocation, T sends its request directly to the callback child's stdin and awaits exit 0 and the validated ACK. Raw transaction bytes must not appear in shell arguments, shell history, transcript/debug logs or public evidence. Callback args contain only the private config location, not the DB path or transaction bytes.

## Wire protocol

One UTF-8 JSON object followed by EOF, at most 32768 bytes, all nine fields required, no additional fields. Decimal fields must be canonical decimal **strings** (ABI bounds checked). Hashes/addresses/raw bytes are lowercase hex. The request is precisely T's `requestDurableSubmissionAck()` input:

```text
epochId: uint64 positive decimal string
root: nonzero bytes32
count: uint32 positive decimal string
protocolVersion: uint16 positive decimal string
chainId: positive decimal string (must match approved 84532)
contractAddress: approved lowercase address
rawTransaction: signed transaction hex bytes (PRIVATE, stdin only)
txHash: bytes32
nonce: safe nonnegative decimal string
```

The runner compares request metadata to the approved actual frozen row and recomputes root/order/count with the existing shared Merkle implementation. It verifies issuer, bounds and hash/nonce, then reuses `EpochSenderHandoff.persistBeforeBroadcast()` for signature recovery, approved publisher/chain/recipient, zero value, exact registerEpoch calldata and durable commit. It returns exactly one JSON object after closing the DB:

```text
epoch_id: string; merkle_root: bytes32; receipt_count: number;
protocol_version: number; status: "SUBMITTING"; tx_hash: bytes32;
nonce: string; chain_id: string; contract_address: address
```

No raw transaction, original text, salt or private DB path appears in stdout. Errors use sanitized stderr codes, no exception stacks; exit 1 and empty stdout. Input EOF timeout is 5 seconds; SQLite lock timeout is 1 second; T callback deadline is 15 seconds. The new F CLI never signs, imports T's sender, calls `eth_sendRawTransaction`, creates epochs or changes policy. Backend/main HTTP services expose no new endpoint.

## Deployment options and private transport

| Option | Requirements and current status |
|---|---|
| A: same approved host | T process invokes F locally where the authoritative DB already exists. Requires the existing publisher signing facility to be available there without copying its key. If it is not, do not relocate the key just for convenience. Not configured: BLOCKED. |
| B: retain T signing host | Preferred when T's approved signer already lives elsewhere. Run F beside A's DB and forward stdin/ACK over an authenticated, dedicated channel. No publisher key or DB copying. Not configured: BLOCKED. |

For B, provision a dedicated OpenSSH identity and pinned A host key out of band. Require `BatchMode=yes`, `StrictHostKeyChecking=yes`, `IdentitiesOnly=yes`, no TTY, agent forwarding, port forwarding or arbitrary remote command. Restrict the server-side account/key to a forced, owner-controlled wrapper invoking the fixed Node executable, file-URL loader, pinned runner and private approval config. Enforce OS ACLs so it cannot modify those files. Never construct a shell command from JSON input. Standard input carries private raw bytes; standard output carries only the ACK; restricted sanitized stderr goes to private operator logs. No unauthenticated HTTP endpoint or public raw-transaction port is permitted.

T configuration for the reviewed SSH deployment: `VERIMOD_F_PREBROADCAST_ACK_EXECUTABLE` is the approved absolute `ssh` executable; `VERIMOD_F_PREBROADCAST_ACK_ARGS_JSON` is the reviewed JSON array containing `-T`, batch/strict-host/identity settings, the dedicated key path and approved callback account/host. No remote free-form command is included because the server forces it. Actual account, host, host-key fingerprint and key path are intentionally unspecified until approved. Test the full latency/timeout/exit propagation before enabling it; no connection was configured in this task.

## Durability verification and recovery

For synthetic validation, run `npx vitest run test/durability-callback.test.ts` from `backend/`. For A's real DB, first run `--operation status`, check pins and read-only epoch output, and record sanitized validation externally. A must grant specific permission before changing the real FROZEN row to SUBMITTING, even though that alone sends nothing. An ACK is valid only after a separate connection/reopen observes the same SUBMITTING hash/nonce and identical stored bytes privately. The tests do this with independent SQLite connections and inert transactions; A must establish it on the actual DB before declaring host integration PASS.

After timeout/missing ACK, never assume either failure or successful transmission. Inspect the existing same epoch and private T journal. If the F row is already SUBMITTING, retry exactly the same bytes/hash/nonce to get the same ACK. A conflict requires operator reconciliation, not a new nonce, overwritten signed bytes, new epoch or DB replacement. SQLite errors return no ACK; transaction rollback preserves the prior state. Preserve all actual R01 DBs, handoffs, failed-run logs and W3 frozen material; do not clear or migrate them with this runner.

## Post-submission F state contract

T's current sender updates only its own journal. It does not invoke F's post-submission path. That propagation remains **BLOCKED** even after pre-broadcast wiring is fixed.

- `--operation status`: validates DB/epoch and emits sanitized read-only status; no lifecycle transition.
- `--operation submitted`: disabled unless the host config explicitly sets `allow_submitted_return=true` and an approved private `rpc_url`. It takes no untrusted stdin state string. It performs only `eth_chainId` and `eth_getTransactionByHash`, compares the approved chain/publisher/contract, exact durable hash/nonce/calldata/value and signed bytes, and calls existing `markSubmitted` after node acceptance is verified. A mempool-observed transaction establishes SUBMITTED only. Each read times out after 3 seconds. Tests use only a loopback RPC stub; no Base Sepolia reads/writes were performed. Production endpoint/authorization and T invocation remain BLOCKED.
- `--operation confirmed` / `failed`: rejected. No unverified JSON, T console output, ACK, journal string, timeout or arbitrary block identifier can call `markConfirmed`/`markFailed` through this runner.
- Required before a future CONFIRMED path: trusted authenticated RPC/network; approved chain/contract/publisher; exact stored transaction; successful receipt status/to/from/hash; canonical block hash/height; contract-emitted `EpochRegistered` event with exact epoch/root/count/version; same `epochs()` getter; at least the approved **12 confirmations**, including reorg handling. Equal-root existing epochs need the same evidence. The pinned sender's `tx.wait()` default and journal's CONFIRMED string alone are insufficient.
- Required before FAILED: trusted proof of REVERTED/ROOT_CONFLICT or an independently approved retry policy; transport timeout alone is insufficient. Preserve stored transaction identity. No FAILED CLI transition is exposed yet.

F's low-level methods are internal state transitions, not RPC verifiers; do not expose them directly as trusted CLI input. Public proof/anchor remain withheld until validated CONFIRMED. Actual confirmation verification and full post-state propagation remain BLOCKED; Gate 4 stays PARTIAL.
