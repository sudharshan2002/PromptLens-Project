"""
PromptLens Backend - Image Generation Service
Handles image generation using Replicate API (Stable Diffusion)
"""

import os
import re
import uuid
import base64
import httpx
import random
from datetime import datetime
from typing import List, Dict, Optional
from models import (
    PromptSegment,
    ImageGenerateRequest,
    ImageGenerateResponse,
    ImageExplainRequest,
    ImageExplainResponse,
    HeatmapRegion,
    SegmentCategory
)


async def generate_image(request: ImageGenerateRequest) -> ImageGenerateResponse:
    """
    Generate image using Replicate API (Stable Diffusion) and create heatmap data.
    """
    api_token = os.getenv("REPLICATE_API_TOKEN")
    
    if not api_token or api_token == "your_replicate_api_token_here":
        # Use mock generation if no API key
        return await generate_image_mock(request)
    
    model = os.getenv("IMAGE_MODEL", "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Start prediction
        response = await client.post(
            "https://api.replicate.com/v1/predictions",
            headers={
                "Authorization": f"Token {api_token}",
                "Content-Type": "application/json"
            },
            json={
                "version": model.split(":")[-1] if ":" in model else model,
                "input": {
                    "prompt": request.prompt,
                    "width": request.width,
                    "height": request.height,
                    "num_inference_steps": request.num_inference_steps,
                }
            }
        )
        
        if response.status_code != 201:
            raise Exception(f"Failed to start image generation: {response.text}")
        
        prediction = response.json()
        prediction_id = prediction["id"]
        
        # Poll for completion
        while True:
            status_response = await client.get(
                f"https://api.replicate.com/v1/predictions/{prediction_id}",
                headers={"Authorization": f"Token {api_token}"}
            )
            
            status_data = status_response.json()
            
            if status_data["status"] == "succeeded":
                image_url = status_data["output"][0] if status_data["output"] else ""
                break
            elif status_data["status"] == "failed":
                raise Exception(f"Image generation failed: {status_data.get('error', 'Unknown error')}")
            
            # Wait before polling again
            import asyncio
            await asyncio.sleep(1)
    
    # Generate heatmap data based on segments
    heatmap_data = generate_heatmap_regions(request.segments, request.width, request.height)
    
    # Calculate segment contributions
    segment_contributions = calculate_segment_contributions(request.segments)
    
    return ImageGenerateResponse(
        session_id=request.session_id,
        image_url=image_url,
        image_width=request.width,
        image_height=request.height,
        heatmap_data=heatmap_data,
        segment_contributions=segment_contributions,
        generation_metadata={
            "model": model,
            "inference_steps": request.num_inference_steps,
            "prediction_id": prediction_id
        },
        timestamp=datetime.utcnow().isoformat()
    )


def generate_heatmap_regions(
    segments: List[PromptSegment], 
    width: int, 
    height: int
) -> List[HeatmapRegion]:
    """
    Generate synthetic heatmap regions based on segment categories and importance.
    In a production system, this would use attention maps from the diffusion model.
    """
    regions = []
    
    # Category-based position tendencies
    position_tendencies = {
        SegmentCategory.SUBJECT: {"x": 0.5, "y": 0.5, "spread": 0.3},  # Center
        SegmentCategory.ACTION: {"x": 0.5, "y": 0.6, "spread": 0.25},  # Center-bottom
        SegmentCategory.STYLE: {"x": 0.5, "y": 0.5, "spread": 0.5},    # Full coverage
        SegmentCategory.CONTEXT: {"x": 0.5, "y": 0.3, "spread": 0.4},  # Background
        SegmentCategory.MODIFIER: {"x": 0.5, "y": 0.5, "spread": 0.35}, # General
        SegmentCategory.UNKNOWN: {"x": 0.5, "y": 0.5, "spread": 0.3},
    }
    
    for segment in segments:
        tendency = position_tendencies.get(segment.category, position_tendencies[SegmentCategory.UNKNOWN])
        
        # Generate region based on category tendency with some randomness
        spread = tendency["spread"]
        base_x = tendency["x"] + random.uniform(-0.1, 0.1)
        base_y = tendency["y"] + random.uniform(-0.1, 0.1)
        
        # Region size based on importance
        region_size = 0.2 + segment.importance * 0.3
        
        region = HeatmapRegion(
            segment_id=segment.id,
            x=max(0, min(1, base_x - region_size / 2)),
            y=max(0, min(1, base_y - region_size / 2)),
            width=min(1, region_size + random.uniform(0, 0.1)),
            height=min(1, region_size + random.uniform(0, 0.1)),
            intensity=segment.importance * segment.confidence
        )
        regions.append(region)
    
    return regions


def calculate_segment_contributions(segments: List[PromptSegment]) -> Dict[str, float]:
    """
    Calculate the contribution percentage of each segment to the image.
    """
    if not segments:
        return {}
    
    # Weight by importance and confidence
    total_weight = sum(s.importance * s.confidence for s in segments)
    
    if total_weight == 0:
        # Equal distribution
        equal_share = 1.0 / len(segments)
        return {s.id: equal_share for s in segments}
    
    contributions = {}
    for segment in segments:
        weight = segment.importance * segment.confidence
        contributions[segment.id] = round(weight / total_weight, 3)
    
    return contributions


async def explain_image(request: ImageExplainRequest) -> ImageExplainResponse:
    """
    Provide detailed explanation of image generation.
    """
    # Generate heatmap data
    heatmap_data = generate_heatmap_regions(request.segments, 512, 512)
    
    # Calculate contributions
    segment_contributions = calculate_segment_contributions(request.segments)
    
    # Generate attention summary
    attention_summary = generate_attention_summary(request.segments, segment_contributions)
    
    # Calculate overall confidence
    avg_confidence = sum(s.confidence for s in request.segments) / len(request.segments) if request.segments else 0.5
    
    return ImageExplainResponse(
        session_id=request.session_id,
        heatmap_data=heatmap_data,
        segment_contributions=segment_contributions,
        attention_summary=attention_summary,
        explanation_confidence=round(avg_confidence, 3),
        timestamp=datetime.utcnow().isoformat()
    )


def generate_attention_summary(
    segments: List[PromptSegment], 
    contributions: Dict[str, float]
) -> str:
    """
    Generate a human-readable summary of image attention.
    """
    if not segments:
        return "No segments provided for analysis."
    
    # Sort segments by contribution
    sorted_segments = sorted(
        segments, 
        key=lambda s: contributions.get(s.id, 0), 
        reverse=True
    )
    
    summary_parts = []
    
    # Describe top contributors
    top_segment = sorted_segments[0]
    summary_parts.append(
        f"The most influential part of your prompt is '{top_segment.text}' "
        f"(category: {top_segment.category.value}), contributing approximately "
        f"{contributions.get(top_segment.id, 0) * 100:.1f}% to the image."
    )
    
    # Describe other significant contributors
    for segment in sorted_segments[1:3]:
        contrib = contributions.get(segment.id, 0)
        if contrib > 0.1:
            summary_parts.append(
                f"'{segment.text}' also influences the result with a "
                f"{contrib * 100:.1f}% contribution."
            )
    
    return " ".join(summary_parts)


async def generate_image_mock(request: ImageGenerateRequest) -> ImageGenerateResponse:
    """
    Generate mock image response for testing without API key.
    Returns a placeholder image as base64.
    """
    # Create a simple gradient placeholder image
    from io import BytesIO
    
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create gradient image
        img = Image.new('RGB', (request.width, request.height), color='#1a1a2e')
        draw = ImageDraw.Draw(img)
        
        # Add gradient effect
        for y in range(request.height):
            r = int(26 + (y / request.height) * 30)
            g = int(26 + (y / request.height) * 20)
            b = int(46 + (y / request.height) * 40)
            draw.line([(0, y), (request.width, y)], fill=(r, g, b))
        
        # Add text
        try:
            font = ImageFont.truetype("arial.ttf", 20)
        except:
            font = ImageFont.load_default()
        
        text = "PromptLens Demo Image"
        text_bbox = draw.textbbox((0, 0), text, font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        x = (request.width - text_width) // 2
        y = (request.height - text_height) // 2
        draw.text((x, y), text, fill='white', font=font)
        
        # Add prompt preview
        prompt_preview = request.prompt[:50] + "..." if len(request.prompt) > 50 else request.prompt
        draw.text((10, request.height - 30), prompt_preview, fill='#888888', font=font)
        
        # Convert to base64
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        image_url = f"data:image/png;base64,{img_base64}"
        
    except ImportError:
        # If PIL not available, use a simple placeholder
        image_url = f"https://via.placeholder.com/{request.width}x{request.height}/1a1a2e/ffffff?text=PromptLens+Demo"
    
    # Generate heatmap data
    heatmap_data = generate_heatmap_regions(request.segments, request.width, request.height)
    
    # Calculate contributions
    segment_contributions = calculate_segment_contributions(request.segments)
    
    return ImageGenerateResponse(
        session_id=request.session_id,
        image_url=image_url,
        image_width=request.width,
        image_height=request.height,
        heatmap_data=heatmap_data,
        segment_contributions=segment_contributions,
        generation_metadata={
            "model": "mock",
            "mock": True
        },
        timestamp=datetime.utcnow().isoformat()
    )
