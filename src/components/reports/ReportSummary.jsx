import { useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, DollarSign, Briefcase, BookOpen, Award, Printer, FileDown, Share2, PieChart as PieIcon } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const SERVICE_LABELS = {
  direct_to_employment: "DEA (Direct to Employment)",
  pathways: "Pathways",
  casual: "Casual",
  internal_referral: "Internal Referral",
  external_referral: "External Referral",
  not_eligible: "Not Eligible",
};

const EMP_STATUS_LABELS = {
  "E-RF": "Employed – Related Field (E-RF)",
  "E-UF": "Employed – Unrelated Field (E-UF)",
  "E-PT": "Employed – Part Time (E-PT)",
  "UE": "Unemployed (UE)",
  "UE-LA": "Unemployed – Looking Actively (UE-LA)",
  "UE-S": "Unemployed – Student (UE-S)",
  "NA": "Not Applicable (NA)",
  "no_contact": "No Contact",
};

const PIE_COLORS = [
  "#1a237e", "#7c3aed", "#0369a1", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#9333ea", "#64748b", "#1d4ed8",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
];

function StatCard({ title, value, sub, icon: Icon, color = "text-primary" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs font-semibold text-slate-600 mt-0.5">{title}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function MiniPie({ rows }) {
  const data = rows.map((r, i) => ({
    name: r.label,
    value: r.count,
    fill: r.color || PIE_COLORS[i % PIE_COLORS.length],
  }));

  const renderLabel = (entry) => {
    const RADIAN = Math.PI / 180;
    const radius = 80 * 0.65; // Position inside the pie
    const x = entry.cx + radius * Math.cos(-entry.midAngle * RADIAN);
    const y = entry.cy + radius * Math.sin(-entry.midAngle * RADIAN);
    const percent = ((entry.value / data.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0);

    if (percent < 3) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="13"
        fontWeight="bold"
      >
        {`${percent}%`}
      </text>
    );
  };

  return (
    <div className="mt-4 pt-3 border-t border-slate-100 -mx-6 px-6 pb-4">
      <div className="flex justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={renderLabel}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => val} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function BreakdownCard({ title, rows, children }) {
  const [showPie, setShowPie] = useState(false);
  const hasData = rows && rows.length > 0;
  const total = hasData ? rows.reduce((s, r) => s + r.count, 0) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{title}</CardTitle>
          {hasData && total > 0 && (
            <button
              onClick={() => setShowPie(p => !p)}
              title={showPie ? "Hide pie chart" : "Show pie chart"}
              className={`p-1 rounded hover:bg-slate-100 transition-colors ${showPie ? "text-primary" : "text-slate-400"}`}
            >
              <PieIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {children}
        {showPie && hasData && <MiniPie rows={rows} />}
      </CardContent>
    </Card>
  );
}

function BreakdownTable({ title, rows }) {
  if (!rows || rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      {title && <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</h4>}
      <div className="space-y-2">
        {rows.map((r, i) => {
          const color = r.color || PIE_COLORS[i % PIE_COLORS.length];
          return (
            <div key={r.label} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs text-slate-700 truncate">{r.label}</span>
                  <span className="text-xs font-semibold text-slate-800 ml-2 shrink-0">{r.count}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: total > 0 ? `${(r.count / total) * 100}%` : "0%",
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function fmt$(n) {
  if (!n && n !== 0) return "$0.00";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReportSummary({ results, financialRecords, selectedSections = [], onClear, onExportCSV, dateRange, appliedFilters, allClients, demographicFilters }) {
  const reportRef = useRef(null);

  const handlePrint = () => window.print();

  const handleSavePDF = async () => {
    const { jsPDF } = await import("jspdf");
    const { default: html2canvas } = await import("html2canvas");
    if (!reportRef.current) return;
    toast("Generating PDF…");
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;
      let y = 0;
      while (y < imgHeight) {
        pdf.addImage(imgData, "PNG", 0, -y, pageWidth, imgHeight);
        if (y + pageHeight < imgHeight) pdf.addPage();
        y += pageHeight;
      }
      pdf.save(`report-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("PDF saved!");
    } catch {
      toast.error("Failed to generate PDF");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: "Client Report", url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;

    const total = results.length;

    const streamCounts = {};
    results.forEach(c => {
      const s = c.service_type || "unknown";
      streamCounts[s] = (streamCounts[s] || 0) + 1;
    });
    const streamRows = Object.entries(streamCounts).map(([k, v]) => ({
      label: SERVICE_LABELS[k] || k,
      count: v,
      color: k === "direct_to_employment" ? "#1a237e" : k === "pathways" ? "#7c3aed" : k === "casual" ? "#0369a1" : "#64748b",
    })).sort((a, b) => b.count - a.count);

    const deaClients = results.filter(c => c.service_type === "direct_to_employment");
    const pathwaysClients = results.filter(c => c.service_type === "pathways");
    const deaStarters = deaClients.filter(c => c.service_start_date).length;
    const deaCompleters = deaClients.filter(c => c.program_status === "complete").length;
    const pathwaysStarters = pathwaysClients.filter(c => c.service_start_date).length;
    const pathwaysCompleters = pathwaysClients.filter(c => c.program_status === "complete").length;

    const employed = results.filter(c =>
      c.post_completion_employment_status && ["E-RF", "E-UF", "E-PT"].includes(c.post_completion_employment_status)
    ).length;
    const followup90Employed = results.filter(c =>
      c.followup_90day_status && ["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)
    ).length;

    const intakeEmpCounts = {};
    results.forEach(c => {
      const s = c.employment_status || "unknown";
      intakeEmpCounts[s] = (intakeEmpCounts[s] || 0) + 1;
    });
    const intakeEmpRows = Object.entries(intakeEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const postEmpCounts = {};
    results.filter(c => c.post_completion_employment_status).forEach(c => {
      postEmpCounts[c.post_completion_employment_status] = (postEmpCounts[c.post_completion_employment_status] || 0) + 1;
    });
    const postEmpRows = Object.entries(postEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const fu90Counts = {};
    results.filter(c => c.followup_90day_status).forEach(c => {
      fu90Counts[c.followup_90day_status] = (fu90Counts[c.followup_90day_status] || 0) + 1;
    });
    const fu90Rows = Object.entries(fu90Counts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    const caseStatusCounts = {};
    results.forEach(c => {
      const s = c.status || "unknown";
      caseStatusCounts[s] = (caseStatusCounts[s] || 0) + 1;
    });
    const caseStatusRows = Object.entries(caseStatusCounts)
      .map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), count: v }))
      .sort((a, b) => b.count - a.count);

    const programStatusCounts = {};
    results.forEach(c => {
      if (!c.program_status) return;
      programStatusCounts[c.program_status] = (programStatusCounts[c.program_status] || 0) + 1;
    });
    const programStatusRows = Object.entries(programStatusCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    const referralCounts = {};
    results.forEach(c => {
      if (!c.referral_source) return;
      referralCounts[c.referral_source] = (referralCounts[c.referral_source] || 0) + 1;
    });
    const referralRows = Object.entries(referralCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    const clientIds = new Set(results.map(c => c.id));
    const relevantFinancials = financialRecords.filter(r => clientIds.has(r.client_id));
    const exposureRecords = relevantFinancials.filter(r => r.record_type === "exposure_course");
    const placementRecords = relevantFinancials.filter(r => r.record_type === "paid_external_placement");
    const supportsRecords = relevantFinancials.filter(r => r.record_type === "employment_supports");
    const totalExposure = exposureRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalPlacement = placementRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalSupports = supportsRecords.reduce((s, r) => s + (r.amount || 0), 0);

    const barrierCounts = {};
    results.forEach(c => {
      [c.barrier_1, c.barrier_2, c.barrier_3].filter(Boolean).forEach(b => {
        barrierCounts[b] = (barrierCounts[b] || 0) + 1;
      });
    });
    const barrierRows = Object.entries(barrierCounts)
      .map(([k, v]) => ({ label: k, count: v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Financial rows for pie
    const financialRows = [
      { label: "Exposure Courses", count: exposureRecords.length, color: "#f59e0b" },
      { label: "Paid Placements", count: placementRecords.length, color: "#10b981" },
      { label: "Employment Supports", count: supportsRecords.length, color: "#6366f1" },
    ].filter(r => r.count > 0);

    return {
      total,
      streamRows,
      deaStarters, deaCompleters,
      pathwaysStarters, pathwaysCompleters,
      employed, followup90Employed,
      intakeEmpRows, postEmpRows, fu90Rows,
      caseStatusRows, programStatusRows,
      referralRows, barrierRows, financialRows,
      exposureCount: exposureRecords.length,
      placementCount: placementRecords.length,
      supportsCount: supportsRecords.length,
      totalExposure, totalPlacement, totalSupports,
      totalDirect: totalExposure + totalPlacement + totalSupports,
    };
  }, [results, financialRecords]);

  if (!stats) {
    return (
      <div className="text-center py-10 text-slate-400 text-sm">
        No clients match the selected filters.
      </div>
    );
  }

  const show = (key) => selectedSections.includes(key) || selectedSections.length === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{stats.total} Client{stats.total !== 1 ? "s" : ""} in Report</h2>
          <p className="text-xs text-slate-500">Aggregated summary across filtered clients</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5" /> Print
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSavePDF}>
            <FileDown className="w-3.5 h-3.5" /> Save as PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleShare}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
        </div>
      </div>

      <div ref={reportRef}>
        {/* Print/PDF Header */}
        <div className="mb-6 pb-6 border-b-2 border-slate-200 bg-white">
          <div className="flex items-center gap-4 mb-4">
            <img src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" alt="Candora" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Pathways Summary Report</h1>
              <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          {/* Report Scope Section */}
          <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-700 uppercase tracking-wide">Report Scope</p>
            <div className="grid grid-cols-4 gap-x-3 gap-y-2">
              {/* Date Range - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Date Range</p>
                <p className="text-slate-600">
                  {dateRange.from || 'All time'} → {dateRange.from ? dateRange.to : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
              
              {/* Service Streams - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Service Streams</p>
                <p className="text-slate-600 truncate" title={appliedFilters.service_type && appliedFilters.service_type.length > 0 ? appliedFilters.service_type.join(', ') : 'All streams'}>
                  {appliedFilters.service_type && appliedFilters.service_type.length > 0 
                    ? appliedFilters.service_type.join(', ') 
                    : 'All streams'}
                </p>
              </div>
              
              {/* Case Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Case Status</p>
                <p className="text-slate-600 truncate" title={appliedFilters.status && appliedFilters.status.length > 0 ? appliedFilters.status.join(', ') : 'All statuses'}>
                  {appliedFilters.status && appliedFilters.status.length > 0 
                    ? appliedFilters.status.join(', ') 
                    : 'All statuses'}
                </p>
              </div>
              
              {/* Program Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Program Status</p>
                <p className="text-slate-600 truncate" title={appliedFilters.program_status && appliedFilters.program_status.length > 0 ? appliedFilters.program_status.join(', ') : 'All statuses'}>
                  {appliedFilters.program_status && appliedFilters.program_status.length > 0 
                    ? appliedFilters.program_status.join(', ') 
                    : 'All statuses'}
                </p>
              </div>
              
              {/* Residency Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Residency Status</p>
                <p className="text-slate-600 truncate" title={appliedFilters.residency_status && appliedFilters.residency_status.length > 0 ? appliedFilters.residency_status.join(', ') : 'All statuses'}>
                  {appliedFilters.residency_status && appliedFilters.residency_status.length > 0 
                    ? appliedFilters.residency_status.join(', ') 
                    : 'All statuses'}
                </p>
              </div>
              
              {/* CLB Level - always shown */}
              <div>
                <p className="font-semibold text-slate-700">CLB Level</p>
                <p className="text-slate-600 truncate" title={appliedFilters.clb_level && appliedFilters.clb_level.length > 0 ? appliedFilters.clb_level.join(', ') : 'All levels'}>
                  {appliedFilters.clb_level && appliedFilters.clb_level.length > 0 
                    ? appliedFilters.clb_level.join(', ') 
                    : 'All levels'}
                </p>
              </div>
              
              {/* Employment Status - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Employment Status</p>
                <p className="text-slate-600 truncate" title={appliedFilters.employment_status && appliedFilters.employment_status.length > 0 ? appliedFilters.employment_status.join(', ') : 'All statuses'}>
                  {appliedFilters.employment_status && appliedFilters.employment_status.length > 0 
                    ? appliedFilters.employment_status.join(', ') 
                    : 'All statuses'}
                </p>
              </div>
              
              {/* Referral Source - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Referral Source</p>
                <p className="text-slate-600 truncate" title={appliedFilters.referral_source && appliedFilters.referral_source.length > 0 ? appliedFilters.referral_source.join(', ') : 'All sources'}>
                  {appliedFilters.referral_source && appliedFilters.referral_source.length > 0 
                    ? appliedFilters.referral_source.join(', ') 
                    : 'All sources'}
                </p>
              </div>
              
              {/* Career Counsellor - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Career Counsellor</p>
                <p className="text-slate-600 truncate" title={appliedFilters.assigned_worker_name && appliedFilters.assigned_worker_name.length > 0 ? appliedFilters.assigned_worker_name.join(', ') : 'All counsellors'}>
                  {appliedFilters.assigned_worker_name && appliedFilters.assigned_worker_name.length > 0 
                    ? appliedFilters.assigned_worker_name.join(', ') 
                    : 'All counsellors'}
                </p>
              </div>
              
              {/* Barrier Type - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Barrier Type</p>
                <p className="text-slate-600 truncate" title={appliedFilters.barrier_1 && appliedFilters.barrier_1.length > 0 ? appliedFilters.barrier_1.join(', ') : 'All types'}>
                  {appliedFilters.barrier_1 && appliedFilters.barrier_1.length > 0 
                    ? appliedFilters.barrier_1.join(', ') 
                    : 'All types'}
                </p>
              </div>
              
              {/* Has Vehicle - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Has Vehicle</p>
                <p className="text-slate-600 truncate" title={appliedFilters.has_vehicle || 'All'}>
                  {appliedFilters.has_vehicle || 'All'}
                </p>
              </div>
              
              {/* City - always shown */}
              <div>
                <p className="font-semibold text-slate-700">City</p>
                <p className="text-slate-600 truncate" title={appliedFilters.city && appliedFilters.city.trim() !== '' ? appliedFilters.city : 'All cities'}>
                  {appliedFilters.city && appliedFilters.city.trim() !== '' ? appliedFilters.city : 'All cities'}
                </p>
              </div>
              
              {/* Close Reason - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Close Reason</p>
                <p className="text-slate-600 truncate" title={appliedFilters.closed_reason && appliedFilters.closed_reason.length > 0 ? appliedFilters.closed_reason.join(', ') : 'All reasons'}>
                  {appliedFilters.closed_reason && appliedFilters.closed_reason.length > 0 
                    ? appliedFilters.closed_reason.join(', ') 
                    : 'All reasons'}
                </p>
              </div>
              
              {/* Compass Verified - always shown */}
              <div>
                <p className="font-semibold text-slate-700">Compass Verified</p>
                <p className="text-slate-600 truncate" title={appliedFilters.compass_verified !== undefined && appliedFilters.compass_verified !== '' ? (appliedFilters.compass_verified === true ? 'Yes' : 'No') : 'All'}>
                  {appliedFilters.compass_verified !== undefined && appliedFilters.compass_verified !== '' 
                    ? (appliedFilters.compass_verified === true ? 'Yes' : 'No') 
                    : 'All'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <StatCard title="Total Clients" value={stats.total} icon={Users} color="text-primary" />
          {show("starters_completers") && (
            <StatCard title="Employment Outcomes" value={stats.employed} sub="post-completion employed" icon={Briefcase} color="text-green-600" />
          )}
          {show("employment_90day") && (
            <StatCard title="90-Day Sustained" value={stats.followup90Employed} sub="employed at follow-up" icon={Award} color="text-purple-600" />
          )}
          {show("financial_summary") && (
            <StatCard title="Total Direct Costs" value={fmt$(stats.totalDirect)} sub="courses + placements + supports" icon={DollarSign} color="text-amber-600" />
          )}
        </div>

        {/* Program outcomes */}
        {show("starters_completers") && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Program Starters & Completers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "DEA Starters", value: stats.deaStarters, color: "bg-blue-50 border-blue-200 text-blue-800" },
                    { label: "DEA Completers", value: stats.deaCompleters, color: "bg-blue-100 border-blue-300 text-blue-900" },
                    { label: "Pathways Starters", value: stats.pathwaysStarters, color: "bg-purple-50 border-purple-200 text-purple-800" },
                    { label: "Pathways Completers", value: stats.pathwaysCompleters, color: "bg-purple-100 border-purple-300 text-purple-900" },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
                      <p className="text-2xl font-bold">{item.value}</p>
                      <p className="text-xs font-medium mt-0.5">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {show("financial_summary") && (
              <BreakdownCard title="Financial Summary" rows={stats.financialRows}>
                <div className="space-y-3">
                  {[
                    { label: "Exposure Courses", count: stats.exposureCount, total: stats.totalExposure, color: "#f59e0b" },
                    { label: "Paid External Placements", count: stats.placementCount, total: stats.totalPlacement, color: "#10b981" },
                    { label: "Employment Supports", count: stats.supportsCount, total: stats.totalSupports, color: "#6366f1" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-slate-700">{item.label}</span>
                        <span className="text-xs text-slate-400">({item.count} records)</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-800">{fmt$(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700">Total</span>
                    <span className="text-sm font-bold text-slate-900">{fmt$(stats.totalDirect)}</span>
                  </div>
                </div>
              </BreakdownCard>
            )}
          </div>
        )}

        {/* Breakdowns grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {show("service_stream") && (
            <BreakdownCard title="Service Stream" rows={stats.streamRows}>
              <BreakdownTable rows={stats.streamRows} />
            </BreakdownCard>
          )}

          {show("case_program_status") && (
            <>
              <BreakdownCard title="Case Status" rows={stats.caseStatusRows}>
                <BreakdownTable rows={stats.caseStatusRows} />
              </BreakdownCard>
              {stats.programStatusRows.length > 0 && (
                <BreakdownCard title="Program Status" rows={stats.programStatusRows}>
                  <BreakdownTable rows={stats.programStatusRows} />
                </BreakdownCard>
              )}
            </>
          )}

          {show("referral_source") && (
            <BreakdownCard title="Referral Source" rows={stats.referralRows}>
              <BreakdownTable rows={stats.referralRows} />
            </BreakdownCard>
          )}

          {show("employment_intake") && (
            <BreakdownCard title="Employment Status at Intake" rows={stats.intakeEmpRows}>
              <BreakdownTable rows={stats.intakeEmpRows} />
            </BreakdownCard>
          )}

          {show("employment_post") && stats.postEmpRows.length > 0 && (
            <BreakdownCard title="Post-Completion Employment Status" rows={stats.postEmpRows}>
              <BreakdownTable rows={stats.postEmpRows} />
            </BreakdownCard>
          )}

          {show("employment_90day") && stats.fu90Rows.length > 0 && (
            <BreakdownCard title="90-Day Follow-Up Status" rows={stats.fu90Rows}>
              <BreakdownTable rows={stats.fu90Rows} />
            </BreakdownCard>
          )}

          {show("barriers") && stats.barrierRows.length > 0 && (
            <BreakdownCard title="Top Barriers Identified" rows={stats.barrierRows}>
              <BreakdownTable rows={stats.barrierRows} />
            </BreakdownCard>
          )}
        </div>
      </div>
    </div>
  );
}