# DOC-12(T) — Protocol Prior Art and Trust Boundaries

## Status

- Owner: T / 설경민
- W1 late evidence closure; recorded 2026-10-01.
- Research / prior-art only. This is not protocol implementation, a freeze decision, or provider adoption.
- It introduces no receipt field, TrustProfile, ABI, witness quorum, TEE provider, or production architecture.

## 1. Sigstore Rekor

### What it is

Rekor is Sigstore's transparency log for signed software metadata. Sigstore describes it as an immutable, tamper-resistant ledger that lets parties record and query signed metadata; it is not a general claim that the recorded software is correct.[^rekor-overview]

### Mechanism

Entries are accumulated in a Merkle tree. Rekor periodically signs the tree and a timestamp. A verifier can obtain an inclusion proof for an entry and check the signed tree head (checkpoint / signed tree head) using the trusted log key material.[^sigstore-security][^rekor-cli]

### Inclusion / consistency

An inclusion proof establishes that a particular entry is present in the committed tree. Consistency checking compares tree states to test append-only behavior: prior entries should remain, not be mutated or removed. Rekor documents this as an auditor responsibility, not as an automatic semantic validation of entry contents.[^rekor-overview]

### Witness / monitoring

Rekor's own documentation calls for monitoring: auditors can monitor consistency and identity owners can monitor their identities. Sigstore also notes that, without third-party monitoring, Rekor/Fulcio misbehavior can go undetected.[^rekor-overview][^sigstore-security]

### Operator trust boundary

The trust root verifies Rekor material, but a signed log entry only records a signing/recording event. Log operator signatures, Merkle proofs, checkpoints, monitors, and independent verifiers reduce undetected equivocation risk; they do not make the object inside an entry true or safe.

### What it proves

Subject to successful cryptographic verification and the configured trust root, it can support a claim that a specified signed entry was included in a particular committed log state and that append-only history can be audited.

### What it does NOT prove

Inclusion is not semantic correctness. A Rekor entry does not prove that its artifact is benign, its claims are accurate, its signer was uncompromised, or a decision based on that artifact is correct.

## 2. Ethereum Witnessing Reference — su3.io

### Source identity

- Title: *Witnessing Sigstore's transparency log from the Ethereum blockchain*
- Author: Heyang Zhou
- Published: 2024-08-25
- Accessed: 2026-10-01
- Status: independent technical article and prototype reference, **not** a Sigstore official Ethereum architecture.[^su3]

### Problem being addressed

The article discusses a compromised-log split-view attack: different clients can be shown different signed tree heads. It presents third-party witnesses that fetch and co-sign tree heads as one mitigation, while noting the client must still reach an honest witness.[^su3]

### Mechanism described

The prototype submits a Rekor tree head, an operator signature, and a Merkle consistency proof to a Scroll smart contract. The article then describes committing Scroll's state trie root and a zero-knowledge state-transition proof to Ethereum. A verifier gathers evidence from untrusted Ethereum, Scroll, and Rekor services and checks that an entry rolls up to the public state commitment.[^su3]

### Role of Ethereum / L2

In this reference, Scroll/Ethereum provide an external public commitment / witness point; Rekor remains the log. The author's performance, cost, and blockchain-security assessments are the author's opinions, not properties adopted by VeriMod.

### What the approach can strengthen

It is a useful example of reducing dependence on a log operator alone by independently checking inclusion, consistency, operator signatures, and an external public commitment.

### What it does NOT prove

It does not prove the truth or quality of the signed artifact, remove all trust assumptions, or make Ethereum universally the best witness. It also does not make this prototype a Sigstore standard.

## 3. TEE / Inference Attestation

The A-owned note is [tee-inference-attestation-w1.md](tee-inference-attestation-w1.md).[^tee-note]

### Model manifest limitation

`model_manifest_hash` identifies a recorded model/revision/configuration manifest; it does not prove that model performed a particular inference.

### Output signing and signer compromise

Output signing can bind an output to a signer/key and reveal later changes. If the signing server, key, or signing path is compromised, however, incorrect output can still carry a valid signature.

### TEE / remote attestation and correctness boundary

TEE and remote attestation are future directions for strengthening execution-environment trust through measurements, endorsements, and verifier policy. They are not implemented or selected in W1, and do not prove that an AI moderation judgment is semantically correct.

## 4. Comparison Matrix

| Item | Primary object | Commitment / verification | Trust / witness model | Execution attestation | Correctness guarantee | Privacy implication | VeriMod relevance / current status |
|---|---|---|---|---|---|---|---|
| Sigstore Rekor | Signed software metadata | Merkle inclusion, signed tree head, consistency audit | Sigstore trust root plus monitors/auditors | No | No artifact semantic correctness | Public signed metadata is auditable | Prior-art only |
| su3.io Ethereum witness reference | Rekor tree heads and consistency proofs | Public-chain state commitment plus Rekor/operator proofs | Prototype's Ethereum/Scroll and verifier assumptions | No | No entry/artifact correctness | Public commitments/evidence may be observable | Prior-art only; not adopted |
| VeriMod W1 design | Decision Receipt epoch commitment | Receipt hash, ordered Merkle linkage, planned external anchor | TrustProfile working-assumption draft is the planned verifier authority; FRZ-01 pending | No | No AI-decision correctness | Do not put original content/salt on chain | Design drafts; no VeriModAnchor deployment or epoch anchor |
| TEE / remote attestation future direction | Measured inference/signing environment | Attestation evidence, endorsements, reference values, policy | Hardware/platform root and verifier policy | Potentially yes | No semantic AI correctness | Attestation material may disclose platform metadata | Research only; not selected or implemented |

## 5. VeriMod Design Takeaway

VeriMod's blockchain layer does **not** prove that an AI moderation decision is correct. Its intended scope is Decision Receipt commitment, epoch/Merkle linkage, external timestamp/anchor, post-issuance record integrity, and user-independent verification.

Rekor and the Ethereum witnessing reference are relevant to inclusion, consistency, external witnessing, and reducing dependence on a single operator. They do not authorize a new VeriMod protocol decision. TEE is a possible future route to stronger inference-execution trust, not a W1 implementation or adoption.

## 6. Sources

[^rekor-overview]: [Rekor overview](https://docs.sigstore.dev/logging/overview/), Sigstore, accessed 2026-10-01.
[^sigstore-security]: [Security Model](https://docs.sigstore.dev/about/security/), Sigstore, accessed 2026-10-01.
[^rekor-cli]: [Rekor CLI](https://docs.sigstore.dev/logging/cli/), Sigstore, accessed 2026-10-01.
[^su3]: [Witnessing Sigstore's transparency log from the Ethereum blockchain](https://su3.io/posts/witnessing-sigstore-from-ethereum), Heyang Zhou, 2024-08-25, accessed 2026-10-01.
[^tee-note]: [DOC-12(A) — TEE / Inference Attestation W1 Note](tee-inference-attestation-w1.md), repository research note, recorded 2026-09-30, read 2026-10-01.
