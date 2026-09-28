#!/usr/bin/env python3
"""Verify published ReceiptBody domain hashes without importing TypeScript."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

from canonical_golden import canonicalize

ROOT = Path(__file__).resolve().parents[2]
DOMAIN = b"verimod:receipt:v1\x00"
EXAMPLES = {
    "01-valid.json": True,
    "02-tampered.json": False,
    "03-rehashed.json": True,
}


def main() -> int:
    failures: list[str] = []
    for name, expected_match in EXAMPLES.items():
        bundle = json.loads((ROOT / "docs" / "examples" / name).read_text(encoding="utf-8"))
        actual = "0x" + hashlib.sha256(DOMAIN + canonicalize(bundle["receipt_body"]).encode("utf-8")).hexdigest()
        if (actual == bundle["receipt_hash"]) != expected_match:
            failures.append(name)
    if failures:
        print("FAIL " + ", ".join(failures))
        return 1
    print("PASS 3/3 independent ReceiptBody domain-hash golden vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
