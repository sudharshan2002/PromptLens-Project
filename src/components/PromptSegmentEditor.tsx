/**
 * PromptSegmentEditor Component
 * Interactive prompt input with automatic NLP-based segmentation
 * Supports highlighting, editing, and hover metadata display
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Wand2, Sparkles, Layers, Info, Edit3, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { PromptSegment, SegmentedPrompt } from '../types/api.types';
import { clientSegmentPrompt, generateSegmentId } from '../services/api.service';

interface PromptSegmentEditorProps {
  onGenerate: (prompt: string, segments: PromptSegment[]) => void;
  onSegmentHover?: (segmentId: string | null) => void;
  sessionId: string;
  isGenerating?: boolean;
}

// Segment category configurations
const CATEGORY_CONFIG: Record<string, { color: string; label: string; description: string }> = {
  style: { 
    color: '#6366f1', 
    label: 'Style',
    description: 'Visual style, aesthetic, or artistic direction'
  },
  subject: { 
    color: '#00823b', 
    label: 'Subject',
    description: 'Main subject or object in the scene'
  },
  context: { 
    color: '#0071e3', 
    label: 'Context',
    description: 'Background, setting, or environment'
  },
  modifier: { 
    color: '#bf5000', 
    label: 'Modifier',
    description: 'Additional details like lighting, colors, mood'
  },
  action: {
    color: '#d70015',
    label: 'Action',
    description: 'Movement, interaction, or dynamic elements'
  }
};

export function PromptSegmentEditor({
  onGenerate,
  onSegmentHover,
  sessionId,
  isGenerating = false,
}: PromptSegmentEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [segmentedPrompt, setSegmentedPrompt] = useState<SegmentedPrompt | null>(null);
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [showSegments, setShowSegments] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Auto-segment prompt when typing stops
  useEffect(() => {
    if (!prompt.trim()) {
      setSegmentedPrompt(null);
      return;
    }

    const debounceTimer = setTimeout(() => {
      const segmented = clientSegmentPrompt(prompt, sessionId);
      setSegmentedPrompt(segmented);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [prompt, sessionId]);

  // Handle segment hover
  const handleSegmentHover = useCallback((segmentId: string | null) => {
    setHoveredSegment(segmentId);
    onSegmentHover?.(segmentId);
  }, [onSegmentHover]);

  // Start editing a segment
  const handleEditStart = useCallback((segment: PromptSegment) => {
    setEditingSegmentId(segment.id);
    setEditingText(segment.text);
  }, []);

  // Save segment edit
  const handleEditSave = useCallback(() => {
    if (!segmentedPrompt || !editingSegmentId) return;

    const updatedSegments = segmentedPrompt.segments.map(seg => {
      if (seg.id === editingSegmentId) {
        return { ...seg, text: editingText };
      }
      return seg;
    });

    // Reconstruct the prompt from segments
    const newPrompt = updatedSegments.map(s => s.text).join(', ');
    setPrompt(newPrompt);
    setSegmentedPrompt({
      ...segmentedPrompt,
      originalPrompt: newPrompt,
      segments: updatedSegments,
    });
    setEditingSegmentId(null);
    setEditingText('');
  }, [segmentedPrompt, editingSegmentId, editingText]);

  // Cancel segment edit
  const handleEditCancel = useCallback(() => {
    setEditingSegmentId(null);
    setEditingText('');
  }, []);

  // Change segment category
  const handleCategoryChange = useCallback((segmentId: string, newCategory: string) => {
    if (!segmentedPrompt) return;

    const updatedSegments = segmentedPrompt.segments.map(seg => {
      if (seg.id === segmentId) {
        return {
          ...seg,
          metadata: {
            ...seg.metadata,
            category: newCategory,
            color: CATEGORY_CONFIG[newCategory]?.color || seg.metadata.color,
          },
        };
      }
      return seg;
    });

    setSegmentedPrompt({
      ...segmentedPrompt,
      segments: updatedSegments,
    });
  }, [segmentedPrompt]);

  // Add new segment manually
  const handleAddSegment = useCallback(() => {
    if (!segmentedPrompt) return;

    const newSegment: PromptSegment = {
      id: generateSegmentId(),
      text: 'new segment',
      type: 'phrase',
      startIndex: segmentedPrompt.originalPrompt.length + 2,
      endIndex: segmentedPrompt.originalPrompt.length + 14,
      metadata: {
        importance: 0.5,
        category: 'context',
        color: CATEGORY_CONFIG.context.color,
      },
    };

    const newPrompt = prompt + ', new segment';
    setPrompt(newPrompt);
    setSegmentedPrompt({
      ...segmentedPrompt,
      originalPrompt: newPrompt,
      segments: [...segmentedPrompt.segments, newSegment],
    });
    setEditingSegmentId(newSegment.id);
    setEditingText('new segment');
  }, [segmentedPrompt, prompt]);

  // Remove segment
  const handleRemoveSegment = useCallback((segmentId: string) => {
    if (!segmentedPrompt) return;

    const updatedSegments = segmentedPrompt.segments.filter(seg => seg.id !== segmentId);
    const newPrompt = updatedSegments.map(s => s.text).join(', ');
    
    setPrompt(newPrompt);
    setSegmentedPrompt({
      ...segmentedPrompt,
      originalPrompt: newPrompt,
      segments: updatedSegments,
    });
  }, [segmentedPrompt]);

  // Handle generate
  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    const segments = segmentedPrompt?.segments || [];
    onGenerate(prompt, segments);
  }, [prompt, segmentedPrompt, onGenerate]);

  // Get hovered segment data
  const hoveredSegmentData = useMemo(() => {
    if (!hoveredSegment || !segmentedPrompt) return null;
    return segmentedPrompt.segments.find(s => s.id === hoveredSegment);
  }, [hoveredSegment, segmentedPrompt]);

  return (
    <div 
      className="rounded-3xl p-6 liquid-transition hover:shadow-xl glow-effect h-full flex flex-col fade-in group liquid-glass border"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center liquid-transition group-hover:scale-105 group-hover:rotate-3" 
            style={{ 
              background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              boxShadow: '0 4px 12px rgba(0, 113, 227, 0.2)'
            }}
          >
            <Wand2 size={18} style={{ color: '#ffffff' }} strokeWidth={2} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              Prompt Editor
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Auto-segmented for explainability
            </p>
          </div>
        </div>
        
        {/* Segment toggle */}
        <button
          onClick={() => setShowSegments(!showSegments)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition hover:scale-105"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)'
          }}
        >
          <Layers size={14} />
          Segments
          {showSegments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>
      
      {/* Prompt textarea */}
      <div className="flex-1 flex flex-col">
        <div className={`relative liquid-transition ${isFocused ? 'scale-[1.005]' : ''}`}>
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe what you want to generate... (e.g., 'A cinematic cityscape at night, with neon lights and flying cars')"
            className="w-full rounded-2xl p-5 resize-none focus:outline-none liquid-transition flex-1"
            style={{ 
              fontWeight: 400,
              background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: isFocused ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-color)',
              fontSize: '0.875rem',
              minHeight: '140px',
              boxShadow: isFocused ? '0 0 0 4px rgba(0, 113, 227, 0.08)' : 'none'
            }}
          />
          {isFocused && (
            <div 
              className="absolute -inset-1 rounded-2xl pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
                opacity: 0.1,
                filter: 'blur(16px)',
                zIndex: -1
              }}
            />
          )}
        </div>
        
        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full mt-5 py-3 rounded-xl liquid-transition transform hover:scale-[1.01] active:scale-[0.99] glow-effect relative overflow-hidden group"
          style={{ 
            fontWeight: 500,
            background: isGenerating || !prompt.trim()
              ? 'var(--text-tertiary)' 
              : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)',
            color: '#ffffff',
            fontSize: '0.875rem',
            boxShadow: isGenerating ? 'var(--shadow-sm)' : 'var(--shadow-md)',
            cursor: isGenerating || !prompt.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          <span className="flex items-center justify-center gap-2 relative z-10">
            <Sparkles size={16} className={isGenerating ? 'animate-spin' : 'group-hover:rotate-12 liquid-transition'} />
            {isGenerating ? 'Generating...' : 'Generate with Explanations'}
          </span>
        </button>
      </div>

      {/* Segments panel */}
      {showSegments && segmentedPrompt && segmentedPrompt.segments.length > 0 && (
        <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h4 
              style={{ fontWeight: 600, fontSize: '0.6875rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
              className="uppercase"
            >
              Detected Segments ({segmentedPrompt.segments.length})
            </h4>
            <button
              onClick={handleAddSegment}
              className="text-xs px-2 py-1 rounded-md liquid-transition hover:scale-105"
              style={{
                background: 'var(--accent-primary)',
                color: '#fff',
              }}
            >
              + Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-2.5">
            {segmentedPrompt.segments.map((segment, index) => {
              const isEditing = editingSegmentId === segment.id;
              const isHovered = hoveredSegment === segment.id;
              const categoryConfig = CATEGORY_CONFIG[segment.metadata.category || 'context'];
              
              return (
                <div
                  key={segment.id}
                  className="relative group"
                  onMouseEnter={() => handleSegmentHover(segment.id)}
                  onMouseLeave={() => handleSegmentHover(null)}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="px-2 py-1.5 rounded-lg text-sm"
                        style={{
                          background: 'var(--bg-elevated)',
                          border: `1.5px solid ${segment.metadata.color}`,
                          color: 'var(--text-primary)',
                          minWidth: '100px',
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSave();
                          if (e.key === 'Escape') handleEditCancel();
                        }}
                      />
                      <button
                        onClick={handleEditSave}
                        className="p-1 rounded hover:bg-green-500/20"
                      >
                        <Check size={14} style={{ color: '#00823b' }} />
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="p-1 rounded hover:bg-red-500/20"
                      >
                        <X size={14} style={{ color: '#d70015' }} />
                      </button>
                    </div>
                  ) : (
                    <div
  role="button"
  tabIndex={0}
  className="px-3.5 py-2 rounded-xl liquid-transition transform hover:scale-105 active:scale-95 fade-in relative overflow-hidden cursor-pointer"
  style={{ 
    backgroundColor: segment.metadata.color + (isHovered ? '25' : '15'),
    color: segment.metadata.color,
    border: `1.5px solid ${segment.metadata.color}${isHovered ? '60' : '30'}`,
    fontWeight: 500,
    fontSize: '0.8125rem',
    animationDelay: `${index * 0.05}s`,
    boxShadow: isHovered 
      ? `0 4px 12px ${segment.metadata.color}30` 
      : `0 1px 3px ${segment.metadata.color}15`
  }}
>
  <span className="flex items-center gap-2 pointer-events-none">
    <span 
      className="w-2 h-2 rounded-full" 
      style={{ background: segment.metadata.color }}
    />
    {segment.text}
  </span>

  {/* Edit / Remove overlay */}
  <div 
    className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
    style={{ 
      background: 'rgba(0,0,0,0.7)',
      borderRadius: '12px'
    }}
  >
    <button
      onClick={(e) => {
        e.stopPropagation();
        handleEditStart(segment);
      }}
      className="p-1 rounded hover:bg-white/20"
    >
      <Edit3 size={12} style={{ color: '#fff' }} />
    </button>

    <button
      onClick={(e) => {
        e.stopPropagation();
        handleRemoveSegment(segment.id);
      }}
      className="p-1 rounded hover:bg-white/20"
    >
      <X size={12} style={{ color: '#fff' }} />
    </button>
  </div>
</div>

                  )}

                  {/* Tooltip with segment metadata */}
                  {isHovered && !isEditing && (
                    <div
                      ref={tooltipRef}
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-xl z-50 min-w-[200px]"
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        boxShadow: 'var(--shadow-lg)',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Info size={12} style={{ color: 'var(--text-secondary)' }} />
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          SEGMENT INFO
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Type:</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {segment.type}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Category:</span>
                          <select
                            value={segment.metadata.category || 'context'}
                            onChange={(e) => handleCategoryChange(segment.id, e.target.value)}
                            className="text-xs rounded px-1 py-0.5"
                            style={{
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              color: categoryConfig.color,
                              fontWeight: 500,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                              <option key={key} value={key}>{config.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Importance:</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                            {Math.round(segment.metadata.importance * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <div 
                        className="mt-2 pt-2 border-t text-xs"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-tertiary)' }}
                      >
                        {categoryConfig.description}
                      </div>
                      
                      {/* Arrow */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2 -bottom-1.5 w-3 h-3 rotate-45"
                        style={{ 
                          background: 'var(--bg-card)',
                          borderRight: '1px solid var(--border-color)',
                          borderBottom: '1px solid var(--border-color)',
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Category legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-3" style={{ borderColor: 'var(--border-color)' }}>
            {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
              <div key={key} className="flex items-center gap-1.5">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ background: config.color }}
                />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                  {config.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
