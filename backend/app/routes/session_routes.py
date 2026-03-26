"""Routes for stored generation sessions and dashboard data."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from app.models.schemas import DashboardMetricsResponse, SessionListResponse
from app.services.session_service import SessionService

router = APIRouter(tags=["sessions"])
logger = logging.getLogger(__name__)


def _get_session_service(request: Request) -> SessionService:
    return request.app.state.session_service


@router.get("/sessions", response_model=SessionListResponse)
async def read_sessions(
    request: Request,
    limit: int = Query(default=12, ge=1, le=50),
) -> SessionListResponse:
    """Return recent generation sessions."""
    service = _get_session_service(request)

    try:
        return service.list_sessions(limit=limit)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Session history failed")
        raise HTTPException(status_code=500, detail=f"Session history failed: {exc}") from exc


@router.get("/dashboard", response_model=DashboardMetricsResponse)
async def read_dashboard(request: Request) -> DashboardMetricsResponse:
    """Return dashboard aggregates for the application UI."""
    service = _get_session_service(request)

    try:
        return service.get_dashboard_metrics()
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Dashboard metrics failed")
        raise HTTPException(status_code=500, detail=f"Dashboard metrics failed: {exc}") from exc
