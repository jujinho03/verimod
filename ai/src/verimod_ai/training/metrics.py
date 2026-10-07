"""Trainer integer/logit adapter over the existing single-label metric skeleton."""
import numpy as np
from verimod_ai.data.taxonomy import NATIVE_TARGET
from verimod_ai.evaluation.metrics import model_report


def score_array(logits):
    """Normalized softmax model scores: UNCALIBRATED, separate from raw logits."""
    logits = np.asarray(logits)
    if logits.ndim != 2 or logits.shape[1] != len(NATIVE_TARGET) or not np.isfinite(logits).all():
        raise ValueError('Expected finite N x 3 logits')
    shifted = logits - logits.max(axis=1, keepdims=True)
    scores = np.exp(shifted)
    return scores / scores.sum(axis=1, keepdims=True)


def prediction_report(logits, label_ids):
    scores = score_array(logits)
    ids = np.asarray(label_ids)
    if ids.ndim != 1 or not np.issubdtype(ids.dtype, np.integer) or not np.isin(ids, range(len(NATIVE_TARGET))).all():
        raise ValueError('Expected native integer label IDs')
    predicted = scores.argmax(axis=1)
    report = model_report([NATIVE_TARGET[i] for i in ids], [NATIVE_TARGET[i] for i in predicted])
    report['accuracy'] = report['micro_f1']
    matrix, n = report['confusion_matrix'], report['n']
    rates = {}
    for c in NATIVE_TARGET:
        tp = matrix[c][c]
        fn = sum(matrix[c].values()) - tp
        fp = sum(matrix[t][c] for t in NATIVE_TARGET) - tp
        tn = n - tp - fn - fp
        rates[c] = {'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn,
                    'fpr': fp / (fp + tn) if fp + tn else 0.0, 'fpr_defined': bool(fp + tn),
                    'fnr': fn / (fn + tp) if fn + tp else 0.0, 'fnr_defined': bool(fn + tp)}
    report['one_vs_rest'] = rates
    report['score_semantics'] = 'UNCALIBRATED'
    return report


def trainer_metrics(prediction):
    logits = prediction.predictions[0] if isinstance(prediction.predictions, tuple) else prediction.predictions
    report = prediction_report(logits, prediction.label_ids)
    return {key: report[key] for key in ('macro_f1', 'micro_f1', 'accuracy')}
