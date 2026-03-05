import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { savePerformance } from "@/lib/supabase";
import type { VideoPerformance } from "@/types";

// POST a single video's performance data
// Can be called manually from the dashboard or by an external script
// pulling data from TikTok/YouTube/Instagram APIs
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.prompt || body.views === undefined) {
    return NextResponse.json(
      { error: "prompt and views are required" },
      { status: 400 }
    );
  }

  const perf: VideoPerformance = {
    id: body.id ?? randomUUID(),
    prompt: body.prompt,
    model: body.model ?? "kling",
    platform: body.platform ?? "manual",
    videoUrl: body.videoUrl,
    views: Number(body.views) || 0,
    likes: Number(body.likes) || 0,
    comments: Number(body.comments) || 0,
    shares: Number(body.shares) || 0,
    watchTimeSeconds: Number(body.watchTimeSeconds) || 0,
    durationSeconds: Number(body.durationSeconds) || 5,
    postedAt: body.postedAt ?? new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await savePerformance(perf);
  return NextResponse.json({ ok: true, id: perf.id });
}

// Bulk ingest
export async function PUT(req: NextRequest) {
  const { videos } = await req.json();

  if (!Array.isArray(videos)) {
    return NextResponse.json({ error: "videos array required" }, { status: 400 });
  }

  await Promise.all(
    videos.map((v) =>
      savePerformance({
        id: v.id ?? randomUUID(),
        prompt: v.prompt,
        model: v.model ?? "kling",
        platform: v.platform ?? "manual",
        videoUrl: v.videoUrl,
        views: Number(v.views) || 0,
        likes: Number(v.likes) || 0,
        comments: Number(v.comments) || 0,
        shares: Number(v.shares) || 0,
        watchTimeSeconds: Number(v.watchTimeSeconds) || 0,
        durationSeconds: Number(v.durationSeconds) || 5,
        postedAt: v.postedAt ?? new Date().toISOString(),
        createdAt: new Date().toISOString(),
      })
    )
  );

  return NextResponse.json({ ok: true, count: videos.length });
}
