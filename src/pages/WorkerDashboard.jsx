import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, differenceInDays } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";

const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};

const PROGRAM_STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  incomplete: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const BARRIER_STATUS_COLORS = {
  unresolved: "text-red-600",
  in_progress: "text-amber-600",
  resolved: "text-green-600",
};

const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "",
};

export default function WorkerDashboard() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const allClients = await base44.entities.Client.list("-created_date", 1000);
      const isDawn = me.email === "Dawn.williston@candorasociety.com";
      const myClients = isDawn
        ? allClients.filter(c => c.barriers_addressed || c.assigned_worker === me.email)
        : allClients.filter(c => c.assigned_worker === me.email);
      setClients(myClients);
      setLoading(false);
    };
    init();
  }, []);

  const isDawn = user?.email === "Dawn.williston@candorasociety.com";
  const displayed = applyFiltersAndSort(clients, search, filters, sortKey);

  // Upcoming 90-day follow-ups (due within 14 days, not yet done)
  const upcomingFollowups = clients.filter(c => {
    if (c.followup_90day_status) return false; // already done
    const followupDate = c.followup_90day_date
      ? new Date(c.followup_90day_date)
      : c.completion_date
        ? addDays(new Date(c.completion_date), 90)
        : null;
    if (!followupDate) return false;
    const days = differenceInDays(followupDate, new Date());
    return days <= 14; // within 14 days (includes overdue)
  }).sort((a, b) => {
    const dateA = a.followup_90day_date || (a.completion_date ? format(addDays(new Date(a.completion_date), 90), "yyyy-MM-dd") : "");
    const dateB = b.followup_90day_date || (b.completion_date ? format(addDays(new Date(b.completion_date), 90), "yyyy-MM-dd") : "");
    return dateA.localeCompare(dateB);
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between" style={{ background: "hsl(231,64%,20%)" }}>
        <div>
          <h1 className="text-xl font-bold text-white">
            {isDawn ? "Service Navigator Dashboard" : "My Clients"}
          </h1>
          <p className="text-sm text-white/60">Welcome, {user?.full_name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-white/70 hover:text-white hover:bg-white/10">
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {clients.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No clients yet</p>
            <p className="text-sm mt-1">
              {isDawn ? "Clients with identified barriers will appear here." : "Clients assigned to you will appear here."}
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming 90-day follow-ups alert panel */}
            {upcomingFollowups.length > 0 && (
              <div className="mb-4 border border-amber-300 bg-amber-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
                  <span className="text-sm font-bold text-amber-800">Upcoming 90-Day Follow-Ups</span>
                  <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">{upcomingFollowups.length}</span>
                </div>
                <div className="space-y-2">
                  {upcomingFollowups.map(c => {
                    const followupDate = c.followup_90day_date
                      ? new Date(c.followup_90day_date)
                      : addDays(new Date(c.completion_date), 90);
                    const days = differenceInDays(followupDate, new Date());
                    const isOverdue = days < 0;
                    const isUrgent = days >= 0 && days <= 5;
                    return (
                      <div key={c.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${isOverdue ? "bg-red-50 border-red-300" : isUrgent ? "bg-amber-100 border-amber-300 animate-pulse" : "bg-white border-amber-200"}`}>
                        <div className="flex items-center gap-2">
                          <Bell className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                          <Link to={`/client/${c.id}`} className="font-semibold hover:underline" style={{ color: "hsl(231,64%,28%)" }}>
                            {c.first_name} {c.last_name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">Due: {format(followupDate, "MMM d, yyyy")}</span>
                          <span className={`font-bold px-2 py-0.5 rounded-full ${isOverdue ? "bg-red-100 text-red-700" : isUrgent ? "bg-amber-200 text-amber-800" : "bg-blue-100 text-blue-700"}`}>
                            {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today!" : `${days}d`}
                          </span>
                          <Link to={`/client/${c.id}`}><Button size="sm" variant="outline" className="text-xs h-6 px-2">Go to Client</Button></Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 text-slate-600 mb-2">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">{displayed.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}</span>
            </div>

            <ClientListControls
              search={search} onSearch={setSearch}
              filters={filters} onFilters={setFilters}
              sortKey={sortKey} onSort={setSortKey}
            />

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
                    <tr>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">CLB</th>
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 1</th>}
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 2</th>}
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 3</th>}
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Post-Comp. Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Post-Comp. Emp. Start</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayed.map(c => (
                      <tr key={c.id} className={`transition-colors ${clientRowColor(c)}`}>
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                          <Link to={`/client/${c.id}`} className="font-semibold hover:underline" style={{ color: "hsl(231,64%,28%)" }}>
                           {c.first_name} {c.last_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{SERVICE_LABELS[c.service_type] || "—"}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.program_stream_switches?.length > 0 ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              {c.program_stream_switches.length}×
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.program_status ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
                              {c.program_status.replace("_", " ")}
                            </span>
                          ) : "—"}
                        </td>

                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.clb_level?.replace("clb_", "CLB ").replace("native_english_french", "Native") || "—"}</td>
                        {isDawn && (
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {c.barrier_1 ? (
                              <span>
                                <span className="text-slate-700">{c.barrier_1}</span>
                                {c.barrier_1_status && <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_1_status] || ""}`}>({c.barrier_1_status})</span>}
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        {isDawn && (
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {c.barrier_2 ? (
                              <span>
                                <span className="text-slate-700">{c.barrier_2}</span>
                                {c.barrier_2_status && <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_2_status] || ""}`}>({c.barrier_2_status})</span>}
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        {isDawn && (
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {c.barrier_3 ? (
                              <span>
                                <span className="text-slate-700">{c.barrier_3}</span>
                                {c.barrier_3_status && <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_3_status] || ""}`}>({c.barrier_3_status})</span>}
                              </span>
                            ) : "—"}
                          </td>
                        )}
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.post_completion_employment_status || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.post_completion_employment_date ? format(new Date(c.post_completion_employment_date), "MMM d, yy") : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.followup_90day_status || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_navigation_supports ? "Yes" : "—"}</td>
                        <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{c.intake_date ? format(new Date(c.intake_date), "MMM d, yy") : "—"}</td>
                        <td className="px-3 py-2.5">
                          <Link to={`/client/${c.id}`}><Button variant="outline" size="sm">Open</Button></Link>
                        </td>
                      </tr>
                    ))}
                    {displayed.length === 0 && (
                      <tr><td colSpan={isDawn ? 16 : 13} className="text-center py-10 text-slate-400">No clients match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}