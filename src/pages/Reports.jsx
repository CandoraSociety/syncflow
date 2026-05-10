import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Download, Save, Trash2, FileBarChart } from "lucide-react";
import { format, differenceInMonths } from "date-fns";

const ALL_FIELDS = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "Province" },
  { key: "zip", label: "Postal Code" },
  { key: "compass_hsid", label: "Compass HSID#" },
  { key: "residency_status", label: "Residency Status" },
  { key: "clb_level", label: "CLB Level" },
  { key: "employment_status", label: "Employment Status" },
  { key: "has_vehicle", label: "Has Vehicle" },
  { key: "referral_source", label: "Referral Source" },
  { key: "service_type", label: "Service Stream" },
  { key: "assigned_worker_name", label: "Career Counsellor" },
  { key: "status", label: "Case Status" },
  { key: "program_status", label: "Program Status" },
  { key: "service_start_date", label: "Service Start Date" },
  { key: "completion_date", label: "Completion Date" },
  { key: "employment_start_date", label: "Employment Start Date" },
  { key: "intake_date", label: "Intake Date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date" },
  { key: "followup_90day_status", label: "90-Day Employment Status" },
  { key: "service_navigation_supports", label: "Service Navigation Supports" },
  { key: "barriers_addressed", label: "Barriers Addressed" },
  { key: "barrier_1", label: "Barrier 1" },
  { key: "barrier_1_status", label: "Barrier 1 Status" },
  { key: "barrier_2", label: "Barrier 2" },
  { key: "barrier_2_status", label: "Barrier 2 Status" },
  { key: "barrier_3", label: "Barrier 3" },
  { key: "barrier_3_status", label: "Barrier 3 Status" },
  { key: "internal_placement", label: "Internal Placement" },
  { key: "external_employer", label: "External Employer" },
  { key: "employer_name", label: "Employer Name" },
  { key: "job_title", label: "Job Title" },
  { key: "job_wage", label: "Job Wage" },
  { key: "job_hours", label: "Job Hours/Week" },
  { key: "exposure_course", label: "Exposure Course" },
  { key: "paid_external_placement", label: "Paid External Placement" },
  { key: "employment_supports", label: "Employment Supports" },
  { key: "compass_verified", label: "Compass Verified" },
  { key: "compass_verified_date", label: "Compass Verified Date" },
  { key: "_duration_months", label: "Months in Program (calculated)" },
  { key: "_stream_switch_count", label: "# Stream Switches (calculated)" },
];

const SERVICE_LABELS = {
  direct_to_employment: "DEA", pathways: "Pathways", casual: "Casual",
  external_referral: "Ext. Referral", internal_referral: "Int. Referral", not_eligible: "Not Eligible",
};

function getDisplayValue(client, key) {
  if (key === "_duration_months") {
    if (!client.service_start_date) return "";
    return differenceInMonths(new Date(), new Date(client.service_start_date)) + " mo";
  }
  if (key === "_stream_switch_count") {
    return (client.program_stream_switches?.length || 0).toString();
  }
  const v = client[key];
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (key === "service_type") return SERVICE_LABELS[v] || v;
  if (key === "clb_level") return v.replace("clb_", "CLB ").replace("native_english_french", "Native");
  if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try { return format(new Date(v), "MMM d, yyyy"); } catch { return v; }
  }
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}

const TEMPLATE_KEY = "report_templates_v1";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}
function saveTemplates(templates) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates));
}

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState(["first_name", "last_name", "service_type", "program_status", "assigned_worker_name", "intake_date"]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState("intake_date");
  const [results, setResults] = useState(null);
  const [templates, setTemplates] = useState(loadTemplates());
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    base44.entities.Client.list("-intake_date", 1000).then(data => {
      setClients(data);
      setLoading(false);
    });
  }, []);

  const toggleField = (key) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const runReport = () => {
    let data = [...clients];
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
    const headers = selectedFields.map(k => ALL_FIELDS.find(f => f.key === k)?.label || k);
    const rows = results.map(c => selectedFields.map(k => {
      const v = getDisplayValue(c, k);
      return `"${v.replace(/"/g, '""')}"`;
    }).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveTemplate = () => {
    if (!templateName.trim()) return;
    const t = { id: Date.now(), name: templateName.trim(), selectedFields, dateField };
    const updated = [...templates, t];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const loadTemplate = (t) => {
    setSelectedFields(t.selectedFields);
    setDateField(t.dateField || "intake_date");
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const orderedFields = selectedFields.map(k => ALL_FIELDS.find(f => f.key === k)).filter(Boolean);

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileBarChart className="w-5 h-5" /> Data Reports
        </h1>
        <p className="text-sm text-slate-500">Build, save, and run custom reports</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: config */}
        <div className="lg:col-span-1 space-y-4">

          {/* Templates */}
          {templates.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Saved Templates</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {templates.map(t => (
                  <div key={t.id} className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="flex-1 justify-start text-xs truncate" onClick={() => loadTemplate(t)}>
                      {t.name}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteTemplate(t.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Date range filter */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Date Range Filter</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs mb-1 block">Filter by date field</Label>
                <select
                  className="w-full h-8 text-xs border border-slate-200 rounded px-2"
                  value={dateField}
                  onChange={e => setDateField(e.target.value)}
                >
                  {["intake_date","service_start_date","completion_date","employment_start_date","followup_90day_date"].map(f => (
                    <option key={f} value={f}>{ALL_FIELDS.find(x => x.key === f)?.label || f}</option>
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

          {/* Field selector */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Select Columns</CardTitle>
              <p className="text-xs text-slate-400">{selectedFields.length} selected</p>
            </CardHeader>
            <CardContent className="space-y-1.5 max-h-80 overflow-y-auto">
              {ALL_FIELDS.map(f => (
                <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                  <Checkbox
                    checked={selectedFields.includes(f.key)}
                    onCheckedChange={() => toggleField(f.key)}
                  />
                  <span className="text-xs text-slate-700">{f.label}</span>
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
            {savingTemplate ? (
              <div className="flex gap-2">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="Template name..."
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveTemplate()}
                  autoFocus
                />
                <Button size="sm" onClick={saveTemplate} disabled={!templateName.trim()}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setSavingTemplate(false)}>✕</Button>
              </div>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={() => setSavingTemplate(true)}>
                <Save className="w-4 h-4" /> Save as Template
              </Button>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="lg:col-span-3">
          {results === null ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileBarChart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-base font-medium">Configure and run your report</p>
              <p className="text-sm mt-1">Select columns and an optional date range, then click Run Report.</p>
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
                      {results.map(c => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          {orderedFields.map(f => (
                            <td key={f.key} className="px-3 py-2 text-slate-700 whitespace-nowrap">{getDisplayValue(c, f.key) || "—"}</td>
                          ))}
                        </tr>
                      ))}
                      {results.length === 0 && (
                        <tr><td colSpan={orderedFields.length} className="text-center py-10 text-slate-400">No clients match the selected date range.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}