"""
PromptLens Backend - FastAPI Application
Main entry point for the Explainable Generative AI API
"""

import os
import uuid
from datetime import datetime
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import models
from models import (
    PromptSubmitRequest, PromptSubmitResponse,
    TextGenerateRequest, TextGenerateResponse,
    ImageGenerateRequest, ImageGenerateResponse,
    TextExplainRequest, TextExplainResponse,
    ImageExplainRequest, ImageExplainResponse,
    WhatIfRequest, WhatIfResponse,
    MetricsSubmitRequest, MetricsSubmitResponse,
    MetricsSummaryResponse, ErrorResponse
)

# Import services
from nlp_service import segment_prompt
from text_service import generate_text, generate_text_mock, explain_text
from image_service import generate_image, generate_image_mock, explain_image
from whatif_service import analyze_whatif
from metrics_service import submit_metrics, get_metrics_summary


# ============================================================
# APPLICATION SETUP
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    print("🚀 PromptLens Backend starting...")
    print(f"📍 CORS Origins: {os.getenv('CORS_ORIGINS', 'http://localhost:5173')}")
    
    # Check API keys
    openai_key = os.getenv("OPENAI_API_KEY", "")
    replicate_key = os.getenv("REPLICATE_API_TOKEN", "")
    
    if not openai_key or openai_key == "your_openai_api_key_here":
        print("⚠️  OpenAI API key not configured - text generation will use mock responses")
    else:
        print("✅ OpenAI API key configured")
    
    if not replicate_key or replicate_key == "your_replicate_api_token_here":
        print("⚠️  Replicate API token not configured - image generation will use mock responses")
    else:
        print("✅ Replicate API token configured")
    
    yield
    
    # Shutdown
    print("👋 PromptLens Backend shutting down...")


app = FastAPI(
    title="PromptLens API",
    description="Explainable Generative AI Interface - Backend API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ERROR HANDLING
# ============================================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "message": str(exc.detail),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_server_error",
            "message": str(exc),
            "timestamp": datetime.utcnow().isoformat()
        }
    )


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PromptLens Backend",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/", tags=["Health"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": "PromptLens API",
        "description": "Explainable Generative AI Interface",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


# ============================================================
# PROMPT ENDPOINTS
# ============================================================

@app.post("/prompt/submit", response_model=PromptSubmitResponse, tags=["Prompt"])
async def submit_prompt(request: PromptSubmitRequest):
    """
    Submit a prompt for segmentation.
    Returns the prompt broken into meaningful segments with NLP-derived metadata.
    """
    try:
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Segment the prompt using NLP
        segments = segment_prompt(request.prompt)
        
        return PromptSubmitResponse(
            session_id=session_id,
            original_prompt=request.prompt,
            segments=segments,
            timestamp=datetime.utcnow().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to segment prompt: {str(e)}")


# ============================================================
# TEXT GENERATION ENDPOINTS
# ============================================================

@app.post("/generate/text", response_model=TextGenerateResponse, tags=["Generation"])
async def generate_text_endpoint(request: TextGenerateRequest):
    """
    Generate text from a segmented prompt.
    Returns generated text with sentence-to-segment mappings.
    """
    try:
        # Check if we should use mock
        api_key = os.getenv("OPENAI_API_KEY", "")
        use_mock = not api_key or api_key == "your_openai_api_key_here"
        
        if use_mock:
            return await generate_text_mock(request)
        else:
            return await generate_text(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text generation failed: {str(e)}")


@app.post("/explain/text", response_model=TextExplainResponse, tags=["Explanation"])
async def explain_text_endpoint(request: TextExplainRequest):
    """
    Explain text generation by mapping sentences to input segments.
    """
    try:
        return await explain_text(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Text explanation failed: {str(e)}")


# ============================================================
# IMAGE GENERATION ENDPOINTS
# ============================================================

@app.post("/generate/image", response_model=ImageGenerateResponse, tags=["Generation"])
async def generate_image_endpoint(request: ImageGenerateRequest):
    """
    Generate an image from a segmented prompt.
    Returns image URL with heatmap data showing segment contributions.
    """
    try:
        # Check if we should use mock
        api_token = os.getenv("REPLICATE_API_TOKEN", "")
        use_mock = not api_token or api_token == "your_replicate_api_token_here"
        
        if use_mock:
            return await generate_image_mock(request)
        else:
            return await generate_image(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


@app.post("/explain/image", response_model=ImageExplainResponse, tags=["Explanation"])
async def explain_image_endpoint(request: ImageExplainRequest):
    """
    Explain image generation by providing attention heatmaps and segment contributions.
    """
    try:
        return await explain_image(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image explanation failed: {str(e)}")


# ============================================================
# WHAT-IF ANALYSIS ENDPOINT
# ============================================================

@app.post("/whatif", response_model=WhatIfResponse, tags=["What-If"])
async def whatif_analysis(request: WhatIfRequest):
    """
    Perform what-if analysis comparing original and modified prompts.
    Returns both outputs with detailed change analysis.
    """
    try:
        return await analyze_whatif(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"What-if analysis failed: {str(e)}")


# ============================================================
# METRICS ENDPOINTS
# ============================================================

@app.post("/metrics/submit", response_model=MetricsSubmitResponse, tags=["Metrics"])
async def submit_metrics_endpoint(request: MetricsSubmitRequest):
    """
    Submit user interaction and trust metrics.
    """
    try:
        return await submit_metrics(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics submission failed: {str(e)}")


@app.get("/metrics/summary", response_model=MetricsSummaryResponse, tags=["Metrics"])
async def get_metrics_summary_endpoint():
    """
    Get aggregated summary of collected metrics.
    """
    try:
        return await get_metrics_summary()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get metrics summary: {str(e)}")


@app.get("/metrics/export/csv", tags=["Metrics"])
async def export_metrics_csv():
    """
    Export all collected metrics as a CSV file for research analysis.
    Returns all trust, transparency, understanding, and usefulness scores.
    """
    from fastapi.responses import StreamingResponse
    import io
    import csv
    
    try:
        # Import the load function from metrics_service
        from metrics_service import load_all_metrics
        
        all_metrics = load_all_metrics()
        
        # Create CSV in memory
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            'metrics_id',
            'session_id', 
            'timestamp',
            'consent_given',
            'transparency_score',
            'understanding_score',
            'trust_score',
            'usefulness_score',
            'interaction_count',
            'time_spent_seconds',
            'segments_edited',
            'whatif_uses',
            'heatmap_interactions',
            'feedback_text'
        ])
        
        # Write data rows
        for entry in all_metrics:
            m = entry.get('metrics', {})
            writer.writerow([
                entry.get('metrics_id', ''),
                entry.get('session_id', ''),
                entry.get('timestamp', ''),
                entry.get('consent_given', False),
                m.get('transparency_score', ''),
                m.get('understanding_score', ''),
                m.get('trust_score', ''),
                m.get('usefulness_score', ''),
                m.get('interaction_count', 0),
                m.get('time_spent_seconds', 0),
                m.get('segments_edited', 0),
                m.get('whatif_uses', 0),
                m.get('heatmap_interactions', 0),
                entry.get('feedback_text', '')
            ])
        
        output.seek(0)
        
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=promptlens-metrics-export.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CSV export failed: {str(e)}")


# ============================================================
# LEGACY API COMPATIBILITY (Flask-style endpoints)
# ============================================================

@app.get("/api/health", tags=["Legacy"])
async def legacy_health():
    """Legacy health check for backward compatibility."""
    return {
        "status": "ok",
        "service": "PromptLens backend"
    }


@app.post("/api/ai/generate", tags=["Legacy"])
async def legacy_generate(request: Request):
    """Legacy generation endpoint for backward compatibility."""
    data = await request.json()
    prompt = data.get("prompt", "").strip()
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")
    
    # Use the new segmentation and generation pipeline
    segments = segment_prompt(prompt)
    
    text_request = TextGenerateRequest(
        session_id=str(uuid.uuid4()),
        prompt=prompt,
        segments=segments,
        max_tokens=1024,
        temperature=0.7
    )
    
    # Check if we should use mock
    api_key = os.getenv("OPENAI_API_KEY", "")
    use_mock = not api_key or api_key == "your_openai_api_key_here"
    
    if use_mock:
        response = await generate_text_mock(text_request)
    else:
        response = await generate_text(text_request)
    
    # Format as legacy response
    return {
        "choices": [
            {
                "index": 0,
                "text": response.generated_text,
                "analysis": {
                    "segments": [
                        {"type": s.category.value, "value": s.text}
                        for s in segments
                    ],
                    "explanations": [
                        {
                            "prompt_part": m.sentence_text[:50],
                            "effect": f"Influenced by: {', '.join(m.contributing_segments[:2])}"
                        }
                        for m in response.sentence_mappings[:3]
                    ]
                }
            }
        ]
    }


# ============================================================
# RUN SERVER
# ============================================================
if __name__ == "__main__":
    import uvicorn
    
    debug = os.getenv("DEBUG", "false").lower() == "true"
    port = int(os.getenv("PORT", 8000))
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=debug
    )

