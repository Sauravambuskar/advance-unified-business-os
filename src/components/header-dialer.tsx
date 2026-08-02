import { useState } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneCall, Delete, X, UserPlus, Users as UsersIcon, Settings, Eye, EyeOff } from "lucide-react";
import { CallDialog } from "@/components/call-dialog";
import { useAppStore, type CallDisposition } from "@/lib/app-store";
import {
  getFrejunApiKey, getFrejunUserEmail, setFrejunApiKey, setFrejunUserEmail,
  getFrejunOAuthToken, setFrejunOAuthToken,
} from "@/lib/frejun";
import { toast } from "sonner";

type SaveKind = "Lead" | "Customer";

/**
 * Header dial pad. Lets the user dial any number, opens the call UI,
 * and after hanging up auto-prompts to save the number as a Lead or Customer
 * so the conversation is captured in the CRM without going into a lead first.
 */
export function HeaderDialer({
  companyKey,
  companyName,
  userEmail,
  onUpdateEmail,
  dialerMode = "simulated",
  onToggleMode,
}: {
  companyKey: string;
  companyName: string;
  userEmail?: string;
  onUpdateEmail?: (email: string) => void;
  dialerMode?: "simulated" | "real";
  onToggleMode?: () => void;
}) {
  const store = useAppStore();
  const [padOpen, setPadOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editEmail, setEditEmail] = useState(userEmail || "");
  const [editApiKey, setEditApiKey] = useState("");
  const [editOAuthToken, setEditOAuthToken] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showOAuth, setShowOAuth] = useState(false);
  const [pendingNumber, setPendingNumber] = useState("");
  const [saveKind, setSaveKind] = useState<SaveKind>("Lead");
  const [saveName, setSaveName] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [lastDisposition, setLastDisposition] = useState("");

  const openSettings = () => {
    setEditEmail(userEmail || getFrejunUserEmail());
    setEditApiKey(getFrejunApiKey());
    setEditOAuthToken(getFrejunOAuthToken());
    setShowApiKey(false);
    setShowOAuth(false);
    setSettingsOpen(true);
  };

  const displayName = () =>
    number.trim() ? `Unknown · ${number.trim()}` : "Unknown";

  const press = (v: string) => setNumber((n) => (n + v).slice(0, 20));
  const back = () => setNumber((n) => n.slice(0, -1));

  const startCall = () => {
    if (!number.trim()) {
      toast.error("Enter a number to dial");
      return;
    }
    const num = number.trim();
    setPendingNumber(num);
    store.logCall({
      leadKey: `dialer::${num}`,
      name: `Unknown · ${num}`,
      phone: num,
      company: companyName,
    });
    setPadOpen(false);
    setCallOpen(true);
  };

  const onCallClosed = () => {
    setCallOpen(false);
    // After the call ends, auto-open the save prompt so the conversation
    // is captured against a Lead or Customer record automatically.
    setSaveName("");
    setSaveNote(lastDisposition ? `Disposition: ${lastDisposition}` : "");
    setSaveKind("Lead");
    setSavePromptOpen(true);
  };

  const handleDisposition = (disposition: string, note: string, duration: number, temperature: string, callbackHours: number | null) => {
    const leadKey = `dialer::${pendingNumber}`;
    setLastDisposition(`${disposition} · ${temperature}`);

    // Update call log with disposition and temperature
    const lastLog = store.callLogs.find((c) => c.leadKey === leadKey);
    if (lastLog) {
      store.updateCallDisposition(leadKey, lastLog.at, disposition as CallDisposition, note, temperature as "Hot" | "Warm" | "Cold");
    }

    // Schedule callback if user selected a time
    if (callbackHours) {
      store.scheduleCallback({
        leadKey,
        name: `Unknown · ${pendingNumber}`,
        phone: pendingNumber,
        company: companyName,
        scheduledAt: new Date(Date.now() + callbackHours * 3600000).toISOString(),
        note: note || `Callback in ${callbackHours}h`,
      });
      toast.success("Callback scheduled", { description: `${pendingNumber} in ${callbackHours}h` });
    }

    // Run call automations
    const enabledRules = store.callRules.filter((r) => r.enabled);

    enabledRules.forEach((rule) => {
      if (rule.trigger === "after_call") {
        if (rule.action === "create_task") {
          store.addTask(companyKey, {
            name: `Follow up: ${pendingNumber} [${temperature}]`,
            owner: "You",
            due: temperature === "Hot" ? "Today" : "Tomorrow",
            status: "Pending",
          });
          toast.success("Auto-created follow-up task");
        }
        if (rule.action === "send_sms" && rule.config.disposition === disposition) {
          const msg = (rule.config.template || "Thanks for your time!")
            .replace("{name}", pendingNumber)
            .replace("{company}", companyName);
          toast.success("WhatsApp sent", { description: msg.slice(0, 60) + "…" });
        }
      }
      if (rule.trigger === "no_answer" && disposition === "No Answer" && !callbackHours) {
        if (rule.action === "schedule_callback") {
          const delayHrs = parseInt(rule.config.delayHours || "4", 10);
          store.scheduleCallback({
            leadKey,
            name: `Unknown · ${pendingNumber}`,
            phone: pendingNumber,
            company: companyName,
            scheduledAt: new Date(Date.now() + delayHrs * 3600000).toISOString(),
            note: rule.config.note || `Auto-scheduled: no answer`,
          });
          toast.success("Callback auto-scheduled", { description: `${pendingNumber} in ${delayHrs}h` });
        }
      }
    });

    store.bumpUnread();
  };

  const saveContact = () => {
    const nm = saveName.trim() || `Unknown · ${pendingNumber}`;
    const initials =
      nm
        .replace(/[^a-zA-Z ]/g, "")
        .split(" ")
        .filter(Boolean)
        .map((s) => s[0])
        .slice(0, 2)
        .join("")
        .toUpperCase() || "??";
    store.addLead(companyKey, {
      name: nm,
      time: "Just now",
      email: "—",
      phone: pendingNumber,
      camp: saveKind === "Customer" ? "DIAL-CUST" : "DIAL-LEAD",
      message: saveNote.trim() || `Auto-saved from dialer call · ${saveKind}`,
      initials,
      tone: "bg-[#4285F4] text-white",
      stage: saveKind === "Customer" ? "Won" : "Contacted",
      stageTone:
        saveKind === "Customer"
          ? "bg-[#34A853] text-white ring-[#34A853]/30"
          : "bg-[#5F6368] text-white ring-[#5F6368]/30",
    });
    toast.success(`${saveKind} saved`, { description: `${nm} · ${pendingNumber}` });
    setSavePromptOpen(false);
    setNumber("");
    setPendingNumber("");
  };

  const skipSave = () => {
    setSavePromptOpen(false);
    setNumber("");
    setPendingNumber("");
  };

  const modals = (
    <>
      {/* Dial pad popup */}
      {padOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-3 bg-zinc-950/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setPadOpen(false)} aria-hidden />
          <div className="relative w-full max-w-xs bg-white shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <PhoneCall className="size-4 text-[#34A853]" />
                <span className="text-sm font-semibold">Dial a number</span>
              </div>
              <button
                onClick={() => setPadOpen(false)}
                className="size-7 grid place-items-center rounded-md hover:bg-zinc-100 text-zinc-600"
                aria-label="Close dialer"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={number}
                  onChange={(e) => setNumber(e.target.value.replace(/[^\d+*# ]/g, "").slice(0, 20))}
                  placeholder="+91 00000 00000"
                  className="flex-1 h-11 px-3 rounded-md border border-zinc-200 text-lg font-mono tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                />
                <button
                  onClick={back}
                  className="size-11 grid place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-600"
                  aria-label="Backspace"
                >
                  <Delete className="size-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map((k) => (
                  <button
                    key={k}
                    onClick={() => press(k)}
                    className="h-12 rounded-md bg-zinc-50 hover:bg-zinc-100 text-lg font-semibold text-zinc-800 ring-1 ring-zinc-200"
                  >
                    {k}
                  </button>
                ))}
              </div>
              <button
                onClick={startCall}
                className="w-full h-11 rounded-md bg-[#34A853] text-white text-sm font-semibold hover:bg-[#2c8f46] flex items-center justify-center gap-2"
              >
                <Phone className="size-4" /> Call
              </button>
              <p className="text-[11px] text-zinc-500 text-center">
                After the call, you'll be asked to save this number as a Lead or Customer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Call dialog */}
      <CallDialog
        open={callOpen}
        onClose={onCallClosed}
        name={displayName()}
        phone={pendingNumber || number || "+91 00000 00000"}
        company={companyName}
        onDisposition={handleDisposition}
        mode={dialerMode}
        userEmail={userEmail}
      />

      {/* Save-as prompt after hangup */}
      {savePromptOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 bg-zinc-950/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={skipSave} aria-hidden />
          <div className="relative w-full max-w-sm bg-white shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <span className="text-sm font-semibold">Save contact</span>
              <button
                onClick={skipSave}
                className="size-7 grid place-items-center rounded-md hover:bg-zinc-100 text-zinc-600"
                aria-label="Skip save"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="p-2 rounded-md bg-zinc-50 ring-1 ring-zinc-200 text-center">
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">Just called</p>
                <p className="font-mono tracking-wider text-zinc-900">{pendingNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSaveKind("Lead")}
                  className={`h-10 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    saveKind === "Lead"
                      ? "bg-[#4285F4] text-white"
                      : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <UserPlus className="size-4" /> Lead
                </button>
                <button
                  onClick={() => setSaveKind("Customer")}
                  className={`h-10 rounded-md text-sm font-semibold flex items-center justify-center gap-1.5 ${
                    saveKind === "Customer"
                      ? "bg-[#34A853] text-white"
                      : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <UsersIcon className="size-4" /> Customer
                </button>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Name</label>
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Ravi Sharma"
                  className="mt-1 w-full h-9 px-3 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Call note</label>
                <textarea
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  placeholder="Short summary of what was discussed…"
                  rows={3}
                  className="mt-1 w-full px-3 py-2 rounded-md border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={skipSave}
                  className="flex-1 h-10 rounded-md ring-1 ring-zinc-200 text-sm font-semibold hover:bg-zinc-50"
                >
                  Skip
                </button>
                <button
                  onClick={saveContact}
                  className="flex-1 h-10 rounded-md bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800"
                >
                  Save as {saveKind}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings dialog for email and mode */}
      {settingsOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-3 bg-zinc-950/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setSettingsOpen(false)} aria-hidden />
          <div className="relative w-full max-w-md bg-white shadow-2xl ring-1 ring-black/10 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Settings className="size-4 text-zinc-700" />
                <span className="text-sm font-semibold">FreJun Dialer Settings</span>
              </div>
              <button onClick={() => setSettingsOpen(false)} className="size-7 grid place-items-center rounded-md hover:bg-zinc-100 text-zinc-600">
                <X className="size-4" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">

              {/* Calling Mode */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-600 uppercase tracking-wider">Calling Mode</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button onClick={onToggleMode}
                    className={`h-10 rounded-md text-sm font-semibold ${dialerMode === "simulated" ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
                    🎭 Simulated
                  </button>
                  <button onClick={onToggleMode}
                    className={`h-10 rounded-md text-sm font-semibold ${dialerMode === "real" ? "bg-[#34A853] text-white" : "bg-white ring-1 ring-zinc-200 text-zinc-700 hover:bg-zinc-50"}`}>
                    📞 Real (FreJun)
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  {dialerMode === "real"
                    ? "FreJun calls you first, then bridges to the lead's number."
                    : "Demo mode — simulated audio and transcript. No real calls made."}
                </p>
              </div>

              <div className="border-t border-zinc-100" />

              {/* FreJun Email */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  FreJun Account Email
                  {dialerMode === "real" && <span className="text-[#EA4335] font-bold">*</span>}
                </label>
                <p className="text-[10px] text-zinc-500 mt-1 mb-1.5">
                  Exact email you use at{" "}
                  <a href="https://product.frejun.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    product.frejun.com
                  </a>. FreJun calls this user's phone first.
                </p>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="yourname@company.com"
                  className={`w-full h-9 px-3 rounded-md border text-sm focus:outline-none focus:ring-2 ${
                    dialerMode === "real" && !editEmail
                      ? "border-[#EA4335] focus:ring-[#EA4335]/20 bg-red-50"
                      : "border-zinc-200 focus:ring-zinc-900/10"
                  }`}
                />
                {dialerMode === "real" && !editEmail && (
                  <p className="text-[10px] text-[#EA4335] mt-1 font-medium">⚠️ Required — calls will fail without this.</p>
                )}
                {editEmail && <p className="text-[10px] text-[#34A853] mt-1">✓ {editEmail}</p>}
              </div>

              {/* API Key */}
              <div>
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  FreJun API Key
                </label>
                <p className="text-[10px] text-zinc-500 mt-1 mb-1.5">
                  From{" "}
                  <a href="https://product.frejun.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    FreJun → Settings → Developer → API Key
                  </a>. Used for call logs API (optional).
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={editApiKey}
                    onChange={(e) => setEditApiKey(e.target.value)}
                    placeholder="xxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="flex-1 h-9 px-3 rounded-md border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                  />
                  <button
                    onClick={() => setShowApiKey(k => !k)}
                    className="size-9 grid place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-500 shrink-0"
                    title={showApiKey ? "Hide key" : "Show key"}
                  >
                    {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {editApiKey && (
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono truncate">
                    {showApiKey ? editApiKey : `${editApiKey.slice(0, 8)}${"•".repeat(Math.max(0, editApiKey.length - 8))}`}
                  </p>
                )}
              </div>

              {/* OAuth Token — REQUIRED for real calling */}
              <div className={dialerMode === "real" ? "p-3 bg-amber-50 ring-2 ring-amber-300 rounded-lg" : ""}>
                <label className="text-[11px] font-semibold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                  FreJun OAuth Access Token
                  {dialerMode === "real" && <span className="text-[#EA4335] font-bold">*</span>}
                </label>
                <p className="text-[10px] text-zinc-500 mt-1 mb-1.5">
                  Required for real VoIP calls (mic/speaker). Get this from{" "}
                  <a href="https://product.frejun.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    FreJun → Settings → Developer → Generate Access Token
                  </a>.
                </p>
                <div className="flex items-center gap-1.5">
                  <input
                    type={showOAuth ? "text" : "password"}
                    value={editOAuthToken}
                    onChange={(e) => setEditOAuthToken(e.target.value)}
                    placeholder="ya29.A0ARrdaM..." 
                    className={`flex-1 h-9 px-3 rounded-md border text-sm font-mono focus:outline-none focus:ring-2 ${
                      dialerMode === "real" && !editOAuthToken
                        ? "border-[#EA4335] focus:ring-[#EA4335]/20 bg-red-50"
                        : "border-zinc-200 focus:ring-zinc-900/10"
                    }`}
                  />
                  <button
                    onClick={() => setShowOAuth(o => !o)}
                    className="size-9 grid place-items-center rounded-md border border-zinc-200 hover:bg-zinc-50 text-zinc-500 shrink-0"
                    title={showOAuth ? "Hide token" : "Show token"}
                  >
                    {showOAuth ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {editOAuthToken && (
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono truncate">
                    {showOAuth ? editOAuthToken : `${editOAuthToken.slice(0, 12)}${"•".repeat(Math.max(0, editOAuthToken.length - 12))}`}
                  </p>
                )}
                {dialerMode === "real" && !editOAuthToken && (
                  <p className="text-[10px] text-[#EA4335] mt-1 font-medium">⚠️ Real calls won't work without this token.</p>
                )}
              </div>

              {/* How it works — only in real mode */}
              {dialerMode === "real" && (
                <div className="p-3 bg-blue-50 ring-1 ring-blue-200 rounded-md">
                  <p className="text-[11px] font-semibold text-blue-900 mb-1">How network calling works:</p>
                  <ol className="text-[10px] text-blue-800 space-y-0.5 list-decimal list-inside">
                    <li>Click Call on any lead</li>
                    <li>FreJun calls <strong>your phone</strong> first</li>
                    <li>Answer → FreJun bridges to the lead</li>
                    <li>Both parties connected</li>
                  </ol>
                  <p className="text-[10px] text-blue-700 mt-1.5 pt-1 border-t border-blue-200">
                    Also set your phone in FreJun → Settings → Calling & SMS → "Connected to".
                  </p>
                </div>
              )}

              {/* Save */}
              <button
                onClick={() => {
                  const email = editEmail.trim();
                  const apiKey = editApiKey.trim();
                  const oauthToken = editOAuthToken.trim();
                  // Persist to localStorage
                  if (apiKey) setFrejunApiKey(apiKey);
                  if (oauthToken) setFrejunOAuthToken(oauthToken);
                  if (email) {
                    setFrejunUserEmail(email);
                    if (onUpdateEmail) onUpdateEmail(email);
                  }
                  const saved = [];
                  if (email) saved.push(`Email: ${email}`);
                  if (apiKey) saved.push(`API Key: ${apiKey.slice(0, 8)}…`);
                  if (oauthToken) saved.push(`OAuth Token: ${oauthToken.slice(0, 12)}…`);
                  if (saved.length) {
                    toast.success("FreJun settings saved", { description: saved.join(" · ") });
                  }
                  setSettingsOpen(false);
                }}
                className="w-full h-10 rounded-md bg-zinc-900 text-white text-sm font-semibold hover:bg-zinc-800"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={openSettings}
          title="Dialer settings"
          aria-label="Dialer settings"
          className="inline-flex items-center justify-center size-9 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors shrink-0"
        >
          <Settings className="size-4" />
        </button>
        <button
          onClick={() => setPadOpen(true)}
          title="Open dialer"
          aria-label="Open dialer"
          className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-[#34A853] text-white text-sm font-medium hover:bg-[#2c8f46] transition-colors shrink-0"
        >
          <PhoneCall className="size-4" />
          <span className="hidden md:inline">Dialer</span>
          {dialerMode === "real" && (
            <span className="ml-0.5 px-1 py-0.5 text-[8px] font-bold bg-white/20 rounded">LIVE</span>
          )}
        </button>
      </div>

      {/* Portal modals to document.body to escape header's backdrop-filter containing block */}
      {typeof document !== "undefined" && createPortal(modals, document.body)}
    </>
  );
}
