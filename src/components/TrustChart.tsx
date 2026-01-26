import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const data = [
  { name: 'Mon', trust: 78 },
  { name: 'Tue', trust: 82 },
  { name: 'Wed', trust: 80 },
  { name: 'Thu', trust: 85 },
  { name: 'Fri', trust: 84 },
  { name: 'Sat', trust: 87 },
  { name: 'Sun', trust: 89 },
];

export function TrustChart() {
  return (
    <div 
      className="rounded-3xl p-7 liquid-glass border fade-in liquid-transition hover:shadow-xl glow-effect"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: '0.3s'
      }}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 
          style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}
        >
          Trust Score Trend
        </h3>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg liquid-glass border"
          style={{ 
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <TrendingUp size={14} style={{ color: 'var(--tag-green)' }} strokeWidth={2} />
          <span style={{ fontSize: '0.75rem', color: 'var(--tag-green)', fontWeight: 500 }}>
            +12.5%
          </span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity={0.3}/>
              <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity={0.03}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="var(--text-tertiary)" 
            style={{ fontSize: '0.75rem' }}
            tickMargin={10}
          />
          <YAxis 
            stroke="var(--text-tertiary)" 
            style={{ fontSize: '0.75rem' }}
            tickMargin={10}
          />
          <Tooltip 
            contentStyle={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '10px',
              boxShadow: 'var(--shadow-md)',
              fontSize: '0.75rem'
            }}
          />
          <Area 
            type="monotone" 
            dataKey="trust" 
            stroke="var(--accent-primary)" 
            strokeWidth={2.5}
            fill="url(#trustGradient)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}