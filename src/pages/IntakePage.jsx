import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import IntakeForm from "@/components/intake/IntakeForm";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DuplicateWarningDialog from "@/components/intake/DuplicateWarningDialog";
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

export default function IntakePage() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sortKey, setSortKey] = useState("intake_date_desc");
  const [workers, setWorkers] = useState([]);
  const [pendingData, setPendingData] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [clientList, userList] = await Promise.all([
        base44.entities.Client.list("-created_date", 1000),
        base44.entities.User.list()
      ]);
      setClients(clientList);
      setUsers(userList);
      const names = [...new Set(clientList.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(names);
      setLoading(false);
    };
    init();
  }, []);

  const findDuplicates = (data) => {
    return clients.filter(c => {
      if (editingClient && c.id === editingClient.id) return false;
      return (
        (data.email && c.email && data.email.toLowerCase() === c.email.toLowerCase()) ||
        (data.phone && c.phone && data.phone.replace(/\D/g, "") === c.phone.replace(/\D/g, "")) ||
        (data.compass_hsid && c.compass_hsid && data.compass_hsid === c.compass_hsid)
      );
    });
  };

  const handleSaveAttempt = (data) => {
    const found = findDuplicates(data);
    if (found.length > 0 && !editingClient) {
      setPendingData(data);
      setDuplicates(found);
    } else {
      doSave(data);
    }
  };

  const doSave = async (data) => {
    if (editingClient) {
      const updated = await base44.entities.Client.update(editingClient.id, data);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const created = await base44.entities.Client.create({ ...data, intake_date: new Date().toISOString().split("T")[0] });
      setClients(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditingClient(null);
    setPendingData(null);
    setDuplicates([]);
  };

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
          <h1 className="text-xl font-bold text-slate-800">Intake Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => navigate("/master")}>Master List</Button>
          {!showForm && (
            <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2">
              <PlusCircle className="w-4 h-4" /> New Client
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showForm ? (
          <IntakeForm
            client={editingClient}
            users={users}
            onSave={handleSaveAttempt}
            onCancel={() => { setShowForm(false); setEditingClient(null); }}
          />
        ) : (
          <>
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
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Name</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Phone</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Service</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Switches</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Program Status</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Career Counsellor</th>
                      <th className="text-left px-3 py-3 font-semibold text-slate-600">Intake Date</th>
                      <th className="px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayed.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium">
                          <Link to={`/client/${c.id}`} className="text-blue-700 hover:underline">
                            {c.first_name} {c.last_name}
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{c.compass_hsid || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{c.phone || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-600">{SERVICE_LABELS[c.service_type] || "—"}</td>
                        <td className="px-3 py-2.5">
                          {c.program_stream_switches?.length > 0 ? (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                              {c.program_stream_switches.length}×
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5">
                          {c.program_status ? (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
                              {c.program_status.replace("_", " ")}
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{c.assigned_worker_name || "—"}</td>
                        <td className="px-3 py-2.5 text-slate-500">{c.intake_date ? format(new Date(c.intake_date), "MMM d, yyyy") : "—"}</td>
                        <td className="px-3 py-2.5">
                          <Link to={`/client/${c.id}`}><Button variant="outline" size="sm">Open</Button></Link>
                        </td>
                      </tr>
                    ))}
                    {displayed.length === 0 && (
                      <tr><td colSpan={9} className="text-center py-10 text-slate-400">No clients match your filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>

      {duplicates.length > 0 && pendingData && (
        <DuplicateWarningDialog
          duplicates={duplicates}
          onConfirm={() => doSave(pendingData)}
          onCancel={() => { setPendingData(null); setDuplicates([]); }}
        />
      )}
    </div>
  );
}