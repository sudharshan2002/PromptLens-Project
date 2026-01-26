import { TrendingUp } from "lucide-react";

interface AnalyticsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  delay?: number;
}

export function AnalyticsCard({ title, value, subtitle, delay = 0 }: AnalyticsCardProps) {
  return (
    <div 
      className="rounded-3xl p-7 liquid-transition hover:scale-[1.02] hover:shadow-xl relative overflow-hidden group fade-in glow-effect liquid-glass border"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: `${delay}s`
      }}
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-25 liquid-transition morph"
        style={{ background: 'radial-gradient(circle, var(--accent-primary), transparent)' }}
      ></div>
      
      <div className="relative">
        <h4 
          style={{ fontWeight: 500, color: 'var(--text-secondary)', fontSize: '0.6875rem', letterSpacing: '0.08em' }}
          className="mb-4 uppercase"
        >
          {title}
        </h4>
        <div 
          style={{ fontWeight: 700, fontSize: '2.5rem', lineHeight: '1', letterSpacing: '-0.03em' }}
          className="mb-4"
        >
          {value}
        </div>
        {subtitle && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg inline-flex liquid-glass border shimmer"
            style={{ 
              borderColor: 'var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <TrendingUp size={14} style={{ color: 'var(--tag-green)' }} strokeWidth={2} />
            <p 
              style={{ fontWeight: 500, color: 'var(--tag-green)', fontSize: '0.75rem' }}
            >
              {subtitle}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}