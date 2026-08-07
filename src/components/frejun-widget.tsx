/**
 * FrejunDialerWidget
 *
 * Embeds the FreJun Dialer Widget (https://dialer.frejun.com/) as a hidden
 * iframe that stays mounted for the entire app session. This gives us real
 * VoIP audio (mic + speaker) via the browser's WebRTC stack — something the
 * REST API alone cannot provide.
 *
 * Communication is via window.postMessage:
 *   App → Iframe:  authorize, initiate-call, end-call
 *   Iframe → App:  ready, call-ended, incoming-call, unauthorized, close, height-change
 *
 * Docs: https://frejun.com/docs/calling/dialer-widget
 */

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { getFrejunOAuthToken, getFrejunUserEmail } from "@/lib/frejun";

const DIALER_ORIGIN = "https://dialer.frejun.com";
const DIALER_SRC   = "https://dialer.frejun.com/";

// ─── Public API exposed to parent via ref ────────────────────────────────────

export interface FrejunWidgetRef {
  /** Initiate an outbound call to a number */
  initiateCall: (params: {
    candidateNumber: string;
    candidateName?: string;
    transactionId?: string;
  }) => void;
  /** End the current call */
  endCall: () => void;
  /** Re-authorize (e.g. after token change) */
  authorize: () => void;
  /** Whether the widget is authorized and ready */
  isReady: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const FrejunDialerWidget = forwardRef<FrejunWidgetRef, {
  onCallEnded?: (data?: any) => void;
  onIncomingCall?: (data?: any) => void;
  onUnauthorized?: (detail?: string) => void;
}>(({ onCallEnded, onIncomingCall, onUnauthorized }, ref) => {
  const iframeRef   = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Send a message to the iframe ─────────────────────────────────────────
  const send = useCallback((msg: object) => {
    iframeRef.current?.contentWindow?.postMessage(msg, DIALER_ORIGIN);
  }, []);

  // ── Authorize with current stored credentials ─────────────────────────────
  const authorize = useCallback(() => {
    const access_token = getFrejunOAuthToken();
    const user_email   = getFrejunUserEmail();
    if (!access_token || !user_email) return;
    send({ eventName: "authorize", data: { access_token, user_email } });
  }, [send]);

  // ── Listen to messages from the iframe ───────────────────────────────────
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== DIALER_ORIGIN || !event.data) return;
      const { eventName, detail } = event.data;

      switch (eventName) {
        case "ready":
          setReady(true);
          authorize(); // immediately authorize on every load/reload
          break;

        case "unauthorized":
          setAuthorized(false);
          onUnauthorized?.(detail);
          break;

        // "authorize" succeeded = no explicit event, but calls start working.
        // We treat absence of "unauthorized" after authorize as success.
        case "incoming-call":
          setIsCallActive(true);
          onIncomingCall?.(event.data);
          break;

        case "call-ended":
          setIsCallActive(false);
          onCallEnded?.(event.data);
          break;

        case "close":
          // Widget is done — nothing to do in our UI
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [authorize, onCallEnded, onIncomingCall, onUnauthorized]);

  // ── Re-authorize when credentials change in localStorage ─────────────────
  useEffect(() => {
    if (ready) authorize();
  }, [ready, authorize]);

  // ── Expose imperative API ─────────────────────────────────────────────────
  useImperativeHandle(ref, () => ({
    isReady: ready && authorized,

    authorize,

    initiateCall({ candidateNumber, candidateName, transactionId }) {
      const access_token = getFrejunOAuthToken();
      const user_email   = getFrejunUserEmail();
      setIsCallActive(true);
      send({
        eventName: "initiate-call",
        data: {
          access_token,
          user_email,
          candidate_number: candidateNumber,
          ...(candidateName  ? { candidate_name:  candidateName  } : {}),
          ...(transactionId  ? { transaction_id:  transactionId  } : {}),
        },
      });
    },

    endCall() {
      setIsCallActive(false);
      send({ eventName: "end-call" });
    },
  }), [ready, authorized, authorize, send]);

  // ── Render: iframe that becomes visible during calls ──────────────────────
  // We render into document.body via portal so it isn't affected by any
  // parent overflow/transform containing blocks.
  // When a call is active, the iframe becomes visible and interactive.
  return mounted && typeof document !== "undefined"
    ? createPortal(
        <>
          {/* Backdrop */}
          {isCallActive && (
            <div
              style={{
                position: "fixed",
                inset: 0,
                backgroundColor: "rgba(0, 0, 0, 0.75)",
                backdropFilter: "blur(4px)",
                zIndex: 9998,
              }}
              onClick={() => {
                // Allow clicking backdrop to close (end call)
                if (window.confirm("End the call?")) {
                  setIsCallActive(false);
                  send({ eventName: "end-call" });
                }
              }}
            />
          )}
          {/* FreJun Widget Iframe */}
          <iframe
            ref={iframeRef}
            src={DIALER_SRC}
            allow="microphone; camera; autoplay; speaker-selection; display-capture"
            aria-hidden={!isCallActive}
            tabIndex={isCallActive ? 0 : -1}
            style={{
              position: "fixed",
              top: isCallActive ? "50%" : 0,
              left: isCallActive ? "50%" : 0,
              transform: isCallActive ? "translate(-50%, -50%)" : "none",
              width: isCallActive ? "420px" : 1,
              height: isCallActive ? "600px" : 1,
              maxWidth: isCallActive ? "90vw" : 1,
              maxHeight: isCallActive ? "90vh" : 1,
              opacity: isCallActive ? 1 : 0,
              pointerEvents: isCallActive ? "auto" : "none",
              border: "none",
              zIndex: isCallActive ? 9999 : -1,
              boxShadow: isCallActive ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)" : "none",
              borderRadius: isCallActive ? "12px" : 0,
              transition: "all 0.3s ease",
            }}
            title="FreJun Dialer"
          />
        </>,
        document.body,
      )
    : null;
});

FrejunDialerWidget.displayName = "FrejunDialerWidget";

// ─── Hook: useFreJunWidget ────────────────────────────────────────────────────
// Convenience hook that gives any component access to the global widget ref.
// Usage: const widget = useFreJunWidget(); widget.initiateCall(...)

import { createContext, useContext, type RefObject } from "react";

export const FrejunWidgetContext = createContext<RefObject<FrejunWidgetRef | null> | null>(null);

export function useFreJunWidget(): FrejunWidgetRef | null {
  const ctx = useContext(FrejunWidgetContext);
  return ctx?.current ?? null;
}
