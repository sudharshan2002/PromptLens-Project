import { useState } from "react";
import { GitCompare, Sparkles, Eye, EyeOff } from "lucide-react";

interface WhatIfEditorProps {
  onApply: (prompt: string) => void;
  previousOutput: string;
  currentOutput: string;
}

function diffWords(oldText: string, newText: string) {
  const oldWords = oldText.split(" ");
  const newWords = newText.split(" ");

  const result: { word: string; type: "same" | "added" | "removed" }[] = [];

  const oldSet = new Set(oldWords);
  const newSet = new Set(newWords);

  oldWords.forEach((word) => {
    if (!newSet.has(word)) {
      result.push({ word, type: "removed" });
    }
  });

  newWords.forEach((word) => {
    if (!oldSet.has(word)) {
      result.push({ word, type: "added" });
    } else {
      result.push({ word, type: "same" });
    }
  });

  return result;
}

export function WhatIfEditor({
  onApply,
  previousOutput,
  currentOutput,
}: WhatIfEditorProps) {
  const [editPrompt, setEditPrompt] = useState("");
  const [showDiff, setShowDiff] = useState(true);

  const handleRegenerate = () => {
    if (!editPrompt.trim()) return;
    onApply(editPrompt);
  };

  const diff =
    previousOutput && currentOutput
      ? diffWords(previousOutput, currentOutput)
      : [];

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-color)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitCompare size={20} style={{ color: "var(--accent-primary)" }} />
            <h3 style={{ fontWeight: 600, fontSize: "1.5rem" }}>
              What-If Edit Mode
            </h3>
          </div>

          <button
            onClick={() => setShowDiff((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
            }}
          >
            {showDiff ? <EyeOff size={16} /> : <Eye size={16} />}
            {showDiff ? "Hide differences" : "Show differences"}
          </button>
        </div>

        {/* Prompt editor */}
        <textarea
          value={editPrompt}
          onChange={(e) => setEditPrompt(e.target.value)}
          placeholder="Modify the prompt and regenerate…"
          className="w-full rounded-xl p-5 h-28 resize-none"
          style={{
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            fontSize: "0.95rem",
          }}
        />

        <button
          onClick={handleRegenerate}
          className="mt-4 px-6 py-3 rounded-full"
          style={{
            background: "var(--accent-primary)",
            color: "#fff",
            fontWeight: 500,
          }}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={16} />
            Regenerate with Changes
          </span>
        </button>

        {/* Comparison */}
        {previousOutput && currentOutput && (
          <>
            {/* Legend */}
            {showDiff && (
              <div className="mt-6 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      background: "rgba(34,197,94,0.2)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "#15803d",
                    }}
                  >
                    Added
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    New content
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    style={{
                      background: "rgba(239,68,68,0.2)",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      color: "#b91c1c",
                      textDecoration: "line-through",
                    }}
                  >
                    Removed
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    Deleted content
                  </span>
                </div>
              </div>
            )}

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                }}
              >
                <h4
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    marginBottom: "0.75rem",
                    color: "var(--text-secondary)",
                  }}
                >
                  Previous Output
                </h4>
                <p style={{ fontSize: "0.95rem" }}>{previousOutput}</p>
              </div>

              <div
                className="rounded-2xl p-6"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--accent-primary)",
                }}
              >
                <h4
                  style={{
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    marginBottom: "0.75rem",
                    color: "var(--accent-primary)",
                  }}
                >
                  New Output
                </h4>

                {!showDiff ? (
                  <p style={{ fontSize: "0.95rem" }}>{currentOutput}</p>
                ) : (
                  <p style={{ fontSize: "0.95rem", lineHeight: "1.6" }}>
                    {diff.map((item, index) => {
                      if (item.type === "added") {
                        return (
                          <span
                            key={index}
                            style={{
                              background: "rgba(34,197,94,0.2)",
                              color: "#15803d",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              marginRight: "4px",
                            }}
                          >
                            {item.word}
                          </span>
                        );
                      }

                      if (item.type === "removed") {
                        return (
                          <span
                            key={index}
                            style={{
                              background: "rgba(239,68,68,0.2)",
                              color: "#b91c1c",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              marginRight: "4px",
                              textDecoration: "line-through",
                            }}
                          >
                            {item.word}
                          </span>
                        );
                      }

                      return <span key={index}> {item.word} </span>;
                    })}
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
