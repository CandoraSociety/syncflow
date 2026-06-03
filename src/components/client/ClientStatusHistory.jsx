import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { AlertTriangle, Clock, ArrowRight } from "lucide-react";

const CHANGE_TYPE_LABELS = {
  stream_switch: "Program Stream Switch",
  program_status_change: "Program Status Change",
  employment_outcome: "Employment Outcome",
  post_completion_status: "Post-Completion Status",
  followup_90day: "90-Day Follow-Up",
  file_closed: "File Closed",
  file_opened: "File Reopened",
  other: "Other",
};

const TYPE_CONFIG = {
  stream_switch:          { dot: "bg-purple-500", badge: "bg-purple-100 text-purple-700 border-purple-200", line: "border-purple-200" },
  program_status_change:  { dot: "bg-blue-500",   badge: "bg-blue-100 text-blue-700 border-blue-200",       line: "border-blue-200" },
  employment_outcome:     { dot: "bg-green-500",   badge: "bg-green-100 text-green-700 border-green-200",   line: "border-green-200" },
  post_completion_status: { dot: "bg-teal-500",    badge: "bg-teal-100 text-teal-700 border-teal-200",      line: "border-teal-200" },
  followup_90day:         { dot: "bg-cyan-500",    badge: "bg-cyan-100 text-cyan-700 border-cyan-200",      line: "border-cyan-200" },
  file_closed:            { dot: "bg-red-500",     badge: "bg-red-100 text-red-700 border-red-200",         line: "border-red-200" },
  file_opened:            { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 border-slate-200",   line: "border-slate-200" },
  other:                  { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 border-slate-200",   line: "border-slate-200" },
};

const DEFAULT_CONFIG = { dot: "bg-slate-400", badge: "bg-slate-100 text-slate-600 border-slate-200", line: "border-slate-200" };

export default function ClientStatusHistory({ clientId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.StatusChange.filter({ client_id: clientId }, "change_date", 100)
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
    <div className="relative pl-6">
      {/* Vertical spine */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-slate-200 rounded-full" />

      <div className="space-y-0">
        {history.map((entry, idx) => {
          const cfg = TYPE_CONFIG[entry.change_type] || DEFAULT_CONFIG;
          const isLast = idx === history.length - 1;

          return (
            <div key={entry.id} className="relative flex gap-4 pb-6">
              {/* Dot */}
              <div className={`absolute -left-6 mt-1 w-4 h-4 rounded-full border-2 border-white shadow ${cfg.dot} shrink-0 z-10`} />

              {/* Card */}
              <div className={`flex-1 bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${isLast ? "border-slate-200" : "border-slate-200"}`}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {CHANGE_TYPE_LABELS[entry.change_type] || entry.change_type}
                    </span>
                    {entry.billing_relevant && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Billing
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 font-medium">
                    {entry.change_date ? format(new Date(entry.change_date), "MMM d, yyyy") : "—"}
                  </span>
                </div>

                {/* From → To */}
                {(entry.from_value || entry.to_value) && (
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {entry.from_value && (
                      <span className="bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {entry.from_value.replace(/_/g, " ")}
                      </span>
                    )}
                    {entry.from_value && entry.to_value && (
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    {entry.to_value && (
                      <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg text-xs font-medium">
                        {entry.to_value.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                )}

                {/* Notes */}
                {entry.notes && (
                  <p className="mt-2.5 text-sm text-slate-600 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                    {entry.notes}
                  </p>
                )}

                {/* Footer */}
                <p className="mt-2.5 text-xs text-slate-400">
                  Logged by <span className="font-medium text-slate-500">{entry.logged_by_name || entry.logged_by || "unknown"}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}