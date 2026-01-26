import { Book, Code, Terminal, Zap, FileText, Settings } from "lucide-react";
import { useState } from "react";

export function DocumentationPage() {
  const [activeSection, setActiveSection] = useState("getting-started");

  const sections = [
    { id: "getting-started", label: "Getting Started", icon: Zap },
    { id: "api-reference", label: "API Reference", icon: Code },
    { id: "guides", label: "Guides", icon: Book },
    { id: "examples", label: "Examples", icon: FileText },
    { id: "cli", label: "CLI", icon: Terminal },
    { id: "configuration", label: "Configuration", icon: Settings }
  ];

  const content: Record<string, { title: string; sections: { heading: string; content: string; code?: string }[] }> = {
    "getting-started": {
      title: "Getting Started",
      sections: [
        {
          heading: "Introduction",
          content: "PromptLens is a powerful tool for analyzing and optimizing AI prompts. This guide will help you get started with the basics."
        },
        {
          heading: "Installation",
          content: "Install PromptLens using npm, yarn, or pnpm:",
          code: "npm install promptlens\n# or\nyarn add promptlens\n# or\npnpm add promptlens"
        },
        {
          heading: "Quick Start",
          content: "Here's a simple example to get you started:",
          code: "import { PromptLens } from 'promptlens';\n\nconst lens = new PromptLens({\n  apiKey: 'your-api-key'\n});\n\nconst result = await lens.analyze({\n  prompt: 'Generate a product description'\n});\n\nconsole.log(result.insights);"
        }
      ]
    },
    "api-reference": {
      title: "API Reference",
      sections: [
        {
          heading: "PromptLens Class",
          content: "The main class for interacting with PromptLens.",
          code: "class PromptLens {\n  constructor(options: PromptLensOptions)\n  analyze(prompt: AnalyzeRequest): Promise<AnalyzeResponse>\n  compare(prompts: CompareRequest): Promise<CompareResponse>\n  track(event: TrackingEvent): Promise<void>\n}"
        },
        {
          heading: "analyze()",
          content: "Analyzes a single prompt and returns insights.",
          code: "interface AnalyzeRequest {\n  prompt: string;\n  options?: {\n    depth?: 'basic' | 'detailed';\n    metrics?: string[];\n  };\n}"
        },
        {
          heading: "compare()",
          content: "Compares multiple prompt variations.",
          code: "interface CompareRequest {\n  prompts: string[];\n  baseline?: string;\n  metrics?: string[];\n}"
        }
      ]
    },
    "guides": {
      title: "Guides",
      sections: [
        {
          heading: "Writing Effective Prompts",
          content: "Learn best practices for crafting prompts that produce reliable results. Start with clear objectives, use specific language, and provide context."
        },
        {
          heading: "Understanding Trust Metrics",
          content: "Trust metrics help you evaluate the reliability of AI outputs. Learn how to interpret confidence scores, consistency ratings, and bias indicators."
        },
        {
          heading: "Advanced Analysis Techniques",
          content: "Discover advanced features like semantic segmentation, what-if scenarios, and performance tracking to optimize your workflow."
        }
      ]
    },
    "examples": {
      title: "Examples",
      sections: [
        {
          heading: "Basic Prompt Analysis",
          code: "const result = await lens.analyze({\n  prompt: 'Write a blog post about AI'\n});\n\nconsole.log(result.trustScore);\nconsole.log(result.segments);"
        },
        {
          heading: "Comparing Variations",
          code: "const comparison = await lens.compare({\n  prompts: [\n    'Write a blog post about AI',\n    'Create an article discussing AI',\n    'Draft a blog entry on artificial intelligence'\n  ]\n});\n\nconsole.log(comparison.rankings);"
        },
        {
          heading: "What-If Analysis",
          code: "const whatIf = await lens.whatIf({\n  basePrompt: 'Generate product ideas',\n  variations: [\n    { type: 'add', value: 'for tech startups' },\n    { type: 'modify', field: 'tone', value: 'professional' }\n  ]\n});\n\nconsole.log(whatIf.predictions);"
        }
      ]
    },
    "cli": {
      title: "Command Line Interface",
      sections: [
        {
          heading: "Installation",
          content: "Install the PromptLens CLI globally:",
          code: "npm install -g promptlens-cli"
        },
        {
          heading: "Basic Commands",
          code: "# Analyze a prompt\nplens analyze \"your prompt here\"\n\n# Compare prompts\nplens compare prompt1.txt prompt2.txt\n\n# Run what-if analysis\nplens whatif --base \"base prompt\" --add \"modification\"\n\n# View analytics\nplens dashboard"
        },
        {
          heading: "Configuration",
          content: "Configure the CLI with your API credentials:",
          code: "plens config set apiKey YOUR_API_KEY\nplens config set endpoint https://api.promptlens.ai"
        }
      ]
    },
    "configuration": {
      title: "Configuration",
      sections: [
        {
          heading: "Environment Variables",
          content: "Configure PromptLens using environment variables:",
          code: "PROMPTLENS_API_KEY=your-api-key\nPROMPTLENS_ENDPOINT=https://api.promptlens.ai\nPROMPTLENS_TIMEOUT=30000"
        },
        {
          heading: "Configuration File",
          content: "Create a promptlens.config.js file in your project root:",
          code: "module.exports = {\n  apiKey: process.env.PROMPTLENS_API_KEY,\n  endpoint: 'https://api.promptlens.ai',\n  timeout: 30000,\n  retries: 3,\n  cache: {\n    enabled: true,\n    ttl: 3600\n  }\n};"
        },
        {
          heading: "Runtime Configuration",
          content: "Override settings at runtime:",
          code: "const lens = new PromptLens({\n  apiKey: 'your-api-key',\n  timeout: 60000,\n  retries: 5\n});"
        }
      ]
    }
  };

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="mb-16">
          <h1 
            className="mb-4"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2.5rem, 7vw, 4rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              lineHeight: '1.05'
            }}
          >
            Documentation
          </h1>
          <p 
            style={{ 
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              fontWeight: 400
            }}
          >
            Everything you need to know about using PromptLens
          </p>
        </div>

        {/* Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left"
                  style={{
                    backgroundColor: activeSection === section.id ? 'var(--bg-secondary)' : 'transparent',
                    color: activeSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    borderLeft: activeSection === section.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                    fontSize: '0.9375rem',
                    fontWeight: activeSection === section.id ? 500 : 400,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeSection !== section.id) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <section.icon size={18} strokeWidth={2} />
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-12">
              <h2 
                style={{ 
                  fontWeight: 600,
                  fontSize: '2rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  marginBottom: '2rem'
                }}
              >
                {content[activeSection].title}
              </h2>

              {content[activeSection].sections.map((section, index) => (
                <div key={index} className="space-y-4">
                  <h3 
                    style={{ 
                      fontWeight: 600,
                      fontSize: '1.5rem',
                      color: 'var(--text-primary)',
                      letterSpacing: '-0.015em'
                    }}
                  >
                    {section.heading}
                  </h3>
                  <p 
                    style={{ 
                      fontSize: '0.9375rem',
                      color: 'var(--text-secondary)',
                      lineHeight: '1.7',
                      fontWeight: 400
                    }}
                  >
                    {section.content}
                  </p>
                  {section.code && (
                    <pre 
                      className="p-5 rounded-xl overflow-x-auto"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.875rem',
                        lineHeight: '1.7'
                      }}
                    >
                      <code style={{ color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>
                        {section.code}
                      </code>
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
