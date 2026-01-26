/**
 * PromptLens API Types
 * Core TypeScript interfaces for the explainable AI system
 */

// ============================================
// PROMPT SEGMENTATION TYPES
// ============================================

export interface PromptSegment {
  id: string;
  text: string;
  type: 'keyword' | 'phrase' | 'semantic_chunk';
  startIndex: number;
  endIndex: number;
  metadata: {
    importance: number; // 0-1 score
    category?: string; // e.g., 'style', 'subject', 'context', 'modifier', 'action'
    color: string;
    confidence?: number; // 0-1 score from NLP
  };
}

export interface SegmentedPrompt {
  originalPrompt: string;
  segments: PromptSegment[];
  timestamp: string;
  sessionId: string;
}

// ============================================
// TEXT GENERATION TYPES
// ============================================

export interface TextGenerationRequest {
  prompt: string;
  sessionId: string;
  segments: PromptSegment[];
  maxTokens?: number;
  temperature?: number;
}

export interface SentenceMapping {
  sentenceId: string;
  sentenceText: string;
  sentenceIndex: number;
  contributingSegments: string[];
  confidenceScores: Record<string, number>;
}

export interface TextGenerationResponse {
  generatedText: string;
  sessionId: string;
  timestamp: string;
  sentenceMappings?: SentenceMapping[];
  metadata?: Record<string, unknown>;
}

// ============================================
// IMAGE GENERATION TYPES
// ============================================

export interface ImageGenerationRequest {
  prompt: string;
  sessionId: string;
  segments: PromptSegment[];
  width?: number;
  height?: number;
  numInferenceSteps?: number;
}

export interface HeatmapRegion {
  segmentId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  intensity: number;
}

export interface ImageGenerationResponse {
  imageUrl: string;
  sessionId: string;
  timestamp: string;
  imageWidth: number;
  imageHeight: number;
  heatmapData?: HeatmapRegion[];
  segmentContributions?: Record<string, number>;
  metadata?: Record<string, unknown>;
}

// ============================================
// EXPLAINABILITY TYPES
// ============================================

export interface TextMapping {
  segmentId: string;
  segmentText: string;
  outputSentenceIndex: number;
  outputSentenceText: string;
  confidence: number; // 0-1 score
  method: 'embedding_similarity' | 'token_overlap' | 'attention_proxy' | 'backend_analysis';
}

export interface TextExplanation {
  mappings: TextMapping[];
  overallConfidence: number;
  explanationMethod: string;
}

export interface ImageRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageHeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
}

export interface ImageMapping {
  segmentId: string;
  segmentText: string;
  heatmap: ImageHeatmapPoint[];
  region?: ImageRegion;
  confidence: number;
  method: 'clip_embedding' | 'cross_attention' | 'grad_cam' | 'backend_attention';
}

export interface ImageExplanation {
  mappings: ImageMapping[];
  overallConfidence: number;
  explanationMethod: string;
}

// ============================================
// WHAT-IF COMPARISON TYPES
// ============================================

export interface WhatIfRequest {
  originalPrompt: string;
  modifiedPrompt: string;
  originalSegments: PromptSegment[];
  sessionId: string;
  generationType: 'text' | 'image';
}

export interface SegmentChange {
  segmentId: string;
  changeType: 'added' | 'removed' | 'modified' | 'unchanged';
  originalText: string | null;
  modifiedText: string | null;
  impactScore: number;
}

export interface WhatIfResponse {
  sessionId: string;
  originalOutput: string;
  modifiedOutput: string;
  segmentChanges: SegmentChange[];
  impactSummary: Record<string, unknown>;
  comparisonMetrics: Record<string, number>;
  timestamp: string;
}

// ============================================
// METRICS & FEEDBACK TYPES
// ============================================

export interface TrustMetrics {
  sessionId: string;
  trustScore: number; // 1-5 Likert scale
  transparencyScore: number; // 1-5 Likert scale
  understandingScore: number; // 1-5 Likert scale
  usefulnessScore: number; // 1-5 Likert scale
  interactionCount?: number;
  timeSpentSeconds?: number;
  segmentsEdited?: number;
  whatifUses?: number;
  heatmapInteractions?: number;
  feedbackText?: string;
  consentGiven?: boolean;
}

export interface FeedbackSubmission {
  sessionId: string;
  ratings?: {
    transparency?: number;
    understanding?: number;
    trust?: number;
    usefulness?: number;
  };
  comments?: string;
  consent: boolean;
}

export interface MetricsSummary {
  totalSessions: number;
  averageTrust: number;
  averageTransparency: number;
  averageUnderstanding: number;
  averageUsefulness: number;
  averageTimeSpent: number;
  totalWhatifUses: number;
  distribution: Record<string, Record<number, number>>;
  timestamp: string;
}

// ============================================
// SESSION TYPES
// ============================================

export interface Session {
  id: string;
  startTime: string;
  prompts: Array<{
    prompt: string;
    segments: PromptSegment[];
    textOutput?: string;
    imageOutput?: string;
    explanations?: {
      text?: TextExplanation;
      image?: ImageExplanation;
    };
    timestamp: string;
  }>;
  metrics?: TrustMetrics;
  feedback?: FeedbackSubmission;
}

// ============================================
// API RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: string;
}
