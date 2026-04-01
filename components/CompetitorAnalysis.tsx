"use client";

import { useState } from "react";

interface ContentPillar {
  name: string;
  description: string;
  frequency: string;
}

interface HookPattern {
  pattern: string;
  example: string;
  effectiveness: "high" | "medium" | "low";
}

interface PostingStyle {
  tone: string;
  avgLength: string;
  formatPatterns: string[];
  languageNotes: string;
}

interface CompetitorReport {
  contentPillars: ContentPillar[];
  hookPatterns: HookPattern[];
  postingStyle: PostingStyle;
  dominantTopics: string[];
  steal: string[];
  avoid: string[];
  overallAssessment: string;
}

const EFFECTIVENESS_STYLE: Record<string, string> = {
  high: "text-green-400 bg-green-500/10",
  medium: "text-yellow-400 bg-yellow-500/10",
  low: "text-red-400 bg-red-500/10",
};

export default function CompetitorAnalysis() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CompetitorReport | null>(null);
  const [captionsCount, setCaptionsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) return;

    setLoading(true);
    setReport(null);
    setError(null);
    try {
      const res = await fetch("/api/competitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ captions: lines }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setReport(data.analysis as CompetitorReport);
      setCaptionsCount(data.captionsAnalyzed as number);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to analyze");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
            Competitor Analysis
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Paste captions from a competitor — one per line
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-violet-400 hover:text-violet-300"
        >
          {open ? "Close" : "Analyze competitor"}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">
              Video captions / descriptions (one per line)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={8}
              placeholder={"Close-up ASMR soap cutting with lavender scent\nSatisfying kinetic sand shapes in slow motion\nNeon lights reflecting on rain-soaked streets at night\n..."}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none font-mono leading-relaxed"
            />
            <p className="text-xs text-zinc-600">
              {input.split("\n").filter((l) => l.trim()).length} captions entered
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || input.split("\n").filter((l) => l.trim()).length === 0}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-lg text-sm"
          >
            {loading ? "Analyzing..." : "Run Analysis"}
          </button>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>
      )}

      {report && (
        <div className="space-y-5">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="text-violet-400 font-semibold">{captionsCount}</span> captions analyzed
          </div>

          {/* Overall */}
          <p className="text-sm text-zinc-300 leading-relaxed border-l-2 border-violet-500/40 pl-3">
            {report.overallAssessment}
          </p>

          {/* Content Pillars */}
          {report.contentPillars?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Content Pillars
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.contentPillars.map((pillar, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-zinc-200">{pillar.name}</span>
                      <span className="text-xs text-violet-400">{pillar.frequency}</span>
                    </div>
                    <p className="text-xs text-zinc-500">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hook Patterns */}
          {report.hookPatterns?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Hook Patterns
              </p>
              <div className="space-y-2">
                {report.hookPatterns.map((hook, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">{hook.pattern}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EFFECTIVENESS_STYLE[hook.effectiveness] ?? "text-zinc-400"}`}>
                        {hook.effectiveness}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 italic">"{hook.example}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posting Style */}
          {report.postingStyle && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Posting Style
              </p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-zinc-500">Tone: </span>
                    <span className="text-zinc-300">{report.postingStyle.tone}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Length: </span>
                    <span className="text-zinc-300">{report.postingStyle.avgLength}</span>
                  </div>
                </div>
                {report.postingStyle.languageNotes && (
                  <p className="text-xs text-zinc-400">{report.postingStyle.languageNotes}</p>
                )}
                {report.postingStyle.formatPatterns?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {report.postingStyle.formatPatterns.map((fp, i) => (
                      <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                        {fp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dominant Topics */}
          {report.dominantTopics?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Dominant Topics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {report.dominantTopics.map((topic, i) => (
                  <span key={i} className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full border border-violet-500/20">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Steal / Avoid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.steal?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-green-500/80 uppercase tracking-widest">
                  What to Steal
                </p>
                <ul className="space-y-1.5">
                  {report.steal.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                      <span className="text-green-400 shrink-0 mt-0.5">+</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {report.avoid?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-500/80 uppercase tracking-widest">
                  What to Avoid
                </p>
                <ul className="space-y-1.5">
                  {report.avoid.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                      <span className="text-red-400 shrink-0 mt-0.5">−</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
