"use client";

import type { AnalyticsSummary } from "@/types";

const TREND_ICON = { up: "↑", down: "↓", flat: "→" };
const TREND_COLOR = { up: "text-green-400", down: "text-red-400", flat: "text-zinc-400" };

export default function SummaryCards({ summary }: { summary: AnalyticsSummary }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card label="Total Views" value={summary.totalViews.toLocaleString()} sub="all time" />
      <Card label="Avg Engagement" value={`${(summary.avgEngagementRate * 100).toFixed(1)}%`} sub="likes + comments + shares / views" />
      <Card label="Avg Completion" value={`${(summary.avgCompletionRate * 100).toFixed(0)}%`} sub="watch time / duration" />
      <Card
        label="Recent Trend"
        value={`${TREND_ICON[summary.recentTrend]} ${summary.recentTrend}`}
        sub="last 10 vs prev 10 videos"
        valueClass={TREND_COLOR[summary.recentTrend]}
      />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  valueClass = "text-zinc-100",
}: {
  label: string;
  value: string;
  sub: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-xs font-medium text-zinc-400 mt-1">{label}</div>
      <div className="text-xs text-zinc-600 mt-0.5">{sub}</div>
    </div>
  );
}
