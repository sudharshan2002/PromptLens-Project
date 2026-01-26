/**
 * EnhancedDashboard Component
 * Dashboard page wrapper with Trust & Transparency metrics
 */

import { TrustMetricsDashboard } from './TrustMetricsDashboard';

export function EnhancedDashboard() {
  const handleExport = (format: 'csv' | 'json') => {
    // In production, this would call the API to export metrics
    console.log(`Exporting metrics as ${format}`);
    
    // Mock CSV export
    if (format === 'csv') {
      const csvContent = `date,trustScore,transparencyScore,qualityScore,sessions
2026-01-01,3.8,3.5,4.0,32
2026-01-02,3.9,3.7,4.1,45
2026-01-03,4.1,3.9,4.0,38
2026-01-04,4.0,4.0,4.2,41
2026-01-05,4.2,4.1,4.3,52
2026-01-06,4.3,4.2,4.4,48
2026-01-07,4.4,4.3,4.5,41`;
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptlens-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }
  };

  const handleRefresh = () => {
    // In production, this would refetch metrics from the API
    console.log('Refreshing metrics...');
    window.location.reload();
  };

  return (
    <div 
      className="flex-1 px-8 py-32 overflow-y-auto" 
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="max-w-7xl mx-auto">
        <TrustMetricsDashboard
          onExport={handleExport}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  );
}
