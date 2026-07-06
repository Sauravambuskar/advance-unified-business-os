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

const PRESETS = [
  {
    label: "Today's follow-ups",
    prompt:
      "Using the snapshot, list TODAY'S follow-ups across leads, deals, quotations and payments. For each: who, why now, one-line action. Group by priority (High/Medium/Low). Use real names/amounts.",
  },
  {
    label: "Pending follow-ups",
    prompt:
      "From the snapshot, list every PENDING follow-up (leads not moved forward, proposals awaiting response, quotations without reply). For each: contact, stage, last touch, exact next step. Sort by slip risk.",
  },
  {
    label: "Pending tasks report",
    prompt:
      "Status report of pending / in-progress / blocked tasks. Format: Task | Owner | Due | Status | Suggested unblock. End with 3 bullets on what I should do today.",
  },
  {
    label: "Overdue payments",
    prompt:
      "Summarize overdue / open invoices. List likely defaulters, suggested tone (soft/firm/final), and a one-line WhatsApp reminder for each. INR.",
  },
  {
    label: "Draft all reminders",
    prompt:
      "For each pending follow-up and overdue payment, draft a short reminder (max 60 words). Output: '— To <name> [<Email/WhatsApp>]:' then message. Warm, professional, INR.",
  },
  {
    label: "End-of-day summary",
    prompt:
      "Crisp end-of-day executive summary: what moved, what's at risk, top 3 wins, top 3 risks, 5 actions for tomorrow.",
  },
  {
    label: "Next best actions",
    prompt:
      "Top 7 next best actions this week tied to specific names/deals. Format: Action verb → target → expected impact.",
  },
];

const REMINDER_INTERVAL_MS = 5 * 60 * 1000;

export function AskAi({ snapshot }: { snapshot: AppSnapshot }) {
  const askFn = useServerFn(askAi);
  const [open, setOpen] = useState(false);
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

  // Auto reminder ticks even when the dialog is closed.
  useEffect(() => {
    if (!autoReminder) return;
    let cancelled = false;
    async function tick() {
      try {
        const res = await askFn({
          data: {
            prompt:
              "Output ONE single most urgent reminder based ONLY on the snapshot, under 25 words, include a person/deal name. No preamble, one plain sentence.",
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
        /* silent */
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
    <>
      {/* Header trigger */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#EA4335] text-white text-sm font-medium shadow-sm hover:opacity-95 transition-opacity shrink-0"
        title="Ask AI about your CRM"
      >
        <Sparkles className="size-4" />
        <span className="hidden sm:inline">Ask AI</span>
        {autoReminder && (
          <span className="hidden md:inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-none bg-white/20 text-[10px] font-semibold">
            <BellRing className="size-3" /> LIVE
          </span>
        )}
      </button>

      {/* Full-screen overlay dialog */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-zinc-950/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-zinc-100 bg-gradient-to-r from-[#E8F0FE] via-white to-[#FEF7E0]">
              <div className="size-7 rounded-md bg-zinc-900 grid place-items-center shrink-0">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-none truncate">Ask AI · {snapshot.companyName}</p>
                <p className="text-[11px] text-zinc-500 mt-1 truncate">
                  Follow-ups, pending tasks, overdue payments · Groq
                </p>
              </div>
              <button
                onClick={() => setAutoReminder((v) => {
                  const next = !v;
                  toast(next ? "Auto reminders on — every 5 min" : "Auto reminders paused", {
                    icon: next ? (
                      <BellRing className="size-4 text-[#34A853]" />
                    ) : (
                      <BellOff className="size-4 text-zinc-500" />
                    ),
                  });
                  return next;
                })}
                className={`text-[11px] font-medium px-2.5 py-1.5 rounded-none border flex items-center gap-1 transition-colors shrink-0 ${
                  autoReminder
                    ? "bg-[#34A853] text-white border-[#34A853]"
                    : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                }`}
              >
                {autoReminder ? <BellRing className="size-3.5" /> : <BellOff className="size-3.5" />}
                <span className="hidden sm:inline">{autoReminder ? "Auto on" : "Auto off"}</span>
              </button>
              <button
                onClick={() => setOpen(false)}
                className="size-8 rounded grid place-items-center hover:bg-zinc-100 text-zinc-500 shrink-0"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="px-4 sm:px-5 pt-3 flex flex-wrap gap-2 shrink-0">
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

            <div className="p-4 sm:p-5 pt-3 flex flex-col min-h-0 flex-1">
              <div className="flex items-center gap-2 shrink-0">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void run();
                  }}
                  placeholder="Ask anything about leads, tasks, payments…"
                  className="flex-1 min-w-0 h-10 px-3 rounded-lg border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
                  disabled={loading}
                  autoFocus
                />
                <button
                  onClick={() => void run()}
                  disabled={loading || !prompt.trim()}
                  className="h-10 px-3 sm:px-4 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                  <span className="hidden sm:inline">{loading ? "Thinking…" : "Ask"}</span>
                </button>
              </div>

              {(answer || error) && (
                <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4 relative overflow-y-auto flex-1 min-h-0">
                  {error ? (
                    <p className="text-sm text-[#C5221F]">{error}</p>
                  ) : (
                    <pre className="text-sm text-zinc-800 whitespace-pre-wrap font-sans leading-relaxed">
                      {answer}
                    </pre>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
