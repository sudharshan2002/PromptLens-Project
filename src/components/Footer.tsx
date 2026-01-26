export function Footer() {
  const footerSections = [
    {
      title: 'Product',
      links: ['Features', 'Dashboard', 'Analytics', 'Pricing']
    },
    {
      title: 'Resources',
      links: ['Documentation', 'API Reference', 'Guides', 'Support']
    },
    {
      title: 'Company',
      links: ['About', 'Blog', 'Careers', 'Contact']
    },
    {
      title: 'Legal',
      links: ['Privacy', 'Terms', 'License', 'Security']
    }
  ];

  return (
    <footer 
      className="border-t mt-auto apple-transition"
      style={{ 
        background: 'var(--bg-secondary)',
        borderColor: 'var(--border-color)'
      }}
    >
      <div className="max-w-7xl mx-auto px-8 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Section */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <div className="mb-4">
              <h3 
                style={{ 
                  fontWeight: 600,
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.01em'
                }}
              >
                PromptLens
              </h3>
            </div>
            <p 
              style={{ 
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}
            >
              Understanding AI, one prompt at a time.
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section, index) => (
            <div key={index} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              <h4 
                className="mb-4"
                style={{ 
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em'
                }}
              >
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <button
                      className="apple-transition hover:opacity-70 hover:translate-x-0.5 text-left"
                      style={{ 
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        fontWeight: 400
                      }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div 
          className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4"
          style={{ borderColor: 'var(--border-color)' }}
        >
          <p 
            style={{ 
              fontSize: '0.6875rem',
              color: 'var(--text-tertiary)',
              fontWeight: 400
            }}
          >
            © 2025 PromptLens. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <button
              className="apple-transition hover:opacity-70"
              style={{ 
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                fontWeight: 400
              }}
            >
              Privacy Policy
            </button>
            <button
              className="apple-transition hover:opacity-70"
              style={{ 
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                fontWeight: 400
              }}
            >
              Terms of Service
            </button>
            <button
              className="apple-transition hover:opacity-70"
              style={{ 
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                fontWeight: 400
              }}
            >
              Cookie Settings
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}