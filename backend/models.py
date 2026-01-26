"""
PromptLens Backend - Pydantic Models
Defines all request/response schemas matching the API contract
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime
import uuid


# ============================================================
# ENUMS
# ============================================================

class SegmentCategory(str, Enum):
    SUBJECT = "subject"
    ACTION = "action"
    STYLE = "style"
    CONTEXT = "context"
    MODIFIER = "modifier"
    UNKNOWN = "unknown"


class GenerationType(str, Enum):
    TEXT = "text"
    IMAGE = "image"


# ============================================================
# PROMPT SEGMENT MODELS
# ============================================================

class PromptSegment(BaseModel):
    """A single segment of a prompt with NLP-derived metadata"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    start: int
    end: int
    category: SegmentCategory = SegmentCategory.UNKNOWN
    confidence: float = Field(ge=0.0, le=1.0, default=0.8)
    importance: float = Field(ge=0.0, le=1.0, default=0.5)


class PromptSubmitRequest(BaseModel):
    """Request to submit and segment a prompt"""
    prompt: str = Field(min_length=1, max_length=4000)
    generation_type: GenerationType = GenerationType.TEXT


class PromptSubmitResponse(BaseModel):
    """Response containing segmented prompt"""
    session_id: str
    original_prompt: str
    segments: List[PromptSegment]
    timestamp: str


# ============================================================
# TEXT GENERATION MODELS
# ============================================================

class TextGenerateRequest(BaseModel):
    """Request for text generation"""
    session_id: str
    prompt: str
    segments: List[PromptSegment]
    max_tokens: int = Field(default=1024, ge=50, le=4096)
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)


class SentenceMapping(BaseModel):
    """Maps output sentences to input segments"""
    sentence_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sentence_text: str
    sentence_index: int
    contributing_segments: List[str]  # segment IDs
    confidence_scores: Dict[str, float]  # segment_id -> confidence


class TextGenerateResponse(BaseModel):
    """Response containing generated text with explanations"""
    session_id: str
    generated_text: str
    sentence_mappings: List[SentenceMapping]
    generation_metadata: Dict[str, Any]
    timestamp: str


# ============================================================
# IMAGE GENERATION MODELS
# ============================================================

class ImageGenerateRequest(BaseModel):
    """Request for image generation"""
    session_id: str
    prompt: str
    segments: List[PromptSegment]
    width: int = Field(default=512, ge=256, le=1024)
    height: int = Field(default=512, ge=256, le=1024)
    num_inference_steps: int = Field(default=30, ge=10, le=100)


class HeatmapRegion(BaseModel):
    """A region of the heatmap with segment attribution"""
    segment_id: str
    x: float = Field(ge=0.0, le=1.0)
    y: float = Field(ge=0.0, le=1.0)
    width: float = Field(ge=0.0, le=1.0)
    height: float = Field(ge=0.0, le=1.0)
    intensity: float = Field(ge=0.0, le=1.0)


class ImageGenerateResponse(BaseModel):
    """Response containing generated image with explanation data"""
    session_id: str
    image_url: str  # Base64 data URL or hosted URL
    image_width: int
    image_height: int
    heatmap_data: List[HeatmapRegion]
    segment_contributions: Dict[str, float]  # segment_id -> contribution percentage
    generation_metadata: Dict[str, Any]
    timestamp: str


# ============================================================
# TEXT EXPLANATION MODELS
# ============================================================

class TextExplainRequest(BaseModel):
    """Request to explain text generation"""
    session_id: str
    generated_text: str
    segments: List[PromptSegment]


class TextExplainResponse(BaseModel):
    """Detailed explanation of text generation"""
    session_id: str
    sentence_mappings: List[SentenceMapping]
    overall_segment_importance: Dict[str, float]
    explanation_confidence: float
    timestamp: str


# ============================================================
# IMAGE EXPLANATION MODELS
# ============================================================

class ImageExplainRequest(BaseModel):
    """Request to explain image generation"""
    session_id: str
    image_url: str
    segments: List[PromptSegment]


class ImageExplainResponse(BaseModel):
    """Detailed explanation of image generation"""
    session_id: str
    heatmap_data: List[HeatmapRegion]
    segment_contributions: Dict[str, float]
    attention_summary: str
    explanation_confidence: float
    timestamp: str


# ============================================================
# WHAT-IF MODELS
# ============================================================

class WhatIfRequest(BaseModel):
    """Request for what-if analysis with modified prompt"""
    session_id: str
    original_prompt: str
    modified_prompt: str
    original_segments: List[PromptSegment]
    generation_type: GenerationType


class SegmentChange(BaseModel):
    """Describes a change in a segment"""
    segment_id: str
    change_type: str  # "added", "removed", "modified", "unchanged"
    original_text: Optional[str] = None
    modified_text: Optional[str] = None
    impact_score: float = Field(ge=0.0, le=1.0)


class WhatIfResponse(BaseModel):
    """Response comparing original and modified outputs"""
    session_id: str
    original_output: str
    modified_output: str
    segment_changes: List[SegmentChange]
    impact_summary: Dict[str, Any]
    comparison_metrics: Dict[str, float]
    timestamp: str


# ============================================================
# METRICS MODELS
# ============================================================

class UserMetrics(BaseModel):
    """User interaction and trust metrics"""
    session_id: str
    transparency_score: int = Field(ge=1, le=5)
    understanding_score: int = Field(ge=1, le=5)
    trust_score: int = Field(ge=1, le=5)
    usefulness_score: int = Field(ge=1, le=5)
    interaction_count: int = Field(ge=0)
    time_spent_seconds: float = Field(ge=0)
    segments_edited: int = Field(ge=0)
    whatif_uses: int = Field(ge=0)
    heatmap_interactions: int = Field(ge=0)


class MetricsSubmitRequest(BaseModel):
    """Request to submit user metrics"""
    session_id: str
    metrics: UserMetrics
    feedback_text: Optional[str] = None
    consent_given: bool = True


class MetricsSubmitResponse(BaseModel):
    """Response confirming metrics submission"""
    success: bool
    message: str
    metrics_id: str
    timestamp: str


class MetricsSummaryResponse(BaseModel):
    """Aggregated metrics summary"""
    total_sessions: int
    average_transparency: float
    average_understanding: float
    average_trust: float
    average_usefulness: float
    average_time_spent: float
    total_whatif_uses: int
    distribution: Dict[str, Dict[int, int]]  # metric_name -> {score: count}
    timestamp: str


# ============================================================
# ERROR MODELS
# ============================================================

class ErrorResponse(BaseModel):
    """Standard error response"""
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
