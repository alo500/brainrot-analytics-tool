"use client";

import { useState } from "react";

export default function IngestForm({ onSubmit }: { onSubmit?: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    prompt: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
    watchTimeSeconds: "",
    durationSeconds: "5",
    model: "kling",
    platform: "tiktok",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          views: Number(form.views),
          likes: Number(form.likes),
          comments: Number(form.comments),
          shares: Number(form.shares),
          watchTimeSeconds: Number(form.watchTimeSeconds),
          durationSeconds: Number(form.durationSeconds),
        }),
      });
      setForm({ prompt: "", views: "", likes: "", comments: "", shares: "", watchTimeSeconds: "", durationSeconds: "5", model: "kling", platform: "tiktok" });
      setOpen(false);
      onSubmit?.();
    } finally {
      setLoading(false);
    }
  }

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-zinc-500">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-zinc-500"
      />
    </div>
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
          Log Video Performance
        </h2>
        <button onClick={() => setOpen(!open)} className="text-xs text-violet-400 hover:text-violet-300">
          {open ? "Close" : "+ Add entry"}
        </button>
      </div>

      {open && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-zinc-500">Prompt</label>
            <textarea
              value={form.prompt}
              onChange={(e) => setForm({ ...form, prompt: e.target.value })}
              rows={2}
              className="bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {field("views", "Views", "number")}
            {field("likes", "Likes", "number")}
            {field("comments", "Comments", "number")}
            {field("shares", "Shares", "number")}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {field("watchTimeSeconds", "Avg Watch Time (s)", "number")}
            {field("durationSeconds", "Duration (s)", "number")}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Model</label>
              <select value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                <option value="kling">Kling</option>
                <option value="wan">Wan2.1</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-zinc-500">Platform</label>
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200">
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube Shorts</option>
                <option value="instagram">Instagram Reels</option>
                <option value="manual">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading || !form.prompt || !form.views}
            className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold py-2 rounded-lg text-sm">
            {loading ? "Saving..." : "Log Performance"}
          </button>
        </form>
      )}
    </div>
  );
}
