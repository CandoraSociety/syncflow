import { useState } from "react";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";

const ACTION_PLAN_OPTIONS = [
  { key: "job_search_workshop", label: "Job Search Workshop" },
  { key: "resume_writing_workshop", label: "Resume Writing Workshop" },
  { key: "interview_skills_workshop", label: "Interview Skills Workshop" },
  { key: "workplace_readiness_workshop", label: "Workplace Readiness Workshop" },
  { key: "financial_literacy_workshop", label: "Financial Literacy Workshop" },
  { key: "digital_literacy_workshop", label: "Digital Literacy Workshop" },
  { key: "empoweru", label: "EmpowerU Program" },
  { key: "ell_classes", label: "ELL Classes" },
  { key: "skills_assessment", label: "Skills Assessment" },
  { key: "internal_placement", label: "Internal Placement" },
  { key: "exposure_course", label: "Exposure Course / Training" },
  { key: "paid_external_placement", label: "Paid External Placement" },
  { key: "employment_supports", label: "Employment Supports" },
  { key: "job_applications", label: "Apply to Minimum 5 Jobs/Week" },
  { key: "networking", label: "Connect with Employer Network" },
  { key: "barrier_support", label: "Address Barriers" },
  { key: "other", label: "Other" },
];

const BARRIER_STATUS_COLORS = {
  unresolved: "bg-red-100 text-red-700",
  in_progress: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
};

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

function formatDateShort(dateStr) {
  const d = parseDate(dateStr);
  return d ? format(d, "MMM d, yyyy") : dateStr;
}

// Build enriched barrier data from client fields
function getBarriers(client) {
  const barriers = [];
  for (let n = 1; n <= 3; n++) {
    const type = client?.[`barrier_${n}`];
    if (!type) continue;
    const label = type === "Other" ? (client[`barrier_${n}_other`] || "Other") : type;
    barriers.push({
      n,
      label,
      status: client[`barrier_${n}_status`] || "unresolved",
      notes: client[`barrier_${n}_notes`] || "",
      action_steps: client[`barrier_${n}_action_steps`] || "",
      timeline_start: client[`barrier_${n}_timeline_start`] || "",
      timeline_end: client[`barrier_${n}_timeline_end`] || "",
      responsible: client[`barrier_${n}_responsible`] || "",
      resources: client[`barrier_${n}_resources`] || "",
    });
  }
  return barriers;
}

// Get earliest start date for an item (for sorting)
function getItemStartDate(key, detail, client, barriers) {
  if (key === "barrier_support") {
    const dates = barriers.map(b => parseDate(b.timeline_start)).filter(Boolean);
    if (dates.length > 0) return dates.reduce((a, b) => a < b ? a : b);
    return null;
  }
  if (key === "internal_placement") return parseDate(client?.placement_start_date);
  return parseDate(detail?.timeline_start) || null;
}

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc }) {
  const [activeItem, setActiveItem] = useState(null);

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No action plan items selected yet.</p>
      </div>
    );
  }

  const barriers = getBarriers(client);

  // Build enriched item list with sort dates
  const enrichedItems = selectedItems.map(key => ({
    key,
    sortDate: getItemStartDate(key, itemDetails?.[key] || {}, client, barriers),
  }));

  // Sort: items with dates first (ascending), then items without dates in original order
  const withDates = enrichedItems.filter(i => i.sortDate).sort((a, b) => a.sortDate - b.sortDate);
  const withoutDates = enrichedItems.filter(i => !i.sortDate);
  const sortedItems = [...withDates, ...withoutDates];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Action Plan Roadmap</h3>
      <p className="text-xs text-slate-400 mb-4">Items with dates are sorted chronologically. Click any item for details.</p>
      <div className="relative">
        {sortedItems.map(({ key }, i) => {
          const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
          const detail = itemDetails?.[key] || {};
          const label = key === "other" ? (otherDesc || "Other") : opt?.label || key;
          const isActive = activeItem === key;
          const isBarrierSupport = key === "barrier_support";

          // Display timeline string
          let timelineDisplay = detail.timeline || "";
          if (isBarrierSupport && barriers.length > 0) {
            const allStarts = barriers.map(b => b.timeline_start).filter(Boolean);
            const allEnds = barriers.map(b => b.timeline_end).filter(Boolean);
            if (allStarts.length > 0 || allEnds.length > 0) {
              const earliest = allStarts.length > 0 ? allStarts.reduce((a, b) => a < b ? a : b) : null;
              const latest = allEnds.length > 0 ? allEnds.reduce((a, b) => a > b ? a : b) : null;
              timelineDisplay = [earliest && formatDateShort(earliest), latest && formatDateShort(latest)].filter(Boolean).join(" – ");
            }
          }
          if (key === "internal_placement" && client?.placement_start_date) {
            timelineDisplay = [formatDateShort(client.placement_start_date), client.placement_end_date && formatDateShort(client.placement_end_date)].filter(Boolean).join(" – ");
          }

          const hasDetail = detail.goal || detail.timeline || detail.notes || isBarrierSupport;

          return (
            <div key={key}>
              <button
                onClick={() => setActiveItem(isActive ? null : key)}
                className={`w-full flex gap-4 p-4 rounded-xl border transition-all text-left ${
                  isActive ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${
                  isActive ? "border-primary text-primary" :
                  isBarrierSupport ? "border-amber-400 text-amber-600" :
                  "border-slate-300 text-slate-400"
                }`}>
                  {isBarrierSupport
                    ? <AlertTriangle className="w-4 h-4" />
                    : <span className="text-xs font-bold">{i + 1}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{label}</div>
                  {isBarrierSupport && barriers.length > 0 && !isActive && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {barriers.map(b => b.label).join(", ")}
                    </div>
                  )}
                  {timelineDisplay && !isActive && (
                    <div className="text-xs text-slate-500 mt-0.5">Timeline: {timelineDisplay}</div>
                  )}
                </div>
                <div className="shrink-0">
                  {hasDetail ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                </div>
              </button>

              {isActive && (
                <div className="ml-14 -mt-1 mb-1 bg-primary/5 border border-primary/20 border-t-0 rounded-b-xl px-4 py-3 space-y-3">
                  {/* Barrier support: show each barrier */}
                  {isBarrierSupport && barriers.length > 0 ? (
                    <div className="space-y-3">
                      {barriers.map(b => (
                        <div key={b.n} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 text-sm">{b.label}</span>
                            {b.status && (
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BARRIER_STATUS_COLORS[b.status] || "bg-slate-100 text-slate-600"}`}>
                                {b.status.replace("_", " ")}
                              </span>
                            )}
                          </div>
                          {(b.timeline_start || b.timeline_end) && (
                            <p className="text-xs text-slate-600">
                              <span className="font-medium">Timeline:</span>{" "}
                              {[b.timeline_start && formatDateShort(b.timeline_start), b.timeline_end && formatDateShort(b.timeline_end)].filter(Boolean).join(" – ")}
                            </p>
                          )}
                          {b.action_steps && (
                            <p className="text-xs text-slate-600"><span className="font-medium">Action Steps:</span> {b.action_steps}</p>
                          )}
                          {b.responsible && (
                            <p className="text-xs text-slate-600"><span className="font-medium">Responsible:</span> {b.responsible}</p>
                          )}
                          {b.resources && (
                            <p className="text-xs text-slate-600"><span className="font-medium">Resources:</span> {b.resources}</p>
                          )}
                          {b.notes && (
                            <p className="text-xs text-slate-600"><span className="font-medium">Notes:</span> {b.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {detail.goal && <p className="text-sm text-slate-700"><span className="font-medium">Goal:</span> {detail.goal}</p>}
                      {timelineDisplay && <p className="text-sm text-slate-700"><span className="font-medium">Timeline:</span> {timelineDisplay}</p>}
                      {detail.notes && <p className="text-sm text-slate-700"><span className="font-medium">Notes:</span> {detail.notes}</p>}
                      {!detail.goal && !timelineDisplay && !detail.notes && (
                        <p className="text-xs text-slate-400 italic">No additional details recorded for this item.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {i < sortedItems.length - 1 && (
                <div className="flex justify-start pl-5 my-0.5">
                  <div className="w-0.5 h-4 bg-slate-200 ml-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}