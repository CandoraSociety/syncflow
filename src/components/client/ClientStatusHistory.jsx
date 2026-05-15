import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { AlertTriangle, Clock } from "lucide-react";

const CHANGE_TYPE_LABELS = {
  stream_switch: "Program Stream Switch",
  program_status_change: "Program Status Change",
  employment_outcome: "Employment Outcome Recorded",
  post_completion_status: "Post-Completion Status Change",
  followup_90day: "90-Day Follow-Up Status",
  file_closed: "File Closed",
  file_opened: "File Reopened",
  other: "Other",
};

const TYPE_COLORS = {
  stream_switch: "bg-purple-100 text-purple-700",
  program_status_change: "bg-blue-100 text-blue-700",
  employment_outcome: "bg-green-100 text-green-700",
  post_completion_status: "bg-teal-100 text-teal-700",
  followup_90day: "bg-cyan-100 text-cyan-700",
  file_closed: "bg-red-100 text-red-700",
  file_opened: "bg-slate-100 text-slate-600",
  other: "bg-slate-100 text-slate-600",
};

export default function ClientStatusHistory({ clientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StatusChange.filter({ client_id: clientId }, "-change_date", 100)
      .then(data => { setHistory(data); setLoading(false); });
  }, [clientId]);

  if (loading) return (
    <div className="flex items-center justify-center py-12">
      <div className="w-6 h-6 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
    </div>
  );

  if (history.length === 0) return (
    <div className="text-center py-12 text-slate-400">
      <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
      <p>No status changes recorded yet.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      {history.map(entry => (
        <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[entry.change_type] || "bg-slate-100 text-slate-600"}`}>
                {CHANGE_TYPE_LABELS[entry.change_type] || entry.change_type}
              </span>
              {entry.billing_relevant && (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <AlertTriangle className="w-3 h-3" /> Billing Relevant
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400">
              {entry.change_date ? format(new Date(entry.change_date), "MMM d, yyyy") : "—"}
            </span>
          </div>

          {(entry.from_value || entry.to_value) && (
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              {entry.from_value && (
                <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs font-medium">{entry.from_value.replace(/_/g, " ")}</span>
              )}
              {entry.from_value && entry.to_value && <span className="text-slate-400">→</span>}
              {entry.to_value && (
                <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">{entry.to_value.replace(/_/g, " ")}</span>
              )}
            </div>
          )}

          {entry.notes && (
            <p className="mt-2 text-sm text-slate-600">{entry.notes}</p>
          )}

          <p className="mt-2 text-xs text-slate-400">
            Logged by {entry.logged_by_name || entry.logged_by || "unknown"}
          </p>
        </div>
      ))}
    </div>
  );
}