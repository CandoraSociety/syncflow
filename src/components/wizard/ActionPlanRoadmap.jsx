import { useState } from "react";
import { format, parseISO, isValid, differenceInDays, addDays, min, max } from "date-fns";
import { AlertTriangle, Calendar, Info } from "lucide-react";

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

// Color palette for timeline bars
const BAR_COLORS = [
  "bg-blue-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-fuchsia-500",
];

const BAR_COLORS_LIGHT = [
  "bg-blue-100 border-blue-400 text-blue-800",
  "bg-purple-100 border-purple-400 text-purple-800",
  "bg-emerald-100 border-emerald-400 text-emerald-800",
  "bg-amber-100 border-amber-400 text-amber-800",
  "bg-rose-100 border-rose-400 text-rose-800",
  "bg-cyan-100 border-cyan-400 text-cyan-800",
  "bg-indigo-100 border-indigo-400 text-indigo-800",
  "bg-orange-100 border-orange-400 text-orange-800",
  "bg-teal-100 border-teal-400 text-teal-800",
  "bg-fuchsia-100 border-fuchsia-400 text-fuchsia-800",
];

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

function formatShort(dateStr) {
  const d = parseDate(dateStr);
  return d ? format(d, "MMM d") : "";
}

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

function getItemDates(key, detail, client, barriers) {
  if (key === "barrier_support") {
    const starts = barriers.map(b => parseDate(b.timeline_start)).filter(Boolean);
    const ends = barriers.map(b => parseDate(b.timeline_end)).filter(Boolean);
    const start = starts.length > 0 ? min(starts) : null;
    const end = ends.length > 0 ? max(ends) : null;
    return { start, end };
  }
  if (key === "internal_placement") {
    return {
      start: parseDate(client?.placement_start_date),
      end: parseDate(client?.placement_end_date),
    };
  }
  return {
    start: parseDate(detail?.timeline_start),
    end: parseDate(detail?.timeline_end),
  };
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

  // Build items with date info
  const items = selectedItems.map((key, i) => {
    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
    const detail = itemDetails?.[key] || {};
    const label = key === "other" ? (otherDesc || "Other") : opt?.label || key;
    const { start, end } = getItemDates(key, detail, client, barriers);
    return { key, label, detail, start, end, colorIdx: i % BAR_COLORS.length };
  });

  const itemsWithDates = items.filter(i => i.start || i.end);
  const itemsWithoutDates = items.filter(i => !i.start && !i.end);

  // Compute timeline bounds
  const allStarts = itemsWithDates.map(i => i.start).filter(Boolean);
  const allEnds = itemsWithDates.map(i => i.end || i.start).filter(Boolean);
  const timelineStart = allStarts.length > 0 ? min(allStarts) : null;
  const timelineEnd = allEnds.length > 0 ? max(allEnds) : null;
  const totalDays = timelineStart && timelineEnd ? Math.max(differenceInDays(timelineEnd, timelineStart), 1) : 1;

  // Generate month markers for the header
  function getMonthMarkers() {
    if (!timelineStart || !timelineEnd) return [];
    const markers = [];
    let current = new Date(timelineStart.getFullYear(), timelineStart.getMonth(), 1);
    while (current <= timelineEnd) {
      const offsetDays = differenceInDays(current, timelineStart);
      const pct = Math.max(0, (offsetDays / totalDays) * 100);
      markers.push({ label: format(current, "MMM yyyy"), pct });
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }
    return markers;
  }

  const monthMarkers = getMonthMarkers();

  function getBarStyle(item) {
    const start = item.start || timelineStart;
    const end = item.end || (item.start ? addDays(item.start, 7) : timelineEnd);
    if (!start || !timelineStart) return { left: "0%", width: "100%" };
    const leftDays = differenceInDays(start, timelineStart);
    const widthDays = Math.max(differenceInDays(end, start), 1);
    const left = (leftDays / totalDays) * 100;
    const width = Math.max((widthDays / totalDays) * 100, 2);
    return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
  }

  const DetailPanel = ({ item }) => {
    const isBarrierSupport = item.key === "barrier_support";
    return (
      <div className="mt-2 mb-3 mx-2 bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        {isBarrierSupport && barriers.length > 0 ? (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Barriers to Address</p>
            {barriers.map(b => (
              <div key={b.n} className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
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
                    {[b.timeline_start && formatShort(b.timeline_start), b.timeline_end && formatShort(b.timeline_end)].filter(Boolean).join(" – ")}
                  </p>
                )}
                {b.action_steps && <p className="text-xs text-slate-600"><span className="font-medium">Action Steps:</span> {b.action_steps}</p>}
                {b.responsible && <p className="text-xs text-slate-600"><span className="font-medium">Responsible:</span> {b.responsible}</p>}
                {b.resources && <p className="text-xs text-slate-600"><span className="font-medium">Resources:</span> {b.resources}</p>}
                {b.notes && <p className="text-xs text-slate-600"><span className="font-medium">Notes:</span> {b.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {item.detail.goal && <p className="text-sm text-slate-700"><span className="font-medium">Goal:</span> {item.detail.goal}</p>}
            {(item.start || item.end) && (
              <p className="text-sm text-slate-700">
                <span className="font-medium">Timeline:</span>{" "}
                {[item.start && format(item.start, "MMM d, yyyy"), item.end && format(item.end, "MMM d, yyyy")].filter(Boolean).join(" – ")}
              </p>
            )}
            {item.detail.notes && <p className="text-sm text-slate-700"><span className="font-medium">Notes:</span> {item.detail.notes}</p>}
            {!item.detail.goal && !item.start && !item.end && !item.detail.notes && (
              <p className="text-xs text-slate-400 italic">No additional details recorded for this item.</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Action Plan Timeline</h3>
        <p className="text-xs text-slate-400 mt-0.5">Overlapping items are shown on separate rows. Click any bar for details.</p>
      </div>

      {/* Gantt chart section */}
      {itemsWithDates.length > 0 && (
        <div className="overflow-x-auto">
          <div className="min-w-[500px]">
            {/* Month header */}
            <div className="relative h-6 mb-3 ml-36 border-b border-slate-200">
              {monthMarkers.map((m, i) => (
                <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: `${m.pct}%` }}>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{m.label}</span>
                  <div className="w-px h-2 bg-slate-200 mt-0.5" />
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="space-y-2">
              {itemsWithDates.map((item) => {
                const barStyle = getBarStyle(item);
                const isActive = activeItem === item.key;
                const isBarrier = item.key === "barrier_support";
                const colorClass = BAR_COLORS_LIGHT[item.colorIdx];

                return (
                  <div key={item.key}>
                    <div className="flex items-center gap-2">
                      {/* Label */}
                      <div className="w-36 shrink-0 text-right pr-2">
                        <span className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">{item.label}</span>
                      </div>
                      {/* Bar track */}
                      <div className="flex-1 relative h-8 bg-slate-50 rounded-md border border-slate-100">
                        <button
                          onClick={() => setActiveItem(isActive ? null : item.key)}
                          className={`absolute h-full rounded-md border flex items-center px-2 transition-all shadow-sm hover:opacity-90 ${colorClass} ${isActive ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                          style={barStyle}
                          title={item.label}
                        >
                          {isBarrier && <AlertTriangle className="w-3 h-3 shrink-0 mr-1" />}
                          <span className="text-xs font-medium truncate">{item.label}</span>
                        </button>
                      </div>
                      {/* Date range label */}
                      <div className="w-28 shrink-0 text-xs text-slate-400">
                        {item.start && <span>{format(item.start, "MMM d")}</span>}
                        {item.end && item.end !== item.start && <span> – {format(item.end, "MMM d")}</span>}
                      </div>
                    </div>
                    {isActive && <DetailPanel item={item} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Items without dates */}
      {itemsWithoutDates.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items Without Set Dates</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {itemsWithoutDates.map((item) => {
              const isActive = activeItem === item.key;
              const isBarrier = item.key === "barrier_support";
              const colorClass = BAR_COLORS_LIGHT[item.colorIdx];
              return (
                <div key={item.key}>
                  <button
                    onClick={() => setActiveItem(isActive ? null : item.key)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${colorClass} ${isActive ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
                  >
                    {isBarrier && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
                    <span className="text-sm font-medium truncate">{item.label}</span>
                    <Info className="w-3.5 h-3.5 ml-auto shrink-0 opacity-50" />
                  </button>
                  {isActive && <DetailPanel item={item} />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}