/**
 * Frejun API Service Layer
 * 
 * Documentation: https://api.frejun.com/api/v2/docs
 * Network calling docs: https://frejun.com/docs/calling/network
 * 
 * This service provides real phone calling capabilities through Frejun's API.
 * Supports:
 * - Network-based calls (2-legged: Frejun → User → Callee)
 * - Real-time call status tracking via webhooks
 * - Call logs and analytics
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type FrejunCallStatus =
  | "Outbound call initiated"
  | "Inbound call initiated"
  | "Call answered"
  | "Call completed"
  | "Call busy";

export type FrejunCallType = "outbound" | "inbound";

export interface FrejunCallResponse {
  success: boolean;
  message: string;
  data: {
    status: number;
    info: string;
    event_id: number;
    call_id: number;
    candidate_name?: string;
  };
}

export interface FrejunCallLog {
  call_id: string;
  start_time: string;
  call_creator: string;
  candidate_number: string;
  virtual_number: string;
  call_status: FrejunCallStatus;
  call_type: FrejunCallType;
  candidate_name?: string;
  end_time?: string;
  duration?: number; // milliseconds
  answer_time?: string;
  metadata?: {
    reference_id?: string;
    job_id?: string;
    transaction_id?: string;
  };
}

export interface FrejunWebhookPayload {
  event: "call.status" | "call.recording" | "call.insights" | "call.summary";
  call_id: string;
  call_status?: FrejunCallStatus;
  start_time?: string;
  end_time?: string;
  duration?: number;
  answer_time?: string;
  call_creator?: string;
  candidate_number?: string;
  virtual_number?: string;
  candidate_name?: string;
  call_type?: FrejunCallType;
  org_identifier?: string;
  metadata?: Record<string, string>;
}

// ─── Configuration ──────────────────────────────────────────────────────────
// API key and user email are read at call-time so they can be changed
// at runtime without reloading the page. Values are persisted to localStorage
// so they survive refreshes.

const LS_KEY_APIKEY = "frejun_api_key";
const LS_KEY_EMAIL  = "frejun_user_email";

const ENV_API_KEY  = import.meta.env.VITE_FREJUN_API_KEY  || "aecf3b6c.7c98a64f110fcee71c61266318156aff";
const ENV_EMAIL    = import.meta.env.VITE_FREJUN_USER_EMAIL || "";

/** Read the active API key (localStorage overrides .env) */
export function getFrejunApiKey(): string {
  try {
    return localStorage.getItem(LS_KEY_APIKEY) || ENV_API_KEY;
  } catch { return ENV_API_KEY; }
}

/** Persist a new API key to localStorage */
export function setFrejunApiKey(key: string): void {
  try { localStorage.setItem(LS_KEY_APIKEY, key.trim()); } catch {}
}

/** Read the OAuth access token (localStorage) */
export function getFrejunOAuthToken(): string {
  try { return localStorage.getItem("frejun_oauth_token") || ""; } catch { return ""; }
}

/** Persist OAuth token to localStorage */
export function setFrejunOAuthToken(token: string): void {
  try { localStorage.setItem("frejun_oauth_token", token.trim()); } catch {}
}

/** Read the active user email (localStorage overrides .env) */
export function getFrejunUserEmail(): string {
  try {
    return localStorage.getItem(LS_KEY_EMAIL) || ENV_EMAIL;
  } catch { return ENV_EMAIL; }
}

/** Persist a new user email to localStorage */
export function setFrejunUserEmail(email: string): void {
  try { localStorage.setItem(LS_KEY_EMAIL, email.trim()); } catch {}
}

const FREJUN_BASE_URL = "https://api.frejun.com/api/v1";

// ─── API Client ─────────────────────────────────────────────────────────────

async function frejunFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${FREJUN_BASE_URL}${endpoint}`;
  const headers = {
    "Authorization": `Api-Key ${getFrejunApiKey()}`,
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  // Always parse JSON so we surface Frejun's real error message
  let body: any;
  const text = await response.text();
  try { body = JSON.parse(text); } catch { body = { message: text }; }

  if (!response.ok) {
    const msg = body?.message || body?.detail || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  return body;
}

// ─── Call Management ────────────────────────────────────────────────────────

/**
 * Initiate a network-based call (2-legged flow).
 * 
 * Flow:
 * 1. Frejun calls the user's registered phone number
 * 2. User answers
 * 3. Frejun bridges to the candidate/lead number
 * 
 * @param candidateNumber - The lead/customer phone number to dial (E.164 format recommended)
 * @param candidateName - Optional name for the callee
 * @param metadata - Optional custom metadata (candidate_id, job_id, transaction_id)
 * @param userEmail - Optional override for the FreJun user email placing the call
 * @returns Call response with call_id and event_id for tracking
 */
export async function initiateCall(
  candidateNumber: string,
  candidateName?: string,
  metadata?: {
    candidate_id?: string;
    job_id?: string;
    transaction_id?: string;
  },
  userEmail?: string,
): Promise<FrejunCallResponse> {
  const payload: Record<string, string> = {
    user_email: userEmail || getFrejunUserEmail(),
    candidate_number: candidateNumber,
  };

  if (candidateName) payload.candidate_name = candidateName;
  if (metadata?.candidate_id) payload.candidate_id = metadata.candidate_id;
  if (metadata?.job_id) payload.job_id = metadata.job_id;
  if (metadata?.transaction_id) payload.transaction_id = metadata.transaction_id;

  return frejunFetch("/integrations/create-call/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Fetch call logs from Frejun.
 * 
 * Note: This uses the v2 API endpoint for listing calls.
 * Webhooks are recommended for real-time updates instead of polling.
 * 
 * @param limit - Maximum number of call logs to retrieve (default: 50)
 * @returns Array of call logs
 */
export async function getCallLogs(limit = 50): Promise<FrejunCallLog[]> {
  const v2Url = `https://api.frejun.com/api/v2/integrations/calls?limit=${limit}`;
  const response = await fetch(v2Url, {
    headers: { "Authorization": `Api-Key ${getFrejunApiKey()}` },
  });
  if (!response.ok) throw new Error(`Failed to fetch call logs: ${response.status}`);
  const data = await response.json();
  return data.results || [];
}

/**
 * Update call log disposition/notes after the call ends.
 * 
 * @param callId - The Frejun call_id returned from initiateCall
 * @param updates - Fields to update (notes, call_outcome, etc.)
 */
export async function updateCallLog(
  callId: string,
  updates: { notes?: string; call_outcome?: string; call_reason?: string },
): Promise<void> {
  await fetch(`https://api.frejun.com/api/v2/integrations/update-call-log`, {
    method: "PATCH",
    headers: {
      "Authorization": `Api-Key ${getFrejunApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ call_id: callId, ...updates }),
  });
}

// ─── Call Status Polling (for demo purposes; webhooks preferred) ───────────

/**
 * Poll for call status updates.
 * 
 * Note: In production, use webhooks (call.status event) instead of polling.
 * This is a fallback for demo/testing scenarios where webhooks aren't set up.
 * 
 * @param callId - The call_id to monitor
 * @param onStatusChange - Callback when status changes
 * @param intervalMs - Polling interval (default: 2000ms)
 * @returns Cleanup function to stop polling
 */
export function pollCallStatus(
  callId: number,
  onStatusChange: (status: FrejunCallStatus, callLog: FrejunCallLog) => void,
  intervalMs = 2000,
): () => void {
  let lastStatus: FrejunCallStatus | null = null;
  let polling = true;

  const poll = async () => {
    if (!polling) return;

    try {
      const logs = await getCallLogs(50);
      const callLog = logs.find((log) => log.call_id === String(callId));

      if (callLog && callLog.call_status !== lastStatus) {
        lastStatus = callLog.call_status;
        onStatusChange(callLog.call_status, callLog);
      }
    } catch (error) {
      console.error("Error polling call status:", error);
    }

    if (polling) {
      setTimeout(poll, intervalMs);
    }
  };

  poll();

  return () => {
    polling = false;
  };
}

// ─── Webhook Signature Verification (for production webhook endpoints) ─────

/**
 * Verify Frejun webhook signature.
 * 
 * All webhook requests from Frejun contain a "frejun-signature" header.
 * Verify this signature to ensure the webhook is authentic.
 * 
 * See: https://frejun.com/docs/webhooks/validating-requests/
 * 
 * @param payload - The raw webhook payload body
 * @param signature - The frejun-signature header value
 * @param secret - Your webhook secret (obtained when creating the webhook)
 * @returns True if signature is valid
 */
export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  // Frejun uses HMAC-SHA256 for signature verification
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === signature;
}

// ─── Helper: Format phone numbers to E.164 ─────────────────────────────────

/**
 * Format a phone number to E.164 format (recommended by Frejun).
 * 
 * Example: "9876543210" → "+919876543210"
 * 
 * Note: This is a basic formatter for Indian numbers.
 * For production, use a library like libphonenumber-js.
 */
export function formatPhoneE164(phone: string, defaultCountryCode = "+91"): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  // If already starts with +, return as-is
  if (phone.startsWith("+")) {
    return phone;
  }

  // If starts with country code (e.g., 91...), add +
  if (digits.length > 10 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  // Otherwise, prepend default country code
  return `${defaultCountryCode}${digits}`;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const FrejunService = {
  initiateCall,
  getCallLogs,
  updateCallLog,
  pollCallStatus,
  formatPhoneE164,
  verifyWebhookSignature,
};
