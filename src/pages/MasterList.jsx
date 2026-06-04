import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { format } from "date-fns";
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

const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "", referral_source: "", residency_status: "",
  followup_90day_status: "",
};

function programStatusLabel(c) {
  if (c.program_status === "complete" && !c.followup_90day_status) return "Complete (Follow-Up Period)";
  if (c.program_status === "in_progress") return "In Progress";
  if (c.program_status === "complete") return "Complete";
  if (c.program_status === "incomplete") return "Incomplete";
  if (c.program_status === "cancelled") return "Cancelled";
  return c.program_status?.replace("_", " ") || null;
}

const CLOSED_REASON_LABELS = {
  completed: "Completed", cancelled: "Cancelled", incomplete: "Incomplete",
  withdrew: "Withdrew", relocated: "Relocated", no_longer_eligible: "No Longer Eligible",
  no_contact: "No Contact", duplicate: "Duplicate", other: "Other",
};

export default function MasterList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Client.list("-intake_date", 1000).then(data => {
      setClients(data);
      const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setLoading(false);
    });
  }, []);

  const activeClients = clients.filter(c => !c.file_closed);
  const closedClients = clients.filter(c => c.file_closed);
  const sourceList = activeTab === "active" ? activeClients : closedClients;
  const displayed = applyFiltersAndSort(sourceList, search, filters, sortKey);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3" style={{ background: "hsl(231,64%,20%)" }}>
        <div>
          <h1 className="text-xl font-bold text-white">Master Client List</h1>
          <p className="text-sm text-white/60">{displayed.length} shown · {activeClients.length} active · {closedClients.length} closed</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => navigate("/intake")} style={{ background: "hsl(42,100%,54%)", color: "hsl(231,64%,16%)" }} className="font-semibold hover:opacity-90 border-0">Intake</Button>
          <Button size="sm" onClick={() => navigate("/reports")} variant="outline" className="border-white/30 text-white hover:bg-white/10">Reports</Button>
          <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()} className="text-white/70 hover:text-white hover:bg-white/10"><LogOut className="w-4 h-4" /></Button>
        </div>
      </div>
      {/* Active / Closed toggle */}
      <div className="bg-white border-b border-slate-200 px-6 flex gap-1 pt-1">
        <button
          onClick={() => setActiveTab("active")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "active" ? "text-[hsl(231,64%,20%)] font-semibold" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          style={activeTab === "active" ? { borderColor: "hsl(42,100%,54%)" } : {}}
        >
          Active Files
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded-full" style={{ background: "hsl(44,100%,88%)", color: "hsl(231,64%,20%)" }}>{activeClients.length}</span>
        </button>
        <button
          onClick={() => setActiveTab("closed")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "closed" ? "border-red-500 text-red-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Closed Files
          <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">{closedClients.length}</span>
        </button>
      </div>

      <div className="px-6 py-4">
        <ClientListControls
          search={search} onSearch={setSearch}
          filters={filters} onFilters={setFilters}
          sortKey={sortKey} onSort={setSortKey}
          workers={workers}
        />

        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service Element</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Start</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Completion</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Start Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
                  <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Career Counsellor</th>
                  {activeTab === "closed" && (
                    <>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Close Reason</th>
                      <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Closed Date</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map(c => (
                 <tr key={c.id} onClick={() => navigate(`/client/${c.id}`)} className={`transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}>
                   <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                     <span className="font-semibold" style={{ color: "hsl(231,64%,28%)" }}>{c.first_name} {c.last_name}</span>
                   </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.intake_date ? format(new Date(c.intake_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{SERVICE_LABELS[c.service_type] || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_start_date ? format(new Date(c.service_start_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.program_stream_switches?.length > 0 ? (
                        <div className="flex flex-col gap-0.5">
                          {c.program_stream_switches.map((sw, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
                                {SERVICE_LABELS[sw.from_stream] || sw.from_stream || "?"}
                              </span>
                              <span className="text-slate-400 text-xs">→</span>
                              <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
                                {SERVICE_LABELS[sw.to_stream] || sw.to_stream || "?"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.program_status ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
                          {programStatusLabel(c)}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                          Assessments / Action Plan Incomplete
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.completion_date ? format(new Date(c.completion_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.post_completion_employment_status || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.post_completion_employment_date ? format(new Date(c.post_completion_employment_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.followup_90day_date ? format(new Date(c.followup_90day_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.followup_90day_status || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_navigation_supports ? "Yes" : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.assigned_worker_name || "—"}</td>
                    {activeTab === "closed" && (
                      <>
                        <td className="px-3 py-2.5 whitespace-nowrap">
                          {c.closed_reason ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                              {CLOSED_REASON_LABELS[c.closed_reason] || c.closed_reason}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">
                          {c.closed_date ? format(new Date(c.closed_date), "MMM d, yy") : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={16} className="text-center py-10 text-slate-400">No clients match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}