import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, startOfMonth, endOfMonth, parseISO, isSameMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus, FileText, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import InvoiceGenerator from "@/components/invoices/InvoiceGenerator";
import InvoiceDetail from "@/components/invoices/InvoiceDetail";
import BudgetTracker from "@/components/invoices/BudgetTracker";
import InvoiceConfigEditor from "@/components/invoices/InvoiceConfigEditor";

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [config, setConfig] = useState(null);
  const [clients, setClients] = useState([]);
  const [financialRecords, setFinancialRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | generate | detail | config
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));

  const loadData = async () => {
    setLoading(true);
    const [invs, cfgs, cls, fins] = await Promise.all([
      base44.entities.Invoice.list("-billing_month", 100),
      base44.entities.InvoiceConfig.list(),
      base44.entities.Client.list("-intake_date", 1000),
      base44.entities.FinancialRecord.list("-date", 1000),
    ]);
    setInvoices(invs);
    setConfig(cfgs.find(c => c.is_active) || cfgs[0] || null);
    setClients(cls);
    setFinancialRecords(fins);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const existingForMonth = invoices.find(i => i.billing_month === selectedMonth);

  const changeMonth = (dir) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    setSelectedMonth(format(d, "yyyy-MM"));
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Invoice Generator</h1>
          <p className="text-sm text-slate-500">{config?.config_name || "No contract configured"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView("config")}>
            <Settings className="w-4 h-4 mr-1" /> Contract Config
          </Button>
          <Link to="/reports"><Button variant="outline" size="sm">Reports</Button></Link>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Budget Tracker */}
        {config && (
          <BudgetTracker config={config} invoices={invoices} financialRecords={financialRecords} />
        )}

        {/* Month selector + action */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <span className="text-lg font-semibold text-slate-800 min-w-36 text-center">
              {format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
          <div className="flex items-center gap-2">
            {existingForMonth ? (
              <Button
                onClick={() => { setSelectedInvoice(existingForMonth); setView("detail"); }}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-1" />
                View {existingForMonth.status === "draft" ? "Draft" : "Invoice"}
              </Button>
            ) : (
              <Button
                onClick={() => setView("generate")}
                disabled={!config}
              >
                <Plus className="w-4 h-4 mr-1" />
                Generate Invoice
              </Button>
            )}
          </div>
        </div>

        {/* Invoice list */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-700">All Invoices</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Invoice #</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Billing Month</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600">Status</th>
                <th className="text-right px-4 py-2.5 font-semibold text-slate-600">Total</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-slate-700">{inv.invoice_number || "—"}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {inv.billing_month ? format(parseISO(inv.billing_month + "-01"), "MMMM yyyy") : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === "finalized" ? "bg-green-100 text-green-700" :
                      inv.status === "submitted" ? "bg-blue-100 text-blue-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {inv.status || "draft"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-slate-800">
                    ${(inv.total_amount || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => { setSelectedInvoice(inv); setView("detail"); }}
                    >
                      Open
                    </Button>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-slate-400">No invoices generated yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Overlays */}
      {view === "generate" && (
        <InvoiceGenerator
          billingMonth={selectedMonth}
          config={config}
          clients={clients}
          financialRecords={financialRecords}
          allInvoices={invoices}
          onSaved={(inv) => { loadData(); setSelectedInvoice(inv); setView("detail"); }}
          onClose={() => setView("list")}
        />
      )}
      {view === "detail" && selectedInvoice && (
        <InvoiceDetail
          invoice={selectedInvoice}
          config={config}
          onUpdated={loadData}
          onClose={() => setView("list")}
        />
      )}
      {view === "config" && (
        <InvoiceConfigEditor
          config={config}
          onSaved={() => { loadData(); setView("list"); }}
          onClose={() => setView("list")}
        />
      )}
    </div>
  );
}