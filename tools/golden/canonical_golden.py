#!/usr/bin/env python3
"""Independent canonical JSON + SHA-256 checker for W2 golden vectors.

This module intentionally uses only Python's standard library and does not
import the TypeScript protocol implementation.  Its JSON subset is the W2
Canonical Profile v1 subset: null, booleans, safe integers, strings, arrays,
and objects with UTF-16-code-unit key ordering.
"""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path
from typing import Any

MAX_SAFE_INTEGER = 2**53 - 1


def _assert_well_formed(text: str) -> None:
    for index, char in enumerate(text):
        value = ord(char)
        if 0xD800 <= value <= 0xDBFF:
            if index + 1 == len(text) or not 0xDC00 <= ord(text[index + 1]) <= 0xDFFF:
                raise ValueError("lone high surrogate")
        elif 0xDC00 <= value <= 0xDFFF:
            if index == 0 or not 0xD800 <= ord(text[index - 1]) <= 0xDBFF:
                raise ValueError("lone low surrogate")


def _utf16_key(value: str) -> bytes:
    _assert_well_formed(value)
    return value.encode("utf-16-be", "surrogatepass")


def canonicalize(value: Any) -> str:
    if value is None:
        return "null"
    if value is True:
        return "true"
    if value is False:
        return "false"
    if isinstance(value, int):
        if not -MAX_SAFE_INTEGER <= value <= MAX_SAFE_INTEGER:
            raise ValueError("unsafe integer")
        return str(value)
    if isinstance(value, str):
        _assert_well_formed(value)
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(canonicalize(item) for item in value) + "]"
    if isinstance(value, dict):
        pairs = []
        for key in sorted(value, key=_utf16_key):
            if not isinstance(key, str):
                raise ValueError("object key is not a string")
            pairs.append(f"{canonicalize(key)}:{canonicalize(value[key])}")
        return "{" + ",".join(pairs) + "}"
    raise ValueError(f"unsupported value: {type(value).__name__}")


def main() -> int:
    vector_path = Path(sys.argv[1]) if len(sys.argv) == 2 else Path("shared/vectors/golden/canonical-v1.json")
    vectors = json.loads(vector_path.read_text(encoding="utf-8"))
    failures = []
    for vector in vectors["vectors"]:
        actual = canonicalize(vector["input"])
        digest = hashlib.sha256(actual.encode("utf-8")).hexdigest()
        if actual != vector["canonical_json"] or digest != vector["sha256"]:
            failures.append(vector["id"])
    if failures:
        print("FAIL " + ", ".join(failures))
        return 1
    print(f"PASS {len(vectors['vectors'])}/{len(vectors['vectors'])} independent canonical golden vectors")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
