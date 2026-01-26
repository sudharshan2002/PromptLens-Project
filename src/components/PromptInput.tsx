import { useState } from "react";
import { Sparkles, Wand2 } from "lucide-react";

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
}

export function PromptInput({ onGenerate }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const segments = [
    { id: 'style', label: 'Style: Dark cyberpunk city', color: 'var(--tag-orange)' },
    { id: 'subject', label: 'Subject: Girl with neon umbrella', color: 'var(--tag-green)' }
  ];

  const handleGenerate = () => {
    if (prompt.trim()) {
      setIsGenerating(true);
      setTimeout(() => {
        onGenerate(prompt);
        setIsGenerating(false);
      }, 1000);
    }
  };

  const toggleSegment = (id: string) => {
    setSelectedSegments(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <div 
      className="rounded-3xl p-6 liquid-transition hover:shadow-xl glow-effect h-full flex flex-col fade-in group liquid-glass border"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)'
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center liquid-transition group-hover:scale-105 group-hover:rotate-3" 
          style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            boxShadow: '0 4px 12px rgba(0, 113, 227, 0.2)'
          }}>
          <Wand2 size={18} style={{ color: '#ffffff' }} strokeWidth={2} />
        </div>
        <h3 
          style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}
        >
          Enter Prompt
        </h3>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className={`relative liquid-transition ${isFocused ? 'scale-[1.005]' : ''}`}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Describe what you want to generate..."
            className="w-full rounded-2xl p-5 resize-none focus:outline-none liquid-transition flex-1"
            style={{ 
              fontWeight: 400,
              background: isFocused ? 'var(--bg-elevated)' : 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: isFocused ? '1.5px solid var(--accent-primary)' : '1.5px solid var(--border-color)',
              fontSize: '0.875rem',
              minHeight: '180px',
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
            ></div>
          )}
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full mt-5 py-3 rounded-xl liquid-transition transform hover:scale-[1.01] active:scale-[0.99] glow-effect relative overflow-hidden group"
          style={{ 
            fontWeight: 500,
            background: isGenerating 
              ? 'var(--text-tertiary)' 
              : 'linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)',
            color: '#ffffff',
            fontSize: '0.875rem',
            boxShadow: isGenerating ? 'var(--shadow-sm)' : 'var(--shadow-md)'
          }}
        >
          <span className="flex items-center justify-center gap-2 relative z-10">
            <Sparkles size={16} className={isGenerating ? 'animate-spin' : 'group-hover:rotate-12 liquid-transition'} />
            {isGenerating ? 'Generating...' : 'Generate Output'}
          </span>
        </button>
      </div>

      <div className="mt-6">
        <h4 
          style={{ fontWeight: 600, fontSize: '0.6875rem', color: 'var(--text-secondary)', letterSpacing: '0.05em' }}
          className="mb-3"
        >
          PROMPT SEGMENTS
        </h4>
        <div className="flex flex-wrap gap-2.5">
          {segments.map((segment, index) => (
            <button
              key={segment.id}
              onClick={() => toggleSegment(segment.id)}
              className="px-3.5 py-2 rounded-xl liquid-transition transform hover:scale-105 active:scale-95 fade-in relative overflow-hidden"
              style={{ 
                backgroundColor: segment.color + (selectedSegments.includes(segment.id) ? '20' : '10'),
                color: segment.color,
                border: `1.5px solid ${segment.color}${selectedSegments.includes(segment.id) ? '50' : '25'}`,
                fontWeight: 500,
                fontSize: '0.8125rem',
                animationDelay: `${index * 0.1}s`,
                boxShadow: selectedSegments.includes(segment.id) 
                  ? `0 4px 12px ${segment.color}30` 
                  : `0 1px 3px ${segment.color}15`
              }}
            >
              {segment.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}