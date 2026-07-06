import { useState } from "react";
import { Sparkles, Send, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { askAi } from "@/lib/ai.functions";

const PRESETS: Array<{ label: string; prompt: string }> = [
  {
    label: "Draft lead follow-up",
    prompt:
      "Draft a warm, concise follow-up email to a warm lead who hasn't replied in 5 days. Keep it under 90 words, one clear CTA, professional tone. Sign off as 'Sohan'.",
  },
  {
    label: "Payment follow-up (overdue)",
    prompt:
      "Write a polite but firm payment reminder for an INR invoice that is 7 days overdue. Include a one-line summary, gentle urgency, and offer to share the statement. Under 90 words.",
  },
  {
    label: "Quotation follow-up",
    prompt:
      "Draft a follow-up message for a quotation sent 3 days ago. Ask if they need any changes, offer a quick 15-min call, and reinforce one key value point. Under 80 words.",
  },
  {
    label: "Summarize today's pipeline",
    prompt:
      "Give me a 5-bullet executive summary of what a sales head should focus on today across leads, pipeline, and overdue payments. Be specific and action-oriented.",
  },
  {
    label: "Next best actions",
    prompt:
      "List the top 5 next best actions for me this week to accelerate deal closure and recover overdue payments. Use bullets, each with a clear action verb.",
  },
  {
    label: "WhatsApp check-in",
    prompt:
      "Write a short, friendly WhatsApp check-in (under 40 words) for a prospect I met last week — no hard sell, just re-open the conversation.",
  },
];

export function AskAiPanel({ contextLabel }: { contextLabel?: string }) {
  const askFn = useServerFn(askAi);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  async function run(nextPrompt?: string) {
    const finalPrompt = (nextPrompt ?? prompt).trim();
    if (!finalPrompt || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await askFn({ data: { prompt: finalPrompt, context: contextLabel } });
      setAnswer(res.text || "No response.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-gradient-to-r from-[#E8F0FE] via-white to-[#FEF7E0]">
        <div className="size-7 rounded-md bg-zinc-900 grid place-items-center">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">Ask AI</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Draft follow-ups, summarize pipeline, plan next moves — powered by Groq
          </p>
        </div>
      </div>

      <div className="px-5 pt-3 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setPrompt(p.prompt);
              void run(p.prompt);
            }}
            disabled={loading}
            className="text-xs font-medium px-3 py-1.5 rounded-none border border-zinc-200 bg-white hover:bg-zinc-50 disabled:opacity-50 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="p-5 pt-3">
        <div className="flex items-center gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
            placeholder="Ask anything — e.g. 'Draft a follow-up for Marco Silva about Term 2 payment'"
            className="flex-1 h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
            disabled={loading}
          />
          <button
            onClick={() => void run()}
            disabled={loading || !prompt.trim()}
            className="h-10 px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {loading ? "Thinking…" : "Ask"}
          </button>
        </div>

        {(answer || error) && (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 relative">
            <button
              onClick={() => {
                setAnswer("");
                setError("");
              }}
              className="absolute top-2 right-2 size-6 rounded grid place-items-center hover:bg-zinc-200 text-zinc-500"
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </button>
            {error ? (
              <p className="text-sm text-[#C5221F] pr-6">{error}</p>
            ) : (
              <pre className="text-sm text-zinc-800 whitespace-pre-wrap font-sans pr-6 leading-relaxed">
                {answer}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
