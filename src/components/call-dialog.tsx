import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX,
  Pause, Play, Video, MessageSquare, Sparkles, X, User,
} from "lucide-react";
import { initiateCall, formatPhoneE164, updateCallLog, type FrejunCallResponse } from "@/lib/frejun";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
type Line = { who: "agent" | "lead"; text: string; at: number };

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

// ─── Audio Engine (module-level globals) ─────────────────────────────────────
// Using module globals avoids React closure staleness issues.
// Every function reads/writes the same variables so there is no
// "stale captured value" problem.

let gCtx: AudioContext | null = null;
let gMaster: GainNode | null = null;
let gRingOsc1: OscillatorNode | null = null;
let gRingOsc2: OscillatorNode | null = null;
let gRingGain: GainNode | null = null;
let gRingActive = false; // the single kill-switch for the ring tick loop
let gTalkOsc: OscillatorNode | null = null;
let gTalkGain: GainNode | null = null;

function ensureCtx(): AudioContext {
  if (!gCtx || gCtx.state === "closed") {
    gCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    gMaster = gCtx.createGain();
    gMaster.gain.value = 1;
    gMaster.connect(gCtx.destination);
  }
  if (gCtx.state === "suspended") gCtx.resume();
  return gCtx;
}

function audioStartRing() {
  audioStopRing(); // clean slate
  const ctx = ensureCtx();
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

  // Beep pattern: 1s ON, 2s OFF — each iteration re-checks gRingActive
  const beep = () => {
    if (!gRingActive || !gRingGain) return;
    gRingGain.gain.value = 0.3;
    setTimeout(() => {
      if (!gRingActive || !gRingGain) return;
      gRingGain.gain.value = 0;
      setTimeout(() => { if (gRingActive) beep(); }, 2000);
    }, 1000);
  };
  beep();
}

function audioStopRing() {
  // Kill the tick loop FIRST, then stop oscillators
  gRingActive = false;
  if (gRingGain) { try { gRingGain.gain.value = 0; } catch {} }
  try { gRingOsc1?.stop(); } catch {}
  try { gRingOsc2?.stop(); } catch {}
  gRingOsc1 = null; gRingOsc2 = null; gRingGain = null;
}

function audioStartTalk() {
  audioStopTalk();
  const ctx = ensureCtx();
  const master = gMaster!;

  const osc = ctx.createOscillator();
  osc.type = "sawtooth"; osc.frequency.value = 170;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass"; filter.frequency.value = 900; filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.value = 0;

  osc.connect(filter); filter.connect(gain); gain.connect(master);
  osc.start();
  gTalkOsc = osc; gTalkGain = gain;
}

function audioStopTalk() {
  if (gTalkGain) { try { gTalkGain.gain.value = 0; } catch {} }
  try { gTalkOsc?.stop(); } catch {}
  gTalkOsc = null; gTalkGain = null;
}

function audioSpeak(durationMs = 1500) {
  if (!gTalkGain || !gCtx) return;
  const now = gCtx.currentTime;
  const dur = durationMs / 1000;
  gTalkGain.gain.cancelScheduledValues(now);
  gTalkGain.gain.setValueAtTime(0, now);
  gTalkGain.gain.linearRampToValueAtTime(0.12, now + 0.05);
  gTalkGain.gain.setValueAtTime(0.12, now + dur * 0.7);
  gTalkGain.gain.linearRampToValueAtTime(0, now + dur);
}

function audioSetSpeaker(on: boolean) {
  if (gMaster) gMaster.gain.value = on ? 1 : 0;
}

/** Kill ALL audio and close the AudioContext. Safe to call multiple times. */
function audioKillAll() {
  gRingActive = false; // stop the ring tick loop immediately
  audioStopRing();
  audioStopTalk();
  if (gMaster) { try { gMaster.gain.value = 0; } catch {} }
  const ctx = gCtx;
  gCtx = null; gMaster = null;
  setTimeout(() => { try { ctx?.close(); } catch {} }, 80);
}

// ─── Component ────────────────────────────────────────────────────────────────

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
  // ── call-scoped state ───────────────────────────────────────────────────
  const [phase, setPhase]          = useState<"dialing" | "connected" | "ended">("dialing");
  const [seconds, setSeconds]      = useState(0);
  const [muted, setMuted]          = useState(false);
  const [speakerOn, setSpeakerOn]  = useState(true);
  const [held, setHeld]            = useState(false);
  const [transcript, setTrans]     = useState<Line[]>([]);
  const [callErr, setCallErr]      = useState<string | null>(null);
  const [realId, setRealId]        = useState<number | null>(null);

  // ── disposition state (separate lifecycle from the call itself) ─────────
  const [showDisp, setShowDisp]    = useState(false);
  const [disp, setDisp]            = useState("");
  const [note, setNote]            = useState("");
  const [temp, setTemp]            = useState("");
  const [cbTime, setCbTime]        = useState<number | null>(null);
  const [cbDate, setCbDate]        = useState("");
  const [cbStr, setCbStr]          = useState("");

  // ── refs ────────────────────────────────────────────────────────────────
  const scrollRef   = useRef<HTMLDivElement>(null);
  const prevLen     = useRef(0);
  // callEpoch: incremented every time a new call starts.
  // Every async callback checks its captured epoch against current; if
  // they differ the call was reset, so the callback does nothing.
  const epochRef    = useRef(0);
  // timers: all setTimeout/Interval IDs for the CURRENT call
  const timersRef   = useRef<number[]>([]);

  const clearCallTimers = () => {
    timersRef.current.forEach(t => { window.clearTimeout(t); window.clearInterval(t); });
    timersRef.current = [];
  };

  // ── speaker sync ────────────────────────────────────────────────────────
  useEffect(() => { audioSetSpeaker(speakerOn); }, [speakerOn]);

  // ── main call lifecycle effect ──────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    // ── NEW CALL: bump epoch so any lingering async from previous call dies
    const myEpoch = epochRef.current + 1;
    epochRef.current = myEpoch;

    // ── reset all call state ──────────────────────────────────────────────
    clearCallTimers();
    audioKillAll(); // kill any leftover audio from previous call
    setPhase("dialing");
    setSeconds(0);
    setTrans([]);
    setMuted(false);
    setSpeakerOn(true);
    setHeld(false);
    setCallErr(null);
    setRealId(null);
    setShowDisp(false);
    setDisp(""); setNote(""); setTemp("");
    setCbTime(null); setCbDate(""); setCbStr("");
    prevLen.current = 0;

    const isAlive = () => epochRef.current === myEpoch;

    if (mode === "real" && userEmail?.includes("@")) {
      // ── REAL MODE: call FreJun API ──────────────────────────────────────
      (async () => {
        try {
          const e164 = formatPhoneE164(phone);
          toast.info("Connecting via FreJun…", { description: `Dialling ${e164}` });

          const res: FrejunCallResponse = await initiateCall(
            e164, name,
            { candidate_id: name.replace(/\s+/g, "-").toLowerCase(), transaction_id: `call-${Date.now()}` },
            userEmail,
          );

          if (!isAlive()) return; // user hung up while API was in-flight

          if (res.success && res.data) {
            setRealId(res.data.call_id);
            toast.success("FreJun is calling you", {
              description: "Answer your phone — FreJun will connect you to the lead.",
              duration: 8000,
            });
            timersRef.current.push(window.setTimeout(() => {
              if (isAlive()) setPhase("connected");
            }, 6000));
          } else {
            const errMsg = res.message || "Call failed";
            setCallErr(errMsg);
            toast.error("FreJun error", { description: errMsg, duration: 8000 });
            if (isAlive()) setPhase("ended");
          }
        } catch (err) {
          if (!isAlive()) return;
          const msg = err instanceof Error ? err.message : String(err);
          setCallErr(msg);
          if (msg.includes("doesnt exist")) {
            toast.error("FreJun: user not found", {
              description: `"${userEmail}" is not registered in this FreJun account.`,
              duration: 10000,
            });
          } else if (msg.includes("401") || msg.includes("403")) {
            toast.error("FreJun: auth failed", {
              description: "API key invalid — check FreJun → Settings → Developer.",
              duration: 10000,
            });
          } else {
            toast.error("FreJun error", { description: msg, duration: 8000 });
          }
          if (isAlive()) setPhase("ended");
        }
      })();
    } else {
      // ── SIMULATED MODE ──────────────────────────────────────────────────
      // setTimeout(0) keeps audio creation in the same gesture tick
      timersRef.current.push(window.setTimeout(() => {
        if (!isAlive()) return;
        audioStartRing();
      }, 0));

      // Auto-connect after 4s
      timersRef.current.push(window.setTimeout(() => {
        if (!isAlive()) return;
        audioStopRing();
        audioStartTalk();
        setPhase("connected");
      }, 4000));
    }

    // ── CLEANUP: runs when open→false OR component unmounts ───────────────
    return () => {
      // Invalidate this call's epoch so async callbacks become no-ops
      epochRef.current = myEpoch + 1;
      clearCallTimers();
      audioKillAll();
    };
  }, [open]); // intentionally only re-run when open changes — NOT on mode/userEmail/name/phone

  // ── call timer (increments while connected and not held) ────────────────
  useEffect(() => {
    if (phase !== "connected") return;
    const id = window.setInterval(() => {
      if (!held) setSeconds(s => s + 1);
    }, 1000);
    timersRef.current.push(id);
    return () => window.clearInterval(id);
  }, [phase, held]);

  // ── simulated transcript playback ────────────────────────────────────────
  useEffect(() => {
    if (phase !== "connected" || mode !== "simulated") return;
    const epoch = epochRef.current;
    SCRIPT.forEach(line => {
      timersRef.current.push(window.setTimeout(() => {
        if (epochRef.current !== epoch) return;
        setTrans(prev => [...prev, { ...line, text: line.text.replace("{name}", name.split(" ")[0]) }]);
      }, line.at));
    });
  }, [phase, name, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── auto-scroll transcript ───────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // ── speak sound on new lead lines ────────────────────────────────────────
  useEffect(() => {
    if (transcript.length > prevLen.current) {
      transcript.slice(prevLen.current).forEach(l => {
        if (l.who === "lead") audioSpeak(Math.min(l.text.split(" ").length * 120, 3000));
      });
    }
    prevLen.current = transcript.length;
  }, [transcript]);

  if (!open) return null;

  // ── HANGUP ───────────────────────────────────────────────────────────────
  // Invalidates the epoch so all pending async/timers become no-ops,
  // then kills audio and shows the disposition panel.
  const hangup = () => {
    if (phase === "ended") return; // already hung up

    // Invalidate epoch — any pending setTimeout/async checks isAlive() and exits
    epochRef.current += 1;
    clearCallTimers();
    audioKillAll();
    setPhase("ended");

    // Show disposition panel after a brief "Call Ended" flash
    // Use a fresh setTimeout OUTSIDE timersRef so it isn't cleared by clearCallTimers
    if (onDisposition) {
      window.setTimeout(() => setShowDisp(true), 600);
    } else {
      window.setTimeout(() => onClose(), 800);
    }
  };

  // ── disposition helpers ──────────────────────────────────────────────────
  const calcHrs = () => {
    if (cbDate) {
      const dt = new Date(cbStr ? `${cbDate}T${cbStr}` : `${cbDate}T10:00`);
      const diff = dt.getTime() - Date.now();
      if (diff > 0) return Math.round(diff / 3_600_000);
    }
    return cbTime;
  };

  const submitDisp = () => {
    const hrs = calcHrs();
    onDisposition?.(disp || "Follow Up", note, seconds, temp || "Warm", hrs);
    if (mode === "real" && realId !== null) {
      updateCallLog(String(realId), {
        notes: note || undefined, call_outcome: disp || "Follow Up",
      }).catch(console.error);
    }
    setShowDisp(false); onClose();
  };

  const skipDisp = () => {
    const hrs = calcHrs();
    if (disp || temp || hrs) {
      onDisposition?.(disp || "Follow Up", note, seconds, temp || "Warm", hrs);
    }
    setShowDisp(false); onClose();
  };

  // ── sentiment ────────────────────────────────────────────────────────────
  const txt = transcript.map(t => t.text).join(" ").toLowerCase();
  const pos = SENTIMENT.positive.filter(k => txt.includes(k)).length;
  const neg = SENTIMENT.negative.filter(k => txt.includes(k)).length;
  const sentiment = pos > neg ? "Positive" : neg > pos ? "Negative" : "Neutral";
  const sentTone  = sentiment === "Positive" ? "bg-[#34A853] text-white"
                  : sentiment === "Negative" ? "bg-[#EA4335] text-white"
                  : "bg-zinc-500 text-white";


  // ── render ───────────────────────────────────────────────────────────────
  const callPanel = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/75 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">

        {/* LEFT ─ call controls */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex flex-col min-h-0">

          {/* top bar */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
              <span className={`size-2 rounded-full ${
                phase === "connected" ? "bg-[#34A853] animate-pulse" :
                phase === "dialing"   ? "bg-[#FBBC05] animate-pulse" : "bg-[#EA4335]"
              }`} />
              {phase === "dialing" ? "Ringing…" : phase === "connected" ? "Live Call" : "Call Ended"}
              {mode === "real" && phase !== "ended" && (
                <span className="ml-2 px-1.5 py-0.5 text-[9px] font-bold bg-[#34A853] text-white rounded">LIVE</span>
              )}
            </div>
            {/* X only after call ended */}
            {phase === "ended" && !showDisp && (
              <button onClick={() => onClose()} className="size-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70">
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* avatar + status */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 gap-4 min-h-0">
            <div className="relative">
              {phase === "dialing" && (
                <span className="absolute inset-0 rounded-full animate-ping bg-white/20 pointer-events-none" />
              )}
              {photo
                ? <img src={photo} alt={name} className="relative size-28 rounded-full object-cover ring-4 ring-white/20" />
                : <div className="relative size-28 rounded-full bg-white/10 ring-4 ring-white/20 grid place-items-center">
                    <User className="size-12 text-white/70" />
                  </div>
              }
            </div>

            <div className="text-center">
              <p className="text-2xl font-semibold">{name}</p>
              <p className="text-sm text-white/70">{company}</p>
              <p className="text-sm text-white/50 mt-0.5 tracking-wide font-mono">{phone}</p>
              {mode === "real" && phase === "dialing" && (
                <p className="text-xs text-[#FBBC05] mt-2 font-medium animate-pulse">
                  📞 FreJun is calling you first — answer your phone!
                </p>
              )}
              {callErr && <p className="text-xs text-[#EA4335] mt-2 max-w-xs">⚠️ {callErr}</p>}
            </div>

            <div className="text-4xl font-mono tabular-nums tracking-widest">
              {phase === "dialing" ? "00:00" : fmt(seconds)}
            </div>

            {phase === "connected" && (
              <div className="flex items-end gap-0.5 h-8">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span key={i} className="w-[3px] rounded-full bg-white/50"
                    style={{
                      height: `${muted ? 3 : 3 + Math.abs(Math.sin((seconds * 2 + i) * 0.6)) * 22}px`,
                      transition: "height 160ms ease",
                    }}
                  />
                ))}
              </div>
            )}

            {mode === "real" && realId && (
              <p className="text-[9px] text-white/40 font-mono">FreJun Call #{realId}</p>
            )}
          </div>

          {/* control bar */}
          <div className="shrink-0 px-6 pb-6 pt-2 grid grid-cols-5 gap-3 bg-gradient-to-t from-[#0a1628] to-transparent">
            <Ctrl icon={muted    ? MicOff  : Mic}     label={muted    ? "Unmute"  : "Mute"}    active={muted}     onClick={() => setMuted(m => !m)} />
            <Ctrl icon={held     ? Play    : Pause}   label={held     ? "Resume"  : "Hold"}    active={held}      onClick={() => setHeld(h => !h)} />
            <Ctrl icon={speakerOn ? Volume2 : VolumeX} label={speakerOn ? "Speaker" : "Muted"} active={!speakerOn} onClick={() => setSpeakerOn(s => !s)} />
            <Ctrl icon={Video}                         label="Video"                            active={false}     onClick={() => {}} />
            <button
              onClick={hangup}
              disabled={phase === "ended"}
              className="flex flex-col items-center gap-1 rounded-md bg-[#EA4335] hover:bg-[#c5372c] active:scale-95 disabled:opacity-40 px-3 py-2.5 transition-all"
            >
              <PhoneOff className="size-5" />
              <span className="text-[10px] font-semibold">End</span>
            </button>
          </div>
        </div>

        {/* RIGHT ─ transcript + AI */}
        <div className="flex flex-col min-h-0 bg-zinc-50 border-l border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white shrink-0">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-zinc-700" />
              <span className="text-sm font-semibold">Live Transcription</span>
              {phase === "ended"
                ? <span className="px-1.5 py-0.5 text-[10px] font-medium bg-zinc-200 text-zinc-600">ENDED</span>
                : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#EA4335] text-white">
                    <span className="size-1.5 rounded-full bg-white animate-pulse" /> REC
                  </span>
              }
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold ${sentTone}`}>{sentiment}</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin min-h-0">
            {phase === "dialing" && (
              <div className="flex flex-col items-center justify-center gap-3 text-zinc-500 text-xs mt-12">
                <div className="flex gap-1.5">
                  {[0,150,300].map(d => <span key={d} className="size-2.5 rounded-full bg-zinc-300 animate-bounce" style={{ animationDelay:`${d}ms` }} />)}
                </div>
                <p>{mode === "real" ? "Waiting for FreJun to bridge…" : "Ringing…"}</p>
              </div>
            )}
            {mode === "real" && phase === "connected" && transcript.length === 0 && (
              <div className="mt-8 p-4 bg-amber-50 ring-1 ring-amber-200 text-xs text-center rounded">
                <p className="font-semibold text-amber-800">Real Call Active</p>
                <p className="mt-1 text-zinc-600">Live transcription unavailable in real mode.</p>
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
                  {[0,150,300].map(d => <span key={d} className="size-1.5 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay:`${d}ms` }} />)}
                </div>
              </div>
            )}
          </div>

          {/* AI suggestions */}
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

  // ── disposition panel (rendered ON TOP of the call panel) ────────────────
  const dispPanel = showDisp ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)] ring-1 ring-zinc-950/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Log Call Outcome</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">{name} · {fmt(seconds)}</p>
          </div>
          <button onClick={skipDisp} className="size-8 grid place-items-center hover:bg-zinc-100 text-zinc-500 rounded">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">

          {/* Lead temperature */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">Lead Quality</p>
            <div className="grid grid-cols-3 gap-2">
              {(["Hot","Warm","Cold"] as const).map(t => (
                <button key={t} onClick={() => setTemp(t)}
                  className={`h-10 text-sm font-semibold rounded transition-colors ${
                    t === "Hot"  ? (temp === t ? "bg-red-500 text-white"   : "ring-1 ring-zinc-200 hover:bg-red-50")
                  : t === "Warm" ? (temp === t ? "bg-amber-400 text-white" : "ring-1 ring-zinc-200 hover:bg-amber-50")
                  :               (temp === t ? "bg-blue-500 text-white"  : "ring-1 ring-zinc-200 hover:bg-blue-50")
                  }`}>
                  {t === "Hot" ? "🔥 Hot" : t === "Warm" ? "☀️ Warm" : "❄️ Cold"}
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
                  className={`text-[11px] font-medium px-2 py-2 rounded transition-colors ${
                    disp === d ? "bg-zinc-900 text-white" : "ring-1 ring-zinc-200 hover:bg-zinc-50"
                  }`}>{d}</button>
              ))}
            </div>
          </div>

          {/* Schedule callback */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">📞 Schedule Callback</p>
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {[{l:"1 hr",h:1},{l:"4 hr",h:4},{l:"Tomorrow",h:24},{l:"3 days",h:72}].map(o => (
                <button key={o.l} onClick={() => { setCbTime(o.h); setCbDate(""); setCbStr(""); }}
                  className={`text-[10px] font-semibold py-2 rounded transition-colors ${
                    cbTime === o.h && !cbDate ? "bg-violet-600 text-white" : "ring-1 ring-zinc-200 bg-white hover:bg-violet-50"
                  }`}>{o.l}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-zinc-500 font-medium">Date</label>
                <input type="date" value={cbDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => { setCbDate(e.target.value); setCbTime(null); }}
                  className="mt-1 w-full h-9 px-2 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-medium">Time</label>
                <input type="time" value={cbStr} onChange={e => setCbStr(e.target.value)}
                  className="mt-1 w-full h-9 px-2 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30" />
              </div>
            </div>
          </div>

          {/* Note */}
          <div>
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">Note</p>
            <textarea value={note} onChange={e => setNote(e.target.value)}
              placeholder="Call note…" rows={2}
              className="w-full px-3 py-2 border border-zinc-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none" />
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={skipDisp}   className="flex-1 h-10 ring-1 ring-zinc-200 text-sm font-semibold hover:bg-zinc-50 rounded">Skip</button>
            <button onClick={submitDisp} className="flex-1 h-10 bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800 rounded">Save & Close</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return typeof document !== "undefined"
    ? createPortal(<>{callPanel}{dispPanel}</>, document.body)
    : <>{callPanel}{dispPanel}</>;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Ctrl({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md px-3 py-2.5 transition-colors ${
        active ? "bg-white text-zinc-900" : "bg-white/10 hover:bg-white/20 text-white"
      }`}>
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function aiSuggestions(t: Line[]): string[] {
  if (t.length === 0) return [
    "Greet the lead by name and confirm identity.",
    "Reference the last touchpoint or proposal.",
  ];
  const text = t.map(x => x.text).join(" ").toLowerCase();
  const out: string[] = [];
  if (text.includes("pricing") || text.includes("expensive"))
    out.push("Address pricing — highlight ROI and phased payment options.");
  if (text.includes("timeline") || text.includes("go-live") || text.includes("quarter"))
    out.push("Confirm timeline; offer a phased rollout plan.");
  if (text.includes("po") || text.includes("finance"))
    out.push("Loop in Finance and share the PO format template.");
  if (text.includes("proposal"))
    out.push("Offer to walk through the proposal section by section.");
  if (out.length === 0)
    out.push("Ask an open-ended discovery question about their current workflow.");
  out.push("Set a clear next step and send a calendar invite before ending.");
  return out.slice(0, 4);
}
