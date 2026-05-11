import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CRTClientData from "@/components/crt/CRTClientData";
import CRTOutcomes from "@/components/crt/CRTOutcomes";
import CRTFinancials from "@/components/crt/CRTFinancials";

export default function CRT() {
  const [clients, setClients] = useState([]);
  const [financials, setFinancials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("any");
  const [filterProgramStatus, setFilterProgramStatus] = useState("");
  const [filterEmploymentStatus, setFilterEmploymentStatus] = useState("");
  const [filterServiceType, setFilterServiceType] = useState("");
  const [filterWorker, setFilterWorker] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const DATE_FIELDS = [
    { value: "any", label: "Any date field" },
    { value: "intake_date", label: "Intake Date" },
    { value: "service_start_date", label: "Service Start Date" },
    { value: "completion_date", label: "Completion Date" },
    { value: "employment_start_date", label: "Employment Start Date" },
    { value: "post_completion_employment_date", label: "Post-Comp. Employment Date" },
    { value: "followup_90day_date", label: "90-Day Follow-Up Date" },
    { value: "closed_date", label: "File Closed Date" },
  ];

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-service_start_date", 1000),
      base44.entities.FinancialRecord.list("-date", 1000),
    ]).then(([c, f]) => {
      setClients(c);
      setFinancials(f);
      setLoading(false);
    });

    // Real-time updates
    const unsub1 = base44.entities.Client.subscribe(ev => {
      setClients(prev => {
        if (ev.type === "create") return [ev.data, ...prev];
        if (ev.type === "update") return prev.map(c => c.id === ev.id ? ev.data : c);
        if (ev.type === "delete") return prev.filter(c => c.id !== ev.id);
        return prev;
      });
    });
    const unsub2 = base44.entities.FinancialRecord.subscribe(ev => {
      setFinancials(prev => {
        if (ev.type === "create") return [ev.data, ...prev];
        if (ev.type === "update") return prev.map(r => r.id === ev.id ? ev.data : r);
        if (ev.type === "delete") return prev.filter(r => r.id !== ev.id);
        return prev;
      });
    });

    return () => { unsub1(); unsub2(); };
  }, []);

  const workers = [...new Set(clients.map(c => c.assigned_worker_name).filter(Boolean))].sort();

  const filteredClients = clients.filter(c => {
    // Date range filter
    if (dateFrom || dateTo) {
      const candidateDates = dateField === "any"
        ? [c.intake_date, c.service_start_date, c.completion_date, c.employment_start_date, c.post_completion_employment_date, c.followup_90day_date, c.closed_date].filter(Boolean)
        : [c[dateField]].filter(Boolean);

      if (candidateDates.length === 0) return false;

      const inRange = candidateDates.some(d =>
        (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo)
      );
      if (!inRange) return false;
    }

    if (filterProgramStatus && c.program_status !== filterProgramStatus) return false;
    if (filterEmploymentStatus && c.employment_status !== filterEmploymentStatus) return false;
    if (filterServiceType && c.service_type !== filterServiceType) return false;
    if (filterWorker && c.assigned_worker_name !== filterWorker) return false;
    return true;
  });

  const activeDateFilter = dateFrom || dateTo ? 1 : 0;
  const activeFilterCount = [filterProgramStatus, filterEmploymentStatus, filterServiceType, filterWorker].filter(Boolean).length + activeDateFilter;

  const clearAll = () => {
    setDateFrom(""); setDateTo(""); setDateField("any");
    setFilterProgramStatus(""); setFilterEmploymentStatus("");
    setFilterServiceType(""); setFilterWorker("");
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-screen-2xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">CRT — Client Reporting Tool</h1>
            <p className="text-sm text-slate-500">Live data formatted for GOA monthly reporting</p>
          </div>
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 h-8 px-3 rounded border text-sm font-medium transition-colors ${showFilters ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 8h10M11 12h2" /></svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center leading-none">{activeFilterCount}</span>
              )}
            </button>
            {activeFilterCount > 0 && (
              <button onClick={clearAll} className="text-xs text-slate-400 hover:text-red-500 underline">Clear all</button>
            )}
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2 py-1 rounded">
              {filteredClients.length} / {clients.length} clients
            </span>
          </div>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="max-w-screen-2xl mx-auto space-y-4">
            {/* Date range row — grouped visually */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Date Range</p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Date Field</label>
                  <select
                    className="h-8 border border-slate-200 rounded px-2 text-sm"
                    value={dateField}
                    onChange={e => setDateField(e.target.value)}
                  >
                    {DATE_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">From</label>
                  <input
                    type="date"
                    className="h-8 border border-slate-200 rounded px-2 text-sm"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">To</label>
                  <input
                    type="date"
                    className="h-8 border border-slate-200 rounded px-2 text-sm"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); setDateField("any"); }}
                    className="h-8 text-xs text-slate-400 hover:text-red-500 underline self-end mb-0.5"
                  >
                    Clear dates
                  </button>
                )}
              </div>
              {dateField !== "any" && (dateFrom || dateTo) && (
                <p className="text-xs text-blue-600 mt-1">
                  Filtering by <strong>{DATE_FIELDS.find(f => f.value === dateField)?.label}</strong>
                  {dateFrom && ` from ${dateFrom}`}{dateTo && ` to ${dateTo}`}
                </p>
              )}
            </div>

            {/* Other filters */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Other Filters</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Program Status</label>
                  <select
                    className="h-8 w-full border border-slate-200 rounded px-2 text-sm"
                    value={filterProgramStatus}
                    onChange={e => setFilterProgramStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="in_progress">In Progress</option>
                    <option value="complete">Complete</option>
                    <option value="incomplete">Incomplete</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Employment Status</label>
                  <select
                    className="h-8 w-full border border-slate-200 rounded px-2 text-sm"
                    value={filterEmploymentStatus}
                    onChange={e => setFilterEmploymentStatus(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="E-RF">E-RF</option>
                    <option value="E-UF">E-UF</option>
                    <option value="E-PT">E-PT</option>
                    <option value="UE">UE</option>
                    <option value="UE-LA">UE-LA</option>
                    <option value="UE-S">UE-S</option>
                    <option value="NA">NA</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-500">Service Element</label>
                  <select
                    className="h-8 w-full border border-slate-200 rounded px-2 text-sm"
                    value={filterServiceType}
                    onChange={e => setFilterServiceType(e.target.value)}
                  >
                    <option value="">All</option>
                    <option value="direct_to_employment">DEA</option>
                    <option value="pathways">Pathways</option>
                    <option value="casual">Casual</option>
                    <option value="external_referral">Ext. Referral</option>
                    <option value="internal_referral">Int. Referral</option>
                    <option value="not_eligible">Not Eligible</option>
                  </select>
                </div>
                {workers.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500">Career Counsellor</label>
                    <select
                      className="h-8 w-full border border-slate-200 rounded px-2 text-sm"
                      value={filterWorker}
                      onChange={e => setFilterWorker(e.target.value)}
                    >
                      <option value="">All</option>
                      {workers.map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <Tabs defaultValue="client-data">
          <TabsList className="mb-4">
            <TabsTrigger value="client-data">Client Data</TabsTrigger>
            <TabsTrigger value="outcomes">Outcomes Tracker</TabsTrigger>
            <TabsTrigger value="financials">Financial Records</TabsTrigger>
          </TabsList>

          <TabsContent value="client-data">
            <CRTClientData clients={filteredClients} />
          </TabsContent>
          <TabsContent value="outcomes">
            <CRTOutcomes clients={filteredClients} />
          </TabsContent>
          <TabsContent value="financials">
            <CRTFinancials clients={filteredClients} financials={financials} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}