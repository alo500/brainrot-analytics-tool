import { NextResponse } from "next/server";
import { getPerformance } from "@/lib/supabase";
import { detectPatterns } from "@/lib/claude";
import type { AnalyticsSummary } from "@/types";

export async function GET() {
  const videos = await getPerformance(200);

  if (!videos.length) {
    return NextResponse.json({ videos: [], patterns: [], summary: null });
  }

  // Compute summary
  const totalViews = videos.reduce((s, v) => s + v.views, 0);
  const avgEng =
    videos.reduce((s, v) => s + (v.engagementRate ?? 0), 0) / videos.length;
  const avgComp =
    videos.reduce((s, v) => s + (v.completionRate ?? 0), 0) / videos.length;

  const modelCounts: Record<string, number> = {};
  const platformCounts: Record<string, number> = {};
  for (const v of videos) {
    modelCounts[v.model] = (modelCounts[v.model] ?? 0) + v.views;
    platformCounts[v.platform] = (platformCounts[v.platform] ?? 0) + v.views;
  }
  const topModel = Object.entries(modelCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "kling";
  const topPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "tiktok";

  // Simple trend: compare last 10 vs previous 10
  const sorted = [...videos].sort(
    (a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
  );
  const recent = sorted.slice(0, 10);
  const prev = sorted.slice(10, 20);
  const recentAvg = recent.length
    ? recent.reduce((s, v) => s + v.views, 0) / recent.length
    : 0;
  const prevAvg = prev.length
    ? prev.reduce((s, v) => s + v.views, 0) / prev.length
    : 0;
  const recentTrend =
    prevAvg === 0 ? "flat" : recentAvg > prevAvg * 1.1 ? "up" : recentAvg < prevAvg * 0.9 ? "down" : "flat";

  const summary: AnalyticsSummary = {
    totalVideos: videos.length,
    totalViews,
    avgEngagementRate: avgEng,
    avgCompletionRate: avgComp,
    topModel: topModel as AnalyticsSummary["topModel"],
    topPlatform: topPlatform as AnalyticsSummary["topPlatform"],
    recentTrend: recentTrend as AnalyticsSummary["recentTrend"],
  };

  // Run pattern detection
  const patterns = await detectPatterns(videos);

  return NextResponse.json({ videos, patterns, summary });
}
