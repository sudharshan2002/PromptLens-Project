"""
PromptLens Backend - NLP Services
Handles prompt segmentation using rule-based NLP
"""

import re
import uuid
from typing import List, Tuple
from models import PromptSegment, SegmentCategory


# Category keywords for classification
CATEGORY_PATTERNS = {
    SegmentCategory.SUBJECT: [
        r'\b(person|people|man|woman|child|animal|dog|cat|bird|car|house|building|tree|flower|mountain|ocean|sky|robot|alien|creature|character|hero|villain)\b',
        r'\b(portrait|landscape|scene|view|picture|photo|image|painting|illustration|artwork)\b',
    ],
    SegmentCategory.ACTION: [
        r'\b(running|walking|sitting|standing|flying|swimming|dancing|fighting|eating|sleeping|working|playing|talking|writing|reading|creating|making|building|destroying)\b',
        r'\b(run|walk|sit|stand|fly|swim|dance|fight|eat|sleep|work|play|talk|write|read|create|make|build|destroy)\b',
        r'\b(action|movement|motion|activity)\b',
    ],
    SegmentCategory.STYLE: [
        r'\b(realistic|photorealistic|cartoon|anime|abstract|impressionist|surreal|minimalist|detailed|artistic|digital|watercolor|oil\s*painting|sketch|3d|rendered|cinematic|dramatic)\b',
        r'\b(style|aesthetic|look|appearance|design|art\s*style|visual\s*style)\b',
        r'\b(high\s*quality|4k|8k|hd|ultra|masterpiece|professional|beautiful|stunning|gorgeous)\b',
    ],
    SegmentCategory.CONTEXT: [
        r'\b(background|setting|environment|location|place|scene|atmosphere|ambiance|mood|time|day|night|morning|evening|sunset|sunrise|weather|season|indoor|outdoor)\b',
        r'\b(in|at|on|during|within|inside|outside|surrounded\s*by|against)\b',
        r'\b(forest|city|beach|desert|space|underwater|mountains|countryside|urban|rural)\b',
    ],
    SegmentCategory.MODIFIER: [
        r'\b(very|extremely|slightly|somewhat|more|less|most|least|quite|rather|fairly|pretty|highly)\b',
        r'\b(bright|dark|light|heavy|soft|hard|smooth|rough|large|small|big|tiny|huge|massive|colorful|vibrant|muted|pastel)\b',
        r'\b(with|without|using|featuring|including|containing|showing|displaying)\b',
    ],
}


def classify_segment(text: str) -> Tuple[SegmentCategory, float]:
    """
    Classify a text segment into a category using pattern matching.
    Returns the category and confidence score.
    """
    text_lower = text.lower()
    scores = {cat: 0 for cat in SegmentCategory}
    
    for category, patterns in CATEGORY_PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text_lower, re.IGNORECASE)
            scores[category] += len(matches)
    
    # Find the category with the highest score
    max_score = max(scores.values())
    if max_score == 0:
        return SegmentCategory.UNKNOWN, 0.5
    
    best_category = max(scores, key=scores.get)
    
    # Calculate confidence based on match strength
    total_words = len(text.split())
    confidence = min(0.95, 0.5 + (max_score / max(total_words, 1)) * 0.5)
    
    return best_category, confidence


def calculate_importance(segment: str, full_prompt: str, category: SegmentCategory) -> float:
    """
    Calculate the importance of a segment based on various factors.
    """
    # Base importance by category
    category_weights = {
        SegmentCategory.SUBJECT: 0.9,
        SegmentCategory.ACTION: 0.8,
        SegmentCategory.STYLE: 0.7,
        SegmentCategory.CONTEXT: 0.6,
        SegmentCategory.MODIFIER: 0.5,
        SegmentCategory.UNKNOWN: 0.4,
    }
    
    base_importance = category_weights.get(category, 0.5)
    
    # Adjust based on position (earlier segments tend to be more important)
    position_in_prompt = full_prompt.find(segment)
    position_ratio = 1 - (position_in_prompt / max(len(full_prompt), 1))
    position_boost = position_ratio * 0.2
    
    # Adjust based on length (longer segments may carry more meaning)
    length_ratio = len(segment) / max(len(full_prompt), 1)
    length_boost = min(length_ratio * 0.3, 0.15)
    
    # Final importance
    importance = min(1.0, base_importance + position_boost + length_boost)
    
    return round(importance, 3)


def segment_prompt(prompt: str) -> List[PromptSegment]:
    """
    Segment a prompt into meaningful parts using NLP techniques.
    Uses comma separation, natural phrase boundaries, and grammatical patterns.
    """
    segments = []
    
    # First, split by major punctuation
    primary_splits = re.split(r'([,;:]|\s+and\s+|\s+with\s+|\s+in\s+|\s+on\s+|\s+at\s+)', prompt)
    
    current_pos = 0
    raw_segments = []
    
    i = 0
    while i < len(primary_splits):
        part = primary_splits[i]
        if not part.strip():
            current_pos += len(part)
            i += 1
            continue
            
        # Check if this is a delimiter that should be attached to the next segment
        if part.strip() in [',', ';', ':'] or part.strip().startswith('and') or part.strip().startswith('with') or part.strip().startswith('in') or part.strip().startswith('on') or part.strip().startswith('at'):
            if i + 1 < len(primary_splits) and primary_splits[i + 1].strip():
                # Attach delimiter to the next segment
                combined = part + primary_splits[i + 1]
                start = prompt.find(combined.strip(), current_pos)
                if start == -1:
                    start = current_pos
                raw_segments.append((combined.strip(), start))
                current_pos = start + len(combined)
                i += 2
                continue
        
        # Regular segment
        text = part.strip()
        if text:
            start = prompt.find(text, current_pos)
            if start == -1:
                start = current_pos
            raw_segments.append((text, start))
            current_pos = start + len(text)
        
        i += 1
    
    # If no segments found, treat the whole prompt as one segment
    if not raw_segments:
        raw_segments = [(prompt.strip(), 0)]
    
    # Process each raw segment
    for text, start in raw_segments:
        if not text:
            continue
            
        # Clean up the text
        text = text.strip(' ,;:')
        if not text:
            continue
            
        # Find the actual start position
        actual_start = prompt.find(text, max(0, start - 5))
        if actual_start == -1:
            actual_start = start
            
        # Classify and create segment
        category, confidence = classify_segment(text)
        importance = calculate_importance(text, prompt, category)
        
        segment = PromptSegment(
            id=str(uuid.uuid4()),
            text=text,
            start=actual_start,
            end=actual_start + len(text),
            category=category,
            confidence=confidence,
            importance=importance
        )
        segments.append(segment)
    
    # Merge very small segments with neighbors
    merged_segments = merge_small_segments(segments, min_length=3)
    
    # Sort by start position
    merged_segments.sort(key=lambda s: s.start)
    
    return merged_segments


def merge_small_segments(segments: List[PromptSegment], min_length: int = 3) -> List[PromptSegment]:
    """
    Merge segments that are too small to be meaningful.
    """
    if len(segments) <= 1:
        return segments
    
    result = []
    i = 0
    
    while i < len(segments):
        current = segments[i]
        
        # If segment is too small and there's a next segment, merge
        if len(current.text.split()) < min_length and i + 1 < len(segments):
            next_seg = segments[i + 1]
            merged_text = f"{current.text} {next_seg.text}".strip()
            category, confidence = classify_segment(merged_text)
            
            merged = PromptSegment(
                id=str(uuid.uuid4()),
                text=merged_text,
                start=current.start,
                end=next_seg.end,
                category=category,
                confidence=confidence,
                importance=max(current.importance, next_seg.importance)
            )
            result.append(merged)
            i += 2
        else:
            result.append(current)
            i += 1
    
    return result


def get_segment_by_id(segments: List[PromptSegment], segment_id: str) -> PromptSegment | None:
    """Get a segment by its ID."""
    for seg in segments:
        if seg.id == segment_id:
            return seg
    return None
