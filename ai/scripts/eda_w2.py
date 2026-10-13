"""AI-20: aggregate-only EDA of the BEEP! TRAIN and VALIDATION splits.

The sealed internal TEST is never opened. Only ``train.jsonl`` and
``validation.jsonl`` are read; TEST figures come from the pre-seal aggregate
already recorded by AI-04. Outputs contain counts and statistics only, never
comment or title text.
"""

from __future__ import annotations

import argparse
from collections import Counter
import json
import math
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prepare_w2_dataset import LABELS, normalize  # noqa: E402

SCRIPT_VERSION = "w2-eda-v1"
SPLITS = ("train", "validation")
BIASES = ("gender", "others", "none")
LENGTH_BOUNDARY = 500
PERCENTILES = (50, 90, 95, 99)
RAW_FIELDS = frozenset({"text", "comments", "news_title", "title"})
FIELDS = ("record_id", "text", "label", "news_title", "bias", "contain_gender_bias")


# --- input -------------------------------------------------------------------

def guard_path(path: Path) -> Path:
    if path.name.lower().startswith("test"):
        raise PermissionError("Sealed TEST artifacts are not accepted by the EDA script")
    return path


def load_split(splits_dir: Path, split: str) -> list[dict]:
    if split not in SPLITS:
        raise PermissionError(f"Only {SPLITS} may be read; got {split!r}")
    path = guard_path(splits_dir / f"{split}.jsonl")
    records = []
    with path.open("r", encoding="utf-8") as stream:
        for line_no, line in enumerate(stream, start=1):
            row = json.loads(line)
            if sorted(row) != sorted(FIELDS):
                raise ValueError(f"Unexpected fields: {split}:{line_no}")
            if row["label"] not in LABELS:
                raise ValueError(f"Unexpected native label: {split}:{line_no}")
            if row["bias"] not in BIASES or not isinstance(row["contain_gender_bias"], bool):
                raise ValueError(f"Unexpected bias value: {split}:{line_no}")
            records.append(row)
    return records


# --- statistics --------------------------------------------------------------

def pct(part: int, whole: int) -> float:
    return round(100 * part / whole, 2) if whole else 0.0


def nearest_rank(sorted_values: list[int], q: float) -> int | None:
    if not sorted_values:
        return None
    return sorted_values[max(0, math.ceil(q / 100 * len(sorted_values)) - 1)]


def length_stats(lengths: list[int]) -> dict:
    values = sorted(lengths)
    stats = {"min": values[0], "max": values[-1], "mean": round(sum(values) / len(values), 2)}
    for q in PERCENTILES:
        stats[f"p{q}"] = nearest_rank(values, q)
    return stats


def counts_block(values: list, keys: tuple) -> dict:
    counter = Counter(values)
    total = len(values)
    return {"counts": {key: counter[key] for key in keys},
            "pct": {key: pct(counter[key], total) for key in keys}}


def split_summary(records: list[dict]) -> dict:
    n = len(records)
    lengths = [len(row["text"]) for row in records]
    over = sum(length > LENGTH_BOUNDARY for length in lengths)
    labels = counts_block([row["label"] for row in records], LABELS)
    contingency = {label: {bias: 0 for bias in BIASES} for label in LABELS}
    flag_by_bias = {bias: {"True": 0, "False": 0} for bias in BIASES}
    for row in records:
        contingency[row["label"]][row["bias"]] += 1
        flag_by_bias[row["bias"]][str(row["contain_gender_bias"])] += 1
    titles = Counter(normalize(row["news_title"]) for row in records)
    sizes = sorted(titles.values())
    return {
        "count": n,
        "labels": labels,
        "length": length_stats(lengths),
        "length_median_by_label": {
            label: nearest_rank(sorted(len(r["text"]) for r in records if r["label"] == label), 50)
            for label in LABELS},
        "over_500": {"count": over, "pct": pct(over, n)},
        "bias": counts_block([row["bias"] for row in records], BIASES),
        "contain_gender_bias": counts_block([str(row["contain_gender_bias"]) for row in records], ("True", "False")),
        "contain_gender_bias_by_bias": flag_by_bias,
        "label_x_bias": {
            "counts": contingency,
            "pct_within_label": {label: {bias: pct(contingency[label][bias], labels["counts"][label])
                                         for bias in BIASES} for label in LABELS},
            "pct_of_split": {label: {bias: pct(contingency[label][bias], n) for bias in BIASES}
                             for label in LABELS},
        },
        "title_proxy_groups": {
            "unique": len(sizes),
            "samples_per_group": {"min": sizes[0], "p50": nearest_rank(sizes, 50),
                                  "mean": round(sum(sizes) / len(sizes), 2),
                                  "p95": nearest_rank(sizes, 95), "max": sizes[-1]},
            "singleton_groups": sum(size == 1 for size in sizes),
            "size_histogram": {str(size): count for size, count in sorted(Counter(sizes).items())},
        },
    }


def length_histogram(records: list[dict], width: int, upper: int) -> list[int]:
    bins = [0] * (upper // width)
    for row in records:
        bins[min(len(row["text"]) // width, len(bins) - 1)] += 1
    return bins


def evidence_summary(evidence: dict) -> dict:
    """Copy only aggregates AI-04/AI-15 already recorded; no TEST file access."""
    test = evidence["split"]["actual"]["test"]
    near = evidence["groups"]["near_duplicate"]
    near_out = {key: value for key, value in near.items() if key != "status"}
    near_out["status"] = near["status"].replace("—", "-").encode("ascii", "replace").decode()
    return {
        "test_pre_seal_aggregate": {"count": test["count"], "class_counts": test["class_counts"],
                                    "source": "AI-04 pre-seal aggregate (beep-evidence.json)"},
        "ai15_leakage": {
            "duplicates": {key: evidence["duplicates"][key] for key in
                           ("exact_duplicate_excess", "normalized_duplicate_excess",
                            "same_label_removed", "conflicting_quarantined")},
            "cross_split_overlap": evidence["leakage"],
            "near_duplicate": near_out,
            "title_proxy_groups_all_splits": evidence["groups"]["unique_title_proxy_groups"],
            "atomic_groups_all_splits": evidence["groups"]["atomic_groups"],
        },
    }


def assert_no_raw_text(summary: dict, records: list[dict]) -> None:
    forbidden = {row["text"] for row in records} | {row["news_title"] for row in records}

    def walk(node):
        if isinstance(node, dict):
            for key, value in node.items():
                if key in RAW_FIELDS:
                    raise ValueError(f"Raw text field in EDA output: {key}")
                walk(value)
        elif isinstance(node, list):
            for value in node:
                walk(value)
        elif isinstance(node, str) and node in forbidden:
            raise ValueError("Raw text value in EDA output")

    walk(summary)


# --- SVG figures (stdlib only, light surface) --------------------------------

SURFACE, INK, INK2, MUTED, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#8a8984", "#e4e3df"
SERIES = {"train": "#2a78d6", "validation": "#eb6834"}
SEQUENTIAL = ("#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95", "#0d366b")
FONT = "system-ui, -apple-system, Segoe UI, sans-serif"


def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg_doc(width: int, height: int, title: str, scope: str, body: list[str]) -> str:
    head = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
            f'viewBox="0 0 {width} {height}" font-family="{FONT}" role="img">',
            f"<title>{esc(title)}</title>",
            f'<rect width="{width}" height="{height}" fill="{SURFACE}"/>',
            f'<text x="24" y="32" font-size="16" font-weight="600" fill="{INK}">{esc(title)}</text>',
            f'<text x="24" y="52" font-size="12" fill="{INK2}">{esc(scope)}</text>']
    return "\n".join(head + [part for part in body if part] + ["</svg>"]) + "\n"


def legend(x: int, y: int, names: list[str]) -> list[str]:
    out = []
    for name in names:
        out.append(f'<rect x="{x}" y="{y - 9}" width="10" height="10" rx="2" fill="{SERIES[name]}"/>')
        out.append(f'<text x="{x + 15}" y="{y}" font-size="12" fill="{INK2}">{name}</text>')
        x += 25 + 7 * len(name)
    return out


def y_axis(left: int, top: int, bottom: int, right: int, ymax: float, ticks: int, fmt) -> list[str]:
    out = []
    for i in range(ticks + 1):
        y = bottom - (bottom - top) * i / ticks
        out.append(f'<line x1="{left}" x2="{right}" y1="{y:.1f}" y2="{y:.1f}" stroke="{GRID}" stroke-width="1"/>')
        out.append(f'<text x="{left - 6}" y="{y + 4:.1f}" font-size="11" fill="{MUTED}" '
                   f'text-anchor="end">{fmt(ymax * i / ticks)}</text>')
    return out


def bar(x: float, y: float, w: float, h: float, color: str, tip: str) -> str:
    if h <= 0:
        return ""
    r = min(4, w / 2, h)
    path = (f"M{x:.1f},{y + h:.1f} V{y + r:.1f} Q{x:.1f},{y:.1f} {x + r:.1f},{y:.1f} "
            f"H{x + w - r:.1f} Q{x + w:.1f},{y:.1f} {x + w:.1f},{y + r:.1f} V{y + h:.1f} Z")
    return f'<path d="{path}" fill="{color}"><title>{esc(tip)}</title></path>'


def grouped_bars(title: str, scope: str, categories: tuple, data: dict, note: str,
                 tip_labels: bool = True) -> str:
    """data[split][category] = (pct, count)."""
    width, height, left, top, bottom = 640, 380, 64, 96, 330
    right = width - 24
    peak = max(v[0] for values in data.values() for v in values.values())
    ymax = max(10, math.ceil(peak / 10) * 10)
    body = legend(left, 78, list(data)) + y_axis(left, top, bottom, right, ymax, ymax // 10, lambda v: f"{v:.0f}%")
    band = (right - left) / len(categories)
    bar_w = min(24, (band - 8) / len(data) - 2)
    for i, category in enumerate(categories):
        start = left + band * i + (band - bar_w * len(data) - 2 * (len(data) - 1)) / 2
        for j, (split, values) in enumerate(data.items()):
            share, count = values[category]
            h = (bottom - top) * share / ymax
            x = start + j * (bar_w + 2)
            body.append(bar(x, bottom - h, bar_w, h, SERIES[split], f"{split} {category}: {count:,} ({share:.1f}%)"))
        if tip_labels:
            top_share = max(values[category][0] for values in data.values())
            joined = " / ".join(f"{values[category][0]:.1f}%" for values in data.values())
            body.append(f'<text x="{left + band * (i + 0.5):.1f}" y="{bottom - (bottom - top) * top_share / ymax - 6:.1f}" '
                        f'font-size="11" fill="{INK2}" text-anchor="middle">{joined}</text>')
        body.append(f'<text x="{left + band * (i + 0.5):.1f}" y="{bottom + 18}" font-size="12" fill="{INK}" '
                    f'text-anchor="middle">{esc(category)}</text>')
    body.append(f'<line x1="{left}" x2="{right}" y1="{bottom}" y2="{bottom}" stroke="{MUTED}" stroke-width="1"/>')
    body.append(f'<text x="{left}" y="{height - 16}" font-size="11" fill="{MUTED}">{esc(note)}</text>')
    return svg_doc(width, height, title, scope, body)


def line_chart(title: str, scope: str, xs: list[float], series: dict, x_label: str, y_label: str,
               marker_x: float, x_ticks: list[int]) -> str:
    width, height, left, top, bottom = 640, 380, 64, 96, 320
    right = width - 24
    xmin, xmax = 0, xs[-1] + (xs[1] - xs[0]) / 2
    peak = max(v for values in series.values() for v in values)
    ymax = math.ceil(peak / 2) * 2

    def sx(x: float) -> float:
        return left + (right - left) * (x - xmin) / (xmax - xmin)

    def sy(y: float) -> float:
        return bottom - (bottom - top) * y / ymax

    body = legend(left, 78, list(series)) + y_axis(left, top, bottom, right, ymax, 4, lambda v: f"{v:.0f}%")
    for tick in x_ticks:
        body.append(f'<text x="{sx(tick):.1f}" y="{bottom + 16}" font-size="11" fill="{MUTED}" '
                    f'text-anchor="middle">{tick}</text>')
    if marker_x <= xmax:
        body.append(f'<line x1="{sx(marker_x):.1f}" x2="{sx(marker_x):.1f}" y1="{top}" y2="{bottom}" '
                    f'stroke="{INK2}" stroke-width="1"/>')
        body.append(f'<text x="{sx(marker_x) - 4:.1f}" y="{top + 12}" font-size="11" fill="{INK2}" '
                    f'text-anchor="end">{marker_x} (candidate boundary)</text>')
    else:
        body.append(f'<text x="{right}" y="{top + 12}" font-size="11" fill="{INK2}" text-anchor="end">'
                    f'{marker_x}-code-point candidate boundary is beyond the axis: 0 records exceed it</text>')
    for split, values in series.items():
        points = " ".join(f"{sx(x):.1f},{sy(y):.1f}" for x, y in zip(xs, values))
        body.append(f'<polyline points="{points}" fill="none" stroke="{SERIES[split]}" stroke-width="2" '
                    f'stroke-linejoin="round" stroke-linecap="round"><title>{split}</title></polyline>')
    body.append(f'<line x1="{left}" x2="{right}" y1="{bottom}" y2="{bottom}" stroke="{MUTED}" stroke-width="1"/>')
    body.append(f'<text x="{(left + right) / 2:.1f}" y="{bottom + 36}" font-size="12" fill="{INK}" '
                f'text-anchor="middle">{esc(x_label)}</text>')
    body.append(f'<text x="18" y="{(top + bottom) / 2:.1f}" font-size="12" fill="{INK}" text-anchor="middle" '
                f'transform="rotate(-90 18 {(top + bottom) / 2:.1f})">{esc(y_label)}</text>')
    return svg_doc(width, height, title, scope, body)


def percentile_chart(title: str, scope: str, stats: dict) -> str:
    keys = ("min", "p50", "p90", "p95", "p99", "max")
    width, height, left, top, bottom = 640, 380, 64, 96, 320
    right = width - 24
    peak = max(stats[s][k] for s in stats for k in keys)
    ymax = math.ceil(peak * 1.1 / 25) * 25
    body = legend(left, 78, list(stats)) + y_axis(left, top, bottom, right, ymax, 5, lambda v: f"{v:.0f}")
    band = (right - left) / len(keys)
    if LENGTH_BOUNDARY <= ymax:
        y500 = bottom - (bottom - top) * LENGTH_BOUNDARY / ymax
        body.append(f'<line x1="{left}" x2="{right}" y1="{y500:.1f}" y2="{y500:.1f}" stroke="{INK2}" stroke-width="1"/>')
        body.append(f'<text x="{right}" y="{y500 - 5:.1f}" font-size="11" fill="{INK2}" text-anchor="end">'
                    f'{LENGTH_BOUNDARY} code points (candidate boundary)</text>')
    else:
        body.append(f'<text x="{right}" y="78" font-size="11" fill="{INK2}" text-anchor="end">'
                    f'{LENGTH_BOUNDARY}-code-point candidate boundary is above the axis (max {peak})</text>')
    for i, key in enumerate(keys):
        cx = left + band * (i + 0.5)
        for j, split in enumerate(stats):
            value = stats[split][key]
            body.append(f'<circle cx="{cx + (j - 0.5) * 14:.1f}" cy="{bottom - (bottom - top) * value / ymax:.1f}" '
                        f'r="5" fill="{SERIES[split]}" stroke="{SURFACE}" stroke-width="2">'
                        f'<title>{split} {key}: {value}</title></circle>')
        body.append(f'<text x="{cx:.1f}" y="{bottom + 16}" font-size="12" fill="{INK}" text-anchor="middle">{key}</text>')
        body.append(f'<text x="{cx:.1f}" y="{bottom + 31}" font-size="10" fill="{MUTED}" text-anchor="middle">'
                    f'{"/".join(str(stats[s][key]) for s in stats)}</text>')
    body.append(f'<line x1="{left}" x2="{right}" y1="{bottom}" y2="{bottom}" stroke="{MUTED}" stroke-width="1"/>')
    body.append(f'<text x="{left}" y="{height - 14}" font-size="11" fill="{MUTED}">Unicode code points, nearest-rank '
                f'percentiles. Numbers under each tick: train/validation.</text>')
    return svg_doc(width, height, title, scope, body)


def heatmap(title: str, scope: str, summaries: dict) -> str:
    width, height = 640, 300
    cell_w, cell_h, left, top = 76, 44, 84, 112
    body = []
    for k, (split, summary) in enumerate(summaries.items()):
        ox = left + k * (cell_w * 3 + 36)
        body.append(f'<text x="{ox}" y="{top - 26}" font-size="13" font-weight="600" fill="{INK}">'
                    f'{split} (n={summary["count"]:,})</text>')
        for c, bias in enumerate(BIASES):
            body.append(f'<text x="{ox + cell_w * (c + 0.5):.1f}" y="{top - 8}" font-size="11" fill="{INK2}" '
                        f'text-anchor="middle">bias={bias}</text>')
        for r, label in enumerate(LABELS):
            if k == 0:
                body.append(f'<text x="{ox - 8}" y="{top + cell_h * (r + 0.5) + 4:.1f}" font-size="12" '
                            f'fill="{INK}" text-anchor="end">{label}</text>')
            for c, bias in enumerate(BIASES):
                share = summary["label_x_bias"]["pct_within_label"][label][bias]
                count = summary["label_x_bias"]["counts"][label][bias]
                step = min(len(SEQUENTIAL) - 1, int(share / 100 * len(SEQUENTIAL)))
                ink = "#ffffff" if step >= 3 else INK
                x, y = ox + cell_w * c, top + cell_h * r
                body.append(f'<rect x="{x + 1}" y="{y + 1}" width="{cell_w - 2}" height="{cell_h - 2}" rx="3" '
                            f'fill="{SEQUENTIAL[step]}"><title>{split} {label} x {bias}: {count:,} '
                            f'({share:.1f}% of {label})</title></rect>')
                body.append(f'<text x="{x + cell_w / 2:.1f}" y="{y + cell_h / 2 + 4:.1f}" font-size="12" '
                            f'fill="{ink}" text-anchor="middle">{share:.1f}%</text>')
    body.append(f'<text x="24" y="{height - 34}" font-size="11" fill="{MUTED}">Row-normalized: share of each native '
                f'hate label in each bias value. Counts in tooltips and summary.json.</text>')
    body.append(f'<text x="24" y="{height - 18}" font-size="11" fill="{MUTED}">Descriptive co-occurrence only; '
                f'no correlation or causal claim.</text>')
    return svg_doc(width, height, title, scope, body)


def write_figures(summaries: dict, histograms: dict, bin_width: int, output_dir: Path) -> list[str]:
    n = {split: summaries[split]["count"] for split in SPLITS}
    scope = f"Scope: TRAIN n={n['train']:,} | VALIDATION n={n['validation']:,} | sealed TEST excluded"
    upper = len(histograms["train"]) * bin_width
    sizes = sorted({int(k) for s in SPLITS for k in summaries[s]["title_proxy_groups"]["size_histogram"]})
    group_hist = {s: summaries[s]["title_proxy_groups"] for s in SPLITS}
    figures = {
        "fig1_label_distribution.svg": grouped_bars(
            "Native hate-axis label distribution", scope, LABELS,
            {s: {l: (summaries[s]["labels"]["pct"][l], summaries[s]["labels"]["counts"][l]) for l in LABELS}
             for s in SPLITS},
            "Labels: train / validation share. 'none' is a native negative label, not ALLOW."),
        "fig2_length_histogram.svg": line_chart(
            "Comment length distribution", scope, [bin_width * (i + 0.5) for i in range(upper // bin_width)],
            {s: [pct(c, n[s]) for c in histograms[s]] for s in SPLITS},
            f"Length (Unicode code points, {bin_width}-point bins)", "Share of split",
            LENGTH_BOUNDARY, list(range(0, upper + 1, 25 if upper <= 200 else 100))),
        "fig3_length_percentiles.svg": percentile_chart(
            "Comment length percentiles", scope, {s: summaries[s]["length"] for s in SPLITS}),
        "fig4_bias_distribution.svg": grouped_bars(
            "Native bias-axis distribution", scope, BIASES,
            {s: {b: (summaries[s]["bias"]["pct"][b], summaries[s]["bias"]["counts"][b]) for b in BIASES}
             for s in SPLITS},
            "Labels: train / validation share. Bias is a separate axis, not merged into the target."),
        "fig5_label_bias_heatmap.svg": heatmap("Native hate label x bias (row-normalized)", scope, summaries),
        "fig6_title_group_sizes.svg": grouped_bars(
            "Records per news-title proxy group", scope, tuple(str(k) for k in sizes),
            {s: {str(k): (pct(group_hist[s]["size_histogram"].get(str(k), 0), group_hist[s]["unique"]),
                          group_hist[s]["size_histogram"].get(str(k), 0)) for k in sizes} for s in SPLITS},
            "x: records per normalized title; y: share of the split's groups. Title proxy is not an article/author ID.",
            tip_labels=False),
    }
    output_dir.mkdir(parents=True, exist_ok=True)
    for name, svg in sorted(figures.items()):
        (output_dir / name).write_text(svg, encoding="utf-8", newline="\n")
    return sorted(figures)


# --- driver ------------------------------------------------------------------

def run(splits_dir: Path, evidence_path: Path, config_path: Path, output_dir: Path, bin_width: int = 10) -> dict:
    guard_path(evidence_path)
    config = json.loads(config_path.read_text(encoding="utf-8"))
    evidence = json.loads(evidence_path.read_text(encoding="utf-8"))
    if evidence["revision"] != config["revision"] or evidence["split"]["seed"] != config["seed"]:
        raise ValueError("Evidence does not match the pinned config")
    records = {split: load_split(splits_dir, split) for split in SPLITS}
    for split in SPLITS:
        expected = evidence["split"]["actual"][split]
        actual = Counter(row["label"] for row in records[split])
        if len(records[split]) != expected["count"] or actual != Counter(expected["class_counts"]):
            raise ValueError(f"{split} artifact does not reconcile with AI-04 evidence")
    summaries = {split: split_summary(records[split]) for split in SPLITS}
    train_titles = {normalize(row["news_title"]) for row in records["train"]}
    val_titles = {normalize(row["news_title"]) for row in records["validation"]}
    longest = max(s["length"]["max"] for s in summaries.values())
    upper = math.ceil((longest + 1) / bin_width) * bin_width
    histograms = {split: length_histogram(records[split], bin_width, upper) for split in SPLITS}
    train_labels = summaries["train"]["labels"]["counts"]
    summary = {
        "script_version": SCRIPT_VERSION,
        "python": sys.version.split()[0],
        "dataset": config["dataset"],
        "revision": config["revision"],
        "split_seed": config["seed"],
        "split_algorithm": config["split_algorithm"],
        "input_scope": {"read": ["train.jsonl", "validation.jsonl"],
                        "test": "NOT OPENED; pre-seal aggregate from AI-04 evidence only"},
        "length_unit": "Unicode code points of stored comment text; no normalization",
        "length_boundary_candidate": LENGTH_BOUNDARY,
        "percentile_method": "nearest-rank",
        "native_labels": list(LABELS),
        "bias_values": list(BIASES),
        "splits": summaries,
        "length_histogram": {"bin_width": bin_width, "upper_exclusive": upper, "counts": histograms},
        "train_validation_title_proxy_overlap": len(train_titles & val_titles),
        "imbalance_train": {
            "largest": max(train_labels, key=train_labels.get),
            "smallest": min(train_labels, key=train_labels.get),
            "largest_to_smallest_ratio": round(max(train_labels.values()) / min(train_labels.values()), 3)},
        **evidence_summary(evidence),
    }
    assert_no_raw_text(summary, records["train"] + records["validation"])
    summary["figures"] = write_figures(summaries, histograms, bin_width, output_dir)
    (output_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=True, indent=2, sort_keys=True) + "\n",
                                             encoding="utf-8", newline="\n")
    return summary


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--splits-dir", type=Path, required=True, help="Folder holding train.jsonl and validation.jsonl")
    parser.add_argument("--evidence", type=Path, required=True, help="AI-04 aggregate evidence JSON")
    parser.add_argument("--config", type=Path, default=root / "configs/w2_dataset.json")
    parser.add_argument("--output-dir", type=Path, default=root / "artifacts/reports/w2_eda")
    args = parser.parse_args()
    summary = run(args.splits_dir, args.evidence, args.config, args.output_dir)
    print(f"EDA written: {args.output_dir} ({len(summary['figures'])} figures + summary.json)")


if __name__ == "__main__":
    main()
