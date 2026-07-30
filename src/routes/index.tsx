import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AskAi } from "@/components/ask-ai-panel";
import { CallDialog } from "@/components/call-dialog";
import { HeaderDialer } from "@/components/header-dialer";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  AppStoreProvider,
  useAppStore,
  downloadCSV,
  Modal,
  QUOTE_TONE,
  INV_TONE,
  TASK_TONE,
  LEAD_STAGES,
  LEAD_STAGE_TONE,
  DISPOSITION_TONE,
  CALL_DISPOSITIONS,
  type LeadStage,
  type TaskStatus,
  type CallDisposition,
} from "@/lib/app-store";
import { toast } from "sonner";


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
  Menu,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardWrapper,
});

function DashboardWrapper() {
  return (
    <AppStoreProvider>
      <Dashboard />
    </AppStoreProvider>
  );
}


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
      { label: "Consolidated Revenue", value: "₹40.0 Cr", delta: "+14.2%", deltaTone: "text-emerald-600", icon: DollarSign },
      { label: "Active Leads", value: "2,148", delta: "+312", deltaTone: "text-emerald-600", icon: Target },
      { label: "Open Invoices", value: "₹5.68 Cr", delta: "-6.1%", deltaTone: "text-emerald-600", icon: Receipt },
      { label: "Team Utilization", value: "87%", delta: "+3.4%", deltaTone: "text-emerald-600", icon: Activity },
    ],
    leads: [
      { name: "Shawon Black", time: "Today at 9:10 AM", email: "shawon@mailzone.io", phone: "(234) 555-0108", camp: "AG-56728", message: "Group-wide inquiry — interested in enterprise plan.", initials: "SB", tone: "bg-[#FBBC05] text-white", stage: "New", stageTone: "bg-[#4285F4] text-white ring-[#4285F4]/30" },
      { name: "Kamrul Miles", time: "Today at 9:10 AM", email: "miles87@fastmail.net", phone: "(234) 555-0109", camp: "AG-12131", message: "Requesting proposal across three business units.", initials: "KM", tone: "bg-[#34A853] text-white", stage: "Qualified", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Su Flores", time: "Today at 8:10 AM", email: "su.m@quickinbox.org", phone: "(234) 555-0110", camp: "AG-15167", message: "Follow-up on quotation Q-2048.", initials: "SF", tone: "bg-[#4285F4] text-white", stage: "Proposal", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Ma Pena", time: "Today at 7:30 AM", email: "ma.p@inboxmail.com", phone: "(234) 555-0111", camp: "AG-81922", message: "Contract renewal discussion scheduled.", initials: "MP", tone: "bg-[#EA4335] text-white", stage: "Won", stageTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
    ],
    pipeline: [
      { stage: "New", count: 84, value: "₹3.42 Cr" },
      { stage: "Qualified", count: 46, value: "₹8.47 Cr" },
      { stage: "Proposal", count: 22, value: "₹12.3 Cr" },
      { stage: "Negotiation", count: 11, value: "₹7.14 Cr" },
      { stage: "Won", count: 18, value: "₹8.80 Cr" },
    ],
    chart: [
      { m: "JAN", v: 0.42 }, { m: "FEB", v: 0.58 }, { m: "MAR", v: 0.36 }, { m: "APR", v: 0.48 },
      { m: "MAY", v: 0.55 }, { m: "JUN", v: 0.62 }, { m: "JUL", v: 0.92, active: true },
      { m: "AUG", v: 0.5 }, { m: "SEP", v: 0.7 }, { m: "OCT", v: 0.44 }, { m: "NOV", v: 0.6 }, { m: "DEC", v: 0.38 },
    ],
    activity: [
      { title: "New candidate added", body: "Alex Johnson entered Sales pipeline.", time: "2m", tone: "bg-[#4285F4]" },
      { title: "Invoice #INV-2048 paid", body: "Payment of ₹23.6 L received from Nordic Ltd.", time: "18m", tone: "bg-[#34A853]" },
      { title: "Approval requested", body: "Q3 discount waiver awaiting Company Admin.", time: "1h", tone: "bg-[#EA4335]" },
      { title: "Audit log entry", body: "Role change: Sarah Kim → Manager.", time: "3h", tone: "bg-[#9AA0A6]" },
    ],
    tasks: [
      { name: "Prepare Q3 board deck", owner: "You", due: "Today", status: "In Progress", statusTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Review consolidated P&L", owner: "Finance", due: "Tomorrow", status: "Pending", statusTone: "bg-[#5F6368] text-white ring-[#5F6368]/30" },
      { name: "Approve new vendor contracts", owner: "Ops", due: "Fri", status: "Blocked", statusTone: "bg-[#EA4335] text-white ring-[#EA4335]/30" },
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
      { label: "Fees Collected", value: "₹5.08 Cr", delta: "+9.2%", deltaTone: "text-emerald-600", icon: DollarSign },
      { label: "Fees Overdue", value: "₹39.8 L", delta: "-12%", deltaTone: "text-emerald-600", icon: Clock },
    ],
    leads: [
      { name: "Priya Naidu", time: "Today at 10:05 AM", email: "priya.n@parent.io", phone: "(234) 555-0210", camp: "ADM-9820", message: "Enquiry for Grade 6 mid-term admission.", initials: "PN", tone: "bg-[#4285F4] text-white", stage: "New", stageTone: "bg-[#4285F4] text-white ring-[#4285F4]/30" },
      { name: "Daniel Owens", time: "Today at 9:22 AM", email: "d.owens@family.co", phone: "(234) 555-0211", camp: "ADM-9821", message: "Requested campus tour on Saturday.", initials: "DO", tone: "bg-[#34A853] text-white", stage: "Tour Booked", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Aisha Rahman", time: "Today at 8:40 AM", email: "aisha.r@mail.net", phone: "(234) 555-0212", camp: "ADM-9822", message: "Scholarship eligibility follow-up.", initials: "AR", tone: "bg-[#EA4335] text-white", stage: "Proposal", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Marco Silva", time: "Yesterday", email: "marco.s@inbox.com", phone: "(234) 555-0213", camp: "ADM-9823", message: "Fee plan accepted — enrollment confirmed.", initials: "MS", tone: "bg-[#FBBC05] text-white", stage: "Enrolled", stageTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
    ],
    pipeline: [
      { stage: "Enquiry", count: 128, value: "—" },
      { stage: "Tour Booked", count: 64, value: "—" },
      { stage: "Application", count: 38, value: "—" },
      { stage: "Offer Sent", count: 22, value: "—" },
      { stage: "Enrolled", count: 41, value: "₹3.42 Cr" },
    ],
    chart: [
      { m: "JAN", v: 0.32 }, { m: "FEB", v: 0.48 }, { m: "MAR", v: 0.66 }, { m: "APR", v: 0.55 },
      { m: "MAY", v: 0.72 }, { m: "JUN", v: 0.88, active: true }, { m: "JUL", v: 0.6 },
      { m: "AUG", v: 0.42 }, { m: "SEP", v: 0.7 }, { m: "OCT", v: 0.5 }, { m: "NOV", v: 0.58 }, { m: "DEC", v: 0.36 },
    ],
    activity: [
      { title: "New admission enquiry", body: "Priya Naidu — Grade 6, mid-term.", time: "5m", tone: "bg-[#4285F4]" },
      { title: "Fee payment received", body: "Marco Silva — Term 2 · ₹1.99 L.", time: "22m", tone: "bg-[#34A853]" },
      { title: "Overdue reminder sent", body: "12 parents notified automatically.", time: "1h", tone: "bg-[#FBBC05]" },
      { title: "Class capacity alert", body: "Grade 9-B has 2 seats remaining.", time: "2h", tone: "bg-[#EA4335]" },
    ],
    tasks: [
      { name: "Publish Term 3 fee structure", owner: "Registrar", due: "Today", status: "In Progress", statusTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Review scholarship applications", owner: "Admissions", due: "Tomorrow", status: "Pending", statusTone: "bg-[#5F6368] text-white ring-[#5F6368]/30" },
      { name: "Send offer letters (Batch 4)", owner: "You", due: "Fri", status: "On Track", statusTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
    ],
    industry: [
      { label: "Admissions", meta: "128 open enquiries", icon: GraduationCap },
      { label: "Student Management", meta: "3,842 records", icon: Users },
      { label: "Fee Management", meta: "₹39.8 L overdue", icon: DollarSign },
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
      { name: "Rahim Ahmed", time: "Today at 9:44 AM", email: "rahim.a@buyer.io", phone: "(234) 555-0310", camp: "PRJ-Skyline", message: "Interested in 3BHK, tower B, sea-facing.", initials: "RA", tone: "bg-[#FBBC05] text-white", stage: "Site Visit", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Elena Costa", time: "Today at 9:02 AM", email: "elena.c@mail.co", phone: "(234) 555-0311", camp: "PRJ-Greens", message: "Booking amount transferred — awaiting agreement.", initials: "EC", tone: "bg-[#34A853] text-white", stage: "Booked", stageTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
      { name: "Yuki Tanaka", time: "Today at 8:15 AM", email: "yuki.t@inbox.jp", phone: "(234) 555-0312", camp: "PRJ-Skyline", message: "Requesting revised floor plan for Unit 12-C.", initials: "YT", tone: "bg-[#4285F4] text-white", stage: "Negotiation", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Omar Farouk", time: "Yesterday", email: "omar.f@fastmail.net", phone: "(234) 555-0313", camp: "PRJ-Palms", message: "New enquiry from Facebook campaign.", initials: "OF", tone: "bg-[#EA4335] text-white", stage: "New", stageTone: "bg-[#4285F4] text-white ring-[#4285F4]/30" },
    ],
    pipeline: [
      { stage: "New", count: 62, value: "₹39.8 Cr" },
      { stage: "Site Visit", count: 34, value: "₹25.7 Cr" },
      { stage: "Negotiation", count: 18, value: "₹19.9 Cr" },
      { stage: "Booked", count: 24, value: "₹29.9 Cr" },
      { stage: "Registered", count: 12, value: "₹15.8 Cr" },
    ],
    chart: [
      { m: "JAN", v: 0.48 }, { m: "FEB", v: 0.62 }, { m: "MAR", v: 0.72 }, { m: "APR", v: 0.55 },
      { m: "MAY", v: 0.68 }, { m: "JUN", v: 0.82 }, { m: "JUL", v: 0.94, active: true },
      { m: "AUG", v: 0.66 }, { m: "SEP", v: 0.58 }, { m: "OCT", v: 0.42 }, { m: "NOV", v: 0.52 }, { m: "DEC", v: 0.44 },
    ],
    activity: [
      { title: "Booking confirmed", body: "Elena Costa — Unit A-1203, Skyline.", time: "4m", tone: "bg-[#34A853]" },
      { title: "Site visit scheduled", body: "Rahim Ahmed — Saturday 11:00 AM.", time: "25m", tone: "bg-[#FBBC05]" },
      { title: "Price approval pending", body: "Discount request on Unit B-704.", time: "1h", tone: "bg-[#EA4335]" },
      { title: "Inventory synced", body: "Skyline · 12 units marked sold.", time: "2h", tone: "bg-[#9AA0A6]" },
    ],
    tasks: [
      { name: "Finalize Palms brochure", owner: "Marketing", due: "Today", status: "In Progress", statusTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Verify Tower B unit inventory", owner: "Ops", due: "Tomorrow", status: "On Track", statusTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
      { name: "Draft Greens booking agreement", owner: "Legal", due: "Fri", status: "Pending", statusTone: "bg-[#5F6368] text-white ring-[#5F6368]/30" },
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
      { name: "Nordic Ltd.", time: "Today at 9:30 AM", email: "ops@nordic.co", phone: "(234) 555-0410", camp: "SVC-Retail", message: "Extension request — 6 additional retail sites.", initials: "NL", tone: "bg-[#34A853] text-white", stage: "Proposal", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Harbor Group", time: "Today at 9:08 AM", email: "pm@harbor.io", phone: "(234) 555-0411", camp: "SVC-HVAC", message: "HVAC AMC renewal for 4 towers.", initials: "HG", tone: "bg-[#4285F4] text-white", stage: "Negotiation", stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Peak Retail", time: "Today at 8:52 AM", email: "facilities@peak.com", phone: "(234) 555-0412", camp: "SVC-Cleaning", message: "New enquiry from referral.", initials: "PR", tone: "bg-[#FBBC05] text-white", stage: "New", stageTone: "bg-[#4285F4] text-white ring-[#4285F4]/30" },
      { name: "Meridian HQ", time: "Yesterday", email: "admin@meridian.io", phone: "(234) 555-0413", camp: "SVC-Security", message: "Contract signed — onboarding this week.", initials: "MH", tone: "bg-[#EA4335] text-white", stage: "Won", stageTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
    ],
    pipeline: [
      { stage: "New", count: 22, value: "₹1.49 Cr" },
      { stage: "Qualified", count: 14, value: "₹1.99 Cr" },
      { stage: "Proposal", count: 9, value: "₹2.66 Cr" },
      { stage: "Negotiation", count: 6, value: "₹1.74 Cr" },
      { stage: "Won", count: 11, value: "₹3.42 Cr" },
    ],
    chart: [
      { m: "JAN", v: 0.52 }, { m: "FEB", v: 0.62 }, { m: "MAR", v: 0.58 }, { m: "APR", v: 0.68 },
      { m: "MAY", v: 0.72 }, { m: "JUN", v: 0.66 }, { m: "JUL", v: 0.86, active: true },
      { m: "AUG", v: 0.72 }, { m: "SEP", v: 0.6 }, { m: "OCT", v: 0.48 }, { m: "NOV", v: 0.54 }, { m: "DEC", v: 0.42 },
    ],
    activity: [
      { title: "Ticket closed within SLA", body: "Harbor Group · HVAC alert.", time: "8m", tone: "bg-[#34A853]" },
      { title: "New client onboarded", body: "Meridian HQ — 2 sites active.", time: "32m", tone: "bg-[#4285F4]" },
      { title: "Preventive maintenance due", body: "Peak Retail · monthly inspection.", time: "1h", tone: "bg-[#FBBC05]" },
      { title: "Audit log entry", body: "Vendor permission updated by Admin.", time: "3h", tone: "bg-[#9AA0A6]" },
    ],
    tasks: [
      { name: "Renew Harbor AMC", owner: "Accounts", due: "Today", status: "In Progress", statusTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" },
      { name: "Deploy Meridian access badges", owner: "Ops", due: "Tomorrow", status: "On Track", statusTone: "bg-[#34A853] text-white ring-[#34A853]/30" },
      { name: "Review vendor SLAs", owner: "You", due: "Fri", status: "Pending", statusTone: "bg-[#5F6368] text-white ring-[#5F6368]/30" },
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

// ─── Option lists for select/dropdown fields (globally reusable) ──────────
const LEAD_STATUS_OPTIONS = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const LEAD_SOURCE_OPTIONS = ["Cold Call", "Website", "Referral", "Facebook Ads", "Google Ads", "LinkedIn", "Trade Show", "Email Campaign", "Partner", "Other"];
const INDUSTRY_OPTIONS = ["Service Provider", "Manufacturing", "Retail", "Real Estate", "Education", "Healthcare", "Finance", "Technology", "Logistics", "Hospitality", "Construction", "Other"];
const RATING_OPTIONS = ["Hot", "Warm", "Cold", "Acquired", "Active", "Inactive"];
const COUNTRY_OPTIONS = ["India", "United States", "United Kingdom", "UAE", "Singapore", "Australia", "Canada", "Germany", "Japan", "Bangladesh", "Other"];
const STATE_OPTIONS_INDIA = ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Other"];
const STATE_OPTIONS_US = ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC", "BC", "ON", "QC", "Other"];
const TITLE_OPTIONS = ["CEO", "CTO", "CFO", "COO", "VP Accounting", "VP Sales", "VP Marketing", "Director of Ops", "Director of Engineering", "Manager", "Procurement Head", "Consultant", "Other"];
const EMPLOYEE_RANGE_OPTIONS = ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const [companyKey, setCompanyKey] = useState<CompanyKey>("group");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [activeView, setActiveView] = useState<string>("Executive Dashboard");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [leadDraft, setLeadDraft] = useState({ name: "", email: "", phone: "", message: "", source: "Website", stage: "New" });
  const store = useAppStore();
  const baseCompany = companies[companyKey];

  // Merge extra leads + task status overrides + extra tasks into company view
  const company = useMemo(() => {
    const extraLeads = store.extraLeads[companyKey] ?? [];
    const extraTasks = store.extraTasks[companyKey] ?? [];
    const overrides = store.taskStatusOverrides[companyKey] ?? {};
    const mergedTasks = [...extraTasks, ...baseCompany.tasks].map((t: any) => {
      const status: TaskStatus = (overrides[t.name] ?? t.status) as TaskStatus;
      return { ...t, status, statusTone: TASK_TONE[status] ?? t.statusTone };
    });
    return { ...baseCompany, leads: [...extraLeads, ...baseCompany.leads], tasks: mergedTasks };
  }, [baseCompany, companyKey, store.extraLeads, store.extraTasks, store.taskStatusOverrides]);

  // Global search filter for the leads table
  const q = store.search.trim().toLowerCase();
  const filteredLeads = useMemo(() => {
    if (!q) return company.leads;
    return company.leads.filter((l: any) =>
      [l.name, l.email, l.phone, l.message, l.stage, l.camp].join(" ").toLowerCase().includes(q),
    );
  }, [company.leads, q]);

  const industry = industryNav[companyKey];

  const totalPipeline = useMemo(
    () => company.pipeline.reduce((a: number, s: any) => a + s.count, 0),
    [company],
  );

  const exportReport = () => {
    downloadCSV(
      `${baseCompany.name.replace(/\s+/g, "_").toLowerCase()}_leads.csv`,
      company.leads.map((l: any) => ({
        name: l.name, email: l.email, phone: l.phone, stage: l.stage, ref: l.camp, message: l.message, time: l.time,
      })),
    );
    toast.success("Report exported");
  };

  const submitLead = () => {
    const name = leadDraft.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "??";
    const stage = leadDraft.stage as LeadStage;
    store.addLead(companyKey, {
      name,
      time: "Just now",
      email: leadDraft.email.trim() || "—",
      phone: leadDraft.phone.trim() || "—",
      camp: `${leadDraft.source.toUpperCase().replace(/\s+/g, "-").slice(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`,
      message: leadDraft.message.trim() || "Manually added lead",
      initials,
      tone: "bg-[#4285F4] text-white",
      stage,
      stageTone: LEAD_STAGE_TONE[stage] ?? "bg-[#4285F4] text-white ring-[#4285F4]/30",
    });
    store.bumpUnread();
    toast.success(`Added ${name}`);
    setLeadDraft({ name: "", email: "", phone: "", message: "", source: "Website", stage: "New" });
    setAddLeadOpen(false);
  };


  const sidebarContent = (
    <>
      <div className="h-16 px-5 flex items-center gap-2 border-b border-zinc-200 shrink-0">
        <div className="size-8 rounded-lg bg-gradient-to-br from-zinc-900 to-zinc-700 grid place-items-center text-white text-xs font-bold">
          AB
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight leading-none">Advance Suite</p>
          <p className="text-[10px] text-zinc-500 mt-0.5">Business OS</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-0.5">
        <SectionLabel>Core Modules</SectionLabel>
        {coreNav.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            active={activeView === item.label}
            onClick={() => {
              setActiveView(item.label);
              setMobileNavOpen(false);
            }}
          />
        ))}

        <SectionLabel>{companyKey === "group" ? "Industry Suites" : "Industry Module"}</SectionLabel>
        {industry.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            active={activeView === item.label}
            onClick={() => {
              setActiveView(item.label);
              setMobileNavOpen(false);
            }}
          />
        ))}

        <SectionLabel>System</SectionLabel>
        {systemNav.map((item) => (
          <NavItem
            key={item.label}
            {...item}
            active={activeView === item.label}
            onClick={() => {
              setActiveView(item.label);
              setMobileNavOpen(false);
            }}
          />
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-200 shrink-0">
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
    </>
  );

  const snapshot = {
    companyName: company.name,
    companyKind: company.kind,
    view: activeView,
    kpis: company.kpis.map((k) => ({ label: k.label, value: k.value, delta: k.delta })),
    leads: company.leads.map((l) => ({
      name: l.name,
      time: l.time,
      stage: l.stage,
      message: l.message,
      phone: l.phone,
      email: l.email,
    })),
    pipeline: company.pipeline.map((p) => ({ stage: p.stage, count: p.count, value: p.value })),
    tasks: company.tasks.map((t) => ({ name: t.name, owner: t.owner, due: t.due, status: t.status })),
    activity: company.activity.map((a) => ({ title: a.title, body: a.body, time: a.time })),
  };

  return (
    <div className="flex h-screen bg-[#f4f5f7] text-zinc-900 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="w-64 shrink-0 hidden lg:flex flex-col border-r border-zinc-200 bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0 w-72 flex flex-col bg-white">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-zinc-200 bg-white/70 backdrop-blur flex items-center justify-between px-3 sm:px-6 gap-2 sm:gap-4 relative z-30">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className="lg:hidden size-9 rounded-lg border border-zinc-200 grid place-items-center hover:bg-zinc-50 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="size-4 text-zinc-700" />
          </button>

          {/* Company switcher */}
          <div className="relative min-w-0 shrink">
            <button
              onClick={() => setSwitcherOpen((v) => !v)}
              className="flex items-center gap-2 sm:gap-3 pl-1.5 pr-2 sm:pr-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors max-w-full"
            >
              <div
                className={`size-8 rounded-md bg-gradient-to-br ${company.tone} grid place-items-center text-white text-[11px] font-bold shrink-0`}
              >
                {company.initials}
              </div>
              <div className="text-left min-w-0 hidden sm:block">
                <p className="text-sm font-semibold leading-none truncate">{company.name}</p>
                <p className="text-[10px] text-zinc-500 mt-1 truncate">{company.kind}</p>
              </div>
              <ChevronDown className="size-4 text-zinc-400 ml-1 shrink-0" />
            </button>

            {switcherOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSwitcherOpen(false)} />
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-2xl ring-1 ring-zinc-200 p-2 z-20">
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
                  <div className="border-t border-zinc-200 mt-1 pt-1">
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
                value={store.search}
                onChange={(e) => store.setSearch(e.target.value)}
                placeholder={`Search leads across ${company.name}…`}
                className="w-full h-9 pl-9 pr-3 rounded-lg border border-zinc-200 bg-white text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <HeaderDialer companyKey={companyKey} companyName={baseCompany.name} />
            <AskAi snapshot={snapshot} />
            <button className="hidden lg:flex items-center gap-1.5 text-sm text-zinc-600 font-medium px-3 py-2 rounded-lg hover:bg-zinc-50">
              English <ChevronDown className="size-3.5" />
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setNotifOpen((v) => !v);
                  if (!notifOpen) store.markAllRead();
                }}
                className="relative size-9 rounded-lg border border-zinc-200 grid place-items-center hover:bg-zinc-50 shrink-0"
                aria-label="Notifications"
              >
                <Bell className="size-4 text-zinc-700" />
                {store.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#EA4335] text-white text-[9px] font-bold grid place-items-center">
                    {store.unreadCount > 9 ? "9+" : store.unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-zinc-200 z-20 overflow-hidden">
                    <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between">
                      <p className="text-sm font-semibold">Notifications</p>
                      <button
                        onClick={() => store.markAllRead()}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-zinc-100">
                      {company.activity.map((n: any, i: number) => (
                        <div key={i} className="px-4 py-3 flex items-start gap-3">
                          <div className={`mt-1.5 size-2 rounded-full shrink-0 ${n.tone}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate">{n.title}</p>
                            <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-2">{n.body}</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 font-mono shrink-0">{n.time}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setNotifOpen(false);
                        setActiveView("Notifications");
                      }}
                      className="w-full py-2.5 text-xs font-semibold border-t border-zinc-200 hover:bg-zinc-50"
                    >
                      View all
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setAddLeadOpen(true)}
              className="hidden sm:flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
            >
              <Plus className="size-4" /> <span className="hidden md:inline">Add person</span>
            </button>
          </div>
        </header>


        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {activeView !== "Executive Dashboard" && (
              <ModuleView view={activeView} company={company} companyKey={companyKey} />
            )}
            {activeView === "Executive Dashboard" && (<>

            {/* Welcome banner */}
            <div className="rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                    {company.kind}
                  </p>
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight mt-1 truncate">
                    {getGreeting()}, Sohan
                  </h1>
                  <p className="text-sm text-zinc-600 mt-1">
                    You're viewing <span className="font-semibold text-zinc-900">{company.name}</span> · {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportReport}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50"
                  >
                    <Download className="size-3.5" /> Export report
                  </button>
                  <button
                    onClick={() => setActiveView("Automations")}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800"
                  >
                    <Zap className="size-3.5" /> New automation
                  </button>
                </div>
              </div>
            </div>



            {/* KPI cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {company.kpis.map((k) => (
                <div
                  key={k.label}
                  className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5"
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
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
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
                        className="rounded-xl border border-zinc-200 p-3 hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full ${
                              ["bg-[#4285F4]", "bg-[#FBBC05]", "bg-[#FBBC05]", "bg-[#EA4335]", "bg-[#34A853]"][i]
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
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
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
                        <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                          <th className="px-6 py-3">Profile</th>
                          <th className="px-6 py-3">Contact</th>
                          <th className="px-6 py-3">Ref ID</th>
                          <th className="px-6 py-3">Stage</th>
                          <th className="px-6 py-3">Message</th>
                          <th className="px-6 py-3 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-950/5">
                        {filteredLeads.map((l: any) => (
                          <tr key={l.name + l.camp} className="hover:bg-zinc-50/60 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <img
                                  src={`https://i.pravatar.cc/80?u=${encodeURIComponent(l.name)}`}
                                  alt={l.name}
                                  className="size-9 rounded-full object-cover ring-1 ring-zinc-200 shrink-0"
                                />
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
                              <QuickStageChip lead={l} companyKey={companyKey} />
                            </td>
                            <td className="px-6 py-3.5 text-xs text-zinc-500 max-w-[220px] truncate">
                              {l.message}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <QuickCallButton lead={l} companyKey={companyKey} companyName={company.name} />
                                <button className="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-100">
                                  <MoreHorizontal className="size-4 text-zinc-400" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Chart */}
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
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

                {/* Recent Won Deals — customer photos */}
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold">Recent Won Deals</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Closed this week · {company.name}
                      </p>
                    </div>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1">
                      All deals <ArrowUpRight className="size-3" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {company.leads.slice(0, 3).map((l, i) => (
                      <div key={l.name} className="rounded-xl overflow-hidden ring-1 ring-zinc-200 hover:shadow-md transition-shadow">
                        <div className="h-20 relative">
                          <img src={coverFor(l.camp || l.name)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
                          <span className="absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-none bg-[#34A853] text-white">
                            Won
                          </span>
                        </div>
                        <div className="p-3 -mt-8 relative">
                          <img
                            src={`https://i.pravatar.cc/120?u=${encodeURIComponent(l.name)}`}
                            alt={l.name}
                            className="size-12 rounded-full object-cover ring-4 ring-white shadow"
                          />
                          <p className="text-sm font-semibold mt-2 truncate">{l.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{l.camp}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs font-mono font-semibold text-zinc-900">
                              ₹${(35 + i * 15)}L
                            </span>
                            <span className="text-[10px] text-zinc-400">{l.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Lead Sources */}
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-sm font-semibold">Lead Sources</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        Attribution across channels
                      </p>
                    </div>
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                      Configure
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      { name: "Website", pct: 38, tone: "bg-[#5F6368]" },
                      { name: "Referral", pct: 24, tone: "bg-[#34A853]" },
                      { name: "Cold Call", pct: 18, tone: "bg-[#FBBC05]" },
                      { name: "Facebook Ads", pct: 12, tone: "bg-[#4285F4]" },
                      { name: "Events", pct: 8, tone: "bg-[#9AA0A6]" },
                    ].map((s) => (
                      <div key={s.name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-zinc-700">{s.name}</span>
                          <span className="font-mono text-zinc-500">{s.pct}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-zinc-100 overflow-hidden">
                          <div className={`h-full ${s.tone}`} style={{ width: `${s.pct * 2.5}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>


                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between">
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
                          className={`text-[10px] font-semibold px-2 py-1 rounded-none ring-1 ${t.statusTone}`}
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
                {/* Top Performers — with real photos */}
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">Top Sales Reps</h3>
                      <p className="text-[11px] text-zinc-500 mt-0.5">This month · leaderboard</p>
                    </div>
                    <TrendingUp className="size-4 text-emerald-600" />
                  </div>
                  <div className="p-3 space-y-1">
                    {[
                      { name: "Saurav Mbuskar", role: "Sr. Account Exec", deals: 24, amt: "₹3.42 Cr" },
                      { name: "Ananya Rao", role: "Enterprise AE", deals: 18, amt: "₹2.37 Cr" },
                      { name: "Marcus Chen", role: "SMB Lead", deals: 15, amt: "₹1.64 Cr" },
                      { name: "Priya Shah", role: "Account Manager", deals: 12, amt: "₹1.36 Cr" },
                    ].map((p, i) => (
                      <div key={p.name} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 transition-colors">
                        <div className="relative shrink-0">
                          <img
                            src={`https://i.pravatar.cc/120?u=${encodeURIComponent(p.name)}`}
                            alt={p.name}
                            className="size-10 rounded-full object-cover ring-1 ring-zinc-200"
                          />
                          <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-zinc-900 text-white text-[10px] font-bold grid place-items-center ring-2 ring-white">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-zinc-500 truncate">{p.role} · {p.deals} deals</p>
                        </div>
                        <span className="text-xs font-mono font-semibold text-zinc-900">{p.amt}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Industry modules */}
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <div className="px-5 py-4 border-b border-zinc-200">
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
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                  <div className="px-5 py-4 border-b border-zinc-200 flex items-center justify-between">
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
                <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
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
            </>)}
          </div>
        </div>

      </main>

      {/* Add person modal */}
      <Modal open={addLeadOpen} onClose={() => setAddLeadOpen(false)} title={`Add person · ${baseCompany.name}`}>
        <label className="block text-xs font-medium text-zinc-600">Full name
          <input autoFocus value={leadDraft.name} onChange={(e) => setLeadDraft((d) => ({ ...d, name: e.target.value }))} maxLength={80} className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        </label>
        <label className="block text-xs font-medium text-zinc-600">Email
          <input value={leadDraft.email} onChange={(e) => setLeadDraft((d) => ({ ...d, email: e.target.value }))} maxLength={120} className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        </label>
        <label className="block text-xs font-medium text-zinc-600">Phone
          <input value={leadDraft.phone} onChange={(e) => setLeadDraft((d) => ({ ...d, phone: e.target.value }))} maxLength={40} className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-zinc-600">Lead Source
            <select value={leadDraft.source} onChange={(e) => setLeadDraft((d) => ({ ...d, source: e.target.value }))} className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer">
              {LEAD_SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-xs font-medium text-zinc-600">Stage
            <select value={leadDraft.stage} onChange={(e) => setLeadDraft((d) => ({ ...d, stage: e.target.value }))} className="mt-1 w-full h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 cursor-pointer">
              {LEAD_STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <label className="block text-xs font-medium text-zinc-600">Message
          <textarea value={leadDraft.message} onChange={(e) => setLeadDraft((d) => ({ ...d, message: e.target.value }))} maxLength={280} rows={3} className="mt-1 w-full px-3 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={() => setAddLeadOpen(false)} className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-200 hover:bg-zinc-50">Cancel</button>
          <button onClick={submitLead} className="px-3 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">Add lead</button>
        </div>
      </Modal>
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
  onClick,
}: {
  icon: any;
  label: string;
  active?: boolean;
  badge?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors ${
        active
          ? "bg-zinc-100 text-zinc-900 font-bold"
          : "text-zinc-700 font-semibold hover:bg-zinc-50 hover:text-zinc-900"
      }`}
    >
      <Icon className="size-4 shrink-0" strokeWidth={active ? 2.5 : 2} />

      <span className="flex-1 text-left truncate">{label}</span>
      {badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700">
          {badge}
        </span>
      )}
    </button>
  );
}

// ------------------------------------------------------------------
// Module Views — rendered when a sidebar item other than the
// Executive Dashboard is active. Every core / industry / system item
// has a working destination so nothing in the nav is dead.
// ------------------------------------------------------------------
function ModuleView({ view, company, companyKey }: { view: string; company: any; companyKey: string }) {
  const store = useAppStore();

  const onExport = () => {
    if (view === "Quotations") {
      downloadCSV("quotations.csv", store.quotations);
    } else if (view === "Invoicing") {
      downloadCSV("invoices.csv", store.invoices);
    } else if (view === "Task Management") {
      downloadCSV(`${companyKey}_tasks.csv`, company.tasks);
    } else if (view === "CRM" || view === "Lead Management" || view === "Customer Portal") {
      downloadCSV(`${companyKey}_contacts.csv`, company.leads.map((l: any) => ({
        name: l.name, email: l.email, phone: l.phone, stage: l.stage, ref: l.camp,
      })));
    } else if (view === "Notifications") {
      downloadCSV(`${companyKey}_activity.csv`, company.activity);
    } else if (view === "Automations") {
      downloadCSV("automations.csv", store.automations);
    } else {
      downloadCSV(`${companyKey}_${view.replace(/\s+/g, "_").toLowerCase()}.csv`, company.leads.map((l: any) => ({
        name: l.name, stage: l.stage, ref: l.camp,
      })));
    }
    toast.success("Exported");
  };

  const onNew = () => {
    if (view === "Quotations") {
      store.addQuotation({
        client: "New Client",
        amount: "₹1.00 L",
        status: "Draft",
        date: new Date().toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
      });
      toast.success("Draft quotation created");
    } else if (view === "Invoicing") {
      store.addInvoice({
        client: "New Client",
        amount: "₹1.00 L",
        status: "Draft",
        due: new Date(Date.now() + 14 * 864e5).toLocaleDateString("en-IN", { month: "short", day: "2-digit" }),
      });
      toast.success("Draft invoice created");
    } else if (view === "Task Management") {
      store.addTask(companyKey, {
        name: `New task ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`,
        owner: "You",
        due: "Today",
        status: "Pending",
      });
      toast.success("Task added");
    } else if (view === "Automations") {
      toast("Automation builder coming soon");
    } else {
      toast(`New ${view} — form coming soon`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
            {company.name} · Module
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-1">{view}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {moduleBlurb(view)}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onExport} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50">
            <Download className="size-3.5" /> Export
          </button>
          <button onClick={onNew} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
            <Plus className="size-3.5" /> New
          </button>
        </div>
      </div>
      {renderModuleBody(view, company, companyKey)}
    </div>
  );
}

function moduleBlurb(view: string) {
  const map: Record<string, string> = {
    "CRM": "Unified customer records · contacts · accounts · engagement history",
    "Lead Management": "Capture · qualify · auto-assign · nurture",
    "Sales Pipeline": "Stages · forecasts · deal velocity",
    "Quotations": "Draft · approve · send · convert to invoice",
    "Invoicing": "Recurring · one-off · payment reminders automated",
    "Customer Portal": "Self-service · statements · support tickets",
    "Task Management": "Assign · due dates · approval workflows",
    "Project Management": "Phases · milestones · resource allocation",
    "Document Management": "Contracts · policies · version-controlled storage",
    "Notifications": "Realtime activity across every module",
    "Analytics & Reporting": "Executive KPIs · trends · exportable dashboards",
    "Roles & Permissions": "Granular RBAC · least-privilege enforcement",
    "Automations": "Rules · triggers · scheduled workflows",
    "Settings": "Company profile · integrations · billing",
  };
  return map[view] ?? "Business module scoped to the selected company";
}

function renderModuleBody(view: string, company: any, companyKey: string) {
  switch (view) {
    case "CRM":
      return <CRMView company={company} companyKey={companyKey} />;
    case "Lead Management":
      return <LeadsView company={company} companyKey={companyKey} />;
    case "Sales Pipeline":
      return <PipelineView company={company} companyKey={companyKey} />;
    case "Quotations":
      return <QuotationsView />;
    case "Invoicing":
      return <InvoicingView />;
    case "Customer Portal":
      return <CustomerPortalView company={company} />;
    case "Task Management":
      return <TasksView company={company} companyKey={companyKey} />;
    case "Project Management":
      return <ProjectsView />;
    case "Document Management":
      return <DocumentsView />;
    case "Notifications":
      return <NotificationsView company={company} />;
    case "Analytics & Reporting":
      return <AnalyticsView company={company} />;
    case "Roles & Permissions":
      return <RolesView />;
    case "Automations":
      return <AutomationsView />;
    case "Settings":
      return <SettingsView company={company} companyKey={companyKey} />;
    default:
      return <IndustryView view={view} company={company} />;
  }
}


// Quick action controls attached to every lead row: one-tap call and one-tap
// stage cycle. The intent is to update leads without opening the detail panel.
function leadKeyOf(l: any) { return `${l.name}::${l.camp ?? ""}`; }

function QuickCallButton({ lead, companyKey, companyName }: { lead: any; companyKey: string; companyName: string }) {
  const store = useAppStore();
  const [open, setOpen] = useState(false);
  const key = leadKeyOf(lead);
  const logs = store.callLogs.filter((c) => c.leadKey === key);
  const last = logs[0];
  const handle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    store.logCall({ leadKey: key, name: lead.name, phone: lead.phone, company: companyName });
    const currentStage = store.leadStages[companyKey]?.[key] ?? lead.stage;
    if (currentStage === "New") store.setLeadStage(companyKey, key, "Contacted");
    toast.success(`Calling ${lead.name}`, { description: lead.phone });
    setOpen(true);
  };

  const handleDisposition = (disposition: string, note: string, duration: number, temperature: string, callbackHours: number | null) => {
    // Update the last call log with disposition and temperature
    const lastLog = store.callLogs.find((c) => c.leadKey === key);
    if (lastLog) {
      store.updateCallDisposition(key, lastLog.at, disposition as CallDisposition, note, temperature as "Hot" | "Warm" | "Cold");
    }

    // Schedule callback if user selected a time
    if (callbackHours) {
      store.scheduleCallback({
        leadKey: key,
        name: lead.name,
        phone: lead.phone,
        company: companyName,
        scheduledAt: new Date(Date.now() + callbackHours * 3600000).toISOString(),
        note: note || `Callback in ${callbackHours}h`,
      });
      toast.success("Callback scheduled", { description: `${lead.name} in ${callbackHours}h` });
    }

    // Run call automations based on disposition
    const enabledRules = store.callRules.filter((r) => r.enabled);

    enabledRules.forEach((rule) => {
      if (rule.trigger === "after_call") {
        if (rule.action === "create_task") {
          store.addTask(companyKey, {
            name: `Follow up: ${lead.name} [${temperature}]`,
            owner: "You",
            due: temperature === "Hot" ? "Today" : "Tomorrow",
            status: "Pending",
          });
          toast.success("Auto-created follow-up task", { description: lead.name });
        }
        if (rule.action === "send_sms" && rule.config.disposition === disposition) {
          const msg = (rule.config.template || "Thanks for your time, {name}!")
            .replace("{name}", lead.name.split(" ")[0])
            .replace("{company}", companyName);
          toast.success("WhatsApp sent", { description: msg.slice(0, 60) + "…" });
        }
        if (rule.action === "advance_stage") {
          const currentStage = store.leadStages[companyKey]?.[key] ?? lead.stage;
          if (currentStage === (rule.config.fromStage || "New")) {
            store.setLeadStage(companyKey, key, (rule.config.toStage || "Contacted") as LeadStage);
          }
        }
      }
      if (rule.trigger === "no_answer" && disposition === "No Answer") {
        if (rule.action === "schedule_callback") {
          const delayHrs = parseInt(rule.config.delayHours || "4", 10);
          store.scheduleCallback({
            leadKey: key,
            name: lead.name,
            phone: lead.phone,
            company: companyName,
            scheduledAt: new Date(Date.now() + delayHrs * 3600000).toISOString(),
            note: rule.config.note || `Auto-scheduled: no answer after ${duration}s call`,
          });
          toast.success("Callback scheduled", { description: `${lead.name} in ${delayHrs}h` });
        }
      }
    });

    store.bumpUnread();
  };

  return (
    <>
      <button
        onClick={handle}
        title={last ? `Last called ${new Date(last.at).toLocaleString()}` : `Call ${lead.name}`}
        className="relative inline-flex size-8 items-center justify-center rounded-md bg-[#34A853] text-white hover:bg-[#2c8f46] transition-colors shadow-sm"
        aria-label={`Call ${lead.name}`}
      >
        <Phone className="size-3.5" />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-zinc-900 text-white text-[9px] font-bold grid place-items-center ring-2 ring-white">
            {logs.length}
          </span>
        )}
      </button>
      <CallDialog
        open={open}
        onClose={() => setOpen(false)}
        name={lead.name}
        phone={lead.phone || "+91 00000 00000"}
        company={companyName}
        photo={lead.photo || lead.avatar || `https://i.pravatar.cc/240?u=${encodeURIComponent(lead.name)}`}
        onDisposition={handleDisposition}
      />
    </>
  );
}

function QuickStageChip({ lead, companyKey }: { lead: any; companyKey: string }) {
  const store = useAppStore();
  const key = leadKeyOf(lead);
  const override = store.leadStages[companyKey]?.[key];
  const isOverride = Boolean(override);
  const stage = (override ?? lead.stage) as string;
  const tone = isOverride && (LEAD_STAGES as readonly string[]).includes(stage)
    ? LEAD_STAGE_TONE[stage as LeadStage]
    : lead.stageTone;
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => store.cycleLeadStage(companyKey, key, stage)}
        title="Click to advance stage"
        className={`inline-flex items-center text-[10px] font-semibold px-2 py-1 rounded-none ring-1 ${tone} hover:opacity-90`}
      >
        {stage}
      </button>
      <select
        value={(LEAD_STAGES as readonly string[]).includes(stage) ? stage : ""}
        onChange={(e) => store.setLeadStage(companyKey, key, e.target.value as LeadStage)}
        className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5 text-zinc-600 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
        aria-label="Set stage"
      >
        <option value="" disabled>Set…</option>
        {LEAD_STAGES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
  );
}


function Panel({ title, subtitle, children }: any) {
  return (
    <section className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-zinc-200">
          {title && <h3 className="text-sm font-semibold">{title}</h3>}
          {subtitle && <p className="text-[11px] text-zinc-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </section>
  );
}

function CRMView({ company, companyKey }: any) {
  return (
    <Panel title="Contacts & Accounts" subtitle="All customer records for this company · click phone to call, stage chip to advance">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
              <th className="px-6 py-3">Contact</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Account</th>
              <th className="px-6 py-3">Stage</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-950/5">
            {company.leads.map((l: any) => (
              <tr key={l.name} className="hover:bg-zinc-50/60">
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/80?u=${encodeURIComponent(l.name)}`} alt={l.name} className="size-9 rounded-full object-cover ring-1 ring-zinc-200 shrink-0" />
                    <p className="text-sm font-medium">{l.name}</p>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-xs text-zinc-700">{l.email}</td>
                <td className="px-6 py-3.5 text-xs text-zinc-700">{l.phone}</td>
                <td className="px-6 py-3.5 text-xs font-mono text-zinc-600">{l.camp}</td>
                <td className="px-6 py-3.5">
                  <QuickStageChip lead={l} companyKey={companyKey} />
                </td>
                <td className="px-6 py-3.5 text-right">
                  <QuickCallButton lead={l} companyKey={companyKey} companyName={company.name} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------
// Editable Lead Management (Zoho-style detail with inline editing)
// ------------------------------------------------------------------
type FullLead = {
  id: string;
  owner: string;
  name: string;
  title: string;
  company: string;
  email: string;
  secondaryEmail: string;
  phone: string;
  mobile: string;
  fax: string;
  website: string;
  source: string;
  industry: string;
  revenue: string;
  employees: string;
  rating: string;
  status: string;
  emailOptOut: boolean;
  skype: string;
  twitter: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  description: string;
  createdBy: string;
  createdAt: string;
  modifiedBy: string;
  modifiedAt: string;
  avatar: string;
  cover: string;
  notes: { id: string; author: string; text: string; time: string }[];
  attachments: { id: string; name: string; size: string }[];
  openActivities: { id: string; title: string; due: string }[];
  closedActivities: { id: string; title: string; when: string }[];
};

// Real photos — deterministic by seed via pravatar (portraits) and Unsplash (covers)
const avatarFor = (seed: string) =>
  `https://i.pravatar.cc/200?u=${encodeURIComponent(seed)}`;
const COVER_POOL = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1581091012184-7c9c05e0e2a3?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&q=80&auto=format&fit=crop",
];
const coverFor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return COVER_POOL[h % COVER_POOL.length];
};
const seedLeads = (company: any): FullLead[] =>
  company.leads.map((l: any, i: number): FullLead => ({
    id: `LD-${1000 + i}`,
    owner: "Saurav Mbuskar",
    name: l.name,
    title: ["VP Accounting", "Director of Ops", "CFO", "Procurement Head"][i % 4],
    company: l.camp,
    email: l.email,
    secondaryEmail: "",
    phone: l.phone,
    mobile: l.phone.replace(/.$/, "9"),
    fax: "",
    website: `https://www.${(l.camp || "example").toLowerCase().replace(/[^a-z]/g, "") || "example"}.com`,
    source: ["Cold Call", "Website", "Referral", "Facebook Ads"][i % 4],
    industry: ["Service Provider", "Manufacturing", "Retail", "Real Estate"][i % 4],
    revenue: ["Rs. 8,50,000.00", "Rs. 12,40,000.00", "Rs. 22,00,000.00", "Rs. 5,60,000.00"][i % 4],
    employees: ["25", "120", "48", "300"][i % 4],
    rating: ["Hot", "Warm", "Cold", "Acquired"][i % 4],
    status: l.stage,
    emailOptOut: false,
    skype: l.name.toLowerCase().replace(/\s/g, "-"),
    twitter: l.name.toLowerCase().replace(/\s/g, "") + "_lead",
    street: ["37275 St Rt 17m M", "42 Harbor Drive", "18 Maple Ave", "1201 King St"][i % 4],
    city: ["Middle Island", "Cambridge", "Austin", "Vancouver"][i % 4],
    state: ["NY", "MA", "TX", "BC"][i % 4],
    zip: ["11953", "02139", "78701", "V6B"][i % 4],
    country: "United States",
    description: l.message,
    createdBy: "Saurav Mbuskar",
    createdAt: "Sun, 28 Jun 2026 07:16 PM",
    modifiedBy: "Saurav Mbuskar",
    modifiedAt: "Sun, 28 Jun 2026 07:16 PM",
    avatar: avatarFor(l.name),
    cover: coverFor(l.camp || l.name),
    notes: i === 0
      ? [{ id: "n1", author: "Saurav", text: "Initial discovery call scheduled.", time: "2h ago" }]
      : [],
    attachments: [],
    openActivities: i < 2 ? [{ id: "a1", title: "Follow-up call", due: "Tomorrow 10:00 AM" }] : [],
    closedActivities: [],
  }));

function Field({ label, value, onChange, type = "text", multiline = false }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="group grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-zinc-200 hover:bg-zinc-50/50 px-2 -mx-2 rounded">
      <label className="text-xs font-medium text-zinc-500 pt-1">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            className="text-sm bg-white ring-1 ring-blue-400 rounded px-2 py-1 outline-none min-h-[60px]"
          />
        ) : (
          <input
            autoFocus
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => setEditing(false)}
            onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
            className="text-sm bg-white ring-1 ring-blue-400 rounded px-2 py-1 outline-none"
          />
        )
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="text-sm text-zinc-800 cursor-text py-1 rounded hover:bg-white hover:ring-1 hover:ring-zinc-200 px-2 -mx-2 min-h-[28px] whitespace-pre-wrap"
        >
          {value || <span className="text-zinc-400 italic">Click to add…</span>}
        </div>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <div className="group grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-zinc-200 hover:bg-zinc-50/50 px-2 -mx-2 rounded">
      <label className="text-xs font-medium text-zinc-500 pt-1">{label}</label>
      <select
        value={options.includes(value) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm text-zinc-800 bg-white border border-zinc-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 cursor-pointer hover:border-zinc-300"
      >
        {!options.includes(value) && <option value="">{value || "Select…"}</option>}
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function LeadDetail({ lead, onUpdate, onBack }: {
  lead: FullLead; onUpdate: (patch: Partial<FullLead>) => void; onBack: () => void;
}) {
  const [showDetails, setShowDetails] = useState(true);
  const [newNote, setNewNote] = useState("");
  const set = (k: keyof FullLead) => (v: string) => onUpdate({ [k]: v } as any);

  const addNote = () => {
    if (!newNote.trim()) return;
    onUpdate({
      notes: [
        { id: `n${Date.now()}`, author: lead.owner, text: newNote, time: "just now" },
        ...lead.notes,
      ],
    });
    setNewNote("");
  };

  const addAttachment = () => {
    const name = prompt("Attachment name (e.g. proposal.pdf)");
    if (!name) return;
    onUpdate({
      attachments: [
        ...lead.attachments,
        { id: `a${Date.now()}`, name, size: `${Math.floor(Math.random() * 900 + 100)} KB` },
      ],
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
        <div className="h-24 sm:h-28 relative" style={{ background: `url(${lead.cover}) center/cover, linear-gradient(135deg,#0f172a,#334155)` }}>
          <button onClick={onBack} className="absolute top-3 left-3 text-xs font-medium bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/10 shadow-sm">
            ← Back to Leads
          </button>
          <div className="absolute top-3 right-3 flex gap-2">
            <button className="text-xs font-medium bg-white/90 hover:bg-white px-3 py-1.5 rounded-lg ring-1 ring-black/10 shadow-sm">Send Email</button>
            <button className="text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 px-3 py-1.5 rounded-lg shadow-sm">Convert</button>
          </div>
        </div>
        <div className="px-4 sm:px-6 pb-5 pt-4 flex flex-col sm:flex-row sm:items-end gap-4">
          <img src={lead.avatar} alt={lead.name} className="size-20 rounded-2xl ring-4 ring-white bg-white shadow-md object-cover -mt-14 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold tracking-tight truncate">{lead.name}</h2>
            <p className="text-xs text-zinc-500 truncate">{lead.title} · {lead.company}</p>
          </div>
          <div>
            <span className="inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-md ring-1 bg-amber-50 text-amber-700 ring-amber-200">
              {lead.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border-t border-zinc-200">
          {[
            { l: "Lead Owner", k: "owner" as const, type: "text" },
            { l: "Email", k: "email" as const, type: "email" },
            { l: "Phone", k: "phone" as const, type: "tel" },
            { l: "Mobile", k: "mobile" as const, type: "tel" },
            { l: "Lead Status", k: "status" as const, type: "select" },
          ].map((f, i) => (
            <div key={f.k} className={`p-4 border-zinc-200 ${i < 4 ? "md:border-r" : ""} ${i % 2 === 0 ? "border-r md:border-r" : ""} ${i < 3 ? "border-b md:border-b-0" : i === 3 ? "border-b md:border-b-0" : ""}`}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{f.l}</p>
              {f.type === "select" ? (
                <select
                  value={LEAD_STATUS_OPTIONS.includes(lead[f.k] as string) ? (lead[f.k] as string) : ""}
                  onChange={(e) => onUpdate({ [f.k]: e.target.value } as any)}
                  className="text-sm font-medium text-zinc-800 mt-1 bg-transparent w-full outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 cursor-pointer border border-zinc-200 h-8"
                >
                  {!LEAD_STATUS_OPTIONS.includes(lead[f.k] as string) && <option value="">{lead[f.k] as string}</option>}
                  {LEAD_STATUS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={lead[f.k] as string}
                  onChange={(e) => onUpdate({ [f.k]: e.target.value } as any)}
                  className="text-sm font-medium text-zinc-800 mt-1 bg-transparent w-full outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 rounded px-1 -mx-1 truncate"
                />
              )}
            </div>
          ))}
        </div>
      </div>


      <div className="flex items-center justify-between">
        <button onClick={() => setShowDetails((v) => !v)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {showDetails && (
        <>
          <Panel title="Lead Information" subtitle="Click any field to edit">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 p-6">
              <div>
                <Field label="Lead Owner" value={lead.owner} onChange={set("owner")} />
                <SelectField label="Title" value={lead.title} onChange={set("title")} options={TITLE_OPTIONS} />
                <Field label="Phone" value={lead.phone} onChange={set("phone")} />
                <Field label="Mobile" value={lead.mobile} onChange={set("mobile")} />
                <SelectField label="Lead Source" value={lead.source} onChange={set("source")} options={LEAD_SOURCE_OPTIONS} />
                <SelectField label="Industry" value={lead.industry} onChange={set("industry")} options={INDUSTRY_OPTIONS} />
                <Field label="Annual Revenue" value={lead.revenue} onChange={set("revenue")} />
                <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 border-b border-zinc-200 px-2 -mx-2">
                  <label className="text-xs font-medium text-zinc-500 pt-1">Email Opt Out</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={lead.emailOptOut} onChange={(e) => onUpdate({ emailOptOut: e.target.checked })} className="rounded" />
                    <span className="text-sm">{lead.emailOptOut ? "Yes" : "No"}</span>
                  </label>
                </div>
                <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 px-2 -mx-2">
                  <label className="text-xs font-medium text-zinc-500 pt-1">Modified By</label>
                  <div className="text-sm">
                    <p className="font-medium">{lead.modifiedBy}</p>
                    <p className="text-xs text-zinc-500">{lead.modifiedAt}</p>
                  </div>
                </div>
              </div>
              <div>
                <Field label="Company" value={lead.company} onChange={set("company")} />
                <Field label="Lead Name" value={lead.name} onChange={set("name")} />
                <Field label="Email" value={lead.email} onChange={set("email")} type="email" />
                <Field label="Fax" value={lead.fax} onChange={set("fax")} />
                <Field label="Website" value={lead.website} onChange={set("website")} />
                <SelectField label="Lead Status" value={lead.status} onChange={set("status")} options={LEAD_STATUS_OPTIONS} />
                <SelectField label="No. of Employees" value={lead.employees} onChange={set("employees")} options={EMPLOYEE_RANGE_OPTIONS} />
                <SelectField label="Rating" value={lead.rating} onChange={set("rating")} options={RATING_OPTIONS} />
                <div className="grid grid-cols-[160px_1fr] gap-3 py-2.5 px-2 -mx-2">
                  <label className="text-xs font-medium text-zinc-500 pt-1">Created By</label>
                  <div className="text-sm">
                    <p className="font-medium">{lead.createdBy}</p>
                    <p className="text-xs text-zinc-500">{lead.createdAt}</p>
                  </div>
                </div>
              </div>
              <div>
                <Field label="Skype ID" value={lead.skype} onChange={set("skype")} />
                <Field label="Secondary Email" value={lead.secondaryEmail} onChange={set("secondaryEmail")} type="email" />
              </div>
              <div>
                <Field label="Twitter" value={lead.twitter} onChange={set("twitter")} />
              </div>
            </div>
          </Panel>

          <Panel title="Address Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 p-6">
              <Field label="Street" value={lead.street} onChange={set("street")} />
              <Field label="City" value={lead.city} onChange={set("city")} />
              <SelectField label="State" value={lead.state} onChange={set("state")} options={lead.country === "India" ? STATE_OPTIONS_INDIA : STATE_OPTIONS_US} />
              <Field label="Zip Code" value={lead.zip} onChange={set("zip")} />
              <SelectField label="Country" value={lead.country} onChange={set("country")} options={COUNTRY_OPTIONS} />
            </div>
          </Panel>

          <Panel title="Description Information">
            <div className="p-6">
              <Field label="Description" value={lead.description} onChange={set("description")} multiline />
            </div>
          </Panel>

          <Panel title="Notes" subtitle="Recent last">
            <div className="p-6 space-y-3">
              <div className="flex gap-2">
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                  placeholder="Add a note…"
                  className="flex-1 text-sm rounded-lg ring-1 ring-zinc-200 focus:ring-blue-400 outline-none px-3 py-2"
                />
                <button onClick={addNote} className="text-xs font-semibold bg-zinc-900 text-white px-4 rounded-lg hover:bg-zinc-800">Add</button>
              </div>
              {lead.notes.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No notes yet</p>
              ) : (
                <ul className="space-y-2">
                  {lead.notes.map((n) => (
                    <li key={n.id} className="rounded-lg bg-amber-50/60 ring-1 ring-amber-100 p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold">{n.author}</p>
                        <p className="text-[10px] text-zinc-500">{n.time}</p>
                      </div>
                      <p className="text-sm mt-1">{n.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <Panel title="Attachments">
            <div className="p-6 space-y-3">
              <button onClick={addAttachment} className="text-xs font-semibold bg-white ring-1 ring-zinc-200 hover:ring-zinc-300 px-3 py-1.5 rounded-lg">
                + Attach File
              </button>
              {lead.attachments.length === 0 ? (
                <p className="text-xs text-zinc-400 italic">No Attachment</p>
              ) : (
                <ul className="divide-y divide-zinc-100 ring-1 ring-zinc-100 rounded-lg">
                  {lead.attachments.map((a) => (
                    <li key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-medium">{a.name}</span>
                      <span className="text-xs text-zinc-500">{a.size}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Open Activities">
              <div className="p-6">
                {lead.openActivities.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No records found</p>
                ) : (
                  <ul className="space-y-2">
                    {lead.openActivities.map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-lg ring-1 ring-zinc-100 px-3 py-2">
                        <span className="text-sm font-medium">{a.title}</span>
                        <span className="text-xs text-zinc-500">{a.due}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
            <Panel title="Closed Activities">
              <div className="p-6">
                {lead.closedActivities.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic">No records found</p>
                ) : (
                  <ul className="space-y-2">
                    {lead.closedActivities.map((a) => (
                      <li key={a.id} className="flex items-center justify-between rounded-lg ring-1 ring-zinc-100 px-3 py-2">
                        <span className="text-sm font-medium">{a.title}</span>
                        <span className="text-xs text-zinc-500">{a.when}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Panel>
          </div>

          <CallHistoryPanel leadName={lead.name} leadCompany={lead.company} />
        </>
      )}
    </div>
  );
}

// ─── Call History Panel (per-lead) ────────────────────────────────────────
function CallHistoryPanel({ leadName, leadCompany }: { leadName: string; leadCompany: string }) {
  const store = useAppStore();
  // Match call logs by name (handles both lead keys like "Name::Camp" and dialer keys)
  const logs = store.callLogs.filter((c) =>
    c.name.includes(leadName) || c.leadKey.includes(leadName)
  );

  const TEMP_BADGE: Record<string, string> = {
    Hot: "bg-red-100 text-red-700",
    Warm: "bg-amber-100 text-amber-700",
    Cold: "bg-blue-100 text-blue-700",
  };

  return (
    <Panel title="Call History" subtitle={`${logs.length} call${logs.length !== 1 ? "s" : ""} recorded for this lead`}>
      <div className="p-6">
        {logs.length === 0 ? (
          <div className="text-center py-6">
            <Phone className="size-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-xs text-zinc-400 italic">No calls recorded yet</p>
            <p className="text-[10px] text-zinc-400 mt-1">Use the call button to start logging calls for this lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log, i) => (
              <div key={i} className="rounded-lg ring-1 ring-zinc-200 p-3 hover:bg-zinc-50/50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                      <Phone className="size-3.5 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{log.phone}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(log.at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {log.temperature && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${TEMP_BADGE[log.temperature] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {log.temperature === "Hot" ? "🔥" : log.temperature === "Cold" ? "❄️" : "☀️"} {log.temperature}
                      </span>
                    )}
                    {log.disposition && (
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ring-1 ${(DISPOSITION_TONE as any)[log.disposition] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                        {log.disposition}
                      </span>
                    )}
                  </div>
                </div>
                {log.note && (
                  <p className="text-[11px] text-zinc-600 mt-2 pl-10">{log.note}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}

function LeadsView({ company, companyKey }: any) {
  const [leads, setLeads] = useState<FullLead[]>(() => seedLeads(company));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const seedKey = company.name as string;
  const [lastKey, setLastKey] = useState(seedKey);
  if (lastKey !== seedKey) {
    setLastKey(seedKey);
    setLeads(seedLeads(company));
    setSelectedId(null);
  }

  const selected = leads.find((l) => l.id === selectedId) || null;

  const updateLead = (patch: Partial<FullLead>) => {
    if (!selected) return;
    setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, ...patch, modifiedAt: "Just now" } : l)));
  };

  if (selected) {
    return <LeadDetail lead={selected} onUpdate={updateLead} onBack={() => setSelectedId(null)} />;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {["New", "Qualified", "Proposal", "Won"].map((s, i) => (
          <div key={s} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <p className="text-xs text-zinc-500 font-medium">{s}</p>
            <p className="text-2xl font-bold tracking-tight mt-2">{[128, 46, 22, 18][i]}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">Auto-assigned</p>
          </div>
        ))}
      </div>
      <Panel title="Lead Management" subtitle="Click any row to open & edit the full lead record">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {leads.map((l) => {
                const rowLead = { name: l.name, camp: l.company, phone: l.phone, stage: l.status, stageTone: "bg-[#FBBC05] text-white ring-[#FBBC05]/30" };
                return (
                <tr key={l.id} className="hover:bg-zinc-50/80">
                  <td className="px-6 py-3.5 cursor-pointer" onClick={() => setSelectedId(l.id)}>
                    <div className="flex items-center gap-3">
                      <img src={l.avatar} alt={l.name} className="size-9 rounded-full ring-1 ring-zinc-200 bg-white object-cover" />
                      <div>
                        <p className="text-sm font-medium">{l.name}</p>
                        <p className="text-[11px] text-zinc-500">{l.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-xs font-mono text-zinc-600 cursor-pointer" onClick={() => setSelectedId(l.id)}>{l.company}</td>
                  <td className="px-6 py-3.5 text-xs text-zinc-700">{l.email}</td>
                  <td className="px-6 py-3.5 text-xs text-zinc-700">{l.phone}</td>
                  <td className="px-6 py-3.5 text-xs text-zinc-600">{l.source}</td>
                  <td className="px-6 py-3.5">
                    <QuickStageChip lead={rowLead} companyKey={companyKey} />
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <QuickCallButton lead={rowLead} companyKey={companyKey} companyName={company.name} />
                      <button
                        onClick={() => setSelectedId(l.id)}
                        className="inline-flex h-8 items-center px-2 rounded-md text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                      >
                        Open
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function PipelineView({ company, companyKey }: any) {
  const store = useAppStore();
  const [pipeline, setPipeline] = useState<Record<string, any[]>>(() => {
    const map: Record<string, any[]> = {};
    company.pipeline.forEach((s: any) => { map[s.stage] = []; });
    company.leads.forEach((l: any, i: number) => {
      const stage = store.leadStages[companyKey]?.[leadKeyOf(l)] ?? l.stage;
      const target = Object.keys(map).includes(stage) ? stage : Object.keys(map)[0];
      map[target] = [...(map[target] ?? []), l];
    });
    return map;
  });

  const onDragStart = (e: React.DragEvent, lead: any, fromStage: string) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ lead, fromStage }));
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (toStage: string) => (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const { lead, fromStage } = JSON.parse(e.dataTransfer.getData("application/json"));
      if (fromStage === toStage) return;
      setPipeline((prev) => {
        const updated = { ...prev };
        updated[fromStage] = (updated[fromStage] ?? []).filter((l: any) => leadKeyOf(l) !== leadKeyOf(lead));
        updated[toStage] = [...(updated[toStage] ?? []), lead];
        return updated;
      });
      const key = leadKeyOf(lead);
      const stageMap: Record<string, LeadStage> = { "New": "New", "Qualified": "Qualified", "Proposal": "Proposal", "Negotiation": "Negotiation", "Won": "Won" };
      if (stageMap[toStage]) {
        store.setLeadStage(companyKey, key, stageMap[toStage]);
      }
      toast.success(`${lead.name} → ${toStage}`);
    } catch {}
  };

  const stages = company.pipeline.map((s: any) => s.stage);
  const stageColors = ["bg-[#4285F4]", "bg-[#FBBC05]", "bg-[#F29900]", "bg-[#EA4335]", "bg-[#34A853]"];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {stages.map((stage: string, i: number) => {
        const leads = pipeline[stage] ?? [];
        const stageData = company.pipeline.find((s: any) => s.stage === stage);
        return (
          <div
            key={stage}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop(stage)}
            className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 space-y-3 min-h-[200px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${stageColors[i % stageColors.length]}`} />
                <p className="text-xs font-semibold">{stage}</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">{leads.length}</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">{stageData?.value ?? "—"}</p>
            {leads.map((l: any) => (
              <div
                key={leadKeyOf(l)}
                draggable
                onDragStart={(e) => onDragStart(e, l, stage)}
                className="rounded-xl border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:border-zinc-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <img src={`https://i.pravatar.cc/40?u=${encodeURIComponent(l.name)}`} alt="" className="size-6 rounded-full" />
                  <p className="text-xs font-medium truncate">{l.name}</p>
                </div>
                <p className="text-[10px] text-zinc-500 truncate mt-1">{l.camp} · {l.phone}</p>
              </div>
            ))}
            {leads.length === 0 && (
              <p className="text-[11px] text-zinc-400 italic text-center py-4">Drop leads here</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function QuotationsView() {
  const store = useAppStore();
  return (
    <Panel title="Quotations" subtitle="Click a status to cycle · trash to delete">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
              <th className="px-6 py-3">Quote ID</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-950/5">
            {store.quotations.map((q) => (
              <tr key={q.id} className="hover:bg-zinc-50/60">
                <td className="px-6 py-3.5 text-xs font-mono">{q.id}</td>
                <td className="px-6 py-3.5 text-sm font-medium">{q.client}</td>
                <td className="px-6 py-3.5 text-sm font-mono">{q.amount}</td>
                <td className="px-6 py-3.5 text-xs text-zinc-500">{q.date}</td>
                <td className="px-6 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => store.cycleQuotation(q.id)}
                      className={`inline-flex text-[10px] font-semibold px-2 py-1 rounded-md ring-1 ${QUOTE_TONE[q.status]} hover:opacity-80`}
                      title="Click to advance status"
                    >
                      {q.status}
                    </button>
                    <select
                      value={q.status}
                      onChange={(e) => store.setQuotationStatus(q.id, e.target.value as any)}
                      className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5 text-zinc-600 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                      aria-label="Set status"
                    >
                      {(["Draft", "Sent", "Awaiting Approval", "Approved"] as const).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-6 py-3.5 text-right">
                  <button
                    onClick={() => { store.deleteQuotation(q.id); toast.success("Deleted"); }}
                    className="text-[11px] text-zinc-400 hover:text-rose-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {store.quotations.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-zinc-500">No quotations. Use New to add one.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function InvoicingView() {
  const store = useAppStore();
  const totals = useMemo(() => {
    let outstanding = 0, paid = 0, overdue = 0;
    for (const i of store.invoices) {
      const n = parseAmount(i.amount);
      if (i.status === "Paid") paid += n;
      else outstanding += n;
      if (i.status === "Overdue") overdue += n;
    }
    return { outstanding, paid, overdue };
  }, [store.invoices]);
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { l: "Outstanding", v: formatAmount(totals.outstanding), tone: "text-amber-600" },
          { l: "Paid (MTD)", v: formatAmount(totals.paid), tone: "text-emerald-600" },
          { l: "Overdue", v: formatAmount(totals.overdue), tone: "text-rose-600" },
        ].map((k) => (
          <div key={k.l} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <p className="text-xs text-zinc-500 font-medium">{k.l}</p>
            <p className={`text-2xl font-bold tracking-tight mt-2 ${k.tone}`}>{k.v}</p>
          </div>
        ))}
      </div>
      <Panel title="Invoices" subtitle="Click a status to cycle · trash to delete">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {store.invoices.map((i) => (
                <tr key={i.id} className="hover:bg-zinc-50/60">
                  <td className="px-6 py-3.5 text-xs font-mono">{i.id}</td>
                  <td className="px-6 py-3.5 text-sm font-medium">{i.client}</td>
                  <td className="px-6 py-3.5 text-sm font-mono">{i.amount}</td>
                  <td className="px-6 py-3.5 text-xs text-zinc-500">{i.due}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => store.cycleInvoice(i.id)}
                        className={`inline-flex text-[10px] font-semibold px-2 py-1 rounded-md ring-1 ${INV_TONE[i.status]} hover:opacity-80`}
                        title="Click to advance status"
                      >
                        {i.status}
                      </button>
                      <select
                        value={i.status}
                        onChange={(e) => store.setInvoiceStatus(i.id, e.target.value as any)}
                        className="text-[10px] bg-white border border-zinc-200 rounded px-1 py-0.5 text-zinc-600 hover:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 cursor-pointer"
                        aria-label="Set status"
                      >
                        {(["Draft", "Sent", "Paid", "Overdue"] as const).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button
                      onClick={() => { store.deleteInvoice(i.id); toast.success("Deleted"); }}
                      className="text-[11px] text-zinc-400 hover:text-rose-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {store.invoices.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-xs text-zinc-500">No invoices. Use New to add one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

// Parse "₹23.6 L" / "₹3.42 Cr" into rupees. Returns 0 for other formats.
function parseAmount(s: string): number {
  const m = /₹\s*([\d.]+)\s*(L|Cr|K)?/i.exec(s);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "cr") return n * 1e7;
  if (unit === "l") return n * 1e5;
  if (unit === "k") return n * 1e3;
  return n;
}
function formatAmount(n: number): string {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  if (n >= 1e3) return `₹${(n / 1e3).toFixed(1)} K`;
  return `₹${n.toFixed(0)}`;
}


function CustomerPortalView({ company }: any) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Record<string, { id: string; subject: string; status: string }[]>>({});

  const createTicket = (name: string) => {
    const subject = prompt("Ticket subject:");
    if (!subject) return;
    setTickets((prev) => ({
      ...prev,
      [name]: [
        { id: `TKT-${Date.now().toString(36).toUpperCase()}`, subject, status: "Open" },
        ...(prev[name] ?? []),
      ],
    }));
    toast.success("Ticket created");
  };

  const closeTicket = (name: string, id: string) => {
    setTickets((prev) => ({
      ...prev,
      [name]: (prev[name] ?? []).map((t) => t.id === id ? { ...t, status: "Closed" } : t),
    }));
    toast.success("Ticket closed");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {company.leads.map((l: any) => {
          const isExpanded = expanded === l.name;
          const leadTickets = tickets[l.name] ?? [];
          return (
            <div key={l.name} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
              <div className="p-5">
                <div className="flex items-center gap-3">
                  <img src={`https://i.pravatar.cc/80?u=${encodeURIComponent(l.name)}`} alt={l.name} className="size-11 rounded-full ring-1 ring-zinc-200 object-cover" />
                  <div>
                    <p className="text-sm font-semibold">{l.name}</p>
                    <p className="text-[11px] text-zinc-500">{l.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                  <div><p className="text-[10px] text-zinc-500">Invoices</p><p className="text-sm font-bold">4</p></div>
                  <div><p className="text-[10px] text-zinc-500">Tickets</p><p className="text-sm font-bold">{leadTickets.length || 1}</p></div>
                  <div><p className="text-[10px] text-zinc-500">Docs</p><p className="text-sm font-bold">12</p></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : l.name)}
                    className="flex-1 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                  >
                    {isExpanded ? "Close" : "Open portal"}
                  </button>
                  <button
                    onClick={() => createTicket(l.name)}
                    className="py-2 px-3 text-xs font-semibold rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50"
                  >
                    + Ticket
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div className="border-t border-zinc-200 p-4 bg-zinc-50 space-y-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Contact Info</p>
                    <div className="text-xs space-y-1">
                      <p><span className="text-zinc-500">Phone:</span> {l.phone}</p>
                      <p><span className="text-zinc-500">Email:</span> {l.email}</p>
                      <p><span className="text-zinc-500">Account:</span> {l.camp}</p>
                      <p><span className="text-zinc-500">Stage:</span> {l.stage}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Support Tickets</p>
                    {leadTickets.length === 0 ? (
                      <p className="text-[11px] text-zinc-400 italic">No tickets yet</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {leadTickets.map((t) => (
                          <li key={t.id} className="flex items-center justify-between bg-white rounded-lg ring-1 ring-zinc-200 px-3 py-2">
                            <div>
                              <p className="text-xs font-medium">{t.subject}</p>
                              <p className="text-[10px] text-zinc-500">{t.id}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${t.status === "Open" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {t.status}
                              </span>
                              {t.status === "Open" && (
                                <button onClick={() => closeTicket(l.name, t.id)} className="text-[10px] text-zinc-500 hover:text-zinc-900">Close</button>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">Last Activity</p>
                    <p className="text-xs text-zinc-600">{l.message}</p>
                    <p className="text-[10px] text-zinc-400 mt-1">{l.time}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TasksView({ company, companyKey }: any) {
  const store = useAppStore();
  const cols: TaskStatus[] = ["Pending", "In Progress", "On Track", "Blocked"];
  const onDrop = (status: TaskStatus) => (e: React.DragEvent) => {
    e.preventDefault();
    const name = e.dataTransfer.getData("text/plain");
    if (name) store.setTaskStatus(companyKey, name, status);
  };
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cols.map((c) => (
        <div
          key={c}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop(c)}
          className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 space-y-3 min-h-40"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold">{c}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${TASK_TONE[c]}`}>
              {company.tasks.filter((t: any) => t.status === c).length}
            </span>
          </div>
          {company.tasks.filter((t: any) => t.status === c).map((t: any) => (
            <div
              key={t.name}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("text/plain", t.name)}
              onClick={() => {
                const idx = cols.indexOf(c);
                store.setTaskStatus(companyKey, t.name, cols[(idx + 1) % cols.length]);
              }}
              className="rounded-xl border border-zinc-200 p-3 cursor-grab active:cursor-grabbing hover:border-zinc-300"
              title="Drag to another column or click to advance"
            >
              <p className="text-xs font-medium">{t.name}</p>
              <p className="text-[10px] text-zinc-500 mt-1">{t.owner} · {t.due}</p>
            </div>
          ))}
          {company.tasks.filter((t: any) => t.status === c).length === 0 && (
            <p className="text-[11px] text-zinc-400 italic">Drop tasks here</p>
          )}
        </div>
      ))}
    </div>
  );
}


const projectsData = [
  { name: "Skyline Tower Launch", phase: "Execution", progress: 62, owner: "Real Estate" },
  { name: "Term 3 Admissions", phase: "Planning", progress: 28, owner: "Education" },
  { name: "Harbor HVAC Rollout", phase: "Execution", progress: 74, owner: "Facilities" },
  { name: "Consolidated ERP Integration", phase: "Discovery", progress: 12, owner: "Group IT" },
];

function ProjectsView() {
  const [projects, setProjects] = useState(projectsData);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", phase: "Planning", owner: "" });

  const addProject = () => {
    if (!draft.name.trim()) { toast.error("Project name required"); return; }
    setProjects((prev) => [...prev, { name: draft.name.trim(), phase: draft.phase, progress: 0, owner: draft.owner.trim() || "Unassigned" }]);
    setDraft({ name: "", phase: "Planning", owner: "" });
    setAddOpen(false);
    toast.success("Project created");
  };

  const deleteProject = (name: string) => {
    setProjects((prev) => prev.filter((p) => p.name !== name));
    toast.success("Project deleted");
  };

  const updateProgress = (name: string, delta: number) => {
    setProjects((prev) => prev.map((p) => p.name === name ? { ...p, progress: Math.max(0, Math.min(100, p.progress + delta)) } : p));
  };

  const cyclePhase = (name: string) => {
    const phases = ["Discovery", "Planning", "Execution", "Review", "Complete"];
    setProjects((prev) => prev.map((p) => {
      if (p.name !== name) return p;
      const idx = phases.indexOf(p.phase);
      return { ...p, phase: phases[(idx + 1) % phases.length] };
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
          <Plus className="size-3.5" /> New Project
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
          <p className="text-sm font-semibold">New Project</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Project name" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            <select value={draft.phase} onChange={(e) => setDraft({ ...draft, phase: e.target.value })} className="h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10">
              {["Discovery", "Planning", "Execution", "Review"].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={draft.owner} onChange={(e) => setDraft({ ...draft, owner: e.target.value })} placeholder="Owner / team" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div className="flex gap-2">
            <button onClick={addProject} className="text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Create</button>
            <button onClick={() => setAddOpen(false)} className="text-xs font-semibold px-4 py-2 rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((p) => (
          <div key={p.name} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{p.owner}</p>
              </div>
              <button onClick={() => deleteProject(p.name)} className="text-[11px] text-zinc-400 hover:text-rose-600">Delete</button>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => cyclePhase(p.name)} className="text-[10px] font-semibold px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700" title="Click to advance phase">
                {p.phase}
              </button>
              <span className="text-xs font-mono font-semibold ml-auto">{p.progress}%</span>
            </div>
            <div className="h-2 bg-zinc-100 rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${p.progress >= 100 ? "bg-emerald-500" : "bg-zinc-900"}`} style={{ width: `${p.progress}%` }} />
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button onClick={() => updateProgress(p.name, -10)} className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200">−10%</button>
              <button onClick={() => updateProgress(p.name, 10)} className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200">+10%</button>
              <button onClick={() => updateProgress(p.name, 100 - p.progress)} className="text-[10px] font-semibold px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700">Complete</button>
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <p className="text-xs text-zinc-500 italic col-span-2 text-center py-8">No projects. Click New Project to start.</p>
        )}
      </div>
    </div>
  );
}

const docsData = [
  { name: "Master Services Agreement.pdf", size: "1.2 MB", updated: "2h ago" },
  { name: "Q3 Board Deck.key", size: "18.4 MB", updated: "1d ago" },
  { name: "Vendor SLA — Harbor.docx", size: "412 KB", updated: "3d ago" },
  { name: "Fee Structure Term 3.xlsx", size: "228 KB", updated: "5d ago" },
  { name: "Skyline Brochure v4.pdf", size: "6.8 MB", updated: "1w ago" },
  { name: "Employee Handbook.pdf", size: "3.1 MB", updated: "2w ago" },
];

function DocumentsView() {
  const [docs, setDocs] = useState(docsData);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ name: "", size: "" });

  const addDoc = () => {
    if (!draft.name.trim()) { toast.error("File name required"); return; }
    setDocs((prev) => [{ name: draft.name.trim(), size: draft.size.trim() || "0 KB", updated: "Just now" }, ...prev]);
    setDraft({ name: "", size: "" });
    setAddOpen(false);
    toast.success("Document added");
  };

  const deleteDoc = (name: string) => {
    setDocs((prev) => prev.filter((d) => d.name !== name));
    toast.success("Document deleted");
  };

  const downloadDoc = (name: string) => {
    const blob = new Blob([`[Simulated content of ${name}]`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${name}`);
  };

  const renameDoc = (oldName: string) => {
    const newName = prompt("Rename to:", oldName);
    if (!newName || newName === oldName) return;
    setDocs((prev) => prev.map((d) => d.name === oldName ? { ...d, name: newName, updated: "Just now" } : d));
    toast.success("Renamed");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
          <Plus className="size-3.5" /> Upload Document
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
          <p className="text-sm font-semibold">Add Document</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="File name (e.g. contract.pdf)" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            <input value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })} placeholder="Size (e.g. 2.4 MB)" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div className="flex gap-2">
            <button onClick={addDoc} className="text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Add</button>
            <button onClick={() => setAddOpen(false)} className="text-xs font-semibold px-4 py-2 rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50">Cancel</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {docs.map((d) => (
          <div key={d.name} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
            <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-zinc-100 grid place-items-center shrink-0">
                <FolderOpen className="size-4 text-zinc-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.name}</p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{d.size} · {d.updated}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
              <button onClick={() => downloadDoc(d.name)} className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700">
                <Download className="size-3 inline mr-1" />Download
              </button>
              <button onClick={() => renameDoc(d.name)} className="text-[10px] font-semibold px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700">Rename</button>
              <button onClick={() => deleteDoc(d.name)} className="text-[10px] font-semibold px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 ml-auto">Delete</button>
            </div>
          </div>
        ))}
        {docs.length === 0 && (
          <p className="text-xs text-zinc-500 italic col-span-3 text-center py-8">No documents. Click Upload Document to add one.</p>
        )}
      </div>
    </div>
  );
}

function NotificationsView({ company }: any) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const all = [...company.activity, ...company.activity].map((n: any, i: number) => ({ ...n, i }));
  const visible = all.filter((_, idx) => !dismissed.has(idx));

  const dismiss = (idx: number) => {
    setDismissed((prev) => new Set([...prev, idx]));
    toast.success("Notification dismissed");
  };

  const clearAll = () => {
    setDismissed(new Set(all.map((_, i) => i)));
    toast.success("All notifications cleared");
  };

  return (
    <Panel title="All Notifications" subtitle="Realtime · filtered to selected company">
      <div className="px-6 py-3 border-b border-zinc-200 flex items-center justify-between">
        <p className="text-xs text-zinc-500">{visible.length} notifications</p>
        <button onClick={clearAll} className="text-[11px] font-semibold text-zinc-500 hover:text-zinc-900">Clear all</button>
      </div>
      <div className="divide-y divide-zinc-950/5">
        {visible.length === 0 ? (
          <p className="px-6 py-8 text-center text-xs text-zinc-500 italic">All caught up — no notifications.</p>
        ) : (
          visible.map((n: any, idx: number) => (
            <div key={idx} className="px-6 py-4 flex items-start gap-3 group">
              <div className={`mt-1.5 size-2 rounded-full shrink-0 ${n.tone}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">{n.time}</span>
              <button
                onClick={() => dismiss(all.indexOf(n))}
                className="text-[10px] text-zinc-400 hover:text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ✕
              </button>
            </div>
          ))
        )}
      </div>
    </Panel>
  );
}

function AnalyticsView({ company }: any) {
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const store = useAppStore();

  // Lead source breakdown
  const sources = ["Website", "Referral", "Cold Call", "Facebook Ads", "Google Ads", "Events"];
  const sourceData = sources.map((s, i) => ({ source: s, count: Math.floor(20 + Math.random() * 80), conversion: `${(15 + i * 8).toFixed(1)}%` }));

  // Pipeline velocity
  const pipelineTotal = company.pipeline.reduce((a: number, s: any) => a + s.count, 0);
  const wonStage = company.pipeline.find((s: any) => s.stage === "Won" || s.stage === "Registered" || s.stage === "Enrolled" || s.stage === "Booked");
  const winRate = wonStage ? ((wonStage.count / pipelineTotal) * 100).toFixed(1) : "0";

  return (
    <>
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {company.kpis.map((k: any) => (
          <div key={k.label} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Win Rate" subtitle="Pipeline conversion">
          <div className="p-6 flex flex-col items-center">
            <div className="relative size-32">
              <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#34A853" strokeWidth="3" strokeDasharray={`${parseFloat(winRate)} 100`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold">{winRate}%</span>
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-3">{wonStage?.count ?? 0} won of {pipelineTotal} total</p>
          </div>
        </Panel>

        <Panel title="Pipeline Breakdown" subtitle="Leads per stage">
          <div className="p-6 space-y-3">
            {company.pipeline.map((s: any) => {
              const pct = pipelineTotal > 0 ? (s.count / pipelineTotal) * 100 : 0;
              return (
                <div key={s.stage}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{s.stage}</span>
                    <span className="text-zinc-500">{s.count} · {s.value}</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-900 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Lead Sources" subtitle="Acquisition channel performance">
          <div className="p-6 space-y-2">
            {sourceData.map((s) => (
              <div key={s.source} className="flex items-center justify-between py-1.5 border-b border-zinc-100 last:border-0">
                <span className="text-xs font-medium">{s.source}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">{s.count} leads</span>
                  <span className="text-[10px] font-semibold text-emerald-600">{s.conversion}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="12-Month Trend" subtitle={`Conversions · ${company.name} · click a bar to inspect`}>
        <div className="p-6">
          <div className="flex items-end gap-2 h-56">
            {company.chart.map((b: any, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full cursor-pointer" onClick={() => setSelectedMonth(i === selectedMonth ? null : i)}>
                <div className={`w-full rounded-t-md transition-colors ${i === selectedMonth ? "bg-[#4285F4]" : b.active ? "bg-zinc-900" : "bg-zinc-200 hover:bg-zinc-300"}`} style={{ height: `${b.v * 100}%` }} />
                <span className={`mt-2 text-[10px] font-semibold ${i === selectedMonth ? "text-[#4285F4]" : "text-zinc-400"}`}>{b.m}</span>
              </div>
            ))}
          </div>
          {selectedMonth !== null && (
            <div className="mt-4 p-3 rounded-lg bg-zinc-50 ring-1 ring-zinc-200">
              <p className="text-xs font-semibold">{company.chart[selectedMonth].m} — Conversion rate: {(company.chart[selectedMonth].v * 100).toFixed(0)}%</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Estimated deals closed: {Math.round(company.chart[selectedMonth].v * pipelineTotal)} · Revenue contribution: {formatAmount(company.chart[selectedMonth].v * 1e7)}
              </p>
            </div>
          )}
        </div>
      </Panel>

      <div className="flex justify-end">
        <button
          onClick={() => {
            downloadCSV(`${company.name.replace(/\s+/g, "_").toLowerCase()}_analytics.csv`, [
              ...company.kpis.map((k: any) => ({ metric: k.label, value: k.value, change: k.delta })),
              ...company.pipeline.map((p: any) => ({ metric: `Pipeline: ${p.stage}`, value: String(p.count), change: p.value })),
            ]);
            toast.success("Analytics exported");
          }}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50"
        >
          <Download className="size-3.5" /> Export Analytics
        </button>
      </div>
    </>
  );
}

const rolesData = [
  { role: "Super Admin", users: 2, scope: "All companies · full access" },
  { role: "Company Admin", users: 4, scope: "One company · full access" },
  { role: "Sales Manager", users: 8, scope: "CRM · Pipeline · Quotations" },
  { role: "Finance", users: 3, scope: "Invoicing · Reports" },
  { role: "Operations", users: 12, scope: "Tasks · Projects · Documents" },
  { role: "Viewer", users: 22, scope: "Read-only dashboards" },
];

function RolesView() {
  const [roles, setRoles] = useState(rolesData);
  const [addOpen, setAddOpen] = useState(false);
  const [draft, setDraft] = useState({ role: "", scope: "" });
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editScope, setEditScope] = useState("");

  const addRole = () => {
    if (!draft.role.trim()) { toast.error("Role name required"); return; }
    setRoles((prev) => [...prev, { role: draft.role.trim(), users: 0, scope: draft.scope.trim() || "Custom access" }]);
    setDraft({ role: "", scope: "" });
    setAddOpen(false);
    toast.success("Role created");
  };

  const deleteRole = (role: string) => {
    setRoles((prev) => prev.filter((r) => r.role !== role));
    toast.success("Role deleted");
  };

  const startEdit = (r: typeof rolesData[0]) => {
    setEditingRole(r.role);
    setEditScope(r.scope);
  };

  const saveEdit = (role: string) => {
    setRoles((prev) => prev.map((r) => r.role === role ? { ...r, scope: editScope } : r));
    setEditingRole(null);
    toast.success("Updated");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
          <Plus className="size-3.5" /> Add Role
        </button>
      </div>

      {addOpen && (
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
          <p className="text-sm font-semibold">New Role</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} placeholder="Role name" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            <input value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} placeholder="Scope / permissions" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div className="flex gap-2">
            <button onClick={addRole} className="text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Create</button>
            <button onClick={() => setAddOpen(false)} className="text-xs font-semibold px-4 py-2 rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50">Cancel</button>
          </div>
        </div>
      )}

      <Panel title="Roles & Permissions" subtitle="Role-based access control · click scope to edit · audit-logged">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-200">
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Users</th>
                <th className="px-6 py-3">Scope</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-950/5">
              {roles.map((r) => (
                <tr key={r.role} className="hover:bg-zinc-50/60">
                  <td className="px-6 py-3.5 text-sm font-semibold">{r.role}</td>
                  <td className="px-6 py-3.5 text-sm font-mono">{r.users}</td>
                  <td className="px-6 py-3.5">
                    {editingRole === r.role ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={editScope}
                          onChange={(e) => setEditScope(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(r.role)}
                          className="h-7 px-2 text-xs rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-400 flex-1"
                          autoFocus
                        />
                        <button onClick={() => saveEdit(r.role)} className="text-[10px] font-semibold text-emerald-600 hover:text-emerald-700">Save</button>
                        <button onClick={() => setEditingRole(null)} className="text-[10px] text-zinc-500 hover:text-zinc-700">Cancel</button>
                      </div>
                    ) : (
                      <span className="text-xs text-zinc-600 cursor-pointer hover:text-zinc-900" onClick={() => startEdit(r)}>{r.scope}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button onClick={() => deleteRole(r.role)} className="text-[11px] text-zinc-400 hover:text-rose-600">Delete</button>
                  </td>
                </tr>
              ))}
              {roles.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-xs text-zinc-500">No roles defined.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function AutomationsView() {
  const store = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [ruleAddOpen, setRuleAddOpen] = useState(false);
  const [newAuto, setNewAuto] = useState({ name: "", trigger: "", category: "general" as "general" | "call" });
  const [newRule, setNewRule] = useState({ name: "", trigger: "after_call" as any, action: "create_task" as any });
  const [callLogView, setCallLogView] = useState(false);
  const [callbackView, setCallbackView] = useState(false);

  const callAutomations = store.automations.filter((a) => a.category === "call");
  const generalAutomations = store.automations.filter((a) => a.category !== "call");
  const pendingCallbacks = store.scheduledCallbacks.filter((cb) => cb.status === "Pending");

  const addAutomation = () => {
    if (!newAuto.name.trim()) { toast.error("Name required"); return; }
    store.addAutomation({ name: newAuto.name.trim(), trigger: newAuto.trigger.trim() || "Manual", category: newAuto.category });
    setNewAuto({ name: "", trigger: "", category: "general" });
    setAddOpen(false);
    toast.success("Automation added");
  };

  const addRule = () => {
    if (!newRule.name.trim()) { toast.error("Name required"); return; }
    store.addCallRule({ name: newRule.name.trim(), trigger: newRule.trigger, action: newRule.action, config: {}, enabled: true });
    setNewRule({ name: "", trigger: "after_call", action: "create_task" });
    setRuleAddOpen(false);
    toast.success("Call rule added");
  };

  return (
    <div className="space-y-6">
      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase">Total Calls</p>
          <p className="text-2xl font-bold mt-1">{store.callLogs.length}</p>
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase">Pending Callbacks</p>
          <p className="text-2xl font-bold mt-1 text-amber-600">{pendingCallbacks.length}</p>
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase">Active Call Rules</p>
          <p className="text-2xl font-bold mt-1 text-emerald-600">{store.callRules.filter((r) => r.enabled).length}</p>
        </div>
        <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
          <p className="text-[10px] text-zinc-500 font-semibold uppercase">Active Automations</p>
          <p className="text-2xl font-bold mt-1">{store.automations.filter((a) => a.status === "Active").length}</p>
        </div>
      </div>

      {/* Tabs: Call Automations / Callbacks / Call Log / General */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setCallLogView(false); setCallbackView(false); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${!callLogView && !callbackView ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 hover:bg-zinc-50"}`}>
          <Zap className="size-3 inline mr-1" />Call Automations
        </button>
        <button onClick={() => { setCallbackView(true); setCallLogView(false); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${callbackView ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 hover:bg-zinc-50"}`}>
          <Phone className="size-3 inline mr-1" />Scheduled Callbacks ({pendingCallbacks.length})
        </button>
        <button onClick={() => { setCallLogView(true); setCallbackView(false); }} className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${callLogView ? "bg-zinc-900 text-white" : "bg-white ring-1 ring-zinc-200 hover:bg-zinc-50"}`}>
          <Activity className="size-3 inline mr-1" />Call Log ({store.callLogs.length})
        </button>
      </div>

      {/* Scheduled Callbacks */}
      {callbackView && (
        <Panel title="Scheduled Callbacks" subtitle="Upcoming callbacks from call automations">
          <div className="divide-y divide-zinc-200">
            {pendingCallbacks.length === 0 ? (
              <p className="px-6 py-8 text-center text-xs text-zinc-500 italic">No pending callbacks</p>
            ) : (
              pendingCallbacks.map((cb) => (
                <div key={cb.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="size-10 rounded-full bg-amber-100 grid place-items-center shrink-0">
                    <Phone className="size-4 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{cb.name}</p>
                    <p className="text-xs text-zinc-500">{cb.phone} · {cb.company}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{cb.note}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-zinc-600">{new Date(cb.scheduledAt).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</p>
                    <div className="flex gap-1 mt-1">
                      <button onClick={() => { store.completeCallback(cb.id); toast.success("Marked complete"); }} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200">Done</button>
                      <button onClick={() => { store.dismissCallback(cb.id); toast.success("Dismissed"); }} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 hover:bg-zinc-200">Skip</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      {/* Call Log */}
      {callLogView && (
        <Panel title="Call History" subtitle="All calls made from the dialer · latest first">
          <div className="divide-y divide-zinc-200">
            {store.callLogs.length === 0 ? (
              <p className="px-6 py-8 text-center text-xs text-zinc-500 italic">No calls yet. Use the dialer to make calls.</p>
            ) : (
              store.callLogs.slice(0, 50).map((log, i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-4">
                  <div className="size-9 rounded-full bg-zinc-100 grid place-items-center shrink-0">
                    <Phone className="size-3.5 text-zinc-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{log.name}</p>
                    <p className="text-[11px] text-zinc-500">{log.phone} · {log.company}</p>
                    {log.note && <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{log.note}</p>}
                  </div>
                  {log.temperature && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${log.temperature === "Hot" ? "bg-red-100 text-red-700" : log.temperature === "Cold" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
                      {log.temperature === "Hot" ? "🔥" : log.temperature === "Cold" ? "❄️" : "☀️"} {log.temperature}
                    </span>
                  )}
                  {log.disposition && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ring-1 ${(DISPOSITION_TONE as any)[log.disposition] ?? "bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
                      {log.disposition}
                    </span>
                  )}
                  <span className="text-[10px] text-zinc-400 font-mono shrink-0">{new Date(log.at).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" })}</span>
                </div>
              ))
            )}
          </div>
        </Panel>
      )}

      {/* Call Automation Rules */}
      {!callLogView && !callbackView && (
        <>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Call Automation Rules</h3>
            <button onClick={() => setRuleAddOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800">
              <Plus className="size-3.5" /> New Rule
            </button>
          </div>

          {ruleAddOpen && (
            <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
              <p className="text-sm font-semibold">New Call Automation Rule</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} placeholder="Rule name" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                <select value={newRule.trigger} onChange={(e) => setNewRule({ ...newRule, trigger: e.target.value })} className="h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10">
                  <option value="after_call">After call ends</option>
                  <option value="missed_call">Missed call</option>
                  <option value="no_answer">No answer</option>
                  <option value="callback_due">Callback due</option>
                  <option value="follow_up_overdue">Follow-up overdue</option>
                </select>
                <select value={newRule.action} onChange={(e) => setNewRule({ ...newRule, action: e.target.value })} className="h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10">
                  <option value="create_task">Create task</option>
                  <option value="send_sms">Send SMS/WhatsApp</option>
                  <option value="advance_stage">Advance lead stage</option>
                  <option value="notify">Send notification</option>
                  <option value="schedule_callback">Schedule callback</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addRule} className="text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Create</button>
                <button onClick={() => setRuleAddOpen(false)} className="text-xs font-semibold px-4 py-2 rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {store.callRules.map((rule) => (
              <div key={rule.id} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`size-10 rounded-lg grid place-items-center shrink-0 ${rule.enabled ? "bg-emerald-100" : "bg-zinc-100"}`}>
                      <Phone className={`size-4 ${rule.enabled ? "text-emerald-700" : "text-zinc-500"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{rule.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">When: {rule.trigger.replace(/_/g, " ")} → {rule.action.replace(/_/g, " ")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => store.toggleCallRule(rule.id)}
                      role="switch"
                      aria-checked={rule.enabled}
                      className={`relative h-6 w-11 rounded-full transition-colors ${rule.enabled ? "bg-[#34A853]" : "bg-zinc-300"}`}
                    >
                      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${rule.enabled ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <button onClick={() => { store.deleteCallRule(rule.id); toast.success("Deleted"); }} className="text-[11px] text-zinc-400 hover:text-rose-600">✕</button>
                  </div>
                </div>
                {Object.keys(rule.config).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1">
                    {Object.entries(rule.config).map(([k, v]) => (
                      <p key={k} className="text-[10px] text-zinc-500"><span className="font-medium text-zinc-700">{k}:</span> {v}</p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* General Automations section */}
          <div className="flex items-center justify-between mt-4">
            <h3 className="text-sm font-semibold">General Automations</h3>
            <button onClick={() => setAddOpen(true)} className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50">
              <Plus className="size-3.5" /> New
            </button>
          </div>

          {addOpen && (
            <div className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 space-y-3">
              <p className="text-sm font-semibold">New Automation</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input value={newAuto.name} onChange={(e) => setNewAuto({ ...newAuto, name: e.target.value })} placeholder="Automation name" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                <input value={newAuto.trigger} onChange={(e) => setNewAuto({ ...newAuto, trigger: e.target.value })} placeholder="Trigger (e.g. New lead)" className="h-9 px-3 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                <select value={newAuto.category} onChange={(e) => setNewAuto({ ...newAuto, category: e.target.value as any })} className="h-9 px-3 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10">
                  <option value="general">General</option>
                  <option value="call">Call</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={addAutomation} className="text-xs font-semibold px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Create</button>
                <button onClick={() => setAddOpen(false)} className="text-xs font-semibold px-4 py-2 rounded-lg ring-1 ring-zinc-200 hover:bg-zinc-50">Cancel</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...callAutomations, ...generalAutomations].map((a) => {
              const active = a.status === "Active";
              const isCall = a.category === "call";
              return (
                <div key={a.name} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`size-10 rounded-lg grid place-items-center shrink-0 ${isCall ? "bg-green-100" : "bg-zinc-100"}`}>
                        {isCall ? <Phone className="size-4 text-green-700" /> : <Zap className="size-4 text-zinc-700" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{a.name}</p>
                        <p className="text-[11px] text-zinc-500 mt-0.5">Trigger: {a.trigger}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => { store.toggleAutomation(a.name); toast.success(active ? "Paused" : "Activated"); }}
                        role="switch"
                        aria-checked={active}
                        className={`relative h-6 w-11 rounded-full transition-colors ${active ? "bg-[#34A853]" : "bg-zinc-300"}`}
                      >
                        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${active ? "left-[22px]" : "left-0.5"}`} />
                      </button>
                      <button onClick={() => { store.deleteAutomation(a.name); toast.success("Deleted"); }} className="text-[11px] text-zinc-400 hover:text-rose-600">✕</button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <p className={`text-[10px] font-semibold ${active ? "text-emerald-600" : "text-zinc-500"}`}>{a.status}</p>
                    {isCall && <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700">CALL</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsView({ company, companyKey }: any) {
  const store = useAppStore();
  const s = store.settings[companyKey] ?? { timezone: "Asia/Kolkata", currency: "INR" };
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Panel title="Company Profile" subtitle="Editable · saved locally to this session">
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Name</span>
            <span className="font-medium">{company.name}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Segment</span>
            <span className="font-medium">{company.kind}</span>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Timezone</span>
            <select
              value={s.timezone}
              onChange={(e) => store.updateSettings(companyKey, { timezone: e.target.value })}
              className="h-8 px-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {["Asia/Kolkata", "Asia/Dhaka", "Asia/Dubai", "Europe/London", "America/New_York"].map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-zinc-500">Currency</span>
            <select
              value={s.currency}
              onChange={(e) => store.updateSettings(companyKey, { currency: e.target.value })}
              className="h-8 px-2 rounded-lg border border-zinc-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {["INR", "USD", "EUR", "GBP", "AED"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button
            onClick={() => toast.success("Settings saved")}
            className="w-full mt-2 py-2 text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
          >
            Save changes
          </button>
        </div>
      </Panel>
      <Panel title="Security">
        <ul className="p-5 space-y-2.5 text-xs text-zinc-600">
          {["Role-based permissions enforced","Audit log active","Encrypted storage · backups verified","API keys rotated 4 days ago"].map((line) => (
            <li key={line} className="flex items-center gap-2"><Check className="size-3.5 text-emerald-600" /><span>{line}</span></li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}


function IndustryView({ view, company }: any) {
  const match = company.industry.find((m: any) => m.label === view);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  // Simulated KPIs per industry module
  const moduleKpis: Record<string, { label: string; value: string; delta: string }[]> = {
    "Real Estate": [
      { label: "Active Projects", value: "8", delta: "+2" },
      { label: "Units Sold (MTD)", value: "48", delta: "+22%" },
      { label: "Site Visits", value: "94", delta: "+11" },
    ],
    "Education Suite": [
      { label: "Admissions", value: "1,240", delta: "+18.6%" },
      { label: "Active Students", value: "3,842", delta: "+4.1%" },
      { label: "Fee Collection", value: "₹5.08 Cr", delta: "+9.2%" },
    ],
    "Facility Suite": [
      { label: "Sites Managed", value: "14", delta: "+1" },
      { label: "Open Ops", value: "42", delta: "-8" },
      { label: "SLA Compliance", value: "96.4%", delta: "+1.8%" },
    ],
    "Admissions": [
      { label: "Open Enquiries", value: "128", delta: "+14" },
      { label: "Tours Booked", value: "64", delta: "+8" },
      { label: "Conversion Rate", value: "32%", delta: "+3.2%" },
    ],
    "Student Management": [
      { label: "Total Students", value: "3,842", delta: "+4.1%" },
      { label: "Attendance Today", value: "96.2%", delta: "+0.4%" },
      { label: "Retention Rate", value: "94%", delta: "+1.2%" },
    ],
    "Fee Management": [
      { label: "Collected (Term)", value: "₹5.08 Cr", delta: "+9.2%" },
      { label: "Overdue", value: "₹39.8 L", delta: "-12%" },
      { label: "Collection Rate", value: "92.3%", delta: "+2.1%" },
    ],
    "Projects": [
      { label: "Active Launches", value: "8", delta: "+2" },
      { label: "Under Construction", value: "5", delta: "—" },
      { label: "Delivered", value: "3", delta: "+1" },
    ],
    "Property Inventory": [
      { label: "Total Units", value: "1,248", delta: "—" },
      { label: "Available", value: "312", delta: "-24" },
      { label: "Sold (MTD)", value: "48", delta: "+22%" },
    ],
    "Bookings": [
      { label: "Bookings (MTD)", value: "48", delta: "+22%" },
      { label: "Pending Agreements", value: "12", delta: "-3" },
      { label: "Registered", value: "36", delta: "+18%" },
    ],
    "Site Visits": [
      { label: "Scheduled", value: "94", delta: "+11" },
      { label: "Completed", value: "78", delta: "+9" },
      { label: "Conversion", value: "28%", delta: "+4.2%" },
    ],
    "Client Management": [
      { label: "Active Clients", value: "68", delta: "+3" },
      { label: "New (MTD)", value: "4", delta: "+1" },
      { label: "Avg Contract", value: "₹12.4 L", delta: "+8%" },
    ],
    "Service Operations": [
      { label: "Open Tickets", value: "42", delta: "-8" },
      { label: "Avg Resolution", value: "4.2 hrs", delta: "-12%" },
      { label: "SLA Compliance", value: "96.4%", delta: "+1.8%" },
    ],
    "Preventive Maintenance": [
      { label: "Scheduled", value: "18", delta: "+3" },
      { label: "Completed", value: "14", delta: "+2" },
      { label: "Overdue", value: "2", delta: "-1" },
    ],
  };

  const kpis = moduleKpis[view] ?? moduleKpis[match?.label ?? ""] ?? [];

  return (
    <div className="space-y-6">
      {kpis.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl ring-1 ring-zinc-950/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5">
              <p className="text-xs text-zinc-500 font-medium">{k.label}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                <span className="text-xs font-semibold text-emerald-600">{k.delta}</span>
              </div>
            </div>
          ))}
        </section>
      )}

      <Panel title={view} subtitle={match?.meta ?? `Industry module · ${company.name}`}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {company.industry.map((m: any) => {
            const isSelected = selectedModule === m.label;
            return (
              <div
                key={m.label}
                onClick={() => setSelectedModule(isSelected ? null : m.label)}
                className={`rounded-xl border p-4 cursor-pointer transition-all ${isSelected ? "border-zinc-900 ring-1 ring-zinc-900 bg-zinc-50" : "border-zinc-200 hover:border-zinc-300"}`}
              >
                <div className="size-9 rounded-lg bg-zinc-100 grid place-items-center mb-3">
                  <m.icon className="size-4 text-zinc-700" />
                </div>
                <p className="text-sm font-semibold">{m.label}</p>
                <p className="text-[11px] text-zinc-500 mt-1">{m.meta}</p>
                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-zinc-200 space-y-1">
                    {(moduleKpis[m.label] ?? []).map((k) => (
                      <div key={k.label} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-600">{k.label}</span>
                        <span className="font-semibold">{k.value} <span className="text-emerald-600 text-[10px]">{k.delta}</span></span>
                      </div>
                    ))}
                    {!moduleKpis[m.label] && <p className="text-[11px] text-zinc-400 italic">Module active</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel title="Recent Activity" subtitle={`Latest events in ${view}`}>
        <div className="divide-y divide-zinc-950/5">
          {company.activity.map((a: any, i: number) => (
            <div key={i} className="px-6 py-4 flex items-start gap-3">
              <div className={`mt-1.5 size-2 rounded-full shrink-0 ${a.tone}`} />
              <div className="flex-1">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{a.body}</p>
              </div>
              <span className="text-[11px] text-zinc-400 font-mono">{a.time}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
