"""
PromptLens Backend - What-If Analysis Service
Handles comparison between original and modified prompts
"""

import uuid
from datetime import datetime
from typing import List, Dict, Any
from difflib import SequenceMatcher

from models import (
    PromptSegment,
    WhatIfRequest,
    WhatIfResponse,
    SegmentChange,
    GenerationType
)
from nlp_service import segment_prompt, classify_segment
from text_service import generate_text, generate_text_mock, TextGenerateRequest
from image_service import generate_image, generate_image_mock, ImageGenerateRequest
import os


async def analyze_whatif(request: WhatIfRequest) -> WhatIfResponse:
    """
    Perform what-if analysis by comparing original and modified prompt outputs.
    """
    # Segment the modified prompt
    modified_segments = segment_prompt(request.modified_prompt)
    
    # Detect changes between segments
    segment_changes = detect_segment_changes(
        request.original_segments, 
        modified_segments,
        request.original_prompt,
        request.modified_prompt
    )
    
    # Generate outputs for both prompts
    if request.generation_type == GenerationType.TEXT:
        original_output, modified_output = await generate_text_comparison(
            request.session_id,
            request.original_prompt,
            request.modified_prompt,
            request.original_segments,
            modified_segments
        )
    else:
        original_output, modified_output = await generate_image_comparison(
            request.session_id,
            request.original_prompt,
            request.modified_prompt,
            request.original_segments,
            modified_segments
        )
    
    # Calculate impact summary
    impact_summary = calculate_impact_summary(segment_changes)
    
    # Calculate comparison metrics
    comparison_metrics = calculate_comparison_metrics(
        original_output, 
        modified_output,
        segment_changes
    )
    
    return WhatIfResponse(
        session_id=request.session_id,
        original_output=original_output,
        modified_output=modified_output,
        segment_changes=segment_changes,
        impact_summary=impact_summary,
        comparison_metrics=comparison_metrics,
        timestamp=datetime.utcnow().isoformat()
    )


def detect_segment_changes(
    original_segments: List[PromptSegment],
    modified_segments: List[PromptSegment],
    original_prompt: str,
    modified_prompt: str
) -> List[SegmentChange]:
    """
    Detect changes between original and modified segments.
    """
    changes = []
    
    # Create a mapping of segment text to segments
    original_texts = {s.text.lower(): s for s in original_segments}
    modified_texts = {s.text.lower(): s for s in modified_segments}
    
    # Find removed segments
    for orig_seg in original_segments:
        orig_text = orig_seg.text.lower()
        if orig_text not in modified_texts:
            # Check if it was modified (similar text exists)
            best_match = find_best_match(orig_seg.text, [s.text for s in modified_segments])
            
            if best_match and best_match[1] > 0.5:  # Similar enough to be a modification
                changes.append(SegmentChange(
                    segment_id=orig_seg.id,
                    change_type="modified",
                    original_text=orig_seg.text,
                    modified_text=best_match[0],
                    impact_score=calculate_change_impact(orig_seg, best_match[1])
                ))
                modified_texts.pop(best_match[0].lower(), None)  # Mark as handled
            else:
                changes.append(SegmentChange(
                    segment_id=orig_seg.id,
                    change_type="removed",
                    original_text=orig_seg.text,
                    modified_text=None,
                    impact_score=orig_seg.importance
                ))
        else:
            # Unchanged segment
            changes.append(SegmentChange(
                segment_id=orig_seg.id,
                change_type="unchanged",
                original_text=orig_seg.text,
                modified_text=orig_seg.text,
                impact_score=0.0
            ))
            modified_texts.pop(orig_text, None)
    
    # Find added segments (remaining in modified that weren't matched)
    for mod_text, mod_seg in modified_texts.items():
        if not any(c.modified_text and c.modified_text.lower() == mod_text for c in changes):
            changes.append(SegmentChange(
                segment_id=mod_seg.id,
                change_type="added",
                original_text=None,
                modified_text=mod_seg.text,
                impact_score=mod_seg.importance
            ))
    
    return changes


def find_best_match(text: str, candidates: List[str]) -> tuple[str, float] | None:
    """
    Find the best matching text from candidates using sequence matching.
    """
    if not candidates:
        return None
    
    best_match = None
    best_ratio = 0
    
    for candidate in candidates:
        ratio = SequenceMatcher(None, text.lower(), candidate.lower()).ratio()
        if ratio > best_ratio:
            best_ratio = ratio
            best_match = candidate
    
    if best_match and best_ratio > 0.3:
        return (best_match, best_ratio)
    return None


def calculate_change_impact(segment: PromptSegment, similarity: float) -> float:
    """
    Calculate the impact score of a segment change.
    """
    # Higher importance and lower similarity = higher impact
    base_impact = segment.importance
    change_magnitude = 1 - similarity
    
    return round(base_impact * change_magnitude, 3)


async def generate_text_comparison(
    session_id: str,
    original_prompt: str,
    modified_prompt: str,
    original_segments: List[PromptSegment],
    modified_segments: List[PromptSegment]
) -> tuple[str, str]:
    """
    Generate text outputs for both prompts.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    use_mock = not api_key or api_key == "your_openai_api_key_here"
    
    generate_fn = generate_text_mock if use_mock else generate_text
    
    # Generate original
    original_request = TextGenerateRequest(
        session_id=session_id,
        prompt=original_prompt,
        segments=original_segments,
        max_tokens=512,
        temperature=0.7
    )
    original_response = await generate_fn(original_request)
    
    # Generate modified
    modified_request = TextGenerateRequest(
        session_id=session_id,
        prompt=modified_prompt,
        segments=modified_segments,
        max_tokens=512,
        temperature=0.7
    )
    modified_response = await generate_fn(modified_request)
    
    return original_response.generated_text, modified_response.generated_text


async def generate_image_comparison(
    session_id: str,
    original_prompt: str,
    modified_prompt: str,
    original_segments: List[PromptSegment],
    modified_segments: List[PromptSegment]
) -> tuple[str, str]:
    """
    Generate image outputs for both prompts.
    Returns image URLs.
    """
    api_token = os.getenv("REPLICATE_API_TOKEN")
    use_mock = not api_token or api_token == "your_replicate_api_token_here"
    
    generate_fn = generate_image_mock if use_mock else generate_image
    
    # Generate original
    original_request = ImageGenerateRequest(
        session_id=session_id,
        prompt=original_prompt,
        segments=original_segments
    )
    original_response = await generate_fn(original_request)
    
    # Generate modified
    modified_request = ImageGenerateRequest(
        session_id=session_id,
        prompt=modified_prompt,
        segments=modified_segments
    )
    modified_response = await generate_fn(modified_request)
    
    return original_response.image_url, modified_response.image_url


def calculate_impact_summary(changes: List[SegmentChange]) -> Dict[str, Any]:
    """
    Calculate summary statistics for the changes.
    """
    total_changes = len(changes)
    added = sum(1 for c in changes if c.change_type == "added")
    removed = sum(1 for c in changes if c.change_type == "removed")
    modified = sum(1 for c in changes if c.change_type == "modified")
    unchanged = sum(1 for c in changes if c.change_type == "unchanged")
    
    total_impact = sum(c.impact_score for c in changes)
    avg_impact = total_impact / total_changes if total_changes > 0 else 0
    
    # Determine overall change magnitude
    change_ratio = (added + removed + modified) / total_changes if total_changes > 0 else 0
    
    if change_ratio < 0.2:
        magnitude = "minimal"
    elif change_ratio < 0.5:
        magnitude = "moderate"
    else:
        magnitude = "significant"
    
    return {
        "total_segments_analyzed": total_changes,
        "segments_added": added,
        "segments_removed": removed,
        "segments_modified": modified,
        "segments_unchanged": unchanged,
        "total_impact_score": round(total_impact, 3),
        "average_impact_score": round(avg_impact, 3),
        "change_magnitude": magnitude,
        "change_ratio": round(change_ratio, 3)
    }


def calculate_comparison_metrics(
    original_output: str,
    modified_output: str,
    changes: List[SegmentChange]
) -> Dict[str, float]:
    """
    Calculate metrics comparing the two outputs.
    """
    # Text similarity
    similarity = SequenceMatcher(None, original_output, modified_output).ratio()
    
    # Word-level differences
    original_words = set(original_output.lower().split())
    modified_words = set(modified_output.lower().split())
    
    common_words = original_words & modified_words
    all_words = original_words | modified_words
    
    word_overlap = len(common_words) / len(all_words) if all_words else 1
    
    # Length difference
    len_diff = abs(len(modified_output) - len(original_output))
    max_len = max(len(original_output), len(modified_output), 1)
    length_change = len_diff / max_len
    
    # Impact correlation (how much output changed relative to input changes)
    input_change_score = sum(c.impact_score for c in changes if c.change_type != "unchanged")
    max_possible_impact = len(changes) if changes else 1
    normalized_input_change = input_change_score / max_possible_impact
    
    output_change = 1 - similarity
    
    # If input change is similar to output change, correlation is high
    correlation = 1 - abs(normalized_input_change - output_change)
    
    return {
        "text_similarity": round(similarity, 3),
        "word_overlap": round(word_overlap, 3),
        "length_change_ratio": round(length_change, 3),
        "input_output_correlation": round(correlation, 3),
        "divergence_score": round(1 - similarity, 3)
    }
