import { Sparkles, Zap, Shield, TrendingUp, Brain, LineChart, Target, Layers } from "lucide-react";

export function FeaturesPage() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Deep semantic understanding of your prompts with advanced machine learning models.",
      details: "Our AI engine analyzes prompt structure, context, and intent to provide actionable insights."
    },
    {
      icon: Zap,
      title: "Real-time Insights",
      description: "Instant feedback on prompt quality and effectiveness as you type.",
      details: "Get immediate suggestions and improvements without waiting for batch processing."
    },
    {
      icon: Shield,
      title: "Trust Metrics",
      description: "Comprehensive trust scores and reliability indicators for AI outputs.",
      details: "Understand confidence levels and potential biases in AI-generated responses."
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Monitor prompt performance over time with detailed analytics.",
      details: "Track improvements and identify patterns in your prompt engineering workflow."
    },
    {
      icon: Brain,
      title: "Semantic Segmentation",
      description: "Automatically break down prompts into meaningful components.",
      details: "Visualize how different parts of your prompt contribute to the final output."
    },
    {
      icon: LineChart,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards with metrics that matter.",
      details: "Dive deep into prompt performance with customizable charts and reports."
    },
    {
      icon: Target,
      title: "What-If Scenarios",
      description: "Experiment with different prompt variations and compare results.",
      details: "Test hypothetical changes before committing to production prompts."
    },
    {
      icon: Layers,
      title: "Version Control",
      description: "Track changes and maintain a history of your prompt iterations.",
      details: "Never lose a working prompt variation with built-in version management."
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      {/* Hero Section */}
      <div className="px-6 py-24 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <h1 
            className="mb-5"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2.5rem, 7vw, 4rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: '1.05'
            }}
          >
            Powerful features for<br />prompt engineering
          </h1>
          <p 
            className="max-w-2xl mx-auto"
            style={{ 
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              fontWeight: 400,
              letterSpacing: '-0.011em'
            }}
          >
            Everything you need to understand, optimize, and trust your AI prompts
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                }}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)',
                    transition: 'transform 0.3s ease'
                  }}
                >
                  <feature.icon size={24} style={{ color: '#ffffff' }} strokeWidth={2} />
                </div>
                <h3 
                  className="mb-3"
                  style={{ 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em'
                  }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="mb-4"
                  style={{ 
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6',
                    fontWeight: 400
                  }}
                >
                  {feature.description}
                </p>
                <p 
                  style={{ 
                    fontSize: '0.875rem',
                    color: 'var(--text-tertiary)',
                    lineHeight: '1.6',
                    fontWeight: 400
                  }}
                >
                  {feature.details}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="px-6 py-24 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="mb-4"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em'
            }}
          >
            Ready to get started?
          </h2>
          <p 
            className="mb-10"
            style={{ 
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              fontWeight: 400
            }}
          >
            Start optimizing your prompts today with PromptLens
          </p>
          <button
            className="px-6 py-3 rounded-full"
            style={{ 
              background: 'var(--accent-primary)',
              color: '#ffffff',
              fontSize: '1.0625rem',
              fontWeight: 400,
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              letterSpacing: '-0.011em'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            Get started
          </button>
        </div>
      </div>
    </div>
  );
}
