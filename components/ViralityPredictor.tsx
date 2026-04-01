"use client";

import { useState } from "react";

interface PredictResult {
  score: number;
  reasoning: string;
  suggestions: string[];
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 8
      ? "bg-green-500/15 text-green-400 border-green-500/30"
      : score >= 6
      ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
      : score >= 4
      ? "bg-orange-500/15 text-orange-400 border-orange-500/30"
      : "bg-red-500/15 text-red-400 border-red-500/30";

  const label =
    score >= 8
      ? "High potential"
      : score >= 6
      ? "Decent shot"
      : score >= 4
      ? "Needs work"
      : "Low potential";

  return (
    <div className={`inline-flex items-center gap-2 border rounded-xl px-4 py-2 ${color}`}>
      <span className="text-3xl font-bold tabular-nums">{score}</span>
      <div>
        <div className="text-xs font-semibold">/10</div>
        <div className="text-xs opacity-80">{label}</div>
      </div>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  const barColor =
    score >= 8
      ? "bg-green-500"
      : score >= 6
      ? "bg-yellow-500"
      : score >= 4
      ? "bg-orange-500"
      : "bg-red-500";

  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ViralityPredictor() {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("kling");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePredict() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult(data as PredictResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to predict");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
          Virality Predictor
        </h2>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs text-violet-400 hover:text-violet-300"
        >
          {open ? "Close" : "Predict a prompt"}
        </button>
      </div>

      {open && (
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Prompt to score</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              placeholder="Paste or type your video prompt here..."
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none resize-none"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1 w-36">
              <label className="text-xs text-zinc-500">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200"
              >
                <option value="kling">Kling</option>
                <option value="wan">Wan2.1</option>
              </select>
            </div>
            <button
              onClick={handlePredict}
              disabled={loading || !prompt.trim()}
              className="mt-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-5 py-2 rounded-lg text-sm"
            >
              {loading ? "Scoring..." : "Predict Score"}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {result && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center gap-4">
                <ScoreBadge score={result.score} />
                <div className="flex-1">
                  <ScoreBar score={result.score} />
                  <p className="text-xs text-zinc-500 mt-1">virality score</p>
                </div>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed">
                {result.reasoning}
              </p>

              {result.suggestions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    Suggestions
                  </p>
                  <ul className="space-y-1.5">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                        <span className="text-violet-400 shrink-0 mt-0.5">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
