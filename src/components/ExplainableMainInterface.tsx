/**
 * ExplainableMainInterface Component
 * Main interface for PromptLens - Explainable Generative AI
 * Integrates prompt segmentation, text/image generation, and explainability features
 */

import { useState, useCallback, useRef } from 'react';
import { 
  Sparkles, Image as ImageIcon, FileText, History, 
  MessageSquare, ChevronDown, ChevronUp, Trash2, AlertCircle
} from 'lucide-react';
import { PromptSegmentEditor } from './PromptSegmentEditor';
import { ExplainableTextOutput } from './ExplainableTextOutput';
import { ExplainableImageOutput } from './ExplainableImageOutput';
import { EnhancedWhatIfEditor } from './EnhancedWhatIfEditor';
import { FeedbackForm } from './FeedbackForm';
import { PromptSegment, TextExplanation, ImageExplanation, FeedbackSubmission } from '../types/api.types';
import { 
  clientSegmentPrompt, 
  clientExplainImage,
  generateSessionId 
} from '../services/api.service';
import { useSession } from '../hooks/useSession';

// Backend API base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

interface ExplainableMainInterfaceProps {
  featuresRef: React.RefObject<HTMLDivElement>;
}

type OutputMode = 'text' | 'image' | 'both';

export function ExplainableMainInterface({ featuresRef }: ExplainableMainInterfaceProps) {
  // Session management
  const session = useSession();
  
  // UI state
  const [outputMode, setOutputMode] = useState<OutputMode>('text');
  const [hoveredSegmentId, setHoveredSegmentId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showWhatIf, setShowWhatIf] = useState(true);
  
  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState('');
  const [generatedImage, setGeneratedImage] = useState('');
  const [segments, setSegments] = useState<PromptSegment[]>([]);
  const [textExplanation, setTextExplanation] = useState<TextExplanation | null>(null);
  const [imageExplanation, setImageExplanation] = useState<ImageExplanation | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  
  // Reference for what-if comparison
  const lastResultRef = useRef<{
    prompt: string;
    segments: PromptSegment[];
    output: string;
    explanation?: TextExplanation;
    imageUrl?: string;
  } | null>(null);

  // Helper: Convert frontend segments to backend format
  const toBackendSegments = (segs: PromptSegment[]) => segs.map(seg => ({
    id: seg.id,
    text: seg.text,
    start: seg.startIndex,
    end: seg.endIndex,
    category: seg.metadata.category || 'unknown',
    confidence: seg.metadata.confidence || 0.8,
    importance: seg.metadata.importance || 0.5,
  }));

  // Handle generation
  const handleGenerate = useCallback(async (prompt: string, promptSegments: PromptSegment[]) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setCurrentPrompt(prompt);
    setSegments(promptSegments);
    setGenerationError(null);
    
    try {
      const backendSegments = toBackendSegments(promptSegments);
      
      // === TEXT GENERATION ===
      const textResponse = await fetch(`${API_BASE_URL}/generate/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: session.sessionId,
          prompt,
          segments: backendSegments,
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      
      if (!textResponse.ok) {
        const errorData = await textResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Text generation failed (${textResponse.status})`);
      }
      
      const textData = await textResponse.json();
      const newText = textData.generated_text || '';
      setGeneratedText(newText);
      
      // === TEXT EXPLANATION (from backend API) ===
      const explainResponse = await fetch(`${API_BASE_URL}/explain/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.sessionId,
          generated_text: newText,
          segments: backendSegments,
        }),
      });
      
      let explanation: TextExplanation | null = null;
      if (explainResponse.ok) {
        const explainData = await explainResponse.json();
        // Transform backend response to frontend TextExplanation format
        explanation = {
          mappings: (explainData.sentence_mappings || []).map((m: any) => {
            const scores = Object.values(m.confidence_scores || { default: 0.5 }) as number[];
            return {
              segmentId: m.contributing_segments?.[0] || '',
              segmentText: promptSegments.find(s => s.id === m.contributing_segments?.[0])?.text || '',
              outputSentenceIndex: m.sentence_index,
              outputSentenceText: m.sentence_text,
              confidence: scores.length > 0 ? Math.max(...scores) : 0.5,
              method: 'backend_analysis' as const,
            };
          }),
          overallConfidence: explainData.explanation_confidence || 0.7,
          explanationMethod: 'backend_analysis',
        };
      }
      setTextExplanation(explanation);
      
      // === IMAGE GENERATION (from backend API) ===
      let imageUrl = '';
      let imgExplanation: ImageExplanation | null = null;
      
      if (outputMode === 'image' || outputMode === 'both') {
        const imageResponse = await fetch(`${API_BASE_URL}/generate/image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.sessionId,
            prompt,
            segments: backendSegments,
            width: 512,
            height: 512,
            num_inference_steps: 30,
          }),
        });
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.image_url || '';
          setGeneratedImage(imageUrl);
          
          // Transform backend heatmap to frontend ImageExplanation format
          imgExplanation = {
            mappings: (imageData.heatmap_data || []).map((h: any) => ({
              segmentId: h.segment_id,
              segmentText: promptSegments.find(s => s.id === h.segment_id)?.text || '',
              heatmap: [{ x: h.x * 512, y: h.y * 512, intensity: h.intensity }],
              confidence: imageData.segment_contributions?.[h.segment_id] || 0.5,
              method: 'backend_attention' as const,
            })),
            overallConfidence: 0.7,
            explanationMethod: 'backend_attention',
          };
          setImageExplanation(imgExplanation);
        } else {
          console.warn('Image generation failed, using client-side placeholder');
          imgExplanation = clientExplainImage(promptSegments, 512, 512);
          setImageExplanation(imgExplanation);
        }
      }
      
      // Store result for what-if comparison
      lastResultRef.current = {
        prompt,
        segments: promptSegments,
        output: newText,
        explanation: explanation || undefined,
        imageUrl,
      };
      
      // Add to session history
      session.addPrompt({
        prompt,
        segments: promptSegments,
        textOutput: newText,
        imageOutput: outputMode !== 'text' ? imageUrl : undefined,
        textExplanation: explanation || undefined,
        imageExplanation: outputMode !== 'text' ? imgExplanation || undefined : undefined,
      });
      
    } catch (error) {
      console.error('Generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Generation failed. Please check if the backend is running.';
      setGenerationError(errorMessage);
      
      // Clear outputs on error - DO NOT use mock data
      setGeneratedText('');
      setGeneratedImage('');
      setTextExplanation(null);
      setImageExplanation(null);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, outputMode, session, generatedImage, imageExplanation]);

  // Handle what-if regeneration
  const handleWhatIfRegenerate = useCallback(async (prompt: string, segments: PromptSegment[]) => {
    await handleGenerate(prompt, segments);
  }, [handleGenerate]);

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback(async (feedback: FeedbackSubmission) => {
    try {
      // Submit to backend metrics API
      const response = await fetch(`${API_BASE_URL}/metrics/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.sessionId,
          consent_given: feedback.consent,
          feedback_text: feedback.comments || '',
          metrics: {
            transparency_score: feedback.ratings?.transparency || 3,
            understanding_score: feedback.ratings?.understanding || 3,
            trust_score: feedback.ratings?.trust || 3,
            usefulness_score: feedback.ratings?.usefulness || 3,
            interaction_count: session.prompts.length,
            time_spent_seconds: Math.floor((Date.now() - session.startTime) / 1000),
            segments_edited: 0,
            whatif_uses: 0,
            heatmap_interactions: 0,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }
      
      console.log('Feedback submitted successfully');
      session.setFeedbackSubmitted(true);
    } catch (error) {
      console.error('Feedback submission error:', error);
      throw error;
    }
  }, [session]);

  // Handle segment hover (syncs between input and output)
  const handleSegmentHover = useCallback((segmentId: string | null) => {
    setHoveredSegmentId(segmentId);
  }, []);

  // Load from history
  const loadFromHistory = useCallback((index: number) => {
    const entry = session.prompts[index];
    if (!entry) return;
    
    setCurrentPrompt(entry.prompt);
    setSegments(entry.segments);
    setGeneratedText(entry.textOutput || '');
    setGeneratedImage(entry.imageOutput || '');
    setTextExplanation(entry.textExplanation || null);
    setImageExplanation(entry.imageExplanation || null);
    
    lastResultRef.current = {
      prompt: entry.prompt,
      segments: entry.segments,
      output: entry.textOutput || '',
      explanation: entry.textExplanation,
      imageUrl: entry.imageOutput,
    };
    
    setShowHistory(false);
  }, [session.prompts]);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      {/* Main generation section */}
      <div
        ref={featuresRef}
        className="px-6 py-20 border-b"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2
              className="mb-4"
              style={{
                fontWeight: 600,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                color: 'var(--text-primary)',
              }}
            >
              Explainable AI Generation
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Enter your prompt and see exactly how each segment influences the AI output
            </p>
          </div>

          {/* Output mode selector */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div 
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <button
                onClick={() => setOutputMode('text')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg liquid-transition"
                style={{
                  background: outputMode === 'text' ? 'var(--accent-primary)' : 'transparent',
                  color: outputMode === 'text' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: outputMode === 'text' ? 500 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <FileText size={16} />
                Text
              </button>
              <button
                onClick={() => setOutputMode('image')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg liquid-transition"
                style={{
                  background: outputMode === 'image' ? 'var(--accent-primary)' : 'transparent',
                  color: outputMode === 'image' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: outputMode === 'image' ? 500 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <ImageIcon size={16} />
                Image
              </button>
              <button
                onClick={() => setOutputMode('both')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg liquid-transition"
                style={{
                  background: outputMode === 'both' ? 'var(--accent-primary)' : 'transparent',
                  color: outputMode === 'both' ? '#fff' : 'var(--text-secondary)',
                  fontWeight: outputMode === 'both' ? 500 : 400,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <Sparkles size={16} />
                Both
              </button>
            </div>
            
            {/* History toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl liquid-transition hover:scale-105"
              style={{
                background: showHistory ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: showHistory ? '#fff' : 'var(--text-secondary)',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              <History size={16} />
              History ({session.prompts.length})
            </button>
            
            {/* Feedback button */}
            {!session.feedbackSubmitted && generatedText && (
              <button
                onClick={() => setShowFeedback(!showFeedback)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl liquid-transition hover:scale-105"
                style={{
                  background: showFeedback ? '#8b5cf6' : 'var(--bg-secondary)',
                  color: showFeedback ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                <MessageSquare size={16} />
                Feedback
              </button>
            )}
          </div>

          {/* History panel */}
          {showHistory && session.prompts.length > 0 && (
            <div 
              className="mb-8 rounded-2xl p-4 liquid-glass border"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 style={{ fontWeight: 600, fontSize: '0.875rem' }}>Prompt History</h4>
                <button
                  onClick={() => session.clearHistory()}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-red-500/10"
                  style={{ color: '#d70015' }}
                >
                  <Trash2 size={12} />
                  Clear
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {session.prompts.map((entry, index) => (
                  <button
                    key={entry.id}
                    onClick={() => loadFromHistory(index)}
                    className="w-full text-left p-3 rounded-xl liquid-transition hover:scale-[1.01]"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                        {entry.prompt.length > 50 ? entry.prompt.substring(0, 50) + '...' : entry.prompt}
                      </span>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {entry.segments.slice(0, 3).map(seg => (
                        <span 
                          key={seg.id}
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: `${seg.metadata.color}15`,
                            color: seg.metadata.color,
                          }}
                        >
                          {seg.text.length > 10 ? seg.text.substring(0, 10) + '...' : seg.text}
                        </span>
                      ))}
                      {entry.segments.length > 3 && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
                          +{entry.segments.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Feedback form */}
          {showFeedback && (
            <div className="mb-8">
              <FeedbackForm
                sessionId={session.sessionId}
                startTime={session.startTime}
                onSubmit={handleFeedbackSubmit}
                onClose={() => setShowFeedback(false)}
              />
            </div>
          )}

          {/* Main grid: Input + Output */}
          <div className={`grid gap-8 ${outputMode === 'both' ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {/* Prompt input with segmentation */}
            <PromptSegmentEditor
              onGenerate={handleGenerate}
              onSegmentHover={handleSegmentHover}
              sessionId={session.sessionId}
              isGenerating={isGenerating}
            />
            
            {/* Error display */}
            {generationError && (
              <div 
                className="flex items-center gap-3 p-4 rounded-2xl border"
                style={{ 
                  background: 'rgba(215, 0, 21, 0.1)', 
                  borderColor: 'rgba(215, 0, 21, 0.3)',
                  color: '#d70015'
                }}
              >
                <AlertCircle size={20} />
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Generation Failed</p>
                  <p style={{ fontSize: '0.8125rem', opacity: 0.9 }}>{generationError}</p>
                </div>
                <button
                  onClick={() => setGenerationError(null)}
                  className="ml-auto px-3 py-1 rounded-lg text-sm"
                  style={{ background: 'rgba(215, 0, 21, 0.2)', cursor: 'pointer' }}
                >
                  Dismiss
                </button>
              </div>
            )}
            
            {/* Output panels */}
            {outputMode === 'both' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ExplainableTextOutput
                  output={generatedText}
                  segments={segments}
                  explanation={textExplanation || undefined}
                  hoveredSegmentId={hoveredSegmentId}
                  onSegmentHover={handleSegmentHover}
                  loading={isGenerating}
                />
                <ExplainableImageOutput
                  imageUrl={generatedImage}
                  segments={segments}
                  explanation={imageExplanation || undefined}
                  hoveredSegmentId={hoveredSegmentId}
                  onSegmentHover={handleSegmentHover}
                  loading={isGenerating}
                  onRegenerate={() => handleGenerate(currentPrompt, segments)}
                />
              </div>
            ) : outputMode === 'text' ? (
              <ExplainableTextOutput
                output={generatedText}
                segments={segments}
                explanation={textExplanation || undefined}
                hoveredSegmentId={hoveredSegmentId}
                onSegmentHover={handleSegmentHover}
                loading={isGenerating}
              />
            ) : (
              <ExplainableImageOutput
                imageUrl={generatedImage}
                segments={segments}
                explanation={imageExplanation || undefined}
                hoveredSegmentId={hoveredSegmentId}
                onSegmentHover={handleSegmentHover}
                loading={isGenerating}
                onRegenerate={() => handleGenerate(currentPrompt, segments)}
              />
            )}
          </div>
        </div>
      </div>

      {/* What-If section */}
      <div className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Section toggle */}
          <button
            onClick={() => setShowWhatIf(!showWhatIf)}
            className="w-full flex items-center justify-between p-4 rounded-2xl mb-6 liquid-transition hover:scale-[1.002]"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="flex items-center gap-3">
              <Sparkles size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontWeight: 600, fontSize: '1.125rem' }}>
                What-If Analysis
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Modify prompts and compare outputs
              </span>
            </div>
            {showWhatIf ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          
          {showWhatIf && (
            <EnhancedWhatIfEditor
              originalResult={lastResultRef.current}
              sessionId={session.sessionId}
              onRegenerate={handleWhatIfRegenerate}
              isRegenerating={isGenerating}
            />
          )}
        </div>
      </div>
    </div>
  );
}
