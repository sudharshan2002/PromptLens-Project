import { Eye, Lightbulb } from "lucide-react";

interface Explanation {
  prompt_part: string;
  effect: string;
}

interface OutputPanelProps {
  output: string;
  explanations: Explanation[];
  loading: boolean;
}

export function OutputPanel({
  output = "",
  explanations = [],
  loading = false,
}: OutputPanelProps) {

  const renderHighlightedText = () => {
    if (!output) return "";

    let result = output;

    explanations.forEach((exp, index) => {
      const color =
        index % 2 === 0 ? "var(--tag-orange)" : "var(--tag-green)";

      const regex = new RegExp(`\\b${exp.prompt_part}\\b`, "gi");

      result = result.replace(
        regex,
        `<mark style="
          background: ${color}15;
          color: ${color};
          padding: 3px 8px;
          border-radius: 8px;
          font-weight: 500;
          border: 1.5px solid ${color}30;
          box-shadow: 0 1px 3px ${color}15;
        ">$&</mark>`
      );
    });

    return result;
  };

  return (
    <div
      className="rounded-3xl p-6 liquid-transition hover:shadow-xl glow-effect h-full flex flex-col fade-in group liquid-glass border"
      style={{
        borderColor: "var(--border-color)",
        boxShadow: "var(--shadow-md)",
        animationDelay: "0.1s",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center liquid-transition group-hover:scale-105 group-hover:rotate-3"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
            boxShadow: "0 4px 12px rgba(0, 113, 227, 0.2)",
          }}
        >
          <Eye size={18} style={{ color: "#ffffff" }} strokeWidth={2} />
        </div>
        <h3
          style={{
            fontWeight: 600,
            fontSize: "1.125rem",
            letterSpacing: "-0.02em",
          }}
        >
          Generated Output
        </h3>
      </div>

      <div
        className="rounded-2xl p-5 flex-1 liquid-transition liquid-glass border"
        style={{
          borderColor: "var(--border-color)",
          boxShadow: "inset 0 1px 4px rgba(0, 0, 0, 0.03)",
        }}
      >
        {loading ? (
          <p style={{ color: "var(--text-secondary)" }}>Generating…</p>
        ) : output ? (
          <p
            className="leading-relaxed"
            style={{
              fontWeight: 400,
              lineHeight: "1.8",
              fontSize: "0.875rem",
            }}
            dangerouslySetInnerHTML={{
              __html: renderHighlightedText(),
            }}
          />
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>
            No output yet. Enter a prompt to see results.
          </p>
        )}
      </div>

      {explanations.length > 0 && (
        <div
          className="mt-5 rounded-2xl p-5 liquid-transition border liquid-glass hover:scale-[1.005] cursor-pointer"
          style={{
            borderColor: "var(--border-color)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))",
              }}
            >
              <Lightbulb size={14} style={{ color: "#ffffff" }} strokeWidth={2} />
            </div>
            <h4
              style={{
                fontWeight: 600,
                fontSize: "0.8125rem",
                letterSpacing: "0.01em",
              }}
            >
              Explanation Key
            </h4>
          </div>

          <div className="space-y-3">
            {explanations.map((exp, index) => {
              const color =
                index % 2 === 0
                  ? "var(--tag-orange)"
                  : "var(--tag-green)";

              return (
                <div
                  key={index}
                  className="flex items-center gap-3 liquid-transition hover:translate-x-1 cursor-pointer group"
                >
                  <div
                    className="w-4 h-4 rounded-md liquid-transition group-hover:scale-110 group-hover:rotate-3"
                    style={{
                      background: color,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                    }}
                  ></div>
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-secondary)",
                      fontSize: "0.8125rem",
                    }}
                  >
                    <strong>{exp.prompt_part}</strong>: {exp.effect}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
