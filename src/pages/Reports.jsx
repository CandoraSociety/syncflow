import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Play, Download, Save, Trash2, FileBarChart, Filter, BarChart3, Info, FileText, Calendar } from "lucide-react";
import { format, differenceInMonths, startOfYear, endOfYear, startOfMonth, endOfMonth, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StaffMonthlyReports from "../components/reports/StaffMonthlyReports";

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

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}
function saveTemplates(t) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

export default function Reports() {
  const [clients, setClients] = useState([]);
  const [financialMap, setFinancialMap] = useState({});
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState(["first_name", "last_name", "service_type", "program_status", "assigned_worker_name", "intake_date"]);
  const [datePreset, setDatePreset] = useState("none");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [dateField, setDateField] = useState("intake_date");
  const [results, setResults] = useState(null);
  const [templates, setTemplates] = useState(loadTemplates());
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [filters, setFilters] = useState({});
  const [finApplyClientFilter, setFinApplyClientFilter] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.FinancialRecord.list("-date", 2000),
      base44.entities.Invoice.list("-billing_month", 200),
    ]).then(([clientData, finData, invData]) => {
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
      setClients(clientData);
      setInvoices(invData);
      setLoading(false);
    });
  }, []);

  const toggleField = (key) => {
    setSelectedFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const selectAllFields = (fields) => {
    setSelectedFields(prev => {
      const keys = fields.map(f => f.key);
      const allSelected = keys.every(k => prev.includes(k));
      if (allSelected) return prev.filter(k => !keys.includes(k));
      return [...prev.filter(k => !keys.includes(k)), ...keys];
    });
  };

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

  // Build invoice aggregates — optionally filtered to the client set
  function buildInvoiceAggregates(filteredClientIds) {
    const agg = {
      _inv_total_amount: 0,
      _inv_base_amount: 0,
      _inv_subtotal_deliverables: 0,
      _inv_subtotal_direct_costs: 0,
      _inv_starters: 0,
      _inv_completers: 0,
      _inv_employment_outcomes: 0,
      _inv_90day_outcomes: 0,
      _inv_exposure_courses: 0,
      _inv_paid_placements: 0,
      _inv_employment_supports: 0,
    };

    const clientIdSet = filteredClientIds ? new Set(filteredClientIds) : null;

    invoices.forEach(inv => {
      // Invoice-level totals: always include (not client-filterable)
      agg._inv_total_amount += inv.total_amount || 0;
      agg._inv_base_amount += inv.base_amount || 0;
      agg._inv_subtotal_deliverables += inv.subtotal_deliverables || 0;
      agg._inv_subtotal_direct_costs += inv.subtotal_direct_costs || 0;

      (inv.line_items || []).forEach(li => {
        if (li.excluded) return;
        const amt = li.amount || 0;
        const inClientSet = !clientIdSet || (li.client_id && clientIdSet.has(li.client_id));
        if (!inClientSet) return; // These line items are client-filterable

        if (li.category === "starter") agg._inv_starters += amt;
        else if (li.category === "completer") agg._inv_completers += amt;
        else if (li.category === "employment_outcome") agg._inv_employment_outcomes += amt;
        else if (li.category === "90day_outcome") agg._inv_90day_outcomes += amt;
        else if (li.category === "exposure_course") agg._inv_exposure_courses += amt;
        else if (li.category === "paid_placement") agg._inv_paid_placements += amt;
        else if (li.category === "employment_support") agg._inv_employment_supports += amt;
      });
    });

    return agg;
  }

  const exportCSV = () => {
    if (!results) return;
    const nonInvoiceFields = selectedFields.filter(k => !k.startsWith("_inv_"));
    const headers = nonInvoiceFields.map(k => ALL_FIELDS.find(f => f.key === k)?.label || k);
    const rows = results.map(c => nonInvoiceFields.map(k => {
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
    const t = { id: Date.now(), name: templateName.trim(), selectedFields, dateField, datePreset, filters, finApplyClientFilter };
    const updated = [...templates, t];
    setTemplates(updated);
    saveTemplates(updated);
    setTemplateName("");
    setSavingTemplate(false);
  };

  const loadTemplate = (t) => {
    setSelectedFields(t.selectedFields);
    setDateField(t.dateField || "intake_date");
    setDatePreset(t.datePreset || "none");
    setFilters(t.filters || {});
    setFinApplyClientFilter(t.finApplyClientFilter || false);
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
  const financialFields = ALL_FIELDS.filter(f => f.category === "financial");
  const invoiceFields = ALL_FIELDS.filter(f => f.category === "invoice");
  const hasInvoiceColumns = selectedFields.some(k => k.startsWith("_inv_"));

  // Invoice aggregates (computed when results exist)
  const invoiceAgg = results
    ? buildInvoiceAggregates(finApplyClientFilter ? results.map(c => c.id) : null)
    : null;

  // Build summary statistics for the report
  function buildSummaryStats(data) {
    if (!data || data.length === 0) return null;
    
    // Employment status counts
    const employmentStatusCounts = {};
    data.forEach(c => {
      const status = c.employment_status;
      if (status) employmentStatusCounts[status] = (employmentStatusCounts[status] || 0) + 1;
    });

    // Program starters by stream (service_start_date within date range)
    const deaStarters = data.filter(c => c.service_type === "direct_to_employment" && c.service_start_date && 
      (!dateFrom || c.service_start_date >= dateFrom) && (!dateTo || c.service_start_date <= dateTo)).length;
    const pathwaysStarters = data.filter(c => c.service_type === "pathways" && c.service_start_date && 
      (!dateFrom || c.service_start_date >= dateFrom) && (!dateTo || c.service_start_date <= dateTo)).length;

    // Program completers by stream
    const deaCompleters = data.filter(c => c.service_type === "direct_to_employment" && c.program_status === "complete").length;
    const pathwaysCompleters = data.filter(c => c.service_type === "pathways" && c.program_status === "complete").length;

    // Exposure courses count and total cost
    const exposureCourseCount = data.reduce((sum, c) => sum + (c._fin_exposure || 0), 0);
    const exposureCourseTotal = data.reduce((sum, c) => sum + (c._fin_exposure || 0), 0);
    
    // Count of clients with exposure courses (from financial records)
    const clientsWithExposure = data.filter(c => c._fin_exposure > 0).length;

    // Total direct costs
    const totalDirectCosts = data.reduce((sum, c) => 
      sum + (c._fin_exposure || 0) + (c._fin_placement || 0) + (c._fin_supports || 0), 0);

    // Barriers identified
    const clientsWithBarriers = data.filter(c => c.barriers_addressed === true).length;
    const bitCompleted = data.filter(c => c.bit_completed === true).length;

    // Employment outcomes
    const employmentOutcomes = data.filter(c => c.employment_start_date || ["E-RF", "E-UF", "E-PT"].includes(c.employment_status)).length;
    const ninetyDayOutcomes = data.filter(c => c.followup_90day_status && ["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)).length;

    // Service stream breakdown
    const streamCounts = {};
    data.forEach(c => {
      const stream = c.service_type;
      if (stream) streamCounts[stream] = (streamCounts[stream] || 0) + 1;
    });

    return {
      totalClients: data.length,
      employmentStatusCounts,
      deaStarters,
      pathwaysStarters,
      deaCompleters,
      pathwaysCompleters,
      clientsWithExposure,
      exposureCourseTotal,
      totalDirectCosts,
      clientsWithBarriers,
      bitCompleted,
      employmentOutcomes,
      ninetyDayOutcomes,
      streamCounts,
    };
  }

  const summaryStats = results ? buildSummaryStats(results) : null;

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

          <Tabs defaultValue="filters">
            <TabsList className="w-full">
              <TabsTrigger value="filters" className="flex-1 text-xs">Filters</TabsTrigger>
              <TabsTrigger value="columns" className="flex-1 text-xs">Columns</TabsTrigger>
            </TabsList>

            <TabsContent value="filters" className="space-y-4 mt-4">
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
            </TabsContent>

            <TabsContent value="columns" className="space-y-4 mt-4">
              {/* Demographics */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Demographics
                    </CardTitle>
                    <button className="text-xs text-primary hover:underline" onClick={() => selectAllFields(demographicFields)}>
                      {demographicFields.every(f => selectedFields.includes(f.key)) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => demographicFields.find(f => f.key === k)).length} / {demographicFields.length} selected</p>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {demographicFields.map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox checked={selectedFields.includes(f.key)} onCheckedChange={() => toggleField(f.key)} />
                      <span className="text-xs text-slate-700">{f.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Metrics */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Metrics & Outcomes
                    </CardTitle>
                    <button className="text-xs text-primary hover:underline" onClick={() => selectAllFields(metricFields)}>
                      {metricFields.every(f => selectedFields.includes(f.key)) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => metricFields.find(f => f.key === k)).length} / {metricFields.length} selected</p>
                </CardHeader>
                <CardContent className="space-y-1.5 max-h-48 overflow-y-auto">
                  {metricFields.map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox checked={selectedFields.includes(f.key)} onCheckedChange={() => toggleField(f.key)} />
                      <span className="text-xs text-slate-700">{f.label}</span>
                    </label>
                  ))}
                </CardContent>
              </Card>

              {/* Financial (direct costs per client) */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Financial — Direct Costs
                    </CardTitle>
                    <button className="text-xs text-primary hover:underline" onClick={() => selectAllFields(financialFields)}>
                      {financialFields.every(f => selectedFields.includes(f.key)) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => financialFields.find(f => f.key === k)).length} / {financialFields.length} selected · per-client amounts</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {financialFields.map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox checked={selectedFields.includes(f.key)} onCheckedChange={() => toggleField(f.key)} />
                      <span className="text-xs text-slate-700">{f.label}</span>
                    </label>
                  ))}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <label className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-1">
                      <Checkbox
                        className="mt-0.5"
                        checked={finApplyClientFilter}
                        onCheckedChange={v => setFinApplyClientFilter(!!v)}
                      />
                      <span className="text-xs text-slate-700 leading-relaxed">
                        Limit financial totals to filtered clients only
                      </span>
                    </label>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed px-1">
                      When checked, direct cost columns reflect only the clients matching your current filters. Invoice-level totals (below) always reflect all invoices regardless of this setting.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice columns */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <BarChart3 className="w-3 h-3" /> Invoice Amounts
                    </CardTitle>
                    <button className="text-xs text-primary hover:underline" onClick={() => selectAllFields(invoiceFields)}>
                      {invoiceFields.every(f => selectedFields.includes(f.key)) ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{selectedFields.filter(k => invoiceFields.find(f => f.key === k)).length} / {invoiceFields.length} selected · shown in report footer</p>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 mb-2">
                    <Info className="w-3 h-3 mt-0.5 shrink-0" />
                    <span>Invoice columns show totals across all invoices in the footer row. Items marked "filterable" below only count line items for clients matching your filters (when that option is enabled above). Overall invoice totals (Total, Base Fee, Subtotals) always reflect all invoices.</span>
                  </div>
                  {invoiceFields.map(f => (
                    <label key={f.key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 rounded px-1 py-0.5">
                      <Checkbox checked={selectedFields.includes(f.key)} onCheckedChange={() => toggleField(f.key)} />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-slate-700">{f.label}</span>
                        {f.clientFilterable && (
                          <span className="ml-1 text-xs text-slate-400">(filterable)</span>
                        )}
                      </div>
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
        <div className="lg:col-span-3 space-y-4">
          {results === null ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <FileBarChart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-base font-medium">Configure and run your report</p>
              <p className="text-sm mt-1">Select filters, columns, and date range, then click Run Report.</p>
            </div>
          ) : (
            <>
              {/* Summary Statistics Card */}
              {summaryStats && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold text-slate-700">Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Top-level totals */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Total Clients</p>
                        <p className="text-lg font-bold text-slate-800">{summaryStats.totalClients}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Employment Outcomes</p>
                        <p className="text-lg font-bold text-slate-800">{summaryStats.employmentOutcomes}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">90-Day Outcomes</p>
                        <p className="text-lg font-bold text-slate-800">{summaryStats.ninetyDayOutcomes}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <p className="text-xs text-slate-500 font-medium">Total Direct Costs</p>
                        <p className="text-lg font-bold text-emerald-700">{fmt$(summaryStats.totalDirectCosts)}</p>
                      </div>
                    </div>

                    {/* Program Starters & Completers */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">DEA Starters</p>
                        <p className="text-lg font-bold text-blue-800">{summaryStats.deaStarters}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">Pathways Starters</p>
                        <p className="text-lg font-bold text-blue-800">{summaryStats.pathwaysStarters}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-green-600 font-medium">DEA Completers</p>
                        <p className="text-lg font-bold text-green-800">{summaryStats.deaCompleters}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <p className="text-xs text-green-600 font-medium">Pathways Completers</p>
                        <p className="text-lg font-bold text-green-800">{summaryStats.pathwaysCompleters}</p>
                      </div>
                    </div>

                    {/* Employment Status Breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Employment Status Breakdown</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(summaryStats.employmentStatusCounts).map(([status, count]) => (
                          <div key={status} className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">{status}</p>
                            <p className="text-base font-bold text-slate-800">{count}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Service Stream Breakdown */}
                    <div>
                      <p className="text-xs font-semibold text-slate-600 mb-2">Service Stream Breakdown</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {Object.entries(summaryStats.streamCounts).map(([stream, count]) => (
                          <div key={stream} className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">{SERVICE_LABELS[stream] || stream}</p>
                            <p className="text-base font-bold text-slate-800">{count}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exposure Courses & Supports */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium">Clients with Exposure Courses</p>
                        <p className="text-lg font-bold text-amber-900">{summaryStats.clientsWithExposure}</p>
                        <p className="text-xs text-amber-600 mt-1">Total: {fmt$(summaryStats.exposureCourseTotal)}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-purple-700 font-medium">Clients with Barriers Identified</p>
                        <p className="text-lg font-bold text-purple-900">{summaryStats.clientsWithBarriers}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                        <p className="text-xs text-purple-700 font-medium">BIT Completed</p>
                        <p className="text-lg font-bold text-purple-900">{summaryStats.bitCompleted}</p>
                      </div>
                    </div>

                    {/* Invoice totals (if applicable) */}
                    {hasInvoiceColumns && invoiceAgg && (
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Invoice Totals</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Total Billed</p>
                            <p className="text-base font-bold text-slate-800">{fmt$(invoiceAgg._inv_total_amount)}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Base Fees</p>
                            <p className="text-base font-bold text-slate-800">{fmt$(invoiceAgg._inv_base_amount)}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Deliverables</p>
                            <p className="text-base font-bold text-slate-800">{fmt$(invoiceAgg._inv_subtotal_deliverables)}</p>
                          </div>
                          <div className="bg-slate-50 rounded p-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Direct Costs</p>
                            <p className="text-base font-bold text-slate-800">{fmt$(invoiceAgg._inv_subtotal_direct_costs)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Client List ({results.length} clients)</CardTitle>
                  {hasInvoiceColumns && (
                    <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Invoice totals appear in the footer row only
                      {finApplyClientFilter ? " (line items limited to filtered clients)" : " (all invoices, all clients)"}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setResults(null)}>Clear Results</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        {orderedFields.map(f => (
                          <th key={f.key} className="text-left px-3 py-2.5 font-semibold text-slate-600 whitespace-nowrap">
                            {f.label}
                            {f.category === "invoice" && (
                              <span className="block text-slate-400 font-normal text-xs">footer only</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {results.length > 0 ? (
                        results.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50">
                            {orderedFields.map(f => (
                              <td key={f.key} className={`px-3 py-2 text-slate-700 whitespace-nowrap ${f.category === "invoice" ? "text-slate-300" : ""}`}>
                                {getDisplayValue(c, f.key) || "—"}
                              </td>
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
                    {results.length > 0 && (
                      <tfoot className="bg-slate-100 border-t-2 border-slate-300 text-xs font-semibold text-slate-600">
                        <tr>
                          {orderedFields.map((f, i) => {
                            if (i === 0) return <td key={f.key} className="px-3 py-2 whitespace-nowrap">Total: {results.length}</td>;
                            if (f.key === "_duration_months") {
                              const avg = Math.round(
                                results.filter(c => c.service_start_date)
                                  .reduce((sum, c) => sum + differenceInMonths(new Date(), new Date(c.service_start_date)), 0)
                                / (results.filter(c => c.service_start_date).length || 1)
                              );
                              return <td key={f.key} className="px-3 py-2 whitespace-nowrap">Avg: {avg} mo</td>;
                            }
                            if (f.category === "metric" && typeof results[0]?.[f.key] === "boolean") {
                              const count = results.filter(c => c[f.key] === true).length;
                              return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{count} yes</td>;
                            }
                            // Financial per-client sums
                            if (f.key === "_fin_exposure_course_total") return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt$(results.reduce((s, c) => s + (c._fin_exposure || 0), 0))}</td>;
                            if (f.key === "_fin_paid_placement_total") return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt$(results.reduce((s, c) => s + (c._fin_placement || 0), 0))}</td>;
                            if (f.key === "_fin_employment_supports_total") return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt$(results.reduce((s, c) => s + (c._fin_supports || 0), 0))}</td>;
                            if (f.key === "_fin_total_all") return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt$(results.reduce((s, c) => s + (c._fin_exposure || 0) + (c._fin_placement || 0) + (c._fin_supports || 0), 0))}</td>;
                            // Invoice aggregates
                            if (f.key.startsWith("_inv_") && invoiceAgg) {
                              return <td key={f.key} className="px-3 py-2 whitespace-nowrap">{fmt$(invoiceAgg[f.key] || 0)}</td>;
                            }
                            return <td key={f.key} className="px-3 py-2"></td>;
                          })}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </CardContent>
            </Card>
            </>
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