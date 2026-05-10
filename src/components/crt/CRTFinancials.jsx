// CRT Tab 3: Financial Records with document links
import { format } from "date-fns";
import { FileText, Receipt, ExternalLink } from "lucide-react";

const TYPE_LABELS = {
  exposure_course: "Exposure Course",
  paid_external_placement: "Paid External Placement",
  employment_supports: "Employment Supports",
};

const TYPE_COLORS = {
  exposure_course: "bg-purple-100 text-purple-700",
  paid_external_placement: "bg-blue-100 text-blue-700",
  employment_supports: "bg-green-100 text-green-700",
};

function fmt(dateStr) {
  if (!dateStr) return "";
  try { return format(new Date(dateStr), "MMM d, yyyy"); } catch { return dateStr; }
}

function DocLink({ url, label }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
    >
      <ExternalLink className="w-3 h-3" />
      {label}
    </a>
  );
}

export default function CRTFinancials({ clients, financials }) {
  // Build a map of client id -> name
  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = `${c.first_name} ${c.last_name}`; });

  // Only show financials for clients in the filtered set
  const clientIds = new Set(clients.map(c => c.id));
  const visible = financials.filter(f => clientIds.has(f.client_id));

  // Totals by type
  const totals = {};
  visible.forEach(f => {
    if (!totals[f.record_type]) totals[f.record_type] = 0;
    totals[f.record_type] += f.amount || 0;
  });

  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
          <div className="text-xl font-bold text-slate-800">${grandTotal.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total Expenditures</div>
        </div>
        {Object.entries(TYPE_LABELS).map(([key, label]) => (
          <div key={key} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
            <div className="text-xl font-bold text-slate-800">${(totals[key] || 0).toFixed(2)}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Records table */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm bg-white rounded-lg border border-slate-200">
          No financial records for clients in the selected period.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
            {visible.length} record{visible.length !== 1 ? "s" : ""} — click document links to open receipts/invoices
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white">
                  {["Client", "Type", "Description", "Date", "Vendor", "Amount", "Receipts", "Completion Docs", "Notes"].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((f, i) => (
                  <tr key={f.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2 text-slate-700 whitespace-nowrap font-medium">
                      {clientMap[f.client_id] || f.client_name || "—"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[f.record_type] || "bg-slate-100 text-slate-600"}`}>
                        {TYPE_LABELS[f.record_type] || f.record_type}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700 max-w-[180px] truncate">{f.description || "—"}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{fmt(f.date)}</td>
                    <td className="px-3 py-2 text-slate-600 whitespace-nowrap">{f.vendor || "—"}</td>
                    <td className="px-3 py-2 text-slate-800 font-semibold whitespace-nowrap">
                      {f.amount != null ? `$${Number(f.amount).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {f.receipt_urls?.length > 0
                          ? f.receipt_urls.map((url, idx) => (
                            <DocLink key={idx} url={url} label={`Receipt ${f.receipt_urls.length > 1 ? idx + 1 : ""}`} />
                          ))
                          : <span className="text-slate-300">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-1">
                        {f.completion_record_urls?.length > 0
                          ? f.completion_record_urls.map((url, idx) => (
                            <DocLink key={idx} url={url} label={`Doc ${f.completion_record_urls.length > 1 ? idx + 1 : ""}`} />
                          ))
                          : <span className="text-slate-300">—</span>
                        }
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{f.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 border-t-2 border-slate-300">
                  <td colSpan={5} className="px-3 py-2 text-xs font-bold text-slate-700 text-right">TOTAL</td>
                  <td className="px-3 py-2 text-sm font-bold text-slate-900">${grandTotal.toFixed(2)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}