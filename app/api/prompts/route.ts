import { NextRequest, NextResponse } from "next/server";
import { getTopPerformers, saveGeneratedPrompts, getGeneratedPrompts, updatePromptStatus } from "@/lib/supabase";
import { detectPatterns, generatePrompts } from "@/lib/claude";

// GET — list previously generated prompts
export async function GET() {
  const prompts = await getGeneratedPrompts();
  return NextResponse.json({ prompts });
}

// POST — run the feedback loop: analyze top performers, generate new prompts
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const count = Number(body.count ?? 10);

  const topVideos = await getTopPerformers(30);
  if (topVideos.length < 3) {
    return NextResponse.json(
      { error: "Need at least 3 videos with performance data to generate prompts." },
      { status: 400 }
    );
  }

  const patterns = await detectPatterns(topVideos);
  const prompts = await generatePrompts(patterns, topVideos, count);

  await saveGeneratedPrompts(prompts);

  return NextResponse.json({ prompts, patterns });
}

// PATCH — update a prompt's status (send to brainrot queue or dismiss)
export async function PATCH(req: NextRequest) {
  const { id, status, brainrotUrl } = await req.json();

  if (!id || !status) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  await updatePromptStatus(id, status);

  // If marking as sent, forward to brainrot-autocreator queue
  if (status === "sent" && brainrotUrl) {
    const { prompts } = await import("@/lib/supabase").then((m) =>
      m.getGeneratedPrompts()
    );
    const prompt = prompts.find((p) => p.id === id);
    if (prompt) {
      await fetch(`${brainrotUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-worker-secret": process.env.BRAINROT_WORKER_SECRET ?? "",
        },
        body: JSON.stringify({
          prompt: prompt.prompt,
          model: prompt.model,
          aspectRatio: prompt.aspectRatio,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
