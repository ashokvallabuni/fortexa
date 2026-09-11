from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.responses import JSONResponse

try:
    from .analytics import dashboard_snapshot, model_status, train_and_report
    from .data_loader import attack_distribution, feature_summary, summary, timeline, traffic_summary
    from .model import model_metrics, predict
except ImportError:
    from analytics import dashboard_snapshot, model_status, train_and_report
    from data_loader import attack_distribution, feature_summary, summary, timeline, traffic_summary
    from model import model_metrics, predict

app = FastAPI(title="Net-State Loom CIC-IDS2018 Analytics API", version="1.0.0")

default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://net-state-loom.vercel.app",
]
configured_origins = os.getenv("ALLOWED_ORIGINS", "")
frontend_url = os.getenv("FRONTEND_URL", "").strip()
origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)
if not origins:
    origins = default_origins
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_request: Request, exception: StarletteHTTPException) -> JSONResponse:
    detail = exception.detail if isinstance(exception.detail, str) else str(exception.detail)
    return JSONResponse(status_code=exception.status_code, content={"error": True, "message": detail, "detail": detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exception: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"error": True, "message": "Request validation failed", "detail": exception.errors()})


@app.exception_handler(Exception)
async def unexpected_exception_handler(_request: Request, exception: Exception) -> JSONResponse:
    # Keep internals out of responses while preserving the traceback in Render logs.
    import logging

    logging.getLogger(__name__).exception("Unhandled API exception", exc_info=exception)
    return JSONResponse(status_code=500, content={"error": True, "message": "Internal server error", "detail": "The backend could not complete the request."})


class PredictionRequest(BaseModel):
    features: dict[str, float | int | str | None] = Field(default_factory=dict)


def safe_call(function):
    try:
        return function()
    except (FileNotFoundError, PermissionError) as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "net-state-loom-backend"}


@app.get("/api/health")
def api_health() -> dict:
    dataset_path = Path(os.getenv("CIC_DATASET_DIR", str(Path(__file__).resolve().parent.parent / "datasets" / "CIC-IDS2018")))
    return {
        "status": "ok",
        "dataset_path": str(dataset_path),
        "dataset_available": dataset_path.exists(),
        "csv_files": len(list(dataset_path.glob("*.csv"))) if dataset_path.exists() else 0,
    }


@app.get("/api/dataset/summary")
def dataset_summary() -> dict:
    return safe_call(summary)


@app.get("/api/traffic/summary")
def traffic() -> dict:
    return safe_call(traffic_summary)


@app.get("/api/attacks/distribution")
def attacks() -> dict:
    return safe_call(attack_distribution)


@app.get("/api/traffic/timeline")
def traffic_timeline() -> dict:
    return safe_call(timeline)


@app.get("/api/features")
def features() -> dict:
    return safe_call(feature_summary)


@app.get("/api/model/status")
def status() -> dict:
    return model_status()


@app.get("/api/model/metrics")
def metrics() -> dict:
    return model_metrics()


@app.post("/api/model/train")
def train() -> dict:
    return safe_call(train_and_report)


@app.post("/api/predict")
def prediction(request: PredictionRequest) -> dict:
    if not request.features:
        raise HTTPException(status_code=400, detail="features must contain at least one network-flow value")
    return safe_call(lambda: predict(request.features))


@app.get("/api/dashboard")
def dashboard() -> dict:
    return safe_call(dashboard_snapshot)
