import { useState } from "react";
import { createPortal } from "react-dom";
import { Phone, PhoneCall, Delete, X, UserPlus, Users as UsersIcon } from "lucide-react";
import { CallDialog } from "@/components/call-dialog";
import { useAppStore, type CallDisposition } from "@/lib/app-store";
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
}: {
  companyKey: string;
  companyName: string;
}) {
  const store = useAppStore();
  const [padOpen, setPadOpen] = useState(false);
  const [number, setNumber] = useState("");
  const [callOpen, setCallOpen] = useState(false);
  const [savePromptOpen, setSavePromptOpen] = useState(false);
  const [pendingNumber, setPendingNumber] = useState("");
  const [saveKind, setSaveKind] = useState<SaveKind>("Lead");
  const [saveName, setSaveName] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [lastDisposition, setLastDisposition] = useState("");

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

  const handleDisposition = (disposition: string, note: string, duration: number) => {
    const leadKey = `dialer::${pendingNumber}`;
    setLastDisposition(disposition);

    // Update call log with disposition
    const lastLog = store.callLogs.find((c) => c.leadKey === leadKey);
    if (lastLog) {
      store.updateCallDisposition(leadKey, lastLog.at, disposition as CallDisposition, note);
    }

    // Run call automations
    const enabledRules = store.callRules.filter((r) => r.enabled);

    enabledRules.forEach((rule) => {
      if (rule.trigger === "after_call") {
        if (rule.action === "create_task") {
          store.addTask(companyKey, {
            name: `Follow up: ${pendingNumber}`,
            owner: "You",
            due: "Tomorrow",
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
      if (rule.trigger === "no_answer" && disposition === "No Answer") {
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
          toast.success("Callback scheduled", { description: `${pendingNumber} in ${delayHrs}h` });
        }
      }
    });

    // Auto-schedule callback if disposition is "Callback Scheduled"
    if (disposition === "Callback Scheduled") {
      store.scheduleCallback({
        leadKey,
        name: `Unknown · ${pendingNumber}`,
        phone: pendingNumber,
        company: companyName,
        scheduledAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        note: note || "Callback requested",
      });
      toast.success("Callback scheduled for tomorrow");
    }

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
    </>
  );

  return (
    <>
      <button
        onClick={() => setPadOpen(true)}
        title="Open dialer"
        aria-label="Open dialer"
        className="inline-flex items-center gap-1.5 h-9 px-2.5 sm:px-3 rounded-lg bg-[#34A853] text-white text-sm font-medium hover:bg-[#2c8f46] transition-colors shrink-0"
      >
        <PhoneCall className="size-4" />
        <span className="hidden md:inline">Dialer</span>
      </button>

      {/* Portal modals to document.body to escape header's backdrop-filter containing block */}
      {typeof document !== "undefined" && createPortal(modals, document.body)}
    </>
  );
}
