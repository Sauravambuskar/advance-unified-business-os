"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "framer-motion";

import { cn } from "@/lib/utils";

export interface ProgressiveFluxPhase {
  at: number;
  label: string;
}

export interface ProgressiveFluxLoaderProps {
  value?: number;
  phases?: ProgressiveFluxPhase[];
  duration?: number;
  loop?: boolean;
  showLabel?: boolean;
  gradient?: string;
  onComplete?: () => void;
  className?: string;
  barClassName?: string;
  textClassName?: string;
}

const DEFAULT_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: "starting up" },
  { at: 25, label: "loading assets" },
  { at: 55, label: "preparing magic" },
  { at: 80, label: "almost there" },
  { at: 100, label: "all done" },
];

// Soft multicolor sweep tuned to the app's neutral zinc theme — muted
// emerald → sky → violet → amber, blended so it stays calm on white surfaces.
// Override per-instance via CSS vars `--flux-a`..`--flux-d` or the `gradient` prop.
const FLUX_A = "var(--flux-a, oklch(0.72 0.14 160))"; // emerald
const FLUX_B = "var(--flux-b, oklch(0.72 0.13 230))"; // sky
const FLUX_C = "var(--flux-c, oklch(0.68 0.16 300))"; // violet
const FLUX_D = "var(--flux-d, oklch(0.80 0.14 75))"; // amber

const DEFAULT_GRADIENT = `linear-gradient(90deg, ${FLUX_A} 0%, ${FLUX_B} 33%, ${FLUX_C} 66%, ${FLUX_D} 100%)`;

const BAR_SHADOW = `0 0 14px color-mix(in oklab, ${FLUX_B} 45%, transparent), inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1.5px 2px rgba(30,41,59,0.25)`;

const SHEEN_GRADIENT =
  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)";

const LETTER_TRANSITION: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

function pickLabel(value: number, sortedPhases: ProgressiveFluxPhase[]) {
  let active = sortedPhases[0]?.label ?? "";
  for (const phase of sortedPhases) {
    if (value >= phase.at) active = phase.label;
  }
  return active;
}

function FluxLabel({ label, reduced, className }: { label: string; reduced: boolean; className?: string }) {
  const base = cn(
    "flex items-center justify-center text-center text-xs font-medium tracking-wide text-muted-foreground uppercase",
    className,
  );

  if (reduced) {
    return <div className={base}>{label}</div>;
  }

  return (
    <div className={base} aria-hidden>
      <AnimatePresence mode="wait">
        <motion.span
          key={label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={LETTER_TRANSITION}
          className="inline-flex"
        >
          {label.split("").map((char, index) => (
            <motion.span
              key={`${char}-${index}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...LETTER_TRANSITION, delay: index * 0.02 }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function ProgressiveFluxLoader({
  value,
  phases = DEFAULT_PHASES,
  duration = 12,
  loop = true,
  showLabel = true,
  gradient = DEFAULT_GRADIENT,
  onComplete,
  className,
  barClassName,
  textClassName,
}: ProgressiveFluxLoaderProps) {
  const reduced = !!useReducedMotion();
  const isControlled = typeof value === "number";
  const [internal, setInternal] = React.useState(0);

  const onCompleteRef = React.useRef(onComplete);
  React.useEffect(() => {
    onCompleteRef.current = onComplete;
  });

  const completedRef = React.useRef(false);

  React.useEffect(() => {
    if (isControlled) return;
    let raf = 0;
    let timer = 0;
    let start: number | null = null;
    const totalMs = Math.max(500, duration * 1000);

    const tick = (ts: number) => {
      if (start === null) start = ts;
      const pct = Math.min(100, ((ts - start) / totalMs) * 100);
      setInternal(pct);
      if (pct >= 100) {
        if (!completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current?.();
        }
        if (loop) {
          start = null;
          completedRef.current = false;
          timer = window.setTimeout(() => {
            setInternal(0);
            raf = requestAnimationFrame(tick);
          }, 700);
        }
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [isControlled, duration, loop]);

  const raw = isControlled ? value! : internal;
  const current = Number.isFinite(raw) ? Math.min(100, Math.max(0, raw)) : 0;

  React.useEffect(() => {
    if (!isControlled) return;
    if (current >= 100 && !completedRef.current) {
      completedRef.current = true;
      onCompleteRef.current?.();
    } else if (current < 100) {
      completedRef.current = false;
    }
  }, [isControlled, current]);

  const sortedPhases = React.useMemo(() => [...phases].sort((a, b) => a.at - b.at), [phases]);
  const label = React.useMemo(() => pickLabel(current, sortedPhases), [current, sortedPhases]);
  const rounded = Math.round(current);

  return (
    <div className={cn("w-full flex flex-col gap-2", className)}>
      {showLabel && (
        <div className="flex items-center justify-between gap-3">
          <FluxLabel label={label} reduced={reduced} className={textClassName} />
          <span className="text-[11px] font-mono tabular-nums text-muted-foreground">{rounded}%</span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={`${rounded}% — ${label}`}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-muted/70 ring-1 ring-black/5",
          barClassName,
        )}
      >
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: gradient, boxShadow: BAR_SHADOW }}
          animate={{ width: `${current}%` }}
          transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {!reduced && (
            <motion.div
              className="absolute inset-y-0 w-1/3 rounded-full mix-blend-screen"
              style={{ background: SHEEN_GRADIENT }}
              initial={{ x: "-100%" }}
              animate={{ x: "300%" }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default ProgressiveFluxLoader;
