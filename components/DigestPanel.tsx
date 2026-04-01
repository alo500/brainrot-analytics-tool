"use client";

import { useState } from "react";

interface DigestData {
  top3: Array<{ prompt: string; why: string }>;
  patterns: string[];
  recommendations: string[];
  summary: string;
}

interface DigestResponse {
  ok: boolean;
  videosAnalyzed: number;
  digest: DigestData;
  discordSent: boolean;
}

export default function DigestPanel() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DigestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSendDigest() {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch("/api/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      setResult(data as DigestResponse);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate digest");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
            Weekly Digest
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Summarize last 7 days · post to Discord
          </p>
        </div>
        <div className="flex items-center gap-3">
          {result && (
            <button
              onClick={() => setOpen(!open)}
              className="text-xs text-zinc-500 hover:text-zinc-300"
            >
              {open ? "Hide" : "View last digest"}
            </button>
          )}
          <button
            onClick={handleSendDigest}
            disabled={loading}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            {loading ? "Generating..." : "Send Digest"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {result && open && (
        <div className="space-y-4">
          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <span>{result.videosAnalyzed} videos analyzed</span>
            <span>·</span>
            {result.discordSent ? (
              <span className="text-green-400">Posted to Discord</span>
            ) : (
              <span className="text-zinc-600">Discord not configured</span>
            )}
          </div>

          {/* Summary */}
          <p className="text-sm text-zinc-300 leading-relaxed">
            {result.digest.summary}
          </p>

          {/* Top 3 */}
          {result.digest.top3.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Top Performers
              </p>
              <div className="space-y-2">
                {result.digest.top3.map((item, i) => (
                  <div key={i} className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 space-y-1">
                    <div className="flex items-start gap-2">
                      <span className="text-violet-400 text-xs font-bold shrink-0 mt-0.5">
                        #{i + 1}
                      </span>
                      <p className="text-xs text-zinc-200 leading-relaxed">
                        "{item.prompt}"
                      </p>
                    </div>
                    <p className="text-xs text-zinc-500 italic pl-4">{item.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patterns */}
          {result.digest.patterns.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Emerging Patterns
              </p>
              <ul className="space-y-1">
                {result.digest.patterns.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-zinc-400">
                    <span className="text-violet-400 shrink-0 mt-0.5">→</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {result.digest.recommendations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                Recommended Prompts for Next Week
              </p>
              <div className="space-y-1.5">
                {result.digest.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-300"
                  >
                    <span className="text-violet-400 font-semibold mr-2">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
