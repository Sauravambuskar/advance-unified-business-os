import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// ------------ Types ------------
export type QuotationStatus = "Draft" | "Sent" | "Awaiting Approval" | "Approved";
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";
export type TaskStatus = "Pending" | "In Progress" | "On Track" | "Blocked";

export type Quotation = { id: string; client: string; amount: string; status: QuotationStatus; date: string };
export type Invoice = { id: string; client: string; amount: string; status: InvoiceStatus; due: string };
export type ExtraTask = { name: string; owner: string; due: string; status: TaskStatus };
export type ExtraLead = {
  name: string; time: string; email: string; phone: string; camp: string; message: string;
  initials: string; tone: string; stage: string; stageTone: string;
};
export type CompanySettings = { timezone: string; currency: string };
export type AutomationItem = { name: string; trigger: string; status: "Active" | "Paused" };

export const QUOTE_TONE: Record<QuotationStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  Sent: "bg-blue-50 text-blue-700 ring-blue-200",
  "Awaiting Approval": "bg-amber-50 text-amber-700 ring-amber-200",
  Approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};
export const INV_TONE: Record<InvoiceStatus, string> = {
  Draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  Sent: "bg-blue-50 text-blue-700 ring-blue-200",
  Paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Overdue: "bg-rose-50 text-rose-700 ring-rose-200",
};
export const TASK_TONE: Record<TaskStatus, string> = {
  Pending: "bg-[#5F6368] text-white ring-[#5F6368]/30",
  "In Progress": "bg-[#FBBC05] text-white ring-[#FBBC05]/30",
  "On Track": "bg-[#34A853] text-white ring-[#34A853]/30",
  Blocked: "bg-[#EA4335] text-white ring-[#EA4335]/30",
};

const nextIn = <T,>(arr: readonly T[], cur: T): T => {
  const i = arr.indexOf(cur);
  return arr[(i + 1) % arr.length];
};
export const nextQuoteStatus = (s: QuotationStatus) =>
  nextIn(["Draft", "Sent", "Awaiting Approval", "Approved"] as const, s);
export const nextInvoiceStatus = (s: InvoiceStatus) =>
  nextIn(["Draft", "Sent", "Paid", "Overdue"] as const, s);
export const nextTaskStatus = (s: TaskStatus) =>
  nextIn(["Pending", "In Progress", "On Track", "Blocked"] as const, s);

// ------------ Initial data ------------
const INIT_QUOTES: Quotation[] = [
  { id: "Q-2048", client: "Nordic Ltd.", amount: "₹23.6 L", status: "Approved", date: "Jul 02" },
  { id: "Q-2049", client: "Harbor Group", amount: "₹12.4 L", status: "Sent", date: "Jul 03" },
  { id: "Q-2050", client: "Peak Retail", amount: "₹6.81 L", status: "Draft", date: "Jul 04" },
  { id: "Q-2051", client: "Meridian HQ", amount: "₹35.4 L", status: "Awaiting Approval", date: "Jul 05" },
];
const INIT_INVOICES: Invoice[] = [
  { id: "INV-2048", client: "Nordic Ltd.", amount: "₹23.6 L", status: "Paid", due: "Jun 28" },
  { id: "INV-2049", client: "Harbor Group", amount: "₹12.4 L", status: "Overdue", due: "Jun 30" },
  { id: "INV-2050", client: "Peak Retail", amount: "₹6.81 L", status: "Sent", due: "Jul 12" },
  { id: "INV-2051", client: "Meridian HQ", amount: "₹35.4 L", status: "Draft", due: "Jul 15" },
];
const INIT_AUTOMATIONS: AutomationItem[] = [
  { name: "Auto-assign leads by source", trigger: "New lead", status: "Active" },
  { name: "Send invoice reminder at T+3", trigger: "Invoice overdue", status: "Active" },
  { name: "Escalate approvals > ₹8.3 L", trigger: "Quotation submitted", status: "Active" },
  { name: "Weekly executive digest", trigger: "Monday 08:00", status: "Paused" },
];

// ------------ Context ------------
type Store = {
  // global search
  search: string;
  setSearch: (v: string) => void;

  // quotations
  quotations: Quotation[];
  addQuotation: (q: Omit<Quotation, "id">) => void;
  deleteQuotation: (id: string) => void;
  cycleQuotation: (id: string) => void;

  // invoices
  invoices: Invoice[];
  addInvoice: (i: Omit<Invoice, "id">) => void;
  deleteInvoice: (id: string) => void;
  cycleInvoice: (id: string) => void;

  // tasks per company
  extraTasks: Record<string, ExtraTask[]>;
  taskStatusOverrides: Record<string, Record<string, TaskStatus>>;
  addTask: (companyKey: string, t: ExtraTask) => void;
  setTaskStatus: (companyKey: string, taskName: string, status: TaskStatus) => void;

  // extra leads per company
  extraLeads: Record<string, ExtraLead[]>;
  addLead: (companyKey: string, l: ExtraLead) => void;

  // automations
  automations: AutomationItem[];
  toggleAutomation: (name: string) => void;

  // settings per company
  settings: Record<string, CompanySettings>;
  updateSettings: (companyKey: string, patch: Partial<CompanySettings>) => void;

  // notifications read state
  unreadCount: number;
  bumpUnread: (n?: number) => void;
  markAllRead: () => void;
};

const StoreCtx = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [search, setSearch] = useState("");
  const [quotations, setQuotations] = useState<Quotation[]>(INIT_QUOTES);
  const [invoices, setInvoices] = useState<Invoice[]>(INIT_INVOICES);
  const [extraTasks, setExtraTasks] = useState<Record<string, ExtraTask[]>>({});
  const [taskStatusOverrides, setTaskStatusOverrides] = useState<Record<string, Record<string, TaskStatus>>>({});
  const [extraLeads, setExtraLeads] = useState<Record<string, ExtraLead[]>>({});
  const [automations, setAutomations] = useState<AutomationItem[]>(INIT_AUTOMATIONS);
  const [settings, setSettings] = useState<Record<string, CompanySettings>>({});
  const [unreadCount, setUnreadCount] = useState(3);

  const value = useMemo<Store>(
    () => ({
      search, setSearch,
      quotations,
      addQuotation: (q) =>
        setQuotations((prev) => [
          { ...q, id: `Q-${2100 + prev.length}` },
          ...prev,
        ]),
      deleteQuotation: (id) => setQuotations((prev) => prev.filter((q) => q.id !== id)),
      cycleQuotation: (id) =>
        setQuotations((prev) => prev.map((q) => (q.id === id ? { ...q, status: nextQuoteStatus(q.status) } : q))),

      invoices,
      addInvoice: (i) =>
        setInvoices((prev) => [
          { ...i, id: `INV-${2100 + prev.length}` },
          ...prev,
        ]),
      deleteInvoice: (id) => setInvoices((prev) => prev.filter((i) => i.id !== id)),
      cycleInvoice: (id) =>
        setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: nextInvoiceStatus(i.status) } : i))),

      extraTasks,
      taskStatusOverrides,
      addTask: (k, t) =>
        setExtraTasks((prev) => ({ ...prev, [k]: [t, ...(prev[k] ?? [])] })),
      setTaskStatus: (k, name, status) =>
        setTaskStatusOverrides((prev) => ({
          ...prev,
          [k]: { ...(prev[k] ?? {}), [name]: status },
        })),

      extraLeads,
      addLead: (k, l) =>
        setExtraLeads((prev) => ({ ...prev, [k]: [l, ...(prev[k] ?? [])] })),

      automations,
      toggleAutomation: (name) =>
        setAutomations((prev) =>
          prev.map((a) => (a.name === name ? { ...a, status: a.status === "Active" ? "Paused" : "Active" } : a)),
        ),

      settings,
      updateSettings: (k, patch) =>
        setSettings((prev) => {
          const base: CompanySettings = { timezone: "Asia/Kolkata", currency: "INR" };
          return { ...prev, [k]: { ...base, ...(prev[k] ?? {}), ...patch } };
        }),

      unreadCount,
      bumpUnread: (n = 1) => setUnreadCount((c) => c + n),
      markAllRead: () => setUnreadCount(0),
    }),
    [search, quotations, invoices, extraTasks, taskStatusOverrides, extraLeads, automations, settings, unreadCount],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useAppStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error("useAppStore must be inside AppStoreProvider");
  return s;
}

// ------------ CSV export ------------
export function downloadCSV(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) {
    const blob = new Blob([""], { type: "text/csv" });
    triggerDownload(filename, blob);
    return;
  }
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
  triggerDownload(filename, new Blob([csv], { type: "text/csv;charset=utf-8" }));
}
function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------ Simple Modal ------------
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-zinc-950/50 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
          <p className="text-sm font-semibold">{title}</p>
          <button onClick={onClose} className="size-8 grid place-items-center rounded hover:bg-zinc-100 text-zinc-500" aria-label="Close">✕</button>
        </div>
        <div className="p-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}
