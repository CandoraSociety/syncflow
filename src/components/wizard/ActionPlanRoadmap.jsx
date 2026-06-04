import { useState } from "react";
import { addWeeks, format, parseISO, differenceInDays, isWithinInterval, addDays } from "date-fns";
import { CheckCircle2, Circle, Clock, AlertTriangle, CalendarCheck, LayoutList, BarChart2, AlertCircle, X, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  planned:   { icon: Circle,       color: "text-slate-400",  bg: "bg-slate-50",  border: "border-slate-200", badge: "bg-slate-100 text-slate-500",  label: "Planned",     barColor: "#94a3b8" },
  started:   { icon: Clock,        color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200",  badge: "bg-blue-100 text-blue-700",    label: "In Progress", barColor: "#3b82f6" },
  completed: { icon: CheckCircle2, color: "text-green-600",  bg: "bg-green-50",  border: "border-green-200", badge: "bg-green-100 text-green-700",  label: "Completed",   barColor: "#22c55e" },
};

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
  const end = parseISO(endStr);
  const today = new Date();
  return isWithinInterval(end, { start: today, end: addDays(today, 7) });
}

// Small inline date editor for milestone lines
function MilestoneDateEditor({ label, currentDate, fieldName, onSave, onCancel, saving }) {
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
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("timeline");
  const [editingMilestone, setEditingMilestone] = useState(null); // "intake" | "service_start" | "completion"

  const roadmapStatus = client?.roadmap_item_status || {};
  const bitCheckins   = client?.bit_review_checkins || [];
  const bitReviewDates = client?.bit_review_dates || [];

  const intakeDate   = client?.intake_date        ? parseISO(client.intake_date)        : null;
  const serviceStart = client?.service_start_date ? parseISO(client.service_start_date) : null;
  const isPathways   = client?.service_type === "pathways";
  const programWeeks = isPathways ? 16 : 2;
  const projectedEnd = serviceStart ? addWeeks(serviceStart, programWeeks) : null;
  const actualEnd    = client?.completion_date ? parseISO(client.completion_date) : null;
  const followup90   = actualEnd ? addWeeks(actualEnd, 13) : null;

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

  // ─── Gantt helpers ────────────────────────────────────────────────────────
  const allDates = [];
  if (intakeDate)   allDates.push(intakeDate);
  if (serviceStart) allDates.push(serviceStart);
  if (projectedEnd) allDates.push(projectedEnd);
  if (actualEnd)    allDates.push(actualEnd);
  if (followup90)   allDates.push(followup90);
  items.forEach(item => {
    const sd = item.detail?.timeline_start || item.statusData?.started_date;
    const ed = item.detail?.timeline_end   || item.statusData?.completed_date;
    if (sd) allDates.push(parseISO(sd));
    if (ed) allDates.push(parseISO(ed));
  });
  bitReviewDates.forEach(d => { if (d) allDates.push(parseISO(d)); });

  const hasTimelineData = allDates.length > 0;
  let minDate, maxDate, totalDays;
  if (hasTimelineData) {
    minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    minDate = new Date(minDate); minDate.setDate(minDate.getDate() - 7);
    maxDate = new Date(maxDate); maxDate.setDate(maxDate.getDate() + 14);
    totalDays = differenceInDays(maxDate, minDate) || 1;
  }

  function pct(dateStr) {
    if (!dateStr || !hasTimelineData) return null;
    const d = typeof dateStr === "string" ? parseISO(dateStr) : dateStr;
    return Math.max(0, Math.min(100, (differenceInDays(d, minDate) / totalDays) * 100));
  }

  const monthLabels = [];
  if (hasTimelineData) {
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    while (cursor <= maxDate) {
      monthLabels.push({ label: format(cursor, "MMM yy"), pct: pct(cursor) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  const todayPct = hasTimelineData ? pct(new Date()) : null;
  const anyPanelOpen = openItem !== null || openBITReview !== null;

  // Milestone definitions
  const milestones = [
    intakeDate && {
      key: "intake",
      date: intakeDate,
      label: "Intake",
      editLabel: "Intake Date",
      field: "intake_date",
      color: "#8b5cf6",
      textColor: "text-violet-700",
    },
    serviceStart && {
      key: "service_start",
      date: serviceStart,
      label: "Start",
      editLabel: "Service Start Date",
      field: "service_start_date",
      color: "#10b981",
      textColor: "text-emerald-700",
    },
    (actualEnd || projectedEnd) && {
      key: "completion",
      date: actualEnd || projectedEnd,
      label: actualEnd ? "End" : "Proj.End",
      editLabel: "Completion Date",
      field: "completion_date",
      color: actualEnd ? "#16a34a" : "#3b82f6",
      textColor: actualEnd ? "text-green-700" : "text-blue-700",
      dashed: !actualEnd,
    },
    followup90 && {
      key: "followup90",
      date: followup90,
      label: "90d",
      editLabel: null, // read-only, derived from completion date
      color: "#a855f7",
      textColor: "text-purple-600",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-4">

      {/* ── View toggle ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Program Progress Roadmap</h3>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setView("timeline")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "timeline" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
          >
            <BarChart2 className="w-3.5 h-3.5" /> Timeline
          </button>
          <button
            onClick={() => setView("list")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${view === "list" ? "bg-white shadow text-primary" : "text-slate-500 hover:text-slate-700"}`}
          >
            <LayoutList className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TIMELINE VIEW                                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {view === "timeline" && (
        <div className="space-y-4">
          {hasTimelineData ? (
            <div className="bg-white border border-slate-200 rounded-xl p-4 overflow-x-auto shadow-sm">
              <div className="min-w-[600px]">

                {/* Month axis — sits above the chart, clear of milestone labels */}
                <div className="relative h-5 ml-40 mb-0">
                  {monthLabels.map((m, i) => (
                    <span key={i} className="absolute text-[10px] text-slate-400 font-medium" style={{ left: `${m.pct}%`, transform: "translateX(-50%)" }}>
                      {m.label}
                    </span>
                  ))}
                </div>

                {/* Milestone label row — below axis, above chart rows */}
                <div className="relative h-5 ml-40 mb-1">
                  {milestones.map(m => (
                    <button
                      key={m.key}
                      onClick={() => m.editLabel && setEditingMilestone(editingMilestone === m.key ? null : m.key)}
                      className={`absolute text-[9px] font-bold whitespace-nowrap flex items-center gap-0.5 ${m.textColor} ${m.editLabel ? "hover:underline cursor-pointer" : "cursor-default"}`}
                      style={{ left: `${pct(m.date)}%`, transform: "translateX(-50%)" }}
                      title={m.editLabel ? `Click to edit ${m.editLabel}` : undefined}
                    >
                      ▼ {m.label}
                    </button>
                  ))}
                </div>

                {/* Chart area — milestone lines + rows */}
                <div className="relative ml-40">

                  {/* Vertical grid lines (month) — behind everything */}
                  {monthLabels.map((m, i) => (
                    <div key={i} className="absolute top-0 bottom-0 w-px bg-slate-100 z-0" style={{ left: `${m.pct}%` }} />
                  ))}

                  {/* Today line */}
                  {todayPct !== null && (
                    <div className="absolute top-0 bottom-0 w-0.5 bg-amber-400 opacity-70 z-0" style={{ left: `${todayPct}%` }}>
                      <span className="absolute top-0 left-1 text-[9px] text-amber-600 font-bold whitespace-nowrap bg-white/80 px-0.5 rounded">
                        {format(new Date(), "MMM d")}
                      </span>
                    </div>
                  )}

                  {/* Milestone vertical lines — z-0 so item panels render above */}
                  {milestones.map(m => (
                    <div
                      key={m.key}
                      className="absolute top-0 bottom-0 w-0.5 z-0"
                      style={{
                        left: `${pct(m.date)}%`,
                        backgroundColor: m.color,
                        opacity: 0.7,
                        borderStyle: m.dashed ? "dashed" : "solid",
                      }}
                    />
                  ))}

                  {/* Milestone date editors (popover) */}
                  {milestones.map(m => (
                    editingMilestone === m.key && m.editLabel && (
                      <div key={`edit_${m.key}`} className="absolute z-50" style={{ left: `${pct(m.date)}%` }}>
                        <MilestoneDateEditor
                          label={m.editLabel}
                          currentDate={m.key === "intake" ? client?.intake_date : m.key === "service_start" ? client?.service_start_date : client?.completion_date}
                          fieldName={m.field}
                          onSave={(val) => handleSaveMilestone(m.field, val)}
                          onCancel={() => setEditingMilestone(null)}
                          saving={saving}
                        />
                      </div>
                    )
                  ))}

                  {/* Item rows — rendered ABOVE milestone lines via relative positioning */}
                  <div className="space-y-1.5 pt-2">
                    {itemsWithDates.map(item => {
                      const cfg        = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                      const startStr   = item.detail?.timeline_start || item.statusData?.started_date;
                      const endStr     = item.detail?.timeline_end   || item.statusData?.completed_date;
                      const startP     = pct(startStr);
                      const endP       = pct(endStr);
                      const hasBar     = startP != null && endP != null && endP > startP;
                      const hasDot     = startP != null && !hasBar;
                      const approaching = isApproaching(item);
                      const isOpen     = openItem === item.key;

                      return (
                        <div key={item.key} className="relative">
                          <button
                            onClick={() => { setEditingMilestone(null); setOpenItem(isOpen ? null : item.key); }}
                            className="w-full flex items-center h-8 group"
                            title={`Click to update: ${item.label}`}
                          >
                            {/* Label */}
                            <div className={`absolute -ml-40 w-40 pr-2 text-[11px] font-medium truncate text-right transition-colors group-hover:text-primary ${approaching ? "text-amber-600 font-semibold" : "text-slate-600"}`}>
                              {approaching && <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 animate-pulse align-middle" />}
                              {item.isBarrier && <span className="text-amber-500 mr-0.5">⚠</span>}
                              {item.label}
                            </div>

                            {/* Bar track */}
                            <div className={`w-full relative h-6 rounded-md border transition-all group-hover:border-primary/40 ${isOpen ? "border-primary/50 bg-primary/5" : "bg-slate-50 border-slate-100"}`}>
                              {hasBar && (
                                <div
                                  className={`absolute h-full rounded-md ${item.status === "started" ? "opacity-90" : "opacity-75"}`}
                                  style={{ left: `${startP}%`, width: `${Math.max(2, endP - startP)}%`, backgroundColor: cfg.barColor }}
                                >
                                  {item.status === "started" && (
                                    <div className="absolute inset-0 rounded-md overflow-hidden">
                                      <div className="h-full" style={{ animation: "shimmer 2s infinite linear", backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)", backgroundSize: "200% 100%" }} />
                                    </div>
                                  )}
                                  {(endP - startP) > 15 && (
                                    <span className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-semibold">{cfg.label}</span>
                                  )}
                                </div>
                              )}
                              {hasDot && (
                                <div
                                  className={`absolute top-1 w-4 h-4 rounded-full border-2 border-white shadow ${approaching ? "animate-pulse" : ""}`}
                                  style={{ left: `calc(${startP}% - 8px)`, backgroundColor: cfg.barColor }}
                                />
                              )}
                              {approaching && hasBar && (
                                <div className="absolute top-1 right-0 w-2 h-4 rounded-r-md animate-pulse opacity-60" style={{ backgroundColor: "#f59e0b" }} />
                              )}
                            </div>
                          </button>

                          {/* Inline edit panel — sits in flow, above milestone lines */}
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

                    {/* BIT Review rows */}
                    {bitReviewDates.map((date, i) => {
                      const checkin = bitCheckins[i] || {};
                      const isDone  = checkin.completed;
                      const dp      = pct(date);
                      const isOpen  = openBITReview === i;
                      return (
                        <div key={`bit_${i}`} className="relative">
                          <button
                            onClick={() => { setEditingMilestone(null); setOpenBITReview(isOpen ? null : i); }}
                            className="w-full flex items-center h-8 group"
                            title={`BIT Review ${i + 1} — click to log check-in`}
                          >
                            <div className="absolute -ml-40 w-40 pr-2 text-[11px] text-rose-600 font-medium truncate text-right group-hover:text-rose-700">
                              BIT Review {i + 1}
                            </div>
                            <div className={`w-full relative h-6 rounded-md border transition-all group-hover:border-rose-300 ${isOpen ? "border-rose-400 bg-rose-50" : "bg-slate-50 border-slate-100"}`}>
                              {dp != null && (
                                <div
                                  className={`absolute top-1 w-4 h-4 rounded-full border-2 border-white shadow ${isDone ? "bg-green-400 border-green-600" : "bg-rose-300 border-rose-500"} ${!isDone ? "animate-pulse" : ""}`}
                                  style={{ left: `calc(${dp}% - 8px)` }}
                                />
                              )}
                            </div>
                          </button>
                          {isOpen && (
                            <div className="relative z-30 mb-1">
                              <BITReviewCheckinPanel
                                reviewIndex={i}
                                scheduledDate={date}
                                checkin={checkin}
                                clientId={client.id}
                                onSave={(data) => handleSaveBITCheckin(i, data)}
                                onCancel={() => setOpenBITReview(null)}
                                saving={saving}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100 ml-40 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-slate-400 inline-block" />Planned</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500 inline-block" />In Progress</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-500 inline-block" />Completed</span>
                  <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-emerald-500 inline-block" />Milestones (click to edit)</span>
                  <span className="flex items-center gap-1.5"><span className="w-0.5 h-3 bg-amber-400 inline-block" />Today</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />Approaching</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-300 border border-rose-500 inline-block" />BIT Review</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-sm text-slate-400">
              No dates set yet — click any item below to add start/end dates.
            </div>
          )}

          {/* ── Items needing dates ──────────────────────────────────────── */}
          {itemsNeedingDates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">
                  {itemsNeedingDates.length} item{itemsNeedingDates.length > 1 ? "s" : ""} need dates — not shown on timeline
                </h4>
              </div>
              <div className="space-y-1">
                {itemsNeedingDates.map(item => {
                  const cfg    = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
                  const Icon   = cfg.icon;
                  const isOpen = openItem === item.key;
                  return (
                    <div key={item.key}>
                      <button
                        onClick={() => setOpenItem(isOpen ? null : item.key)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${isOpen ? "border-primary/40 bg-primary/5" : "border-amber-200 bg-white"}`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                        {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
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

          {/* BIT Review list (only if no items have dates yet) */}
          {bitReviewDates.length > 0 && itemsWithDates.length === 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">BIT Review Dates</p>
              {bitReviewDates.map((date, i) => {
                const checkin = bitCheckins[i] || {};
                const isOpen  = openBITReview === i;
                const isDone  = checkin.completed;
                return (
                  <div key={i}>
                    <button
                      onClick={() => setOpenBITReview(isOpen ? null : i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border text-left transition-all hover:shadow-sm mb-1 ${isDone ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"}`}
                    >
                      <CalendarCheck className={`w-4 h-4 shrink-0 ${isDone ? "text-green-600" : "text-rose-500"}`} />
                      <span className="flex-1 text-sm font-medium text-slate-800">BIT Review {i + 1}</span>
                      <span className="text-xs text-slate-500">{date}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDone ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>{isDone ? "Completed" : "Pending"}</span>
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
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* LIST VIEW                                                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {view === "list" && (
        <div className="space-y-1">
          {items.map(item => {
            const cfg    = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
            const Icon   = cfg.icon;
            const isOpen = openItem === item.key;
            const approaching = isApproaching(item);
            return (
              <div key={item.key}>
                <button
                  onClick={() => setOpenItem(isOpen ? null : item.key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm
                    ${isOpen ? "border-primary/40 bg-primary/5" : cfg.border + " " + cfg.bg}
                    ${approaching ? "ring-1 ring-amber-400" : ""}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${cfg.color} ${item.status === "started" ? "animate-pulse" : ""}`} />
                  {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                  <span className="flex-1 text-sm font-medium text-slate-800">{item.label}</span>
                  {approaching && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold animate-pulse">Approaching</span>}
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

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}