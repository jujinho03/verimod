"""Synthetic-only AI-12 preregistration checks. No data path argument or loader."""

from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from verimod_ai.evaluation.w5_preregistration import (  # noqa: E402
    CONFIG, RealEvaluationBlocked, build_synthetic_report,
    inspect_approval_metadata, reject_real_evaluation,
)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("check-preparation", "synthetic-dry-run", "test-evaluate"))
    parser.add_argument("--sampling-unit", choices=("group", "item"), default="group")
    parser.add_argument("--save-evidence", action="store_true",
                        help="save a fresh report under the fixed w5_ai12_preparation directory")
    args = parser.parse_args(argv)
    if args.command == "test-evaluate":
        try:
            reject_real_evaluation()
        except RealEvaluationBlocked as exc:
            print(json.dumps({"status": "BLOCKED", "reason": str(exc)}, ensure_ascii=False))
            return 3
    CONFIG.validate()
    report = (build_synthetic_report(sampling_unit=args.sampling_unit)
              if args.command == "synthetic-dry-run" else inspect_approval_metadata())
    report["generated_at"] = datetime.now(timezone.utc).isoformat()
    if args.save_evidence:
        run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ") + "-" + uuid4().hex[:12]
        destination = Path(__file__).resolve().parents[1] / "artifacts" / "reports" / "w5_ai12_preparation" / run_id
        destination.mkdir(parents=True, exist_ok=False)
        with (destination / "preparation.json").open("x", encoding="utf-8") as stream:
            json.dump(report, stream, indent=2, ensure_ascii=False, allow_nan=False)
            stream.write("\n")
        print(json.dumps({"evidence": str(destination / "preparation.json"),
                          "status": report.get("status", report.get("execution_status"))}, ensure_ascii=False))
    else:
        print(json.dumps(report, indent=2, ensure_ascii=False, allow_nan=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
