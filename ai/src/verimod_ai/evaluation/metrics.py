"""AI-06: model metrics for the single-label native classifier (stdlib only).

Evidence: docs/research/w2-evaluation-skeleton.md

Classes are the native classifier classes ``hate / offensive / none``. These
are not the consumer-facing score keys (``hate / offensive``) and not policy
actions; policy metrics live in policy_metrics.py.

Zero-division rule: a precision, recall or F1 whose denominator is 0 is
reported as 0.0 and flagged ``*_defined = False``. Macro-F1 averages over every
declared class, including zero-support classes. No numbers are produced
without real predictions; nothing here loads data.
"""

from __future__ import annotations

from collections.abc import Sequence

from verimod_ai.data.taxonomy import NATIVE_TARGET


def _validate(y_true: Sequence[str], y_pred: Sequence[str], classes: Sequence[str]) -> None:
    if len(y_true) != len(y_pred):
        raise ValueError("y_true and y_pred must have the same length")
    if not y_true:
        raise ValueError("at least one example is required")
    if len(set(classes)) != len(classes):
        raise ValueError("classes must be unique")
    unknown = (set(y_true) | set(y_pred)) - set(classes)
    if unknown:
        raise ValueError(f"labels outside declared classes: {sorted(unknown)}")


def _ratio(numerator: int, denominator: int) -> tuple[float, bool]:
    return (numerator / denominator, True) if denominator else (0.0, False)


def confusion_matrix(y_true: Sequence[str], y_pred: Sequence[str],
                     classes: Sequence[str] = NATIVE_TARGET) -> dict[str, dict[str, int]]:
    """Counts as matrix[true_class][predicted_class]."""
    _validate(y_true, y_pred, classes)
    matrix = {t: {p: 0 for p in classes} for t in classes}
    for t, p in zip(y_true, y_pred):
        matrix[t][p] += 1
    return matrix


def per_class_metrics(y_true: Sequence[str], y_pred: Sequence[str],
                      classes: Sequence[str] = NATIVE_TARGET) -> dict[str, dict]:
    matrix = confusion_matrix(y_true, y_pred, classes)
    result = {}
    for c in classes:
        tp = matrix[c][c]
        support = sum(matrix[c].values())
        predicted = sum(matrix[t][c] for t in classes)
        precision, p_ok = _ratio(tp, predicted)
        recall, r_ok = _ratio(tp, support)
        f1, f_ok = _ratio(2 * tp, predicted + support)  # == 2PR/(P+R) when defined
        result[c] = {"precision": precision, "recall": recall, "f1": f1, "support": support,
                     "precision_defined": p_ok, "recall_defined": r_ok, "f1_defined": f_ok}
    return result


def macro_f1(y_true: Sequence[str], y_pred: Sequence[str], classes: Sequence[str] = NATIVE_TARGET) -> float:
    per_class = per_class_metrics(y_true, y_pred, classes)
    return sum(per_class[c]["f1"] for c in classes) / len(classes)


def micro_f1(y_true: Sequence[str], y_pred: Sequence[str], classes: Sequence[str] = NATIVE_TARGET) -> float:
    """For single-label multiclass over all classes this equals accuracy."""
    matrix = confusion_matrix(y_true, y_pred, classes)
    return sum(matrix[c][c] for c in classes) / len(y_true)


def model_report(y_true: Sequence[str], y_pred: Sequence[str], classes: Sequence[str] = NATIVE_TARGET) -> dict:
    return {"classes": list(classes), "n": len(y_true),
            "confusion_matrix": confusion_matrix(y_true, y_pred, classes),
            "per_class": per_class_metrics(y_true, y_pred, classes),
            "macro_f1": macro_f1(y_true, y_pred, classes),
            "micro_f1": micro_f1(y_true, y_pred, classes)}
