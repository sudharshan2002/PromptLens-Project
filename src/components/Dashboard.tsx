import { AnalyticsCard } from "./AnalyticsCard";
import { TrustChart } from "./TrustChart";
import { SegmentChart } from "./SegmentChart";
import { ActivityTable } from "./ActivityTable";
import { BarChart3 } from "lucide-react";

export function Dashboard() {
  return (
    <div className="flex-1 px-8 py-32 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 fade-in-up">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-primary)' }}>
              <BarChart3 size={20} style={{ color: '#ffffff' }} strokeWidth={2} />
            </div>
            <h2 
              style={{ fontWeight: 700, fontSize: '2rem', letterSpacing: '-0.03em' }}
            >
              Dashboard Analytics
            </h2>
          </div>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
            Track your AI prompt performance and insights
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <AnalyticsCard 
            title="Average Trust Score" 
            value="84.2%" 
            subtitle="+5.3% from last week"
            delay={0}
          />
          <AnalyticsCard 
            title="Explanation Clarity Score" 
            value="89.7%" 
            subtitle="+2.1% from last week"
            delay={0.1}
          />
          <AnalyticsCard 
            title="Total Prompts Generated" 
            value="1,247" 
            subtitle="+18% from last week"
            delay={0.2}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <TrustChart />
          <SegmentChart />
        </div>

        <div>
          <h3 
            style={{ fontWeight: 600, fontSize: '1.25rem', letterSpacing: '-0.02em' }}
            className="mb-6"
          >
            Recent Activity
          </h3>
          <ActivityTable />
        </div>
      </div>
    </div>
  );
}
