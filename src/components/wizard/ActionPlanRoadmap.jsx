import { useState } from "react";
import { addWeeks, format, isWithinInterval, addDays } from "date-fns";

// Parse date strings as local midnight to get a stable local Date with no UTC shift
function parseDate(str) {
  if (!str) return null;
  if (str instanceof Date) {
    // Normalize any passed-in Date to local noon to be safe
    return new Date(str.getFullYear(), str.getMonth(), str.getDate(), 12, 0, 0);
  }
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

// Use raw ms math for percentage — avoids date-fns differenceInDays UTC rounding issues
function msPct(date, minMs, rangeMs) {
  if (!date || !rangeMs) return null;
  const d = parseDate(date);
  if (!d) return null;
  return Math.max(0, Math.min(100, ((d.getTime() - minMs) / rangeMs) * 100));
}

import { CheckCircle2, Circle, Clock, AlertTriangle, CalendarCheck, LayoutList, BarChart2, AlertCircle, X, Save, CheckCheck, Calendar } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// Status visual config — ring colour and bar overlay; bar/dot colour comes from TYPE
const STATUS_CONFIG = {
  planned:   { label: "Not Started", ring: "#94a3b8", badge: "bg-slate-100 text-slate-500" },
  started:   { label: "In Progress", ring: "#3b82f6", badge: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed",   ring: "#22c55e", badge: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelled",   ring: "#ef4444", badge: "bg-red-100 text-red-700" },
};

// Type colour — drives bar colour AND label text colour
function getItemColor(key) {
  if (key.startsWith("barrier_")) return "#f59e0b";          // gold
  if (key === "internal_placement" || key === "paid_external_placement") return "#22c55e"; // green
  if (key.includes("workshop") || key === "empoweru" || key === "ell_classes" || key === "skills_assessment") return "#a855f7"; // purple
  return "#64748b"; // default slate for other items
}

function buildItems(selectedItems, itemDetails, otherDesc, roadmapStatus, client) {
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
  return items;
}

function isApproaching(item) {
  if (item.status === "completed") return false;
  const endStr = item.detail?.timeline_end || item.statusData?.completed_date;
  if (!endStr) return false;
  const end = parseDate(endStr);
  const today = new Date();
  return isWithinInterval(end, { start: today, end: addDays(today, 7) });
}

// Tooltip wrapper — hover detection on children, tooltip rendered absolutely above
function Tooltip({ children, content, style, className }) {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className={`absolute pointer-events-auto ${className || ""}`}
      style={style}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-slate-800 text-white text-[10px] rounded-lg px-2.5 py-1.5 shadow-lg whitespace-pre-line max-w-[200px] leading-relaxed">
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-800" />
          </div>
        </div>
      )}
    </div>
  );
}

// Small inline date editor for milestone lines
function MilestoneDateEditor({ label, currentDate, onSave, onCancel, saving }) {
  const [val, setVal] = useState(currentDate || "");
  return (
    <div className="absolute top-6 left-0 z-50 bg-white border border-slate-200 rounded-lg shadow-xl p-3 w-52" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-700">{label}</span>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
      </div>
      <Input type="date" value={val} onChange={e => setVal(e.target.value)} className="text-xs h-7 mb-2" />
      <div className="flex gap-1.5">
        <Button size="sm" className="h-6 text-xs flex-1 gap-1" onClick={() => onSave(val)} disabled={saving || !val}>
          <Save className="w-3 h-3" />{saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onUpdateDetail, onClientUpdate }) {
  const [openItem, setOpenItem] = useState(null);
  const [openBITReview, setOpenBITReview] = useState(null);
  const [openBarrierDetail, setOpenBarrierDetail] = useState(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("timeline");
  const [editingMilestone, setEditingMilestone] = useState(null);

  const roadmapStatus  = client?.roadmap_item_status || {};
  const bitCheckins    = client?.bit_review_checkins || [];
  const bitReviewDates = client?.bit_review_dates || [];

  const intakeDate   = parseDate(client?.intake_date);
  const serviceStart = parseDate(client?.service_start_date);
  const isPathways   = client?.service_type === "pathways";
  const projectedEnd = (isPathways && serviceStart) ? addWeeks(serviceStart, 16) : null;
  const actualEnd    = parseDate(client?.completion_date);
  const followup90   = actualEnd ? addWeeks(actualEnd, 13) : (projectedEnd ? addWeeks(projectedEnd, 13) : null);

  const items = buildItems(selectedItems, itemDetails, otherDesc, roadmapStatus, client);
  const itemsWithDates    = items.filter(item => item.detail?.timeline_start || item.statusData?.started_date || item.detail?.timeline_end || item.statusData?.completed_date);
  const itemsNeedingDates = items.filter(item => !item.detail?.timeline_start && !item.statusData?.started_date && !item.detail?.timeline_end && !item.statusData?.completed_date);

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
      if (saveData.endDate)   extraFields[`barrier_${n}_timeline_end`]   = saveData.endDate;
      // Sync barrier status: completed → resolved, started → in_progress, planned/cancelled → unresolved
      const barrierStatusMap = { completed: "resolved", started: "in_progress", planned: "unresolved", cancelled: "unresolved" };
      extraFields[`barrier_${n}_status`] = barrierStatusMap[saveData.status] || "unresolved";
    } else if (saveData.startDate || saveData.endDate) {
      const existingDetails = client?.sdp_item_details || {};
      extraFields.sdp_item_details = {
        ...existingDetails,
        [key]: {
          ...(existingDetails[key] || {}),
          ...(saveData.startDate ? { timeline_start: saveData.startDate } : {}),
          ...(saveData.endDate   ? { timeline_end:   saveData.endDate }   : {}),
        },
      };
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

  async function handleSaveMilestone(field, value) {
    setSaving(true);
    await base44.entities.Client.update(client.id, { [field]: value });
    onClientUpdate?.({ ...client, [field]: value });
    setEditingMilestone(null);
    setSaving(false);
  }

  // ─── Timeline bounds (raw ms math — avoids date-fns UTC rounding) ─────────
  // rightDates includes everything except the anchor (intake/serviceStart) so the right bound is correct
  const rightDates = [
    projectedEnd, actualEnd, followup90,
    ...items.flatMap(item => [
      parseDate(item.detail?.timeline_start || item.statusData?.started_date),
      parseDate(item.detail?.timeline_end   || item.statusData?.completed_date),
    ]),
    ...bitReviewDates.map(d => parseDate(d)),
  ].filter(Boolean);

  // The left anchor is always intake date (or service start, or earliest right date)
  const leftAnchor = intakeDate || serviceStart;
  const allDates = [leftAnchor, ...rightDates].filter(Boolean);

  const hasTimelineData = allDates.length > 0;
  let minMs = 0, rangeMs = 1;
  let minDate, maxDate;

  if (hasTimelineData) {
    // minDate is ALWAYS the left anchor — intake is pinned to left edge (0%)
    const rawMax = new Date(Math.max(...rightDates.filter(Boolean).map(d => d.getTime()), leftAnchor?.getTime() || 0));
    minDate = leftAnchor
      ? new Date(leftAnchor.getFullYear(), leftAnchor.getMonth(), leftAnchor.getDate(), 12, 0, 0)
      : new Date(rawMax.getFullYear(), rawMax.getMonth(), rawMax.getDate(), 12, 0, 0);
    maxDate = new Date(rawMax.getFullYear(), rawMax.getMonth(), rawMax.getDate() + 28, 12, 0, 0);
    minMs   = minDate.getTime();
    rangeMs = maxDate.getTime() - minMs;
  }

  function pct(dateVal) {
    return msPct(dateVal, minMs, rangeMs);
  }

  // Month label ticks — first of NEXT month after minDate, then every month after
  const monthLabels = [];
  if (hasTimelineData) {
    let y = minDate.getFullYear();
    let m = minDate.getMonth() + 1; // start from the NEXT month so we never collide with intake at 0%
    if (m > 11) { m = 0; y++; }
    while (true) {
      const tick = new Date(y, m, 1, 12, 0, 0);
      if (tick.getTime() > maxDate.getTime()) break;
      monthLabels.push({ label: format(tick, "MMM yyyy"), p: pct(tick) });
      m++;
      if (m > 11) { m = 0; y++; }
    }
  }

  const todayPct = hasTimelineData ? pct(new Date()) : null;

  const milestones = [
    intakeDate && {
      key: "intake", date: intakeDate, label: "Intake", editLabel: "Intake Date",
      field: "intake_date", color: "#8b5cf6", textColor: "text-violet-700",
      forcePct: 0,
    },
    serviceStart && {
      key: "service_start", date: serviceStart, label: "Start", editLabel: "Service Start Date",
      field: "service_start_date", color: "#10b981", textColor: "text-emerald-700",
    },
    projectedEnd && {
      key: "projected_end", date: projectedEnd,
      label: "Proj.End", editLabel: null,
      field: null, color: "#3b82f6",
      textColor: "text-blue-700", dashed: true,
    },
    actualEnd && {
      key: "completion", date: actualEnd,
      label: "End", editLabel: "Completion Date",
      field: "completion_date", color: "#16a34a",
      textColor: "text-green-700", dashed: false,
    },
    followup90 && {
      key: "followup90", date: followup90, label: "90d", editLabel: null,
      color: "#a855f7", textColor: "text-purple-600",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-4">

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Program Progress Roadmap</h3>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button onClick={() => setView("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "timeline" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
            <BarChart2 className="w-3.5 h-3.5" /> Timeline
          </button>
          <button onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
            <LayoutList className="w-3.5 h-3.5" /> List
          </button>
          <button onClick={() => setView("calendar")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "calendar" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}>
            <Calendar className="w-3.5 h-3.5" /> Calendar
          </button>
        </div>
      </div>

      {/* ══ TIMELINE VIEW ══ */}
      {view === "timeline" && (
        <div className="space-y-4">
          {hasTimelineData ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto shadow-sm">
              <div className="min-w-[600px]">

                {/* Month axis */}
                <div className="relative h-5 ml-40 mb-0">
                  {monthLabels.map((ml, i) => {
                    const transform = ml.p < 5 ? "translateX(0)" : ml.p > 95 ? "translateX(-100%)" : "translateX(-50%)";
                    return (
                      <span key={i} className="absolute text-[10px] text-slate-400 font-medium"
                        style={{ left: `${ml.p}%`, transform }}>
                        {ml.label}
                      </span>
                    );
                  })}
                </div>

                {/* Milestone label row */}
                <div className="relative h-5 ml-40 mb-1">
                  {milestones.map((ms, idx) => {
                    const p = ms.forcePct ?? pct(ms.date);
                    const labelLeft = p === 0 ? "1px" : `${p}%`;
                    // Avoid labels overflowing left edge: first milestone anchors left, others center
                    const transform = p < 5 ? "translateX(0)" : p > 95 ? "translateX(-100%)" : "translateX(-50%)";
                    return (
                      <button key={ms.key}
                        onClick={() => ms.editLabel && setEditingMilestone(editingMilestone === ms.key ? null : ms.key)}
                        className={`absolute text-[9px] font-bold whitespace-nowrap flex items-center gap-0.5 ${ms.textColor} ${ms.editLabel ? "hover:underline cursor-pointer" : "cursor-default"}`}
                        style={{ left: labelLeft, transform }}
                        title={ms.editLabel ? `Click to edit ${ms.editLabel}` : format(parseDate(ms.date), "MMM d, yyyy")}>
                        ▼ {ms.label}
                      </button>
                    );
                  })}
                </div>

                {/* Chart area */}
                <div className="relative ml-40">

                  {/* Rows container — lines clipped via inner overlay, labels visible outside */}
                  <div className="relative">

                  {/* Clipping layer for vertical lines only — sits behind rows, clips to chart width */}
                  <div className="absolute inset-0 pointer-events-none" style={{ overflow: "clip" }}>
                    {/* Grid lines */}
                    {monthLabels.map((ml, i) => (
                      <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100 z-0" style={{ left: `${ml.p}%` }} />
                    ))}
                    {/* Milestone lines */}
                    {milestones.map(ms => {
                      const lineLeft = ms.forcePct ?? pct(ms.date);
                      return (
                        <div key={ms.key} className="absolute top-0 bottom-0 w-0.5 z-10 pointer-events-none"
                          style={{ left: lineLeft === 0 ? "1px" : `${lineLeft}%`, backgroundColor: ms.color, opacity: 0.9,
                            borderStyle: ms.dashed ? "dashed" : "solid" }} />
                      );
                    })}
                    {/* Today line */}
                    {todayPct !== null && (() => {
                      const onMilestone = milestones.some(ms => {
                        const mp = ms.forcePct ?? pct(ms.date);
                        return Math.abs((mp === 0 ? 0 : mp) - todayPct) < 0.5;
                      });
                      return (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-20 pointer-events-none"
                          style={{ left: onMilestone ? `calc(${todayPct}% + 4px)` : `${todayPct}%` }} />
                      );
                    })()}
                  </div>

                  {/* Today date label */}
                  {todayPct !== null && (() => {
                    const onMilestone = milestones.some(ms => {
                      const mp = ms.forcePct ?? pct(ms.date);
                      return Math.abs((mp === 0 ? 0 : mp) - todayPct) < 0.5;
                    });
                    return (
                      <div className="absolute top-0 w-0.5 pointer-events-none z-20"
                        style={{ left: onMilestone ? `calc(${todayPct}% + 4px)` : `${todayPct}%` }}>
                        <span className="absolute top-0 left-1 text-[9px] text-amber-600 font-bold whitespace-nowrap bg-white/80 px-0.5 rounded pointer-events-none">
                          {format(new Date(), "MMM d")}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Milestone date editors */}
                  {milestones.map(ms => (
                    editingMilestone === ms.key && ms.editLabel && (
                      <div key={`edit_${ms.key}`} className="absolute z-50" style={{ left: `${ms.forcePct ?? pct(ms.date)}%` }}>
                        <MilestoneDateEditor
                          label={ms.editLabel}
                          currentDate={ms.key === "intake" ? client?.intake_date : ms.key === "service_start" ? client?.service_start_date : client?.completion_date}
                          onSave={(val) => handleSaveMilestone(ms.field, val)}
                          onCancel={() => setEditingMilestone(null)}
                          saving={saving}
                        />
                      </div>
                    )
                  ))}

                  {/* Item rows - Other items first */}
                  <div className="space-y-1.5 pt-2">
                    {itemsWithDates.filter(item => !item.isBarrier).map(item => {
                      const cfg      = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                      const typeColor = getItemColor(item.key);
                      const startStr = item.detail?.timeline_start || item.statusData?.started_date;
                      const endStr   = item.detail?.timeline_end   || item.statusData?.completed_date;
                      const startP   = pct(startStr);
                      const endP     = pct(endStr);
                      const hasBar   = startP != null && endP != null && (endP - startP) > 1.5;
                      const hasDot   = startP != null && !hasBar;
                      const isCancelled = item.status === "cancelled";
                      const isCompleted = item.status === "completed";
                      const isStarted   = item.status === "started";
                      const isOpen   = openItem === item.key;

                      const tooltipLines = [
                        item.label,
                        `Status: ${cfg.label}`,
                        startStr && `Start: ${startStr}`,
                        endStr && `End: ${endStr}`,
                        item.statusData?.case_manager_notes && `Notes: ${item.statusData.case_manager_notes}`,
                      ].filter(Boolean).join("\n");

                      // Bar colour: grey if cancelled, type colour otherwise
                      const barColor = isCancelled ? "#94a3b8" : typeColor;

                      return (
                        <div key={item.key} className="relative">
                          <button
                            onClick={() => { setEditingMilestone(null); setOpenItem(isOpen ? null : item.key); }}
                            className="w-full flex items-center h-8 group"
                          >
                            {/* Label — coloured by type */}
                            <div
                              className="absolute -ml-40 w-40 pr-2 text-[11px] font-medium truncate text-right"
                              style={{ color: isCancelled ? "#94a3b8" : typeColor }}
                            >
                              {item.isBarrier && <span className="mr-0.5">⚠</span>}
                              {item.label}
                            </div>

                            {/* Bar track — ring colour from status */}
                            <div
                              className="w-full relative h-6 rounded-md transition-all"
                              style={{
                                backgroundColor: "#f8fafc",
                                outline: `2px solid ${cfg.ring}`,
                                outlineOffset: "-1px",
                              }}
                            >
                              {hasBar && (
                                <Tooltip
                                  content={tooltipLines}
                                  style={{ left: `${startP}%`, width: `${Math.max(2, endP - startP)}%`, top: 0, height: "100%" }}
                                  className="rounded-md overflow-hidden"
                                >
                                  <div className="w-full h-full rounded-md relative overflow-hidden pointer-events-none" style={{ backgroundColor: barColor, opacity: isCancelled ? 0.5 : 0.85 }}>
                                    {/* In-progress shimmer */}
                                    {isStarted && (
                                      <div className="absolute inset-0 rounded-md overflow-hidden">
                                        <div className="h-full" style={{ animation: "typeShimmer 2s infinite linear", backgroundImage: `linear-gradient(90deg, transparent, ${barColor}cc, rgba(255,255,255,0.5), ${barColor}cc, transparent)`, backgroundSize: "200% 100%" }} />
                                      </div>
                                    )}
                                    {/* Completed checkmark */}
                                    {isCompleted && (endP - startP) > 8 && (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <CheckCheck className="w-4 h-4 drop-shadow-md" style={{ color: "#16a34a", filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9))" }} />
                                      </span>
                                    )}
                                    {/* Cancelled X */}
                                    {isCancelled && (endP - startP) > 8 && (
                                      <span className="absolute inset-0 flex items-center justify-center">
                                        <X className="w-3 h-3 text-white drop-shadow" />
                                      </span>
                                    )}
                                    </div>
                                    </Tooltip>
                                    )}
                                    {hasDot && (
                                    <Tooltip
                                    content={tooltipLines}
                                    style={{ left: `calc(${startP}% - 8px)`, top: "4px", width: "16px", height: "16px" }}
                                    className="rounded-full border-2 border-white shadow"
                                    >
                                    <div className="w-full h-full rounded-full relative flex items-center justify-center pointer-events-none" style={{ backgroundColor: barColor, opacity: isCancelled ? 0.5 : 0.85 }}>
                                    {isCompleted && <CheckCheck className="w-2.5 h-2.5" style={{ color: "#16a34a", filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" }} />}
                                    {isCancelled && <X className="w-2 h-2 text-white" />}
                                    </div>
                                    </Tooltip>
                                    )}
                                    </div>
                                    </button>

                                    {isOpen && (
                                    <div className="relative z-30 mb-1">
                                    <RoadmapItemPanel
                                    item={item}
                                    currentStatus={item.statusData}
                                    onSave={(data) => handleSaveItem(item.key, data)}
                                    onCancel={() => setOpenItem(null)}
                                    saving={saving}
                                    />
                            </div>
                          )}
                        </div>
                      );
                      })}

                      {/* Barriers Section - barriers and BIT reviews together */}
                      {(itemsWithDates.filter(item => item.isBarrier).length > 0 || bitReviewDates.length > 0) && (
                      <div className="relative mt-6 pt-4 border-t-2 border-amber-200">
                        <div className="absolute -left-56 w-52 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                          Barriers
                        </div>

                        {/* Barrier items */}
                        {itemsWithDates.filter(item => item.isBarrier).map(item => {
                          const cfg      = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                          const typeColor = getItemColor(item.key);
                          const startStr = item.detail?.timeline_start || item.statusData?.started_date;
                          const endStr   = item.detail?.timeline_end   || item.statusData?.completed_date;
                          const startP   = pct(startStr);
                          const endP     = pct(endStr);
                          const hasBar   = startP != null && endP != null && (endP - startP) > 1.5;
                          const hasDot   = startP != null && !hasBar;
                          const isCancelled = item.status === "cancelled";
                          const isCompleted = item.status === "completed";
                          const isStarted   = item.status === "started";
                          const isOpen   = openItem === item.key;
                          const isBarrierOpen = openBarrierDetail === item.key;

                          const tooltipLines = [
                            item.label,
                            `Status: ${cfg.label}`,
                            startStr && `Start: ${startStr}`,
                            endStr && `End: ${endStr}`,
                            item.statusData?.case_manager_notes && `Notes: ${item.statusData.case_manager_notes}`,
                          ].filter(Boolean).join("\n");

                          const barColor = isCancelled ? "#94a3b8" : typeColor;
                          const barrierNum = parseInt(item.key.split("_")[1]);
                          const fullBarrierNotes = client[`barrier_${barrierNum}_notes`] || "";
                          const actionSteps = client[`barrier_${barrierNum}_action_steps`] || "";
                          const challenges = client[`barrier_${barrierNum}_challenges`] || "";

                          return (
                            <div key={item.key} className="relative">
                              <button
                                onClick={() => { 
                                  setEditingMilestone(null);
                                  if (item.isBarrier) {
                                    setOpenBarrierDetail(isBarrierOpen ? null : item.key);
                                    setOpenItem(null);
                                  } else {
                                    setOpenItem(isOpen ? null : item.key);
                                    setOpenBarrierDetail(null);
                                  }
                                }}
                                className="w-full flex items-center h-8 group"
                              >
                                <div
                                  className="absolute -ml-40 w-40 pr-2 text-[11px] font-medium truncate text-right"
                                  style={{ color: isCancelled ? "#94a3b8" : typeColor }}
                                >
                                  {item.isBarrier && <span className="mr-0.5">⚠</span>}
                                  {item.label}
                                </div>

                                <div
                                  className="w-full relative h-6 rounded-md transition-all"
                                  style={{
                                    backgroundColor: "#fffbeb",
                                    outline: `2px solid ${cfg.ring}`,
                                    outlineOffset: "-1px",
                                  }}
                                >
                                  {hasBar && (
                                    <Tooltip
                                      content={tooltipLines}
                                      style={{ left: `${startP}%`, width: `${Math.max(2, endP - startP)}%`, top: 0, height: "100%" }}
                                      className="rounded-md overflow-hidden"
                                    >
                                      <div className="w-full h-full rounded-md relative overflow-hidden pointer-events-none" style={{ backgroundColor: barColor, opacity: isCancelled ? 0.5 : 0.85 }}>
                                        {isStarted && (
                                          <div className="absolute inset-0 rounded-md overflow-hidden">
                                            <div className="h-full" style={{ animation: "typeShimmer 2s infinite linear", backgroundImage: `linear-gradient(90deg, transparent, ${barColor}cc, rgba(255,255,255,0.5), ${barColor}cc, transparent)`, backgroundSize: "200% 100%" }} />
                                          </div>
                                        )}
                                        {isCompleted && (endP - startP) > 8 && (
                                          <span className="absolute inset-0 flex items-center justify-center">
                                            <CheckCheck className="w-4 h-4 drop-shadow-md" style={{ color: "#16a34a", filter: "drop-shadow(0 0 3px rgba(255,255,255,0.9))" }} />
                                          </span>
                                        )}
                                        {isCancelled && (endP - startP) > 8 && (
                                          <span className="absolute inset-0 flex items-center justify-center">
                                            <X className="w-3 h-3 text-white drop-shadow" />
                                          </span>
                                        )}
                                      </div>
                                    </Tooltip>
                                  )}
                                  {hasDot && (
                                    <Tooltip
                                      content={tooltipLines}
                                      style={{ left: `calc(${startP}% - 8px)`, top: "4px", width: "16px", height: "16px" }}
                                      className="rounded-full border-2 border-white shadow"
                                    >
                                      <div className="w-full h-full rounded-full relative flex items-center justify-center pointer-events-none" style={{ backgroundColor: barColor, opacity: isCancelled ? 0.5 : 0.85 }}>
                                        {isCompleted && <CheckCheck className="w-2.5 h-2.5" style={{ color: "#16a34a", filter: "drop-shadow(0 0 2px rgba(255,255,255,0.9))" }} />}
                                        {isCancelled && <X className="w-2 h-2 text-white" />}
                                      </div>
                                    </Tooltip>
                                  )}
                                </div>
                              </button>

                              {isOpen && (
                                <div className="relative z-30 mb-1">
                                  <RoadmapItemPanel
                                    item={item}
                                    currentStatus={item.statusData}
                                    onSave={(data) => handleSaveItem(item.key, data)}
                                    onCancel={() => setOpenItem(null)}
                                    saving={saving}
                                  />
                                </div>
                              )}

                              {isBarrierOpen && (
                                <div className="relative z-30 mt-1 mb-2 ml-40 bg-amber-50 border-2 border-amber-200 rounded-xl p-4 shadow-sm">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                                      <h4 className="text-sm font-bold text-amber-800">{item.label}</h4>
                                    </div>
                                    <button onClick={() => setOpenBarrierDetail(null)} className="text-amber-400 hover:text-amber-600">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                  <div className="space-y-3 text-xs">
                                    {fullBarrierNotes && (
                                      <div>
                                        <span className="font-semibold text-amber-700 block mb-1">Notes:</span>
                                        <p className="text-slate-700 whitespace-pre-wrap">{fullBarrierNotes}</p>
                                      </div>
                                    )}
                                    {actionSteps && (
                                      <div>
                                        <span className="font-semibold text-amber-700 block mb-1">Action Steps:</span>
                                        <p className="text-slate-700 whitespace-pre-wrap">{actionSteps}</p>
                                      </div>
                                    )}
                                    {challenges && (
                                      <div>
                                        <span className="font-semibold text-amber-700 block mb-1">Challenges:</span>
                                        <p className="text-slate-700 whitespace-pre-wrap">{challenges}</p>
                                      </div>
                                    )}
                                    {!fullBarrierNotes && !actionSteps && !challenges && (
                                      <p className="text-slate-500 italic">No detailed notes recorded for this barrier.</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {/* BIT Reviews within Barriers section */}
                        {bitReviewDates.length > 0 && (
                          <div className="relative mt-3">
                            <div className="w-full flex items-center h-8">
                              <div className="absolute -ml-40 w-40 pr-2 text-[11px] text-rose-600 font-medium truncate text-right">
                                BIT Reviews
                              </div>
                              <div className={`w-full relative h-6 rounded-md border bg-slate-50 border-slate-100`}>
                                {bitReviewDates.map((date, i) => {
                                  const checkin = bitCheckins[i] || {};
                                  const isDone  = checkin.completed;
                                  const dp      = pct(date);
                                  const tooltipContent = [
                                    `BIT Review ${i + 1}`,
                                    `Date: ${date}`,
                                    isDone ? "✓ Completed" : "Pending",
                                    checkin.notes && `Notes: ${checkin.notes}`,
                                  ].filter(Boolean).join("\n");

                                  return dp != null ? (
                                    <Tooltip
                                      key={i}
                                      content={tooltipContent}
                                      style={{ left: `calc(${dp}% - 9px)`, top: "2px", width: "20px", height: "20px" }}
                                      className={`rounded-full cursor-pointer ${!isDone ? "animate-pulse" : ""}`}
                                    >
                                      <div
                                        onClick={() => { setEditingMilestone(null); setOpenBITReview(openBITReview === i ? null : i); }}
                                        className={`w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center text-[8px] font-bold text-white ${isDone ? "bg-green-400" : "bg-rose-400"}`}
                                        style={{ pointerEvents: "auto" }}
                                      >
                                        {i + 1}
                                      </div>
                                    </Tooltip>
                                  ) : null;
                                })}
                              </div>
                            </div>
                            
                            {/* BIT panel */}
                            {openBITReview !== null && (
                              <div className="relative z-30 mb-1 mt-2">
                                <BITReviewCheckinPanel
                                  reviewIndex={openBITReview}
                                  scheduledDate={bitReviewDates[openBITReview]}
                                  checkin={bitCheckins[openBITReview] || {}}
                                  clientId={client.id}
                                  onSave={(data) => handleSaveBITCheckin(openBITReview, data)}
                                  onCancel={() => setOpenBITReview(null)}
                                  saving={saving}
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>{/* end rows relative wrapper */}

                    {/* Legend */}
                     <div className="relative z-10 bg-white mt-6 pt-3 border-t border-slate-100 ml-40 text-[10px] text-slate-500 space-y-1">
                       <div className="flex items-center gap-4">
                         <span className="font-semibold text-slate-400 uppercase tracking-wide w-16 shrink-0">Type:</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: "#f59e0b" }} />Barrier</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: "#a855f7" }} />Workshop</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: "#22c55e" }} />Placement</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block" style={{ backgroundColor: "#64748b" }} />Other</span>
                         <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-emerald-500 inline-block" />Milestones</span>
                         <span className="flex items-center gap-1"><span className="w-0.5 h-3 bg-amber-400 inline-block" />Today</span>
                       </div>
                       <div className="flex items-center gap-4">
                         <span className="font-semibold text-slate-400 uppercase tracking-wide w-16 shrink-0">Status:</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block border-2" style={{ borderColor: "#94a3b8" }} />Not Started</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block border-2" style={{ borderColor: "#3b82f6" }} />In Progress</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block border-2" style={{ borderColor: "#22c55e" }} />Completed</span>
                         <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded inline-block border-2" style={{ borderColor: "#ef4444" }} />Cancelled</span>
                       </div>
                     </div>
            </div>
          </div>
        </div>
      </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
            No dates set yet — click any item below to add start/end dates.
          </div>
        )}

        {/* Items needing dates - shown regardless of timeline data */}
        {itemsNeedingDates.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                {itemsNeedingDates.length} item{itemsNeedingDates.length > 1 ? "s" : ""} need dates — not shown on timeline
              </h4>
            </div>
            <div className="space-y-1">
              {itemsNeedingDates.map(item => {
                const cfg       = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                const typeColor = getItemColor(item.key);
                const isOpen = openItem === item.key;
                return (
                  <div key={item.key}>
                    <button
                      onClick={() => setOpenItem(isOpen ? null : item.key)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border-2 text-left transition-all hover:shadow-sm bg-white"
                      style={{ borderColor: cfg.ring }}
                    >
                      {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: typeColor }} />}
                      <span className="flex-1 text-sm font-medium" style={{ color: typeColor }}>{item.label}</span>
                      <span className="text-xs text-amber-600 font-medium">+ Add dates</span>
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
            </div>
          </div>
        )}
      </div>
    )}

    {/* ══ LIST VIEW ══ */}
      {view === "list" && (
        <div className="space-y-1">
          {items.map(item => {
            const cfg       = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
            const typeColor = getItemColor(item.key);
            const isCancelled = item.status === "cancelled";
            const isCompleted = item.status === "completed";
            const isStarted   = item.status === "started";
            const isOpen = openItem === item.key;
            return (
              <div key={item.key}>
                <button
                  onClick={() => setOpenItem(isOpen ? null : item.key)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm bg-white"
                  style={{ borderColor: cfg.ring, borderWidth: "2px", opacity: isCancelled ? 0.6 : 1 }}
                >
                  {isCompleted ? <CheckCheck className="w-5 h-5 shrink-0 text-green-600" /> :
                   isCancelled ? <X className="w-4 h-4 shrink-0 text-red-400" /> :
                   isStarted   ? <Clock className="w-4 h-4 shrink-0" style={{ color: typeColor }} /> :
                                 <Circle className="w-4 h-4 shrink-0 text-slate-300" />}
                  {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 shrink-0" style={{ color: typeColor }} />}
                  <span className="flex-1 text-sm font-medium" style={{ color: isCancelled ? "#94a3b8" : typeColor }}>{item.label}</span>
                  {item.statusData?.started_date && isStarted && (
                    <span className="text-xs text-slate-400">Started {item.statusData.started_date}</span>
                  )}
                  {item.statusData?.completed_date && isCompleted && (
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

          {bitReviewDates.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">BIT Review Dates</p>
              {bitReviewDates.map((date, i) => {
                const checkin = bitCheckins[i] || {};
                const isOpen  = openBITReview === i;
                const isDone  = checkin.completed;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setOpenBITReview(isOpen ? null : i)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm mb-1 ${isDone ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"}`}
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
      )}

      {/* ══ CALENDAR VIEW ══ */}
      {view === "calendar" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="grid grid-cols-7 gap-px mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-xs font-semibold text-slate-500 uppercase tracking-wide py-2 text-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {(() => {
              const today = new Date();
              const currentMonth = today.getMonth();
              const currentYear = today.getFullYear();
              const firstDay = new Date(currentYear, currentMonth, 1);
              const lastDay = new Date(currentYear, currentMonth + 1, 0);
              const startDay = firstDay.getDay();
              const totalDays = lastDay.getDate();
              const days = [];
              
              // Previous month days
              for (let i = 0; i < startDay; i++) {
                days.push(<div key={`empty-${i}`} className="bg-slate-50 min-h-[80px]" />);
              }
              
              // Current month days
              for (let day = 1; day <= totalDays; day++) {
                const dateStr = format(new Date(currentYear, currentMonth, day), "yyyy-MM-dd");
                const dayItems = items.filter(item => {
                  const start = item.detail?.timeline_start || item.statusData?.started_date;
                  const end = item.detail?.timeline_end || item.statusData?.completed_date;
                  if (start && end) {
                    return dateStr >= start && dateStr <= end;
                  }
                  return start === dateStr || end === dateStr;
                });
                const bitItems = bitReviewDates.filter(d => d === dateStr);
                const isToday = dateStr === format(today, "yyyy-MM-dd");
                
                days.push(
                  <div key={day} className={`bg-white min-h-[80px] p-1 ${isToday ? "bg-blue-50" : ""}`}>
                    <div className={`text-xs font-medium mb-1 ${isToday ? "text-blue-600" : "text-slate-700"}`}>{day}</div>
                    <div className="space-y-0.5 overflow-y-auto max-h-[60px]">
                      {dayItems.map(item => {
                        const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                        const typeColor = getItemColor(item.key);
                        return (
                          <div
                            key={item.key}
                            className="text-[9px] px-1 py-0.5 rounded truncate"
                            style={{ backgroundColor: `${typeColor}33`, color: typeColor, borderLeft: `2px solid ${cfg.ring}` }}
                            title={item.label}
                          >
                            {item.label.length > 15 ? item.label.substring(0, 15) + "…" : item.label}
                          </div>
                        );
                      })}
                      {bitItems.map((_, i) => (
                        <div
                          key={`bit-${i}`}
                          className="text-[9px] px-1 py-0.5 rounded bg-rose-100 text-rose-700 truncate"
                          title="BIT Review"
                        >
                          BIT {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              
              return days;
            })()}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
            <span className="font-semibold">Legend:</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" />Today</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-500" />Barrier</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-purple-500" />Workshop</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500" />Placement</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-500" />BIT Review</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes typeShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}