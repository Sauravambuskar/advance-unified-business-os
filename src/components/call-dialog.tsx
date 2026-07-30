import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Video,
  MessageSquare,
  Sparkles,
  X,
  User,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

type Line = { who: "agent" | "lead"; text: string; at: number };

// ─── Script (simulated conversation) ────────────────────────────────────────

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

// ─── Audio Singleton ────────────────────────────────────────────────────────
// Only one audio session can exist at a time. When a new call starts, any
// previous session is destroyed first. When the call ends (hangup or close),
// all audio stops immediately and resources are released.

class CallAudioSession {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private ringOsc1: OscillatorNode | null = null;
  private ringOsc2: OscillatorNode | null = null;
  private ringGain: GainNode | null = null;
  private ringInterval: ReturnType<typeof setInterval> | null = null;
  private talkOsc: OscillatorNode | null = null;
  private talkGain: GainNode | null = null;
  private talkFilter: BiquadFilterNode | null = null;
  private destroyed = false;

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1;
    this.masterGain.connect(this.ctx.destination);
    // Resume if suspended (browser autoplay policy)
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  /** Set speaker on/off. When off, master gain is 0. */
  setSpeaker(on: boolean) {
    if (this.destroyed) return;
    this.masterGain.gain.value = on ? 1 : 0;
  }

  /**
   * Start the ring-back tone.
   * Pattern: Indian ring-back style — 400Hz + 450Hz sine, 1 second ON, 2 seconds OFF, repeating.
   */
  startRinging() {
    if (this.destroyed) return;
    this.stopRinging(); // safety: stop any prior ring

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sine";
    osc2.type = "sine";
    osc1.frequency.value = 400;
    osc2.frequency.value = 450;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);

    osc1.start();
    osc2.start();

    this.ringOsc1 = osc1;
    this.ringOsc2 = osc2;
    this.ringGain = gain;

    // Ring pattern: 1s on, 2s off (3s cycle total)
    // Immediate first ring
    gain.gain.value = 0.25;

    let ringOn = true;
    const toggle = () => {
      if (this.destroyed || !this.ringGain) return;
      ringOn = !ringOn;
      this.ringGain.gain.value = ringOn ? 0.25 : 0;
    };

    // 1s on → off after 1s, on again after 2s silence = intervals at 1000, 2000 alternating
    // Simpler: use setInterval at 1500ms toggling, gives ~1.5s on, 1.5s off
    // More accurate: schedule with two timeouts in a loop
    let active = true;
    const cycle = () => {
      if (!active || this.destroyed || !this.ringGain) return;
      // ON for 1 second
      this.ringGain.gain.value = 0.25;
      setTimeout(() => {
        if (!active || this.destroyed || !this.ringGain) return;
        // OFF for 2 seconds
        this.ringGain.gain.value = 0;
        setTimeout(() => {
          if (!active || this.destroyed) return;
          cycle();
        }, 2000);
      }, 1000);
    };

    cycle();

    // Store cleanup handle
    this.ringInterval = setInterval(() => {
      // This is just a keep-alive marker; actual scheduling is in cycle()
      if (this.destroyed) {
        if (this.ringInterval) clearInterval(this.ringInterval);
      }
    }, 10000) as any;

    // Override cleanup to also kill the cycle
    const origStop = this.stopRinging.bind(this);
    this.stopRinging = () => {
      active = false;
      origStop();
    };
  }

  /** Stop ringing tone immediately. */
  stopRinging() {
    if (this.ringGain) {
      this.ringGain.gain.value = 0;
    }
    try { this.ringOsc1?.stop(); } catch {}
    try { this.ringOsc2?.stop(); } catch {}
    this.ringOsc1 = null;
    this.ringOsc2 = null;
    this.ringGain = null;
    if (this.ringInterval) {
      clearInterval(this.ringInterval);
      this.ringInterval = null;
    }
  }

  /**
   * Start the talk tone engine (used during connected phase).
   * Doesn't produce sound until speak() is called.
   */
  startTalkEngine() {
    if (this.destroyed) return;
    this.stopTalkEngine();

    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = 170;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.Q.value = 1.5;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start();

    this.talkOsc = osc;
    this.talkFilter = filter;
    this.talkGain = gain;
  }

  /** Trigger a short talk-like sound burst (simulating the other person speaking). */
  speak(durationMs = 1500) {
    if (this.destroyed || !this.talkGain || !this.ctx) return;
    const now = this.ctx.currentTime;
    const dur = durationMs / 1000;
    this.talkGain.gain.cancelScheduledValues(now);
    this.talkGain.gain.setValueAtTime(0, now);
    this.talkGain.gain.linearRampToValueAtTime(0.1, now + 0.05);
    this.talkGain.gain.setValueAtTime(0.1, now + dur * 0.7);
    this.talkGain.gain.linearRampToValueAtTime(0, now + dur);
  }

  /** Stop the talk engine. */
  stopTalkEngine() {
    if (this.talkGain) {
      this.talkGain.gain.value = 0;
    }
    try { this.talkOsc?.stop(); } catch {}
    this.talkOsc = null;
    this.talkFilter = null;
    this.talkGain = null;
  }

  /** Destroy the entire audio session. Stops all sound, closes AudioContext. */
  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopRinging();
    this.stopTalkEngine();
    this.masterGain.gain.value = 0;
    // Close context after a brief delay to avoid click
    setTimeout(() => {
      try { this.ctx.close(); } catch {}
    }, 100);
  }

  isDestroyed() {
    return this.destroyed;
  }
}

// Global ref: ensures only one audio session exists across the entire app.
let activeSession: CallAudioSession | null = null;

function getOrCreateSession(): CallAudioSession {
  // Kill any existing session before creating a new one
  if (activeSession && !activeSession.isDestroyed()) {
    activeSession.destroy();
  }
  activeSession = new CallAudioSession();
  return activeSession;
}

function destroyActiveSession() {
  if (activeSession) {
    activeSession.destroy();
    activeSession = null;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function CallDialog({
  open,
  onClose,
  name,
  phone,
  company,
  photo,
  onDisposition,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  company: string;
  photo?: string;
  onDisposition?: (disposition: string, note: string, duration: number, temperature: string, callbackHours: number | null) => void;
}) {
  const [phase, setPhase] = useState<"dialing" | "connected" | "ended">("dialing");
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(true);
  const [held, setHeld] = useState(false);
  const [transcript, setTranscript] = useState<Line[]>([]);
  const [showDisposition, setShowDisposition] = useState(false);
  const [disposition, setDisposition] = useState("");
  const [callNote, setCallNote] = useState("");
  const [leadTemp, setLeadTemp] = useState("");
  const [callbackTime, setCallbackTime] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);
  const audioRef = useRef<CallAudioSession | null>(null);
  const prevTranscriptLen = useRef(0);

  // ─── Open: create audio session & start ringing ─────────────────────────
  useEffect(() => {
    if (!open) return;

    // Reset state
    setPhase("dialing");
    setSeconds(0);
    setTranscript([]);
    setMuted(false);
    setSpeaker(true);
    setHeld(false);
    prevTranscriptLen.current = 0;

    // Create fresh audio session (destroys any prior one)
    const session = getOrCreateSession();
    audioRef.current = session;

    // Start ringing
    session.startRinging();

    // After 3.5 seconds, stop ringing and connect
    const dialTimer = window.setTimeout(() => {
      if (session.isDestroyed()) return;
      session.stopRinging();
      session.startTalkEngine();
      setPhase("connected");
    }, 3500);

    timersRef.current = [dialTimer];

    // Cleanup when dialog closes or component unmounts
    return () => {
      timersRef.current.forEach((t) => {
        window.clearTimeout(t);
        window.clearInterval(t);
      });
      timersRef.current = [];
      // Destroy audio when dialog closes
      if (audioRef.current && !audioRef.current.isDestroyed()) {
        audioRef.current.destroy();
      }
      audioRef.current = null;
    };
  }, [open]);

  // ─── Speaker toggle ─────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current && !audioRef.current.isDestroyed()) {
      audioRef.current.setSpeaker(speaker);
    }
  }, [speaker]);

  // ─── Connected: start timer + transcript playback ───────────────────────
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

  // ─── Transcript scroll ──────────────────────────────────────────────────
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [transcript]);

  // ─── Play talk sound when lead speaks ───────────────────────────────────
  useEffect(() => {
    if (transcript.length > prevTranscriptLen.current) {
      const newLines = transcript.slice(prevTranscriptLen.current);
      newLines.forEach((line) => {
        if (line.who === "lead" && audioRef.current && !audioRef.current.isDestroyed()) {
          const words = line.text.split(" ").length;
          audioRef.current.speak(Math.min(words * 120, 3000));
        }
      });
    }
    prevTranscriptLen.current = transcript.length;
  }, [transcript]);

  // ─── Don't render if not open ───────────────────────────────────────────
  if (!open) return null;

  // ─── Hangup handler ─────────────────────────────────────────────────────
  const hangup = () => {
    setPhase("ended");
    // Immediately kill all audio
    if (audioRef.current && !audioRef.current.isDestroyed()) {
      audioRef.current.destroy();
    }
    audioRef.current = null;
    // Clear all pending timers
    timersRef.current.forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    timersRef.current = [];
    // Show disposition dialog instead of closing immediately
    if (onDisposition && seconds > 0) {
      setShowDisposition(true);
    } else {
      setTimeout(onClose, 600);
    }
  };

  const submitDisposition = () => {
    if (onDisposition) {
      onDisposition(disposition || "Follow Up", callNote, seconds, leadTemp || "Warm", callbackTime);
    }
    setShowDisposition(false);
    setDisposition("");
    setCallNote("");
    setLeadTemp("");
    setCallbackTime(null);
    onClose();
  };

  const skipDisposition = () => {
    if (onDisposition && (disposition || leadTemp)) {
      onDisposition(disposition || "Follow Up", callNote, seconds, leadTemp || "Warm", callbackTime);
    }
    setShowDisposition(false);
    setDisposition("");
    setCallNote("");
    setLeadTemp("");
    setCallbackTime(null);
    onClose();
  };

  // ─── Sentiment analysis ─────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────────────
  const content = (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-zinc-950/70 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={hangup} aria-hidden />
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[86vh] bg-white shadow-2xl ring-1 ring-black/10 overflow-hidden grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] grid-rows-[minmax(0,1fr)] lg:grid-rows-1">
        {/* LEFT: Call panel */}
        <div className="relative bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/70">
              <span
                className={`inline-block size-2 rounded-full ${
                  phase === "connected"
                    ? "bg-[#34A853] animate-pulse"
                    : phase === "dialing"
                      ? "bg-[#FBBC05] animate-pulse"
                      : "bg-[#EA4335]"
                }`}
              />
              {phase === "dialing" ? "Ringing…" : phase === "connected" ? "In Call" : "Call Ended"}
            </div>
            <button
              onClick={hangup}
              className="size-8 grid place-items-center rounded-md hover:bg-white/10 text-white/70"
              aria-label="Close call"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin flex flex-col items-center justify-center px-6 py-8 gap-4">
            <div className="relative">
              <div
                className={`absolute inset-0 rounded-full ${phase === "dialing" ? "animate-ping bg-white/20" : ""}`}
              />
              {photo ? (
                <img
                  src={photo}
                  alt={name}
                  className="relative size-32 rounded-full object-cover ring-4 ring-white/20"
                />
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
            <CallCtrl
              icon={muted ? MicOff : Mic}
              label={muted ? "Unmute" : "Mute"}
              active={muted}
              onClick={() => setMuted((m) => !m)}
            />
            <CallCtrl
              icon={held ? Play : Pause}
              label={held ? "Resume" : "Hold"}
              active={held}
              onClick={() => setHeld((h) => !h)}
            />
            <CallCtrl
              icon={speaker ? Volume2 : VolumeX}
              label={speaker ? "Speaker" : "Muted"}
              active={!speaker}
              onClick={() => setSpeaker((s) => !s)}
            />
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
        <div className="flex flex-col min-h-0 overflow-hidden bg-zinc-50 border-l border-zinc-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 bg-white">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-zinc-700" />
              <span className="text-sm font-semibold">Live Transcription</span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium bg-[#EA4335] text-white">
                <span className="size-1.5 rounded-full bg-white animate-pulse" /> REC
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-semibold ${sentimentTone}`}>{sentiment}</span>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {phase === "dialing" && (
              <div className="text-center text-xs text-zinc-500 mt-8">
                <div className="inline-flex gap-1">
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="size-2 rounded-full bg-zinc-400 animate-bounce" />
                </div>
                <p className="mt-2">Ringing…</p>
              </div>
            )}
            {transcript.map((line, i) => (
              <div key={i} className={`flex ${line.who === "agent" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 text-sm ${
                    line.who === "agent"
                      ? "bg-[#4285F4] text-white"
                      : "bg-white ring-1 ring-zinc-200 text-zinc-800"
                  }`}
                >
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
                <div
                  key={i}
                  className="px-2.5 py-1.5 bg-zinc-50 ring-1 ring-zinc-200 text-xs text-zinc-700 flex items-start gap-2"
                >
                  <span className="size-1.5 rounded-full bg-[#4285F4] mt-1.5 shrink-0" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <button className="text-[10px] font-semibold px-2 py-1.5 bg-zinc-900 text-white hover:bg-zinc-800">
                Save Note
              </button>
              <button className="text-[10px] font-semibold px-2 py-1.5 ring-1 ring-zinc-300 hover:bg-zinc-100">
                Create Task
              </button>
              <button className="text-[10px] font-semibold px-2 py-1.5 ring-1 ring-zinc-300 hover:bg-zinc-100">
                Send Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Disposition overlay (shown after hangup)
  const dispositionPanel = showDisposition ? (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-200 bg-zinc-50">
          <p className="text-sm font-semibold">Log Call Outcome</p>
          <p className="text-[11px] text-zinc-500 mt-0.5">{name} · {fmt(seconds)}</p>
        </div>
        <div className="p-4 space-y-3">
          {/* Lead Temperature */}
          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => setLeadTemp("Hot")} className={`h-9 rounded-lg text-xs font-semibold ${leadTemp === "Hot" ? "bg-red-500 text-white" : "ring-1 ring-zinc-200 hover:bg-red-50"}`}>🔥 Hot</button>
            <button onClick={() => setLeadTemp("Warm")} className={`h-9 rounded-lg text-xs font-semibold ${leadTemp === "Warm" ? "bg-amber-500 text-white" : "ring-1 ring-zinc-200 hover:bg-amber-50"}`}>☀️ Warm</button>
            <button onClick={() => setLeadTemp("Cold")} className={`h-9 rounded-lg text-xs font-semibold ${leadTemp === "Cold" ? "bg-blue-500 text-white" : "ring-1 ring-zinc-200 hover:bg-blue-50"}`}>❄️ Cold</button>
          </div>

          {/* Disposition */}
          <div className="grid grid-cols-2 gap-1.5">
            {["Interested", "Follow Up", "No Answer", "Not Interested", "Voicemail", "Wrong Number"].map((d) => (
              <button key={d} onClick={() => setDisposition(d)} className={`text-[11px] font-medium px-2 py-2 rounded-lg ring-1 ${disposition === d ? "bg-zinc-900 text-white ring-zinc-900" : "ring-zinc-200 hover:bg-zinc-50"}`}>{d}</button>
            ))}
          </div>

          {/* Schedule Callback — always visible */}
          <div className="rounded-lg ring-1 ring-zinc-200 p-3 space-y-2 bg-zinc-50/50">
            <p className="text-[11px] font-semibold text-zinc-700">📞 Schedule Callback</p>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: "1hr", hours: 1 },
                { label: "4hr", hours: 4 },
                { label: "Tomorrow", hours: 24 },
                { label: "3 days", hours: 72 },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setCallbackTime(opt.hours)}
                  className={`text-[10px] font-semibold py-1.5 rounded-md ${callbackTime === opt.hours ? "bg-violet-600 text-white" : "ring-1 ring-zinc-200 bg-white hover:bg-violet-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <textarea
            value={callNote}
            onChange={(e) => setCallNote(e.target.value)}
            placeholder="Call note (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={skipDisposition} className="flex-1 h-9 rounded-lg ring-1 ring-zinc-200 text-xs font-semibold hover:bg-zinc-50">Skip</button>
            <button onClick={submitDisposition} className="flex-1 h-9 rounded-lg bg-zinc-900 text-white text-xs font-semibold hover:bg-zinc-800">Save</button>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  const finalContent = (
    <>
      {content}
      {dispositionPanel}
    </>
  );

  return typeof document !== "undefined" ? createPortal(finalContent, document.body) : finalContent;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function CallCtrl({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-md px-3 py-2.5 transition-colors ${
        active ? "bg-white text-zinc-900" : "bg-white/10 hover:bg-white/20 text-white"
      }`}
    >
      <Icon className="size-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function aiSuggestions(t: Line[]): string[] {
  if (t.length === 0)
    return ["Greet the lead by name and confirm identity.", "Reference the last touchpoint or proposal."];
  const text = t.map((x) => x.text).join(" ").toLowerCase();
  const out: string[] = [];
  if (text.includes("pricing") || text.includes("expensive"))
    out.push("Address pricing — highlight ROI and phased payment options.");
  if (text.includes("timeline") || text.includes("go-live") || text.includes("quarter"))
    out.push("Confirm delivery timeline; offer a phased rollout plan.");
  if (text.includes("po") || text.includes("finance"))
    out.push("Loop in Finance and share the PO format template.");
  if (text.includes("proposal")) out.push("Offer to walk through the proposal, section by section.");
  if (out.length === 0) out.push("Ask an open-ended discovery question about their current workflow.");
  out.push("Set a clear next step and calendar invite before ending the call.");
  return out.slice(0, 4);
}
