#!/usr/bin/env python3
"""Verify published ReceiptBody domain hashes without importing TypeScript."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from canonical_golden import canonicalize

ROOT = Path(__file__).resolve().parents[2]
DOMAIN = b"verimod:receipt:v1\x00"
EXPECTED = {
    "original": "0xf6a88d533098cc72001f3611251c91c5d4fb48cbb018d79ef5f1d6b8ba24759b",
    "top-reordered": "0xf6a88d533098cc72001f3611251c91c5d4fb48cbb018d79ef5f1d6b8ba24759b",
    "payload-reordered": "0xf6a88d533098cc72001f3611251c91c5d4fb48cbb018d79ef5f1d6b8ba24759b",
    "unicode-issuer": "0x0a58cb18d79833d39291cd56df7d57b896ff3be324aa6db79f5ec7694631b8e3",
    "unicode-evidence-method": "0x75829c21256d20745530788b343889b53f521bd81e4a991d5b99ba7f409b9542",
}


def main() -> int:
    base = json.loads((ROOT / "docs" / "examples" / "01-valid.json").read_text(encoding="utf-8"))["receipt_body"]
    cases = {
        "original": base,
        "top-reordered": {key: base[key] for key in reversed(list(base))},
        "payload-reordered": {**base, "payload": {"policy": base["payload"]["policy"], "inference": base["payload"]["inference"]}},
        "unicode-issuer": {**base, "issuer_id": "verimod-검증"},
        "unicode-evidence-method": {**base, "payload": {**base["payload"], "inference": {**base["payload"]["inference"], "evidence": [{"end": 14, "start": 12, "label_id": "violence", "method_id": "검증😀", "method_version": "0.1"}]}}},
    }
    failures: list[str] = []
    for name, body in cases.items():
        actual = "0x" + hashlib.sha256(DOMAIN + canonicalize(body).encode("utf-8")).hexdigest()
        if actual != EXPECTED[name]:
            failures.append(name)
    if failures:
        print("FAIL " + ", ".join(failures))
        return 1
    print(f"PASS {len(cases)}/{len(cases)} independent ReceiptBody domain-hash golden vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
