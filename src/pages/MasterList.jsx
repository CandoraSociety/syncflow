import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowRight } from "lucide-react";
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

const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "",
};

export default function MasterList() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");
  const [loading, setLoading] = useState(true);
  const [workers, setWorkers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.Client.list("-intake_date", 1000).then(data => {
      setClients(data);
      const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setLoading(false);
    });
  }, []);

  const displayed = applyFiltersAndSort(clients, search, filters, sortKey);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Master Client List</h1>
          <p className="text-sm text-slate-500">{displayed.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/intake")}>Intake</Button>
          <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>Reports</Button>
          <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}><LogOut className="w-4 h-4" /></Button>
        </div>
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
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Name</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">HSID#</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Intake Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Svc Start</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Service Element</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Switches</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Program Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Completion</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Emp. Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Emp. Start</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">90-Day Date</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">90-Day Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Svc Nav</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-600 whitespace-nowrap">Career Counsellor</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">
                      <Link to={`/client/${c.id}`} className="text-blue-700 hover:underline">{c.first_name} {c.last_name}</Link>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.compass_hsid || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.intake_date ? format(new Date(c.intake_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_start_date ? format(new Date(c.service_start_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{SERVICE_LABELS[c.service_type] || "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {c.program_stream_switches?.length > 0 ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                          {c.program_stream_switches.length} switch{c.program_stream_switches.length > 1 ? "es" : ""}
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
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.completion_date ? format(new Date(c.completion_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.employment_status || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.employment_start_date ? format(new Date(c.employment_start_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.followup_90day_date ? format(new Date(c.followup_90day_date), "MMM d, yy") : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs">{c.followup_90day_status || "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.service_navigation_supports ? "Yes" : "—"}</td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{c.assigned_worker_name || "—"}</td>
                    <td className="px-3 py-2.5">
                      <Link to={`/client/${c.id}`}><Button variant="outline" size="sm">Open</Button></Link>
                    </td>
                  </tr>
                ))}
                {displayed.length === 0 && (
                  <tr><td colSpan={15} className="text-center py-10 text-slate-400">No clients match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}