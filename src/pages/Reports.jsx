import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Save, Trash2, FileBarChart, Filter } from "lucide-react";
import { format, differenceInMonths, startOfYear, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffMonthlyReports from "../components/reports/StaffMonthlyReports";
import ReportSummary from "../components/reports/ReportSummary";

// Report sections available to include
const REPORT_SECTIONS = [
  { key: "service_stream", label: "Service Stream Breakdown", default: true },
  { key: "case_program_status", label: "Case & Program Status", default: true },
  { key: "referral_source", label: "Referral Source", default: true },
  { key: "employment_intake", label: "Employment Status at Intake", default: true },
  { key: "employment_post", label: "Post-Completion Employment Status", default: true },
  { key: "employment_90day", label: "90-Day Follow-Up Status", default: true },
  { key: "starters_completers", label: "Program Starters & Completers", default: true },
  { key: "financial_summary", label: "Financial Summary", default: true },
  { key: "barriers", label: "Top Barriers Identified", default: true },
];

// All available fields
const ALL_FIELDS = [
  // Demographics
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
  // Dates
  { key: "intake_date", label: "Intake Date", category: "date" },
  { key: "service_start_date", label: "Service Start Date", category: "date" },
  { key: "completion_date", label: "Completion Date", category: "date" },
  { key: "employment_start_date", label: "Employment Start Date", category: "date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date", category: "date" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date", category: "date" },
  { key: "closed_date", label: "Close Date", category: "date" },
  // Metrics & outcomes
  { key: "followup_90day_status", label: "90-Day Employment Status", category: "metric" },
  { key: "post_completion_employment_status", label: "Post-Completion Employment Status", category: "metric" },
  { key: "service_navigation_supports", label: "Service Navigation Supports", category: "metric" },
  { key: "barriers_addressed", label: "Barriers Addressed", category: "metric" },
  { key: "barrier_1", label: "Barrier 1", category: "metric" },
  { key: "barrier_1_status", label: "Barrier 1 Status", category: "metric" },
  { key: "barrier_2", label: "Barrier 2", category: "metric" },
  { key: "barrier_2_status", label: "Barrier 2 Status", category: "metric" },
  { key: "barrier_3", label: "Barrier 3", category: "metric" },
  { key: "barrier_3_status", label: "Barrier 3 Status", category: "metric" },
  { key: "internal_placement", label: "Internal Placement", category: "metric" },
  { key: "employer_name", label: "Employer Name", category: "metric" },
  { key: "job_title", label: "Job Title", category: "metric" },
  { key: "job_wage", label: "Job Wage", category: "metric" },
  { key: "job_hours", label: "Job Hours/Week", category: "metric" },
  { key: "compass_verified", label: "Compass Verified", category: "metric" },
  { key: "compass_verified_date", label: "Compass Verified Date", category: "metric" },
  { key: "closed_reason", label: "Close Reason", category: "metric" },
  { key: "closed_notes", label: "Close Notes", category: "metric" },
  { key: "_duration_months", label: "Months in Program (calc.)", category: "metric" },
  { key: "_stream_switch_count", label: "# Stream Switches (calc.)", category: "metric" },
  // Financial — per-client direct costs (filterable by client selection)
  { key: "_fin_exposure_course_total", label: "Exposure Course Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_paid_placement_total", label: "Paid Placement Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_employment_supports_total", label: "Employment Supports Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_total_all", label: "Total Direct Costs ($)", category: "financial", clientFilterable: true },
  // Invoice — pulled from Invoice line items (report-wide, not per-client-filterable)
  { key: "_inv_total_amount", label: "Invoice Total ($)", category: "invoice", clientFilterable: false },
  { key: "_inv_base_amount", label: "Invoice Base Fee ($)", category: "invoice", clientFilterable: false },
  { key: "_inv_subtotal_deliverables", label: "Invoice Deliverables Subtotal ($)", category: "invoice", clientFilterable: false },
  { key: "_inv_subtotal_direct_costs", label: "Invoice Direct Costs Subtotal ($)", category: "invoice", clientFilterable: false },
  { key: "_inv_starters", label: "Invoice Starters Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_completers", label: "Invoice Completers Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_employment_outcomes", label: "Invoice Employment Outcomes Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_90day_outcomes", label: "Invoice 90-Day Outcomes Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_exposure_courses", label: "Invoice Exposure Courses Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_paid_placements", label: "Invoice Paid Placements Billed ($)", category: "invoice", clientFilterable: true },
  { key: "_inv_employment_supports", label: "Invoice Employment Supports Billed ($)", category: "invoice", clientFilterable: true },
];

const SERVICE_LABELS = {
  direct_to_employment: "DEA", pathways: "Pathways", casual: "Casual",
  external_referral: "Ext. Referral", internal_referral: "Int. Referral", not_eligible: "Not Eligible",
};

const SERVICE_TYPE_OPTIONS = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "internal_referral", label: "Internal Referral" },
];

const CASE_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

const DEMOGRAPHIC_FILTERS = [
  { key: "service_type", label: "Service Stream", type: "multi-select", fixedOptions: SERVICE_TYPE_OPTIONS },
  { key: "status", label: "Case Status", type: "multi-select", fixedOptions: CASE_STATUS_OPTIONS },
  { key: "program_status", label: "Program Status", type: "multi-select" },
  { key: "residency_status", label: "Residency Status", type: "multi-select" },
  { key: "clb_level", label: "CLB Level", type: "multi-select" },
  { key: "employment_status", label: "Employment Status", type: "multi-select" },
  { key: "referral_source", label: "Referral Source", type: "multi-select" },
  { key: "assigned_worker_name", label: "Career Counsellor", type: "multi-select" },
  { key: "city", label: "City", type: "text" },
  { key: "has_vehicle", label: "Has Vehicle", type: "select" },
  { key: "barrier_1", label: "Barrier Type", type: "multi-select" },
  { key: "closed_reason", label: "Close Reason", type: "multi-select" },
  { key: "compass_verified", label: "Compass Verified", type: "boolean-select" },
];

// Date preset helpers
function getDateRange(preset, customFrom, customTo) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth(); // 0-based

  if (preset === "this_month") {
    return {
      from: format(startOfMonth(today), "yyyy-MM-dd"),
      to: format(endOfMonth(today), "yyyy-MM-dd"),
    };
  }
  if (preset === "last_month") {
    const last = subMonths(today, 1);
    return {
      from: format(startOfMonth(last), "yyyy-MM-dd"),
      to: format(endOfMonth(last), "yyyy-MM-dd"),
    };
  }
  if (preset === "ytd") {
    return {
      from: format(startOfYear(today), "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    };
  }
  if (preset === "fiscal_year") {
    // April 1 – March 31
    const fiscalStart = mm >= 3 ? new Date(yyyy, 3, 1) : new Date(yyyy - 1, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return {
      from: format(fiscalStart, "yyyy-MM-dd"),
      to: format(fiscalEnd, "yyyy-MM-dd"),
    };
  }
  if (preset === "last_fiscal_year") {
    const fiscalStart = mm >= 3 ? new Date(yyyy - 1, 3, 1) : new Date(yyyy - 2, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return {
      from: format(fiscalStart, "yyyy-MM-dd"),
      to: format(fiscalEnd, "yyyy-MM-dd"),
    };
  }
  if (preset === "this_year") {
    return {
      from: `${yyyy}-01-01`,
      to: `${yyyy}-12-31`,
    };
  }
  // custom
  return { from: customFrom, to: customTo };
}

function fmt$(n) {
  if (!n && n !== 0) return "";
  return "$" + Number(n).toFixed(2);
}

function getDisplayValue(client, key) {
  if (key === "_duration_months") {
    if (!client.service_start_date) return "";
    return differenceInMonths(new Date(), new Date(client.service_start_date)) + " mo";
  }
  if (key === "_stream_switch_count") {
    return (client.program_stream_switches?.length || 0).toString();
  }
  // Financial per-client keys
  if (key === "_fin_exposure_course_total") return fmt$(client._fin_exposure || 0);
  if (key === "_fin_paid_placement_total") return fmt$(client._fin_placement || 0);
  if (key === "_fin_employment_supports_total") return fmt$(client._fin_supports || 0);
  if (key === "_fin_total_all") return fmt$((client._fin_exposure || 0) + (client._fin_placement || 0) + (client._fin_supports || 0));
  // Invoice keys — these are report-level aggregates displayed only in the footer
  if (key.startsWith("_inv_")) return "—";

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

const TEMPLATE_KEY = "report_templates_v2";
const SESSION_KEY = "report_session_state_v1";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}
function saveTemplates(t) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function saveSession(state) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch {}
}

export default function Reports() {
  const session = loadSession();

  const [clients, setClients] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]);
  const [financialMap, setFinancialMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [datePreset, setDatePreset] = useState(session?.datePreset ?? "none");
  const [customDateFrom, setCustomDateFrom] = useState(session?.customDateFrom ?? "");
  const [customDateTo, setCustomDateTo] = useState(session?.customDateTo ?? "");
  const [dateField, setDateField] = useState(session?.dateField ?? "intake_date");
  const [results, setResults] = useState(session?.results ?? null);
  const [templates, setTemplates] = useState(loadTemplates());
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [filters, setFilters] = useState(session?.filters ?? {});
  const [selectedSections, setSelectedSections] = useState(
    session?.selectedSections ?? REPORT_SECTIONS.filter(s => s.default).map(s => s.key)
  );

  // Persist report state for the session so navigating away and back restores it
  useEffect(() => {
    saveSession({ datePreset, customDateFrom, customDateTo, dateField, filters, selectedSections, results });
  }, [datePreset, customDateFrom, customDateTo, dateField, filters, selectedSections, results]);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.FinancialRecord.list("-date", 2000),
    ]).then(([clientData, finData]) => {
      const map = {};
      finData.forEach(rec => {
        if (!rec.client_id) return;
        if (!map[rec.client_id]) map[rec.client_id] = { exposure: 0, placement: 0, supports: 0 };
        const amt = rec.amount || 0;
        if (rec.record_type === "exposure_course") map[rec.client_id].exposure += amt;
        else if (rec.record_type === "paid_external_placement") map[rec.client_id].placement += amt;
        else if (rec.record_type === "employment_supports") map[rec.client_id].supports += amt;
      });
      setFinancialMap(map);
      setFinancialRecords(finData);
      setClients(clientData);
      setLoading(false);
    });
  }, []);

  const selectAllFilterOptions = (filterKey, options) => {
    setFilters(prev => {
      const current = prev[filterKey] || [];
      const allSelected = options.every(o => current.includes(o));
      return { ...prev, [filterKey]: allSelected ? [] : [...options] };
    });
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

  const toggleSection = (sectionKey) => {
    setSelectedSections(prev =>
      prev.includes(sectionKey)
        ? prev.filter(s => s !== sectionKey)
        : [...prev, sectionKey]
    );
  };

  const setTextFilter = (filterKey, value) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  // Computed date range
  const { from: dateFrom, to: dateTo } = getDateRange(datePreset, customDateFrom, customDateTo);

  const runReport = () => {
    let data = clients.map(c => ({
      ...c,
      _fin_exposure: financialMap[c.id]?.exposure || 0,
      _fin_placement: financialMap[c.id]?.placement || 0,
      _fin_supports: financialMap[c.id]?.supports || 0,
    }));

    // Apply demographic filters
    Object.entries(filters).forEach(([key, filterValue]) => {
      if (!filterValue || filterValue === "" || (Array.isArray(filterValue) && filterValue.length === 0)) return;
      data = data.filter(c => {
        const clientValue = c[key];
        if (Array.isArray(filterValue)) return filterValue.includes(clientValue);
        if (typeof filterValue === "boolean") return clientValue === filterValue;
        return clientValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
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
    const fields = ALL_FIELDS.filter(f => f.category === "demographic" || f.category === "date");
    const headers = fields.map(f => f.label);
    const rows = results.map(c => fields.map(f => {
      const v = getDisplayValue(c, f.key);
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
    const t = { id: Date.now(), name: templateName.trim(), dateField, datePreset, filters };
    const updated = [...templates, t];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const loadTemplate = (t) => {
    setDateField(t.dateField || "intake_date");
    setDatePreset(t.datePreset || "none");
    setFilters(t.filters || {});
  };

  const deleteTemplate = (id) => {
    const updated = templates.filter(t => t.id !== id);
    setTemplates(updated);
    saveTemplates(updated);
  };

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
          <FileBarChart className="w-5 h-5" /> Reports
        </h1>
        <p className="text-sm text-slate-500">Data reports and staff monthly submissions</p>
      </div>

      <Tabs defaultValue="data" className="max-w-7xl mx-auto px-6 py-6">
        <TabsList className="mb-4">
          <TabsTrigger value="data">Data Reports</TabsTrigger>
          <TabsTrigger value="staff">Staff Monthly Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="data">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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

          <div className="space-y-4 mt-0">
              {/* Date Range */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Date Range
                  </CardTitle>
                </CardHeader>
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
                    <Label className="text-xs mb-1 block">Period</Label>
                    <Select value={datePreset} onValueChange={setDatePreset}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="All time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">All time</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="ytd">Year to Date (Jan–Today)</SelectItem>
                        <SelectItem value="fiscal_year">Current Fiscal Year (Apr–Mar)</SelectItem>
                        <SelectItem value="last_fiscal_year">Last Fiscal Year</SelectItem>
                        <SelectItem value="this_year">This Calendar Year</SelectItem>
                        <SelectItem value="custom">Custom Range</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {datePreset === "custom" && (
                    <>
                      <div>
                        <Label className="text-xs mb-1 block">From</Label>
                        <Input type="date" className="h-8 text-xs" value={customDateFrom} onChange={e => setCustomDateFrom(e.target.value)} />
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">To</Label>
                        <Input type="date" className="h-8 text-xs" value={customDateTo} onChange={e => setCustomDateTo(e.target.value)} />
                      </div>
                    </>
                  )}
                  {datePreset !== "none" && datePreset !== "custom" && (
                    <p className="text-xs text-slate-400">
                      {dateFrom} → {dateTo}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Report Sections */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileBarChart className="w-3 h-3" /> Include in Summary
                    </CardTitle>
                    <button
                      className="text-xs text-primary hover:underline"
                      onClick={() => setSelectedSections(selectedSections.length === REPORT_SECTIONS.length ? [] : REPORT_SECTIONS.map(s => s.key))}
                    >
                      {selectedSections.length === REPORT_SECTIONS.length ? "Clear All" : "All"}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 max-h-48 overflow-y-auto">
                  {REPORT_SECTIONS.map(section => (
                    <label key={section.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox
                        checked={selectedSections.includes(section.key)}
                        onCheckedChange={() => toggleSection(section.key)}
                      />
                      <span className="text-xs text-slate-700">{section.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Demographic Filters */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Filter className="w-3 h-3" /> Client Filters
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
                    } else if (f.type === "boolean-select") {
                      return (
                        <div key={f.key}>
                          <Label className="text-xs mb-1 block">{f.label}</Label>
                          <Select
                            value={filters[f.key] ?? ""}
                            onValueChange={(v) => setTextFilter(f.key, v === "" ? "" : v === "true")}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Any" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={null}>Any</SelectItem>
                              <SelectItem value="true">Yes</SelectItem>
                              <SelectItem value="false">No</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    } else {
                      const rawOptions = f.fixedOptions
                        ? f.fixedOptions
                        : [...new Set(clients.map(c => c[f.key]).filter(Boolean))].sort().map(v => ({ value: v, label: v }));
                      const allSelected = rawOptions.length > 0 && rawOptions.every(o => (filters[f.key] || []).includes(o.value));
                      return (
                        <div key={f.key}>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-xs">{f.label}</Label>
                            {rawOptions.length > 1 && (
                              <button className="text-xs text-primary hover:underline" onClick={() => selectAllFilterOptions(f.key, rawOptions.map(o => o.value))}>
                                {allSelected ? "Clear" : "All"}
                              </button>
                            )}
                          </div>
                          <div className="space-y-1 max-h-24 overflow-y-auto border border-slate-100 rounded p-2">
                            {rawOptions.map(opt => (
                              <label key={opt.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                                <Checkbox
                                  checked={(filters[f.key] || []).includes(opt.value)}
                                  onCheckedChange={() => toggleFilter(f.key, opt.value)}
                                />
                                <span className="text-xs text-slate-700 truncate">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  })}
                </CardContent>
              </Card>
            </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full gap-2" onClick={runReport}>
              <Play className="w-4 h-4" /> Run Report
            </Button>
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
              <p className="text-sm mt-1">Select filters and date range, then click Run Report.</p>
            </div>
          ) : (
            <ReportSummary
              results={results}
              financialRecords={financialRecords}
              selectedSections={selectedSections}
              onClear={() => { setResults(null); }}
              onExportCSV={exportCSV}
              dateRange={{ from: dateFrom, to: dateTo }}
              appliedFilters={filters}
              allClients={clients}
              demographicFilters={DEMOGRAPHIC_FILTERS}
            />
          )}
        </div>
        </div>
        </TabsContent>

        <TabsContent value="staff">
          <StaffMonthlyReports />
        </TabsContent>
      </Tabs>
    </div>
  );
}