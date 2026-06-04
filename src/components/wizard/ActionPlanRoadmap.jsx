import { useState } from "react";
import { addWeeks, format, parseISO, differenceInDays } from "date-fns";
import { CheckCircle2, Circle, Clock, AlertTriangle, Flag, CalendarCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RoadmapItemPanel from "./RoadmapItemPanel";
import BITReviewCheckinPanel from "./BITReviewCheckinPanel";

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
  { key: "barrier_support", label: "Address Barriers (per BIT)" },
  { key: "other", label: "Other" },
];

const STATUS_CONFIG = {
  planned: { icon: Circle, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-500", label: "Planned", barColor: "#94a3b8" },
  started: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "In Progress", barColor: "#3b82f6" },
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", label: "Completed", barColor: "#22c55e" },
};

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onUpdateDetail, onClientUpdate }) {
  const [openItem, setOpenItem] = useState(null);
  const [openBITReview, setOpenBITReview] = useState(null);
  const [saving, setSaving] = useState(false);

  const roadmapStatus = client?.roadmap_item_status || {};
  const bitCheckins = client?.bit_review_checkins || [];
  const bitReviewDates = client?.bit_review_dates || [];

  // Program dates
  const serviceStart = client?.service_start_date ? parseISO(client.service_start_date) : null;
  const isPathways = client?.service_type === "pathways";
  const programWeeks = isPathways ? 16 : 2;
  const projectedEnd = serviceStart ? addWeeks(serviceStart, programWeeks) : null;
  const actualEnd = client?.completion_date ? parseISO(client.completion_date) : null;
  const followup90 = actualEnd ? addWeeks(actualEnd, 13) : null;

  // Build items list
  const items = selectedItems.map(key => {
    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
    const detail = itemDetails?.[key] || {};
    const status = roadmapStatus[key] || {};
    return {
      key,
      label: key === "other" ? (otherDesc || "Other") : (opt?.label || key),
      detail,
      status: status.status || "planned",
      statusData: status,
      isBarrier: false,
    };
  });

  // Add barrier items
  for (let n = 1; n <= 3; n++) {
    const b = client?.[`barrier_${n}`];
    if (!b) continue;
    const key = `barrier_${n}`;
    const label = b === "Other" ? (client[`barrier_${n}_other`] || "Other") : b;
    const status = roadmapStatus[key] || {};
    items.push({
      key,
      label: `Barrier: ${label}`,
      isBarrier: true,
      detail: {
        status: client[`barrier_${n}_status`],
        action_steps: client[`barrier_${n}_action_steps`],
        notes: client[`barrier_${n}_notes`],
        timeline_start: client[`barrier_${n}_timeline_start`],
        timeline_end: client[`barrier_${n}_timeline_end`],
      },
      status: status.status || "planned",
      statusData: status,
    });
  }

  async function handleSaveItem(key, saveData) {
    setSaving(true);
    const prev = roadmapStatus[key] || {};
    const newStatus = {
      ...prev,
      status: saveData.status,
      started_date: saveData.startedDate || prev.started_date,
      completed_date: saveData.completedDate || prev.completed_date,
      case_manager_notes: saveData.notes,
    };
    const updated = { ...roadmapStatus, [key]: newStatus };
    const extraFields = {};
    if (key.startsWith("barrier_")) {
      const n = key.split("_")[1];
      if (saveData.startDate) extraFields[`barrier_${n}_timeline_start`] = saveData.startDate;
      if (saveData.endDate) extraFields[`barrier_${n}_timeline_end`] = saveData.endDate;
    }
    await base44.entities.Client.update(client.id, { roadmap_item_status: updated, ...extraFields });
    onClientUpdate?.({ ...client, roadmap_item_status: updated, ...extraFields });
    setOpenItem(null);
    setSaving(false);
  }

  async function handleSaveBITCheckin(index, checkinData) {
    setSaving(true);
    const existing = [...bitCheckins];
    existing[index] = { ...existing[index], ...checkinData, index, logged_at: new Date().toISOString() };
    await base44.entities.Client.update(client.id, { bit_review_checkins: existing });
    onClientUpdate?.({ ...client, bit_review_checkins: existing });
    setOpenBITReview(null);
    setSaving(false);
  }

  // ─── Timeline (Gantt) helpers ──────────────────────────────────────────────
  // Collect all relevant dates to determine timeline bounds
  const allDates = [];
  if (serviceStart) allDates.push(serviceStart);
  if (projectedEnd) allDates.push(projectedEnd);
  if (actualEnd) allDates.push(actualEnd);
  if (followup90) allDates.push(followup90);
  items.forEach(item => {
    const sd = item.detail?.timeline_start || item.statusData?.started_date;
    const ed = item.detail?.timeline_end || item.statusData?.completed_date;
    if (sd) allDates.push(parseISO(sd));
    if (ed) allDates.push(parseISO(ed));
  });
  bitReviewDates.forEach(d => { if (d) allDates.push(parseISO(d)); });

  const hasTimelineData = allDates.length > 0;

  let minDate, maxDate, totalDays;
  if (hasTimelineData) {
    minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    // Pad by 1 week on each side
    minDate = new Date(minDate); minDate.setDate(minDate.getDate() - 7);
    maxDate = new Date(maxDate); maxDate.setDate(maxDate.getDate() + 14);
    totalDays = differenceInDays(maxDate, minDate) || 1;
  }

  function pct(dateStr) {
    if (!dateStr || !hasTimelineData) return null;
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    const val = (differenceInDays(d, minDate) / totalDays) * 100;
    return Math.max(0, Math.min(100, val));
  }

  // Build month labels for axis
  const monthLabels = [];
  if (hasTimelineData) {
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cursor <= maxDate) {
      monthLabels.push({ label: format(cursor, "MMM yy"), pct: pct(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Visual Timeline ──────────────────────────────────────────────── */}
      {hasTimelineData ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Program Timeline</h3>
          <div className="min-w-[560px]">
            {/* Month axis */}
            <div className="relative h-5 mb-1 ml-36">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="absolute text-[10px] text-slate-400 font-medium"
                  style={{ left: `${m.pct}%`, transform: "translateX(-50%)" }}
                >
                  {m.label}
                </span>
              ))}
            </div>

            {/* Grid + rows */}
            <div className="relative ml-36">
              {/* Vertical grid lines for months */}
              {monthLabels.map((m, i) => (
                <div
                  key={i}
                  className="absolute top-0 bottom-0 w-px bg-slate-100"
                  style={{ left: `${m.pct}%` }}
                />
              ))}

              {/* Program milestones */}
              {serviceStart && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-green-400 z-10" style={{ left: `${pct(serviceStart)}%` }}>
                  <span className="absolute -top-5 left-1 text-[9px] text-green-600 font-bold whitespace-nowrap">▼ Start</span>
                </div>
              )}
              {(actualEnd || projectedEnd) && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 z-10"
                  style={{ left: `${pct(actualEnd || projectedEnd)}%`, backgroundColor: actualEnd ? "#16a34a" : "#3b82f6", borderStyle: actualEnd ? "solid" : "dashed" }}
                >
                  <span className="absolute -top-5 left-1 text-[9px] font-bold whitespace-nowrap" style={{ color: actualEnd ? "#16a34a" : "#3b82f6" }}>
                    ▼ {actualEnd ? "End" : "Proj.End"}
                  </span>
                </div>
              )}
              {followup90 && (
                <div className="absolute top-0 bottom-0 w-0.5 bg-purple-400 z-10" style={{ left: `${pct(followup90)}%` }}>
                  <span className="absolute -top-5 left-1 text-[9px] text-purple-600 font-bold whitespace-nowrap">▼ 90d</span>
                </div>
              )}

              {/* Item rows */}
              <div className="space-y-1.5 pt-7">
                {items.map(item => {
                  const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                  const startStr = item.detail?.timeline_start || item.statusData?.started_date;
                  const endStr = item.detail?.timeline_end || item.statusData?.completed_date;
                  const startP = pct(startStr);
                  const endP = pct(endStr);
                  const hasBar = startP != null && endP != null && endP > startP;
                  const hasDot = startP != null && !hasBar;

                  return (
                    <div key={item.key} className="flex items-center h-7">
                      <div className="absolute -ml-36 w-36 pr-2 text-[11px] text-slate-600 font-medium truncate text-right">
                        {item.label}
                      </div>
                      <div className="w-full relative h-5 bg-slate-50 border border-slate-100 rounded-full overflow-visible">
                        {hasBar && (
                          <div
                            className="absolute h-full rounded-full opacity-85"
                            style={{
                              left: `${startP}%`,
                              width: `${Math.max(1.5, endP - startP)}%`,
                              backgroundColor: cfg.barColor,
                            }}
                          />
                        )}
                        {hasDot && (
                          <div
                            className="absolute top-0.5 w-4 h-4 rounded-full border-2 border-white"
                            style={{ left: `calc(${startP}% - 8px)`, backgroundColor: cfg.barColor }}
                          />
                        )}
                        {!hasBar && !hasDot && (
                          <div className="h-full flex items-center px-3">
                            <span className="text-[10px] text-slate-300 italic">no dates</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* BIT Review markers */}
                {bitReviewDates.map((date, i) => {
                  const checkin = bitCheckins[i] || {};
                  const isDone = checkin.completed;
                  const dp = pct(date);
                  return (
                    <div key={`bit_${i}`} className="flex items-center h-7">
                      <div className="absolute -ml-36 w-36 pr-2 text-[11px] text-rose-600 font-medium truncate text-right">
                        BIT Review {i + 1}
                      </div>
                      <div className="w-full relative h-5 bg-slate-50 border border-slate-100 rounded-full">
                        {dp != null && (
                          <div
                            className={`absolute top-0.5 w-4 h-4 rounded-full border-2 ${isDone ? "bg-green-400 border-green-600" : "bg-rose-300 border-rose-500"}`}
                            style={{ left: `calc(${dp}% - 8px)` }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100 ml-36 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />Planned</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />In Progress</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" />Completed</span>
              <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-green-400 inline-block" />Program Milestone</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-300 border border-rose-500 inline-block" />BIT Review</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
          No dates set yet — add start/end dates to items to see the visual timeline.
        </div>
      )}

      {/* ── Item List ────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">Action Items</h3>
        {items.map(item => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
          const Icon = cfg.icon;
          const isOpen = openItem === item.key;
          return (
            <div key={item.key}>
              <button
                onClick={() => setOpenItem(isOpen ? null : item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm ${cfg.border} ${cfg.bg}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="flex-1 text-sm font-medium text-slate-800">{item.label}</span>
                {item.statusData?.started_date && item.status === "started" && (
                  <span className="text-xs text-slate-400">Started {item.statusData.started_date}</span>
                )}
                {item.statusData?.completed_date && item.status === "completed" && (
                  <span className="text-xs text-slate-400">{item.statusData.completed_date}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
              </button>
              {isOpen && (
                <RoadmapItemPanel
                  item={item}
                  currentStatus={item.statusData}
                  onSave={(data) => handleSaveItem(item.key, data)}
                  onCancel={() => setOpenItem(null)}
                  saving={saving}
                />
              )}
            </div>
          );
        })}

        {/* BIT Review Date rows */}
        {bitReviewDates.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">BIT Review Dates</p>
            {bitReviewDates.map((date, i) => {
              const checkin = bitCheckins[i] || {};
              const isOpen = openBITReview === i;
              const isDone = checkin.completed;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenBITReview(isOpen ? null : i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm mb-1
                      ${isDone ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"}`}
                  >
                    <CalendarCheck className={`w-4 h-4 shrink-0 ${isDone ? "text-green-600" : "text-rose-500"}`} />
                    <span className="flex-1 text-sm font-medium text-slate-800">BIT Review {i + 1}</span>
                    <span className="text-xs text-slate-500">{date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDone ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {isDone ? "Completed" : "Pending"}
                    </span>
                  </button>
                  {isOpen && (
                    <BITReviewCheckinPanel
                      reviewIndex={i}
                      scheduledDate={date}
                      checkin={checkin}
                      clientId={client.id}
                      onSave={(data) => handleSaveBITCheckin(i, data)}
                      onCancel={() => setOpenBITReview(null)}
                      saving={saving}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length === 0 && bitReviewDates.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No action plan items yet.</div>
        )}
      </div>
    </div>
  );
}