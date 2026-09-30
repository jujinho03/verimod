"""AI-04/AI-15: prepare an internal BEEP! holdout without publishing source text."""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import csv
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import re
import sys
import unicodedata
from urllib.request import Request, urlopen

LABELS = ("hate", "offensive", "none")
SOURCE_PAIRS = (
    ("train", "labeled/train.tsv", "news_title/train.news_title.txt"),
    ("dev", "labeled/dev.tsv", "news_title/dev.news_title.txt"),
)
REQUIRED = ("comments", "contain_gender_bias", "bias", "hate")
SCRIPT_VERSION = "w2-dataset-prep-v1"


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def normalize(value: str) -> str:
    value = unicodedata.normalize("NFC", value.replace("\r\n", "\n").replace("\r", "\n"))
    return re.sub(r"\s+", " ", value, flags=re.UNICODE).strip()


def acquire(config: dict, source_dir: Path, *, download: bool) -> dict:
    """Only the six allowlisted pinned files are acquired; official TEST is excluded."""
    evidence = {}
    revision = config["revision"]
    repository = config["repository"]
    for name, expected in config["source_sha256"].items():
        if name not in {"labeled/train.tsv", "labeled/dev.tsv",
                        "news_title/train.news_title.txt", "news_title/dev.news_title.txt",
                        "README.md", "LICENSE.md"}:
            raise ValueError(f"Unapproved source path: {name}")
        path = source_dir / name
        if not path.is_file():
            if not download:
                raise FileNotFoundError(path)
            path.parent.mkdir(parents=True, exist_ok=True)
            url = f"https://raw.githubusercontent.com/{repository}/{revision}/{name}"
            with urlopen(Request(url, headers={"User-Agent": "VeriMod-A-W2"}), timeout=30) as response:
                data = response.read()
            if sha256(data) != expected:
                raise ValueError(f"Pinned file SHA-256 mismatch: {name}")
            path.write_bytes(data)
        data = path.read_bytes()
        if sha256(data) != expected:
            raise ValueError(f"Pinned file SHA-256 mismatch: {name}")
        evidence[name] = {"revision": revision, "sha256": expected, "bytes": len(data),
                          "source_url": f"https://github.com/{repository}/blob/{revision}/{name}"}
    return evidence


def parse_source(source_dir: Path, config: dict) -> tuple[list[dict], dict]:
    records = []
    evidence = {}
    for split, labeled_name, title_name in SOURCE_PAIRS:
        labeled_path = source_dir / labeled_name
        title_path = source_dir / title_name
        with labeled_path.open("r", encoding="utf-8-sig", newline="") as stream:
            reader = csv.DictReader(stream, delimiter="\t", strict=True)
            if reader.fieldnames != list(REQUIRED):
                raise ValueError(f"Required columns mismatch: {labeled_name}")
            labeled_rows = list(reader)
        titles = title_path.read_text(encoding="utf-8-sig").splitlines()
        if len(labeled_rows) != config["official_rows"][split]:
            raise ValueError(f"Official row count mismatch: {labeled_name}")
        if len(titles) != len(labeled_rows):
            raise ValueError(f"Labeled/title row mismatch: {split}")
        empty_titles = 0
        for index, (row, title) in enumerate(zip(labeled_rows, titles, strict=True), start=1):
            if None in row or any(row.get(field) is None or not row[field].strip() for field in REQUIRED):
                raise ValueError(f"Missing/malformed labeled row: {split}:{index}")
            if row["hate"] not in LABELS:
                raise ValueError(f"Unexpected native hate label: {split}:{index}")
            if row["contain_gender_bias"] not in {"True", "False"}:
                raise ValueError(f"Malformed bias flag: {split}:{index}")
            if row["bias"] not in {"gender", "others", "none"}:
                raise ValueError(f"Malformed bias label: {split}:{index}")
            if not normalize(title):
                empty_titles += 1
            records.append({"record_id": f"{split}:{index:06d}", "text": row["comments"],
                            "title": title, "label": row["hate"], "bias": row["bias"],
                            "contain_gender_bias": row["contain_gender_bias"] == "True"})
        evidence[split] = {"labeled_rows": len(labeled_rows), "title_rows": len(titles),
                           "title_alignment": "PASS", "empty_titles": empty_titles,
                           "native_hate_counts": dict(sorted(Counter(row["hate"] for row in labeled_rows).items())),
                           "parse_status": "PASS"}
    return records, evidence


def deduplicate(records: list[dict]) -> tuple[list[dict], dict]:
    exact = Counter(record["text"] for record in records)
    groups = defaultdict(list)
    for record in records:
        groups[normalize(record["text"])].append(record)
    kept = []
    removed = 0
    quarantined = 0
    conflicts = Counter()
    for key in sorted(groups):
        cluster = sorted(groups[key], key=lambda item: item["record_id"])
        labels = sorted({item["label"] for item in cluster})
        if len(labels) > 1:
            quarantined += len(cluster)
            conflicts["+".join(labels)] += len(cluster)
        else:
            kept.append(cluster[0])
            removed += len(cluster) - 1
    kept.sort(key=lambda item: item["record_id"])
    return kept, {"exact_duplicate_excess": sum(count - 1 for count in exact.values()),
                  "normalized_duplicate_excess": sum(len(items) - 1 for items in groups.values()),
                  "same_label_removed": removed, "conflicting_quarantined": quarantined,
                  "conflicting_label_combinations": dict(sorted(conflicts.items()))}


class UnionFind:
    def __init__(self, size: int):
        self.parent = list(range(size))

    def find(self, item: int) -> int:
        while self.parent[item] != item:
            self.parent[item] = self.parent[self.parent[item]]
            item = self.parent[item]
        return item

    def union(self, a: int, b: int) -> None:
        ra, rb = self.find(a), self.find(b)
        if ra != rb:
            self.parent[max(ra, rb)] = min(ra, rb)


def near_groups(records: list[dict], union: UnionFind, settings: dict) -> dict:
    """Exhaustive shared-trigram candidates with an explicit work cap."""
    threshold = settings["jaccard_threshold"]
    minimum = settings["minimum_characters"]
    cap = settings["maximum_posting_visits"]
    postings = defaultdict(list)
    gram_sets = []
    visits = 0
    pairs = 0
    short = 0
    for index, record in enumerate(records):
        value = normalize(record["text"])
        grams = {value[pos:pos + 3] for pos in range(len(value) - 2)} if len(value) >= minimum else set()
        if not grams:
            short += 1
        candidates = Counter()
        for gram in sorted(grams):
            prior = postings[gram]
            visits += len(prior)
            if visits > cap:
                return {"status": "NOT CHECKED — near duplicate computational/quality limit",
                        "posting_visits": visits, "short_text_skipped": short,
                        "threshold": threshold, "matched_pairs": 0}
            candidates.update(prior)
        for other, intersection in candidates.items():
            other_size = len(gram_sets[other])
            if intersection < math.ceil(threshold * max(len(grams), other_size)):
                continue
            if intersection / (len(grams) + other_size - intersection) >= threshold:
                union.union(index, other)
                pairs += 1
        gram_sets.append(grams)
        for gram in sorted(grams):
            postings[gram].append(index)
    return {"status": "CHECKED — eligible texts", "posting_visits": visits,
            "short_text_skipped": short, "threshold": threshold, "matched_pairs": pairs}


def build_groups(records: list[dict], near_settings: dict) -> tuple[list[list[dict]], dict]:
    union = UnionFind(len(records))
    by_title = {}
    title_counts = Counter()
    empty = 0
    for index, record in enumerate(records):
        title = normalize(record["title"])
        if title:
            title_counts[title] += 1
            if title in by_title:
                union.union(index, by_title[title])
            else:
                by_title[title] = index
        else:
            empty += 1
    # Work on a separate union so a capped scan cannot leave partial near edges.
    near_union = UnionFind(len(records))
    near = near_groups(records, near_union, near_settings)
    if near["status"].startswith("CHECKED"):
        for index in range(len(records)):
            union.union(index, near_union.find(index))
    grouped = defaultdict(list)
    for index, record in enumerate(records):
        grouped[union.find(index)].append(record)
    groups = list(grouped.values())
    groups.sort(key=lambda group: min(item["record_id"] for item in group))
    sizes = sorted(map(len, groups))
    summary = {"unique_title_proxy_groups": len(title_counts), "repeated_title_proxy_groups":
               sum(count > 1 for count in title_counts.values()), "empty_titles_after_dedup": empty,
               "atomic_groups": len(groups), "largest_group": max(sizes, default=0),
               "group_size_p50": sizes[len(sizes) // 2] if sizes else 0,
               "group_size_p95": sizes[min(len(sizes) - 1, math.ceil(len(sizes) * 0.95) - 1)] if sizes else 0,
               "near_duplicate": near}
    return groups, summary


def allocate(groups: list[list[dict]], config: dict) -> dict[str, list[dict]]:
    ratios = config["ratios"]
    names = ("train", "validation", "test")
    if abs(sum(ratios.values()) - 1) > 1e-9 or any(ratios[name] <= 0 for name in names):
        raise ValueError("Invalid split ratios")
    totals = Counter(item["label"] for group in groups for item in group)
    total = sum(totals.values())
    if not total:
        raise ValueError("No rows remain after deduplication")
    membership = {name: [] for name in names}
    counts = {name: Counter() for name in names}
    sizes = Counter()

    def stable_order(group: list[dict]) -> str:
        return sha256(f'{config["seed"]}:{min(item["record_id"] for item in group)}'.encode())

    for group in sorted(groups, key=lambda value: (-len(value), stable_order(value))):
        group_counts = Counter(item["label"] for item in group)
        options = []
        for name in names:
            target_size = total * ratios[name]
            size_error = ((sizes[name] + len(group) - target_size) / max(target_size, 1)) ** 2 - ((sizes[name] - target_size) / max(target_size, 1)) ** 2
            class_error = sum(
                ((counts[name][label] + group_counts[label] - totals[label] * ratios[name]) / max(totals[label] * ratios[name], 1)) ** 2
                - ((counts[name][label] - totals[label] * ratios[name]) / max(totals[label] * ratios[name], 1)) ** 2
                for label in LABELS
            )
            tie = sha256(f'{config["seed"]}:{stable_order(group)}:{name}'.encode())
            options.append((class_error, size_error, tie, name))
        selected = min(options)[-1]
        membership[selected].extend(group)
        counts[selected].update(group_counts)
        sizes[selected] += len(group)
    for name in names:
        membership[name].sort(key=lambda item: item["record_id"])
        if not membership[name]:
            raise ValueError(f"Empty split: {name}")
    return membership


def assert_no_overlap(membership: dict[str, list[dict]], *, check_near: bool = False,
                      atomic_groups: list[list[dict]] | None = None) -> dict:
    seen = {key: {} for key in ("record_id", "text", "normalized", "title")}
    for split, records in membership.items():
        for item in records:
            values = {"record_id": item["record_id"], "text": item["text"],
                      "normalized": normalize(item["text"]), "title": normalize(item["title"])}
            for kind, value in values.items():
                if kind == "title" and not value:
                    continue
                if value in seen[kind] and seen[kind][value] != split:
                    raise ValueError(f"Cross-split {kind} overlap")
                seen[kind][value] = split
    if check_near and atomic_groups is not None:
        record_split = {item["record_id"]: name for name, items in membership.items() for item in items}
        for group in atomic_groups:
            if len({record_split[item["record_id"]] for item in group}) != 1:
                raise ValueError("Cross-split near/group cluster overlap")
    return {"stable_record_overlap": 0, "exact_overlap": 0,
            "normalized_overlap": 0, "title_group_overlap": 0,
            "near_cluster_overlap": 0 if check_near else "NOT CHECKED"}


def artifact_bytes(records: list[dict]) -> bytes:
    rows = []
    for item in records:
        row = {"record_id": item["record_id"], "text": item["text"],
               "label": item["label"], "news_title": item["title"],
               "bias": item["bias"], "contain_gender_bias": item["contain_gender_bias"]}
        rows.append(json.dumps(row, ensure_ascii=False, separators=(",", ":")))
    return ("\n".join(rows) + "\n").encode("utf-8")


def prepare(config: dict, source_dir: Path, output_dir: Path, *, download: bool) -> dict:
    source_dir = source_dir.resolve()
    output_dir = output_dir.resolve()
    repo_root = Path(__file__).resolve().parents[2]
    if source_dir.is_relative_to(repo_root) or output_dir.is_relative_to(repo_root):
        raise ValueError("Raw data and output must stay outside repository")
    if source_dir == output_dir:
        raise ValueError("Source and output directories must differ")
    if any((output_dir / f"{name}.jsonl").exists() for name in ("train", "validation", "test")):
        raise FileExistsError("Split artifact exists; refusing to read or overwrite sealed TEST")
    source_evidence = acquire(config, source_dir, download=download)
    records, parse_evidence = parse_source(source_dir, config)
    for split, labeled_name, title_name in SOURCE_PAIRS:
        source_evidence[labeled_name].update({"row_count": parse_evidence[split]["labeled_rows"], "parse_status": "PASS"})
        source_evidence[title_name].update({"row_count": parse_evidence[split]["title_rows"], "parse_status": "PASS"})
    for name in ("README.md", "LICENSE.md"):
        source_evidence[name].update({"row_count": "N/A", "parse_status": "SHA-256 VERIFIED"})
    kept, duplicate_evidence = deduplicate(records)
    groups, group_evidence = build_groups(kept, config["near_duplicate"])
    membership = allocate(groups, config)
    leakage = assert_no_overlap(membership, check_near=group_evidence["near_duplicate"]["status"].startswith("CHECKED"), atomic_groups=groups)
    total = sum(map(len, membership.values()))
    record_group = {item["record_id"]: index for index, group in enumerate(groups) for item in group}
    split_evidence = {name: {"count": len(items), "ratio": len(items) / total,
                             "class_counts": {label: sum(item["label"] == label for item in items) for label in LABELS},
                             "group_count": len({record_group[item["record_id"]] for item in items})}
                      for name, items in membership.items()}
    output_dir.mkdir(parents=True, exist_ok=True)
    for name in ("train", "validation"):
        (output_dir / f"{name}.jsonl").write_bytes(artifact_bytes(membership[name]))
    test_path = output_dir / "test.jsonl"
    with test_path.open("xb") as stream:
        stream.write(artifact_bytes(membership["test"]))
    # The single post-write read computes the raw-file-byte seal. Never reopen it here.
    test_hash = sha256(test_path.read_bytes())
    return {"script_version": SCRIPT_VERSION, "dataset": config["dataset"],
            "repository": config["repository"], "revision": config["revision"],
            "license": config["license"], "sources": source_evidence,
            "parse": parse_evidence, "duplicates": duplicate_evidence,
            "groups": group_evidence, "split": {"seed": config["seed"],
            "algorithm": config["split_algorithm"], "python": sys.version.split()[0],
            "ratios_target": config["ratios"], "actual": split_evidence},
            "leakage": leakage, "test_seal": {"sha256": test_hash,
            "count": len(membership["test"]), "generated_at_utc": datetime.now(timezone.utc).isoformat(),
            "format": "UTF-8 LF JSONL", "path": str(test_path)}}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", type=Path, default=Path(__file__).resolve().parents[1] / "configs/w2_dataset.json")
    parser.add_argument("--source-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--download", action="store_true")
    args = parser.parse_args()
    config = json.loads(args.config.read_text(encoding="utf-8"))
    evidence = prepare(config, args.source_dir, args.output_dir, download=args.download)
    args.evidence.parent.mkdir(parents=True, exist_ok=True)
    args.evidence.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"rows": evidence["split"]["actual"], "test_sha256": evidence["test_seal"]["sha256"],
                      "near_status": evidence["groups"]["near_duplicate"]["status"]}, ensure_ascii=True))


if __name__ == "__main__":
    main()
