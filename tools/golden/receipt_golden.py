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
    "original": "0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f",
    "top-reordered": "0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f",
    "payload-reordered": "0x2dcaff4155a88bd14317e9b9969784b5d0ab5cbfc34cd2c21a00ab462e34687f",
    "unicode-issuer": "0x3b81c92138cb069a92c83890ee4b9037ffb9abb975397cca6e53a75513f37a41",
    "unicode-evidence-method": "0x139bdf5bb1a1a57d1af6ad98d7339c6732006e8282df13a71530781967308611",
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
