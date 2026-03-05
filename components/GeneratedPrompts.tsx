"use client";

import { useState } from "react";
import type { GeneratedPrompt } from "@/types";

interface Props {
  prompts: GeneratedPrompt[];
  brainrotUrl: string;
  onUpdate: () => void;
}

const MODEL_COLORS: Record<GeneratedPrompt["model"], string> = {
  kling: "text-orange-400 bg-orange-500/10",
  wan: "text-cyan-400 bg-cyan-500/10",
  both: "text-violet-400 bg-violet-500/10",
};

export default function GeneratedPrompts({ prompts, brainrotUrl, onUpdate }: Props) {
  const pending = prompts.filter((p) => p.status === "pending");
  const sent = prompts.filter((p) => p.status === "sent");

  async function handleAction(id: string, status: "sent" | "dismissed") {
    await fetch("/api/prompts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, brainrotUrl }),
    });
    onUpdate();
  }

  if (!prompts.length) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
        Generated Prompts
        <span className="ml-2 text-violet-400 font-normal normal-case">
          {pending.length} pending · {sent.length} sent
        </span>
      </h2>
      <div className="space-y-2">
        {prompts.map((p) => (
          <PromptRow
            key={p.id}
            prompt={p}
            onSend={() => handleAction(p.id, "sent")}
            onDismiss={() => handleAction(p.id, "dismissed")}
          />
        ))}
      </div>
    </div>
  );
}

function PromptRow({
  prompt: p,
  onSend,
  onDismiss,
}: {
  prompt: GeneratedPrompt;
  onSend: () => void;
  onDismiss: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`border rounded-xl p-4 transition-colors ${
        p.status === "sent"
          ? "border-green-800/50 bg-green-900/5"
          : p.status === "dismissed"
          ? "border-zinc-800 opacity-40"
          : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-zinc-100 leading-relaxed">{p.prompt}</p>
          {expanded && (
            <p className="mt-2 text-xs text-zinc-500 italic">{p.reasoning}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${MODEL_COLORS[p.model]}`}>
              {p.model}
            </span>
            <span className="text-xs text-zinc-600">{p.aspectRatio}</span>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-zinc-600 hover:text-zinc-400"
            >
              {expanded ? "hide reasoning" : "why this?"}
            </button>
          </div>
        </div>

        {p.status === "pending" && (
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onSend}
              className="text-xs bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg"
            >
              Send
            </button>
            <button
              onClick={onDismiss}
              className="text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-3 py-1.5 rounded-lg"
            >
              Dismiss
            </button>
          </div>
        )}

        {p.status === "sent" && (
          <span className="text-xs text-green-400 shrink-0">Sent ✓</span>
        )}
      </div>
    </div>
  );
}
