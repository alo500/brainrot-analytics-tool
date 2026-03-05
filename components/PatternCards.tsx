"use client";

import type { PromptPattern } from "@/types";

export default function PatternCards({ patterns }: { patterns: PromptPattern[] }) {
  if (!patterns.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
        Detected Patterns
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {patterns.map((p) => (
          <div key={p.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="font-semibold text-zinc-100">{p.description}</div>
            <div className="flex flex-wrap gap-1.5">
              {p.keywords.map((k) => (
                <span key={k} className="text-xs bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full">
                  {k}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="Avg Views" value={p.avgViews.toLocaleString()} />
              <Stat label="Engagement" value={`${(p.avgEngagementRate * 100).toFixed(1)}%`} />
              <Stat label="Completion" value={`${(p.avgCompletionRate * 100).toFixed(0)}%`} />
            </div>
            <div className="space-y-1">
              {p.topExamples.slice(0, 2).map((ex, i) => (
                <p key={i} className="text-xs text-zinc-500 line-clamp-1 italic">
                  "{ex}"
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-950 rounded-lg p-2">
      <div className="text-sm font-bold text-zinc-200">{value}</div>
      <div className="text-xs text-zinc-600">{label}</div>
    </div>
  );
}
