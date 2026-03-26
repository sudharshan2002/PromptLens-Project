import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import { GitCompare, ArrowRight, Zap, ChevronDown, BarChart3, RefreshCw } from "lucide-react";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const scenarios = [
  {
    id: "A", label: "Original",
    prompt: "A cinematic landscape photograph of a misty mountain at golden hour with dramatic lighting",
    confidence: 92, clarity: 87, quality: 94,
  },
  {
    id: "B", label: "Variant",
    prompt: "A cinematic landscape photograph of a misty mountain at blue hour with soft ethereal lighting",
    confidence: 88, clarity: 91, quality: 90,
    keyChanges: [
      { segment: "blue hour", delta: "+4% clarity", direction: "up" as const },
      { segment: "soft ethereal", delta: "-6% contrast", direction: "down" as const },
      { segment: "lighting", delta: "Style shift: warm → cool", direction: "neutral" as const },
    ],
  },
];

const sensitivityData = [
  { variable: "Time of day", impact: "High", current: "golden hour", alternatives: ["blue hour", "midnight", "noon", "overcast"] },
  { variable: "Lighting style", impact: "High", current: "dramatic", alternatives: ["soft", "ethereal", "harsh", "natural"] },
  { variable: "Subject", impact: "Medium", current: "misty mountain", alternatives: ["snow peak", "volcano", "canyon", "forest"] },
  { variable: "Style modifier", impact: "Low", current: "cinematic", alternatives: ["documentary", "painterly", "minimal", "surreal"] },
];

function MetricCard({ label, valueA, valueB }: { label: string; valueA: number; valueB: number }) {
  const delta = valueB - valueA;
  return (
    <div className="p-4 rounded" style={{ border: "1px solid #9C9C9C10", transition: "border-color 0.2s" }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C25")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C10")}
    >
      <div style={{ ...mono, fontSize: 7, color: "#686868", marginBottom: 8 }}>{label}</div>
      <div className="flex items-end gap-3">
        <div>
          <div style={{ ...mono, fontSize: 6, color: "#686868" }}>A</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 20, color: "#050505", letterSpacing: "-0.03em" }}>{valueA}%</div>
        </div>
        <div style={{ color: delta > 0 ? "#7DFFAF" : delta < 0 ? "#FF7D7D" : "#686868", fontFamily: "Inter, sans-serif", fontSize: 12, marginBottom: 3 }}>
          {delta > 0 ? "+" : ""}{delta}%
        </div>
        <div>
          <div style={{ ...mono, fontSize: 6, color: "#686868" }}>B</div>
          <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 800, fontSize: 20, color: "#1A3D1A", letterSpacing: "-0.03em" }}>{valueB}%</div>
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        <div style={{ height: 2, flex: valueA, backgroundColor: "#FFFFED20", borderRadius: 1 }} />
        <div style={{ height: 2, flex: valueB, backgroundColor: "#D1FF0050", borderRadius: 1 }} />
      </div>
    </div>
  );
}

export function WhatIfPage() {
  const [expandedSens, setExpandedSens] = useState<number | null>(0);

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: "#F5F4E7", paddingTop: 64 }}>
      <GrainLocal opacity={0.03} />

      {/* Header */}
      <motion.div
        className="relative z-10"
        style={{ padding: "10px clamp(20px, 3vw, 40px)", borderBottom: "1px solid #00000010", backgroundColor: "#EBEAE0" }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease, delay: 0.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <GitCompare size={13} style={{ color: "#1A3D1A" }} />
            <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>What-If Analysis</span>
            <div style={{ width: 1, height: 14, backgroundColor: "#9C9C9C18" }} />
            <span style={{ ...mono, fontSize: 9, color: "#686868" }}>2 Scenarios</span>
          </div>
          <button className="cursor-pointer border-none flex items-center gap-2"
            style={{ ...mono, fontSize: 8, color: "#050505", backgroundColor: "#D1FF00", padding: "6px 12px", borderRadius: 3, transition: "transform 0.2s" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <RefreshCw size={9} /> New Comparison
          </button>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto" style={{ maxWidth: 1400, padding: "28px clamp(20px, 3vw, 40px)" }}>
        {/* Split comparison */}
        <div className="grid md:grid-cols-2 gap-5 mb-10">
          {scenarios.map((s, i) => (
            <motion.div
              key={s.id}
              className="rounded overflow-hidden"
              style={{ border: `1px solid ${i === 1 ? "#D1FF0030" : "#9C9C9C10"}`, transition: "border-color 0.3s" }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease, delay: 0.3 + i * 0.1 }}
            >
              <div className="flex items-center justify-between p-3.5" style={{ borderBottom: "1px solid #9C9C9C08", backgroundColor: i === 1 ? "#D1FF0006" : "transparent" }}>
                <div className="flex items-center gap-3">
                  <div style={{ ...mono, fontSize: 9, color: i === 1 ? "#050505" : "#050505", backgroundColor: i === 1 ? "#D1FF0099" : "#00000008", padding: "2px 8px", borderRadius: 2 }}>{s.id}</div>
                  <span style={{ ...mono, fontSize: 8, color: "#686868" }}>{s.label}</span>
                </div>
                <span style={{ ...mono, fontSize: 7, color: "#686868" }}>{s.confidence}% conf</span>
              </div>

              <div className="relative" style={{ aspectRatio: "16/9", backgroundColor: "#EBEAE0", borderTop: "1px solid #00000008" }}>
                <GrainLocal opacity={0.08} />
                <div className="absolute inset-0" style={{
                  background: i === 0
                    ? "linear-gradient(135deg, #1a2a15 0%, #2d1a0a 30%, #1a1a1a 60%, #2d2a1a 100%)"
                    : "linear-gradient(135deg, #151a2a 0%, #0a1a2d 30%, #1a1a2d 60%, #1a2d2d 100%)",
                }} />
                <div className="absolute bottom-3 left-3">
                  <span style={{ ...mono, fontSize: 7, color: "#FFFFED", backgroundColor: "#050505cc", padding: "3px 7px", borderRadius: 2 }}>Scenario {s.id}</span>
                </div>
              </div>

              <div className="p-3.5" style={{ borderTop: "1px solid #9C9C9C08" }}>
                <div style={{ ...mono, fontSize: 7, color: "#686868", marginBottom: 5 }}>Prompt</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#050505", lineHeight: "165%", opacity: 0.8 }}>{s.prompt}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Delta view */}
        <motion.div className="mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}>
          <div className="flex items-center gap-3 mb-4">
            <span style={{ ...mono, fontSize: 8, color: "#1A3D1A" }}>Delta View</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#9C9C9C10" }} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <MetricCard label="Confidence" valueA={92} valueB={88} />
            <MetricCard label="Clarity" valueA={87} valueB={91} />
            <MetricCard label="Quality" valueA={94} valueB={90} />
          </div>

          <div className="p-4 rounded" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }}>
            <div style={{ ...mono, fontSize: 8, color: "#686868", marginBottom: 10 }}>Key Changes (A → B)</div>
            {scenarios[1].keyChanges?.map((change, i) => (
              <div key={i} className="flex items-center gap-4 mb-2">
                <div style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: change.direction === "up" ? "#7DFFAF" : change.direction === "down" ? "#FF7D7D" : "#FFB87D" }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#050505", fontWeight: 600 }}>"{change.segment}"</span>
                <ArrowRight size={10} style={{ color: "#686868" }} />
                <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: "#686868" }}>{change.delta}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sensitivity */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.6 }}>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 size={13} style={{ color: "#D1FF00" }} />
            <span style={{ ...mono, fontSize: 8, color: "#D1FF00" }}>Sensitivity Analysis</span>
            <div style={{ flex: 1, height: 1, backgroundColor: "#9C9C9C10" }} />
          </div>

          <div className="flex flex-col">
            {sensitivityData.map((item, i) => (
              <motion.div
                key={i}
                className="cursor-pointer"
                style={{ borderBottom: "1px solid #9C9C9C0A" }}
                onClick={() => setExpandedSens(expandedSens === i ? null : i)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.7 + i * 0.05 }}
              >
                <div
                  className="flex items-center justify-between py-4 px-2 -mx-2 rounded"
                  style={{ transition: "background-color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9C9C9C06")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "Inter, sans-serif", fontSize: 14, fontWeight: 700, color: "#050505", textTransform: "uppercase", letterSpacing: "-0.01em" }}>{item.variable}</span>
                    <span style={{
                      ...mono, fontSize: 7,
                      color: item.impact === "High" ? "#FF7D7D" : item.impact === "Medium" ? "#FFB87D" : "#7DFFAF",
                      backgroundColor: item.impact === "High" ? "#FF7D7D10" : item.impact === "Medium" ? "#FFB87D10" : "#7DFFAF10",
                      padding: "2px 7px", borderRadius: 2,
                    }}>{item.impact}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ ...mono, fontSize: 8, color: "#686868" }}>{item.current}</span>
                    <motion.div animate={{ rotate: expandedSens === i ? 180 : 0 }} transition={{ duration: 0.3 }}>
                      <ChevronDown size={13} style={{ color: "#686868" }} />
                    </motion.div>
                  </div>
                </div>
                <AnimatePresence>
                  {expandedSens === i && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease }} className="overflow-hidden">
                      <div className="pb-4 pl-3">
                        <div style={{ ...mono, fontSize: 7, color: "#686868", marginBottom: 6 }}>Alternative values</div>
                        <div className="flex flex-wrap gap-2">
                          {item.alternatives.map((alt, ai) => (
                            <button key={ai} className="cursor-pointer border-none" style={{
                              ...mono, fontSize: 8, color: "#050505",
                              backgroundColor: "#9C9C9C08", padding: "5px 12px", borderRadius: 3,
                              border: "1px solid #9C9C9C15", transition: "all 0.2s",
                            }}
                              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#D1FF0040"; e.currentTarget.style.color = "#D1FF00"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#9C9C9C15"; e.currentTarget.style.color = "#FFFFED"; }}
                            >{alt}</button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div className="mt-10 p-5 rounded" style={{ border: "1px solid #9C9C9C10", backgroundColor: "#D1FF0004" }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.8 }}>
          <div style={{ ...mono, fontSize: 8, color: "#D1FF00", marginBottom: 10 }}>Impact Summary</div>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "Highest Sensitivity", text: "Time of day and lighting style have the most impact on output." },
              { title: "Recommended Edit", text: 'Combine "blue hour" with "dramatic lighting" for clarity without losing contrast.' },
              { title: "Stability Score", text: "84% stable — minor edits produce predictable changes." },
            ].map((item, i) => (
              <div key={i}>
                <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#050505", marginBottom: 4 }}>{item.title}</div>
                <p style={{ fontFamily: "Inter, sans-serif", fontSize: 11, lineHeight: "165%", color: "#686868" }}>{item.text}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
