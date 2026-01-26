export function ActivityTable() {
  const activities = [
    { id: 1, prompt: 'Cyberpunk city scene', score: 89, time: '2 min ago', status: 'success' },
    { id: 2, prompt: 'Mountain landscape', score: 92, time: '15 min ago', status: 'success' },
    { id: 3, prompt: 'Abstract art concept', score: 78, time: '1 hour ago', status: 'warning' },
    { id: 4, prompt: 'Portrait photography', score: 95, time: '3 hours ago', status: 'success' },
  ];

  return (
    <div 
      className="rounded-3xl overflow-hidden liquid-glass border fade-in liquid-transition hover:shadow-xl glow-effect"
      style={{ 
        borderColor: 'var(--border-color)',
        boxShadow: 'var(--shadow-md)',
        animationDelay: '0.5s'
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
              <th className="px-6 py-4 text-left" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Prompt
              </th>
              <th className="px-6 py-4 text-left" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Trust Score
              </th>
              <th className="px-6 py-4 text-left" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Time
              </th>
              <th className="px-6 py-4 text-left" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity, index) => (
              <tr 
                key={activity.id} 
                className="liquid-transition hover:bg-[var(--bg-elevated)] cursor-pointer group"
                style={{ 
                  borderBottom: index < activities.length - 1 ? '1px solid var(--border-color)' : 'none'
                }}
              >
                <td className="px-6 py-4" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                  {activity.prompt}
                </td>
                <td className="px-6 py-4">
                  <span 
                    className="px-3 py-1.5 rounded-lg liquid-glass border inline-block"
                    style={{ 
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: activity.score >= 90 ? 'var(--tag-green)' : activity.score >= 80 ? 'var(--accent-primary)' : 'var(--tag-orange)',
                      borderColor: 'var(--border-color)'
                    }}
                  >
                    {activity.score}%
                  </span>
                </td>
                <td className="px-6 py-4" style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {activity.time}
                </td>
                <td className="px-6 py-4">
                  <span 
                    className="px-3 py-1.5 rounded-lg inline-block liquid-transition group-hover:scale-105"
                    style={{ 
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      backgroundColor: activity.status === 'success' ? 'var(--tag-green)' + '12' : 'var(--tag-orange)' + '12',
                      color: activity.status === 'success' ? 'var(--tag-green)' : 'var(--tag-orange)',
                      border: `1.5px solid ${activity.status === 'success' ? 'var(--tag-green)' : 'var(--tag-orange)'}25`
                    }}
                  >
                    {activity.status === 'success' ? '✓ Complete' : '⚠ Review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}