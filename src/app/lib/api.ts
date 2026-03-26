const API_ROOT = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const API_PREFIX = `${API_ROOT}/api`;
const tokenPattern = /\b[\w'-]+\b/g;

type ApiFallbackMeta = {
  isFallback?: boolean;
  fallbackMessage?: string;
};

export type GenerationMode = "text" | "image";
export type GenerationSource = "composer" | "what-if" | "api";

export type TokenImpact = {
  token: string;
  impact: number;
};

export type SessionRecord = ApiFallbackMeta & {
  id: number;
  prompt: string;
  output: string;
  mode: GenerationMode;
  source: GenerationSource;
  provider: string;
  response_time_ms: number;
  token_count: number;
  trust_score: number;
  clarity_score: number;
  quality_score: number;
  quality_label: string;
  difference_summary: string | null;
  created_at: string;
};

export type GenerateResponse = ApiFallbackMeta & {
  output: string;
  provider: string;
  tokens: string[];
  mapping: TokenImpact[];
  session: SessionRecord;
};

export type WhatIfResponse = ApiFallbackMeta & {
  difference: string;
  original_session: SessionRecord;
  modified_session: SessionRecord;
  delta: {
    confidence: number;
    clarity: number;
    quality: number;
  };
};

export type RecentRun = {
  id: number;
  prompt: string;
  mode: GenerationMode;
  provider: string;
  confidence: number;
  clarity: number;
  quality: number;
  quality_label: string;
  created_at: string;
};

export type DashboardMetricsResponse = ApiFallbackMeta & {
  avg_confidence: number;
  avg_clarity: number;
  avg_quality: number;
  avg_response_time: number;
  total_runs: number;
  trend: Array<{
    day: string;
    confidence: number;
    clarity: number;
    quality: number;
  }>;
  usage_today: Array<{
    hour: string;
    runs: number;
  }>;
  recent_runs: RecentRun[];
  system_status: Array<{
    label: string;
    value: string;
    status: string;
  }>;
  storage_bytes: number;
};

export type SessionListResponse = ApiFallbackMeta & {
  sessions: SessionRecord[];
  total_runs: number;
  storage_bytes: number;
};

let fallbackSessionId = 9000;
let fallbackSessions: SessionRecord[] | null = null;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function tokenizeText(text: string): string[] {
  return text.match(tokenPattern) || [];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function shiftMinutes(minutesAgo: number) {
  return new Date(Date.now() - minutesAgo * 60_000).toISOString();
}

function toDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildMockImageOutput(prompt: string, subtitle: string) {
  const safePrompt = escapeXml(prompt.trim().slice(0, 72) || "Frigate prompt");
  const safeSubtitle = escapeXml(subtitle);
  return toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#111827"/>
          <stop offset="55%" stop-color="#0f4c81"/>
          <stop offset="100%" stop-color="#d1ff00"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="800" fill="url(#bg)"/>
      <rect x="70" y="70" width="1140" height="660" rx="36" fill="rgba(11,15,18,0.58)" stroke="rgba(255,255,255,0.16)"/>
      <rect x="120" y="138" width="310" height="10" rx="5" fill="#d1ff00" opacity="0.85"/>
      <rect x="120" y="180" width="460" height="86" rx="18" fill="rgba(255,255,255,0.08)"/>
      <rect x="640" y="182" width="452" height="250" rx="24" fill="rgba(255,255,255,0.08)"/>
      <rect x="640" y="468" width="452" height="160" rx="24" fill="rgba(255,255,255,0.08)"/>
      <rect x="120" y="314" width="400" height="250" rx="24" fill="rgba(255,255,255,0.06)"/>
      <circle cx="315" cy="440" r="118" fill="rgba(209,255,0,0.24)"/>
      <circle cx="315" cy="440" r="72" fill="rgba(125,255,175,0.45)"/>
      <text x="120" y="122" fill="#f8fafc" font-family="Arial, sans-serif" font-size="22" letter-spacing="4">OFFLINE PREVIEW</text>
      <text x="120" y="216" fill="#ffffff" font-family="Arial, sans-serif" font-size="36" font-weight="700">${safeSubtitle}</text>
      <text x="120" y="622" fill="#dbe4ea" font-family="Arial, sans-serif" font-size="24">Prompt: ${safePrompt}</text>
      <text x="120" y="668" fill="#dbe4ea" font-family="Arial, sans-serif" font-size="20">Example artwork is shown while the backend reconnects.</text>
    </svg>
  `);
}

function buildMockTextOutput(prompt: string, variant = "base") {
  const focus = tokenizeText(prompt).slice(0, 6).join(", ") || "clarity, trust, explainability";
  const closer =
    variant === "modified"
      ? "It leans harder into measurable gains and a sharper launch narrative."
      : "It stays grounded in explainability, control, and safer team workflows.";

  return [
    "Frigate gives AI teams a clearer way to ship prompts with confidence.",
    `This example draft expands on ${focus} and shows how prompt mapping, trust signals, and guided comparison can stay visible inside one product surface.`,
    closer,
  ].join("\n\n");
}

function buildDifferenceSummary(originalPrompt: string, modifiedPrompt: string) {
  const originalTokens = new Set(tokenizeText(originalPrompt).map((token) => token.toLowerCase()));
  const modifiedTokens = new Set(tokenizeText(modifiedPrompt).map((token) => token.toLowerCase()));
  const added = [...modifiedTokens].filter((token) => !originalTokens.has(token));
  const removed = [...originalTokens].filter((token) => !modifiedTokens.has(token));

  if (added.length === 0 && removed.length === 0) {
    return "Both variants keep the same core intent, with only small phrasing changes.";
  }

  const parts: string[] = [];
  if (added.length > 0) {
    parts.push(`Variant B adds emphasis on ${added.slice(0, 4).join(", ")}.`);
  }
  if (removed.length > 0) {
    parts.push(`It reduces emphasis on ${removed.slice(0, 4).join(", ")}.`);
  }
  return parts.join(" ");
}

function buildMapping(prompt: string, output: string): TokenImpact[] {
  const uniqueTokens = Array.from(new Set(tokenizeText(prompt)))
    .filter((token) => token.length > 2)
    .slice(0, 5);

  if (uniqueTokens.length === 0) {
    return [
      { token: "prompt", impact: 0.84 },
      { token: "clarity", impact: 0.72 },
      { token: "control", impact: 0.66 },
    ];
  }

  return uniqueTokens.map((token, index) => {
    const matchBoost = output.toLowerCase().includes(token.toLowerCase()) ? 0.12 : 0;
    return {
      token,
      impact: Number(clamp(0.9 - index * 0.12 + matchBoost, 0.32, 0.96).toFixed(2)),
    };
  });
}

function estimateScores(prompt: string, output: string, mode: GenerationMode) {
  const promptTokens = new Set(tokenizeText(prompt).map((token) => token.toLowerCase()));
  const outputTokens = new Set(tokenizeText(output).map((token) => token.toLowerCase()));
  const overlap = promptTokens.size
    ? [...promptTokens].filter((token) => outputTokens.has(token)).length / promptTokens.size
    : 0.45;
  const detail = clamp(prompt.trim().length / 160, 0.22, 1);
  const length = clamp(output.trim().length / (mode === "image" ? 160 : 260), 0.25, 1);

  const trust = clamp(61 + overlap * 20 + detail * 13, 60, 97);
  const clarity = clamp(58 + detail * 26, 58, 98);
  const quality = clamp(63 + overlap * 14 + length * 17 + (mode === "image" ? 4 : 0), 63, 98);

  return {
    trust: Number(trust.toFixed(2)),
    clarity: Number(clarity.toFixed(2)),
    quality: Number(quality.toFixed(2)),
  };
}

function qualityLabel(score: number) {
  if (score >= 92) return "Excellent";
  if (score >= 82) return "Good";
  if (score >= 70) return "Fair";
  return "Needs Work";
}

function nextFallbackId() {
  fallbackSessionId += 1;
  return fallbackSessionId;
}

function createFallbackSession({
  prompt,
  mode,
  source,
  output,
  provider,
  createdAt,
  differenceSummary = null,
}: {
  prompt: string;
  mode: GenerationMode;
  source: GenerationSource;
  output: string;
  provider: string;
  createdAt?: string;
  differenceSummary?: string | null;
}): SessionRecord {
  const scores = estimateScores(prompt, output, mode);

  return {
    id: nextFallbackId(),
    prompt,
    output,
    mode,
    source,
    provider,
    response_time_ms: Number((mode === "image" ? 720 : 540).toFixed(2)),
    token_count: tokenizeText(prompt).length,
    trust_score: scores.trust,
    clarity_score: scores.clarity,
    quality_score: scores.quality,
    quality_label: qualityLabel(scores.quality),
    difference_summary: differenceSummary,
    created_at: createdAt || new Date().toISOString(),
    isFallback: true,
    fallbackMessage: "Backend is unavailable, so Frigate is showing example data.",
  };
}

function ensureFallbackSessions() {
  if (fallbackSessions) {
    return fallbackSessions;
  }

  fallbackSessions = [
    createFallbackSession({
      prompt: "Design a Frigate launch hero with prompt mapping overlays and a calm cockpit mood",
      mode: "image",
      source: "composer",
      output: buildMockImageOutput("Design a Frigate launch hero with prompt mapping overlays and a calm cockpit mood", "Launch Hero"),
      provider: "demo-image",
      createdAt: shiftMinutes(14),
    }),
    createFallbackSession({
      prompt: "Write a product intro for Frigate focused on trust scoring and explainability",
      mode: "text",
      source: "composer",
      output: buildMockTextOutput("Write a product intro for Frigate focused on trust scoring and explainability"),
      provider: "demo-text",
      createdAt: shiftMinutes(37),
    }),
    createFallbackSession({
      prompt: "Compare a brighter editorial Frigate dashboard against a calm darker one",
      mode: "image",
      source: "what-if",
      output: buildMockImageOutput("Compare a brighter editorial Frigate dashboard against a calm darker one", "Comparison Preview"),
      provider: "demo-image",
      createdAt: shiftMinutes(86),
      differenceSummary: "Variant testing stayed stable while shifting the visual tone.",
    }),
  ];

  return fallbackSessions;
}

function registerFallbackSession(session: SessionRecord) {
  const sessions = ensureFallbackSessions();
  sessions.unshift(session);
  fallbackSessions = sessions.slice(0, 20);
}

function fallbackMessageFrom(error: unknown) {
  const reason = error instanceof Error ? error.message : "Unable to reach the backend.";
  return `Backend is unavailable, so Frigate is showing example data. ${reason}`;
}

function buildGenerateFallback(
  payload: { prompt: string; mode: GenerationMode; source?: GenerationSource },
  fallbackMessage: string,
): GenerateResponse {
  const output =
    payload.mode === "image"
      ? buildMockImageOutput(payload.prompt, "Composer Preview")
      : buildMockTextOutput(payload.prompt);
  const session = createFallbackSession({
    prompt: payload.prompt,
    mode: payload.mode,
    source: payload.source || "composer",
    output,
    provider: payload.mode === "image" ? "demo-image" : "demo-text",
  });

  session.fallbackMessage = fallbackMessage;
  registerFallbackSession(session);

  return {
    output,
    provider: session.provider,
    tokens: tokenizeText(payload.prompt),
    mapping: buildMapping(payload.prompt, output),
    session,
    isFallback: true,
    fallbackMessage,
  };
}

function buildCompareFallback(
  payload: { original_prompt: string; modified_prompt: string; mode: GenerationMode },
  fallbackMessage: string,
): WhatIfResponse {
  const originalOutput =
    payload.mode === "image"
      ? buildMockImageOutput(payload.original_prompt, "Scenario A")
      : buildMockTextOutput(payload.original_prompt);
  const modifiedOutput =
    payload.mode === "image"
      ? buildMockImageOutput(payload.modified_prompt, "Scenario B")
      : buildMockTextOutput(payload.modified_prompt, "modified");
  const difference = buildDifferenceSummary(payload.original_prompt, payload.modified_prompt);
  const originalSession = createFallbackSession({
    prompt: payload.original_prompt,
    mode: payload.mode,
    source: "what-if",
    output: originalOutput,
    provider: payload.mode === "image" ? "demo-image" : "demo-text",
    differenceSummary: difference,
  });
  const modifiedSession = createFallbackSession({
    prompt: payload.modified_prompt,
    mode: payload.mode,
    source: "what-if",
    output: modifiedOutput,
    provider: payload.mode === "image" ? "demo-image" : "demo-text",
    differenceSummary: difference,
  });

  originalSession.fallbackMessage = fallbackMessage;
  modifiedSession.fallbackMessage = fallbackMessage;
  registerFallbackSession(modifiedSession);
  registerFallbackSession(originalSession);

  return {
    difference,
    original_session: originalSession,
    modified_session: modifiedSession,
    delta: {
      confidence: Number((modifiedSession.trust_score - originalSession.trust_score).toFixed(2)),
      clarity: Number((modifiedSession.clarity_score - originalSession.clarity_score).toFixed(2)),
      quality: Number((modifiedSession.quality_score - originalSession.quality_score).toFixed(2)),
    },
    isFallback: true,
    fallbackMessage,
  };
}

function buildSessionsFallback(limit = 12, fallbackMessage: string): SessionListResponse {
  const sessions = ensureFallbackSessions().slice(0, limit);
  const storageBytes = sessions.reduce((sum, session) => sum + session.prompt.length + session.output.length, 0);

  return {
    sessions,
    total_runs: sessions.length,
    storage_bytes: storageBytes,
    isFallback: true,
    fallbackMessage,
  };
}

function buildDashboardFallback(fallbackMessage: string): DashboardMetricsResponse {
  const sessions = ensureFallbackSessions();
  const avgConfidence = sessions.reduce((sum, session) => sum + session.trust_score, 0) / sessions.length;
  const avgClarity = sessions.reduce((sum, session) => sum + session.clarity_score, 0) / sessions.length;
  const avgQuality = sessions.reduce((sum, session) => sum + session.quality_score, 0) / sessions.length;
  const avgResponse = sessions.reduce((sum, session) => sum + session.response_time_ms, 0) / sessions.length;
  const now = new Date();
  const trend = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(now);
    day.setDate(now.getDate() - (6 - index));
    const label = day.toLocaleDateString("en-US", { weekday: "short" });
    const base = 74 + index * 1.6;
    return {
      day: label,
      confidence: Number(clamp(base + 5, 68, 95).toFixed(2)),
      clarity: Number(clamp(base + 2, 66, 94).toFixed(2)),
      quality: Number(clamp(base + 3.5, 67, 95).toFixed(2)),
    };
  });
  const usageToday = Array.from({ length: 8 }, (_, index) => ({
    hour: `${`${index * 3}`.padStart(2, "0")}:00`,
    runs: index === 2 ? 2 : index === 4 ? 3 : index === 5 ? 1 : 0,
  }));
  const storageBytes = sessions.reduce((sum, session) => sum + session.prompt.length + session.output.length, 0);

  return {
    avg_confidence: Number(avgConfidence.toFixed(2)),
    avg_clarity: Number(avgClarity.toFixed(2)),
    avg_quality: Number(avgQuality.toFixed(2)),
    avg_response_time: Number(avgResponse.toFixed(2)),
    total_runs: sessions.length,
    trend,
    usage_today: usageToday,
    recent_runs: sessions.slice(0, 5).map((session) => ({
      id: session.id,
      prompt: session.prompt,
      mode: session.mode,
      provider: session.provider,
      confidence: session.trust_score,
      clarity: session.clarity_score,
      quality: session.quality_score,
      quality_label: session.quality_label,
      created_at: session.created_at,
    })),
    system_status: [
      { label: "Backend", value: "Offline Demo Mode", status: "Fallback" },
      { label: "Text Provider", value: "demo-text", status: "Sample" },
      { label: "Image Provider", value: "demo-image", status: "Sample" },
      { label: "Storage Used", value: formatStorage(storageBytes), status: "Local Memory" },
    ],
    storage_bytes: storageBytes,
    isFallback: true,
    fallbackMessage,
  };
}

export const api = {
  async generate(payload: { prompt: string; mode: GenerationMode; source?: GenerationSource }) {
    try {
      return await request<GenerateResponse>("/generate", {
        method: "POST",
        body: JSON.stringify({
          prompt: payload.prompt,
          mode: payload.mode,
          source: payload.source || "composer",
        }),
      });
    } catch (error) {
      return buildGenerateFallback(payload, fallbackMessageFrom(error));
    }
  },
  async compare(payload: { original_prompt: string; modified_prompt: string; mode: GenerationMode }) {
    try {
      return await request<WhatIfResponse>("/what-if", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      return buildCompareFallback(payload, fallbackMessageFrom(error));
    }
  },
  async dashboard() {
    try {
      return await request<DashboardMetricsResponse>("/dashboard");
    } catch (error) {
      return buildDashboardFallback(fallbackMessageFrom(error));
    }
  },
  async sessions(limit = 12) {
    try {
      return await request<SessionListResponse>(`/sessions?limit=${limit}`);
    } catch (error) {
      return buildSessionsFallback(limit, fallbackMessageFrom(error));
    }
  },
};

export function formatRelativeTime(value: string): string {
  const createdAt = new Date(value);
  const now = new Date();
  const seconds = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 1000));

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function formatStorage(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
