"""Routes for explainability endpoints."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import ExplainRequest, ExplainResponse
from app.services.explanation_service import ExplanationService

router = APIRouter(tags=["explainability"])
logger = logging.getLogger(__name__)


def _get_explanation_service(request: Request) -> ExplanationService:
    return request.app.state.explanation_service


@router.post("/explain", response_model=ExplainResponse)
async def explain_prompt(payload: ExplainRequest, request: Request) -> ExplainResponse:
    """Return a token-to-impact mapping for the provided prompt and output."""
    service = _get_explanation_service(request)

    try:
        mapping = service.build_token_mapping(prompt=payload.prompt, output=payload.output)
        return ExplainResponse(mapping=mapping)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Explainability mapping failed")
        raise HTTPException(status_code=500, detail=f"Explainability mapping failed: {exc}") from exc
