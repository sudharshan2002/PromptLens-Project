"""Routes for metrics collection and summary reporting."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import MetricCreateRequest, MetricCreateResponse, MetricSummaryResponse
from app.services.metrics_service import MetricsService

router = APIRouter(tags=["metrics"])
logger = logging.getLogger(__name__)


def _get_metrics_service(request: Request) -> MetricsService:
    return request.app.state.metrics_service


@router.post("/metrics", response_model=MetricCreateResponse)
async def create_metric(payload: MetricCreateRequest, request: Request) -> MetricCreateResponse:
    """Store a user interaction metric entry."""
    service = _get_metrics_service(request)

    try:
        record_id = service.store_metric(payload)
        return MetricCreateResponse(status="stored", record_id=record_id)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metric storage failed")
        raise HTTPException(status_code=500, detail=f"Metric storage failed: {exc}") from exc


@router.get("/metrics", response_model=MetricSummaryResponse)
async def read_metrics(request: Request) -> MetricSummaryResponse:
    """Return aggregate usage metrics."""
    service = _get_metrics_service(request)

    try:
        return service.get_summary()
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Metrics summary failed")
        raise HTTPException(status_code=500, detail=f"Metrics summary failed: {exc}") from exc
