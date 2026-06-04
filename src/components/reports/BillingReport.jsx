import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download, Receipt, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const CATEGORY_LABELS = {
  base: "Base Monthly Fee",
  starter: "Starters",
  completer: "Completers",
  employment_outcome: "Employment Outcomes",
  "90day_outcome": "90-Day Outcomes",
  exposure_course: "Exposure Courses",
  paid_placement: "Paid Placements",
  employment_support: "Employment Supports",
};

const CATEGORY_COLORS = {
  base: "#6366f1",
  starter: "#3b82f6",
  completer: "#10b981",
  employment_outcome: "#f59e0b",
  "90day_outcome": "#f97316",
  exposure_course: "#8b5cf6",
  paid_placement: "#ec4899",
  employment_support: "#14b8a6",
};

function fmt$(n) {
  if (!n && n !== 0) return "—";
  return "$" + Number(n).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function BillingReport() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    base44.entities.Invoice.list("-billing_month", 500).then(data => {
      setInvoices(data);
      setLoading(false);
    });
  }, []);

  const years = [...new Set(invoices.map(inv => inv.billing_month?.substring(0, 4)).filter(Boolean))].sort().reverse();

  const filtered = invoices.filter(inv => {
    if (yearFilter !== "all" && !inv.billing_month?.startsWith(yearFilter)) return false;
    if (monthFilter !== "all" && inv.billing_month?.substring(5, 7) !== monthFilter) return false;
    if (statusFilter !== "all" && inv.status !== statusFilter) return false;
    return true;
  });

  // Aggregate totals
  const totalBilled = filtered.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalDeliverables = filtered.reduce((sum, inv) => sum + (inv.subtotal_deliverables || 0), 0);
  const totalDirectCosts = filtered.reduce((sum, inv) => sum + (inv.subtotal_direct_costs || 0), 0);

  // By category across all filtered invoices
  const categoryTotals = {};
  filtered.forEach(inv => {
    (inv.line_items || []).forEach(item => {
      if (item.excluded) return;
      const cat = item.category || "other";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.amount || 0);
    });
    // Base fee
    if (inv.base_amount) {
      categoryTotals["base"] = (categoryTotals["base"] || 0) + inv.base_amount;
    }
  });

  // Monthly trend data
  const monthlyMap = {};
  filtered.forEach(inv => {
    const m = inv.billing_month;
    if (!m) return;
    if (!monthlyMap[m]) monthlyMap[m] = { month: m, total: 0, deliverables: 0, direct_costs: 0 };
    monthlyMap[m].total += inv.total_amount || 0;
    monthlyMap[m].deliverables += inv.subtotal_deliverables || 0;
    monthlyMap[m].direct_costs += inv.subtotal_direct_costs || 0;
  });
  const monthlyData = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)).map(m => ({
    ...m,
    label: m.month,
  }));

  const exportCSV = () => {
    const rows = [
      ["Billing Month", "Invoice #", "Status", "Base Amount", "Deliverables", "Direct Costs", "Total"],
      ...filtered.map(inv => [
        inv.billing_month || "",
        inv.invoice_number || "",
        inv.status || "",
        inv.base_amount || 0,
        inv.subtotal_deliverables || 0,
        inv.subtotal_direct_costs || 0,
        inv.total_amount || 0,
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `billing_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex items-center justify-center py-16"><div className="w-6 h-6 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" /></div>;

  if (invoices.length === 0) return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Receipt className="w-12 h-12 mb-3 opacity-30" />
      <p className="font-medium">No invoices found.</p>
      <p className="text-sm mt-1">Generate invoices in the Monthly Billing section first.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <Label className="text-xs mb-1 block">Year</Label>
              <select className="h-8 text-xs border border-slate-200 rounded px-2" value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                <option value="all">All Years</option>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Month</Label>
              <select className="h-8 text-xs border border-slate-200 rounded px-2" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                <option value="all">All Months</option>
                {Array.from({ length: 12 }, (_, i) => {
                  const m = String(i + 1).padStart(2, "0");
                  return <option key={m} value={m}>{format(new Date(`2000-${m}-01`), "MMMM")}</option>;
                })}
              </select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Status</Label>
              <select className="h-8 text-xs border border-slate-200 rounded px-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="finalized">Finalized</option>
                <option value="submitted">Submitted</option>
              </select>
            </div>
            <Button variant="outline" size="sm" className="gap-1 h-8" onClick={exportCSV}>
              <Download className="w-3 h-3" /> Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{fmt$(totalBilled)}</div>
                <div className="text-xs text-slate-500">Total Billed ({filtered.length} invoice{filtered.length !== 1 ? "s" : ""})</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{fmt$(totalDeliverables)}</div>
                <div className="text-xs text-slate-500">Deliverables (fees)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-800">{fmt$(totalDirectCosts)}</div>
                <div className="text-xs text-slate-500">Direct Costs (reimbursements)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" />Billed by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => {
                const pct = totalBilled > 0 ? (amt / totalBilled) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-slate-700">{CATEGORY_LABELS[cat] || cat}</span>
                      <span className="font-semibold text-slate-800">{fmt$(amt)}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] || "#94a3b8" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        {monthlyData.length > 1 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" />Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => fmt$(v)} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="deliverables" name="Deliverables" fill="#3b82f6" stackId="a" />
                  <Bar dataKey="direct_costs" name="Direct Costs" fill="#f59e0b" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Invoice Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Invoice Detail</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Billing Month</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Invoice #</th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Status</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-600">Base Fee</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-600">Deliverables</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-600">Direct Costs</th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-600">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{inv.billing_month}</td>
                    <td className="px-3 py-2 text-slate-700">{inv.invoice_number || "—"}</td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === "submitted" ? "bg-green-100 text-green-700" :
                        inv.status === "finalized" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>{inv.status}</span>
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmt$(inv.base_amount)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmt$(inv.subtotal_deliverables)}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{fmt$(inv.subtotal_direct_costs)}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-800">{fmt$(inv.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300 font-semibold text-xs">
                <tr>
                  <td className="px-3 py-2 text-slate-600" colSpan={3}>Total ({filtered.length} invoices)</td>
                  <td className="px-3 py-2 text-right text-slate-800">{fmt$(filtered.reduce((s, i) => s + (i.base_amount || 0), 0))}</td>
                  <td className="px-3 py-2 text-right text-slate-800">{fmt$(totalDeliverables)}</td>
                  <td className="px-3 py-2 text-right text-slate-800">{fmt$(totalDirectCosts)}</td>
                  <td className="px-3 py-2 text-right text-slate-800">{fmt$(totalBilled)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}