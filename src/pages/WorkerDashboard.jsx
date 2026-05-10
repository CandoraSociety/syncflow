import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";

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

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            {isDawn ? "Service Navigator Dashboard" : "My Clients"}
          </h1>
          <p className="text-sm text-slate-500">Welcome, {user?.full_name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
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
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Name</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">HSID#</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Service</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Switches</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Program Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Emp. Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">CLB</th>
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Barrier 1</th>}
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Barrier 2</th>}
                      {isDawn && <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Barrier 3</th>}
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Post-Comp. Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Post-Comp. Emp. Start</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">90-Day Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Svc Nav</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Intake Date</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayed.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                          <Link to={`/client/${c.id}`} className="text-blue-700 hover:underline">
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
                        <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.employment_status || "—"}</td>
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