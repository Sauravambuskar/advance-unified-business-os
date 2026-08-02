import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Pause, Play, Video, MessageSquare, Sparkles, X, User,
} from "lucide-react";
import { initiateCall, formatPhoneE164, updateCallLog, type FrejunCallResponse } from "@/lib/frejun";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type Line = { who: "agent" | "lead"; text: string; at: number };

// ─── Script ─────────────────────────────────────────────────────────────────

const SCRIPT: Line[] = [
  { who: "agent", text: "Hello, this is calling from Advance Group. Am I speaking with {name}?", at: 1200 },
  { who: "lead",  text: "Yes, speaking. How can I help?", at: 3000 },
  { who: "agent", text: "I'm following up on the proposal we shared last week — do you have a couple of minutes?", at: 5000 },
  { who: "lead",  text: "Sure, I did review it. The pricing looks reasonable but I have a few questions on the timelines.", at: 8500 },
  { who: "agent", text: "Absolutely — we can typically kick off within 2 weeks of a signed SOW. Which milestone concerns you most?", at: 12500 },
  { who: "lead",  text: "The go-live date. We need this operational before the next quarter.", at: 16500 },
  { who: "agent", text: "Noted. I'll align the delivery team and share a phased rollout plan by tomorrow.", at: 20000 },
  { who: "lead",  text: "Great, please also loop in your finance contact for the PO format.", at: 24000 },
];

const SENTIMENT = {
  positive: ["great", "reasonable", "sure", "yes", "perfect", "absolutely"],
  negative:  ["concern", "issue", "problem", "delay", "expensive", "no"],
};

function fmt(sec: number) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Audio Engine ────────────────────────────────────────────────────────────
// One global AudioContext. Recreated per call. The key rule:
//   startRinging() / startTalkEngine() MUST be called synchronously within
//   a user-gesture callback (or its first setTimeout tick) so Chrome/Safari
//   allow AudioContext.resume().

let gCtx: AudioContext | null = null;
let gMaster: GainNode | null = null;
let gRingOsc1: OscillatorNode | null = null;
let gRingOsc2: OscillatorNode | null = null;
let gRingGain: GainNode | null = null;
let gRingActive = false;
let gTalkOsc: OscillatorNode | null = null;
let gTalkGain: GainNode | null = null;
let gTalkFilter: BiquadFilterNode | null = null;

function audioCtx(): AudioContext {
  if (!gCtx || gCtx.state === "closed") {
    gCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    gMaster = gCtx.createGain();
    gMaster.gain.value = 1;
    gMaster.connect(gCtx.destination);
  }
  if (gCtx.state === "suspended") gCtx.resume();
  return gCtx;
}

function stopRing() {
  gRingActive = false;
  if (gRingGain) { try { gRingGain.gain.value = 0; } catch {} }
  try { gRingOsc1?.stop(); } catch {}
  try { gRingOsc2?.stop(); } catch {}
  gRingOsc1 = null;
  gRingOsc2 = null;
  gRingGain = null;
}

function startRing() {
  stopRing();
  const ctx = audioCtx();
  const master = gMaster!;

  const o1 = ctx.createOscillator();
  const o2 = ctx.createOscillator();
  o1.type = "sine"; o1.frequency.value = 425;
  o2.type = "sine"; o2.frequency.value = 400;

  const g = ctx.createGain();
  g.gain.value = 0;
  o1.connect(g); o2.connect(g); g.connect(master);
  o1.start(); o2.start();

  gRingOsc1 = o1; gRingOsc2 = o2; gRingGain = g;
  gRingActive = true;

  // 1s ON, 2s OFF pattern — check gRingActive before each step
  const tick = () => {
    if (!gRingActive || !gRingGain) return;
    gRingGain.gain.value = 0.28;
    setTimeout(() => {
      if (!gRingActive || !gRingGain) return;
      gRingGain.gain.value = 0;
      setTimeout(() => { if (gRingActive) tick(); }, 2000);
    }, 1000);
  };
  tick();
}

function stopTalk() {
  if (gTalkGain) { try { gTalkGain.gain.value = 0; } catch {} }
  try { gTalkOsc?.stop(); } catch {}
  gTalkOsc = null; gTalkGain = null; gTalkFilter = null;
}

function startTalk() {
  stopTalk();
  const ctx = audioCtx();
  const master = gMaster!;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth"; osc.frequency.value = 170;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 900; filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.value = 0;

  osc.connect(filter); filter.connect(gain); gain.connect(master);
  osc.start();
  gTalkOsc = osc; gTalkFilter = filter; gTalkGain = gain;
}

function speak(durationMs = 1500) {
  if (!gTalkGain || !gCtx) return;
  const now = gCtx.currentTime;
  const dur = durationMs / 1000;
  gTalkGain.gain.cancelScheduledValues(now);
  gTalkGain.gain.setValueAtTime(0, now);
  gTalkGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  gTalkGain.gain.setValueAtTime(0.12, now + dur * 0.7);
  gTalkGain.gain.linearRampToValueAtTime(0, now + dur);
}

function setSpeaker(on: boolean) {
  if (gMaster) gMaster.gain.value = on ? 1 : 0;
}

/** Full silence — call on hangup. Kills everything. */
function killAudio() {
  gRingActive = false;
  stopRing();
  stopTalk();
  if (gMaster) { try { gMaster.gain.value = 0; } catch {} }
  // Close and null the context so the next call gets a fresh one
  const ctx = gCtx;
  gCtx = null; gMaster = null;
  setTimeout(() => { try { ctx?.close(); } catch {} }, 100);
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CallDialog({
  open, onClose, name, phone, company, photo, onDisposition,
  mode = "simulated", userEmail,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  company: string;
  photo?: string;
  onDisposition?: (
    disposition: string, note: string, duration: number,
    temperature: string, callbackHours: number | null,
  ) => void;
  mode?: "simulated" | "real";
  userEmail?: string;
}) {
  const [phase, setPhase]           = useState<"dialing" | "connected" | "ended">("dialing");
  const [seconds, setSeconds]       = useState(0);
  const [muted, setMuted]           = useState(false);
  const [speaker, setSpeakerState]  = useState(true);
  const [held, setHeld]             = useState(false);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [showDisp, setShowDisp]     = useState(false);
  const [disp, setDisp]             = useState("");
  const [note, setNote]             = useState("");
  const [temp, setTemp]             = useState("");
  const [cbTime, setCbTime]         = useState<number | null>(null);
  const [cbDate, setCbDate]         = useState("");
  const [cbStr, setCbStr]           = useState("");
  const [realId, setRealId]         = useState<number | null>(null);
  const [callErr, setCallErr]       = useState<string | null>(null);

  const scrollRef        = useRef<HTMLDivElement>(null);
  const timers           = useRef<number[]>([]);
  const prevLen          = useRef(0);
  const hangupCalledRef  = useRef(false); // prevent double-hangup

  // ── Clear all pending timers ────────────────────────────────────────────
  const clearTimers = useCallback(() => {
    timers.current.forEach(t => { window.clearTimeout(t); window.clearInterval(t); });
    timers.current = [];
  }, []);

  // ── Hangup — single authoritative function ──────────────────────────────
  const hangup = useCallback(() => {
    if (hangupCalledRef.current) return;
    hangupCalledRef.current = true;

    // 1. Kill audio immediately
    killAudio();

    // 2. Cancel every pending timer (ringing auto-connect, transcript, tick)
    clearTimers();

    // 3. Update phase
    setPhase("ended");

    // 4. Show disposition after a short "Call Ended" flash, then close dialog
    timers.current.push(window.setTimeout(() => {
      if (onDisposition) {
        setShowDisp(true);
      } else {
        onClose();
      }
    }, 700));
  }, [clearTimers, onDisposition, onClose]);

  // ── Initiate real FreJun call ───────────────────────────────────────────
  const doRealCall = useCallback(async () => {
    if (!userEmail || !userEmail.includes("@")) {
      const msg = "Enter your FreJun account email in Dialer Settings (⚙ gear icon) to make real calls.";
      setCallErr(msg);
      toast.error("FreJun email not set", { description: msg, duration: 6000 });
      // Fall back to simulated mode so the call still works
      timers.current.push(window.setTimeout(() => { startRing(); }, 0));
      timers.current.push(window.setTimeout(() => {
        stopRing(); startTalk(); setPhase("connected");
      }, 4000));
      return;
    }
    try {
      const e164 = formatPhoneE164(phone);
      toast.info("Connecting via FreJun…", { description: `Dialling ${e164}` });
      const res: FrejunCallResponse = await initiateCall(
        e164, name,
        { candidate_id: name.replace(/\s+/g, "-").toLowerCase(), transaction_id: `call-${Date.now()}` },
        userEmail,
      );
      if (res.success && res.data) {
        setRealId(res.data.call_id);
        toast.success("FreJun is calling you", {
          description: "Answer your phone — FreJun will then connect you to the lead.",
          duration: 8000,
        });
        // Move UI to connected after ~6s (replace with webhook in production)
        timers.current.push(window.setTimeout(() => setPhase("connected"), 6000));
      } else {
        // Frejun returned success:false with a message
        const errMsg = res.message || "Call failed — check your FreJun account.";
        setCallErr(errMsg);
        toast.error("FreJun error", { description: errMsg, duration: 8000 });
        // Don't auto-hangup — let user read the error and close manually
        timers.current.push(window.setTimeout(() => setPhase("ended"), 1500));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setCallErr(msg);
      // Common causes shown in the toast for quick diagnosis
      if (msg.includes("doesnt exist")) {
        toast.error("FreJun: user not found", {
          description: `"${userEmail}" is not an active user in this FreJun account. Use the email you log into product.frejun.com with.`,
          duration: 10000,
        });
      } else if (msg.includes("401") || msg.includes("403") || msg.includes("Unauthorized")) {
        toast.error("FreJun: auth failed", {
          description: "API key rejected. Check Settings → Developer in product.frejun.com.",
          duration: 10000,
        });
      } else {
        toast.error("FreJun call error", { description: msg, duration: 8000 });
      }
      timers.current.push(window.setTimeout(() => setPhase("ended"), 1500));
    }
  }, [userEmail, phone, name]);

  // ── Open effect — runs once per open=true ───────────────────────────────
  useEffect(() => {
    if (!open) return;

    // Reset everything
    hangupCalledRef.current = false;
    setPhase("dialing");
    setSeconds(0);
    setTranscript([]);
    setMuted(false);
    setSpeakerState(true);
    setHeld(false);
    setCallErr(null);
    setRealId(null);
    setShowDisp(false);
    setDisp(""); setNote(""); setTemp("");
    setCbTime(null); setCbDate(""); setCbStr("");
    prevLen.current = 0;

    if (mode === "real" && userEmail?.includes("@")) {
      doRealCall();
    } else {
      // setTimeout(0) keeps us in the same event-loop tick as the click
      // gesture so AudioContext.resume() is allowed by the browser
      timers.current.push(window.setTimeout(() => { startRing(); }, 0));
      // Auto-connect after 4s (simulated ring)
      timers.current.push(window.setTimeout(() => {
        stopRing();
        startTalk();
        setPhase("connected");
      }, 4000));
    }

    return () => {
      clearTimers();
      killAudio();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ── Speaker toggle ──────────────────────────────────────────────────────
  useEffect(() => { setSpeaker(speaker); }, [speaker]);

  // ── Connected: timer + simulated transcript ─────────────────────────────
  useEffect(() => {
    if (phase !== "connected") return;
    const tick = window.setInterval(() => { if (!held) setSeconds(s => s + 1); }, 1000);
    timers.current.push(tick);
    if (mode === "simulated") {
      SCRIPT.forEach(line => {
        timers.current.push(window.setTimeout(() => {
          setTranscript(prev => [...prev, { ...line, text: line.text.replace("{name}", name.split(" ")[0]) }]);
        }, line.at));
      });
    }
    return () => { window.clearInterval(tick); };
  }, [phase, held, name, mode]);

  // ── Auto-scroll transcript ──────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // ── Speak sound when lead line appears ─────────────────────────────────
  useEffect(() => {
    if (transcript.length > prevLen.current) {
      transcript.slice(prevLen.current).forEach(l => {
        if (l.who === "lead") speak(Math.min(l.text.split(" ").length * 120, 3000));
      });
    }
    prevLen.current = transcript.length;
  }, [transcript]);

  if (!open) return null;

  // ── Disposition submit ──────────────────────────────────────────────────
  const submitDisp = () => {
    let hrs = cbTime;
    if (cbDate) {
      const dt = new Date(cbStr ? `${cbDate}T${cbStr}` : `${cbDate}T10:00`);
      const diff = dt.getTime() - Date.now();
      if (diff > 0) hrs = Math.round(diff / 3_600_000);
    }
    onDisposition?.(disp || "Follow Up", note, seconds, temp || "Warm", hrs);
    if (mode === "real" && realId !== null) {
      updateCallLog(String(realId), { notes: note || undefined, call_outcome: disp || "Follow Up" }).catch(console.error);
    }
    resetDisp(); onClose();
  };

  const skipDisp = () => {
    let hrs = cbTime;
    if (cbDate) {
      const dt = new Date(cbStr ? `${cbDate}T${cbStr}` : `${cbDate}T10:00`);
      const diff = dt.getTime() - Date.now();
      if (diff > 0) hrs = Math.round(diff / 3_600_000);
    }
    if (disp || temp || hrs) onDisposition?.(disp || "Follow Up", note, seconds, temp || "Warm", hrs);
    resetDisp(); onClose();
  };

  const resetDisp = () => {
    setShowDisp(false); setDisp(""); setNote(""); setTemp("");
    setCbTime(null); setCbDate(""); setCbStr("");
  };

  // ── Sentiment ───────────────────────────────────────────────────────────
  const txt = transcript.map(t => t.text).join(" ").toLowerCase();
  const pos = SENTIMENT.positive.filter(k => txt.includes(k)).length;
  const neg = SENTIMENT.negative.filter(k => txt.includes(k)).length;
  const sentiment = pos > neg ? "Positive" : neg > pos ? "Negative" : "Neutral";
  const sentTone  = sentiment === "Positive" ? "bg-[#34A853] text-white"
                  : sentiment === "Negative" ? "bg-[#EA4335] text-white"
                  : "bg-zinc-500 text-white";

  // ── Render ──────────────────────────────────────────────────────────────
  const callPanel = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/75 backdrop-blur-sm">
      {/* clicking the backdrop does NOT hangup — prevents accidental dismissal */}
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

        {/* ── LEFT: Call controls ── */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex flex-col min-h-0">

          {/* Header bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
              <span className={`size-2 rounded-full ${
                phase === "connected" ? "bg-[#34A853] animate-pulse" :
                phase === "dialing"   ? "bg-[#FBBC05] animate-pulse" : "bg-[#EA4335]"
              }`} />
              {phase === "dialing" ? "Ringing…" : phase === "connected" ? "Live Call" : "Call Ended"}
              {mode === "real" && (
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#34A853] text-white rounded">LIVE</span>
              )}
            </div>
            {/* X only closes after call is ended */}
            {phase === "ended" && (
              <button onClick={hangup} className="size-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70">
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Avatar + info */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4">
            <div className="relative">
              {phase === "dialing" && (
                <span className="absolute inset-0 rounded-full animate-ping bg-white/20 pointer-events-none" />
              )}
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
              {mode === "real" && phase === "dialing" && (
                <p className="text-xs text-[#FBBC05] mt-2 font-medium animate-pulse">
                  📞 FreJun is calling you — answer your phone first!
                </p>
              )}
              {callErr && <p className="text-xs text-[#EA4335] mt-2">⚠️ {callErr}</p>}
            </div>

            <div className="text-3xl font-mono tabular-nums tracking-widest mt-1">
              {phase === "dialing" ? "00:00" : fmt(seconds)}
            </div>

            {/* Voice waveform animation */}
            {phase === "connected" && (
              <div className="flex items-center gap-0.5 h-8">
                {Array.from({ length: 28 }).map((_, i) => (
                  <span key={i} className="w-1 rounded-full bg-white/50"
                    style={{
                      height: `${muted ? 3 : 4 + Math.abs(Math.sin((seconds + i) * 0.65)) * 20}px`,
                      transition: "height 180ms ease",
                    }}
                  />
                ))}
              </div>
            )}

            {mode === "real" && realId && (
              <p className="text-[9px] text-white/40 font-mono">FreJun Call #{realId}</p>
            )}
          </div>

          {/* Control bar */}
          <div className="shrink-0 px-6 pb-6 pt-2 grid grid-cols-5 gap-3 bg-gradient-to-t from-[#0a1628] to-transparent">
            <Ctrl icon={muted ? MicOff : Mic}     label={muted ? "Unmute" : "Mute"}      active={muted}     onClick={() => setMuted(m => !m)} />
            <Ctrl icon={held  ? Play  : Pause}    label={held  ? "Resume" : "Hold"}      active={held}      onClick={() => setHeld(h => !h)} />
            <Ctrl icon={speaker ? Volume2 : VolumeX} label={speaker ? "Speaker" : "Muted"} active={!speaker} onClick={() => setSpeakerState(s => !s)} />
            <Ctrl icon={Video}                    label="Video"                          active={false}     onClick={() => {}} />
            <button
              onClick={hangup}
              disabled={phase === "ended"}
              className="flex flex-col items-center gap-1 rounded-md bg-[#EA4335] hover:bg-[#c5372c] disabled:opacity-40 px-3 py-2.5 transition-colors"
            >
              <PhoneOff className="size-5" />
              <span className="text-[10px] font-medium">End</span>
            </button>
          </div>
        </div>

        {/* ── RIGHT: Transcript + AI ── */}
        <div className="flex flex-col min-h-0 bg-zinc-50 border-l border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-zinc-700" />
              <span className="text-sm font-semibold">Live Transcription</span>
              {phase !== "ended" && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#EA4335] text-white">
                  <span className="size-1.5 rounded-full bg-white animate-pulse" /> REC
                </span>
              )}
              {phase === "ended" && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-200 text-zinc-600">ENDED</span>
              )}
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold ${sentTone}`}>{sentiment}</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin min-h-0">
            {phase === "dialing" && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-zinc-500 text-xs mt-12">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="size-2.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
                <p>{mode === "real" ? "Waiting for FreJun to bridge the call…" : "Ringing…"}</p>
              </div>
            )}
            {mode === "real" && phase === "connected" && transcript.length === 0 && (
              <div className="mt-8 p-4 bg-amber-50 ring-1 ring-amber-200 text-xs text-center">
                <p className="font-semibold text-amber-800">Real Call Active</p>
                <p className="mt-1 text-zinc-600">Live transcription not available in real call mode.</p>
              </div>
            )}
            {transcript.map((line, i) => (
              <div key={i} className={`flex ${line.who === "agent" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 text-sm ${
                  line.who === "agent" ? "bg-[#4285F4] text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-800"
                }`}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-70 mb-0.5">
                    {line.who === "agent" ? "You (Agent)" : name}
                  </p>
                  <p className="leading-snug">{line.text}</p>
                </div>
              </div>
            ))}
            {phase === "connected" && transcript.length > 0 && (
              <div className="flex justify-start">
                <div className="px-3 py-2 bg-white ring-1 ring-zinc-200 flex gap-1">
                  {[0, 150, 300].map(d => (
                    <span key={d} className="size-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI panel */}
          <div className="border-t border-zinc-200 bg-white p-3 space-y-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700">
              <Sparkles className="size-3.5 text-[#FBBC05]" /> AI Suggestions
            </div>
            <div className="space-y-1">
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

  // ── Disposition panel ───────────────────────────────────────────────────
  const dispPanel = showDisp ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)] ring-1 ring-zinc-950/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Log Call Outcome</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{name} · {fmt(seconds)}</p>
          </div>
          <button onClick={skipDisp} className="size-8 grid place-items-center hover:bg-zinc-100 text-zinc-500">
            <X className="size-4" />
          </button>
        </div>
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Temperature */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Lead Quality</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Hot", "Warm", "Cold"] as const).map(t => (
                <button key={t} onClick={() => setTemp(t)}
                  className={`h-10 text-xs font-semibold ${
                    t === "Hot"  ? (temp === t ? "bg-red-500 text-white"   : "ring-1 ring-zinc-200 hover:bg-red-50")   :
                    t === "Warm" ? (temp === t ? "bg-amber-500 text-white" : "ring-1 ring-zinc-200 hover:bg-amber-50") :
                                   (temp === t ? "bg-blue-500 text-white"  : "ring-1 ring-zinc-200 hover:bg-blue-50")
                  }`}>
                  {t === "Hot" ? "🔥" : t === "Warm" ? "☀️" : "❄️"} {t}
                </button>
              ))}
            </div>
          </div>

          {/* Disposition */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Disposition</p>
            <div className="grid grid-cols-3 gap-1.5">
              {["Interested","Follow Up","No Answer","Not Interested","Voicemail","Wrong Number"].map(d => (
                <button key={d} onClick={() => setDisp(d)}
                  className={`text-[11px] font-medium px-2 py-2 ${disp === d ? "bg-zinc-900 text-white" : "ring-1 ring-zinc-200 hover:bg-zinc-50"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Callback scheduler */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">📞 Schedule Callback</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[{l:"1 hr",h:1},{l:"4 hr",h:4},{l:"Tomorrow",h:24},{l:"3 days",h:72}].map(o => (
                <button key={o.l} onClick={() => { setCbTime(o.h); setCbDate(""); setCbStr(""); }}
                  className={`text-[10px] font-semibold py-2 ${cbTime === o.h && !cbDate ? "bg-violet-600 text-white" : "ring-1 ring-zinc-200 bg-white hover:bg-violet-50"}`}>
                  {o.l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-medium">Date</label>
                <input type="date" value={cbDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => { setCbDate(e.target.value); setCbTime(null); }}
                  className="mt-1 w-full h-9 px-2 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-medium">Time</label>
                <input type="time" value={cbStr} onChange={e => setCbStr(e.target.value)}
                  className="mt-1 w-full h-9 px-2 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Note</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Call note (optional)" rows={2}
              className="w-full px-3 py-2 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={skipDisp}  className="flex-1 h-10 ring-1 ring-zinc-200 text-sm font-semibold hover:bg-zinc-50">Skip</button>
            <button onClick={submitDisp} className="flex-1 h-10 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800">Save & Close</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return typeof document !== "undefined"
    ? createPortal(<>{callPanel}{dispPanel}</>, document.body)
    : <>{callPanel}{dispPanel}</>;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Ctrl({ icon: Icon, label, active, onClick, disabled = false }: {
  icon: any; label: string; active: boolean; onClick: () => void; disabled?: boolean;
}) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center gap-1 rounded-md px-3 py-2.5 transition-colors disabled:opacity-40 ${
        active ? "bg-white text-zinc-900" : "bg-white/10 hover:bg-white/20 text-white"
      }`}>
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function aiSuggestions(t: Line[]): string[] {
  if (t.length === 0) return ["Greet the lead by name and confirm identity.", "Reference the last touchpoint or proposal."];
  const text = t.map(x => x.text).join(" ").toLowerCase();
  const out: string[] = [];
  if (text.includes("pricing") || text.includes("expensive")) out.push("Address pricing — highlight ROI and phased payment options.");
  if (text.includes("timeline") || text.includes("go-live") || text.includes("quarter")) out.push("Confirm timeline; offer a phased rollout plan.");
  if (text.includes("po") || text.includes("finance")) out.push("Loop in Finance and share the PO format template.");
  if (text.includes("proposal")) out.push("Offer to walk through the proposal section by section.");
  if (out.length === 0) out.push("Ask an open-ended discovery question about their current workflow.");
  out.push("Set a clear next step and send a calendar invite before ending.");
  return out.slice(0, 4);
}
