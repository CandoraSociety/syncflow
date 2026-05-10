import { useMemo } from "react";

function ProgressBar({ used, cap, label, format = "dollar" }) {
  const pct = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  const remaining = cap - used;
  const over = used > cap;

  const fmt = (n) =>
    format === "dollar"
      ? `$${(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`
      : `${Math.round(n || 0)}`;

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <span className={`text-xs font-semibold ${over ? "text-red-600" : "text-slate-700"}`}>
          {fmt(used)} / {fmt(cap)}
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? "bg-red-500" : pct > 80 ? "bg-amber-400" : "bg-green-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400">
        <span>{over ? <span className="text-red-600 font-medium">Over cap by {fmt(Math.abs(remaining))}</span> : `${fmt(remaining)} remaining`}</span>
        <span>{Math.round(pct)}% used</span>
      </div>
    </div>
  );
}

export default function BudgetTracker({ config, invoices, financialRecords }) {
  const totals = useMemo(() => {
    const t = {
      starters: 0,
      completers: 0,
      employment_outcomes: 0,
      outcomes_90day: 0,
      exposure_courses_dollars: 0,
      paid_placements_dollars: 0,
      employment_supports_dollars: 0,
    };

    for (const inv of invoices) {
      if (inv.status === "draft") continue; // only count finalized/submitted
      for (const li of (inv.line_items || [])) {
        if (li.excluded) continue;
        if (li.category === "starter") t.starters++;
        if (li.category === "completer") t.completers++;
        if (li.category === "employment_outcome") t.employment_outcomes++;
        if (li.category === "90day_outcome") t.outcomes_90day++;
        if (li.category === "exposure_course") t.exposure_courses_dollars += li.amount || 0;
        if (li.category === "paid_external_placement") t.paid_placements_dollars += li.amount || 0;
        if (li.category === "employment_supports") t.employment_supports_dollars += li.amount || 0;
      }
    }
    return t;
  }, [invoices]);

  const caps = {
    starters: config.cap_starters,
    completers: config.cap_completers,
    employment_outcomes: config.cap_employment_outcomes,
    outcomes_90day: config.cap_90day_outcomes,
    exposure_courses_dollars: config.cap_exposure_courses_dollars,
    paid_placements_dollars: config.cap_paid_placements_dollars,
    employment_supports_dollars: config.cap_employment_supports_dollars,
  };

  const hasCaps = Object.values(caps).some(v => v > 0);
  if (!hasCaps) return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
      No contract caps configured yet. <span className="font-medium">Open Contract Config to set caps and rates.</span>
    </div>
  );

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <h2 className="font-semibold text-slate-700 mb-4">Contract Budget Tracker <span className="text-xs font-normal text-slate-400">(finalized invoices only)</span></h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {caps.starters > 0 && (
          <ProgressBar label="Starters" used={totals.starters} cap={caps.starters} format="count" />
        )}
        {caps.completers > 0 && (
          <ProgressBar label="Completers" used={totals.completers} cap={caps.completers} format="count" />
        )}
        {caps.employment_outcomes > 0 && (
          <ProgressBar label="Employment Outcomes" used={totals.employment_outcomes} cap={caps.employment_outcomes} format="count" />
        )}
        {caps.outcomes_90day > 0 && (
          <ProgressBar label="90-Day Outcomes" used={totals.outcomes_90day} cap={caps.outcomes_90day} format="count" />
        )}
        {caps.exposure_courses_dollars > 0 && (
          <ProgressBar label="Exposure Courses / Training" used={totals.exposure_courses_dollars} cap={caps.exposure_courses_dollars} format="dollar" />
        )}
        {caps.paid_placements_dollars > 0 && (
          <ProgressBar label="Paid External Placements" used={totals.paid_placements_dollars} cap={caps.paid_placements_dollars} format="dollar" />
        )}
        {caps.employment_supports_dollars > 0 && (
          <ProgressBar label="Employment Supports / Work Equipment" used={totals.employment_supports_dollars} cap={caps.employment_supports_dollars} format="dollar" />
        )}
      </div>
    </div>
  );
}