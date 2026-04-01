import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTopPerformers } from "@/lib/supabase";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST — score a prompt 1-10 for virality potential
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { prompt, model, style } = body as {
    prompt?: string;
    model?: string;
    style?: string;
  };

  if (!prompt) {
    return NextResponse.json({ error: "prompt is required" }, { status: 400 });
  }

  const topVideos = await getTopPerformers(20);

  const topList =
    topVideos.length > 0
      ? topVideos
          .map(
            (v, i) =>
              `${i + 1}. "${v.prompt}" | views: ${v.views.toLocaleString()} | engagement: ${((v.engagementRate ?? 0) * 100).toFixed(1)}% | completion: ${((v.completionRate ?? 0) * 100).toFixed(0)}%`
          )
          .join("\n")
      : "No performance data available yet.";

  const contextNote =
    topVideos.length === 0
      ? "No historical data is available yet. Score based on general short-form video virality principles."
      : `Use the top performing videos above as the benchmark for what earns high scores.`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [
      {
        role: "user",
        content: `You are a short-form video virality expert. Score the following video generation prompt for its virality potential on TikTok/Reels/Shorts.

TOP PERFORMING VIDEOS (for reference):
${topList}

${contextNote}

PROMPT TO SCORE:
"${prompt}"${model ? `\nTarget model: ${model}` : ""}${style ? `\nStyle/notes: ${style}` : ""}

Evaluate based on:
- Visual appeal and watchability
- Hook potential (first 2 seconds)
- Emotional resonance
- Trend alignment
- Completion rate likelihood
- Share/repost potential

Respond ONLY with a JSON object:
{
  "score": <number 1-10>,
  "reasoning": "<2-3 sentence explanation of the score>",
  "suggestions": ["<improvement 1>", "<improvement 2>", "<improvement 3>"]
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

  const result = JSON.parse(jsonMatch[0]) as {
    score: number;
    reasoning: string;
    suggestions: string[];
  };

  return NextResponse.json(result);
}
