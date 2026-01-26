/**
 * ExplainableTextOutput Component
 * Displays generated text with interactive segment-to-sentence mapping
 * Features: highlighting, confidence scores, linked explanations
 */

import { useState, useMemo, useCallback } from 'react';
import { Eye, Lightbulb, Link2, ChevronDown, ChevronUp, BarChart3, Zap } from 'lucide-react';
import { PromptSegment, TextExplanation, TextMapping } from '../types/api.types';

interface ExplainableTextOutputProps {
  output: string;
  segments: PromptSegment[];
  explanation?: TextExplanation;
  hoveredSegmentId: string | null;
  onSegmentHover: (segmentId: string | null) => void;
  loading?: boolean;
}

export function ExplainableTextOutput({
  output = '',
  segments = [],
  explanation,
  hoveredSegmentId,
  onSegmentHover,
  loading = false,
}: ExplainableTextOutputProps) {
  const [showExplanations, setShowExplanations] = useState(true);
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [hoveredSentenceIndex, setHoveredSentenceIndex] = useState<number | null>(null);

  // Parse output into sentences
  const sentences = useMemo(() => {
    if (!output) return [];
    return output.split(/(?<=[.!?])\s+/).filter(s => s.trim());
  }, [output]);

  // Group mappings by sentence
  const mappingsBySentence = useMemo(() => {
    if (!explanation) return new Map<number, TextMapping[]>();
    
    const map = new Map<number, TextMapping[]>();
    explanation.mappings.forEach(mapping => {
      const existing = map.get(mapping.outputSentenceIndex) || [];
      map.set(mapping.outputSentenceIndex, [...existing, mapping]);
    });
    return map;
  }, [explanation]);

  // Get mappings for hovered segment
  const mappingsForHoveredSegment = useMemo(() => {
    if (!hoveredSegmentId || !explanation) return [];
    return explanation.mappings.filter(m => m.segmentId === hoveredSegmentId);
  }, [hoveredSegmentId, explanation]);

  // Get segment by ID
  const getSegmentById = useCallback((id: string) => {
    return segments.find(s => s.id === id);
  }, [segments]);

  // Check if sentence is highlighted
  const isSentenceHighlighted = useCallback((sentenceIndex: number) => {
    if (!hoveredSegmentId) return false;
    return mappingsForHoveredSegment.some(m => m.outputSentenceIndex === sentenceIndex);
  }, [hoveredSegmentId, mappingsForHoveredSegment]);

  // Get confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'var(--tag-green)';
    if (confidence >= 0.5) return 'var(--accent-primary)';
    return 'var(--tag-orange)';
  };

  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
  };

  // Render highlighted text
  const renderHighlightedSentence = (sentence: string, index: number) => {
    const isHighlighted = isSentenceHighlighted(index);
    const isHovered = hoveredSentenceIndex === index;
    const mappings = mappingsBySentence.get(index) || [];
    const maxConfidence = mappings.length > 0 
      ? Math.max(...mappings.map(m => m.confidence))
      : 0;

    // Find the segment that maps to this sentence with highest confidence
    const primaryMapping = mappings.length > 0
      ? mappings.reduce((a, b) => a.confidence > b.confidence ? a : b)
      : null;
    const primarySegment = primaryMapping ? getSegmentById(primaryMapping.segmentId) : null;
    const highlightColor = primarySegment?.metadata.color || 'var(--accent-primary)';

    return (
      <span
        key={index}
        className="relative inline transition-all duration-200"
        style={{
          backgroundColor: isHighlighted 
            ? `${highlightColor}20` 
            : isHovered && mappings.length > 0
              ? `${highlightColor}10`
              : 'transparent',
          padding: '2px 4px',
          borderRadius: '4px',
          borderBottom: isHighlighted 
            ? `2px solid ${highlightColor}` 
            : mappings.length > 0 && isHovered
              ? `1px dashed ${highlightColor}50`
              : 'none',
          cursor: mappings.length > 0 ? 'pointer' : 'default',
        }}
        onMouseEnter={() => {
          setHoveredSentenceIndex(index);
          if (primaryMapping) {
            onSegmentHover(primaryMapping.segmentId);
          }
        }}
        onMouseLeave={() => {
          setHoveredSentenceIndex(null);
          onSegmentHover(null);
        }}
      >
        {sentence}
        {isHighlighted && (
          <span
            className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs"
            style={{
              background: `${getConfidenceColor(maxConfidence)}20`,
              color: getConfidenceColor(maxConfidence),
              fontWeight: 600,
              fontSize: '0.625rem',
            }}
          >
            {Math.round(maxConfidence * 100)}%
          </span>
        )}
        {' '}
      </span>
    );
  };

  return (
    <div
      className="rounded-3xl p-6 liquid-transition hover:shadow-xl glow-effect h-full flex flex-col fade-in group liquid-glass border"
      style={{
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: '0.1s',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center liquid-transition group-hover:scale-105 group-hover:rotate-3"
            style={{
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.2)',
            }}
          >
            <Eye size={18} style={{ color: '#ffffff' }} strokeWidth={2} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              Generated Text
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Hover segments to see mappings
            </p>
          </div>
        </div>

        {explanation && (
          <button
            onClick={() => setShowExplanations(!showExplanations)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition hover:scale-105"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            <Lightbulb size={14} />
            Explanations
            {showExplanations ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Output content */}
      <div
        className="rounded-2xl p-5 flex-1 liquid-transition liquid-glass border overflow-auto"
        style={{
          borderColor: hoveredSegmentId ? 'var(--accent-primary)' : 'var(--border-color)',
          boxShadow: 'inset 0 1px 4px rgba(0, 0, 0, 0.03)',
          minHeight: '200px',
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin">
                <Zap size={24} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Generating with explanations...
              </p>
            </div>
          </div>
        ) : output ? (
          <div className="leading-relaxed" style={{ fontSize: '0.875rem', lineHeight: '1.8' }}>
            {sentences.map((sentence, index) => renderHighlightedSentence(sentence, index))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Eye size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No output yet. Enter a prompt to see results.
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>
              Generated text will appear here with interactive explanations
            </p>
          </div>
        )}
      </div>

      {/* Explanation panel */}
      {showExplanations && explanation && explanation.mappings.length > 0 && (
        <div
          className="mt-5 rounded-2xl p-5 liquid-transition border liquid-glass"
          style={{
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Explanation header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                }}
              >
                <Link2 size={14} style={{ color: '#ffffff' }} strokeWidth={2} />
              </div>
              <h4 style={{ fontWeight: 600, fontSize: '0.8125rem', letterSpacing: '0.01em' }}>
                Segment → Output Mappings
              </h4>
            </div>
            
            {/* Overall confidence */}
            <div 
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg"
              style={{
                background: `${getConfidenceColor(explanation.overallConfidence)}15`,
                border: `1px solid ${getConfidenceColor(explanation.overallConfidence)}30`,
              }}
            >
              <BarChart3 size={12} style={{ color: getConfidenceColor(explanation.overallConfidence) }} />
              <span style={{ 
                fontSize: '0.6875rem', 
                color: getConfidenceColor(explanation.overallConfidence),
                fontWeight: 600 
              }}>
                Overall: {Math.round(explanation.overallConfidence * 100)}%
              </span>
            </div>
          </div>

          {/* Mappings list */}
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {explanation.mappings.map((mapping, index) => {
              const segment = getSegmentById(mapping.segmentId);
              const isSelected = selectedMappingId === mapping.segmentId;
              const isHovered = hoveredSegmentId === mapping.segmentId;

              return (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl liquid-transition cursor-pointer"
                  style={{
                    background: isHovered || isSelected 
                      ? `${segment?.metadata.color || 'var(--accent-primary)'}10` 
                      : 'var(--bg-secondary)',
                    border: `1px solid ${isHovered || isSelected 
                      ? `${segment?.metadata.color || 'var(--accent-primary)'}40` 
                      : 'var(--border-color)'}`,
                  }}
                  onMouseEnter={() => onSegmentHover(mapping.segmentId)}
                  onMouseLeave={() => onSegmentHover(null)}
                  onClick={() => setSelectedMappingId(
                    isSelected ? null : mapping.segmentId
                  )}
                >
                  {/* Segment indicator */}
                  <div
                    className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                    style={{ background: segment?.metadata.color || 'var(--accent-primary)' }}
                  />
                  
                  {/* Mapping details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span 
                        className="font-medium text-sm truncate"
                        style={{ color: segment?.metadata.color || 'var(--text-primary)' }}
                      >
                        "{segment?.text || mapping.segmentText}"
                      </span>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>→</span>
                    </div>
                    <p 
                      className="text-xs truncate"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      "{mapping.outputSentenceText.substring(0, 100)}..."
                    </p>
                  </div>
                  
                  {/* Confidence badge */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        background: `${getConfidenceColor(mapping.confidence)}20`,
                        color: getConfidenceColor(mapping.confidence),
                      }}
                    >
                      {Math.round(mapping.confidence * 100)}%
                    </span>
                    <span style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                      {getConfidenceLabel(mapping.confidence)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Method info */}
          <div 
            className="mt-3 pt-3 border-t flex items-center justify-between"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              Method: {explanation.explanationMethod.replace(/_/g, ' ')}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
              {explanation.mappings.length} mappings found
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
