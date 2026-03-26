import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import {
  Send, Sparkles, Zap, Eye, RefreshCw, Copy, Bookmark, Clock, ArrowRight, Play
} from "lucide-react";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const mockSegments = [
  { text: "A cinematic", influence: 0.8, color: "#D1FF00" },
  { text: "landscape photograph", influence: 0.95, color: "#7DFFAF" },
  { text: "of a misty mountain", influence: 0.92, color: "#FF7D7D" },
  { text: "at golden hour", influence: 0.75, color: "#7DB5FF" },
  { text: "with dramatic lighting", influence: 0.88, color: "#FFB87D" },
];

const mockExplanations = [
  { segment: "cinematic", impact: "Applied wide aspect ratio, film grain, and depth of field" },
  { segment: "landscape photograph", impact: "Set composition to wide-angle, horizon-dominant framing" },
  { segment: "misty mountain", impact: "Generated volumetric fog, peak silhouettes, layered depth" },
  { segment: "golden hour", impact: "Warm color temperature (3200K), low sun angle, long shadows" },
  { segment: "dramatic lighting", impact: "Increased contrast, added rim lighting, enhanced specular highlights" },
];

const mockSuggestions = [
  "Add 'volumetric rays' for depth",
  "Try 'aerial perspective' for scale",
  "Consider 'moody atmosphere'",
];

const mockHistory = [
  { id: 1, prompt: "A minimalist logo for a tech startup", time: "2 min ago", confidence: 87 },
  { id: 2, prompt: "A futuristic cityscape at night with neon", time: "8 min ago", confidence: 92 },
  { id: 3, prompt: "Product photo of headphones on marble", time: "15 min ago", confidence: 78 },
];

function ConfidenceMeter({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span style={{ ...mono, fontSize: 8, color: "#686868" }}>{label}</span>
        <span style={{ ...mono, fontSize: 8, color: "#D1FF00" }}>{value}%</span>
      </div>
      <div style={{ height: 2, backgroundColor: "#9C9C9C12", borderRadius: 1, overflow: "hidden" }}>
        <motion.div
          style={{ height: "100%", backgroundColor: "#D1FF00", borderRadius: 1 }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease }}
        />
      </div>
    </div>
  );
}

export function ComposerPage() {
  const [prompt, setPrompt] = useState("A cinematic landscape photograph of a misty mountain at golden hour with dramatic lighting");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasOutput, setHasOutput] = useState(true);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [activePanel, setActivePanel] = useState<"explain" | "insights" | "history">("explain");

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setHasOutput(false);
    setTimeout(() => {
      setIsGenerating(false);
      setHasOutput(true);
    }, 2000);
  };

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#F5F4E7", paddingTop: 64 }}>
      <GrainLocal opacity={0.03} />

      {/* Composer header */}
      <motion.div
        className="relative z-10 flex items-center justify-between"
        style={{ padding: "10px clamp(20px, 3vw, 40px)", borderBottom: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        <div className="flex items-center gap-4">
          <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>Composer</span>
          <div style={{ width: 1, height: 14, backgroundColor: "#9C9C9C18" }} />
          <span style={{ ...mono, fontSize: 9, color: "#686868" }}>Session #847</span>
        </div>
        <div className="flex items-center gap-1">
          {(["explain", "insights", "history"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setActivePanel(p)}
              className="cursor-pointer border-none"
              style={{
                ...mono, fontSize: 8,
                color: activePanel === p ? "#1A3D1A" : "#686868",
                backgroundColor: activePanel === p ? "#D1FF0030" : "transparent",
                padding: "5px 10px", borderRadius: 3,
                transition: "all 0.2s ease-out",
              }}
              onMouseEnter={(e) => { if (activePanel !== p) e.currentTarget.style.color = "#050505"; }}
              onMouseLeave={(e) => { if (activePanel !== p) e.currentTarget.style.color = "#686868"; }}
            >
              {p}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Main workspace */}
      <div className="relative z-10 flex flex-col lg:flex-row" style={{ minHeight: "calc(100vh - 108px)" }}>
        {/* Left: prompt + output */}
        <div className="flex-1 flex flex-col" style={{ borderRight: "1px solid #00000008" }}>
          {/* Prompt area */}
          <motion.div
            style={{ padding: "20px clamp(20px, 3vw, 32px)", borderBottom: "1px solid #00000008" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={11} style={{ color: "#1A3D1A" }} />
              <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Prompt Input</span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full outline-none resize-none"
              placeholder="Describe what you want to generate..."
              style={{
                fontFamily: "Inter, sans-serif", fontSize: 15,
                color: "#050505", backgroundColor: "transparent", border: "none", lineHeight: "170%",
              }}
            />
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <div className="flex flex-wrap gap-2">
                {mockSuggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(prompt + ". " + s.replace(/^(Add|Try|Consider) '/, "").replace("'.*", ""))}
                    className="cursor-pointer border-none"
                    style={{
                      ...mono, fontSize: 7, color: "#686868",
                      backgroundColor: "#9C9C9C0A", padding: "4px 10px", borderRadius: 3,
                      border: "1px solid #9C9C9C10",
                      transition: "color 0.2s, border-color 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#D1FF00"; e.currentTarget.style.borderColor = "#D1FF0030"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#686868"; e.currentTarget.style.borderColor = "#9C9C9C10"; }}
                  >
                    + {s}
                  </button>
                ))}
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="cursor-pointer border-none flex items-center gap-2"
                style={{
                  ...mono, fontSize: 9, fontWeight: 600,
                  color: "#050505", backgroundColor: "#D1FF00",
                  padding: "10px 20px", borderRadius: 4,
                  opacity: isGenerating ? 0.6 : 1,
                  transition: "transform 0.2s, opacity 0.2s",
                }}
                onMouseEnter={(e) => !isGenerating && (e.currentTarget.style.transform = "translateY(-1px)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
              >
                {isGenerating ? <RefreshCw size={11} className="animate-spin" /> : <Send size={11} />}
                {isGenerating ? "Generating..." : "Generate"}
              </button>
            </div>
          </motion.div>

          {/* Segments */}
          <motion.div
            style={{ padding: "14px clamp(20px, 3vw, 32px)", borderBottom: "1px solid #00000008" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Eye size={11} style={{ color: "#686868" }} />
              <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Segment Analysis</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockSegments.map((seg, i) => (
                <motion.button
                  key={i}
                  className="cursor-pointer border-none"
                  style={{
                    fontFamily: "Inter, sans-serif", fontSize: 13,
                    color: activeSegment === i ? "#050505" : "#050505",
                    backgroundColor: activeSegment === i ? seg.color : "transparent",
                    border: `1px solid ${activeSegment === i ? seg.color : "#9C9C9C20"}`,
                    padding: "5px 12px", borderRadius: 3,
                    transition: "all 0.2s ease-out",
                  }}
                  onMouseEnter={() => setActiveSegment(i)}
                  onMouseLeave={() => setActiveSegment(null)}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease, delay: 0.5 + i * 0.05 }}
                >
                  {seg.text}
                  <span style={{ ...mono, fontSize: 7, marginLeft: 6, opacity: 0.5 }}>{Math.round(seg.influence * 100)}%</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Output */}
          <div className="flex-1" style={{ padding: "20px clamp(20px, 3vw, 32px)" }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Output</span>
              {hasOutput && (
                <div className="flex items-center gap-2">
                  {[Copy, Bookmark].map((Icon, idx) => (
                    <button key={idx} className="cursor-pointer border-none bg-transparent p-1" style={{ color: "#686868", transition: "color 0.2s" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#050505")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#686868")}
                    ><Icon size={13} /></button>
                  ))}
                </div>
              )}
            </div>

            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div key="loading" className="flex flex-col items-center justify-center" style={{ minHeight: 280 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div style={{ width: 40, height: 2, backgroundColor: "#D1FF00", borderRadius: 1 }} animate={{ scaleX: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }} />
                  <span style={{ ...mono, fontSize: 8, color: "#686868", marginTop: 14 }}>Generating with explanation layer...</span>
                </motion.div>
              ) : hasOutput ? (
                <motion.div key="output" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
                  <div className="relative w-full rounded overflow-hidden mb-5" style={{ backgroundColor: "#1C1E19", aspectRatio: "16/10", border: "1px solid #9C9C9C10" }}>
                    <GrainLocal opacity={0.08} />
                    <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #1a2a15 0%, #2d1a0a 25%, #1a1a2d 50%, #2d2a1a 75%, #1a2d2a 100%)" }} />
                    <AnimatePresence>
                      {activeSegment !== null && (
                        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                          style={{ background: `radial-gradient(ellipse at ${20 + activeSegment * 15}% ${30 + activeSegment * 10}%, ${mockSegments[activeSegment].color}50 0%, transparent 55%)` }}
                        />
                      )}
                    </AnimatePresence>
                    <div className="absolute bottom-3 left-3"><span style={{ ...mono, fontSize: 7, color: "#FFFFED", backgroundColor: "#050505cc", padding: "3px 7px", borderRadius: 2 }}>Generated · 1024×640</span></div>
                    <div className="absolute top-3 right-3"><span style={{ ...mono, fontSize: 7, color: "#1A3D1A", backgroundColor: "#05050522", padding: "3px 7px", borderRadius: 2 }}>Mapping Active</span></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <ConfidenceMeter value={92} label="Confidence" />
                    <ConfidenceMeter value={87} label="Clarity" />
                    <ConfidenceMeter value={94} label="Quality" />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" className="flex flex-col items-center justify-center text-center" style={{ minHeight: 280 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Sparkles size={20} style={{ color: "#686868", marginBottom: 10, opacity: 0.25 }} />
                  <p style={{ ...mono, fontSize: 9, color: "#686868" }}>Write a prompt and generate</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right panel */}
        <motion.div
          className="flex flex-col"
          style={{ width: "100%", maxWidth: 360, backgroundColor: "#EBEAE0" }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease, delay: 0.4 }}
        >
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #00000010" }}>
            <span style={{ ...mono, fontSize: 8, color: "#1A3D1A" }}>
              {activePanel === "explain" ? "Explanation Layer" : activePanel === "insights" ? "Insights" : "Session History"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ padding: "14px 18px" }}>
            {activePanel === "explain" && (
              <div className="flex flex-col gap-3">
                {mockExplanations.map((exp, i) => (
                  <motion.div
                    key={i}
                    className="p-3.5 rounded"
                    style={{
                      backgroundColor: activeSegment === i ? "#D1FF0008" : "#9C9C9C06",
                      border: `1px solid ${activeSegment === i ? "#D1FF0025" : "#9C9C9C10"}`,
                      transition: "all 0.2s ease-out", cursor: "default",
                    }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: 0.5 + i * 0.05 }}
                    onMouseEnter={() => setActiveSegment(i)}
                    onMouseLeave={() => setActiveSegment(null)}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div style={{ width: 7, height: 7, borderRadius: 2, backgroundColor: mockSegments[i]?.color || "#686868" }} />
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, fontWeight: 600, color: "#050505" }}>"{exp.segment}"</span>
                    </div>
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, lineHeight: "160%", color: "#686868" }}>{exp.impact}</p>
                    <div className="mt-1.5"><span style={{ ...mono, fontSize: 7, color: "#686868" }}>Influence: {Math.round((mockSegments[i]?.influence || 0.5) * 100)}%</span></div>
                  </motion.div>
                ))}
                <div className="mt-3 p-3.5 rounded" style={{ border: "1px solid #00000010" }}>
                  <div style={{ ...mono, fontSize: 8, color: "#D1FF00", marginBottom: 8 }}>Guided Feedback</div>
                  {[
                    '"dramatic lighting" caused 23% contrast increase. Consider softening.',
                    'Adding "soft focus foreground" could improve depth by ~15%.',
                  ].map((fb, i) => (
                    <div key={i} className="flex items-start gap-2 mb-2">
                      <Zap size={9} style={{ color: "#D1FF00", flexShrink: 0, marginTop: 3 }} />
                      <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#686868", lineHeight: "155%" }}>{fb}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "insights" && (
              <div className="flex flex-col gap-5">
                <div>
                  <div style={{ ...mono, fontSize: 8, color: "#686868", marginBottom: 10 }}>Metrics</div>
                  <div className="flex flex-col gap-3">
                    <ConfidenceMeter value={92} label="Overall Confidence" />
                    <ConfidenceMeter value={87} label="Prompt Clarity" />
                    <ConfidenceMeter value={94} label="Output Quality" />
                    <ConfidenceMeter value={78} label="Prompt Efficiency" />
                  </div>
                </div>
                <div>
                  <div style={{ ...mono, fontSize: 8, color: "#686868", marginBottom: 10 }}>Token Analysis</div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: "Tokens Used", value: "47" },
                      { label: "Unique Segments", value: "5" },
                      { label: "Avg Influence", value: "86%" },
                      { label: "Redundancy", value: "Low" },
                    ].map((t, i) => (
                      <div key={i} className="p-3 rounded" style={{ backgroundColor: "#9C9C9C06", border: "1px solid #9C9C9C10" }}>
                        <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#050505" }}>{t.value}</div>
                        <div style={{ ...mono, fontSize: 7, color: "#686868", marginTop: 2 }}>{t.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activePanel === "history" && (
              <div className="flex flex-col gap-2.5">
                <div style={{ ...mono, fontSize: 8, color: "#686868", marginBottom: 4 }}>Recent Sessions</div>
                {mockHistory.map((h, i) => (
                  <motion.div
                    key={h.id}
                    className="p-3.5 rounded cursor-pointer"
                    style={{ border: "1px solid #9C9C9C10", transition: "border-color 0.2s" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#D1FF0030")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C10")}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease, delay: i * 0.05 }}
                  >
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#050505", marginBottom: 5, lineHeight: "150%" }}>{h.prompt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1"><Clock size={9} style={{ color: "#686868" }} /><span style={{ ...mono, fontSize: 7, color: "#686868" }}>{h.time}</span></div>
                      <span style={{ ...mono, fontSize: 7, color: "#D1FF00" }}>{h.confidence}% conf</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
