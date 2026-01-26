"""
PromptLens Backend - Metrics Service
Handles user trust metrics collection and analysis
"""

import uuid
import json
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path
from models import (
    UserMetrics,
    MetricsSubmitRequest,
    MetricsSubmitResponse,
    MetricsSummaryResponse
)


# Simple file-based storage for metrics (in production, use a database)
METRICS_FILE = Path(__file__).parent / "data" / "metrics.json"


def ensure_data_directory():
    """Ensure the data directory exists."""
    METRICS_FILE.parent.mkdir(parents=True, exist_ok=True)
    if not METRICS_FILE.exists():
        METRICS_FILE.write_text("[]")


def load_all_metrics() -> List[Dict]:
    """Load all metrics from storage."""
    ensure_data_directory()
    try:
        data = json.loads(METRICS_FILE.read_text())
        return data if isinstance(data, list) else []
    except (json.JSONDecodeError, FileNotFoundError):
        return []


def save_metrics(metrics_list: List[Dict]):
    """Save all metrics to storage."""
    ensure_data_directory()
    METRICS_FILE.write_text(json.dumps(metrics_list, indent=2))


async def submit_metrics(request: MetricsSubmitRequest) -> MetricsSubmitResponse:
    """
    Submit user metrics for storage and analysis.
    """
    metrics_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    # Load existing metrics
    all_metrics = load_all_metrics()
    
    # Create new metrics entry
    entry = {
        "metrics_id": metrics_id,
        "session_id": request.session_id,
        "timestamp": timestamp,
        "consent_given": request.consent_given,
        "feedback_text": request.feedback_text,
        "metrics": {
            "transparency_score": request.metrics.transparency_score,
            "understanding_score": request.metrics.understanding_score,
            "trust_score": request.metrics.trust_score,
            "usefulness_score": request.metrics.usefulness_score,
            "interaction_count": request.metrics.interaction_count,
            "time_spent_seconds": request.metrics.time_spent_seconds,
            "segments_edited": request.metrics.segments_edited,
            "whatif_uses": request.metrics.whatif_uses,
            "heatmap_interactions": request.metrics.heatmap_interactions,
        }
    }
    
    # Only store if consent given
    if request.consent_given:
        all_metrics.append(entry)
        save_metrics(all_metrics)
    
    return MetricsSubmitResponse(
        success=True,
        message="Metrics submitted successfully" if request.consent_given else "Metrics recorded (consent not given, not stored)",
        metrics_id=metrics_id,
        timestamp=timestamp
    )


async def get_metrics_summary() -> MetricsSummaryResponse:
    """
    Get aggregated summary of all collected metrics.
    """
    all_metrics = load_all_metrics()
    
    if not all_metrics:
        return MetricsSummaryResponse(
            total_sessions=0,
            average_transparency=0.0,
            average_understanding=0.0,
            average_trust=0.0,
            average_usefulness=0.0,
            average_time_spent=0.0,
            total_whatif_uses=0,
            distribution={
                "transparency": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                "understanding": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                "trust": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                "usefulness": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
            },
            timestamp=datetime.utcnow().isoformat()
        )
    
    # Calculate aggregates
    total = len(all_metrics)
    
    transparency_scores = []
    understanding_scores = []
    trust_scores = []
    usefulness_scores = []
    time_spent_values = []
    whatif_total = 0
    
    # Initialize distribution counters
    distribution = {
        "transparency": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "understanding": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "trust": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
        "usefulness": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
    }
    
    for entry in all_metrics:
        m = entry.get("metrics", {})
        
        trans = m.get("transparency_score", 3)
        under = m.get("understanding_score", 3)
        trust = m.get("trust_score", 3)
        useful = m.get("usefulness_score", 3)
        
        transparency_scores.append(trans)
        understanding_scores.append(under)
        trust_scores.append(trust)
        usefulness_scores.append(useful)
        
        time_spent_values.append(m.get("time_spent_seconds", 0))
        whatif_total += m.get("whatif_uses", 0)
        
        # Update distributions
        if 1 <= trans <= 5:
            distribution["transparency"][trans] += 1
        if 1 <= under <= 5:
            distribution["understanding"][under] += 1
        if 1 <= trust <= 5:
            distribution["trust"][trust] += 1
        if 1 <= useful <= 5:
            distribution["usefulness"][useful] += 1
    
    return MetricsSummaryResponse(
        total_sessions=total,
        average_transparency=round(sum(transparency_scores) / total, 2),
        average_understanding=round(sum(understanding_scores) / total, 2),
        average_trust=round(sum(trust_scores) / total, 2),
        average_usefulness=round(sum(usefulness_scores) / total, 2),
        average_time_spent=round(sum(time_spent_values) / total, 2),
        total_whatif_uses=whatif_total,
        distribution=distribution,
        timestamp=datetime.utcnow().isoformat()
    )


async def get_session_metrics(session_id: str) -> Optional[Dict]:
    """
    Get metrics for a specific session.
    """
    all_metrics = load_all_metrics()
    
    for entry in all_metrics:
        if entry.get("session_id") == session_id:
            return entry
    
    return None


def calculate_trust_trend() -> List[Dict]:
    """
    Calculate trust score trend over time.
    """
    all_metrics = load_all_metrics()
    
    # Sort by timestamp
    sorted_metrics = sorted(all_metrics, key=lambda x: x.get("timestamp", ""))
    
    trend = []
    for entry in sorted_metrics[-50:]:  # Last 50 entries
        m = entry.get("metrics", {})
        trend.append({
            "timestamp": entry.get("timestamp"),
            "trust_score": m.get("trust_score", 3),
            "transparency_score": m.get("transparency_score", 3),
        })
    
    return trend
