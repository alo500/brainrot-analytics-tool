import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import type { VideoPerformance, GeneratedPrompt, PromptPattern } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Pattern detection ────────────────────────────────────

export async function detectPatterns(
  videos: VideoPerformance[]
): Promise<PromptPattern[]> {
  const top = videos
    .filter((v) => v.views > 0)
    .sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))
    .slice(0, 30);

  if (top.length < 3) return [];

  const promptList = top
    .map(
      (v, i) =>
        `${i + 1}. prompt: "${v.prompt}" | views: ${v.views} | engagement: ${((v.engagementRate ?? 0) * 100).toFixed(1)}% | completion: ${((v.completionRate ?? 0) * 100).toFixed(0)}%`
    )
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `You are analyzing short-form video performance data to find what makes content go viral.

Here are the top performing videos ranked by engagement:
${promptList}

Identify 3-5 distinct patterns that explain why these videos perform well. Look for:
- Visual/sensory elements (ASMR, satisfying, colorful, etc.)
- Subject matter or niche
- Pacing or energy level
- Emotional hooks
- Format patterns

Respond ONLY with a JSON array of pattern objects with this shape:
[
  {
    "description": "short pattern name",
    "keywords": ["keyword1", "keyword2"],
    "topExamples": ["example prompt 1", "example prompt 2"]
  }
]`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text;
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: Array<{
    description: string;
    keywords: string[];
    topExamples: string[];
  }> = JSON.parse(jsonMatch[0]);

  return parsed.map((p) => {
    const matching = top.filter((v) =>
      p.keywords.some((k) =>
        v.prompt.toLowerCase().includes(k.toLowerCase())
      )
    );
    const avgViews =
      matching.length > 0
        ? matching.reduce((s, v) => s + v.views, 0) / matching.length
        : top.reduce((s, v) => s + v.views, 0) / top.length;
    const avgEng =
      matching.length > 0
        ? matching.reduce((s, v) => s + (v.engagementRate ?? 0), 0) /
          matching.length
        : 0;
    const avgComp =
      matching.length > 0
        ? matching.reduce((s, v) => s + (v.completionRate ?? 0), 0) /
          matching.length
        : 0;

    return {
      id: randomUUID(),
      description: p.description,
      keywords: p.keywords,
      avgViews: Math.round(avgViews),
      avgEngagementRate: avgEng,
      avgCompletionRate: avgComp,
      sampleCount: matching.length,
      topExamples: p.topExamples,
    };
  });
}

// ─── Prompt generation ────────────────────────────────────

export async function generatePrompts(
  patterns: PromptPattern[],
  topVideos: VideoPerformance[],
  count = 10
): Promise<GeneratedPrompt[]> {
  const patternSummary = patterns
    .map(
      (p) =>
        `- "${p.description}" (avg ${p.avgViews.toLocaleString()} views, ${(p.avgEngagementRate * 100).toFixed(1)}% engagement)`
    )
    .join("\n");

  const topPrompts = topVideos
    .slice(0, 10)
    .map((v) => `"${v.prompt}" — ${v.views.toLocaleString()} views`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a viral short-form video strategist. Based on the performance data below, generate ${count} new video prompts that are likely to perform extremely well.

TOP PERFORMING PATTERNS:
${patternSummary}

TOP PERFORMING PROMPTS:
${topPrompts}

Generate ${count} new prompts that:
1. Build on the proven patterns above
2. Are specific enough to guide an AI video model (Kling or Wan2.1)
3. Are fresh and not repetitive of existing top prompts
4. Are optimized for short-form vertical video (TikTok/Reels style)

Respond ONLY with a JSON array:
[
  {
    "prompt": "the full video generation prompt",
    "reasoning": "1-2 sentences on why this should perform well",
    "patterns": ["pattern description 1", "pattern description 2"],
    "model": "kling" | "wan" | "both",
    "aspectRatio": "9:16"
  }
]`,
      },
    ],
  });

  const raw = (message.content[0] as { text: string }).text;
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  const parsed: Array<{
    prompt: string;
    reasoning: string;
    patterns: string[];
    model: GeneratedPrompt["model"];
    aspectRatio: GeneratedPrompt["aspectRatio"];
  }> = JSON.parse(jsonMatch[0]);

  return parsed.map((p) => ({
    id: randomUUID(),
    prompt: p.prompt,
    reasoning: p.reasoning,
    basedOnPatterns: p.patterns,
    model: p.model ?? "both",
    aspectRatio: p.aspectRatio ?? "9:16",
    status: "pending",
    createdAt: new Date().toISOString(),
  }));
}
