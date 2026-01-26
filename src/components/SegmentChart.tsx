import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const data = [
  { name: 'Style', value: 35 },
  { name: 'Subject', value: 45 },
  { name: 'Context', value: 20 },
];

const COLORS = ['var(--tag-orange)', 'var(--tag-green)', 'var(--accent-primary)'];

export function SegmentChart() {
  return (
    <div 
      className="rounded-3xl p-7 liquid-glass border fade-in liquid-transition hover:shadow-xl glow-effect"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: '0.4s'
      }}
    >
      <h3 
        className="mb-8"
        style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}
      >
        Segment Distribution
      </h3>
      
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={90}
            fill="#8884d8"
            dataKey="value"
            strokeWidth={2}
            stroke="var(--bg-card)"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
          <Legend 
            wrapperStyle={{ 
              fontSize: '0.75rem',
              fontWeight: 500
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}