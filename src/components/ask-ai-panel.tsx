import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Send, Loader2, X, BellRing, BellOff } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { askAi } from "@/lib/ai.functions";

export type AppSnapshot = {
  companyName: string;
  companyKind: string;
  view: string;
  kpis: { label: string; value: string; delta: string }[];
  leads: { name: string; time: string; stage: string; message: string; phone: string; email: string }[];
  pipeline: { stage: string; count: number; value: string }[];
  tasks: { name: string; owner: string; due: string; status: string }[];
  activity: { title: string; body: string; time: string }[];
};

function serializeSnapshot(s: AppSnapshot): string {
  const lines: string[] = [];
  lines.push(`Company: ${s.companyName} (${s.companyKind})`);
  lines.push(`Active view: ${s.view}`);
  lines.push(`Today: ${new Date().toDateString()}`);
  lines.push("");
  lines.push("KPIs:");
  s.kpis.forEach((k) => lines.push(`- ${k.label}: ${k.value} (${k.delta})`));
  lines.push("");
  lines.push("Pipeline by stage:");
  s.pipeline.forEach((p) => lines.push(`- ${p.stage}: ${p.count} deals, ${p.value}`));
  lines.push("");
  lines.push("Recent leads:");
  s.leads.forEach((l) =>
    lines.push(`- ${l.name} [${l.stage}] ${l.time} · ${l.phone} · ${l.email} — ${l.message}`),
  );
  lines.push("");
  lines.push("Tasks:");
  s.tasks.forEach((t) => lines.push(`- ${t.name} — owner ${t.owner}, due ${t.due}, status ${t.status}`));
  lines.push("");
  lines.push("Recent activity:");
  s.activity.forEach((a) => lines.push(`- [${a.time}] ${a.title}: ${a.body}`));
  return lines.join("\n");
}

type Preset = { label: string; prompt: string };

const PRESETS: Preset[] = [
  {
    label: "Today's follow-ups",
    prompt:
      "Using the app snapshot, list TODAY'S follow-ups I must do across leads, deals, quotations and payments. For each, give: who, why now, and a one-line action. Group by priority (High/Medium/Low). Be specific — use names and amounts from the snapshot.",
  },
  {
    label: "Pending follow-ups",
    prompt:
      "From the snapshot, list every PENDING follow-up (leads not moved forward, proposals awaiting response, quotations without reply). For each: contact name, stage, last touch, and the exact next step. Sort by risk of slipping.",
  },
  {
    label: "Pending tasks report",
    prompt:
      "Produce a status report of all pending / in-progress / blocked tasks from the snapshot. Format as a table (Task | Owner | Due | Status | Suggested unblock). End with 3 bullets on what I personally should do today.",
  },
  {
    label: "Overdue payments",
    prompt:
      "From KPIs and activity, summarize overdue / open invoices. List likely defaulters, suggested tone (soft/firm/final), and draft a one-line WhatsApp reminder for each. Currency INR.",
  },
  {
    label: "Draft all reminders",
    prompt:
      "For each pending follow-up and overdue payment in the snapshot, draft a short reminder message (max 60 words). Output as: '— To <name> [<channel: Email/WhatsApp>]:' then the message. Warm, professional, INR currency.",
  },
  {
    label: "End-of-day summary",
    prompt:
      "Give me a crisp end-of-day executive summary from the snapshot: what moved, what's at risk, top 3 wins, top 3 risks, and 5 actions for tomorrow. Use bullets.",
  },
  {
    label: "Next best actions",
    prompt:
      "List the top 7 next best actions this week to accelerate closure and recover payments, tied to specific names/deals in the snapshot. Each item: Action verb → target → expected impact.",
  },
];

const REMINDER_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function AskAiPanel({ snapshot }: { snapshot: AppSnapshot }) {
  const askFn = useServerFn(askAi);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [autoReminder, setAutoReminder] = useState(false);

  const contextText = useMemo(() => serializeSnapshot(snapshot), [snapshot]);
  const snapshotRef = useRef(contextText);
  snapshotRef.current = contextText;

  async function run(nextPrompt?: string) {
    const finalPrompt = (nextPrompt ?? prompt).trim();
    if (!finalPrompt || loading) return;
    setLoading(true);
    setError("");
    setAnswer("");
    try {
      const res = await askFn({ data: { prompt: finalPrompt, context: contextText } });
      setAnswer(res.text || "No response.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Auto reminder — periodically asks the AI for the single most urgent thing
  // right now, and surfaces it as a toast.
  useEffect(() => {
    if (!autoReminder) return;
    let cancelled = false;

    async function tick() {
      try {
        const res = await askFn({
          data: {
            prompt:
              "Based ONLY on the snapshot, output ONE single most urgent reminder for right now, under 25 words. Include the person or deal name. No preamble, no bullets, one plain sentence.",
            context: snapshotRef.current,
          },
        });
        if (cancelled) return;
        const text = (res.text || "").trim();
        if (text) {
          toast(text, {
            icon: <BellRing className="size-4 text-[#FBBC05]" />,
            duration: 8000,
          });
        }
      } catch {
        /* silent — auto reminders should never spam errors */
      }
    }

    void tick();
    const id = setInterval(tick, REMINDER_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [autoReminder, askFn]);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-100 bg-gradient-to-r from-[#E8F0FE] via-white to-[#FEF7E0]">
        <div className="size-7 rounded-md bg-zinc-900 grid place-items-center">
          <Sparkles className="size-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-none">Ask AI</p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Reports on today's follow-ups, pending tasks, overdue payments · powered by Groq
          </p>
        </div>
        <button
          onClick={() => {
            setAutoReminder((v) => {
              const next = !v;
              toast(next ? "Auto reminders on — every 5 min" : "Auto reminders paused", {
                icon: next ? (
                  <BellRing className="size-4 text-[#34A853]" />
                ) : (
                  <BellOff className="size-4 text-zinc-500" />
                ),
              });
              return next;
            });
          }}
          className={`text-xs font-medium px-3 py-1.5 rounded-none border flex items-center gap-1.5 transition-colors ${
            autoReminder
              ? "bg-[#34A853] text-white border-[#34A853] hover:bg-[#2d8f46]"
              : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
          }`}
          title="Continuously surface the next urgent reminder"
        >
          {autoReminder ? <BellRing className="size-3.5" /> : <BellOff className="size-3.5" />}
          {autoReminder ? "Auto reminders on" : "Enable auto reminders"}
        </button>
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
            placeholder="Ask anything about your leads, tasks, payments…"
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
