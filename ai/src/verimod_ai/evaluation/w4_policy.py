"""W4 reference for F a58230e policy semantics; no approved default thresholds."""
from collections import Counter
from verimod_ai.evaluation.policy_metrics import PolicyCase, policy_metrics

LABELS = ('hate', 'offensive')


def evaluate(scores, status, config, manifest_hash):
    for label in LABELS:
        bounds = config[label]
        if any(type(bounds[k]) is not int or not 0 <= bounds[k] <= 1_000_000 for k in ('review', 'restrict')):
            raise ValueError('Integer PPM thresholds required')
        if bounds['review'] > bounds['restrict']:
            raise ValueError('review exceeds restrict')
        if type(scores[label]) is not int or not 0 <= scores[label] <= 1_000_000:
            raise ValueError('Invalid score')
    if status not in ('FULL', 'TRUNCATED'):
        raise ValueError('Invalid input status')
    if status == 'TRUNCATED':
        action, reasons, rules = 'HUMAN_REVIEW', ['INPUT_TRUNCATED'], ['W4-TRUNCATED']
    else:
        restricted = [k for k in LABELS if scores[k] >= config[k]['restrict']]
        reviewed = [k for k in LABELS if scores[k] >= config[k]['review']]
        band, labels = ('RESTRICT', restricted) if restricted else ('REVIEW', reviewed)
        action = 'RESTRICT' if restricted else 'HUMAN_REVIEW' if reviewed else 'ALLOW'
        reasons = [f'SCORE_{k.upper()}_{band}' for k in labels]
        rules = [f'W4-{k.upper()}-{band}' for k in labels]
    return {'policy_manifest_hash': manifest_hash, 'action': action,
            'reason_codes': reasons, 'triggered_rule_ids': rules}


def summarize(rows, config):
    actions = [evaluate(r['scores_ppm'], r['input_status'], config, 'unused-reference-only')['action'] for r in rows]
    cases = [PolicyCase(r['native_truth'], a) for r, a in zip(rows, actions)]
    metrics = policy_metrics(cases)
    numerators = {
        'FRR': sum(c.native_label == 'none' and c.action == 'RESTRICT' for c in cases),
        'RP': sum(c.native_label != 'none' and c.action == 'RESTRICT' for c in cases),
        'HAR': sum(c.native_label != 'none' and c.action == 'ALLOW' for c in cases),
        'HRR_TOTAL': actions.count('HUMAN_REVIEW'),
    }
    denominators = {'FRR': metrics.n_clean, 'RP': metrics.n_restrict,
                    'HAR': metrics.n_harmful, 'HRR_TOTAL': metrics.n_eligible}
    return {'thresholds_ppm': config, 'n': len(rows),
            'actions': {a: actions.count(a) for a in ('ALLOW', 'HUMAN_REVIEW', 'RESTRICT')},
            'metrics': {k: {'numerator': n, 'denominator': denominators[k], 'value': getattr(metrics, k)}
                        for k, n in numerators.items()},
            'by_input_status': {s: dict(Counter(a for r, a in zip(rows, actions) if r['input_status'] == s))
                                for s in ('FULL', 'TRUNCATED')}}


def boundary_vectors(config, manifest_hash):
    vectors = []
    def add(name, hate=0, offensive=0, status='FULL'):
        scores = {'hate': hate, 'offensive': offensive}
        vectors.append({'id': name, 'scores_ppm': scores, 'input_status': status,
                        'expected': evaluate(scores, status, config, manifest_hash)})
    add('zero_allow')
    for label in LABELS:
        for band in ('review', 'restrict'):
            for delta in (-1, 0, 1):
                value = config[label][band] + delta
                if not 0 <= value <= 1_000_000:
                    raise ValueError('Candidate cannot exercise requested boundary')
                add(f'{label}_{band}_{delta:+d}', **{label: value})
    add('both_review', config['hate']['review'], config['offensive']['review'])
    add('both_restrict', config['hate']['restrict'], config['offensive']['restrict'])
    add('hate_restrict_offensive_review', config['hate']['restrict'], config['offensive']['review'])
    add('hate_review_offensive_restrict', config['hate']['review'], config['offensive']['restrict'])
    add('max_overlap', 1_000_000, 1_000_000)
    add('truncated_zero', status='TRUNCATED')
    add('truncated_max', 1_000_000, 1_000_000, 'TRUNCATED')
    add('truncated_restrict_boundary', config['hate']['restrict'], config['offensive']['restrict'], 'TRUNCATED')
    return vectors
