"""Routes for prompt generation and what-if analysis."""

from __future__ import annotations

import logging
from time import perf_counter

from fastapi import APIRouter, HTTPException, Request

from app.models.schemas import GenerateRequest, GenerateResponse, WhatIfRequest, WhatIfResponse
from app.services.genai_service import GenAIService
from app.utils.helpers import summarize_prompt_difference, tokenize_text

router = APIRouter(tags=["prompt"])
logger = logging.getLogger(__name__)


def _get_genai_service(request: Request) -> GenAIService:
    return request.app.state.genai_service


@router.post("/generate", response_model=GenerateResponse)
async def generate_content(payload: GenerateRequest, request: Request) -> GenerateResponse:
    """Generate text or image-style output from a user prompt."""
    service = _get_genai_service(request)
    started_at = perf_counter()

    try:
        if payload.mode == "image":
            output = await service.generate_image(payload.prompt)
        else:
            output = await service.generate_text(payload.prompt)

        logger.info(
            "Generated %s output in %.2f ms",
            payload.mode,
            (perf_counter() - started_at) * 1000,
        )
        return GenerateResponse(output=output, tokens=tokenize_text(payload.prompt))
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("Generation failed")
        raise HTTPException(status_code=500, detail=f"Generation failed: {exc}") from exc


@router.post("/what-if", response_model=WhatIfResponse)
async def what_if_analysis(payload: WhatIfRequest, request: Request) -> WhatIfResponse:
    """Summarize prompt edits and generate the new output for the modified prompt."""
    service = _get_genai_service(request)

    try:
        new_output = await service.generate_text(payload.modified_prompt)
        difference = summarize_prompt_difference(
            original_prompt=payload.original_prompt,
            modified_prompt=payload.modified_prompt,
        )
        return WhatIfResponse(difference=difference, new_output=new_output)
    except Exception as exc:  # pragma: no cover - defensive API guard
        logger.exception("What-if analysis failed")
        raise HTTPException(status_code=500, detail=f"What-if analysis failed: {exc}") from exc
