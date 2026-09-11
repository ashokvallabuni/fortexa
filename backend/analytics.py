from __future__ import annotations

try:
    from .data_loader import attack_distribution, feature_summary, summary, timeline, traffic_summary
    from .model import model_metrics, train_model
except ImportError:
    from data_loader import attack_distribution, feature_summary, summary, timeline, traffic_summary
    from model import model_metrics, train_model


def model_status() -> dict:
    metrics = model_metrics()
    return {
        "status": metrics.get("status", "not_trained"),
        "model": metrics.get("model", "RandomForestClassifier"),
        "trained_at": metrics.get("trained_at"),
        "training_scope": metrics.get("training_scope"),
    }


def train_and_report() -> dict:
    return train_model()


def dashboard_snapshot() -> dict:
    return {
        "dataset": summary(),
        "traffic": traffic_summary(),
        "attacks": attack_distribution(),
        "timeline": timeline(),
        "features": feature_summary(),
        "model": model_status(),
    }
