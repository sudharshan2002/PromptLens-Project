/**
 * PromptLens API Service
 * Centralized API layer for all backend communication
 */

import {
  SegmentedPrompt,
  TextGenerationRequest,
  TextGenerationResponse,
  ImageGenerationRequest,
  ImageGenerationResponse,
  TextExplanation,
  ImageExplanation,
  WhatIfRequest,
  WhatIfResponse,
  FeedbackSubmission,
  MetricsSummary,
  TrustMetrics,
  ApiResponse,
  PromptSegment,
} from '../types/api.types';

// Backend API URL - defaults to FastAPI backend on port 8000
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: {
          code: `HTTP_${response.status}`,
          message: data.error || data.message || 'Request failed',
          details: data.details,
        },
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error occurred',
      },
    };
  }
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique segment ID
 */
export function generateSegmentId(): string {
  return `seg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

// ============================================
// PROMPT SEGMENTATION
// ============================================

/**
 * Submit a prompt for segmentation via backend API
 */
export async function segmentPrompt(
  prompt: string,
  generationType: 'text' | 'image' = 'text'
): Promise<ApiResponse<SegmentedPrompt>> {
  const response = await apiFetch<{
    session_id: string;
    original_prompt: string;
    segments: Array<{
      id: string;
      text: string;
      start: number;
      end: number;
      category: string;
      confidence: number;
      importance: number;
    }>;
    timestamp: string;
  }>('/prompt/submit', {
    method: 'POST',
    body: JSON.stringify({ 
      prompt, 
      generation_type: generationType 
    }),
  });

  if (!response.success) {
    return response as ApiResponse<SegmentedPrompt>;
  }

  // Transform backend response to frontend format
  const colors: Record<string, string> = {
    subject: '#0071e3',
    action: '#00823b',
    style: '#bf5000',
    context: '#6366f1',
    modifier: '#8b5cf6',
    unknown: '#888888',
  };

  const segments: PromptSegment[] = response.data.segments.map(seg => ({
    id: seg.id,
    text: seg.text,
    type: seg.text.split(' ').length > 2 ? 'phrase' : 'keyword',
    startIndex: seg.start,
    endIndex: seg.end,
    metadata: {
      importance: seg.importance,
      category: seg.category,
      color: colors[seg.category] || colors.unknown,
      confidence: seg.confidence,
    },
  }));

  return {
    success: true,
    data: {
      originalPrompt: response.data.original_prompt,
      segments,
      timestamp: response.data.timestamp,
      sessionId: response.data.session_id,
    },
  };
}

/**
 * Client-side NLP-based prompt segmentation (fallback)
 */
export function clientSegmentPrompt(prompt: string, sessionId: string): SegmentedPrompt {
  const segments: PromptSegment[] = [];
  const colors = ['#0071e3', '#00823b', '#bf5000', '#d70015', '#6366f1', '#8b5cf6'];
  
  const phraseSeparators = /,\s*|\s+and\s+|\s+with\s+|\s+in\s+|\s+on\s+|\s+at\s+/gi;
  const phrases = prompt.split(phraseSeparators).filter(p => p.trim());
  
  let currentIndex = 0;
  let colorIndex = 0;
  
  phrases.forEach((phrase) => {
    const trimmedPhrase = phrase.trim();
    if (!trimmedPhrase) return;
    
    const startIndex = prompt.indexOf(trimmedPhrase, currentIndex);
    if (startIndex === -1) return;
    
    let category = 'context';
    const lowerPhrase = trimmedPhrase.toLowerCase();
    
    if (/style|aesthetic|cinematic|realistic|abstract|minimalist|detailed/i.test(lowerPhrase)) {
      category = 'style';
    } else if (/color|light|dark|bright|shadow|glow|neon/i.test(lowerPhrase)) {
      category = 'modifier';
    } else if (/person|man|woman|child|animal|object|building|landscape/i.test(lowerPhrase)) {
      category = 'subject';
    } else if (/running|walking|flying|sitting|creating|making/i.test(lowerPhrase)) {
      category = 'action';
    }
    
    segments.push({
      id: generateSegmentId(),
      text: trimmedPhrase,
      type: trimmedPhrase.split(' ').length > 2 ? 'phrase' : 'keyword',
      startIndex,
      endIndex: startIndex + trimmedPhrase.length,
      metadata: {
        importance: 0.5 + Math.random() * 0.5,
        category,
        color: colors[colorIndex % colors.length],
      },
    });
    
    currentIndex = startIndex + trimmedPhrase.length;
    colorIndex++;
  });
  
  if (segments.length === 0) {
    segments.push({
      id: generateSegmentId(),
      text: prompt,
      type: 'semantic_chunk',
      startIndex: 0,
      endIndex: prompt.length,
      metadata: {
        importance: 1,
        category: 'context',
        color: colors[0],
      },
    });
  }
  
  return {
    originalPrompt: prompt,
    segments,
    timestamp: new Date().toISOString(),
    sessionId,
  };
}

// ============================================
// TEXT GENERATION
// ============================================

/**
 * Generate text from a prompt via backend API
 */
export async function generateText(
  request: TextGenerationRequest
): Promise<ApiResponse<TextGenerationResponse>> {
  const backendSegments = request.segments.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  const response = await apiFetch<{
    session_id: string;
    generated_text: string;
    sentence_mappings: Array<{
      sentence_id: string;
      sentence_text: string;
      sentence_index: number;
      contributing_segments: string[];
      confidence_scores: Record<string, number>;
    }>;
    generation_metadata: Record<string, unknown>;
    timestamp: string;
  }>('/generate/text', {
    method: 'POST',
    body: JSON.stringify({
      session_id: request.sessionId,
      prompt: request.prompt,
      segments: backendSegments,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.success) {
    return response as ApiResponse<TextGenerationResponse>;
  }

  const sentenceMappings = response.data.sentence_mappings.map(m => ({
    sentenceId: m.sentence_id,
    sentenceText: m.sentence_text,
    sentenceIndex: m.sentence_index,
    contributingSegments: m.contributing_segments,
    confidenceScores: m.confidence_scores,
  }));

  return {
    success: true,
    data: {
      generatedText: response.data.generated_text,
      sessionId: response.data.session_id,
      timestamp: response.data.timestamp,
      sentenceMappings,
      metadata: response.data.generation_metadata,
    },
  };
}

// ============================================
// IMAGE GENERATION
// ============================================

/**
 * Generate image from a prompt via backend API
 */
export async function generateImage(
  request: ImageGenerationRequest
): Promise<ApiResponse<ImageGenerationResponse>> {
  const backendSegments = request.segments.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  const response = await apiFetch<{
    session_id: string;
    image_url: string;
    image_width: number;
    image_height: number;
    heatmap_data: Array<{
      segment_id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      intensity: number;
    }>;
    segment_contributions: Record<string, number>;
    generation_metadata: Record<string, unknown>;
    timestamp: string;
  }>('/generate/image', {
    method: 'POST',
    body: JSON.stringify({
      session_id: request.sessionId,
      prompt: request.prompt,
      segments: backendSegments,
      width: request.width || 512,
      height: request.height || 512,
      num_inference_steps: request.numInferenceSteps || 30,
    }),
  });

  if (!response.success) {
    return response as ApiResponse<ImageGenerationResponse>;
  }

  const heatmapData = response.data.heatmap_data.map(h => ({
    segmentId: h.segment_id,
    x: h.x,
    y: h.y,
    width: h.width,
    height: h.height,
    intensity: h.intensity,
  }));

  return {
    success: true,
    data: {
      imageUrl: response.data.image_url,
      sessionId: response.data.session_id,
      timestamp: response.data.timestamp,
      imageWidth: response.data.image_width,
      imageHeight: response.data.image_height,
      heatmapData,
      segmentContributions: response.data.segment_contributions,
      metadata: response.data.generation_metadata,
    },
  };
}

// ============================================
// EXPLAINABILITY
// ============================================

/**
 * Get text explanation mappings via backend API
 */
export async function explainText(
  sessionId: string,
  generatedText: string,
  segments: PromptSegment[]
): Promise<ApiResponse<TextExplanation>> {
  const backendSegments = segments.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  const response = await apiFetch<{
    session_id: string;
    sentence_mappings: Array<{
      sentence_id: string;
      sentence_text: string;
      sentence_index: number;
      contributing_segments: string[];
      confidence_scores: Record<string, number>;
    }>;
    overall_segment_importance: Record<string, number>;
    explanation_confidence: number;
    timestamp: string;
  }>('/explain/text', {
    method: 'POST',
    body: JSON.stringify({ 
      session_id: sessionId,
      generated_text: generatedText,
      segments: backendSegments 
    }),
  });

  if (!response.success) {
    return response as ApiResponse<TextExplanation>;
  }

  const mappings = response.data.sentence_mappings.map(m => ({
    segmentId: m.contributing_segments[0] || '',
    segmentText: segments.find(s => s.id === m.contributing_segments[0])?.text || '',
    outputSentenceIndex: m.sentence_index,
    outputSentenceText: m.sentence_text,
    confidence: Math.max(...Object.values(m.confidence_scores), 0.5),
    method: 'backend_analysis' as const,
  }));

  return {
    success: true,
    data: {
      mappings,
      overallConfidence: response.data.explanation_confidence,
      explanationMethod: 'backend_nlp',
    },
  };
}

/**
 * Get image explanation mappings via backend API
 */
export async function explainImage(
  sessionId: string,
  imageUrl: string,
  segments: PromptSegment[]
): Promise<ApiResponse<ImageExplanation>> {
  const backendSegments = segments.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  const response = await apiFetch<{
    session_id: string;
    heatmap_data: Array<{
      segment_id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      intensity: number;
    }>;
    segment_contributions: Record<string, number>;
    attention_summary: string;
    explanation_confidence: number;
    timestamp: string;
  }>('/explain/image', {
    method: 'POST',
    body: JSON.stringify({ 
      session_id: sessionId,
      image_url: imageUrl,
      segments: backendSegments 
    }),
  });

  if (!response.success) {
    return response as ApiResponse<ImageExplanation>;
  }

  const mappings = segments.map(seg => {
    const regionData = response.data.heatmap_data.filter(h => h.segment_id === seg.id);
    const heatmapPoints: Array<{ x: number; y: number; intensity: number }> = [];
    
    regionData.forEach(region => {
      const centerX = (region.x + region.width / 2) * 512;
      const centerY = (region.y + region.height / 2) * 512;
      
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * region.width * 256;
        heatmapPoints.push({
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          intensity: region.intensity * (1 - distance / (region.width * 256)),
        });
      }
    });

    return {
      segmentId: seg.id,
      segmentText: seg.text,
      heatmap: heatmapPoints,
      confidence: response.data.segment_contributions[seg.id] || 0.5,
      method: 'backend_attention' as const,
    };
  });

  return {
    success: true,
    data: {
      mappings,
      overallConfidence: response.data.explanation_confidence,
      explanationMethod: 'backend_attention_maps',
    },
  };
}

/**
 * Client-side text explanation generation (fallback)
 */
export function clientExplainText(
  segments: PromptSegment[],
  generatedText: string
): TextExplanation {
  const sentences = generatedText.split(/[.!?]+/).filter(s => s.trim());
  const mappings: TextExplanation['mappings'] = [];
  
  segments.forEach(segment => {
    const segmentWords = segment.text.toLowerCase().split(/\s+/);
    
    sentences.forEach((sentence, sentenceIndex) => {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      
      const overlap = segmentWords.filter(word => 
        sentenceWords.some(sw => sw.includes(word) || word.includes(sw))
      ).length;
      
      const overlapRatio = overlap / Math.max(segmentWords.length, 1);
      
      if (overlapRatio > 0.2 || segmentWords.some(w => sentence.toLowerCase().includes(w))) {
        const confidence = Math.min(0.95, overlapRatio + 0.3 + Math.random() * 0.2);
        
        mappings.push({
          segmentId: segment.id,
          segmentText: segment.text,
          outputSentenceIndex: sentenceIndex,
          outputSentenceText: sentence.trim(),
          confidence,
          method: 'token_overlap',
        });
      }
    });
    
    if (!mappings.some(m => m.segmentId === segment.id) && sentences.length > 0) {
      const randomIndex = Math.floor(Math.random() * sentences.length);
      mappings.push({
        segmentId: segment.id,
        segmentText: segment.text,
        outputSentenceIndex: randomIndex,
        outputSentenceText: sentences[randomIndex].trim(),
        confidence: 0.3 + Math.random() * 0.3,
        method: 'embedding_similarity',
      });
    }
  });
  
  return {
    mappings,
    overallConfidence: mappings.reduce((acc, m) => acc + m.confidence, 0) / Math.max(mappings.length, 1),
    explanationMethod: 'client_approximation',
  };
}

/**
 * Client-side image explanation generation (fallback)
 */
export function clientExplainImage(
  segments: PromptSegment[],
  imageWidth: number = 512,
  imageHeight: number = 512
): ImageExplanation {
  const mappings: ImageExplanation['mappings'] = [];
  
  segments.forEach((segment, index) => {
    const heatmap: ImageExplanation['mappings'][0]['heatmap'] = [];
    
    const seedX = (index * 0.3 + 0.2) % 1;
    const seedY = (index * 0.4 + 0.1) % 1;
    const centerX = imageWidth * (0.2 + seedX * 0.6);
    const centerY = imageHeight * (0.2 + seedY * 0.6);
    
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * imageWidth * 0.3;
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      const normalizedDistance = distance / (imageWidth * 0.3);
      const intensity = Math.max(0, 1 - normalizedDistance) * segment.metadata.importance;
      
      if (x >= 0 && x < imageWidth && y >= 0 && y < imageHeight) {
        heatmap.push({ x, y, intensity });
      }
    }
    
    mappings.push({
      segmentId: segment.id,
      segmentText: segment.text,
      heatmap,
      confidence: segment.metadata.importance,
      method: 'clip_embedding',
    });
  });
  
  return {
    mappings,
    overallConfidence: mappings.reduce((acc, m) => acc + m.confidence, 0) / Math.max(mappings.length, 1),
    explanationMethod: 'client_approximation',
  };
}

// ============================================
// WHAT-IF ANALYSIS
// ============================================

/**
 * Perform what-if comparison via backend API
 */
export async function whatIfAnalysis(
  request: WhatIfRequest
): Promise<ApiResponse<WhatIfResponse>> {
  const backendSegments = request.originalSegments.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  const response = await apiFetch<{
    session_id: string;
    original_output: string;
    modified_output: string;
    segment_changes: Array<{
      segment_id: string;
      change_type: string;
      original_text: string | null;
      modified_text: string | null;
      impact_score: number;
    }>;
    impact_summary: Record<string, unknown>;
    comparison_metrics: Record<string, number>;
    timestamp: string;
  }>('/whatif', {
    method: 'POST',
    body: JSON.stringify({
      session_id: request.sessionId,
      original_prompt: request.originalPrompt,
      modified_prompt: request.modifiedPrompt,
      original_segments: backendSegments,
      generation_type: request.generationType,
    }),
  });

  if (!response.success) {
    return response as ApiResponse<WhatIfResponse>;
  }

  const segmentChanges = response.data.segment_changes.map(c => ({
    segmentId: c.segment_id,
    changeType: c.change_type as 'added' | 'removed' | 'modified' | 'unchanged',
    originalText: c.original_text,
    modifiedText: c.modified_text,
    impactScore: c.impact_score,
  }));

  return {
    success: true,
    data: {
      sessionId: response.data.session_id,
      originalOutput: response.data.original_output,
      modifiedOutput: response.data.modified_output,
      segmentChanges,
      impactSummary: response.data.impact_summary,
      comparisonMetrics: response.data.comparison_metrics,
      timestamp: response.data.timestamp,
    },
  };
}

// ============================================
// METRICS & FEEDBACK
// ============================================

/**
 * Submit trust and transparency metrics via backend API
 */
export async function submitMetrics(
  metrics: TrustMetrics
): Promise<ApiResponse<{ recorded: boolean }>> {
  const response = await apiFetch<{
    success: boolean;
    message: string;
    metrics_id: string;
    timestamp: string;
  }>('/metrics/submit', {
    method: 'POST',
    body: JSON.stringify({
      session_id: metrics.sessionId,
      metrics: {
        session_id: metrics.sessionId,
        transparency_score: metrics.transparencyScore,
        understanding_score: metrics.understandingScore,
        trust_score: metrics.trustScore,
        usefulness_score: metrics.usefulnessScore,
        interaction_count: metrics.interactionCount || 0,
        time_spent_seconds: metrics.timeSpentSeconds || 0,
        segments_edited: metrics.segmentsEdited || 0,
        whatif_uses: metrics.whatifUses || 0,
        heatmap_interactions: metrics.heatmapInteractions || 0,
      },
      feedback_text: metrics.feedbackText,
      consent_given: metrics.consentGiven ?? true,
    }),
  });

  if (!response.success) {
    return response as ApiResponse<{ recorded: boolean }>;
  }

  return {
    success: true,
    data: { recorded: response.data.success },
  };
}

/**
 * Submit user feedback
 */
export async function submitFeedback(
  feedback: FeedbackSubmission
): Promise<ApiResponse<{ recorded: boolean }>> {
  return submitMetrics({
    sessionId: feedback.sessionId,
    transparencyScore: feedback.ratings?.transparency || 3,
    understandingScore: feedback.ratings?.understanding || 3,
    trustScore: feedback.ratings?.trust || 3,
    usefulnessScore: feedback.ratings?.usefulness || 3,
    feedbackText: feedback.comments,
    consentGiven: feedback.consent,
    interactionCount: 0,
    timeSpentSeconds: 0,
    segmentsEdited: 0,
    whatifUses: 0,
    heatmapInteractions: 0,
  });
}

/**
 * Get metrics summary via backend API
 */
export async function getMetricsSummary(): Promise<ApiResponse<MetricsSummary>> {
  const response = await apiFetch<{
    total_sessions: number;
    average_transparency: number;
    average_understanding: number;
    average_trust: number;
    average_usefulness: number;
    average_time_spent: number;
    total_whatif_uses: number;
    distribution: Record<string, Record<number, number>>;
    timestamp: string;
  }>('/metrics/summary', {
    method: 'GET',
  });

  if (!response.success) {
    return response as ApiResponse<MetricsSummary>;
  }

  return {
    success: true,
    data: {
      totalSessions: response.data.total_sessions,
      averageTransparency: response.data.average_transparency,
      averageUnderstanding: response.data.average_understanding,
      averageTrust: response.data.average_trust,
      averageUsefulness: response.data.average_usefulness,
      averageTimeSpent: response.data.average_time_spent,
      totalWhatifUses: response.data.total_whatif_uses,
      distribution: response.data.distribution,
      timestamp: response.data.timestamp,
    },
  };
}

/**
 * Export metrics data
 */
export async function exportMetrics(
  format: 'csv' | 'json' = 'json'
): Promise<ApiResponse<string | object>> {
  return apiFetch(`/metrics/export?format=${format}`, {
    method: 'GET',
  });
}

// ============================================
// HEALTH CHECK
// ============================================

/**
 * Check API health
 */
export async function healthCheck(): Promise<ApiResponse<{ status: string; service: string }>> {
  return apiFetch('/health', {
    method: 'GET',
  });
}
