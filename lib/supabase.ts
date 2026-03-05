import { createClient } from "@supabase/supabase-js";
import type { VideoPerformance, GeneratedPrompt } from "@/types";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Video Performance ────────────────────────────────────

export async function savePerformance(v: VideoPerformance) {
  const { error } = await supabase.from("video_performance").upsert({
    id: v.id,
    prompt: v.prompt,
    model: v.model,
    platform: v.platform,
    video_url: v.videoUrl,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    shares: v.shares,
    watch_time_seconds: v.watchTimeSeconds,
    duration_seconds: v.durationSeconds,
    posted_at: v.postedAt,
    created_at: v.createdAt,
  });
  if (error) throw error;
}

export async function getPerformance(limit = 200): Promise<VideoPerformance[]> {
  const { data, error } = await supabase
    .from("video_performance")
    .select("*")
    .order("views", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToPerf);
}

export async function getTopPerformers(n = 20): Promise<VideoPerformance[]> {
  const { data, error } = await supabase
    .from("video_performance")
    .select("*")
    .order("views", { ascending: false })
    .limit(n);
  if (error) throw error;
  return (data ?? []).map(rowToPerf);
}

// ─── Generated Prompts ────────────────────────────────────

export async function saveGeneratedPrompts(prompts: GeneratedPrompt[]) {
  const { error } = await supabase.from("generated_prompts").insert(
    prompts.map((p) => ({
      id: p.id,
      prompt: p.prompt,
      reasoning: p.reasoning,
      based_on_patterns: p.basedOnPatterns,
      model: p.model,
      aspect_ratio: p.aspectRatio,
      status: p.status,
      created_at: p.createdAt,
    }))
  );
  if (error) throw error;
}

export async function getGeneratedPrompts(): Promise<GeneratedPrompt[]> {
  const { data, error } = await supabase
    .from("generated_prompts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []).map(rowToPrompt);
}

export async function updatePromptStatus(
  id: string,
  status: GeneratedPrompt["status"]
) {
  const { error } = await supabase
    .from("generated_prompts")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

// ─── Row mappers ─────────────────────────────────────────

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

function rowToPrompt(r: Record<string, unknown>): GeneratedPrompt {
  return {
    id: r.id as string,
    prompt: r.prompt as string,
    reasoning: r.reasoning as string,
    basedOnPatterns: (r.based_on_patterns as string[]) ?? [],
    model: r.model as GeneratedPrompt["model"],
    aspectRatio: r.aspect_ratio as GeneratedPrompt["aspectRatio"],
    status: r.status as GeneratedPrompt["status"],
    createdAt: r.created_at as string,
  };
}
