import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  LayoutDashboard,
  Inbox,
  Users,
  Target,
  TrendingUp,
  FileText,
  Receipt,
  UserCircle,
  CheckSquare,
  FolderKanban,
  FolderOpen,
  Bell,
  BarChart3,
  ShieldCheck,
  GraduationCap,
  Building2,
  Wrench,
  Search,
  Plus,
  ChevronDown,
  ArrowUpRight,
  MoreHorizontal,
  Download,
  Settings,
  Check,
  Zap,
  Activity,
  DollarSign,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

// ------------------------------------------------------------------
// Companies (multi-company management). Switching this drives all data.
// ------------------------------------------------------------------
type CompanyKey = "group" | "education" | "realestate" | "facility";

const companies: Record<
  CompanyKey,
  {
    name: string;
    kind: string;
    initials: string;
    tone: string;
    kpis: { label: string; value: string; delta: string; deltaTone: string; icon: any }[];
    leads: {
      name: string;
      time: string;
      email: string;
      phone: string;
      camp: string;
      message: string;
      initials: string;
      tone: string;
      stage: string;
      stageTone: string;
    }[];
    pipeline: { stage: string; count: number; value: string }[];
    chart: { m: string; v: number; active?: boolean }[];
    activity: { title: string; body: string; time: string; tone: string }[];
    tasks: { name: string; owner: string; due: string; status: string; statusTone: string }[];
    industry: { label: string; meta: string; icon: any }[];
  }
> = {
  group: {
    name: "Advance Group Holdings",
    kind: "Executive · All Companies",
    initials: "AG",
    tone: "from-zinc-800 to-zinc-600",
    kpis: [
      { label: "Consolidated Revenue", value: "$4.82M", delta: "+14.2%", deltaTone: "text-emerald-600", icon: DollarSign },
      { label: "Active Leads", value: "2,148", delta: "+312", deltaTone: "text-emerald-600", icon: Target },
      { label: "Open Invoices", value: "$684K", delta: "-6.1%", deltaTone: "text-emerald-600", icon: Receipt },
      { label: "Team Utilization", value: "87%", delta: "+3.4%", deltaTone: "text-emerald-600", icon: Activity },
    ],
    leads: [
      { name: "Shawon Black", time: "Today at 9:10 AM", email: "shawon@mailzone.io", phone: "(234) 555-0108", camp: "AG-56728", message: "Group-wide inquiry — interested in enterprise plan.", initials: "SB", tone: "bg-orange-100 text-orange-700", stage: "New", stageTone: "bg-blue-50 text-blue-700 ring-blue-200" },
      { name: "Kamrul Miles", time: "Today at 9:10 AM", email: "miles87@fastmail.net", phone: "(234) 555-0109", camp: "AG-12131", message: "Requesting proposal across three business units.", initials: "KM", tone: "bg-emerald-100 text-emerald-700", stage: "Qualified", stageTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Su Flores", time: "Today at 8:10 AM", email: "su.m@quickinbox.org", phone: "(234) 555-0110", camp: "AG-15167", message: "Follow-up on quotation Q-2048.", initials: "SF", tone: "bg-indigo-100 text-indigo-700", stage: "Proposal", stageTone: "bg-violet-50 text-violet-700 ring-violet-200" },
      { name: "Ma Pena", time: "Today at 7:30 AM", email: "ma.p@inboxmail.com", phone: "(234) 555-0111", camp: "AG-81922", message: "Contract renewal discussion scheduled.", initials: "MP", tone: "bg-rose-100 text-rose-700", stage: "Won", stageTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    ],
    pipeline: [
      { stage: "New", count: 84, value: "$412K" },
      { stage: "Qualified", count: 46, value: "$1.02M" },
      { stage: "Proposal", count: 22, value: "$1.48M" },
      { stage: "Negotiation", count: 11, value: "$860K" },
      { stage: "Won", count: 18, value: "$1.06M" },
    ],
    chart: [
      { m: "JAN", v: 0.42 }, { m: "FEB", v: 0.58 }, { m: "MAR", v: 0.36 }, { m: "APR", v: 0.48 },
      { m: "MAY", v: 0.55 }, { m: "JUN", v: 0.62 }, { m: "JUL", v: 0.92, active: true },
      { m: "AUG", v: 0.5 }, { m: "SEP", v: 0.7 }, { m: "OCT", v: 0.44 }, { m: "NOV", v: 0.6 }, { m: "DEC", v: 0.38 },
    ],
    activity: [
      { title: "New candidate added", body: "Alex Johnson entered Sales pipeline.", time: "2m", tone: "bg-amber-400" },
      { title: "Invoice #INV-2048 paid", body: "Payment of $28,400 received from Nordic Ltd.", time: "18m", tone: "bg-emerald-500" },
      { title: "Approval requested", body: "Q3 discount waiver awaiting Company Admin.", time: "1h", tone: "bg-rose-500" },
      { title: "Audit log entry", body: "Role change: Sarah Kim → Manager.", time: "3h", tone: "bg-zinc-400" },
    ],
    tasks: [
      { name: "Prepare Q3 board deck", owner: "You", due: "Today", status: "In Progress", statusTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Review consolidated P&L", owner: "Finance", due: "Tomorrow", status: "Pending", statusTone: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
      { name: "Approve new vendor contracts", owner: "Ops", due: "Fri", status: "Blocked", statusTone: "bg-rose-50 text-rose-700 ring-rose-200" },
    ],
    industry: [
      { label: "Real Estate", meta: "8 projects · 124 bookings", icon: Building2 },
      { label: "Education", meta: "1,240 students · 94% retention", icon: GraduationCap },
      { label: "Facility Mgmt", meta: "14 sites · 42 service ops", icon: Wrench },
    ],
  },
  education: {
    name: "Advance Academy",
    kind: "Education · Admissions & Fees",
    initials: "AA",
    tone: "from-indigo-600 to-blue-500",
    kpis: [
      { label: "Admissions (Term)", value: "1,240", delta: "+18.6%", deltaTone: "text-emerald-600", icon: GraduationCap },
      { label: "Active Students", value: "3,842", delta: "+4.1%", deltaTone: "text-emerald-600", icon: Users },
      { label: "Fees Collected", value: "$612K", delta: "+9.2%", deltaTone: "text-emerald-600", icon: DollarSign },
      { label: "Fees Overdue", value: "$48K", delta: "-12%", deltaTone: "text-emerald-600", icon: Clock },
    ],
    leads: [
      { name: "Priya Naidu", time: "Today at 10:05 AM", email: "priya.n@parent.io", phone: "(234) 555-0210", camp: "ADM-9820", message: "Enquiry for Grade 6 mid-term admission.", initials: "PN", tone: "bg-indigo-100 text-indigo-700", stage: "New", stageTone: "bg-blue-50 text-blue-700 ring-blue-200" },
      { name: "Daniel Owens", time: "Today at 9:22 AM", email: "d.owens@family.co", phone: "(234) 555-0211", camp: "ADM-9821", message: "Requested campus tour on Saturday.", initials: "DO", tone: "bg-emerald-100 text-emerald-700", stage: "Tour Booked", stageTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Aisha Rahman", time: "Today at 8:40 AM", email: "aisha.r@mail.net", phone: "(234) 555-0212", camp: "ADM-9822", message: "Scholarship eligibility follow-up.", initials: "AR", tone: "bg-rose-100 text-rose-700", stage: "Proposal", stageTone: "bg-violet-50 text-violet-700 ring-violet-200" },
      { name: "Marco Silva", time: "Yesterday", email: "marco.s@inbox.com", phone: "(234) 555-0213", camp: "ADM-9823", message: "Fee plan accepted — enrollment confirmed.", initials: "MS", tone: "bg-orange-100 text-orange-700", stage: "Enrolled", stageTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    ],
    pipeline: [
      { stage: "Enquiry", count: 128, value: "—" },
      { stage: "Tour Booked", count: 64, value: "—" },
      { stage: "Application", count: 38, value: "—" },
      { stage: "Offer Sent", count: 22, value: "—" },
      { stage: "Enrolled", count: 41, value: "$412K" },
    ],
    chart: [
      { m: "JAN", v: 0.32 }, { m: "FEB", v: 0.48 }, { m: "MAR", v: 0.66 }, { m: "APR", v: 0.55 },
      { m: "MAY", v: 0.72 }, { m: "JUN", v: 0.88, active: true }, { m: "JUL", v: 0.6 },
      { m: "AUG", v: 0.42 }, { m: "SEP", v: 0.7 }, { m: "OCT", v: 0.5 }, { m: "NOV", v: 0.58 }, { m: "DEC", v: 0.36 },
    ],
    activity: [
      { title: "New admission enquiry", body: "Priya Naidu — Grade 6, mid-term.", time: "5m", tone: "bg-indigo-500" },
      { title: "Fee payment received", body: "Marco Silva — Term 2 · $2,400.", time: "22m", tone: "bg-emerald-500" },
      { title: "Overdue reminder sent", body: "12 parents notified automatically.", time: "1h", tone: "bg-amber-500" },
      { title: "Class capacity alert", body: "Grade 9-B has 2 seats remaining.", time: "2h", tone: "bg-rose-500" },
    ],
    tasks: [
      { name: "Publish Term 3 fee structure", owner: "Registrar", due: "Today", status: "In Progress", statusTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Review scholarship applications", owner: "Admissions", due: "Tomorrow", status: "Pending", statusTone: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
      { name: "Send offer letters (Batch 4)", owner: "You", due: "Fri", status: "On Track", statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    ],
    industry: [
      { label: "Admissions", meta: "128 open enquiries", icon: GraduationCap },
      { label: "Student Management", meta: "3,842 records", icon: Users },
      { label: "Fee Management", meta: "$48K overdue", icon: DollarSign },
    ],
  },
  realestate: {
    name: "Advance Realty",
    kind: "Real Estate · Projects & Bookings",
    initials: "AR",
    tone: "from-amber-600 to-orange-500",
    kpis: [
      { label: "Active Projects", value: "8", delta: "+2 this qtr", deltaTone: "text-emerald-600", icon: Building2 },
      { label: "Units Available", value: "312", delta: "-24", deltaTone: "text-emerald-600", icon: LayoutDashboard },
      { label: "Bookings (MTD)", value: "48", delta: "+22%", deltaTone: "text-emerald-600", icon: CheckSquare },
      { label: "Site Visits Booked", value: "94", delta: "+11", deltaTone: "text-emerald-600", icon: Target },
    ],
    leads: [
      { name: "Rahim Ahmed", time: "Today at 9:44 AM", email: "rahim.a@buyer.io", phone: "(234) 555-0310", camp: "PRJ-Skyline", message: "Interested in 3BHK, tower B, sea-facing.", initials: "RA", tone: "bg-orange-100 text-orange-700", stage: "Site Visit", stageTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Elena Costa", time: "Today at 9:02 AM", email: "elena.c@mail.co", phone: "(234) 555-0311", camp: "PRJ-Greens", message: "Booking amount transferred — awaiting agreement.", initials: "EC", tone: "bg-emerald-100 text-emerald-700", stage: "Booked", stageTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
      { name: "Yuki Tanaka", time: "Today at 8:15 AM", email: "yuki.t@inbox.jp", phone: "(234) 555-0312", camp: "PRJ-Skyline", message: "Requesting revised floor plan for Unit 12-C.", initials: "YT", tone: "bg-indigo-100 text-indigo-700", stage: "Negotiation", stageTone: "bg-violet-50 text-violet-700 ring-violet-200" },
      { name: "Omar Farouk", time: "Yesterday", email: "omar.f@fastmail.net", phone: "(234) 555-0313", camp: "PRJ-Palms", message: "New enquiry from Facebook campaign.", initials: "OF", tone: "bg-rose-100 text-rose-700", stage: "New", stageTone: "bg-blue-50 text-blue-700 ring-blue-200" },
    ],
    pipeline: [
      { stage: "New", count: 62, value: "$4.8M" },
      { stage: "Site Visit", count: 34, value: "$3.1M" },
      { stage: "Negotiation", count: 18, value: "$2.4M" },
      { stage: "Booked", count: 24, value: "$3.6M" },
      { stage: "Registered", count: 12, value: "$1.9M" },
    ],
    chart: [
      { m: "JAN", v: 0.48 }, { m: "FEB", v: 0.62 }, { m: "MAR", v: 0.72 }, { m: "APR", v: 0.55 },
      { m: "MAY", v: 0.68 }, { m: "JUN", v: 0.82 }, { m: "JUL", v: 0.94, active: true },
      { m: "AUG", v: 0.66 }, { m: "SEP", v: 0.58 }, { m: "OCT", v: 0.42 }, { m: "NOV", v: 0.52 }, { m: "DEC", v: 0.44 },
    ],
    activity: [
      { title: "Booking confirmed", body: "Elena Costa — Unit A-1203, Skyline.", time: "4m", tone: "bg-emerald-500" },
      { title: "Site visit scheduled", body: "Rahim Ahmed — Saturday 11:00 AM.", time: "25m", tone: "bg-amber-500" },
      { title: "Price approval pending", body: "Discount request on Unit B-704.", time: "1h", tone: "bg-rose-500" },
      { title: "Inventory synced", body: "Skyline · 12 units marked sold.", time: "2h", tone: "bg-zinc-400" },
    ],
    tasks: [
      { name: "Finalize Palms brochure", owner: "Marketing", due: "Today", status: "In Progress", statusTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Verify Tower B unit inventory", owner: "Ops", due: "Tomorrow", status: "On Track", statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
      { name: "Draft Greens booking agreement", owner: "Legal", due: "Fri", status: "Pending", statusTone: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
    ],
    industry: [
      { label: "Projects", meta: "8 active launches", icon: Building2 },
      { label: "Property Inventory", meta: "312 units available", icon: LayoutDashboard },
      { label: "Bookings & Site Visits", meta: "48 bookings · 94 visits", icon: CheckSquare },
    ],
  },
  facility: {
    name: "Advance Facilities",
    kind: "Facility Management · Service Ops",
    initials: "AF",
    tone: "from-emerald-600 to-teal-500",
    kpis: [
      { label: "Sites Managed", value: "14", delta: "+1", deltaTone: "text-emerald-600", icon: Wrench },
      { label: "Open Service Ops", value: "42", delta: "-8", deltaTone: "text-emerald-600", icon: Activity },
      { label: "SLA Compliance", value: "96.4%", delta: "+1.8%", deltaTone: "text-emerald-600", icon: ShieldCheck },
      { label: "Active Clients", value: "68", delta: "+3", deltaTone: "text-emerald-600", icon: Users },
    ],
    leads: [
      { name: "Nordic Ltd.", time: "Today at 9:30 AM", email: "ops@nordic.co", phone: "(234) 555-0410", camp: "SVC-Retail", message: "Extension request — 6 additional retail sites.", initials: "NL", tone: "bg-emerald-100 text-emerald-700", stage: "Proposal", stageTone: "bg-violet-50 text-violet-700 ring-violet-200" },
      { name: "Harbor Group", time: "Today at 9:08 AM", email: "pm@harbor.io", phone: "(234) 555-0411", camp: "SVC-HVAC", message: "HVAC AMC renewal for 4 towers.", initials: "HG", tone: "bg-indigo-100 text-indigo-700", stage: "Negotiation", stageTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Peak Retail", time: "Today at 8:52 AM", email: "facilities@peak.com", phone: "(234) 555-0412", camp: "SVC-Cleaning", message: "New enquiry from referral.", initials: "PR", tone: "bg-orange-100 text-orange-700", stage: "New", stageTone: "bg-blue-50 text-blue-700 ring-blue-200" },
      { name: "Meridian HQ", time: "Yesterday", email: "admin@meridian.io", phone: "(234) 555-0413", camp: "SVC-Security", message: "Contract signed — onboarding this week.", initials: "MH", tone: "bg-rose-100 text-rose-700", stage: "Won", stageTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    ],
    pipeline: [
      { stage: "New", count: 22, value: "$180K" },
      { stage: "Qualified", count: 14, value: "$240K" },
      { stage: "Proposal", count: 9, value: "$320K" },
      { stage: "Negotiation", count: 6, value: "$210K" },
      { stage: "Won", count: 11, value: "$412K" },
    ],
    chart: [
      { m: "JAN", v: 0.52 }, { m: "FEB", v: 0.62 }, { m: "MAR", v: 0.58 }, { m: "APR", v: 0.68 },
      { m: "MAY", v: 0.72 }, { m: "JUN", v: 0.66 }, { m: "JUL", v: 0.86, active: true },
      { m: "AUG", v: 0.72 }, { m: "SEP", v: 0.6 }, { m: "OCT", v: 0.48 }, { m: "NOV", v: 0.54 }, { m: "DEC", v: 0.42 },
    ],
    activity: [
      { title: "Ticket closed within SLA", body: "Harbor Group · HVAC alert.", time: "8m", tone: "bg-emerald-500" },
      { title: "New client onboarded", body: "Meridian HQ — 2 sites active.", time: "32m", tone: "bg-indigo-500" },
      { title: "Preventive maintenance due", body: "Peak Retail · monthly inspection.", time: "1h", tone: "bg-amber-500" },
      { title: "Audit log entry", body: "Vendor permission updated by Admin.", time: "3h", tone: "bg-zinc-400" },
    ],
    tasks: [
      { name: "Renew Harbor AMC", owner: "Accounts", due: "Today", status: "In Progress", statusTone: "bg-amber-50 text-amber-700 ring-amber-200" },
      { name: "Deploy Meridian access badges", owner: "Ops", due: "Tomorrow", status: "On Track", statusTone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
      { name: "Review vendor SLAs", owner: "You", due: "Fri", status: "Pending", statusTone: "bg-zinc-100 text-zinc-700 ring-zinc-200" },
    ],
    industry: [
      { label: "Client Management", meta: "68 active clients", icon: Users },
      { label: "Service Operations", meta: "42 open · 96.4% SLA", icon: Activity },
      { label: "Preventive Maintenance", meta: "18 scheduled this week", icon: Wrench },
    ],
  },
};

const coreNav = [
  { icon: LayoutDashboard, label: "Executive Dashboard" },
  { icon: Users, label: "CRM" },
  { icon: Target, label: "Lead Management", badge: "128" },
  { icon: TrendingUp, label: "Sales Pipeline" },
  { icon: FileText, label: "Quotations" },
  { icon: Receipt, label: "Invoicing" },
  { icon: UserCircle, label: "Customer Portal" },
  { icon: CheckSquare, label: "Task Management" },
  { icon: FolderKanban, label: "Project Management" },
  { icon: FolderOpen, label: "Document Management" },
  { icon: Bell, label: "Notifications", badge: "9+" },
  { icon: BarChart3, label: "Analytics & Reporting" },
];


const industryNav: Record<CompanyKey, { icon: any; label: string }[]> = {
  group: [
    { icon: GraduationCap, label: "Education Suite" },
    { icon: Building2, label: "Real Estate Suite" },
    { icon: Wrench, label: "Facility Suite" },
  ],
  education: [
    { icon: GraduationCap, label: "Admissions" },
    { icon: Users, label: "Student Management" },
    { icon: DollarSign, label: "Fee Management" },
  ],
  realestate: [
    { icon: Building2, label: "Projects" },
    { icon: LayoutDashboard, label: "Property Inventory" },
    { icon: CheckSquare, label: "Bookings" },
    { icon: Target, label: "Site Visits" },
  ],
  facility: [
    { icon: Users, label: "Client Management" },
    { icon: Activity, label: "Service Operations" },
    { icon: Wrench, label: "Preventive Maintenance" },
  ],
};

const systemNav = [
  { icon: ShieldCheck, label: "Roles & Permissions" },
  { icon: Zap, label: "Automations" },
  { icon: Settings, label: "Settings" },
];

function Dashboard() {
  const [companyKey, setCompanyKey] = useState<CompanyKey>("group");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const company = companies[companyKey];
  const industry = industryNav[companyKey];

  const totalPipeline = useMemo(
    () => company.pipeline.reduce((a, s) => a + s.count, 0),
    [company],
  );

  return (
    <div className="flex h-screen bg-[#f9f9f8] text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-zinc-950/5 bg-white">
        <div className="h-16 px-5 flex items-center gap-2 border-b border-zinc-950/5">
          <div className="size-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 grid place-items-center text-white text-xs font-bold">
            AB
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold tracking-tight leading-none">Advance Suite</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Business OS</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          <SectionLabel>Core Modules</SectionLabel>
          {coreNav.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}

          <SectionLabel>{companyKey === "group" ? "Industry Suites" : "Industry Module"}</SectionLabel>
          {industry.map((item) => (
            <NavItem key={item.label} icon={item.icon} label={item.label} />
          ))}

          <SectionLabel>System</SectionLabel>
          {systemNav.map((item) => (
            <NavItem key={item.label} {...item} />
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-950/5">
          <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-50 transition-colors">
            <div className="size-8 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-600 grid place-items-center text-white text-[11px] font-semibold shrink-0">
              ST
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold truncate">Sohan Talukder</p>
              <p className="text-[10px] text-zinc-500">Super Admin</p>
            </div>
            <MoreHorizontal className="size-4 text-zinc-400 shrink-0" />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-zinc-950/5 bg-white/70 backdrop-blur flex items-center justify-between px-6 gap-4 relative z-30">
          {/* Company switcher */}
          <div className="relative">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className="flex items-center gap-3 pl-1.5 pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors"
            >
              <div
                className={`size-8 rounded-md bg-gradient-to-br ${company.tone} grid place-items-center text-white text-[11px] font-bold shrink-0`}
              >
                {company.initials}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-semibold leading-none">{company.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1">{company.kind}</p>
              </div>
              <ChevronDown className="size-4 text-zinc-400 ml-1" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 p-2 z-20">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-3 py-2">
                    Switch Company
                  </p>
                  {(Object.keys(companies) as CompanyKey[]).map((k) => {
                    const c = companies[k];
                    const selected = k === companyKey;
                    return (
                      <button
                        key={k}
                        onClick={() => {
                          setCompanyKey(k);
                          setSwitcherOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors ${
                          selected ? "bg-zinc-50" : "hover:bg-zinc-50"
                        }`}
                      >
                        <div
                          className={`size-9 rounded-md bg-gradient-to-br ${c.tone} grid place-items-center text-white text-xs font-bold shrink-0`}
                        >
                          {c.initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{c.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{c.kind}</p>
                        </div>
                        {selected && <Check className="size-4 text-emerald-600 shrink-0" />}
                      </button>
                    );
                  })}
                  <div className="border-t border-zinc-100 mt-1 pt-1">
                    <button className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 text-left text-sm">
                      <div className="size-9 rounded-md bg-zinc-100 grid place-items-center shrink-0">
                        <Plus className="size-4 text-zinc-600" />
                      </div>
                      <span className="font-medium text-zinc-700">Add new company</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={`Search ${company.name}…`}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex items-center gap-1.5 text-sm text-zinc-600 font-medium px-3 py-2 rounded-lg hover:bg-zinc-50">
              English <ChevronDown className="size-3.5" />
            </button>
            <button className="relative size-9 rounded-lg border border-zinc-200 grid place-items-center hover:bg-zinc-50">
              <Bell className="size-4 text-zinc-700" />
              <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-rose-500" />
            </button>
            <button className="flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-4" /> Add person
            </button>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 lg:p-8 space-y-6">
            {/* Greeting + context */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                  {company.kind}
                </p>
                <h1 className="text-2xl font-bold tracking-tight mt-1">
                  Good evening, Sohan — {company.name}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">
                  Executive overview · role-based access · audit-logged
                </p>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50">
                  <Download className="size-3.5" /> Export report
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
                  <Zap className="size-3.5" /> New automation
                </button>
              </div>
            </div>

            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {company.kpis.map((k) => (
                <div
                  key={k.label}
                  className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5"
                >
                  <div className="flex items-start justify-between">
                    <p className="text-xs text-zinc-500 font-medium">{k.label}</p>
                    <div className="size-8 rounded-lg bg-zinc-50 grid place-items-center">
                      <k.icon className="size-4 text-zinc-700" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-3">
                    <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                    <span className={`text-xs font-semibold ${k.deltaTone}`}>{k.delta}</span>
                  </div>
                </div>
              ))}
            </section>

            {/* Main grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Left */}
              <div className="col-span-12 xl:col-span-8 space-y-6">
                {/* Sales Pipeline */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold">Sales Pipeline</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {totalPipeline} opportunities · auto lead assignment on
                      </p>
                    </div>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                      Manage stages
                    </button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {company.pipeline.map((s, i) => (
                      <div
                        key={s.stage}
                        className="rounded-xl border border-zinc-100 p-3 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full ${
                              ["bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-orange-500", "bg-emerald-500"][i]
                            }`}
                          />
                          <p className="text-[11px] text-zinc-500 font-medium">{s.stage}</p>
                        </div>
                        <p className="text-xl font-bold tracking-tight mt-2">{s.count}</p>
                        <p className="text-[11px] text-zinc-500 font-mono">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Lead Preview */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Lead Management</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Live leads · auto-assigned by rules
                      </p>
                    </div>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1">
                      View All <ArrowUpRight className="size-3" />
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-950/5">
                          <th className="px-6 py-3">Profile</th>
                          <th className="px-6 py-3">Contact</th>
                          <th className="px-6 py-3">Ref ID</th>
                          <th className="px-6 py-3">Stage</th>
                          <th className="px-6 py-3">Message</th>
                          <th className="px-6 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-950/5">
                        {company.leads.map((l) => (
                          <tr key={l.name + l.camp} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`size-9 rounded-full ${l.tone} grid place-items-center text-xs font-semibold ring-1 ring-black/5 shrink-0`}
                                >
                                  {l.initials}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{l.name}</p>
                                  <p className="text-[11px] text-zinc-500">{l.time}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3.5">
                              <p className="text-xs text-zinc-900">{l.email}</p>
                              <p className="text-[11px] text-zinc-500">{l.phone}</p>
                            </td>
                            <td className="px-6 py-3.5 text-xs font-mono text-zinc-600">{l.camp}</td>
                            <td className="px-6 py-3.5">
                              <span
                                className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-full ring-1 ${l.stageTone}`}
                              >
                                {l.stage}
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-xs text-zinc-500 max-w-[220px] truncate">
                              {l.message}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button className="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100">
                                <MoreHorizontal className="size-4 text-zinc-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Chart */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm font-semibold">Business Performance</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Monthly conversions · {company.name}
                      </p>
                    </div>
                    <button className="text-xs text-zinc-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50">
                      Last 12 months <ChevronDown className="size-3" />
                    </button>
                  </div>
                  <div className="flex gap-6">
                    <div className="flex flex-col justify-between text-[10px] font-mono text-zinc-400 py-1 shrink-0 h-56">
                      <span>70k</span><span>60k</span><span>50k</span><span>40k</span>
                      <span>30k</span><span>20k</span><span>10k</span><span>0</span>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-56 flex items-end gap-2">
                        {company.chart.map((b, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group">
                            {b.active && (
                              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-40 bg-zinc-900 text-white rounded-xl p-3 shadow-xl z-10">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="size-6 rounded-full bg-amber-300 grid place-items-center text-[10px] font-bold text-zinc-900">
                                    AB
                                  </div>
                                  <span className="text-xs font-semibold">Peak week</span>
                                </div>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-400">Conversions</span>
                                    <span className="font-mono font-semibold">
                                      {Math.round(b.v * 70)}k
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-[10px]">
                                    <span className="text-zinc-400">Contacts</span>
                                    <span className="font-mono font-semibold">5k</span>
                                  </div>
                                </div>
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 bg-zinc-900 rotate-45" />
                              </div>
                            )}
                            <div
                              className={`w-full rounded-t-md transition-all ${
                                b.active ? "bg-zinc-900" : "bg-zinc-100 group-hover:bg-zinc-200"
                              }`}
                              style={{ height: `${b.v * 100}%` }}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex mt-3 gap-2">
                        {company.chart.map((b) => (
                          <span
                            key={b.m}
                            className={`flex-1 text-center text-[10px] font-semibold tracking-wider ${
                              b.active ? "text-zinc-900" : "text-zinc-400"
                            }`}
                          >
                            {b.m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Task management */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm">
                  <div className="px-6 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Tasks & Approvals</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Approval workflows · reminders automated
                      </p>
                    </div>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                      Open board
                    </button>
                  </div>
                  <div className="divide-y divide-zinc-950/5">
                    {company.tasks.map((t) => (
                      <div key={t.name} className="px-6 py-3.5 flex items-center gap-4">
                        <input type="checkbox" className="size-4 rounded border-zinc-300 accent-zinc-900" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{t.name}</p>
                          <p className="text-[11px] text-zinc-500">
                            {t.owner} · due {t.due}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-1 rounded-full ring-1 ${t.statusTone}`}
                        >
                          {t.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              {/* Right rail */}
              <div className="col-span-12 xl:col-span-4 space-y-6">
                {/* Industry modules */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm">
                  <div className="px-5 py-4 border-b border-zinc-950/5">
                    <h3 className="text-sm font-semibold">Industry Modules</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">
                      Scoped to {company.name}
                    </p>
                  </div>
                  <div className="p-3 space-y-1">
                    {company.industry.map((m) => (
                      <button
                        key={m.label}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors text-left group"
                      >
                        <div className="size-10 rounded-lg bg-zinc-100 grid place-items-center shrink-0">
                          <m.icon className="size-4 text-zinc-700" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{m.label}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{m.meta}</p>
                        </div>
                        <ArrowUpRight className="size-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                      </button>
                    ))}
                  </div>
                </section>

                {/* Activity / Notifications */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm">
                  <div className="px-5 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Notifications & Activity</h3>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1">
                      <Download className="size-3.5" /> Export
                    </button>
                  </div>
                  <div className="p-3 space-y-1">
                    {company.activity.map((n, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors"
                      >
                        <div className={`mt-1.5 size-2 rounded-full shrink-0 ${n.tone}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold leading-tight">{n.title}</p>
                          <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed">{n.body}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-mono">{n.time}</span>
                      </div>
                    ))}
                    <button className="w-full mt-2 py-2.5 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                      See all notifications
                    </button>
                  </div>
                </section>

                {/* Security */}
                <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <h3 className="text-sm font-semibold">Security & Access</h3>
                  </div>
                  <ul className="space-y-2.5 text-xs text-zinc-600">
                    {[
                      "Role-based permissions enforced",
                      "Audit log · 128 events today",
                      "Encrypted storage · backups verified",
                      "API keys rotated 4 days ago",
                    ].map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-4 pb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
      {children}
    </div>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  badge,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900 font-medium"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={active ? 2.25 : 1.75} />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
          {badge}
        </span>
      )}
    </button>
  );
}
