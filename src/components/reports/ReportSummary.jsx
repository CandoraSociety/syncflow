import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, TrendingUp, DollarSign, Briefcase, BookOpen, Award } from "lucide-react";

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

function BreakdownTable({ title, rows, valueLabel = "Count" }) {
  if (!rows || rows.length === 0) return null;
  const total = rows.reduce((s, r) => s + r.count, 0);
  return (
    <div>
      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{title}</h4>
      <div className="space-y-1">
        {rows.map(r => (
          <div key={r.label} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs text-slate-700 truncate">{r.label}</span>
                <span className="text-xs font-semibold text-slate-800 ml-2 shrink-0">{r.count}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: total > 0 ? `${(r.count / total) * 100}%` : "0%",
                    backgroundColor: r.color || "#1a237e",
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function fmt$(n) {
  if (!n && n !== 0) return "$0.00";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ReportSummary({ results, financialRecords, selectedSections = [], onClear, onExportCSV }) {
  const stats = useMemo(() => {
    if (!results || results.length === 0) return null;

    const total = results.length;

    // ── Programme streams ──────────────────────────────────────────────────
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

    // ── Program starters / completers ──────────────────────────────────────
    const deaClients = results.filter(c => c.service_type === "direct_to_employment");
    const pathwaysClients = results.filter(c => c.service_type === "pathways");

    const deaStarters = deaClients.filter(c => c.service_start_date).length;
    const deaCompleters = deaClients.filter(c => c.program_status === "complete").length;
    const pathwaysStarters = pathwaysClients.filter(c => c.service_start_date).length;
    const pathwaysCompleters = pathwaysClients.filter(c => c.program_status === "complete").length;

    // ── Employment outcomes ────────────────────────────────────────────────
    const employed = results.filter(c =>
      c.post_completion_employment_status && ["E-RF", "E-UF", "E-PT"].includes(c.post_completion_employment_status)
    ).length;
    const followup90Employed = results.filter(c =>
      c.followup_90day_status && ["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)
    ).length;

    // ── Intake employment status ───────────────────────────────────────────
    const intakeEmpCounts = {};
    results.forEach(c => {
      const s = c.employment_status || "unknown";
      intakeEmpCounts[s] = (intakeEmpCounts[s] || 0) + 1;
    });
    const intakeEmpRows = Object.entries(intakeEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    // ── Post-completion employment status ──────────────────────────────────
    const postEmpCounts = {};
    results.filter(c => c.post_completion_employment_status).forEach(c => {
      const s = c.post_completion_employment_status;
      postEmpCounts[s] = (postEmpCounts[s] || 0) + 1;
    });
    const postEmpRows = Object.entries(postEmpCounts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    // ── 90-day follow-up status ────────────────────────────────────────────
    const fu90Counts = {};
    results.filter(c => c.followup_90day_status).forEach(c => {
      const s = c.followup_90day_status;
      fu90Counts[s] = (fu90Counts[s] || 0) + 1;
    });
    const fu90Rows = Object.entries(fu90Counts)
      .map(([k, v]) => ({ label: EMP_STATUS_LABELS[k] || k, count: v }))
      .sort((a, b) => b.count - a.count);

    // ── Case / program status ──────────────────────────────────────────────
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

    // ── Referral source ────────────────────────────────────────────────────
    const referralCounts = {};
    results.forEach(c => {
      if (!c.referral_source) return;
      referralCounts[c.referral_source] = (referralCounts[c.referral_source] || 0) + 1;
    });
    const referralRows = Object.entries(referralCounts)
      .map(([k, v]) => ({ label: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), count: v }))
      .sort((a, b) => b.count - a.count);

    // ── Financial ─────────────────────────────────────────────────────────
    const clientIds = new Set(results.map(c => c.id));
    const relevantFinancials = financialRecords.filter(r => clientIds.has(r.client_id));

    const exposureRecords = relevantFinancials.filter(r => r.record_type === "exposure_course");
    const placementRecords = relevantFinancials.filter(r => r.record_type === "paid_external_placement");
    const supportsRecords = relevantFinancials.filter(r => r.record_type === "employment_supports");

    const totalExposure = exposureRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalPlacement = placementRecords.reduce((s, r) => s + (r.amount || 0), 0);
    const totalSupports = supportsRecords.reduce((s, r) => s + (r.amount || 0), 0);

    // ── Barriers ──────────────────────────────────────────────────────────
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

    return {
      total,
      streamRows,
      deaStarters, deaCompleters,
      pathwaysStarters, pathwaysCompleters,
      employed, followup90Employed,
      intakeEmpRows, postEmpRows, fu90Rows,
      caseStatusRows, programStatusRows,
      referralRows, barrierRows,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{stats.total} Client{stats.total !== 1 ? "s" : ""} in Report</h2>
          <p className="text-xs text-slate-500">Aggregated summary across filtered clients</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onExportCSV}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
          <Button variant="ghost" size="sm" onClick={onClear}>Clear</Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Total Clients" value={stats.total} icon={Users} color="text-primary" />
        {(selectedSections.includes("starters_completers") || selectedSections.length === 0) && (
          <StatCard title="Employment Outcomes" value={stats.employed} sub="post-completion employed" icon={Briefcase} color="text-green-600" />
        )}
        {(selectedSections.includes("employment_90day") || selectedSections.length === 0) && (
          <StatCard title="90-Day Sustained" value={stats.followup90Employed} sub="employed at follow-up" icon={Award} color="text-purple-600" />
        )}
        {(selectedSections.includes("financial_summary") || selectedSections.length === 0) && (
          <StatCard title="Total Direct Costs" value={fmt$(stats.totalDirect)} sub="courses + placements + supports" icon={DollarSign} color="text-amber-600" />
        )}
      </div>

      {/* Program outcomes - conditional */}
      {(selectedSections.includes("starters_completers") || selectedSections.length === 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Program Starters & Completers</CardTitle>
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

          {(selectedSections.includes("financial_summary") || selectedSections.length === 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-600" /> Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
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
          </CardContent>
        </Card>
          )}
        </div>
      )}

      {/* Breakdowns grid - conditional on selected sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(selectedSections.includes("service_stream") || selectedSections.length === 0) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Service Stream</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.streamRows} /></CardContent>
          </Card>
        )}

        {(selectedSections.includes("case_program_status") || selectedSections.length === 0) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Case Status</CardTitle></CardHeader>
            <CardContent>
              <BreakdownTable rows={stats.caseStatusRows} />
              {stats.programStatusRows.length > 0 && (
                <div className="mt-4">
                  <BreakdownTable title="Program Status" rows={stats.programStatusRows} />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {(selectedSections.includes("referral_source") || selectedSections.length === 0) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Referral Source</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.referralRows} /></CardContent>
          </Card>
        )}

        {(selectedSections.includes("employment_intake") || selectedSections.length === 0) && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Employment Status at Intake</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.intakeEmpRows} /></CardContent>
          </Card>
        )}

        {(selectedSections.includes("employment_post") || selectedSections.length === 0) && stats.postEmpRows.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Post-Completion Employment Status</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.postEmpRows} /></CardContent>
          </Card>
        )}

        {(selectedSections.includes("employment_90day") || selectedSections.length === 0) && stats.fu90Rows.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">90-Day Follow-Up Status</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.fu90Rows} /></CardContent>
          </Card>
        )}

        {(selectedSections.includes("barriers") || selectedSections.length === 0) && stats.barrierRows.length > 0 && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Top Barriers Identified</CardTitle></CardHeader>
            <CardContent><BreakdownTable rows={stats.barrierRows} /></CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}