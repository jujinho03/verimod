"""W5 approved Validation-row checks and de-identified analysis; no file IO.

Content features are deterministic surface observations, never causal diagnoses.
Source indices remain in the private mapping, not the public case report.
"""
from collections import Counter, defaultdict
import math
import re

from verimod_ai.evaluation.metrics import model_report
from verimod_ai.evaluation.w4_policy import evaluate as reference_evaluate

LABELS = ("hate", "offensive", "none")
SCORES = ("hate", "offensive")
ACTIONS = ("ALLOW", "HUMAN_REVIEW", "RESTRICT")
PAIRS = ((25, 50), (25, 75), (50, 75), (50, 90), (75, 90))
BASELINE = "H50-75_O50-75"
PREDICTION_KEYS = {"local_row", "native_truth", "native_prediction", "native_scores",
                   "raw_logits", "scores_ppm", "input_status"}
SPLIT_KEYS = {"bias", "contain_gender_bias", "label", "news_title", "record_id", "text"}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def validate_predictions(rows, expected_count=1255, expected_counts=None):
    require(isinstance(rows, list) and len(rows) == expected_count, "Prediction count mismatch")
    for i, r in enumerate(rows):
        require(isinstance(r, dict) and set(r) == PREDICTION_KEYS, "Prediction schema mismatch")
        require(type(r["local_row"]) is int and r["local_row"] == i, "Nonsequential prediction index")
        require(r["native_truth"] in LABELS and r["native_prediction"] in LABELS, "Unknown native label")
        native, ppm = r["native_scores"], r["scores_ppm"]
        require(isinstance(native, dict) and set(native) == set(LABELS), "Native score keys mismatch")
        require(all(type(v) in (int, float) and math.isfinite(v) and 0 <= v <= 1
                    for v in native.values()), "Invalid native score")
        require(abs(sum(native.values()) - 1) < 1e-6, "Native score normalization mismatch")
        require(isinstance(ppm, dict) and set(ppm) == set(SCORES), "PPM score keys mismatch")
        require(all(type(v) is int and 0 <= v <= 1_000_000
                    and v == math.floor(native[k] * 1_000_000 + .5) for k, v in ppm.items()),
                "PPM conversion mismatch")
        require(r["native_prediction"] == max(LABELS, key=lambda k: native[k]), "Native argmax mismatch")
        logits = r["raw_logits"]
        require(isinstance(logits, list) and len(logits) == 3
                and all(type(v) in (int, float) and math.isfinite(v) for v in logits), "Invalid logits")
        require(r["input_status"] in ("FULL", "TRUNCATED"), "Unknown input status")
    counts = dict(Counter(r["native_truth"] for r in rows))
    if expected_counts is not None:
        require(counts == expected_counts, "Native truth counts mismatch")
    return {"status": "PASS", "rows": len(rows), "schema_keys": sorted(PREDICTION_KEYS),
            "native_truth_counts": counts,
            "native_prediction_counts": dict(Counter(r["native_prediction"] for r in rows)),
            "input_status_counts": dict(Counter(r["input_status"] for r in rows))}


def validate_alignment(predictions, split):
    require(len(split) == len(predictions), "Split/prediction count mismatch")
    ids = set()
    for i, r in enumerate(split):
        require(isinstance(r, dict) and set(r) == SPLIT_KEYS, "Split schema mismatch")
        require(all(isinstance(r[k], str) for k in ("text", "news_title", "record_id", "bias"))
                and type(r["contain_gender_bias"]) is bool, "Split field types mismatch")
        require(r["record_id"] and r["record_id"] not in ids, "Split record identity mismatch")
        ids.add(r["record_id"])
        require(r["label"] == predictions[i]["native_truth"], "Split/prediction label alignment mismatch")
    return {"status": "PASS", "aligned_rows": len(split), "unique_record_count": len(ids),
            "basis": "Pinned split hash + W4 emitter sequential local_row + all native truths match",
            "text_published": False, "record_ids_published": False}


def action(scores, status, thresholds):
    """Independent implementation of the immutable W4 ANY_RESTRICT rule."""
    require(status in ("FULL", "TRUNCATED"), "Unknown input status")
    if status == "TRUNCATED":
        return "HUMAN_REVIEW"
    if any(scores[k] >= thresholds[k]["restrict"] for k in SCORES):
        return "RESTRICT"
    if any(scores[k] >= thresholds[k]["review"] for k in SCORES):
        return "HUMAN_REVIEW"
    return "ALLOW"


def summarize_rows(rows, thresholds):
    decisions = [action(r["scores_ppm"], r["input_status"], thresholds) for r in rows]
    clean = sum(r["native_truth"] == "none" for r in rows)
    restrict = decisions.count("RESTRICT")
    nums = {
        "FRR": sum(r["native_truth"] == "none" and a == "RESTRICT" for r, a in zip(rows, decisions)),
        "RP": sum(r["native_truth"] != "none" and a == "RESTRICT" for r, a in zip(rows, decisions)),
        "HAR": sum(r["native_truth"] != "none" and a == "ALLOW" for r, a in zip(rows, decisions)),
        "HRR_TOTAL": decisions.count("HUMAN_REVIEW"),
    }
    denoms = {"FRR": clean, "RP": restrict, "HAR": len(rows) - clean, "HRR_TOTAL": len(rows)}
    return {"thresholds_ppm": thresholds, "n": len(rows),
            "actions": {a: decisions.count(a) for a in ACTIONS},
            "metrics": {k: {"numerator": v, "denominator": denoms[k],
                            "value": v / denoms[k] if denoms[k] else None} for k, v in nums.items()},
            "by_input_status": {s: dict(Counter(a for r, a in zip(rows, decisions) if r["input_status"] == s))
                                for s in ("FULL", "TRUNCATED")}}


def recalculate(rows, validation, comparison):
    full = [r for r in rows if r["input_status"] == "FULL"]
    require(bool(full), "No FULL rows for W4 quantiles")
    quantiles = {}
    for label in SCORES:
        ordered = sorted(r["scores_ppm"][label] for r in full)
        quantiles[label] = {str(q): ordered[math.ceil(len(ordered) * q / 100) - 1] for q in (25, 50, 75, 90)}
    recalculated = []
    python_mismatches = 0
    for hr, hx in PAIRS:
        for or_, ox in PAIRS:
            thresholds = {"hate": {"review": quantiles["hate"][str(hr)], "restrict": quantiles["hate"][str(hx)]},
                          "offensive": {"review": quantiles["offensive"][str(or_)], "restrict": quantiles["offensive"][str(ox)]}}
            recalculated.append({"candidate_id": f"H{hr}-{hx}_O{or_}-{ox}", **summarize_rows(rows, thresholds)})
            python_mismatches += sum(action(r["scores_ppm"], r["input_status"], thresholds) !=
                                     reference_evaluate(r["scores_ppm"], r["input_status"], thresholds, "reference")["action"]
                                     for r in rows)
    model = model_report([r["native_truth"] for r in rows], [r["native_prediction"] for r in rows])
    model["accuracy"] = model["micro_f1"]
    differences = []
    def compare(a, b, path):
        if isinstance(a, dict) and isinstance(b, dict):
            for k in sorted(set(a) | set(b)):
                if k not in a or k not in b:
                    differences.append({"field": path + "." + k, "reason": "missing_key"})
                else:
                    compare(a[k], b[k], path + "." + k)
        elif a != b:
            differences.append({"field": path, "recomputed": a, "recorded": b})
    recorded = {c["candidate_id"]: c for c in comparison["candidates"]}
    compare({c["candidate_id"]: c for c in recalculated}, recorded, "candidates")
    compare(quantiles, comparison["quantiles_ppm"], "quantiles_ppm")
    compare(model, validation["metrics"], "model")
    return {"status": "PASS" if not differences and python_mismatches == 0 else "FAIL",
            "candidate_count": len(recalculated), "differences": differences,
            "difference_count": len(differences), "python_reference_action_comparisons": len(rows) * len(recalculated),
            "python_reference_action_mismatches": python_mismatches, "quantiles_ppm": quantiles,
            "model": model, "candidates": recalculated}


def surface_features(text):
    """No text fragments, named entities, record IDs, or text hashes are returned."""
    return {
        "quote_mark_present": bool(re.search(r'''["'“”‘’「」]''', text)),
        "negation_surface_marker": bool(re.search(r"아니|않|못|없", text)),
        "coarse_profanity_surface_marker": bool(re.search(r"바보|멍청|미친|씨발|시발|지랄|병신", text)),
        "laughter_or_jamo_marker": bool(re.search(r"[ㅋㅎㅠㅜ]{2,}", text)),
        "question_mark_present": "?" in text or "？" in text,
    }


def analyze_cases(rows, split, thresholds, limit=10):
    require(type(limit) is int and 1 <= limit <= 10, "Case limit must be 1..10")
    groups = defaultdict(list)
    for r in rows:
        if r["native_truth"] != "none" or action(r["scores_ppm"], r["input_status"], thresholds) != "RESTRICT":
            continue
        triggered = tuple(k for k in SCORES if r["scores_ppm"][k] >= thresholds[k]["restrict"])
        groups[(r["native_prediction"], triggered)].append(r)
    for group in groups.values():
        group.sort(key=lambda r: (-max(r["scores_ppm"][k] - thresholds[k]["restrict"] for k in SCORES), r["local_row"]))
    selected = []
    for depth in range(max((len(g) for g in groups.values()), default=0)):
        for key in sorted(groups):
            if depth < len(groups[key]) and len(selected) < limit:
                selected.append(groups[key][depth])
        if len(selected) == limit:
            break
    public, mapping = [], []
    for i, r in enumerate(selected, 1):
        case_id = f"VFP-{i:02d}"
        features = surface_features(split[r["local_row"]]["text"])
        restricted = [k for k in SCORES if r["scores_ppm"][k] >= thresholds[k]["restrict"]]
        hypotheses = []
        if features["quote_mark_present"]:
            hypotheses.append("Quotation/context sensitivity is a hypothesis; quote attribution and semantics require private human review.")
        if features["negation_surface_marker"]:
            hypotheses.append("A coarse negation marker is present; negation-scope errors are unverified and need matched private review.")
        if features["coarse_profanity_surface_marker"]:
            hypotheses.append("A coarse lexicon marker is present; surface-word dependence versus context is unverified.")
        if r["native_prediction"] == "none":
            hypotheses.append("Policy restrict thresholds can fire despite native none argmax; this is observed rule behavior, not proof of a model misclassification.")
        if not hypotheses:
            hypotheses.append("Threshold sensitivity or annotation/context ambiguity are possible; no semantic cause established.")
        public.append({"case_id": case_id, "ground_truth": "none", "model_prediction": r["native_prediction"],
                       "scores_ppm": r["scores_ppm"], "policy_candidate": BASELINE, "policy_action": "RESTRICT",
                       "triggered_restrict_labels": restricted,
                       "restrict_margin_ppm": {k: r["scores_ppm"][k] - thresholds[k]["restrict"] for k in restricted},
                       "error_category": "NORMAL_PROXY_RESTRICT_NATIVE_" + r["native_prediction"].upper(),
                       "observed_surface_features": features, "possible_causes_unverified": hypotheses,
                       "risk_to_users": "Normal-proxy content is automatically restricted under the provisional policy; concrete harm and label appropriateness are not independently adjudicated.",
                       "improvement_hypothesis": "Privately review label/context and threshold margins; compare approved Validation candidate routing; do not tune on TEST or infer calibrated harm probability.",
                       "content_review_scope": "Deterministic surface features only; no human semantic adjudication or causal explanation.",
                       "original_text_published": False, "source_row_index_published": False})
        mapping.append({"case_id": case_id, "local_row": r["local_row"]})
    cohort = [r for g in groups.values() for r in g]
    overlap = Counter((r["native_prediction"], action(r["scores_ppm"], r["input_status"], thresholds))
                      for r in rows if r["native_truth"] == "none")
    return {"status": "PASS", "verified_real_cases": len(public), "normal_proxy_restrict_population": len(cohort),
            "native_prediction_within_restrict": dict(Counter(r["native_prediction"] for r in cohort)),
            "none_proxy_prediction_action_cross_counts": {p: {a: overlap[p, a] for a in ACTIONS} for p in LABELS},
            "selection_method": "Round robin over native-prediction/restrict-trigger strata, descending maximum restrict margin then private local_row; not representative sampling.",
            "surface_feature_method": "Fixed coarse regex booleans; no semantic/causal interpretation or harmfulness re-labeling.",
            "public_cases": public}, mapping
