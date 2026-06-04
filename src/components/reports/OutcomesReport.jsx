import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { FileBarChart, Play, Download } from "lucide-react";

const OUTCOME_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "service_type", label: "Service Stream" },
  { key: "service_start_date", label: "Service Start Date" },
  { key: "completion_date", label: "Completion Date" },
  { key: "program_status", label: "Program Status" },
  { key: "employment_start_date", label: "Employment Start Date" },
  { key: "employer_name", label: "Employer Name" },
  { key: "job_title", label: "Job Title" },
  { key: "job_wage", label: "Job Wage" },
  { key: "job_hours", label: "Job Hours/Week" },
  { key: "employment_status", label: "Employment Status" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date" },
  { key: "followup_90day_status", label: "90-Day Employment Status" },
  { key: "post_completion_employment_status", label: "Post-Completion Employment Status" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date" },
  { key: "assigned_worker_name", label: "Career Counsellor" },
  { key: "status", label: "Case Status" },
];

const DATE_FIELDS = [
  { key: "service_start_date", label: "Service Start Date" },
  { key: "completion_date", label: "Completion Date" },
  { key: "employment_start_date", label: "Employment Start Date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date" },
  { key: "intake_date", label: "Intake Date" },
];

const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};

function getDisplayValue(client, key) {
  const v = client[key];
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (key === "service_type") return SERVICE_LABELS[v] || v;
  if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try { return new Date(v).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }); } catch { return v; }
  }
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

export default function OutcomesReport() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState(["first_name", "last_name", "service_type", "completion_date", "employment_start_date", "followup_90day_status"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("completion_date");
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState(null);

  const orderedFields = selectedFields.map(k => OUTCOME_FIELDS.find(f => f.key === k)).filter(Boolean);

  useEffect(() => {
    base44.entities.Client.list("-completion_date", 1000).then(data => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const runReport = () => {
    let data = [...clients];
    
    // Apply stream filters
    if (filters.service_type && filters.service_type.length > 0) {
      data = data.filter(c => filters.service_type.includes(c.service_type));
    }

    // Apply date range filter
    if (dateFrom || dateTo) {
      data = data.filter(c => {
        const d = c[dateField];
        if (!d) return false;
        if (dateFrom && d < dateFrom) return false;
        if (dateTo && d > dateTo) return false;
        return true;
      });
    }
    
    setResults(data);
  };

  const exportCSV = () => {
    if (!results) return;
    const headers = selectedFields.map(k => OUTCOME_FIELDS.find(f => f.key === k)?.label || k);
    const rows = results.map(c => selectedFields.map(k => {
      const v = getDisplayValue(c, k);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `outcomes_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Left: Configuration */}
      <div className="lg:col-span-1 space-y-4">
        {/* Date Range Filter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Date Range</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Filter by date field</Label>
              <select
                className="w-full h-8 text-xs border border-slate-200 rounded px-2"
                value={dateField}
                onChange={e => setDateField(e.target.value)}
              >
                {DATE_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">From</Label>
              <Input type="date" className="h-8 text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">To</Label>
              <Input type="date" className="h-8 text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        {/* Stream Filter */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Service Stream</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {["direct_to_employment", "pathways", "casual", "external_referral", "internal_referral"].map(stream => (
              <label key={stream} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                <Checkbox
                  checked={(filters.service_type || []).includes(stream)}
                  onCheckedChange={() => setFilters(prev => {
                    const current = prev.service_type || [];
                    const updated = current.includes(stream)
                      ? current.filter(s => s !== stream)
                      : [...current, stream];
                    return { ...prev, service_type: updated };
                  })}
                />
                <span className="text-xs text-slate-700">{SERVICE_LABELS[stream] || stream}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full gap-2" onClick={runReport} disabled={selectedFields.length === 0}>
            <Play className="w-4 h-4" /> Run Report
          </Button>
          {results && (
            <Button variant="outline" className="w-full gap-2" onClick={exportCSV}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}
          {results && (
            <Button variant="ghost" className="w-full" onClick={() => setResults(null)}>
              Clear Results
            </Button>
          )}
        </div>
      </div>

      {/* Right: Results */}
      <div className="lg:col-span-3">
        {results === null ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <FileBarChart className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">Configure and run your outcomes report</p>
            <p className="text-sm mt-1">Select date range, streams, and columns, then click Run Report.</p>
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">{results.length} client{results.length !== 1 ? "s" : ""} in results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      {orderedFields.map(f => (
                        <th key={f.key} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">{f.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.length > 0 ? (
                      results.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          {orderedFields.map(f => (
                            <td key={f.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">{getDisplayValue(c, f.key) || "—"}</td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={orderedFields.length} className="text-center py-10 text-slate-400">
                          No clients match the selected filters and date range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}