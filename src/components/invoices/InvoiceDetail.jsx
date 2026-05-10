import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { X, Printer } from "lucide-react";

const STATUS_FLOW = ["draft", "finalized", "submitted"];

export default function InvoiceDetail({ invoice, config, onUpdated, onClose }) {
  const [saving, setSaving] = useState(false);

  const fmt = (n) => `$${(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;

  const advanceStatus = async () => {
    setSaving(true);
    const currentIdx = STATUS_FLOW.indexOf(invoice.status || "draft");
    const nextStatus = STATUS_FLOW[currentIdx + 1] || invoice.status;
    const patch = { status: nextStatus };
    if (nextStatus === "finalized") patch.finalized_date = format(new Date(), "yyyy-MM-dd");
    await base44.entities.Invoice.update(invoice.id, patch);
    setSaving(false);
    onUpdated();
    onClose();
  };

  const deleteInvoice = async () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await base44.entities.Invoice.delete(invoice.id);
    onUpdated();
    onClose();
  };

  const activeItems = (invoice.line_items || []).filter(i => !i.excluded);
  const excludedItems = (invoice.line_items || []).filter(i => i.excluded);

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(invoice.status || "draft") + 1];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{invoice.invoice_number || "Invoice"}</h2>
            <p className="text-sm text-slate-500">
              {invoice.billing_month ? format(parseISO(invoice.billing_month + "-01"), "MMMM yyyy") : ""} ·{" "}
              <span className={`font-medium ${invoice.status === "finalized" ? "text-green-700" : invoice.status === "submitted" ? "text-blue-700" : "text-amber-700"}`}>
                {invoice.status || "draft"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 ml-2"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Base fee */}
          <div className="bg-slate-50 rounded-lg p-4 flex justify-between font-medium text-slate-700">
            <span>Base Monthly Fee</span>
            <span>{fmt(invoice.base_amount)}</span>
          </div>

          {/* Active line items */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 font-semibold text-slate-600 text-sm">
              Billable Line Items
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Client</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Description</th>
                  <th className="text-right px-3 py-2 font-medium text-slate-500">Amount</th>
                  <th className="text-left px-3 py-2 font-medium text-slate-500">Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeItems.map((item, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-3 py-2 text-slate-700">{item.client_name}</td>
                    <td className="px-3 py-2 text-slate-600">{item.description}</td>
                    <td className="px-3 py-2 text-right font-mono">{fmt(item.amount)}</td>
                    <td className="px-3 py-2 text-xs text-slate-400 max-w-40">{item.switch_note || ""}</td>
                  </tr>
                ))}
                {activeItems.length === 0 && (
                  <tr><td colSpan={4} className="text-center py-6 text-slate-400">No billable line items.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Excluded items */}
          {excludedItems.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2.5 bg-red-50 border-b border-red-200 font-semibold text-red-700 text-sm">
                Excluded Items (Double-Billing / Cap Reached)
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-red-100">
                  {excludedItems.map((item, i) => (
                    <tr key={i} className="bg-red-50/40">
                      <td className="px-3 py-2 text-slate-600">{item.client_name}</td>
                      <td className="px-3 py-2 text-slate-500">{item.description}</td>
                      <td className="px-3 py-2 text-sm text-red-600">{item.exclude_reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-slate-600 text-sm"><span>Base Monthly Fee</span><span>{fmt(invoice.base_amount)}</span></div>
            <div className="flex justify-between text-slate-600 text-sm"><span>Deliverables & Outcomes</span><span>{fmt(invoice.subtotal_deliverables)}</span></div>
            <div className="flex justify-between text-slate-600 text-sm"><span>Direct Costs (Reimbursement)</span><span>{fmt(invoice.subtotal_direct_costs)}</span></div>
            <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-800 text-base">
              <span>TOTAL</span><span>{fmt(invoice.total_amount)}</span>
            </div>
          </div>

          {invoice.notes && (
            <div className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <span className="font-medium text-slate-700">Notes: </span>{invoice.notes}
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            {invoice.status === "draft" ? (
              <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={deleteInvoice}>
                Delete Draft
              </Button>
            ) : <div />}
            {nextStatus && (
              <Button onClick={advanceStatus} disabled={saving}>
                {saving ? "Saving..." : `Mark as ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}