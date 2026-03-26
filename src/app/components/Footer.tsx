import { useNavigate } from "react-router";
import { FadeIn } from "./AnimatedText";
import { GrainLocal } from "./GrainOverlay";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const HoverNavLink = ({ label, path }: { label: string; path: string }) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(path)}
      className="group relative block text-left bg-transparent border-none cursor-pointer p-0 w-full"
      style={{
        fontFamily: "Inter, sans-serif",
        fontWeight: 900,
        fontSize: "clamp(2rem, 3vw, 3.5rem)",
        color: "#050505",
        textTransform: "uppercase",
        letterSpacing: "-0.04em",
        lineHeight: "0.98",
        padding: "8px 0",
      }}
    >
      <div className="relative overflow-hidden inline-flex w-full" style={{ paddingBottom: 8 }}>
        <div className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full will-change-transform">
          {label}
        </div>
        <div className="absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-full group-hover:translate-y-0 will-change-transform">
          {label}
        </div>
      </div>
    </button>
  );
};

const HoverSmallLink = ({
  num,
  label,
  href,
  path,
}: {
  num: string;
  label: string;
  href?: string;
  path?: string;
}) => {
  const navigate = useNavigate();

  const content = (
    <>
      <div
         className="absolute inset-0 bg-[#D1FF00] origin-left scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 will-change-transform"
         style={{ zIndex: 0 }}
      />
      <div className="relative z-10 flex items-center gap-5 w-full transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:text-[#050505]">
        <span className="opacity-40 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100" style={{ minWidth: 28 }}>{num}</span>
        <span className="transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5 will-change-transform">{label}</span>
      </div>
    </>
  );

  const sharedProps = {
    className: "group relative flex items-center gap-5 no-underline overflow-hidden -mx-2 px-2 py-1.5 w-full bg-transparent border-none text-left cursor-pointer",
    style: {
      fontFamily: "'Roboto Mono', monospace",
      textTransform: "uppercase" as const,
      letterSpacing: "0.05em",
      fontSize: 10,
      fontWeight: 600,
      textDecoration: "none",
      color: "rgba(5,5,5,0.6)",
    },
  };

  if (path) {
    return (
      <button type="button" onClick={() => navigate(path)} {...sharedProps}>
        {content}
      </button>
    );
  }

  return (
    <a href={href ?? "#"} {...sharedProps}>
      {content}
    </a>
  );
};

const navLinks = [
  { label: "HOME", path: "/" },
  { label: "COMPOSER", path: "/composer" },
  { label: "WHAT-IF STUDIO", path: "/what-if" },
  { label: "TRUST DASHBOARD", path: "/dashboard" },
  { label: "CONTACT", path: "/contact" },
];

const socials = [
  { num: "1.0", label: "X / TWITTER" },
  { num: "1.1", label: "LINKEDIN" },
  { num: "1.2", label: "INSTAGRAM" },
  { num: "1.3", label: "YOUTUBE" },
];

const legalLinks = [
  { num: "2.0", label: "ACCEPTABLE USE POLICY", path: "/legal/acceptable-use-policy" },
  { num: "2.1", label: "PRIVACY POLICY", path: "/legal/privacy-policy" },
  { num: "2.2", label: "TERMS & CONDITIONS", path: "/legal/terms-conditions" },
  { num: "2.3", label: "COOKIES", path: "/legal/cookie-policy" },
];

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden" style={{ backgroundColor: "#F4F4E8" }}>
      <GrainLocal opacity={0.03} />

      <div className="mx-auto relative z-10 w-full" style={{ maxWidth: 1920, padding: "0 clamp(20px, 3vw, 48px)" }}>
        
        {/* Visible vertical grid lines ensuring strict alignment */}
        <div className="absolute inset-0 pointer-events-none hidden md:flex" style={{ padding: "0 clamp(20px, 3vw, 48px)" }}>
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4 border-r border-[#000000] opacity-[0.04]" />
          <div className="w-1/4" />
        </div>



        {/* ======================= */}
        {/* PRE-FOOTER (Newsletter) */}
        {/* ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 w-full pt-16 pb-16 gap-y-12 relative z-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          {/* Column 1: Newsletter Text */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col items-start">
            <FadeIn>
              <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.5, marginBottom: 16 }}>[13] FOOTER</div>
            </FadeIn>
            <FadeIn delay={0.05}>
              <h2 style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: "clamp(2rem, 3vw, 2.5rem)", letterSpacing: "-0.04em", color: "#050505", margin: "0 0 16px 0", lineHeight: 1 }}>
                FRIGATE NOTES
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#050505", opacity: 0.6, margin: 0, lineHeight: "150%", maxWidth: 320 }}>
               Product updates, explainability patterns, and prompt intelligence research for teams building with AI.
              </p>
            </FadeIn>
          </div>

          {/* Column 2: Name Input */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col">
            <FadeIn delay={0.15}>
              <label style={{ ...mono, fontSize: 9, color: "#050505", fontWeight: 600, display: "block", marginBottom: 8 }}>NAME*</label>
              <input 
                type="text" 
                placeholder="Jane Smith"
                className="w-full bg-[#EAEADF] border-none outline-none focus:bg-[#E0E0D5] transition-colors duration-300"
                style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 13, padding: "16px", color: "#050505" }}
              />
            </FadeIn>
            <FadeIn delay={0.2} className="mt-4">
              <div className="flex items-start gap-3">
                <input type="checkbox" className="mt-0.5 cursor-pointer" style={{ accentColor: "#050505" }} />
                <p style={{ ...mono, fontSize: 8, color: "#050505", opacity: 0.5, margin: 0, lineHeight: "160%" }}>
                  BY SUBMITTING, YOU AGREE TO RECEIVE FRIGATE UPDATES AND TO OUR PRIVACY TERMS.
                </p>
              </div>
            </FadeIn>
          </div>

          {/* Column 3: Email Input */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col">
            <FadeIn delay={0.2}>
              <label style={{ ...mono, fontSize: 9, color: "#050505", fontWeight: 600, display: "block", marginBottom: 8 }}>EMAIL*</label>
              <input 
                type="email" 
                placeholder="Jane@company.com"
                className="w-full bg-[#EAEADF] border-none outline-none focus:bg-[#E0E0D5] transition-colors duration-300"
                style={{ fontFamily: "'Roboto Mono', monospace", fontSize: 13, padding: "16px", color: "#050505" }}
              />
            </FadeIn>
          </div>

          {/* Column 4: Subscribe CTA */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col">
            <FadeIn delay={0.25}>
              {/* Invisible spacer to match label height (font-size 9 + margin 8 = ~20px) */}
              <div style={{ ...mono, fontSize: 9, marginBottom: 8, visibility: "hidden" }}>SPACER</div>
              <button 
                className="w-full bg-[#050505] text-white flex items-center justify-between border-none cursor-pointer group transition-all duration-300 hover:brightness-125"
                style={{ padding: "15px 20px", borderBottom: "4px solid #D1FF00" }}
              >
                <span style={{ ...mono, fontSize: 11, fontWeight: 700 }}>GET UPDATES</span>
                <span style={{ color: "#D1FF00", fontFamily: "monospace", fontSize: 16 }}>&gt;</span>
              </button>
            </FadeIn>
          </div>
        </div>

        {/* ======================= */}
        {/* PRE-FOOTER (Contact)    */}
        {/* ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 w-full pt-16 pb-24 gap-y-12 relative z-10" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col items-start gap-5">
            <FadeIn delay={0.1}>
              <img 
                src="/logo/dark%20full%20logo.png" 
                alt="Frigate Logo" 
                style={{ height: 20, width: "auto" }} 
              />
            </FadeIn>
            <FadeIn delay={0.15}>
              <p style={{ ...mono, fontSize: 9, color: "#050505", opacity: 0.5, margin: 0, lineHeight: "170%" }}>
                EXPLAINABLE AI PLATFORM<br />
                BUILT FOR TEXT + IMAGE
              </p>
            </FadeIn>
          </div>

          {/* Column 2: Empty Spacer */}
          <div className="hidden md:block col-span-1 pr-6" />

          {/* Column 3: Contact Info */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col items-start gap-4">
            <FadeIn delay={0.2}>
              <div style={{ ...mono, fontSize: 12, fontWeight: 600, color: "#050505" }}>
                PRODUCT TEAM
              </div>
            </FadeIn>
            <FadeIn delay={0.25}>
              <div 
                className="inline-block bg-[#D1FF00]"
                style={{ padding: "4px 8px", marginLeft: "-8px" }}
              >
                <a
                  href="mailto:HELLO@FRIGATE.AI"
                  style={{
                    ...mono,
                    fontSize: "clamp(0.95rem, 2.8vw, 1.125rem)",
                    fontWeight: 900,
                    color: "#050505",
                    textDecoration: "none",
                    overflowWrap: "anywhere"
                  }}
                >
                  HELLO@FRIGATE.AI
                </a>
              </div>
            </FadeIn>
          </div>

          {/* Column 4: Empty Spacer */}
          <div className="hidden md:block col-span-1 pr-6" />
        </div>

        {/* ======================= */}
        {/* FOOTER (Navigation)     */}
        {/* ======================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 w-full pt-24 pb-24 gap-y-16 relative z-10">
          
          {/* Column 1: Margin / Logo area (Empty at top) */}
          <div className="hidden md:block col-span-1 pr-6" />

          {/* Column 2: Navigation strictly bounded */}
          <div className="col-span-1 pr-0 md:pr-6 flex flex-col items-start">
            <FadeIn>
              <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 32 }}>[NAVIGATION]</div>
            </FadeIn>
            <div className="flex flex-col gap-0 w-full overflow-visible">
              {navLinks.map((link, i) => (
                <FadeIn key={link.label} delay={0.05 + i * 0.03} className="w-full">
                  <HoverNavLink label={link.label} path={link.path} />
                </FadeIn>
              ))}
            </div>
          </div>

          {/* Column 3: Empty breathing space */}
          <div className="hidden md:block col-span-1 pr-6" />

          {/* Column 4: Socials + Legal firmly left-aligned in col 4 */}
          <div className="col-span-1 flex flex-col gap-12 items-start">
            <div className="flex flex-col gap-1 w-full">
              <FadeIn delay={0.1}>
                <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 16 }}>[SOCIALS]</div>
              </FadeIn>
              {socials.map((s, i) => (
                <FadeIn key={s.num} delay={0.12 + i * 0.03}>
                  <HoverSmallLink num={s.num} label={s.label} href="#" />
                </FadeIn>
              ))}
            </div>

            <div className="flex flex-col gap-1 w-full">
              <FadeIn delay={0.15}>
                <div style={{ ...mono, fontSize: 10, color: "#050505", opacity: 0.4, marginBottom: 16 }}>[LEGAL]</div>
              </FadeIn>
              {legalLinks.map((l, i) => (
                <FadeIn key={l.num} delay={0.17 + i * 0.03}>
                  <HoverSmallLink num={l.num} label={l.label} path={l.path} />
                </FadeIn>
              ))}
            </div>
          </div>
        </div>

        {/* EXACT Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 w-full items-end pt-8 pb-12 gap-y-8 relative z-10" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
          {/* Logo strictly spanning Cols 1 and 2 */}
          <div className="col-span-1 md:col-span-2 pr-0 md:pr-6">
            <FadeIn delay={0.15}>
              <img 
                src="/logo/dark%20full%20logo.png" 
                alt="Frigate Logo" 
                className="w-full h-auto object-contain object-left" 
                style={{ maxHeight: "20vh", maxWidth: 560, display: "block" }} 
              />
            </FadeIn>
          </div>

          {/* Col 3: empty */}
          <div className="hidden md:block col-span-1 pr-6" />

          {/* Copyright perfectly right-aligned inside Col 4 */}
          <div className="col-span-1 flex flex-col justify-end text-left md:text-right">
            <FadeIn delay={0.2}>
              <p style={{ fontFamily: "Inter, sans-serif", fontSize: 9, color: "#050505", opacity: 0.35, lineHeight: "170%", margin: "0 0 12px 0" }}>
                &copy; 2026 Frigate, Inc. All rights reserved. FRIGATE is a registered trademark of Frigate, Inc. Built for explainability, control, and trust.
              </p>
              <div style={{ ...mono, fontSize: 8, color: "#050505", opacity: 0.25 }}>
                v2.4.1
              </div>
            </FadeIn>
          </div>
        </div>

      </div>
    </footer>
  );
}
