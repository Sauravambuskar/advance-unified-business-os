import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Pause, Play, Video, MessageSquare, Sparkles, X, User } from "lucide-react";

type Line = { who: "agent" | "lead"; text: string; at: number };

const SCRIPT: Line[] = [
  { who: "agent", text: "Hello, this is calling from Advance Group. Am I speaking with {name}?", at: 1200 },
  { who: "lead", text: "Yes, speaking. How can I help?", at: 3000 },
  { who: "agent", text: "I'm following up on the proposal we shared last week — do you have a couple of minutes?", at: 5000 },
  { who: "lead", text: "Sure, I did review it. The pricing looks reasonable but I have a few questions on the timelines.", at: 8500 },
  { who: "agent", text: "Absolutely — we can typically kick off within 2 weeks of a signed SOW. Which milestone concerns you most?", at: 12500 },
  { who: "lead", text: "The go-live date. We need this operational before the next quarter.", at: 16500 },
  { who: "agent", text: "Noted. I'll align the delivery team and share a phased rollout plan by tomorrow.", at: 20000 },
  { who: "lead", text: "Great, please also loop in your finance contact for the PO format.", at: 24000 },
];

const SENTIMENT_KEYWORDS = {
  positive: ["great", "reasonable", "sure", "yes", "perfect", "absolutely"],
  negative: ["concern", "issue", "problem", "delay", "expensive", "no"],
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function CallDialog({
  open,
  onClose,
  name,
  phone,
  company,
  photo,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  company: string;
  photo?: string;
}) {
  const [phase, setPhase] = useState<"dialing" | "connected" | "ended">("dialing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [held, setHeld] = useState(false);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    if (!open) return;
    setPhase("dialing");
    setSeconds(0);
    setTranscript([]);
    setMuted(false);
    setHeld(false);

    const dialT = window.setTimeout(() => setPhase("connected"), 1800);
    timersRef.current.push(dialT);

    return () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current.forEach((t) => window.clearInterval(t));
      timersRef.current = [];
    };
  }, [open]);

  // Call timer + transcript playback once connected
  useEffect(() => {
    if (phase !== "connected") return;
    const tick = window.setInterval(() => {
      if (!held) setSeconds((s) => s + 1);
    }, 1000);
    timersRef.current.push(tick);

    SCRIPT.forEach((line) => {
      const t = window.setTimeout(() => {
        setTranscript((prev) => [
          ...prev,
          { ...line, text: line.text.replace("{name}", name.split(" ")[0]) },
        ]);
      }, line.at);
      timersRef.current.push(t);
    });

    return () => {
      window.clearInterval(tick);
    };
  }, [phase, held, name]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  if (!open) return null;

  const hangup = () => {
    setPhase("ended");
    timersRef.current.forEach((t) => window.clearTimeout(t));
    setTimeout(onClose, 600);
  };

  const fullText = transcript.map((t) => t.text).join(" ").toLowerCase();
  const pos = SENTIMENT_KEYWORDS.positive.reduce((n, k) => n + (fullText.includes(k) ? 1 : 0), 0);
  const neg = SENTIMENT_KEYWORDS.negative.reduce((n, k) => n + (fullText.includes(k) ? 1 : 0), 0);
  const sentiment = pos > neg ? "Positive" : neg > pos ? "Negative" : "Neutral";
  const sentimentTone =
    sentiment === "Positive"
      ? "bg-[#34A853] text-white"
      : sentiment === "Negative"
      ? "bg-[#EA4335] text-white"
      : "bg-zinc-500 text-white";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={hangup} aria-hidden />
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] grid-rows-[minmax(0,1fr)] lg:grid-rows-1">
        {/* LEFT: Call panel */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
              <span className={`inline-block size-2 rounded-full ${phase === "connected" ? "bg-[#34A853] animate-pulse" : phase === "dialing" ? "bg-[#FBBC05] animate-pulse" : "bg-[#EA4335]"}`} />
              {phase === "dialing" ? "Dialing…" : phase === "connected" ? "In Call" : "Call Ended"}
            </div>
            <button onClick={hangup} className="size-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70" aria-label="Close call">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center justify-center px-6 py-8 gap-4">
            <div className="relative">
              <div className={`absolute inset-0 rounded-full ${phase === "dialing" ? "animate-ping bg-white/20" : ""}`} />
              {photo ? (
                <img src={photo} alt={name} className="relative size-32 rounded-full object-cover ring-4 ring-white/20" />
              ) : (
                <div className="relative size-32 rounded-full bg-white/10 ring-4 ring-white/20 grid place-items-center">
                  <User className="size-14 text-white/70" />
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{name}</p>
              <p className="text-sm text-white/70">{company}</p>
              <p className="text-sm text-white/60 mt-1 tracking-wide">{phone}</p>
            </div>
            <div className="text-3xl font-mono tabular-nums tracking-wider mt-2">
              {phase === "dialing" ? "00:00" : fmt(seconds)}
            </div>
            {phase === "connected" && (
              <div className="flex items-center gap-1 h-6">
                {Array.from({ length: 24 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-white/50"
                    style={{
                      height: `${muted ? 4 : 6 + Math.abs(Math.sin((seconds + i) * 0.7)) * 18}px`,
                      transition: "height 200ms ease",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 px-6 pb-6 pt-2 grid grid-cols-5 gap-3 bg-gradient-to-t from-[#0f3460] to-transparent">
            <CallCtrl icon={muted ? MicOff : Mic} label={muted ? "Unmute" : "Mute"} active={muted} onClick={() => setMuted((m) => !m)} />
            <CallCtrl icon={held ? Play : Pause} label={held ? "Resume" : "Hold"} active={held} onClick={() => setHeld((h) => !h)} />
            <CallCtrl icon={speaker ? Volume2 : VolumeX} label="Speaker" active={!speaker} onClick={() => setSpeaker((s) => !s)} />
            <CallCtrl icon={Video} label="Video" active={false} onClick={() => {}} />
            <button
              onClick={hangup}
              className="col-span-1 flex flex-col items-center gap-1 rounded-md bg-[#EA4335] hover:bg-[#c5372c] px-3 py-2.5 transition-colors"
              aria-label="End call"
            >
              <PhoneOff className="size-5" />
              <span className="text-[10px] font-medium">End</span>
            </button>
          </div>
        </div>

        {/* RIGHT: Transcription + AI */}
        <div className="flex flex-col bg-zinc-50 border-l border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-zinc-700" />
              <span className="text-sm font-semibold">Live Transcription</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#EA4335] text-white">
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> REC
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold ${sentimentTone}`}>
              {sentiment}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {phase === "dialing" && (
              <div className="text-center text-xs text-zinc-500 mt-8">
                <div className="inline-flex gap-1">
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce" />
                </div>
                <p className="mt-2">Waiting for connection…</p>
              </div>
            )}
            {transcript.map((line, i) => (
              <div key={i} className={`flex ${line.who === "agent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 text-sm ${line.who === "agent" ? "bg-[#4285F4] text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-800"}`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">
                    {line.who === "agent" ? "You (Agent)" : name}
                  </p>
                  <p className="leading-snug">{line.text}</p>
                </div>
              </div>
            ))}
            {phase === "connected" && transcript.length > 0 && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-white ring-1 ring-zinc-200">
                  <div className="inline-flex gap-1">
                    <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-zinc-400 animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 bg-white p-3 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Sparkles className="size-3.5 text-[#FBBC05]" /> AI Suggestions
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {aiSuggestions(transcript).map((s, i) => (
                <div key={i} className="px-2.5 py-1.5 bg-zinc-50 ring-1 ring-zinc-200 text-xs text-zinc-700 flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-[#4285F4] mt-1.5 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button className="text-[10px] font-semibold px-2 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800">Save Note</button>
              <button className="text-[10px] font-semibold px-2 py-1.5 ring-1 ring-zinc-300 hover:bg-zinc-100">Create Task</button>
              <button className="text-[10px] font-semibold px-2 py-1.5 ring-1 ring-zinc-300 hover:bg-zinc-100">Send Summary</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CallCtrl({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md px-3 py-2.5 transition-colors ${active ? "bg-white text-zinc-900" : "bg-white/10 hover:bg-white/20 text-white"}`}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function aiSuggestions(t: Line[]): string[] {
  if (t.length === 0) return ["Greet the lead by name and confirm identity.", "Reference the last touchpoint or proposal."];
  const text = t.map((x) => x.text).join(" ").toLowerCase();
  const out: string[] = [];
  if (text.includes("pricing") || text.includes("expensive")) out.push("Address pricing — highlight ROI and phased payment options.");
  if (text.includes("timeline") || text.includes("go-live") || text.includes("quarter")) out.push("Confirm delivery timeline; offer a phased rollout plan.");
  if (text.includes("po") || text.includes("finance")) out.push("Loop in Finance and share the PO format template.");
  if (text.includes("proposal")) out.push("Offer to walk through the proposal, section by section.");
  if (out.length === 0) out.push("Ask an open-ended discovery question about their current workflow.");
  out.push("Set a clear next step and calendar invite before ending the call.");
  return out.slice(0, 4);
}
