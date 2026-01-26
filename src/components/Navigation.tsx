import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";

interface NavigationProps {
  currentPage: 'main' | 'dashboard' | 'features' | 'documentation' | 'support';
  onNavigate: (page: 'main' | 'dashboard' | 'features' | 'documentation' | 'support') => void;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Navigation({ currentPage, onNavigate, theme, onThemeToggle }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { label: 'Features', page: 'features' as const },
    { label: 'Dashboard', page: 'dashboard' as const },
    { label: 'Docs', page: 'documentation' as const },
    { label: 'Support', page: 'support' as const },
  ];

  return (
    <nav className="border-b fixed top-0 left-0 right-0 z-50" 
      style={{ 
        borderColor: scrolled ? 'var(--border-color)' : 'transparent',
        backgroundColor: 'var(--bg-primary)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: scrolled ? '0 1px 0 0 var(--border-color)' : 'none'
      }}
    >
      <div className="h-11 px-5 flex items-center justify-between max-w-[980px] mx-auto">
        {/* Logo */}
        <button 
          onClick={() => onNavigate('main')}
          className="relative group"
          style={{
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <span style={{ 
            fontWeight: 590, 
            fontSize: '1.125rem', 
            letterSpacing: '-0.022em',
            color: 'var(--text-primary)',
            transition: 'opacity 0.2s ease'
          }}
          className="group-hover:opacity-70">
            PromptLens
          </span>
        </button>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item, index) => {
            const isActive = item.page === currentPage;
            return (
              <button
                key={index}
                onClick={() => onNavigate(item.page)}
                className="relative group py-1"
                style={{
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <span style={{ 
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 500 : 400,
                  letterSpacing: '-0.006em',
                  transition: 'all 0.2s ease'
                }}
                className="group-hover:opacity-70">
                  {item.label}
                </span>
                {isActive && (
                  <div 
                    className="absolute -bottom-1 left-1/2 w-1 h-1 rounded-full"
                    style={{
                      backgroundColor: 'var(--text-primary)',
                      transform: 'translateX(-50%)',
                      opacity: 0.8
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onThemeToggle}
            className="p-2 rounded-full relative group"
            style={{ 
              color: 'var(--text-secondary)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            aria-label="Toggle theme"
          >
            <div className="group-hover:opacity-70 group-active:scale-90" style={{ transition: 'all 0.15s ease' }}>
              {theme === 'light' ? <Moon size={14} strokeWidth={2} /> : <Sun size={14} strokeWidth={2} />}
            </div>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-full relative group"
            style={{ 
              color: 'var(--text-primary)',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            aria-label="Toggle menu"
          >
            <div className="group-hover:opacity-70 group-active:scale-90" style={{ transition: 'all 0.15s ease' }}>
              {isMenuOpen ? <X size={15} strokeWidth={2} /> : <Menu size={15} strokeWidth={2} />}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div 
          className="md:hidden border-t"
          style={{ 
            borderColor: 'var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            animation: 'slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="px-5 py-2">
            {menuItems.map((item, index) => {
              const isActive = item.page === currentPage;
              return (
                <button
                  key={index}
                  onClick={() => {
                    onNavigate(item.page);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-3 border-b last:border-b-0 active:opacity-50"
                  style={{ 
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 500 : 400,
                    borderColor: 'var(--border-color)',
                    letterSpacing: '-0.011em',
                    transition: 'all 0.2s ease',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {item.label}
                  {isActive && (
                    <div 
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--text-primary)',
                        opacity: 0.8
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}