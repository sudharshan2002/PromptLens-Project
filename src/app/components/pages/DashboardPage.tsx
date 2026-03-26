import { useState } from "react";
import { motion } from "motion/react";
import { GrainLocal } from "../GrainOverlay";
import { BarChart3, Clock, ArrowRight, Eye, Shield, Sparkles, Activity } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const mono: React.CSSProperties = {
  fontFamily: "'Roboto Mono', monospace",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
};

const ease = [0.16, 1, 0.3, 1] as const;

const trendData = [
  { day: "Mon", confidence: 82, clarity: 75, quality: 88 },
  { day: "Tue", confidence: 85, clarity: 79, quality: 86 },
  { day: "Wed", confidence: 88, clarity: 83, quality: 91 },
  { day: "Thu", confidence: 84, clarity: 86, quality: 89 },
  { day: "Fri", confidence: 91, clarity: 88, quality: 93 },
  { day: "Sat", confidence: 89, clarity: 90, quality: 92 },
  { day: "Sun", confidence: 93, clarity: 87, quality: 95 },
];

const usageData = [
  { hour: "6am", runs: 3 }, { hour: "8am", runs: 12 }, { hour: "10am", runs: 24 },
  { hour: "12pm", runs: 18 }, { hour: "2pm", runs: 31 }, { hour: "4pm", runs: 22 },
  { hour: "6pm", runs: 14 }, { hour: "8pm", runs: 8 },
];

const recentRuns = [
  { prompt: "Product mockup on marble surface with natural light", confidence: 94, clarity: 91, time: "3m ago", quality: "Excellent" },
  { prompt: "Abstract geometric pattern in neon colors", confidence: 87, clarity: 82, time: "12m ago", quality: "Good" },
  { prompt: "A serene Japanese garden in autumn morning mist", confidence: 96, clarity: 93, time: "28m ago", quality: "Excellent" },
  { prompt: "Minimalist logo for blockchain startup", confidence: 78, clarity: 88, time: "1h ago", quality: "Fair" },
  { prompt: "Retro 80s synthwave landscape with palm trees", confidence: 91, clarity: 85, time: "2h ago", quality: "Good" },
];

const savedSessions = [
  { name: "Brand Identity Exploration", runs: 14, date: "Mar 22", status: "Active" },
  { name: "Product Photography Series", runs: 8, date: "Mar 20", status: "Complete" },
  { name: "Social Media Campaign", runs: 23, date: "Mar 18", status: "Active" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: "#EBEAE0", border: "1px solid #00000010", borderRadius: 3, padding: "7px 10px" }}>
      <div style={{ ...mono, fontSize: 7, color: "#686868", marginBottom: 3 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: p.color }} />
          <span style={{ fontFamily: "Inter, sans-serif", fontSize: 10, color: "#050505" }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
};

function StatCard({ icon, label, value, sub, delay = 0 }: { icon: React.ReactNode; label: string; value: string; sub: string; delay?: number }) {
  return (
    <motion.div
      className="p-5 rounded"
      style={{ backgroundColor: "#EBEAE0", border: "1px solid #00000008", transition: "border-color 0.2s" }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease, delay }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#D1FF0025")}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C10")}
    >
      <div className="flex items-center gap-2 mb-3">
        <div style={{ color: "#1A3D1A" }}>{icon}</div>
        <span style={{ ...mono, fontSize: 7, color: "#686868" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 900, fontSize: 28, color: "#050505", letterSpacing: "-0.04em" }}>{value}</div>
      <div style={{ ...mono, fontSize: 7, color: "#686868", marginTop: 4 }}>{sub}</div>
    </motion.div>
  );
}

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "sessions" | "system">("overview");

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
            <BarChart3 size={13} style={{ color: "#1A3D1A" }} />
            <span style={{ ...mono, fontSize: 9, color: "#1A3D1A" }}>Dashboard</span>
            <div style={{ width: 1, height: 14, backgroundColor: "#9C9C9C18" }} />
            <span style={{ ...mono, fontSize: 9, color: "#686868" }}>Last 7 days</span>
          </div>
          <div className="flex items-center gap-1">
            {(["overview", "sessions", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className="cursor-pointer border-none"
                style={{
                  ...mono, fontSize: 8,
                  color: activeTab === t ? "#1A3D1A" : "#686868",
                  backgroundColor: activeTab === t ? "#D1FF0030" : "transparent",
                  padding: "5px 10px", borderRadius: 3, transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { if (activeTab !== t) e.currentTarget.style.color = "#050505"; }}
                onMouseLeave={(e) => { if (activeTab !== t) e.currentTarget.style.color = "#686868"; }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto" style={{ maxWidth: 1400, padding: "28px clamp(20px, 3vw, 40px)" }}>
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<Shield size={13} />} label="Avg Confidence" value="91%" sub="+3% from last week" delay={0.3} />
              <StatCard icon={<Eye size={13} />} label="Avg Clarity" value="86%" sub="+5% from last week" delay={0.36} />
              <StatCard icon={<Sparkles size={13} />} label="Avg Quality" value="92%" sub="+1% from last week" delay={0.42} />
              <StatCard icon={<Activity size={13} />} label="Total Runs" value="132" sub="This week" delay={0.48} />
            </div>

            <div className="grid lg:grid-cols-2 gap-5 mb-8">
              <motion.div className="p-5 rounded" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.5 }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Performance Trends</span>
                  <div className="flex items-center gap-3">
                    {[{ l: "Conf", c: "#D1FF00" }, { l: "Clarity", c: "#7DB5FF" }, { l: "Quality", c: "#7DFFAF" }].map((x) => (
                      <div key={x.l} className="flex items-center gap-1">
                        <div style={{ width: 5, height: 5, borderRadius: 1, backgroundColor: x.c }} />
                        <span style={{ ...mono, fontSize: 6, color: "#686868" }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#D1FF00" stopOpacity={0.15} /><stop offset="100%" stopColor="#D1FF00" stopOpacity={0} /></linearGradient>
                      <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7DB5FF" stopOpacity={0.1} /><stop offset="100%" stopColor="#7DB5FF" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                    <XAxis dataKey="day" tick={{ fontSize: 8, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 8, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="confidence" stroke="#D1FF00" strokeWidth={1.5} fill="url(#gC)" />
                    <Area type="monotone" dataKey="clarity" stroke="#7DB5FF" strokeWidth={1.5} fill="url(#gB)" />
                    <Area type="monotone" dataKey="quality" stroke="#7DFFAF" strokeWidth={1.5} fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </motion.div>

              <motion.div className="p-5 rounded" style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0" }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.55 }}>
                <div className="flex items-center justify-between mb-4">
                  <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Usage Today</span>
                  <span style={{ ...mono, fontSize: 8, color: "#1A3D1A" }}>{usageData.reduce((acc, curr) => acc + curr.runs, 0)} runs</span>
                </div>
                <ResponsiveContainer width="100%" height={190}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#00000008" />
                    <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 8, fill: "#686868", fontFamily: "'Roboto Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="runs" fill="#D1FF00" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </motion.div>
            </div>

            {/* Recent runs */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease, delay: 0.6 }}>
              <div className="flex items-center gap-2 mb-4">
                <Clock size={13} style={{ color: "#D1FF00" }} />
                <span style={{ ...mono, fontSize: 8, color: "#686868" }}>Recent Generations</span>
              </div>
              {recentRuns.map((run, i) => (
                <motion.div
                  key={i}
                  className="flex items-center justify-between py-3.5 cursor-pointer px-2 -mx-2 rounded"
                  style={{ borderBottom: "1px solid #9C9C9C08", transition: "background-color 0.2s" }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.65 + i * 0.04 }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#9C9C9C06")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div className="flex-1 mr-4">
                    <p style={{ fontFamily: "Inter, sans-serif", fontSize: 13, color: "#050505", marginBottom: 3 }}>{run.prompt}</p>
                    <span style={{ ...mono, fontSize: 7, color: "#686868" }}>{run.time}</span>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#D1FF00" }}>{run.confidence}%</div>
                      <div style={{ ...mono, fontSize: 6, color: "#686868" }}>Conf</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 13, color: "#050505" }}>{run.clarity}%</div>
                      <div style={{ ...mono, fontSize: 6, color: "#686868" }}>Clarity</div>
                    </div>
                    <span style={{
                      ...mono, fontSize: 7,
                      color: run.quality === "Excellent" ? "#7DFFAF" : run.quality === "Good" ? "#D1FF00" : "#FFB87D",
                      backgroundColor: run.quality === "Excellent" ? "#7DFFAF0D" : run.quality === "Good" ? "#D1FF000D" : "#FFB87D0D",
                      padding: "2px 7px", borderRadius: 2,
                    }}>{run.quality}</span>
                    <ArrowRight size={12} style={{ color: "#686868" }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </>
        )}

        {activeTab === "sessions" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div style={{ ...mono, fontSize: 8, color: "#686868", marginBottom: 16 }}>Saved Sessions</div>
            <div className="flex flex-col gap-3">
              {savedSessions.map((s, i) => (
                <motion.div
                  key={i}
                  className="p-5 rounded cursor-pointer"
                  style={{ border: "1px solid #9C9C9C10", transition: "border-color 0.2s" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#D1FF0025")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C10")}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.3 + i * 0.07 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 15, color: "#050505", marginBottom: 3, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{s.name}</div>
                      <div className="flex items-center gap-3">
                        <span style={{ ...mono, fontSize: 8, color: "#686868" }}>{s.runs} runs</span>
                        <span style={{ ...mono, fontSize: 8, color: "#686868" }}>{s.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{
                        ...mono, fontSize: 7,
                        color: s.status === "Active" ? "#D1FF00" : "#686868",
                        backgroundColor: s.status === "Active" ? "#D1FF0010" : "#9C9C9C08",
                        padding: "2px 8px", borderRadius: 2,
                      }}>{s.status}</span>
                      <ArrowRight size={12} style={{ color: "#686868" }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 p-5 rounded text-center" style={{ border: "1px dashed #9C9C9C15" }}>
              <span style={{ ...mono, fontSize: 8, color: "#686868" }}>3 sessions · 45 total runs · 2.4 GB stored</span>
            </div>
          </motion.div>
        )}

        {activeTab === "system" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <div className="flex items-center gap-2 mb-6">
              <Activity size={13} style={{ color: "#D1FF00" }} />
              <span style={{ ...mono, fontSize: 8, color: "#686868" }}>System Health</span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { label: "API Latency", value: "142ms", status: "Healthy", c: "#7DFFAF" },
                { label: "Explanation Pipeline", value: "Active", status: "Online", c: "#7DFFAF" },
                { label: "Mapping Engine", value: "v2.4.1", status: "Stable", c: "#D1FF00" },
                { label: "Queue Depth", value: "3 jobs", status: "Normal", c: "#7DFFAF" },
                { label: "Model Provider", value: "GPT-4 Turbo", status: "Connected", c: "#7DFFAF" },
                { label: "Storage Used", value: "2.4 / 10 GB", status: "24%", c: "#D1FF00" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  className="p-4 rounded"
                  style={{ border: "1px solid #00000010", backgroundColor: "#EBEAE0", transition: "border-color 0.2s" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease, delay: 0.3 + i * 0.05 }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C25")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = "#9C9C9C10")}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ ...mono, fontSize: 7, color: "#686868" }}>{item.label}</span>
                    <span style={{ ...mono, fontSize: 6, color: item.c, backgroundColor: `${item.c}10`, padding: "2px 6px", borderRadius: 2 }}>{item.status}</span>
                  </div>
                  <div style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 17, color: "#050505" }}>{item.value}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
