export type Platform = "tiktok" | "youtube" | "instagram" | "manual";
export type VideoModel = "kling" | "wan";

export interface VideoPerformance {
  id: string;
  prompt: string;
  model: VideoModel;
  platform: Platform;
  videoUrl?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTimeSeconds: number; // avg watch time
  durationSeconds: number;  // total video length
  postedAt: string;
  createdAt: string;
  // derived
  completionRate?: number;  // watchTime / duration
  engagementRate?: number;  // (likes + comments + shares) / views
}

export interface PromptPattern {
  id: string;
  description: string;           // e.g. "ASMR close-up with studio lighting"
  keywords: string[];
  avgViews: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  sampleCount: number;
  topExamples: string[];         // top performing prompts matching this pattern
}

export interface GeneratedPrompt {
  id: string;
  prompt: string;
  reasoning: string;             // why Claude thinks this will perform
  basedOnPatterns: string[];     // pattern IDs it draws from
  model: VideoModel | "both";
  aspectRatio: "9:16" | "16:9" | "1:1";
  status: "pending" | "sent" | "dismissed";
  createdAt: string;
}

export interface AnalyticsSummary {
  totalVideos: number;
  totalViews: number;
  avgEngagementRate: number;
  avgCompletionRate: number;
  topModel: VideoModel;
  topPlatform: Platform;
  recentTrend: "up" | "down" | "flat";
}
