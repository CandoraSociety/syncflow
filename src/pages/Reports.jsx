import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Download, Save, Trash2, FileBarChart, Filter, BarChart3 } from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// All available client fields
const ALL_FIELDS = [
  { key: "first_name", label: "First Name", category: "demographic" },
  { key: "last_name", label: "Last Name", category: "demographic" },
  { key: "date_of_birth", label: "Date of Birth", category: "demographic" },
  { key: "phone", label: "Phone", category: "demographic" },
  { key: "email", label: "Email", category: "demographic" },
  { key: "address", label: "Address", category: "demographic" },
  { key: "city", label: "City", category: "demographic" },
  { key: "state", label: "Province", category: "demographic" },
  { key: "zip", label: "Postal Code", category: "demographic" },
  { key: "compass_hsid", label: "Compass HSID#", category: "demographic" },
  { key: "residency_status", label: "Residency Status", category: "demographic" },
  { key: "clb_level", label: "CLB Level", category: "demographic" },
  { key: "employment_status", label: "Employment Status", category: "demographic" },
  { key: "has_vehicle", label: "Has Vehicle", category: "demographic" },
  { key: "referral_source", label: "Referral Source", category: "demographic" },
  { key: "service_type", label: "Service Stream", category: "demographic" },
  { key: "assigned_worker_name", label: "Career Counsellor", category: "demographic" },
  { key: "status", label: "Case Status", category: "demographic" },
  { key: "program_status", label: "Program Status", category: "demographic" },
  { key: "service_start_date", label: "Service Start Date", category: "date" },
  { key: "completion_date", label: "Completion Date", category: "date" },
  { key: "employment_start_date", label: "Employment Start Date", category: "date" },
  { key: "intake_date", label: "Intake Date", category: "date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date", category: "date" },
  { key: "followup_90day_status", label: "90-Day Employment Status", category: "metric" },
  { key: "service_navigation_supports", label: "Service Navigation Supports", category: "metric" },
  { key: "barriers_addressed", label: "Barriers Addressed", category: "metric" },
  { key: "barrier_1", label: "Barrier 1", category: "metric" },
  { key: "barrier_1_status", label: "Barrier 1 Status", category: "metric" },
  { key: "barrier_2", label: "Barrier 2", category: "metric" },
  { key: "barrier_2_status", label: "Barrier 2 Status", category: "metric" },
  { key: "barrier_3", label: "Barrier 3", category: "metric" },
  { key: "barrier_3_status", label: "Barrier 3 Status", category: "metric" },
  { key: "internal_placement", label: "Internal Placement", category: "metric" },
  { key: "external_employer", label: "External Employer", category: "metric" },
  { key: "employer_name", label: "Employer Name", category: "metric" },
  { key: "job_title", label: "Job Title", category: "metric" },
  { key: "job_wage", label: "Job Wage", category: "metric" },
  { key: "job_hours", label: "Job Hours/Week", category: "metric" },
  { key: "exposure_course", label: "Exposure Course", category: "metric" },
  { key: "paid_external_placement", label: "Paid External Placement", category: "metric" },
  { key: "employment_supports", label: "Employment Supports", category: "metric" },
  { key: "compass_verified", label: "Compass Verified", category: "metric" },
  { key: "compass_verified_date", label: "Compass Verified Date", category: "metric" },
  { key: "_duration_months", label: "Months in Program (calculated)", category: "metric" },
  { key: "_stream_switch_count", label: "# Stream Switches (calculated)", category: "metric" },
];

const SERVICE_LABELS = {
  direct_to_employment: "DEA", pathways: "Pathways", casual: "Casual",
  external_referral: "Ext. Referral", internal_referral: "Int. Referral", not_eligible: "Not Eligible",
};

const DEMOGRAPHIC_FILTERS = [
  { key: "service_type", label: "Service Stream", type: "multi-select" },
  { key: "status", label: "Case Status", type: "multi-select" },
  { key: "program_status", label: "Program Status", type: "multi-select" },
  { key: "residency_status", label: "Residency Status", type: "multi-select" },
  { key: "clb_level", label: "CLB Level", type: "multi-select" },
  { key: "employment_status", label: "Employment Status", type: "multi-select" },
  { key: "referral_source", label: "Referral Source", type: "multi-select" },
  { key: "assigned_worker_name", label: "Career Counsellor", type: "multi-select" },
  { key: "city", label: "City", type: "text" },
  { key: "has_vehicle", label: "Has Vehicle", type: "select" },
];

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
  
  // Demographic filters
  const [filters, setFilters] = useState({});

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

  const toggleFilter = (filterKey, value) => {
    setFilters(prev => {
      const current = prev[filterKey] || [];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [filterKey]: updated };
    });
  };

  const setTextFilter = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const runReport = () => {
    let data = [...clients];
    
    // Apply demographic filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) return;
      
      data = data.filter(c => {
        const clientValue = c[key];
        if (Array.isArray(filterValue)) {
          return filterValue.includes(clientValue);
        } else {
          // Text search
          return clientValue?.toLowerCase().includes(filterValue.toLowerCase());
        }
      });
    });

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
    const t = { id: Date.now(), name: templateName.trim(), selectedFields, dateField, filters };
    const updated = [...templates, t];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const loadTemplate = (t) => {
    setSelectedFields(t.selectedFields);
    setDateField(t.dateField || "intake_date");
    setFilters(t.filters || {});
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

  const orderedFields = selectedFields.map(k => ALL_FIELDS.find(f => f.key === k)).filter(Boolean);
  
  const demographicFields = ALL_FIELDS.filter(f => f.category === "demographic");
  const metricFields = ALL_FIELDS.filter(f => f.category === "metric");
  const dateFields = ALL_FIELDS.filter(f => f.category === "date");

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileBarChart className="w-5 h-5" /> Data Reports
        </h1>
        <p className="text-sm text-slate-500">Build, save, and run custom reports with demographic filters and metrics</p>
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

          <Tabs defaultValue="filters">
            <TabsList className="w-full">
              <TabsTrigger value="filters" className="flex-1 text-xs">Filters</TabsTrigger>
              <TabsTrigger value="columns" className="flex-1 text-xs">Columns</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4 mt-4">
              {/* Demographic Filters */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Demographic Filters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                  {DEMOGRAPHIC_FILTERS.map(f => {
                    if (f.type === "text") {
                      return (
                        <div key={f.key}>
                          <Label className="text-xs mb-1 block">{f.label}</Label>
                          <Input
                            type="text"
                            className="h-8 text-xs"
                            placeholder={`Filter by ${f.label.toLowerCase()}`}
                            value={filters[f.key] || ""}
                            onChange={e => setTextFilter(f.key, e.target.value)}
                          />
                        </div>
                      );
                    } else if (f.type === "select") {
                      return (
                        <div key={f.key}>
                          <Label className="text-xs mb-1 block">{f.label}</Label>
                          <Select
                            value={filters[f.key] || ""}
                            onValueChange={(v) => setTextFilter(f.key, v)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>Any</SelectItem>
                              <SelectItem value="yes">Yes</SelectItem>
                              <SelectItem value="no_has_license">Yes (has license)</SelectItem>
                              <SelectItem value="no_no_license">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    } else {
                      // Multi-select
                      const options = [...new Set(clients.map(c => c[f.key]).filter(Boolean))].sort();
                      return (
                        <div key={f.key}>
                          <Label className="text-xs mb-1 block">{f.label}</Label>
                          <div className="space-y-1 max-h-24 overflow-y-auto border border-slate-100 rounded p-2">
                            {options.map(opt => (
                              <label key={opt} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                                <Checkbox
                                  checked={(filters[f.key] || []).includes(opt)}
                                  onCheckedChange={() => toggleFilter(f.key, opt)}
                                />
                                <span className="text-xs text-slate-700 truncate">{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  })}
                </CardContent>
              </Card>

              {/* Date range filter */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Date Range</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs mb-1 block">Filter by date field</Label>
                    <select
                      className="w-full h-8 text-xs border border-slate-200 rounded px-2"
                      value={dateField}
                      onChange={e => setDateField(e.target.value)}
                    >
                      {dateFields.map(f => (
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
            </TabsContent>

            <TabsContent value="columns" className="space-y-4 mt-4">
              {/* Demographics selection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Demographics
                  </CardTitle>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => demographicFields.find(f => f.key === k)).length} selected</p>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {demographicFields.map(f => (
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

              {/* Metrics selection */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-3 h-3" /> Metrics & Outcomes
                  </CardTitle>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => metricFields.find(f => f.key === k)).length} selected</p>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {metricFields.map(f => (
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
            </TabsContent>
          </Tabs>

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
              <p className="text-sm mt-1">Select filters, columns, and date range, then click Run Report.</p>
            </div>
          ) : (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">{results.length} client{results.length !== 1 ? "s" : ""} in results</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setResults(null)}>Clear Results</Button>
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
    </div>
  );
}