"use client";

import { useState } from "react";
import useSWR from "swr";
import SummaryCards from "@/components/SummaryCards";
import PatternCards from "@/components/PatternCards";
import GeneratedPrompts from "@/components/GeneratedPrompts";
import IngestForm from "@/components/IngestForm";
import ViralityPredictor from "@/components/ViralityPredictor";
import DigestPanel from "@/components/DigestPanel";
import CompetitorAnalysis from "@/components/CompetitorAnalysis";
import type { AnalyticsSummary, PromptPattern, GeneratedPrompt } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SignalDashboard() {
  const [generating, setGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [brainrotUrl, setBrainrotUrl] = useState(
    process.env.NEXT_PUBLIC_BRAINROT_URL ?? ""
  );

  const { data: analytics, mutate: refreshAnalytics } = useSWR<{
    summary: AnalyticsSummary | null;
    patterns: PromptPattern[];
  }>(`/api/analytics?r=${refreshKey}`, fetcher);

  const { data: promptData, mutate: refreshPrompts } = useSWR<{
    prompts: GeneratedPrompt[];
  }>("/api/prompts", fetcher);

  async function runFeedbackLoop() {
    setGenerating(true);
    try {
      await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 10 }),
      });
      await refreshPrompts();
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            signal<span className="text-violet-400">.</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            feedback loop — learn what hits, generate what works
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={brainrotUrl}
            onChange={(e) => setBrainrotUrl(e.target.value)}
            placeholder="brainrot-autocreator URL"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none w-64"
          />
          <button
            onClick={runFeedbackLoop}
            disabled={generating || !analytics?.summary}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm whitespace-nowrap"
          >
            {generating ? "Analyzing..." : "Run Feedback Loop"}
          </button>
        </div>
      </div>

      {/* Summary */}
      {analytics?.summary && <SummaryCards summary={analytics.summary} />}

      {!analytics?.summary && (
        <div className="text-center py-12 text-zinc-600 text-sm">
          No data yet. Log some video performance below to get started.
        </div>
      )}

      {/* Log performance */}
      <IngestForm onSubmit={() => setRefreshKey((k) => k + 1)} />

      {/* Patterns */}
      {analytics?.patterns && analytics.patterns.length > 0 && (
        <PatternCards patterns={analytics.patterns} />
      )}

      {/* Generated prompts */}
      {promptData?.prompts && promptData.prompts.length > 0 && (
        <GeneratedPrompts
          prompts={promptData.prompts}
          brainrotUrl={brainrotUrl}
          onUpdate={refreshPrompts}
        />
      )}

      {/* Virality Predictor */}
      <ViralityPredictor />

      {/* Discord Digest */}
      <DigestPanel />

      {/* Competitor Analysis */}
      <CompetitorAnalysis />
    </div>
  );
}
