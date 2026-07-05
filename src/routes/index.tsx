import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  FolderKanban,
  Users,
  Phone,
  Megaphone,
  Building2,
  Search,
  Plus,
  Bell,
  MoreHorizontal,
  ChevronDown,
  ArrowUpRight,
  FileText,
  Download,
  GripVertical,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Dashboard,
});

const navMain = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: MessageSquare, label: "Messages" },
  { icon: Inbox, label: "Inbox", badge: "9+" },
  { icon: FolderKanban, label: "Projects" },
  { icon: Users, label: "Groups" },
  { icon: Phone, label: "Contact" },
  { icon: Megaphone, label: "Campaigns" },
];

const departments = [
  { label: "Sales Department", color: "bg-amber-400" },
  { label: "Design Department", color: "bg-indigo-500" },
  { label: "Marketing Department", color: "bg-rose-400" },
];

const leads = [
  {
    name: "Shawon Black",
    time: "Today at 9:10 AM",
    email: "shawon@mailzone.io",
    phone: "(234) 555-0108",
    camp: "56728",
    message: "Don't miss out on the exclusive offer inside your dashboard.",
    initials: "SB",
    tone: "bg-orange-100 text-orange-700",
  },
  {
    name: "Kamrul Miles",
    time: "Today at 9:10 AM",
    email: "miles87@fastmail.net",
    phone: "(234) 555-0108",
    camp: "12131",
    message: "Special promo alert! Unlock savings on your next renewal today.",
    initials: "KM",
    tone: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Su Flores",
    time: "Today at 8:10 AM",
    email: "su.m@quickinbox.org",
    phone: "(234) 555-0108",
    camp: "15167",
    message: "It's celebration time! Enjoy discounts across every module.",
    initials: "SF",
    tone: "bg-indigo-100 text-indigo-700",
  },
  {
    name: "Ma Pena",
    time: "Today at 7:30 AM",
    email: "ma.p@inboxmail.com",
    phone: "(234) 555-0108",
    camp: "81922",
    message: "Attention shoppers! Big sale happening now across brands.",
    initials: "MP",
    tone: "bg-rose-100 text-rose-700",
  },
];

const notifications = [
  {
    title: "PRO mode activated",
    body: "As premium features are now enabled.",
    active: false,
  },
  {
    title: "New candidate added",
    body: "Alex Johnson has entered the Sales pipeline.",
    active: true,
  },
  {
    title: "Phase deadline soon",
    body: "Initial flow phase 3 ends in 2 hours.",
    active: false,
  },
  {
    title: "PRO mode activated",
    body: "As premium features are now available.",
    active: false,
  },
];

const sections = [
  { name: "Check customer", meta: "5m • 3 Questions" },
  { name: "Introduction", meta: "5m • 6 Questions" },
  { name: "Portfolio review", meta: "3m • 5 Questions" },
  { name: "Background Check", meta: "3m • 2 Questions" },
  { name: "Skill Assessment", meta: "12m • 8 Questions" },
];

// Bar chart: month, value 0-1, active flag
const chart = [
  { m: "JAN", v: 0.42 },
  { m: "FEB", v: 0.58 },
  { m: "MAR", v: 0.36 },
  { m: "APR", v: 0.48 },
  { m: "MAY", v: 0.55 },
  { m: "JUN", v: 0.62 },
  { m: "JUL", v: 0.92, active: true },
  { m: "AUG", v: 0.5 },
  { m: "SEP", v: 0.7 },
  { m: "OCT", v: 0.44 },
  { m: "NOV", v: 0.6 },
  { m: "DEC", v: 0.38 },
];

function Dashboard() {
  return (
    <div className="flex h-screen bg-[#f9f9f8] text-zinc-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 flex flex-col border-r border-zinc-950/5 bg-white">
        {/* Company switcher */}
        <div className="p-4 border-b border-zinc-950/5">
          <button className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-50 transition-colors">
            <div className="size-10 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-600 grid place-items-center text-white font-semibold text-sm shrink-0">
              ST
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider leading-none">
                Admin
              </span>
              <span className="text-sm font-semibold truncate mt-1">Sohan Talukder</span>
            </div>
            <ChevronDown className="size-4 text-zinc-400 ml-auto shrink-0" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navMain.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-zinc-100 text-zinc-900 font-medium"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <item.icon className="size-4 shrink-0" strokeWidth={item.active ? 2.25 : 1.75} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-400 text-zinc-900">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-6 pb-2 px-3 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              Departments
            </span>
            <Plus className="size-3 text-zinc-400" />
          </div>
          {departments.map((d) => (
            <button
              key={d.label}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 rounded-lg transition-colors"
            >
              <div className={`size-2 rounded-full ${d.color} shrink-0`} />
              <span className="truncate">{d.label}</span>
            </button>
          ))}
        </nav>

        {/* Upgrade */}
        <div className="p-4">
          <div className="relative overflow-hidden p-4 bg-zinc-900 rounded-2xl text-white">
            <div className="absolute -top-6 -right-6 size-24 rounded-full bg-white/5 blur-xl" />
            <p className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase leading-tight">
              You're now in
            </p>
            <p className="text-2xl font-bold tracking-tight mt-1">PRO MODE!</p>
            <p className="text-[11px] text-zinc-400 mt-2 leading-relaxed">
              Discount — 50% off for the first month.
            </p>
            <button className="mt-4 w-full bg-white text-zinc-900 text-xs font-semibold py-2 rounded-lg hover:bg-zinc-100 transition-colors">
              Upgrade
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 shrink-0 border-b border-zinc-950/5 bg-white/70 backdrop-blur flex items-center justify-between px-8">
          <h1 className="text-lg font-semibold tracking-tight">
            <span className="mr-1">👋</span> Good Evening, Sohan Talukder!
          </h1>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-sm text-zinc-600 font-medium px-3 py-2 rounded-lg hover:bg-zinc-50">
              English <ChevronDown className="size-3.5" />
            </button>
            <button className="size-9 rounded-lg bg-zinc-900 text-white grid place-items-center hover:bg-zinc-800 transition-colors">
              <Bell className="size-4" />
            </button>
            <button className="flex items-center gap-2 bg-zinc-900 text-white text-sm font-medium px-3.5 py-2 rounded-lg hover:bg-zinc-800 transition-colors">
              <Plus className="size-4" /> Add person
            </button>
          </div>
        </header>

        {/* Scroll body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-12 gap-6 p-6 lg:p-8">
            {/* Left column */}
            <div className="col-span-12 xl:col-span-8 space-y-6">
              {/* Lead Preview */}
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Lead Preview</h3>
                  <div className="flex items-center gap-3">
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1">
                      View All <ChevronDown className="size-3" />
                    </button>
                    <MoreHorizontal className="size-4 text-zinc-400" />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-950/5">
                        <th className="px-6 py-3 font-semibold">Profile</th>
                        <th className="px-6 py-3 font-semibold">Contact</th>
                        <th className="px-6 py-3 font-semibold">Camp ID</th>
                        <th className="px-6 py-3 font-semibold">Message</th>
                        <th className="px-6 py-3 font-semibold text-right">Option</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-950/5">
                      {leads.map((l) => (
                        <tr key={l.name} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <div
                                className={`size-9 rounded-full ${l.tone} grid place-items-center text-xs font-semibold ring-1 ring-black/5 shrink-0`}
                              >
                                {l.initials}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium">{l.name}</span>
                                <span className="text-[11px] text-zinc-500">{l.time}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col text-xs">
                              <span className="text-zinc-900">{l.email}</span>
                              <span className="text-zinc-500">{l.phone}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-xs font-medium text-zinc-600">
                            {l.camp}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-zinc-500 max-w-[240px] truncate">
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

              {/* Top conversation chart */}
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-semibold">Top conversation</h3>
                  <div className="flex items-center gap-2">
                    <button className="text-xs text-zinc-500 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-zinc-50">
                      Filter <ChevronDown className="size-3" />
                    </button>
                    <button className="text-xs text-zinc-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-200 hover:bg-zinc-50">
                      Last 10 days <ChevronDown className="size-3" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-6">
                  {/* Y axis */}
                  <div className="flex flex-col justify-between text-[10px] font-mono text-zinc-400 py-1 shrink-0 h-56">
                    <span>70k</span>
                    <span>60k</span>
                    <span>50k</span>
                    <span>40k</span>
                    <span>30k</span>
                    <span>20k</span>
                    <span>10k</span>
                    <span>0</span>
                  </div>

                  {/* Chart */}
                  <div className="flex-1">
                    <div className="relative h-56 flex items-end gap-2">
                      {chart.map((b, i) => (
                        <div
                          key={i}
                          className="flex-1 flex flex-col items-center justify-end h-full relative group"
                        >
                          {b.active && (
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full w-40 bg-zinc-900 text-white rounded-xl p-3 shadow-xl z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="size-6 rounded-full bg-amber-300 grid place-items-center text-[10px] font-bold text-zinc-900">
                                  AB
                                </div>
                                <span className="text-xs font-semibold">Alex Burg</span>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-400 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-amber-400" />
                                    Messages
                                  </span>
                                  <span className="font-mono font-semibold">30k</span>
                                </div>
                                <div className="flex justify-between text-[10px]">
                                  <span className="text-zinc-400 flex items-center gap-1.5">
                                    <span className="size-1.5 rounded-full bg-zinc-500" />
                                    Calls
                                  </span>
                                  <span className="font-mono font-semibold">5k</span>
                                </div>
                              </div>
                              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 size-3 bg-zinc-900 rotate-45" />
                            </div>
                          )}
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              b.active
                                ? "bg-zinc-900"
                                : "bg-zinc-100 group-hover:bg-zinc-200"
                            }`}
                            style={{ height: `${b.v * 100}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex mt-3 gap-2">
                      {chart.map((b) => (
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

              {/* KPI strip */}
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: "Active Leads", value: "842", delta: "+12.5%", tone: "text-emerald-600" },
                  { label: "Pipeline Value", value: "$1.24M", delta: "+8.2%", tone: "text-emerald-600" },
                  { label: "Overdue Invoices", value: "12", delta: "-4", tone: "text-rose-600" },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-5"
                  >
                    <p className="text-xs text-zinc-500 font-medium">{k.label}</p>
                    <div className="flex items-end justify-between mt-2">
                      <p className="text-2xl font-bold tracking-tight">{k.value}</p>
                      <span className={`text-xs font-semibold ${k.tone}`}>{k.delta}</span>
                    </div>
                  </div>
                ))}
              </section>

              {/* Modules */}
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold">Business Modules</h3>
                  <button className="text-xs text-zinc-500 hover:text-zinc-900 font-medium">
                    Manage
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { label: "Real Estate", meta: "8 projects", icon: Building2 },
                    { label: "Education", meta: "1,240 students", icon: FileText },
                    { label: "Facility Mgmt", meta: "14 sites", icon: LayoutDashboard },
                  ].map((m) => (
                    <button
                      key={m.label}
                      className="group flex items-center gap-3 p-4 rounded-xl border border-zinc-100 hover:border-zinc-300 hover:bg-zinc-50/50 transition-all text-left"
                    >
                      <div className="size-10 rounded-lg bg-zinc-100 grid place-items-center shrink-0">
                        <m.icon className="size-4 text-zinc-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{m.label}</p>
                        <p className="text-[11px] text-zinc-500">{m.meta}</p>
                      </div>
                      <ArrowUpRight className="size-4 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Right rail */}
            <div className="col-span-12 xl:col-span-4 space-y-6">
              {/* Departments filter card */}
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm">
                <div className="px-5 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">All Departments</span>
                    <ChevronDown className="size-3.5 text-zinc-400" />
                  </div>
                  <button className="flex items-center gap-1.5 text-xs text-zinc-600 font-medium px-2.5 py-1.5 rounded-md hover:bg-zinc-50">
                    <Download className="size-3.5" /> Export
                  </button>
                </div>
                <div className="p-3 space-y-1">
                  {notifications.map((n, i) => (
                    <button
                      key={i}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-colors ${
                        n.active
                          ? "bg-zinc-900 text-white"
                          : "hover:bg-zinc-50 text-zinc-900"
                      }`}
                    >
                      <div
                        className={`mt-0.5 size-2 rounded-full shrink-0 ${
                          n.active ? "bg-amber-400" : "bg-zinc-300"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold leading-tight">{n.title}</p>
                        <p
                          className={`text-[11px] mt-1 leading-relaxed ${
                            n.active ? "text-zinc-400" : "text-zinc-500"
                          }`}
                        >
                          {n.body}
                        </p>
                      </div>
                      <ArrowUpRight
                        className={`size-3.5 shrink-0 ${
                          n.active ? "text-white" : "text-zinc-300"
                        }`}
                      />
                    </button>
                  ))}
                  <div className="pt-2 flex items-center justify-between px-1">
                    <button className="flex-1 py-2.5 mr-2 text-center text-xs font-semibold bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                      See all notifications
                    </button>
                    <button className="text-xs font-medium text-zinc-500 hover:text-zinc-900 px-3 py-2">
                      Notes
                    </button>
                  </div>
                </div>
              </section>

              {/* Sections */}
              <section className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm">
                <div className="px-5 py-4 border-b border-zinc-950/5 flex items-center justify-between">
                  <span className="text-sm font-semibold">Sections</span>
                  <div className="flex items-center gap-1">
                    <button className="text-xs text-zinc-500 hover:text-zinc-900 px-2 py-1 rounded">
                      <Search className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="p-2 space-y-0.5">
                  {sections.map((s) => (
                    <div
                      key={s.name}
                      className="group flex items-center justify-between p-3 rounded-lg hover:bg-zinc-50 transition-colors cursor-grab"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{s.name}</p>
                        <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{s.meta}</p>
                      </div>
                      <GripVertical className="size-4 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                  <button className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg hover:bg-zinc-800 transition-colors">
                    <Plus className="size-3.5" /> Add Section
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
