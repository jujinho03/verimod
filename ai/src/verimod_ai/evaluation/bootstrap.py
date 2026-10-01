"""AI-06: percentile bootstrap confidence interval (optionally group-aware).

No resample count, seed or confidence level is fixed in the repository, so all
three are required arguments with no defaults.

Method: draw ``n_resamples`` resamples with replacement using
``random.Random(seed)``. With ``groups``, whole groups are drawn (cluster
bootstrap, e.g. news-title groups). Each resample's statistic is computed; a
``None`` result is counted as undefined and skipped. Interval = sorted defined
values at index floor(alpha/2 * k) and ceil((1 - alpha/2) * k) - 1, with
alpha = 1 - confidence_level and k defined resamples.
"""

from __future__ import annotations

from collections.abc import Callable, Hashable, Sequence
import math
import random
from typing import TypeVar

T = TypeVar("T")
METHOD = "percentile"


def bootstrap_ci(items: Sequence[T], statistic: Callable[[list[T]], float | None], *,
                 n_resamples: int, seed: int, confidence_level: float,
                 groups: Sequence[Hashable] | None = None) -> dict:
    if not items:
        raise ValueError("items must be non-empty")
    if not isinstance(n_resamples, int) or isinstance(n_resamples, bool) or n_resamples < 1:
        raise ValueError("n_resamples must be a positive int")
    if not isinstance(seed, int) or isinstance(seed, bool):
        raise ValueError("seed must be an int")
    if not isinstance(confidence_level, float) or not 0 < confidence_level < 1:
        raise ValueError("confidence_level must be a float in (0, 1)")
    if groups is not None and len(groups) != len(items):
        raise ValueError("groups must align with items")

    if groups is None:
        units = [[item] for item in items]
    else:
        by_group: dict[Hashable, list[T]] = {}
        for item, group in zip(items, groups):
            by_group.setdefault(group, []).append(item)
        units = [by_group[key] for key in sorted(by_group, key=repr)]

    rng = random.Random(seed)
    values = []
    undefined = 0
    for _ in range(n_resamples):
        sample: list[T] = []
        for _ in range(len(units)):
            sample.extend(units[rng.randrange(len(units))])
        value = statistic(sample)
        if value is None:
            undefined += 1
        else:
            values.append(value)
    values.sort()
    alpha = 1 - confidence_level
    lower = upper = None
    if values:
        k = len(values)
        lower = values[min(k - 1, math.floor(alpha / 2 * k))]
        upper = values[max(0, math.ceil((1 - alpha / 2) * k) - 1)]
    return {"point": statistic(list(items)), "lower": lower, "upper": upper,
            "method": METHOD, "n_resamples": n_resamples, "n_undefined": undefined,
            "seed": seed, "confidence_level": confidence_level,
            "unit": "group" if groups is not None else "item"}
