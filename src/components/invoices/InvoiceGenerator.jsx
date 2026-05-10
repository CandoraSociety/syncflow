import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

const SERVICE_LABEL = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
};

const FIN_CATEGORY_LABEL = {
  exposure_course: "Exposure Course/Training",
  paid_external_placement: "Paid External Placement",
  employment_supports: "Employment Supports / Work Equipment",
};

function inMonth(dateStr, billingMonth) {
  if (!dateStr) return false;
  return dateStr.startsWith(billingMonth);
}

/**
 * Build line items from client data and financial records for a given billing month.
 * Applies double-billing prevention and cap checks.
 */
function buildLineItems(billingMonth, clients, financialRecords, config, allInvoices) {
  const items = [];
  const warnings = [];

  // Collect all clients billed as starters in previous invoices (for double-billing check)
  const previouslyBilledStarters = {}; // client_id -> stream billed under
  for (const inv of allInvoices) {
    if (inv.billing_month === billingMonth) continue; // skip current month
    for (const li of (inv.line_items || [])) {
      if (li.category === "starter" && !li.excluded) {
        previouslyBilledStarters[li.client_id] = li.billed_under_stream || li.stream;
      }
    }
  }

  // --- STARTERS ---
  for (const c of clients) {
    const startDate = c.service_start_date;
    if (!inMonth(startDate, billingMonth)) continue;
    if (!["direct_to_employment", "pathways"].includes(c.service_type)) continue;

    const currentStream = c.service_type;
    const switches = c.program_stream_switches || [];

    // Find original stream (before any switches)
    let originalStream = currentStream;
    if (switches.length > 0) {
      // The original stream is the from_stream of the earliest switch
      const sorted = [...switches].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
      originalStream = sorted[0].from_stream || currentStream;
    }

    const billStream = originalStream;
    const rate = billStream === "direct_to_employment"
      ? (config.rate_dea_starter || 0)
      : (config.rate_pathways_starter || 0);

    let excluded = false;
    let excludeReason = "";
    let switchNote = "";

    // Double billing check
    if (previouslyBilledStarters[c.id]) {
      excluded = true;
      excludeReason = `Already billed as starter under ${SERVICE_LABEL[previouslyBilledStarters[c.id]] || previouslyBilledStarters[c.id]} in a previous invoice.`;
    }

    if (switches.length > 0 && originalStream !== currentStream) {
      switchNote = `Client switched from ${SERVICE_LABEL[originalStream] || originalStream} → ${SERVICE_LABEL[currentStream] || currentStream}. Billed under original stream (${SERVICE_LABEL[originalStream] || originalStream}) only.`;
    }

    if (excluded) {
      warnings.push(`${c.first_name} ${c.last_name}: ${excludeReason}`);
    }

    items.push({
      category: "starter",
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      description: `${SERVICE_LABEL[billStream] || billStream} Starter`,
      stream: currentStream,
      billed_under_stream: billStream,
      switch_note: switchNote,
      unit_rate: rate,
      quantity: 1,
      amount: excluded ? 0 : rate,
      is_direct_cost: false,
      excluded,
      exclude_reason: excludeReason,
    });
  }

  // --- COMPLETERS ---
  for (const c of clients) {
    if (!inMonth(c.completion_date, billingMonth)) continue;
    if (!["direct_to_employment", "pathways"].includes(c.service_type)) continue;
    if (c.program_status !== "complete") continue;

    const stream = c.service_type;
    const rate = stream === "direct_to_employment"
      ? (config.rate_dea_completer || 0)
      : (config.rate_pathways_completer || 0);

    items.push({
      category: "completer",
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      description: `${SERVICE_LABEL[stream] || stream} Completer`,
      stream,
      billed_under_stream: stream,
      unit_rate: rate,
      quantity: 1,
      amount: rate,
      is_direct_cost: false,
      excluded: false,
    });
  }

  // --- EMPLOYMENT OUTCOMES (employment start date in billing month) ---
  for (const c of clients) {
    if (!inMonth(c.employment_start_date, billingMonth)) continue;
    const rate = config.rate_employment_outcome || 0;
    items.push({
      category: "employment_outcome",
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      description: "Employment Outcome",
      stream: c.service_type,
      billed_under_stream: c.service_type,
      unit_rate: rate,
      quantity: 1,
      amount: rate,
      is_direct_cost: false,
      excluded: false,
    });
  }

  // --- 90-DAY OUTCOMES ---
  for (const c of clients) {
    if (!inMonth(c.followup_90day_date, billingMonth)) continue;
    if (!["E-RF", "E-UF", "E-PT"].includes(c.followup_90day_status)) continue;
    const rate = config.rate_90day_outcome || 0;
    items.push({
      category: "90day_outcome",
      client_id: c.id,
      client_name: `${c.first_name} ${c.last_name}`,
      description: "90-Day Sustained Employment Outcome",
      stream: c.service_type,
      billed_under_stream: c.service_type,
      unit_rate: rate,
      quantity: 1,
      amount: rate,
      is_direct_cost: false,
      excluded: false,
    });
  }

  // --- DIRECT COSTS (from FinancialRecords in this billing month) ---
  for (const fr of financialRecords) {
    if (!inMonth(fr.date, billingMonth)) continue;
    items.push({
      category: fr.record_type,
      client_id: fr.client_id,
      client_name: fr.client_name || "—",
      description: `${FIN_CATEGORY_LABEL[fr.record_type] || fr.record_type}${fr.description ? ": " + fr.description : ""}`,
      stream: "",
      billed_under_stream: "",
      unit_rate: fr.amount || 0,
      quantity: 1,
      amount: fr.amount || 0,
      is_direct_cost: true,
      financial_record_id: fr.id,
      excluded: false,
    });
  }

  return { items, warnings };
}

export default function InvoiceGenerator({ billingMonth, config, clients, financialRecords, allInvoices, onSaved, onClose }) {
  const [saving, setSaving] = useState(false);
  const [lineItems, setLineItems] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [notes, setNotes] = useState("");

  const generate = () => {
    const { items, warnings: w } = buildLineItems(billingMonth, clients, financialRecords, config, allInvoices);
    setLineItems(items);
    setWarnings(w);
  };

  const baseAmount = config?.base_monthly_amount || 0;
  const deliverableTotal = (lineItems || []).filter(i => !i.is_direct_cost && !i.excluded).reduce((s, i) => s + (i.amount || 0), 0);
  const directCostTotal = (lineItems || []).filter(i => i.is_direct_cost && !i.excluded).reduce((s, i) => s + (i.amount || 0), 0);
  const grandTotal = baseAmount + deliverableTotal + directCostTotal;

  const saveInvoice = async () => {
    setSaving(true);
    const user = await base44.auth.me();
    const monthNum = billingMonth.replace("-", "");
    const invoiceNumber = `INV-${monthNum}`;
    const inv = await base44.entities.Invoice.create({
      invoice_number: invoiceNumber,
      billing_month: billingMonth,
      config_id: config?.id || "",
      status: "draft",
      base_amount: baseAmount,
      line_items: lineItems,
      subtotal_deliverables: deliverableTotal,
      subtotal_direct_costs: directCostTotal,
      total_amount: grandTotal,
      notes,
      generated_by: user?.email || "",
    });
    setSaving(false);
    onSaved(inv);
  };

  const fmt = (n) => `$${(n || 0).toLocaleString("en-CA", { minimumFractionDigits: 2 })}`;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            Generate Invoice — {format(parseISO(billingMonth + "-01"), "MMMM yyyy")}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-5">
          {!lineItems ? (
            <div className="text-center py-12">
              <p className="text-slate-500 mb-6">Click below to auto-populate line items from client data and financial records for {format(parseISO(billingMonth + "-01"), "MMMM yyyy")}.</p>
              <Button onClick={generate} size="lg">Generate Line Items</Button>
            </div>
          ) : (
            <>
              {warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-1">
                  <p className="font-semibold text-amber-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Double-Billing Warnings</p>
                  {warnings.map((w, i) => <p key={i} className="text-sm text-amber-700 ml-6">{w}</p>)}
                </div>
              )}

              {/* Base fee */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex justify-between items-center font-medium text-slate-700">
                  <span>Base Monthly Fee</span>
                  <span>{fmt(baseAmount)}</span>
                </div>
              </div>

              {/* Line items table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Client</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Description</th>
                      <th className="text-right px-3 py-2.5 font-semibold text-slate-600">Amount</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-600">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lineItems.map((item, idx) => (
                      <tr key={idx} className={item.excluded ? "bg-red-50 opacity-60" : ""}>
                        <td className="px-3 py-2 text-slate-700">{item.client_name}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {item.description}
                          {item.excluded && <span className="ml-2 text-xs text-red-600 font-medium">[EXCLUDED]</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{item.excluded ? "—" : fmt(item.amount)}</td>
                        <td className="px-3 py-2 text-xs text-slate-500 max-w-48">
                          {item.switch_note || item.exclude_reason || ""}
                        </td>
                      </tr>
                    ))}
                    {lineItems.length === 0 && (
                      <tr><td colSpan={4} className="text-center py-8 text-slate-400">No billable items found for this month.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Base Monthly Fee</span><span>{fmt(baseAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Deliverables & Outcomes</span><span>{fmt(deliverableTotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600 text-sm">
                  <span>Direct Costs (Reimbursement)</span><span>{fmt(directCostTotal)}</span>
                </div>
                <div className="border-t border-slate-300 pt-2 flex justify-between font-bold text-slate-800">
                  <span>TOTAL</span><span>{fmt(grandTotal)}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Invoice Notes (optional)</label>
                <textarea
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none h-20"
                  placeholder="Any notes to include on this invoice..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
                <Button onClick={saveInvoice} disabled={saving}>
                  {saving ? "Saving..." : "Save as Draft"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}