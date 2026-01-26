import { Mail, MessageCircle, Book, HelpCircle, Clock, CheckCircle } from "lucide-react";

export function SupportPage() {
  const faqs = [
    {
      question: "How does PromptLens analyze prompts?",
      answer: "PromptLens uses advanced machine learning models to perform semantic analysis on your prompts. It breaks down the prompt into segments, evaluates context and intent, and provides trust metrics based on various factors including clarity, specificity, and potential biases."
    },
    {
      question: "What are trust metrics?",
      answer: "Trust metrics are confidence scores that indicate the reliability and quality of AI-generated outputs. They include factors like consistency, bias detection, and output variability to help you understand how much you can trust the results."
    },
    {
      question: "Can I use PromptLens with any AI model?",
      answer: "Yes, PromptLens is model-agnostic and works with any text-based AI model. Whether you're using GPT, Claude, or custom models, PromptLens can analyze and optimize your prompts."
    },
    {
      question: "How does the What-If analysis work?",
      answer: "The What-If analysis feature allows you to experiment with different prompt variations before committing changes. You can add, remove, or modify elements and see predicted outcomes based on historical data and analysis patterns."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use industry-standard encryption for all data transmission and storage. Your prompts and analysis results are never shared with third parties, and you maintain full ownership of your data."
    },
    {
      question: "What's the difference between the free and paid plans?",
      answer: "The free plan includes basic prompt analysis and limited monthly requests. Paid plans offer advanced features like What-If scenarios, team collaboration, API access, and priority support with higher rate limits."
    }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help via email",
      contact: "support@promptlens.ai",
      responseTime: "Within 24 hours"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team",
      contact: "Available 9am-5pm EST",
      responseTime: "Instant response"
    },
    {
      icon: Book,
      title: "Documentation",
      description: "Browse our docs",
      contact: "Comprehensive guides",
      responseTime: "Always available"
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
            How can we help?
          </h1>
          <p 
            className="max-w-2xl mx-auto mb-10"
            style={{ 
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5',
              fontWeight: 400,
              letterSpacing: '-0.011em'
            }}
          >
            Get the support you need to make the most of PromptLens
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div 
              className="flex items-center gap-3 px-5 py-4 rounded-full border"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                borderColor: 'var(--border-color)'
              }}
            >
              <HelpCircle size={20} style={{ color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                placeholder="Search for help..."
                className="flex-1 bg-transparent outline-none"
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Methods */}
      <div className="px-6 py-20 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 
            className="text-center mb-12"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em'
            }}
          >
            Get in touch
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <div
                key={index}
                className="p-8 rounded-2xl border text-center"
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
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-5"
                  style={{ 
                    backgroundColor: 'var(--accent-primary)'
                  }}
                >
                  <method.icon size={24} style={{ color: '#ffffff' }} strokeWidth={2} />
                </div>
                <h3 
                  className="mb-2"
                  style={{ 
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.015em'
                  }}
                >
                  {method.title}
                </h3>
                <p 
                  className="mb-3"
                  style={{ 
                    fontSize: '0.9375rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.6'
                  }}
                >
                  {method.description}
                </p>
                <p 
                  className="mb-2"
                  style={{ 
                    fontSize: '0.9375rem',
                    color: 'var(--text-primary)',
                    fontWeight: 500
                  }}
                >
                  {method.contact}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Clock size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span 
                    style={{ 
                      fontSize: '0.8125rem',
                      color: 'var(--text-tertiary)'
                    }}
                  >
                    {method.responseTime}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 
            className="text-center mb-12"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em'
            }}
          >
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl border"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-color)'
                }}
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                    style={{ 
                      backgroundColor: 'var(--accent-primary)'
                    }}
                  >
                    <CheckCircle size={16} style={{ color: '#ffffff' }} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <h3 
                      className="mb-3"
                      style={{ 
                        fontWeight: 600,
                        fontSize: '1.125rem',
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.015em'
                      }}
                    >
                      {faq.question}
                    </h3>
                    <p 
                      style={{ 
                        fontSize: '0.9375rem',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.7',
                        fontWeight: 400
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="px-6 py-20 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            className="mb-4"
            style={{ 
              fontWeight: 600,
              fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em'
            }}
          >
            Still have questions?
          </h2>
          <p 
            className="mb-8"
            style={{ 
              fontSize: '1.0625rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.5'
            }}
          >
            Our team is here to help you succeed
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
            Contact support
          </button>
        </div>
      </div>
    </div>
  );
}
