"""Request and response schemas for the API."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field, field_validator


class GenerateRequest(BaseModel):
    """Input payload for content generation."""

    prompt: str = Field(..., min_length=1, description="User prompt text")
    mode: Literal["text", "image"] = Field(default="text")


class GenerateResponse(BaseModel):
    """Output payload for generated content."""

    output: str
    tokens: list[str]


class ExplainRequest(BaseModel):
    """Input payload for prompt explainability."""

    prompt: str = Field(..., min_length=1)
    output: str = Field(..., min_length=1)


class TokenImpact(BaseModel):
    """Single token impact value."""

    token: str
    impact: float = Field(..., ge=0.0, le=1.0)


class ExplainResponse(BaseModel):
    """Explainability response payload."""

    mapping: list[TokenImpact]


class WhatIfRequest(BaseModel):
    """Input payload for prompt delta analysis."""

    original_prompt: str = Field(..., min_length=1)
    modified_prompt: str = Field(..., min_length=1)


class WhatIfResponse(BaseModel):
    """Output payload for prompt delta analysis."""

    difference: str
    new_output: str


class MetricCreateRequest(BaseModel):
    """Input payload for storing interaction metrics."""

    prompt_length: int = Field(..., ge=0)
    response_time_ms: float = Field(..., ge=0)
    rating: float | None = Field(default=None, ge=0, le=5)
    endpoint: str | None = Field(default=None, max_length=64)
    mode: Literal["text", "image"] | None = Field(default=None)
    trust_score: float | None = Field(default=None, ge=0, le=1)
    feedback: str | None = Field(default=None, max_length=1000)
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="UTC timestamp in ISO-8601 format",
    )

    @field_validator("created_at")
    @classmethod
    def validate_created_at(cls, value: str) -> str:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return value


class MetricCreateResponse(BaseModel):
    """Output payload after storing a metric."""

    status: str
    record_id: int


class MetricSummaryResponse(BaseModel):
    """Aggregate metrics response."""

    avg_response_time: float
    avg_rating: float | None
    total_requests: int
