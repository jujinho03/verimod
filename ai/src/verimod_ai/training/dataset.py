"""Only already-prepared internal TRAIN/VALIDATION artifacts may enter training."""
from collections import Counter
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import random

from verimod_ai.data.label_mapping import map_native_labels
from verimod_ai.data.preprocessing import PREPROCESSING_VERSION, preprocess_text
from verimod_ai.data.taxonomy import NATIVE_TARGET, PRIMARY_DATASET

ALLOWED_RUNTIME_SPLITS = frozenset({'train', 'validation'})


def label_maps():
    label2id = {label: index for index, label in enumerate(NATIVE_TARGET)}
    return {index: label for label, index in label2id.items()}, label2id


def split_path(directory, split, *, training):
    # This check precedes resolve/stat/open, including for aliases and traversal.
    if split not in ALLOWED_RUNTIME_SPLITS:
        raise PermissionError('Only train/validation are allowed; TEST is SEALED')
    if training is not (split == 'train'):
        raise PermissionError('TRAIN is training-only; VALIDATION is evaluation-only')
    directory = Path(os.path.abspath(directory)).resolve()
    path = (directory / f'{split}.jsonl').resolve()
    if path.parent != directory or path.name != f'{split}.jsonl':
        raise PermissionError('Split redirects outside its allowlisted location')
    return path


def load_split(directory, split, *, training, baseline, dataset_config):
    path = split_path(directory, split, training=training)
    if (dataset_config['dataset'] != PRIMARY_DATASET
            or dataset_config['revision'] != baseline['dataset_revision']
            or dataset_config['seed'] != baseline['seed']
            or tuple(dataset_config['native_target']['labels']) != NATIVE_TARGET
            or baseline['preprocessing_version'] != PREPROCESSING_VERSION):
        raise ValueError('Dataset/preprocessing provenance mismatch')
    raw = path.read_bytes()
    expected = baseline['split_provenance'][split]
    if hashlib.sha256(raw).hexdigest() != expected['sha256']:
        raise ValueError(f'{split}: approved artifact hash mismatch')
    rows = [json.loads(line) for line in raw.decode('utf-8').splitlines()]
    if len(rows) != expected['count'] or Counter(r['label'] for r in rows) != Counter(expected['class_counts']):
        raise ValueError(f'{split}: approved counts mismatch')
    for row in rows:
        if not isinstance(row.get('record_id'), str) or not isinstance(row.get('text'), str):
            raise ValueError(f'{split}: incompatible internal artifact schema')
        map_native_labels([row['label']], source_dataset=PRIMARY_DATASET)
    return rows


def smoke_subset(rows, seed, limit=32):
    if not len(NATIVE_TARGET) <= limit <= 32:
        raise ValueError('Smoke limit must include three classes and cannot exceed 32')
    rng = random.Random(seed)
    chosen = []
    for label in NATIVE_TARGET:
        candidates = [i for i, row in enumerate(rows) if row['label'] == label]
        if not candidates:
            raise ValueError('Smoke requires every native class')
        chosen.append(rng.choice(candidates))
    rest = [i for i in range(len(rows)) if i not in chosen]
    chosen.extend(rng.sample(rest, min(limit, len(rows)) - len(chosen)))
    rng.shuffle(chosen)
    return [rows[i] for i in chosen]


@dataclass
class TokenizedDataset:
    features: list[dict]

    def __len__(self):
        return len(self.features)

    def __getitem__(self, index):
        return self.features[index]


def tokenize_rows(rows, tokenizer, config):
    if config['preprocessing_version'] != PREPROCESSING_VERSION:
        raise ValueError('Unsupported preprocessing version')
    _, label2id = label_maps()
    texts = [preprocess_text(r['record_id'], r['text'], source_dataset=PRIMARY_DATASET).processed_text
             for r in rows]
    tokenizer.truncation_side = config['tokenizer_truncation_side']
    tokenizer.padding_side = config['padding_side']
    features = []
    for offset in range(0, len(rows), 256):
        batch = rows[offset:offset + 256]
        encoded = tokenizer(texts[offset:offset + 256], truncation=True, max_length=config['max_length'],
                            padding=False, add_special_tokens=config['add_special_tokens'])
        for i, row in enumerate(batch):
            label = map_native_labels([row['label']], source_dataset=PRIMARY_DATASET)[0]
            features.append({**{key: value[i] for key, value in encoded.items()}, 'labels': label2id[label]})
    return TokenizedDataset(features)


def install_data_read_guard(directory):
    """Process-level defense: all opens inside the supplied data root are allowlisted."""
    import sys
    root = Path(os.path.abspath(directory)).resolve()
    allowed = {root / f'{split}.jsonl' for split in ALLOWED_RUNTIME_SPLITS}
    evidence = {'opened_splits': [], 'denied_opens': 0}

    def guard(event, args):
        if event != 'open' or not isinstance(args[0], (str, bytes, os.PathLike)):
            return
        path = Path(os.path.abspath(os.fsdecode(args[0])))
        if path.is_relative_to(root):
            if path not in allowed:
                evidence['denied_opens'] += 1
                raise PermissionError('Dataset open denied: only TRAIN/VALIDATION allowed')
            evidence['opened_splits'].append(path.stem)
    sys.addaudithook(guard)
    return evidence
