import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST — analyze competitor video captions to extract strategy insights
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { captions } = body as { captions?: string[] };

  if (!captions || !Array.isArray(captions) || captions.length === 0) {
    return NextResponse.json(
      { error: "captions array is required" },
      { status: 400 }
    );
  }

  const captionList = captions
    .map((c, i) => `${i + 1}. ${c}`)
    .join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `You are a competitive intelligence analyst for short-form video content. Analyze these ${captions.length} video captions/descriptions from a competitor account.

COMPETITOR CAPTIONS:
${captionList}

Perform a deep competitive analysis. Extract:
1. Content pillars (main topic categories they focus on)
2. Hook patterns (how they open videos / grab attention)
3. Posting style (tone, language, length, format patterns)
4. Dominant topics (what subjects appear most)
5. What to steal (tactics worth adopting)
6. What to avoid (things that seem weak or oversaturated)

Respond ONLY with a JSON object:
{
  "contentPillars": [
    { "name": "<pillar name>", "description": "<what it covers>", "frequency": "<rough % of content>" }
  ],
  "hookPatterns": [
    { "pattern": "<hook type>", "example": "<example from their captions>", "effectiveness": "high" | "medium" | "low" }
  ],
  "postingStyle": {
    "tone": "<description>",
    "avgLength": "<short/medium/long>",
    "formatPatterns": ["<pattern 1>", "<pattern 2>"],
    "languageNotes": "<observations about their language/voice>"
  },
  "dominantTopics": ["<topic 1>", "<topic 2>", "<topic 3>"],
  "steal": ["<tactic/insight to adopt 1>", "<tactic/insight to adopt 2>", "<tactic/insight to adopt 3>"],
  "avoid": ["<thing to avoid 1>", "<thing to avoid 2>"],
  "overallAssessment": "<2-3 sentence summary of their strategy and positioning>"
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

  const analysis = JSON.parse(jsonMatch[0]);
  return NextResponse.json({ analysis, captionsAnalyzed: captions.length });
}
