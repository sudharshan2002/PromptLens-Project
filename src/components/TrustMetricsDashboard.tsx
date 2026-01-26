/**
 * TrustMetricsDashboard Component
 * Comprehensive dashboard for tracking trust, transparency, and usability metrics
 * 
 * NOTE: This component fetches REAL data from the backend API.
 * Mock data is only used as fallback when API is unavailable.
 */

import { useState, useMemo, useEffect } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  BarChart3, TrendingUp, TrendingDown, Shield, Eye, 
  Star, Clock, Download, RefreshCw, Filter,
  ChevronDown, ChevronUp, Activity, AlertCircle
} from 'lucide-react';
import { MetricsSummary, TrustMetrics } from '../types/api.types';

// API Base URL
const API_BASE_URL = 'http://127.0.0.1:8000';

interface TrustMetricsDashboardProps {
  metrics?: MetricsSummary;
  recentSessions?: Array<{
    id: string;
    timestamp: string;
    metrics: TrustMetrics;
  }>;
  onExport?: (format: 'csv' | 'json') => void;
  onRefresh?: () => void;
}

// ⚠️ DEVELOPMENT ONLY: Fallback data when API unavailable
// These values are for demonstration purposes only
const FALLBACK_MOCK_DATA = {
  trendData: [
    { date: 'Day 1', trustScore: 3.0, transparencyScore: 3.0, qualityScore: 3.0 },
    { date: 'Day 2', trustScore: 3.0, transparencyScore: 3.0, qualityScore: 3.0 },
  ],
  distributionData: [
    { name: 'Very Low (1)', value: 0, color: '#d70015' },
    { name: 'Low (2)', value: 0, color: '#bf5000' },
    { name: 'Medium (3)', value: 0, color: '#f59e0b' },
    { name: 'High (4)', value: 0, color: '#00823b' },
    { name: 'Very High (5)', value: 0, color: '#0071e3' },
  ],
  radarData: [
    { metric: 'Trust', value: 0, fullMark: 5 },
    { metric: 'Transparency', value: 0, fullMark: 5 },
    { metric: 'Quality', value: 0, fullMark: 5 },
    { metric: 'Clarity', value: 0, fullMark: 5 },
    { metric: 'Usability', value: 0, fullMark: 5 },
  ],
};

export function TrustMetricsDashboard({
  metrics,
  recentSessions,
  onExport,
  onRefresh,
}: TrustMetricsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [showFilters, setShowFilters] = useState(false);
  const [apiMetrics, setApiMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real metrics from backend API
  useEffect(() => {
    async function fetchMetrics() {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/metrics/summary`);
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        const data = await response.json();
        setApiMetrics(data);
        console.log('✅ Loaded real metrics from API:', data);
      } catch (err) {
        console.warn('⚠️ Could not fetch metrics from API, using fallback:', err);
        setError('Could not connect to backend. Showing placeholder data.');
        setApiMetrics(null);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchMetrics();
  }, []);

  // Compute summary stats from real API data
  const summaryStats = useMemo(() => {
    if (apiMetrics) {
      return {
        avgTrust: apiMetrics.average_trust || 0,
        avgTransparency: apiMetrics.average_transparency || 0,
        avgQuality: apiMetrics.average_usefulness || 0,
        avgTime: apiMetrics.average_time_spent || 0,
        totalSessions: apiMetrics.total_sessions || 0,
        trustTrend: 0, // Would need historical data
        transparencyTrend: 0,
      };
    }
    // Fallback: No data
    return {
      avgTrust: 0,
      avgTransparency: 0,
      avgQuality: 0,
      avgTime: 0,
      totalSessions: 0,
      trustTrend: 0,
      transparencyTrend: 0,
    };
  }, [apiMetrics]);

  // Convert API distribution to chart format
  const distributionData = useMemo(() => {
    if (apiMetrics?.distribution?.trust) {
      const dist = apiMetrics.distribution.trust as Record<number, number>;
      const total = Object.values(dist).reduce((a: number, b: number) => a + b, 0) || 1;
      return [
        { name: 'Very Low (1)', value: Math.round((Number(dist[1]) || 0) / total * 100), color: '#d70015' },
        { name: 'Low (2)', value: Math.round((Number(dist[2]) || 0) / total * 100), color: '#bf5000' },
        { name: 'Medium (3)', value: Math.round((Number(dist[3]) || 0) / total * 100), color: '#f59e0b' },
        { name: 'High (4)', value: Math.round((Number(dist[4]) || 0) / total * 100), color: '#00823b' },
        { name: 'Very High (5)', value: Math.round((Number(dist[5]) || 0) / total * 100), color: '#0071e3' },
      ];
    }
    return FALLBACK_MOCK_DATA.distributionData;
  }, [apiMetrics]);

  // Radar chart data from API
  const radarData = useMemo(() => {
    if (apiMetrics) {
      return [
        { metric: 'Trust', value: apiMetrics.average_trust || 0, fullMark: 5 },
        { metric: 'Transparency', value: apiMetrics.average_transparency || 0, fullMark: 5 },
        { metric: 'Understanding', value: apiMetrics.average_understanding || 0, fullMark: 5 },
        { metric: 'Usefulness', value: apiMetrics.average_usefulness || 0, fullMark: 5 },
      ];
    }
    return FALLBACK_MOCK_DATA.radarData;
  }, [apiMetrics]);

  // Trend data (simplified - would need time-series endpoint for real trend)
  const trendData = useMemo(() => {
    if (apiMetrics && apiMetrics.total_sessions > 0) {
      // Create a simple representation
      return [
        { date: 'Current', trustScore: apiMetrics.average_trust, transparencyScore: apiMetrics.average_transparency, qualityScore: apiMetrics.average_usefulness },
      ];
    }
    return FALLBACK_MOCK_DATA.trendData;
  }, [apiMetrics]);

  // Handle CSV export
  const handleExport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/export/csv`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptlens-metrics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Could not export metrics. Make sure the backend is running.');
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/summary`);
      if (response.ok) {
        const data = await response.json();
        setApiMetrics(data);
        setError(null);
      }
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 4.5) return '#00823b';
    if (score >= 3.5) return '#0071e3';
    if (score >= 2.5) return '#f59e0b';
    return '#d70015';
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 3.5) return 'Good';
    if (score >= 2.5) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--accent-primary)' }}
          >
            <BarChart3 size={20} style={{ color: '#ffffff' }} strokeWidth={2} />
          </div>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
              Trust & Transparency Dashboard
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Monitor user trust, perceived transparency, and output quality metrics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--bg-secondary)' }}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-3 py-1.5 rounded-lg text-sm liquid-transition"
                style={{
                  background: timeRange === range ? 'var(--accent-primary)' : 'transparent',
                  color: timeRange === range ? '#fff' : 'var(--text-secondary)',
                  fontWeight: timeRange === range ? 500 : 400,
                }}
              >
                {range}
              </button>
            ))}
          </div>
          
          {/* Export button */}
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl liquid-transition hover:scale-105"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            <Download size={16} />
            Export CSV
          </button>
          
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            className="p-2 rounded-xl liquid-transition hover:scale-105"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              cursor: 'pointer'
            }}
            disabled={isLoading}
          >
            <RefreshCw size={16} style={{ color: 'var(--text-secondary)' }} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Error/Loading Banner */}
      {error && (
        <div 
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{ 
            background: 'rgba(215, 0, 21, 0.1)', 
            border: '1px solid rgba(215, 0, 21, 0.3)',
            color: '#d70015'
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span className="ml-3" style={{ color: 'var(--text-secondary)' }}>Loading metrics...</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Trust Score */}
        <div 
          className="rounded-3xl p-6 liquid-glass border liquid-transition hover:shadow-xl"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield size={18} style={{ color: getScoreColor(summaryStats.avgTrust) }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                AVG TRUST SCORE
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ color: '#00823b', fontSize: '0.75rem' }}>
              <TrendingUp size={12} />
              +{summaryStats.trustTrend}%
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: getScoreColor(summaryStats.avgTrust) }}>
              {summaryStats.avgTrust.toFixed(1)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>/5</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {getScoreLabel(summaryStats.avgTrust)} • Based on Likert scale (1-5)
          </p>
        </div>

        {/* Transparency Score */}
        <div 
          className="rounded-3xl p-6 liquid-glass border liquid-transition hover:shadow-xl"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Eye size={18} style={{ color: getScoreColor(summaryStats.avgTransparency) }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                TRANSPARENCY
              </span>
            </div>
            <div className="flex items-center gap-1" style={{ color: '#00823b', fontSize: '0.75rem' }}>
              <TrendingUp size={12} />
              +{summaryStats.transparencyTrend}%
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: getScoreColor(summaryStats.avgTransparency) }}>
              {summaryStats.avgTransparency.toFixed(1)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>/5</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {getScoreLabel(summaryStats.avgTransparency)} • Perceived explanation clarity
          </p>
        </div>

        {/* Quality Score */}
        <div 
          className="rounded-3xl p-6 liquid-glass border liquid-transition hover:shadow-xl"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Star size={18} style={{ color: getScoreColor(summaryStats.avgQuality) }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                OUTPUT QUALITY
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: getScoreColor(summaryStats.avgQuality) }}>
              {summaryStats.avgQuality.toFixed(1)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>/5</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {getScoreLabel(summaryStats.avgQuality)} • User-rated output quality
          </p>
        </div>

        {/* Time to Satisfactory */}
        <div 
          className="rounded-3xl p-6 liquid-glass border liquid-transition hover:shadow-xl"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock size={18} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                AVG TIME TO SATISFACTORY
              </span>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>
              {summaryStats.avgTime.toFixed(0)}
            </span>
            <span style={{ fontSize: '1rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>sec</span>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {summaryStats.totalSessions} total sessions tracked
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Trend Chart */}
        <div 
          className="rounded-3xl p-6 liquid-glass border"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Trust Score Trend</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#0071e3' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Trust</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#00823b' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Transparency</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Quality</span>
              </div>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#0071e3" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00823b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00823b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" style={{ fontSize: '0.6875rem' }} />
              <YAxis domain={[0, 5]} stroke="var(--text-tertiary)" style={{ fontSize: '0.6875rem' }} />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                }}
              />
              <Area type="monotone" dataKey="trustScore" stroke="#0071e3" strokeWidth={2} fill="url(#trustGrad)" />
              <Area type="monotone" dataKey="transparencyScore" stroke="#00823b" strokeWidth={2} fill="url(#transGrad)" />
              <Line type="monotone" dataKey="qualityScore" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div 
          className="rounded-3xl p-6 liquid-glass border"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '24px' }}>
            Overall Performance Radar
          </h3>
          
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border-color)" />
              <PolarAngleAxis 
                dataKey="metric" 
                tick={{ fill: 'var(--text-secondary)', fontSize: '0.75rem' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 5]}
                tick={{ fill: 'var(--text-tertiary)', fontSize: '0.6875rem' }}
              />
              <Radar 
                name="Score" 
                dataKey="value" 
                stroke="#0071e3" 
                fill="#0071e3" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trust Distribution */}
        <div 
          className="rounded-3xl p-6 liquid-glass border"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '24px' }}>
            Trust Score Distribution
          </h3>
          
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={distributionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={2}
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-4 space-y-2">
            {distributionData.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div 
          className="lg:col-span-2 rounded-3xl p-6 liquid-glass border"
          style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 style={{ fontWeight: 600, fontSize: '1.125rem' }}>Recent Sessions</h3>
            <div className="flex items-center gap-2">
              <Activity size={14} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {summaryStats.totalSessions} sessions
              </span>
            </div>
          </div>
          
          {summaryStats.totalSessions === 0 ? (
            <div className="flex flex-col items-center justify-center py-12" style={{ color: 'var(--text-tertiary)' }}>
              <Activity size={40} className="mb-4 opacity-30" />
              <p style={{ fontSize: '0.875rem' }}>No sessions recorded yet</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Session data will appear here after users submit feedback</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th className="px-4 py-3 text-left" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>METRIC</th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>AVG SCORE</th>
                    <th className="px-4 py-3 text-center" style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="liquid-transition hover:bg-[var(--bg-secondary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3"><span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Trust Score</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-lg" style={{ fontSize: '0.75rem', fontWeight: 600, background: `${getScoreColor(summaryStats.avgTrust)}15`, color: getScoreColor(summaryStats.avgTrust) }}>
                        {summaryStats.avgTrust.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getScoreLabel(summaryStats.avgTrust)}</span></td>
                  </tr>
                  <tr className="liquid-transition hover:bg-[var(--bg-secondary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3"><span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Transparency</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-lg" style={{ fontSize: '0.75rem', fontWeight: 600, background: `${getScoreColor(summaryStats.avgTransparency)}15`, color: getScoreColor(summaryStats.avgTransparency) }}>
                        {summaryStats.avgTransparency.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getScoreLabel(summaryStats.avgTransparency)}</span></td>
                  </tr>
                  <tr className="liquid-transition hover:bg-[var(--bg-secondary)]" style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3"><span style={{ fontSize: '0.8125rem', fontWeight: 500 }}>Usefulness</span></td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-1 rounded-lg" style={{ fontSize: '0.75rem', fontWeight: 600, background: `${getScoreColor(summaryStats.avgQuality)}15`, color: getScoreColor(summaryStats.avgQuality) }}>
                        {summaryStats.avgQuality.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center"><span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{getScoreLabel(summaryStats.avgQuality)}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
