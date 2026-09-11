from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, precision_recall_fscore_support

try:
    from .data_loader import CACHE_DIR, training_frame
except ImportError:
    from data_loader import CACHE_DIR, training_frame

MODEL_PATH = CACHE_DIR / "cic_random_forest.joblib"
METRICS_PATH = CACHE_DIR / "model_metrics.json"


def _label_column(frame: pd.DataFrame) -> str:
    return next(column for column in frame.columns if column in {"label", "class", "target", "attack"})


def _prepare(frame: pd.DataFrame, fit_columns: list[str] | None = None) -> tuple[pd.DataFrame, pd.Series, list[str]]:
    frame = frame.copy()
    frame.columns = [re.sub(r"\s+", "_", str(column).strip().lower()) for column in frame.columns]
    label_column = _label_column(frame)
    labels = frame[label_column].astype(str).str.strip()
    features = frame.drop(columns=[label_column]).copy()
    timestamp = next((column for column in features.columns if column in {"timestamp", "time", "date"}), None)
    if timestamp:
        features[timestamp] = pd.to_datetime(features[timestamp], errors="coerce").astype("int64") // 10**9
    for column in features.columns:
        if not pd.api.types.is_numeric_dtype(features[column]):
            features[column] = pd.to_numeric(features[column], errors="coerce")
    features.replace([np.inf, -np.inf], np.nan, inplace=True)
    features = features.select_dtypes(include=[np.number]).fillna(0)
    if fit_columns is not None:
        features = features.reindex(columns=fit_columns, fill_value=0)
        columns = fit_columns
    else:
        columns = list(features.columns)
    return features, labels, columns


def train_model() -> dict:
    frame = training_frame(int(os.getenv("CIC_TRAINING_ROWS", "200000")))
    features, labels, columns = _prepare(frame)
    if labels.nunique() < 2:
        raise ValueError("At least two label classes are required for training.")
    # Preserve row order: CIC files are time-oriented, so this avoids random leakage
    # from neighboring flows in the same capture window.
    split = max(1, int(len(features) * 0.8))
    if split >= len(features):
        split = len(features) - 1
    x_train, x_test = features.iloc[:split], features.iloc[split:]
    y_train, y_test = labels.iloc[:split], labels.iloc[split:]
    model = RandomForestClassifier(
        n_estimators=150,
        max_depth=24,
        n_jobs=-1,
        class_weight="balanced_subsample",
        random_state=42,
    )
    model.fit(x_train, y_train)
    predictions = model.predict(x_test)
    precision, recall, f1, _ = precision_recall_fscore_support(y_test, predictions, average="weighted", zero_division=0)
    labels_order = list(model.classes_)
    metrics = {
        "model": "RandomForestClassifier",
        "status": "ready",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "training_rows": len(x_train),
        "test_rows": len(x_test),
        "training_scope": "real_dataset_sample_in_file_order",
        "accuracy": accuracy_score(y_test, predictions),
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "classes": labels_order,
        "confusion_matrix": confusion_matrix(y_test, predictions, labels=labels_order).tolist(),
        "classification_report": classification_report(y_test, predictions, labels=labels_order, zero_division=0, output_dict=True),
        "feature_importance": sorted(
            [{"feature": name, "importance": float(value)} for name, value in zip(columns, model.feature_importances_)],
            key=lambda item: -item["importance"],
        )[:30],
    }
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "columns": columns}, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, default=float), encoding="utf-8")
    return metrics


def model_metrics() -> dict:
    if not METRICS_PATH.exists():
        return {"status": "not_trained", "model": "RandomForestClassifier"}
    return json.loads(METRICS_PATH.read_text(encoding="utf-8"))


def predict(payload: dict) -> dict:
    if not MODEL_PATH.exists():
        train_model()
    bundle = joblib.load(MODEL_PATH)
    model = bundle["model"]
    columns = bundle["columns"]
    frame = pd.DataFrame([payload])
    features, _, _ = _prepare(frame.assign(label="unknown"), columns)
    prediction = str(model.predict(features)[0])
    result: dict = {"predicted_class": prediction, "model": "RandomForestClassifier", "feature_scope": "submitted_flow"}
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features)[0]
        result["confidence"] = float(max(probabilities))
        result["class_probabilities"] = {str(name): float(value) for name, value in zip(model.classes_, probabilities)}
    return result
