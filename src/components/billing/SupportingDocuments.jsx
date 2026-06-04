// SupportingDocuments — auto-populated from FinancialRecord for a given billing month
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ExternalLink, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";

const TYPE_LABELS = {
  exposure_course: "Exposure Course",
  employment_supports: "Employment Supports",
  paid_external_placement: "Paid External Placement",
};

const TYPE_COLORS = {
  exposure_course: "bg-purple-100 text-purple-700",
  employment_supports: "bg-green-100 text-green-700",
  paid_external_placement: "bg-blue-100 text-blue-700",
};

const REG_LABELS = {
  not_registered: "Not Registered",
  registered: "Registered",
  waitlisted: "Waitlisted",
  cancelled: "Cancelled",
};

const COMP_LABELS = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  did_not_complete: "Did Not Complete",
};

function StatusBadge({ status, map, color }) {
  const label = map[status];
  if (!label) return null;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
  );
}

export default function SupportingDocuments({ billingMonth }) {
  const [records, setRecords] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // billingMonth is YYYY-MM
  const [month, year] = billingMonth ? billingMonth.split("-") : [null, null];

  useEffect(() => {
    if (!billingMonth) return;
    Promise.all([
      base44.entities.FinancialRecord.filter({ billing_month: billingMonth }),
      base44.entities.Client.list(),
    ]).then(([recs, cls]) => {
      setRecords(recs);
      setClients(cls);
      setLoading(false);
    });
  }, [billingMonth]);

  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = `${c.first_name} ${c.last_name}`; });

  // Group by type
  const byType = {};
  records.forEach(r => {
    if (!byType[r.record_type]) byType[r.record_type] = [];
    byType[r.record_type].push(r);
  });

  const totalAmount = records.reduce((sum, r) => sum + (r.total || r.amount || 0), 0);
  const monthLabel = billingMonth ? format(parseISO(billingMonth + "-01"), "MMMM yyyy") : "—";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
        Loading supporting documents...
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-200">
        <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No financial records found for {monthLabel}.</p>
        <p className="text-xs mt-1">Records are auto-populated when exposure courses and supports are logged in client profiles.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3">
          <div className="text-xl font-bold text-slate-800">${totalAmount.toFixed(2)}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total — {monthLabel}</div>
        </div>
        {Object.entries(TYPE_LABELS).map(([key, label]) => {
          const typeTotal = (byType[key] || []).reduce((s, r) => s + (r.total || r.amount || 0), 0);
          return (
            <div key={key} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
              <div className="text-xl font-bold text-slate-800">${typeTotal.toFixed(2)}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label} ({(byType[key] || []).length})</div>
            </div>
          );
        })}
      </div>

      {/* Records by type */}
      {Object.entries(TYPE_LABELS).map(([typeKey, typeLabel]) => {
        const typeRecords = byType[typeKey] || [];
        if (typeRecords.length === 0) return null;
        return (
          <Card key={typeKey}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[typeKey]}`}>{typeLabel}</span>
                <span className="text-slate-400 font-normal">{typeRecords.length} record{typeRecords.length !== 1 ? "s" : ""}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Client</th>
                      {typeKey === "exposure_course" && (
                        <>
                          <th className="text-left px-4 py-2 font-semibold text-slate-600">Course Type</th>
                          <th className="text-left px-4 py-2 font-semibold text-slate-600">Registration</th>
                          <th className="text-left px-4 py-2 font-semibold text-slate-600">Completion</th>
                        </>
                      )}
                      {typeKey === "employment_supports" && (
                        <th className="text-left px-4 py-2 font-semibold text-slate-600">Support Type</th>
                      )}
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Description</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Vendor</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Date</th>
                      <th className="text-right px-4 py-2 font-semibold text-slate-600">Subtotal</th>
                      <th className="text-right px-4 py-2 font-semibold text-slate-600">Tax</th>
                      <th className="text-right px-4 py-2 font-semibold text-slate-600">Total</th>
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Receipts</th>
                      {typeKey === "exposure_course" && (
                        <th className="text-left px-4 py-2 font-semibold text-slate-600">Completion Docs</th>
                      )}
                      <th className="text-left px-4 py-2 font-semibold text-slate-600">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {typeRecords.map((rec, i) => {
                      const courseDisplay = rec.course_type === "Other" ? rec.course_type_other : rec.course_type;
                      return (
                        <tr key={rec.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                          <td className="px-4 py-2 font-medium text-slate-700 whitespace-nowrap">
                            {clientMap[rec.client_id] || rec.client_name || "—"}
                          </td>
                          {typeKey === "exposure_course" && (
                            <>
                              <td className="px-4 py-2 whitespace-nowrap">{courseDisplay || "—"}</td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {rec.registration_status ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    rec.registration_status === "registered" ? "bg-green-100 text-green-700" :
                                    rec.registration_status === "waitlisted" ? "bg-amber-100 text-amber-700" :
                                    rec.registration_status === "cancelled" ? "bg-red-100 text-red-700" :
                                    "bg-slate-100 text-slate-500"
                                  }`}>{REG_LABELS[rec.registration_status] || rec.registration_status}</span>
                                ) : "—"}
                              </td>
                              <td className="px-4 py-2 whitespace-nowrap">
                                {rec.completion_status ? (
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    rec.completion_status === "completed" ? "bg-green-100 text-green-700" :
                                    rec.completion_status === "in_progress" ? "bg-blue-100 text-blue-700" :
                                    rec.completion_status === "did_not_complete" ? "bg-red-100 text-red-700" :
                                    "bg-slate-100 text-slate-500"
                                  }`}>{COMP_LABELS[rec.completion_status] || rec.completion_status}</span>
                                ) : "—"}
                              </td>
                            </>
                          )}
                          {typeKey === "employment_supports" && (
                            <td className="px-4 py-2 whitespace-nowrap">{rec.course_type || "—"}</td>
                          )}
                          <td className="px-4 py-2 max-w-[160px] truncate text-slate-600">{rec.description || "—"}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{rec.vendor || "—"}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-600">{rec.date || "—"}</td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {rec.amount != null ? `$${Number(rec.amount).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            {rec.tax != null ? `$${Number(rec.tax).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap font-semibold text-slate-800">
                            {rec.total != null ? `$${Number(rec.total).toFixed(2)}` : rec.amount != null ? `$${Number(rec.amount).toFixed(2)}` : "—"}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex flex-col gap-0.5">
                              {rec.receipt_urls?.length > 0
                                ? rec.receipt_urls.map((url, idx) => (
                                  <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline whitespace-nowrap">
                                    <ExternalLink className="w-2.5 h-2.5" /> Receipt {rec.receipt_urls.length > 1 ? idx + 1 : ""}
                                  </a>
                                ))
                                : <span className="text-slate-300">—</span>
                              }
                            </div>
                          </td>
                          {typeKey === "exposure_course" && (
                            <td className="px-4 py-2">
                              <div className="flex flex-col gap-0.5">
                                {rec.completion_record_urls?.length > 0
                                  ? rec.completion_record_urls.map((url, idx) => (
                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-[10px] text-green-600 hover:underline whitespace-nowrap">
                                      <ExternalLink className="w-2.5 h-2.5" /> Doc {rec.completion_record_urls.length > 1 ? idx + 1 : ""}
                                    </a>
                                  ))
                                  : <span className="text-slate-300">—</span>
                                }
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-2 max-w-[120px] truncate text-slate-400">{rec.notes || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300">
                      <td colSpan={typeKey === "exposure_course" ? 8 : typeKey === "employment_supports" ? 6 : 5}
                        className="px-4 py-2 text-xs font-bold text-slate-700 text-right">SUBTOTAL</td>
                      <td className="px-4 py-2 text-right text-xs font-bold text-slate-700">
                        ${(byType[typeKey] || []).reduce((s, r) => s + (r.tax || 0), 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-right text-sm font-bold text-slate-900">
                        ${(byType[typeKey] || []).reduce((s, r) => s + (r.total || r.amount || 0), 0).toFixed(2)}
                      </td>
                      <td colSpan={typeKey === "exposure_course" ? 3 : 2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}