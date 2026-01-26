/**
 * Enhanced WhatIfEditor Component
 * Split view comparison with detailed change highlighting and explanation differences
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { GitCompare, Sparkles, Eye, EyeOff, RotateCcw, ArrowRight, Plus, Minus, Equal, Diff } from 'lucide-react';
import { PromptSegment, TextExplanation, TextMapping } from '../types/api.types';
import { clientSegmentPrompt, clientExplainText } from '../services/api.service';

interface WhatIfResult {
  prompt: string;
  segments: PromptSegment[];
  output: string;
  explanation?: TextExplanation;
  imageUrl?: string;
}

interface WhatIfEditorProps {
  originalResult: WhatIfResult | null;
  sessionId: string;
  onRegenerate: (prompt: string, segments: PromptSegment[]) => Promise<void>;
  isRegenerating?: boolean;
}

interface WordDiff {
  text: string;
  type: 'added' | 'removed' | 'unchanged';
}

// Compute word-level diff between two strings
function computeWordDiff(oldText: string, newText: string): WordDiff[] {
  const oldWords = oldText.split(/\s+/);
  const newWords = newText.split(/\s+/);
  
  const diff: WordDiff[] = [];
  
  // Simple LCS-based diff (could be improved with a proper diff algorithm)
  let i = 0;
  let j = 0;
  
  while (i < oldWords.length || j < newWords.length) {
    if (i >= oldWords.length) {
      diff.push({ text: newWords[j], type: 'added' });
      j++;
    } else if (j >= newWords.length) {
      diff.push({ text: oldWords[i], type: 'removed' });
      i++;
    } else if (oldWords[i] === newWords[j]) {
      diff.push({ text: oldWords[i], type: 'unchanged' });
      i++;
      j++;
    } else {
      // Look ahead to find matches
      let foundOldInNew = newWords.indexOf(oldWords[i], j);
      let foundNewInOld = oldWords.indexOf(newWords[j], i);
      
      if (foundNewInOld !== -1 && (foundOldInNew === -1 || foundNewInOld - i < foundOldInNew - j)) {
        diff.push({ text: oldWords[i], type: 'removed' });
        i++;
      } else if (foundOldInNew !== -1) {
        diff.push({ text: newWords[j], type: 'added' });
        j++;
      } else {
        diff.push({ text: oldWords[i], type: 'removed' });
        diff.push({ text: newWords[j], type: 'added' });
        i++;
        j++;
      }
    }
  }
  
  return diff;
}

// Compute segment changes
interface SegmentChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  originalSegment?: PromptSegment;
  newSegment?: PromptSegment;
}

function computeSegmentChanges(
  originalSegments: PromptSegment[],
  newSegments: PromptSegment[]
): SegmentChange[] {
  const changes: SegmentChange[] = [];
  const matchedNewIds = new Set<string>();
  
  // Find matches and modifications
  originalSegments.forEach(orig => {
    const match = newSegments.find(
      n => n.text.toLowerCase() === orig.text.toLowerCase() && !matchedNewIds.has(n.id)
    );
    
    if (match) {
      matchedNewIds.add(match.id);
      changes.push({
        type: 'unchanged',
        originalSegment: orig,
        newSegment: match,
      });
    } else {
      // Look for similar segment
      const similar = newSegments.find(
        n => !matchedNewIds.has(n.id) && (
          n.text.toLowerCase().includes(orig.text.toLowerCase().substring(0, 5)) ||
          orig.text.toLowerCase().includes(n.text.toLowerCase().substring(0, 5))
        )
      );
      
      if (similar) {
        matchedNewIds.add(similar.id);
        changes.push({
          type: 'modified',
          originalSegment: orig,
          newSegment: similar,
        });
      } else {
        changes.push({
          type: 'removed',
          originalSegment: orig,
        });
      }
    }
  });
  
  // Find added segments
  newSegments.forEach(newSeg => {
    if (!matchedNewIds.has(newSeg.id)) {
      changes.push({
        type: 'added',
        newSegment: newSeg,
      });
    }
  });
  
  return changes;
}

export function EnhancedWhatIfEditor({
  originalResult,
  sessionId,
  onRegenerate,
  isRegenerating = false,
}: WhatIfEditorProps) {
  const [editedPrompt, setEditedPrompt] = useState('');
  const [modifiedResult, setModifiedResult] = useState<WhatIfResult | null>(null);
  const [showDiff, setShowDiff] = useState(true);
  const [showExplanationDiff, setShowExplanationDiff] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize with original prompt
  useEffect(() => {
    if (originalResult?.prompt) {
      setEditedPrompt(originalResult.prompt);
    }
  }, [originalResult?.prompt]);

  // Auto-segment edited prompt
  const editedSegments = useMemo(() => {
    if (!editedPrompt.trim()) return [];
    return clientSegmentPrompt(editedPrompt, sessionId).segments;
  }, [editedPrompt, sessionId]);

  // Compute prompt diff
  const promptDiff = useMemo(() => {
    if (!originalResult?.prompt || !editedPrompt) return [];
    return computeWordDiff(originalResult.prompt, editedPrompt);
  }, [originalResult?.prompt, editedPrompt]);

  // Compute segment changes
  const segmentChanges = useMemo(() => {
    if (!originalResult?.segments) return [];
    return computeSegmentChanges(originalResult.segments, editedSegments);
  }, [originalResult?.segments, editedSegments]);

  // Compute output diff
  const outputDiff = useMemo(() => {
    if (!originalResult?.output || !modifiedResult?.output) return [];
    return computeWordDiff(originalResult.output, modifiedResult.output);
  }, [originalResult?.output, modifiedResult?.output]);

  // Check if prompt has changes
  const hasChanges = useMemo(() => {
    return originalResult?.prompt !== editedPrompt;
  }, [originalResult?.prompt, editedPrompt]);

  // Handle regenerate
  const handleRegenerate = useCallback(async () => {
    if (!editedPrompt.trim() || isRegenerating) return;
    
    await onRegenerate(editedPrompt, editedSegments);
    
    // Create a mock modified result for comparison
    // In production, this would come from the actual API response
    setModifiedResult({
      prompt: editedPrompt,
      segments: editedSegments,
      output: '', // Will be set by parent component
      explanation: clientExplainText(editedSegments, ''),
    });
  }, [editedPrompt, editedSegments, isRegenerating, onRegenerate]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (originalResult?.prompt) {
      setEditedPrompt(originalResult.prompt);
      setModifiedResult(null);
    }
  }, [originalResult?.prompt]);

  // Count changes
  const changeStats = useMemo(() => {
    const added = segmentChanges.filter(c => c.type === 'added').length;
    const removed = segmentChanges.filter(c => c.type === 'removed').length;
    const modified = segmentChanges.filter(c => c.type === 'modified').length;
    return { added, removed, modified };
  }, [segmentChanges]);

  if (!originalResult) {
    return (
      <div 
        className="rounded-3xl p-8 liquid-glass border text-center"
        style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
      >
        <GitCompare size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px', margin: '0 auto' }} />
        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '8px' }}>
          What-If Analysis
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Generate an output first to enable what-if comparisons
        </p>
      </div>
    );
  }

  return (
    <div 
      className="rounded-3xl p-6 liquid-glass border"
      style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
            }}
          >
            <GitCompare size={18} style={{ color: '#ffffff' }} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              What-If Prompt Editor
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Modify the prompt to compare outputs and explanations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition hover:scale-105"
            style={{
              background: showDiff ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: showDiff ? '#fff' : 'var(--text-secondary)'
            }}
          >
            {showDiff ? <Eye size={14} /> : <EyeOff size={14} />}
            Show Diff
          </button>
          
          <button
            onClick={handleReset}
            disabled={!hasChanges}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)'
            }}
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Edit area */}
      <div className={`relative mb-6 liquid-transition ${isFocused ? 'scale-[1.002]' : ''}`}>
        <textarea
          value={editedPrompt}
          onChange={(e) => setEditedPrompt(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Modify the prompt here..."
          className="w-full rounded-2xl p-5 resize-none focus:outline-none liquid-transition"
          style={{ 
            fontWeight: 400,
            background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            border: isFocused 
              ? '1.5px solid var(--accent-primary)' 
              : hasChanges 
                ? '1.5px solid #f59e0b' 
                : '1.5px solid var(--border-color)',
            fontSize: '0.875rem',
            minHeight: '100px',
            boxShadow: isFocused ? '0 0 0 4px rgba(0, 113, 227, 0.08)' : 'none'
          }}
        />
        
        {hasChanges && (
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-medium"
            style={{ background: '#f59e0b20', color: '#f59e0b' }}
          >
            Modified
          </div>
        )}
      </div>

      {/* Change indicators */}
      {hasChanges && showDiff && (
        <div className="flex items-center gap-4 mb-6 p-3 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Changes:
          </span>
          {changeStats.added > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#00823b' }}>
              <Plus size={12} /> {changeStats.added} added
            </span>
          )}
          {changeStats.removed > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#d70015' }}>
              <Minus size={12} /> {changeStats.removed} removed
            </span>
          )}
          {changeStats.modified > 0 && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#f59e0b' }}>
              <Diff size={12} /> {changeStats.modified} modified
            </span>
          )}
        </div>
      )}

      {/* Regenerate button */}
      <button
        onClick={handleRegenerate}
        disabled={isRegenerating || !hasChanges}
        className="w-full py-3 rounded-xl liquid-transition transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        style={{ 
          fontWeight: 500,
          background: hasChanges 
            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
            : 'var(--text-tertiary)',
          color: '#ffffff',
          fontSize: '0.875rem',
          boxShadow: hasChanges ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <Sparkles size={16} className={isRegenerating ? 'animate-spin' : ''} />
          {isRegenerating ? 'Regenerating...' : 'Regenerate with Changes'}
        </span>
      </button>

      {/* Split comparison view */}
      {showDiff && hasChanges && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Original */}
          <div 
            className="rounded-2xl p-5 border"
            style={{ 
              borderColor: 'var(--border-color)',
              background: 'var(--bg-secondary)',
            }}
          >
            <h4 
              className="flex items-center gap-2 mb-4"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
              Original Prompt
            </h4>
            
            {/* Original segments */}
            <div className="flex flex-wrap gap-2 mb-4">
              {originalResult.segments.map(segment => {
                const change = segmentChanges.find(c => c.originalSegment?.id === segment.id);
                return (
                  <span
                    key={segment.id}
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      background: change?.type === 'removed' 
                        ? '#d7001520' 
                        : change?.type === 'modified'
                          ? '#f59e0b20'
                          : `${segment.metadata.color}15`,
                      color: change?.type === 'removed' 
                        ? '#d70015' 
                        : change?.type === 'modified'
                          ? '#f59e0b'
                          : segment.metadata.color,
                      border: `1px solid ${change?.type === 'removed' 
                        ? '#d7001530' 
                        : change?.type === 'modified'
                          ? '#f59e0b30'
                          : segment.metadata.color + '30'}`,
                      textDecoration: change?.type === 'removed' ? 'line-through' : 'none',
                    }}
                  >
                    {segment.text}
                  </span>
                );
              })}
            </div>

            {/* Original output preview */}
            {originalResult.output && (
              <div 
                className="p-3 rounded-xl text-sm"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {originalResult.output.substring(0, 200)}
                {originalResult.output.length > 200 && '...'}
              </div>
            )}
          </div>

          {/* Modified */}
          <div 
            className="rounded-2xl p-5 border"
            style={{ 
              borderColor: '#f59e0b50',
              background: '#f59e0b08',
            }}
          >
            <h4 
              className="flex items-center gap-2 mb-4"
              style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f59e0b' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
              Modified Prompt
            </h4>
            
            {/* Modified segments */}
            <div className="flex flex-wrap gap-2 mb-4">
              {editedSegments.map(segment => {
                const change = segmentChanges.find(c => c.newSegment?.id === segment.id);
                return (
                  <span
                    key={segment.id}
                    className="px-2.5 py-1 rounded-lg text-xs"
                    style={{
                      background: change?.type === 'added' 
                        ? '#00823b20' 
                        : change?.type === 'modified'
                          ? '#f59e0b20'
                          : `${segment.metadata.color}15`,
                      color: change?.type === 'added' 
                        ? '#00823b' 
                        : change?.type === 'modified'
                          ? '#f59e0b'
                          : segment.metadata.color,
                      border: `1px solid ${change?.type === 'added' 
                        ? '#00823b30' 
                        : change?.type === 'modified'
                          ? '#f59e0b30'
                          : segment.metadata.color + '30'}`,
                    }}
                  >
                    {change?.type === 'added' && <Plus size={10} className="inline mr-1" />}
                    {segment.text}
                  </span>
                );
              })}
            </div>

            {/* Modified output preview (placeholder) */}
            {modifiedResult?.output ? (
              <div 
                className="p-3 rounded-xl text-sm"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  maxHeight: '120px',
                  overflow: 'auto',
                }}
              >
                {modifiedResult.output.substring(0, 200)}
                {modifiedResult.output.length > 200 && '...'}
              </div>
            ) : (
              <div 
                className="p-3 rounded-xl text-center"
                style={{ 
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-tertiary)',
                  fontSize: '0.8125rem',
                }}
              >
                Click "Regenerate" to see modified output
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      {showDiff && hasChanges && (
        <div 
          className="mt-6 pt-4 border-t flex flex-wrap items-center gap-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            LEGEND:
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: '#00823b' }} />
            <span style={{ color: '#00823b' }}>Added</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: '#d70015' }} />
            <span style={{ color: '#d70015' }}>Removed</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
            <span style={{ color: '#f59e0b' }}>Modified</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--text-tertiary)' }} />
            <span style={{ color: 'var(--text-tertiary)' }}>Unchanged</span>
          </span>
        </div>
      )}
    </div>
  );
}
