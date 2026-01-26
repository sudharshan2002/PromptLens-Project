import { useState, useEffect } from "react";
import { Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

interface HeroSectionProps {
  onGetStarted: () => void;
  theme?: 'light' | 'dark';
}

export function HeroSection({ onGetStarted, theme = 'light' }: HeroSectionProps) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20" style={{ background: 'var(--bg-primary)' }}>
      {/* Minimal Background Gradient */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: theme === 'dark' 
            ? 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(41, 151, 255, 0.15), transparent)'
            : 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 113, 227, 0.08), transparent)',
          transform: `translateY(${scrollY * 0.3}px)`,
          opacity: 1 - scrollY / 800
        }}
      ></div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <div 
          style={{ 
            transform: `translateY(${scrollY * 0.15}px)`,
            opacity: 1 - scrollY / 500,
            transition: 'transform 0.1s ease-out'
          }}
        >
          {/* New Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-8 border"
            style={{ 
              borderColor: 'var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              fontWeight: 400
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent-primary)' }}></div>
            <span>Powered by Advanced AI</span>
          </div>

          <h1 
            className="mb-5"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2.5rem, 7vw, 4.5rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: '1.05'
            }}
          >
            Understand your prompts.
            <br />
            Trust your AI.
          </h1>
          
          <p 
            className="mb-10 max-w-2xl mx-auto"
            style={{ 
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              fontWeight: 400,
              letterSpacing: '-0.011em'
            }}
          >
            Deep insights into how AI interprets your prompts. Build better, more reliable applications with confidence.
          </p>

          {/* Simplified CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <button
              onClick={onGetStarted}
              className="group px-6 py-3 rounded-full relative overflow-hidden"
              style={{ 
                background: 'var(--accent-primary)',
                color: '#ffffff',
                fontSize: '1.0625rem',
                fontWeight: 400,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '-0.011em',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              <span className="flex items-center gap-2">
                Get started
                <ArrowRight size={16} className="group-hover:translate-x-0.5" style={{ transition: 'transform 0.2s ease' }} />
              </span>
            </button>
            
            <button
              className="px-6 py-3 rounded-full border"
              style={{ 
                color: 'var(--text-primary)',
                fontSize: '1.0625rem',
                fontWeight: 400,
                borderColor: 'var(--border-strong)',
                backgroundColor: 'transparent',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                letterSpacing: '-0.011em',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              Watch demo
            </button>
          </div>

          {/* Simplified Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            {[
              { icon: Zap, label: 'Real-time Analysis' },
              { icon: Shield, label: 'Trust Metrics' },
              { icon: Sparkles, label: 'Smart Insights' }
            ].map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                style={{ 
                  borderColor: 'var(--border-color)',
                  backgroundColor: 'var(--bg-secondary)',
                  transition: 'all 0.2s ease'
                }}
              >
                <feature.icon size={14} style={{ color: 'var(--text-secondary)' }} strokeWidth={2} />
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem', fontWeight: 400 }}>
                  {feature.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Minimal Scroll Indicator */}
        <div 
          className="absolute bottom-12 left-1/2 transform -translate-x-1/2"
          style={{ 
            opacity: Math.max(0, 1 - scrollY / 150),
            transition: 'opacity 0.3s ease'
          }}
        >
          <div className="w-5 h-8 rounded-full border flex items-start justify-center p-1.5"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <div 
              className="w-1 h-2 rounded-full" 
              style={{ 
                background: 'var(--text-tertiary)',
                animation: 'scrollBounce 2s ease-in-out infinite'
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ 
          background: theme === 'dark'
            ? 'linear-gradient(to top, var(--bg-primary), transparent)'
            : 'linear-gradient(to top, var(--bg-primary), transparent)'
        }}
      ></div>

      <style>{`
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(4px); opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}