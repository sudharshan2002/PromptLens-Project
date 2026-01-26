"""
PromptLens Backend - Text Generation Service
Handles text generation using OpenAI API
"""

import os
import re
import uuid
from datetime import datetime
from typing import List, Dict, Any
from openai import AsyncOpenAI
from models import (
    PromptSegment, 
    TextGenerateRequest, 
    TextGenerateResponse,
    SentenceMapping,
    TextExplainRequest,
    TextExplainResponse
)


# Initialize OpenAI client
def get_openai_client() -> AsyncOpenAI:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or api_key == "your_openai_api_key_here":
        raise ValueError("OpenAI API key not configured. Please set OPENAI_API_KEY in .env")
    return AsyncOpenAI(api_key=api_key)


async def generate_text(request: TextGenerateRequest) -> TextGenerateResponse:
    """
    Generate text using OpenAI API and create sentence-to-segment mappings.
    """
    client = get_openai_client()
    model = os.getenv("TEXT_MODEL", "gpt-4o-mini")
    
    # System prompt to guide generation
    system_prompt = """You are a creative AI assistant. Generate detailed, engaging content based on the user's prompt. 
Your response should be well-structured with clear sentences that relate to different aspects of the input prompt."""
    
    # Call OpenAI API
    response = await client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.prompt}
        ],
        max_tokens=request.max_tokens,
        temperature=request.temperature
    )
    
    generated_text = response.choices[0].message.content or ""
    
    # Create sentence mappings
    sentence_mappings = create_sentence_mappings(generated_text, request.segments)
    
    return TextGenerateResponse(
        session_id=request.session_id,
        generated_text=generated_text,
        sentence_mappings=sentence_mappings,
        generation_metadata={
            "model": model,
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        },
        timestamp=datetime.utcnow().isoformat()
    )


def create_sentence_mappings(
    generated_text: str, 
    segments: List[PromptSegment]
) -> List[SentenceMapping]:
    """
    Create mappings between generated sentences and input segments.
    Uses keyword overlap and semantic similarity approximation.
    """
    # Split into sentences
    sentences = split_into_sentences(generated_text)
    
    mappings = []
    
    for idx, sentence in enumerate(sentences):
        if not sentence.strip():
            continue
            
        # Calculate relevance of each segment to this sentence
        segment_scores = {}
        
        for segment in segments:
            score = calculate_segment_sentence_relevance(segment, sentence)
            if score > 0.1:  # Only include segments with meaningful relevance
                segment_scores[segment.id] = score
        
        # Normalize scores
        total_score = sum(segment_scores.values()) or 1
        normalized_scores = {
            seg_id: round(score / total_score, 3) 
            for seg_id, score in segment_scores.items()
        }
        
        # Get contributing segments (those with significant scores)
        contributing = [
            seg_id for seg_id, score in normalized_scores.items() 
            if score >= 0.1
        ]
        
        # If no strong contributors, assign to the most relevant segment
        if not contributing and segments:
            best_segment = max(segments, key=lambda s: segment_scores.get(s.id, 0))
            contributing = [best_segment.id]
            normalized_scores = {best_segment.id: 1.0}
        
        mapping = SentenceMapping(
            sentence_id=str(uuid.uuid4()),
            sentence_text=sentence,
            sentence_index=idx,
            contributing_segments=contributing,
            confidence_scores=normalized_scores
        )
        mappings.append(mapping)
    
    return mappings


def split_into_sentences(text: str) -> List[str]:
    """
    Split text into sentences using regex patterns.
    """
    # Handle common sentence endings
    sentence_pattern = r'(?<=[.!?])\s+'
    sentences = re.split(sentence_pattern, text)
    
    # Clean up and filter
    cleaned = []
    for s in sentences:
        s = s.strip()
        if s:
            cleaned.append(s)
    
    return cleaned


def calculate_segment_sentence_relevance(
    segment: PromptSegment, 
    sentence: str
) -> float:
    """
    Calculate how relevant a segment is to a generated sentence.
    Uses multiple heuristics:
    1. Keyword overlap
    2. Semantic category matching
    3. Word embedding similarity (simplified)
    """
    segment_words = set(segment.text.lower().split())
    sentence_words = set(sentence.lower().split())
    
    # Remove common stopwords
    stopwords = {'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 
                 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                 'would', 'could', 'should', 'may', 'might', 'can', 'in', 
                 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
                 'and', 'or', 'but', 'if', 'then', 'else', 'when', 'where',
                 'this', 'that', 'these', 'those', 'it', 'its'}
    
    segment_words = segment_words - stopwords
    sentence_words = sentence_words - stopwords
    
    if not segment_words or not sentence_words:
        return 0.1  # Minimal relevance
    
    # Direct keyword overlap
    overlap = segment_words & sentence_words
    overlap_score = len(overlap) / len(segment_words) if segment_words else 0
    
    # Partial match score (for stemmed/related words)
    partial_score = 0
    for seg_word in segment_words:
        for sent_word in sentence_words:
            if seg_word in sent_word or sent_word in seg_word:
                partial_score += 0.5
            elif seg_word[:4] == sent_word[:4] and len(seg_word) > 3:  # Simple stemming
                partial_score += 0.3
    partial_score = min(partial_score / len(segment_words), 0.5) if segment_words else 0
    
    # Category-based boosting
    category_boost = segment.importance * 0.2
    
    # Final score
    total_score = overlap_score * 0.5 + partial_score * 0.3 + category_boost
    
    return min(total_score, 1.0)


async def explain_text(request: TextExplainRequest) -> TextExplainResponse:
    """
    Provide detailed explanation of text generation.
    """
    # Create sentence mappings
    sentence_mappings = create_sentence_mappings(
        request.generated_text, 
        request.segments
    )
    
    # Calculate overall segment importance
    overall_importance = {}
    for segment in request.segments:
        # Count how many sentences this segment contributes to
        contribution_count = 0
        total_confidence = 0
        
        for mapping in sentence_mappings:
            if segment.id in mapping.contributing_segments:
                contribution_count += 1
                total_confidence += mapping.confidence_scores.get(segment.id, 0)
        
        if contribution_count > 0:
            avg_confidence = total_confidence / contribution_count
            coverage = contribution_count / len(sentence_mappings) if sentence_mappings else 0
            overall_importance[segment.id] = round(
                avg_confidence * 0.6 + coverage * 0.4, 3
            )
        else:
            overall_importance[segment.id] = 0.0
    
    # Normalize importance scores
    max_importance = max(overall_importance.values()) if overall_importance else 1
    if max_importance > 0:
        overall_importance = {
            k: round(v / max_importance, 3) 
            for k, v in overall_importance.items()
        }
    
    # Calculate overall confidence
    avg_confidence = sum(
        max(m.confidence_scores.values()) if m.confidence_scores else 0
        for m in sentence_mappings
    ) / len(sentence_mappings) if sentence_mappings else 0.5
    
    return TextExplainResponse(
        session_id=request.session_id,
        sentence_mappings=sentence_mappings,
        overall_segment_importance=overall_importance,
        explanation_confidence=round(avg_confidence, 3),
        timestamp=datetime.utcnow().isoformat()
    )


# Mock response for when API key is not configured
async def generate_text_mock(request: TextGenerateRequest) -> TextGenerateResponse:
    """
    Generate mock text response for testing without API key.
    """
    mock_text = f"""Based on your prompt about {request.segments[0].text if request.segments else 'the topic'}, here is a generated response.

The first aspect to consider is the main subject. This relates directly to what you specified in your input.

Additionally, the context and style you requested have been incorporated. The result aims to match your expectations while maintaining coherence.

Finally, the modifiers and additional details help refine the output. This creates a more complete and nuanced result that addresses all parts of your prompt."""

    sentence_mappings = create_sentence_mappings(mock_text, request.segments)
    
    return TextGenerateResponse(
        session_id=request.session_id,
        generated_text=mock_text,
        sentence_mappings=sentence_mappings,
        generation_metadata={
            "model": "mock",
            "temperature": request.temperature,
            "max_tokens": request.max_tokens,
            "mock": True
        },
        timestamp=datetime.utcnow().isoformat()
    )
