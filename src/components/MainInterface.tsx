import { useState } from "react";
import { PromptInput } from "./PromptInput";
import { OutputPanel } from "./OutputPanel";
import { WhatIfEditor } from "./WhatIfEditor";

interface MainInterfaceProps {
  featuresRef: React.RefObject<HTMLDivElement>;
}

export function MainInterface({ featuresRef }: MainInterfaceProps) {
  const [generatedText, setGeneratedText] = useState("");
  const [previousText, setPreviousText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate(prompt: string) {
    if (!prompt.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        "http://127.0.0.1:5000/api/ai/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt }),
        }
      );

      const data = await response.json();

      const newText = data.choices[0].text;

      setPreviousText(generatedText);
      setGeneratedText(newText);
    } catch (error) {
      console.error("AI API error:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: "var(--bg-primary)" }}
    >
      <div
        ref={featuresRef}
        className="px-6 py-20 border-b"
        style={{ borderColor: "var(--border-color)" }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="mb-4"
              style={{
                fontWeight: 600,
                fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
                color: "var(--text-primary)",
              }}
            >
              Try it yourself
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PromptInput onGenerate={handleGenerate} />
            <OutputPanel output={generatedText} loading={loading} />
          </div>
        </div>
      </div>

      <div className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <WhatIfEditor
            onApply={handleGenerate}
            previousOutput={previousText}
            currentOutput={generatedText}
          />
        </div>
      </div>
    </div>
  );
}
