import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabase } from "@/lib/supabase";
import type { VideoPerformance } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function rowToPerf(r: Record<string, unknown>): VideoPerformance {
  const views = Number(r.views) || 0;
  const likes = Number(r.likes) || 0;
  const comments = Number(r.comments) || 0;
  const shares = Number(r.shares) || 0;
  const watchTime = Number(r.watch_time_seconds) || 0;
  const duration = Number(r.duration_seconds) || 1;
  return {
    id: r.id as string,
    prompt: r.prompt as string,
    model: r.model as VideoPerformance["model"],
    platform: r.platform as VideoPerformance["platform"],
    videoUrl: r.video_url as string | undefined,
    views,
    likes,
    comments,
    shares,
    watchTimeSeconds: watchTime,
    durationSeconds: duration,
    postedAt: r.posted_at as string,
    createdAt: r.created_at as string,
    completionRate: watchTime / duration,
    engagementRate: views > 0 ? (likes + comments + shares) / views : 0,
  };
}

// POST — generate and send weekly digest
export async function POST() {
  // Fetch last 7 days of performance
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("video_performance")
    .select("*")
    .gte("posted_at", since)
    .order("views", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const videos: VideoPerformance[] = (data ?? []).map(rowToPerf);

  if (videos.length === 0) {
    return NextResponse.json(
      { error: "No videos posted in the last 7 days." },
      { status: 400 }
    );
  }

  const videoList = videos
    .slice(0, 30)
    .map(
      (v, i) =>
        `${i + 1}. "${v.prompt}" | views: ${v.views.toLocaleString()} | engagement: ${((v.engagementRate ?? 0) * 100).toFixed(1)}% | completion: ${((v.completionRate ?? 0) * 100).toFixed(0)}% | platform: ${v.platform}`
    )
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a viral content strategist. Analyze the last 7 days of video performance and create a weekly digest.

LAST 7 DAYS OF VIDEOS (${videos.length} total):
${videoList}

Create a concise weekly digest with:
1. Top 3 performers and why they worked
2. 2-3 emerging patterns you notice
3. 5 recommended prompts for next week based on what's working

Respond ONLY with a JSON object:
{
  "top3": [
    { "prompt": "<prompt text>", "why": "<why it worked>" }
  ],
  "patterns": ["<pattern 1>", "<pattern 2>"],
  "recommendations": ["<prompt 1>", "<prompt 2>", "<prompt 3>", "<prompt 4>", "<prompt 5>"],
  "summary": "<2-3 sentence overall weekly summary>"
}`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text;
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json(
      { error: "Failed to parse Claude response" },
      { status: 500 }
    );
  }

  const digest = JSON.parse(jsonMatch[0]) as {
    top3: Array<{ prompt: string; why: string }>;
    patterns: string[];
    recommendations: string[];
    summary: string;
  };

  // Post to Discord webhook
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (webhookUrl) {
    const top3Text = digest.top3
      .map((t, i) => `**${i + 1}.** "${t.prompt}"\n> ${t.why}`)
      .join("\n\n");

    const patternsText = digest.patterns
      .map((p) => `• ${p}`)
      .join("\n");

    const recsText = digest.recommendations
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n");

    const discordBody = {
      embeds: [
        {
          title: "signal. — Weekly Digest",
          description: digest.summary,
          color: 0x7c3aed,
          fields: [
            {
              name: "Top 3 Performers",
              value: top3Text || "No data",
            },
            {
              name: "Emerging Patterns",
              value: patternsText || "No patterns detected",
            },
            {
              name: "Recommended Prompts for Next Week",
              value: recsText || "No recommendations",
            },
          ],
          footer: {
            text: `signal. | ${videos.length} videos analyzed | last 7 days`,
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordBody),
    });
  }

  return NextResponse.json({
    ok: true,
    videosAnalyzed: videos.length,
    digest,
    discordSent: !!webhookUrl,
  });
}
