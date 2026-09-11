from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterator

import numpy as np
import pandas as pd

DATASET_DIR = Path(os.getenv("CIC_DATASET_DIR", str(Path(__file__).resolve().parent.parent / "datasets" / "CIC-IDS2018")))
CACHE_DIR = Path(os.getenv("CIC_CACHE_DIR", str(Path(__file__).parent / "cache")))
CHUNK_SIZE = int(os.getenv("CIC_CHUNK_SIZE", "50000"))
CACHE_TTL_SECONDS = int(os.getenv("CIC_CACHE_TTL_SECONDS", "3600"))


def _cache_path(name: str) -> Path:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    return CACHE_DIR / f"{name}.json"


def _read_json_cache(name: str) -> dict | None:
    path = _cache_path(name)
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
        if datetime.now(timezone.utc).timestamp() - payload["created_at"] <= CACHE_TTL_SECONDS:
            return payload["data"]
    except (OSError, KeyError, TypeError, ValueError):
        return None
    return None


def _write_json_cache(name: str, data: dict) -> dict:
    _cache_path(name).write_text(
        json.dumps({"created_at": datetime.now(timezone.utc).timestamp(), "data": data}, default=str),
        encoding="utf-8",
    )
    return data


def dataset_files() -> list[Path]:
    if not DATASET_DIR.exists():
        raise FileNotFoundError(f"CIC dataset directory does not exist: {DATASET_DIR}")
    return sorted(DATASET_DIR.glob("*.csv"))


def _clean_column(column: object) -> str:
    return re.sub(r"\s+", "_", str(column).strip().lower())


def _label_column(columns: list[str]) -> str:
    for column in columns:
        if _clean_column(column) in {"label", "class", "target", "attack"}:
            return column
    raise ValueError("No label column found. Expected Label, Class, Target, or Attack.")


def _header(path: Path) -> list[str]:
    return list(pd.read_csv(path, nrows=0, encoding="utf-8", encoding_errors="replace").columns)


def iter_frames(path: Path) -> Iterator[pd.DataFrame]:
    yield from pd.read_csv(
        path,
        chunksize=CHUNK_SIZE,
        dtype=str,
        low_memory=False,
        encoding="utf-8",
        encoding_errors="replace",
        on_bad_lines="skip",
    )


def _normalise(frame: pd.DataFrame, label_column: str) -> pd.DataFrame:
    frame = frame.copy()
    frame.columns = [_clean_column(column) for column in frame.columns]
    normalized_label = _clean_column(label_column)
    if normalized_label not in frame.columns:
        normalized_label = next((c for c in frame.columns if c in {"label", "class", "target", "attack"}), "")
    if not normalized_label:
        raise ValueError("Label column disappeared during normalization.")
    frame[normalized_label] = frame[normalized_label].astype("string").str.strip().fillna("Unknown")
    # Some CIC-IDS2018 exports repeat the CSV header after file concatenation.
    # Those rows are metadata, not a real traffic class.
    frame = frame[frame[normalized_label].str.casefold() != normalized_label.casefold()]
    frame.replace([np.inf, -np.inf], np.nan, inplace=True)
    return frame


def _is_normal(label: str) -> bool:
    return label.strip().upper() in {"BENIGN", "NORMAL", "NORMAL TRAFFIC"}


def _label_display(label: str) -> str:
    return "Normal" if _is_normal(label) else label.strip()


def _source_metadata() -> tuple[list[Path], str, list[str]]:
    files = dataset_files()
    if not files:
        raise FileNotFoundError(f"No CSV files found in {DATASET_DIR}")
    headers = _header(files[0])
    label = _label_column(headers)
    return files, label, headers


def summary() -> dict:
    cached = _read_json_cache("dataset_summary")
    if cached:
        return cached
    files, label, headers = _source_metadata()
    result = {
        "dataset_path": str(DATASET_DIR),
        "cache_status": "fresh_scan",
        "label_column": label,
        "feature_count": max(0, len(headers) - 1),
        "files": [
            {"name": path.name, "size_bytes": path.stat().st_size, "columns": len(_header(path))}
            for path in files
        ],
        "file_count": len(files),
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    return _write_json_cache("dataset_summary", result)


def traffic_summary() -> dict:
    cached = _read_json_cache("traffic_summary")
    if cached:
        return cached
    files, label, _ = _source_metadata()
    total = normal = malicious = duplicates = missing_cells = 0
    numeric_rows = 0
    for path in files:
        for frame in iter_frames(path):
            frame = _normalise(frame, label)
            normalized_label = _clean_column(label)
            total += len(frame)
            normal += int(frame[normalized_label].map(_is_normal).sum())
            missing_cells += int(frame.isna().sum().sum())
            duplicate_count = int(frame.duplicated().sum())
            duplicates += duplicate_count
            malicious += len(frame) - int(frame[normalized_label].map(_is_normal).sum())
            numeric_rows += len(frame)
    result = {
        "total_flows": total,
        "normal_flows": normal,
        "malicious_flows": malicious,
        "duplicate_rows": duplicates,
        "missing_cells": missing_cells,
        "numeric_columns": numeric_rows,
        "source_scope": "full_dataset",
        "cache_status": "fresh_scan",
    }
    return _write_json_cache("traffic_summary", result)


def attack_distribution() -> dict:
    cached = _read_json_cache("attack_distribution")
    if cached:
        return cached
    files, label, _ = _source_metadata()
    counts: dict[str, int] = {}
    for path in files:
        for frame in iter_frames(path):
            frame = _normalise(frame, label)
            for value, count in frame[_clean_column(label)].value_counts(dropna=False).items():
                key = _label_display(str(value))
                counts[key] = counts.get(key, 0) + int(count)
    result = {
        "labels": [{"label": key, "count": value, "is_attack": key != "Normal"} for key, value in sorted(counts.items(), key=lambda item: -item[1])],
        "source_scope": "full_dataset",
        "cache_status": "fresh_scan",
    }
    return _write_json_cache("attack_distribution", result)


def timeline() -> dict:
    cached = _read_json_cache("traffic_timeline")
    if cached:
        return cached
    files, label, headers = _source_metadata()
    timestamp = next((c for c in headers if _clean_column(c) in {"timestamp", "time", "date"}), None)
    if not timestamp:
        return _write_json_cache("traffic_timeline", {"points": [], "source_scope": "full_dataset", "message": "No timestamp column found."})
    buckets: dict[str, dict[str, int]] = {}
    for path in files:
        for frame in iter_frames(path):
            frame = _normalise(frame, label)
            ts = pd.to_datetime(frame[_clean_column(timestamp)], errors="coerce")
            labels = frame[_clean_column(label)].map(_is_normal)
            grouped = pd.DataFrame({"timestamp": ts.dt.floor("h"), "normal": labels}).dropna(subset=["timestamp"])
            for hour, group in grouped.groupby("timestamp"):
                key = hour.isoformat()
                point = buckets.setdefault(key, {"timestamp": key, "normal": 0, "malicious": 0, "total": 0})
                point["normal"] += int(group["normal"].sum())
                point["malicious"] += int((~group["normal"]).sum())
                point["total"] += len(group)
    result = {"points": sorted(buckets.values(), key=lambda point: point["timestamp"]), "source_scope": "full_dataset", "cache_status": "fresh_scan"}
    return _write_json_cache("traffic_timeline", result)


def feature_summary() -> dict:
    cached = _read_json_cache("feature_summary")
    if cached:
        return cached
    files, label, headers = _source_metadata()
    sums: dict[str, float] = {}
    counts: dict[str, int] = {}
    missing: dict[str, int] = {column: 0 for column in headers}
    numeric_columns = [_clean_column(c) for c in headers if _clean_column(c) != _clean_column(label)]
    for path in files:
        for frame in iter_frames(path):
            frame = _normalise(frame, label)
            for column in frame.columns:
                missing[column] = missing.get(column, 0) + int(frame[column].isna().sum())
            numeric = frame.reindex(columns=numeric_columns).apply(pd.to_numeric, errors="coerce")
            for column in numeric.columns:
                values = numeric[column].dropna()
                if values.empty:
                    continue
                sums[column] = sums.get(column, 0.0) + float(values.abs().sum())
                counts[column] = counts.get(column, 0) + len(values)
    features = [{"feature": column, "mean_absolute_value": sums[column] / counts[column], "missing_values": missing.get(column, 0)} for column in sums]
    result = {"features": sorted(features, key=lambda row: -row["mean_absolute_value"])[:50], "label_column": label, "source_scope": "full_dataset", "cache_status": "fresh_scan"}
    return _write_json_cache("feature_summary", result)


def training_frame(max_rows: int = 200_000) -> pd.DataFrame:
    files, label, headers = _source_metadata()
    frames: list[pd.DataFrame] = []
    per_file = max(1, max_rows // len(files))
    for path in files:
        remaining = per_file
        for frame in iter_frames(path):
            frame = _normalise(frame, label)
            take = min(len(frame), remaining)
            if take:
                frames.append(frame.head(take))
                remaining -= take
            if remaining <= 0:
                break
    if not frames:
        raise ValueError("No rows available for model training.")
    return pd.concat(frames, ignore_index=True)
