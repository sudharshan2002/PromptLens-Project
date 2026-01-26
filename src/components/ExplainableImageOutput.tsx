/**
 * ExplainableImageOutput Component
 * Displays generated images with interactive heatmap overlays
 * Features: segment-to-region mapping, opacity controls, toggle overlays
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Image as ImageIcon, Layers, Eye, EyeOff, Sliders, ZoomIn, ZoomOut, Download, RefreshCw } from 'lucide-react';
import { PromptSegment, ImageExplanation, ImageMapping } from '../types/api.types';

interface ExplainableImageOutputProps {
  imageUrl: string;
  segments: PromptSegment[];
  explanation?: ImageExplanation;
  hoveredSegmentId: string | null;
  onSegmentHover: (segmentId: string | null) => void;
  loading?: boolean;
  onRegenerate?: () => void;
}

export function ExplainableImageOutput({
  imageUrl = '',
  segments = [],
  explanation,
  hoveredSegmentId,
  onSegmentHover,
  loading = false,
  onRegenerate,
}: ExplainableImageOutputProps) {
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  const [showControls, setShowControls] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [activeSegmentIds, setActiveSegmentIds] = useState<Set<string>>(new Set());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [imageSize, setImageSize] = useState({ width: 512, height: 512 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize active segments
  useEffect(() => {
    if (segments.length > 0) {
      setActiveSegmentIds(new Set(segments.map(s => s.id)));
    }
  }, [segments]);

  // Load and display image
  useEffect(() => {
    if (!imageUrl) return;
    
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Draw heatmap overlay
  useEffect(() => {
    if (!canvasRef.current || !explanation || !showOverlay || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Filter mappings based on active segments and hovered segment
    let mappingsToShow = explanation.mappings.filter(m => 
      activeSegmentIds.has(m.segmentId)
    );

    // If a segment is hovered, only show that segment's heatmap
    if (hoveredSegmentId) {
      mappingsToShow = mappingsToShow.filter(m => m.segmentId === hoveredSegmentId);
    }

    // Draw each mapping's heatmap
    mappingsToShow.forEach(mapping => {
      const segment = segments.find(s => s.id === mapping.segmentId);
      if (!segment) return;

      // Parse color
      const color = segment.metadata.color;
      
      mapping.heatmap.forEach(point => {
        const radius = 30 + point.intensity * 40;
        const gradient = ctx.createRadialGradient(
          point.x, point.y, 0,
          point.x, point.y, radius
        );
        
        // Convert hex to rgba
        const hexToRgba = (hex: string, alpha: number) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          if (result) {
            return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
          }
          return `rgba(0, 113, 227, ${alpha})`;
        };

        gradient.addColorStop(0, hexToRgba(color, point.intensity * overlayOpacity));
        gradient.addColorStop(0.5, hexToRgba(color, point.intensity * overlayOpacity * 0.5));
        gradient.addColorStop(1, hexToRgba(color, 0));

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }, [explanation, showOverlay, overlayOpacity, hoveredSegmentId, activeSegmentIds, segments, imageLoaded]);

  // Toggle segment in overlay
  const toggleSegment = useCallback((segmentId: string) => {
    setActiveSegmentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(segmentId)) {
        newSet.delete(segmentId);
      } else {
        newSet.add(segmentId);
      }
      return newSet;
    });
  }, []);

  // Get segment by ID
  const getSegmentById = useCallback((id: string) => {
    return segments.find(s => s.id === id);
  }, [segments]);

  // Download image
  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `promptlens-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  // Get mapping for hovered segment
  const hoveredMapping = useMemo(() => {
    if (!hoveredSegmentId || !explanation) return null;
    return explanation.mappings.find(m => m.segmentId === hoveredSegmentId);
  }, [hoveredSegmentId, explanation]);

  return (
    <div
      className="rounded-3xl p-6 liquid-transition hover:shadow-xl glow-effect h-full flex flex-col fade-in group liquid-glass border"
      style={{
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: '0.15s',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center liquid-transition group-hover:scale-105 group-hover:rotate-3"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.2)',
            }}
          >
            <ImageIcon size={18} style={{ color: '#ffffff' }} strokeWidth={2} />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
              Generated Image
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Hover segments to see influence regions
            </p>
          </div>
        </div>

        {/* Controls toggle */}
        <div className="flex items-center gap-2">
          {imageUrl && (
            <>
              <button
                onClick={handleDownload}
                className="p-2 rounded-lg liquid-transition hover:scale-105"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                }}
                title="Download image"
              >
                <Download size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
              
              {onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-2 rounded-lg liquid-transition hover:scale-105"
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                  title="Regenerate image"
                >
                  <RefreshCw size={14} style={{ color: 'var(--text-secondary)' }} />
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition hover:scale-105"
            style={{
              background: showControls ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.75rem',
              color: showControls ? '#fff' : 'var(--text-secondary)'
            }}
          >
            <Sliders size={14} />
            Controls
          </button>
        </div>
      </div>

      {/* Image container */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden flex-1 flex items-center justify-center liquid-glass border"
        style={{
          borderColor: hoveredSegmentId ? 'var(--accent-primary)' : 'var(--border-color)',
          background: 'var(--bg-secondary)',
          minHeight: '300px',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center animate-pulse" style={{ background: 'var(--accent-primary)20' }}>
              <ImageIcon size={24} style={{ color: 'var(--accent-primary)' }} />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Generating image...
            </p>
          </div>
        ) : imageUrl ? (
          <div 
            className="relative"
            style={{ 
              transform: `scale(${zoom})`,
              transition: 'transform 0.2s ease-out',
            }}
          >
            <img
              src={imageUrl}
              alt="Generated"
              className="max-w-full max-h-[400px] object-contain rounded-xl"
              style={{ 
                display: 'block',
                boxShadow: 'var(--shadow-md)',
              }}
            />
            
            {/* Heatmap overlay canvas */}
            {showOverlay && explanation && (
              <canvas
                ref={canvasRef}
                width={imageSize.width}
                height={imageSize.height}
                className="absolute inset-0 pointer-events-none"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  mixBlendMode: 'multiply',
                }}
              />
            )}

            {/* Hovered segment indicator */}
            {hoveredMapping && (
              <div 
                className="absolute bottom-4 left-4 right-4 p-3 rounded-xl"
                style={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ background: getSegmentById(hoveredSegmentId!)?.metadata.color }}
                    />
                    <span style={{ color: '#fff', fontSize: '0.8125rem', fontWeight: 500 }}>
                      {hoveredMapping.segmentText}
                    </span>
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: '#fff',
                    }}
                  >
                    {Math.round(hoveredMapping.confidence * 100)}% confidence
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-8">
            <ImageIcon size={48} style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              No image generated yet
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '4px' }}>
              Enter a prompt and generate to see the image with explanation overlays
            </p>
          </div>
        )}
      </div>

      {/* Controls panel */}
      {showControls && imageUrl && (
        <div 
          className="mt-5 rounded-2xl p-5 liquid-glass border"
          style={{
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* Overlay toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Layers size={16} style={{ color: 'var(--text-secondary)' }} />
              <span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>
                Explanation Overlay
              </span>
            </div>
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-transition"
              style={{
                background: showOverlay ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: showOverlay ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.75rem',
              }}
            >
              {showOverlay ? <Eye size={14} /> : <EyeOff size={14} />}
              {showOverlay ? 'Visible' : 'Hidden'}
            </button>
          </div>

          {/* Opacity slider */}
          {showOverlay && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Overlay Opacity
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity * 100}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--accent-primary) ${overlayOpacity * 100}%, var(--bg-tertiary) ${overlayOpacity * 100}%)`,
                }}
              />
            </div>
          )}

          {/* Zoom controls */}
          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Zoom Level
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] liquid-transition"
                disabled={zoom <= 0.5}
              >
                <ZoomOut size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 500, minWidth: '40px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.25))}
                className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] liquid-transition"
                disabled={zoom >= 2}
              >
                <ZoomIn size={14} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          </div>

          {/* Segment toggles */}
          {explanation && (
            <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center justify-between mb-3">
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.05em' }}>
                  SEGMENT VISIBILITY
                </span>
                <button
                  onClick={() => {
                    if (activeSegmentIds.size === segments.length) {
                      setActiveSegmentIds(new Set());
                    } else {
                      setActiveSegmentIds(new Set(segments.map(s => s.id)));
                    }
                  }}
                  style={{ fontSize: '0.6875rem', color: 'var(--accent-primary)' }}
                >
                  {activeSegmentIds.size === segments.length ? 'Hide All' : 'Show All'}
                </button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {segments.map(segment => {
                  const isActive = activeSegmentIds.has(segment.id);
                  const mapping = explanation.mappings.find(m => m.segmentId === segment.id);
                  
                  return (
                    <button
                      key={segment.id}
                      onClick={() => toggleSegment(segment.id)}
                      onMouseEnter={() => onSegmentHover(segment.id)}
                      onMouseLeave={() => onSegmentHover(null)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg liquid-transition"
                      style={{
                        background: isActive ? `${segment.metadata.color}20` : 'var(--bg-tertiary)',
                        border: `1.5px solid ${isActive ? segment.metadata.color : 'var(--border-color)'}`,
                        color: isActive ? segment.metadata.color : 'var(--text-tertiary)',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        opacity: isActive ? 1 : 0.5,
                      }}
                    >
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ 
                          background: isActive ? segment.metadata.color : 'var(--text-tertiary)',
                        }}
                      />
                      {segment.text.length > 15 ? segment.text.substring(0, 15) + '...' : segment.text}
                      {mapping && (
                        <span style={{ opacity: 0.7 }}>
                          ({Math.round(mapping.confidence * 100)}%)
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Explanation summary */}
      {explanation && !showControls && (
        <div 
          className="mt-4 flex items-center justify-between px-2"
          style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}
        >
          <span>
            {explanation.mappings.length} region mappings • {explanation.explanationMethod.replace(/_/g, ' ')}
          </span>
          <span>
            Overall confidence: {Math.round(explanation.overallConfidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
