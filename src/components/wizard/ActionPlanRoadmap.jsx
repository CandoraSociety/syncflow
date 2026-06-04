import { useState, useEffect } from "react";
import { format, parseISO, isValid, differenceInDays, addDays, min, max } from "date-fns";
import { AlertTriangle, Calendar, CalendarDays, CheckCircle2, ArrowRight, Play, Flag } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createCompassTask } from "@/lib/compassTasks";
import RoadmapItemPanel from "./RoadmapItemPanel";
import RoadmapProgressNotes from "./RoadmapProgressNotes";
import ProgramStatusPanel from "./ProgramStatusPanel";

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

const BARRIER_COLOR = "bg-amber-100 border-amber-400 text-amber-800";

const STREAM_LABELS = {
  direct_to_employment: "Direct to Employment (DEA)",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral",
  not_eligible: "Not Eligible",
};

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

function getBarStyle(item, timelineStart, totalDays) {
  const start = item.start || timelineStart;
  const end = item.end || (item.start ? addDays(item.start, 7) : null);
  if (!start || !timelineStart || !end) return { left: "0%", width: "30%" };
  const leftDays = differenceInDays(start, timelineStart);
  const widthDays = Math.max(differenceInDays(end, start), 1);
  const left = (leftDays / totalDays) * 100;
  const width = Math.max((widthDays / totalDays) * 100, 2);
  return { left: `${left}%`, width: `${Math.min(width, 100 - left)}%` };
}

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onUpdateDetail, onClientUpdate }) {
  const [editingItem, setEditingItem] = useState(null); // row.id
  const [saving, setSaving] = useState(false);

  const [localItemDetails, setLocalItemDetails] = useState(itemDetails || {});
  const [localBarrierDates, setLocalBarrierDates] = useState({});
  // { [rowId]: { status, started_date, completed_date, case_manager_notes } }
  const [itemStatus, setItemStatus] = useState(client?.roadmap_item_status || {});
  const [progressNotes, setProgressNotes] = useState(client?.roadmap_progress_notes || []);

  useEffect(() => {
    setLocalItemDetails(itemDetails || {});
  }, [JSON.stringify(itemDetails)]);

  useEffect(() => {
    setItemStatus(client?.roadmap_item_status || {});
    setProgressNotes(client?.roadmap_progress_notes || []);
  }, [client?.id]);



  function getBarriers() {
    const barriers = [];
    for (let n = 1; n <= 3; n++) {
      const type = client?.[`barrier_${n}`];
      if (!type) continue;
      const label = type === "Other" ? (client[`barrier_${n}_other`] || "Other") : type;
      const localDates = localBarrierDates[n] || {};
      barriers.push({
        n,
        label,
        status: client[`barrier_${n}_status`] || "unresolved",
        notes: client[`barrier_${n}_notes`] || "",
        action_steps: client[`barrier_${n}_action_steps`] || "",
        timeline_start: localDates.timeline_start ?? (client[`barrier_${n}_timeline_start`] || ""),
        timeline_end: localDates.timeline_end ?? (client[`barrier_${n}_timeline_end`] || ""),
        responsible: client[`barrier_${n}_responsible`] || "",
        resources: client[`barrier_${n}_resources`] || "",
      });
    }
    return barriers;
  }

  function buildRows() {
    const rows = [];
    let colorIdx = 0;
    const barriers = getBarriers();

    selectedItems.forEach(key => {
      if (key === "barrier_support") {
        barriers.forEach(b => {
          rows.push({
            id: `barrier_${b.n}`,
            key: "barrier_support",
            barrierN: b.n,
            label: b.label,
            detail: b,
            start: parseDate(b.timeline_start),
            end: parseDate(b.timeline_end),
            colorClass: BARRIER_COLOR,
            isBarrier: true,
            compassHsid: client?.compass_hsid,
          });
          colorIdx++;
        });
        if (barriers.length === 0) {
          rows.push({
            id: "barrier_support",
            key: "barrier_support",
            barrierN: null,
            label: "Address Barriers",
            detail: {},
            start: null, end: null,
            colorClass: BARRIER_COLOR,
            isBarrier: true,
            compassHsid: client?.compass_hsid,
          });
        }
      } else {
        const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
        const detail = localItemDetails?.[key] || {};
        const label = key === "other" ? (otherDesc || "Other") : opt?.label || key;
        let start = null, end = null;
        if (key === "internal_placement") {
          start = parseDate(client?.placement_start_date);
          end = parseDate(client?.placement_end_date);
        } else {
          start = parseDate(detail?.timeline_start);
          end = parseDate(detail?.timeline_end);
        }
        rows.push({
          id: key,
          key,
          barrierN: null,
          label,
          detail,
          start,
          end,
          colorClass: BAR_COLORS_LIGHT[colorIdx % BAR_COLORS_LIGHT.length],
          isBarrier: false,
          compassHsid: client?.compass_hsid,
        });
        colorIdx++;
      }
    });

    return rows;
  }

  async function addProgressNote(eventType, itemLabel, itemKey, noteText) {
    const me = await base44.auth.me().catch(() => null);
    const newNote = {
      id: `${eventType}_${itemKey}_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      event_type: eventType,
      item_label: itemLabel,
      item_key: itemKey,
      note: noteText,
      logged_by: me?.email || "",
      logged_by_name: me?.full_name || me?.email || "",
    };
    const updated = [...progressNotes, newNote];
    setProgressNotes(updated);
    return updated;
  }

  async function handleSaveItem(row, { startDate, endDate, notes, status, startedDate, completedDate }) {
    setSaving(true);
    try {
      const prevStatusObj = itemStatus[row.id] || {};
      const prevStatus = prevStatusObj.status || "planned";

      // 1. Save dates
      if (row.isBarrier && row.barrierN) {
        await base44.entities.Client.update(client.id, {
          [`barrier_${row.barrierN}_timeline_start`]: startDate || null,
          [`barrier_${row.barrierN}_timeline_end`]: endDate || null,
        });
        setLocalBarrierDates(prev => ({
          ...prev,
          [row.barrierN]: { timeline_start: startDate || "", timeline_end: endDate || "" },
        }));
      } else {
        const updatedDetails = {
          ...localItemDetails,
          [row.key]: {
            ...(localItemDetails?.[row.key] || {}),
            timeline_start: startDate || undefined,
            timeline_end: endDate || undefined,
          },
        };
        await base44.entities.Client.update(client.id, { sdp_item_details: updatedDetails });
        setLocalItemDetails(updatedDetails);
        onUpdateDetail?.(row.key, "timeline_start", startDate);
        onUpdateDetail?.(row.key, "timeline_end", endDate);
      }

      // 2. Save item status
      const newStatusObj = {
        ...prevStatusObj,
        status,
        case_manager_notes: notes,
        started_date: status === "started" || status === "completed" ? (startedDate || prevStatusObj.started_date || "") : prevStatusObj.started_date || "",
        completed_date: status === "completed" ? completedDate : prevStatusObj.completed_date || "",
      };
      const updatedItemStatus = { ...itemStatus, [row.id]: newStatusObj };
      setItemStatus(updatedItemStatus);

      // 3. Generate progress notes — only when status actually changes to started or completed
      let updatedNotes = progressNotes;
      const clientName = `${client.first_name} ${client.last_name}`;

      if (status === "started" && prevStatus !== "started") {
        const existingIdx = updatedNotes.findIndex(n => n.item_key === row.id);
        const me = await base44.auth.me().catch(() => null);
        const noteText = `• Client started ${row.label}${startedDate ? ` on ${startedDate}` : ""} — in progress`;
        const noteObj = {
          id: existingIdx >= 0 ? updatedNotes[existingIdx].id : `started_${row.id}_${Date.now()}`,
          date: startedDate || new Date().toISOString().slice(0, 10),
          event_type: "started",
          item_label: row.label,
          item_key: row.id,
          note: noteText,
          logged_by: me?.email || "",
          logged_by_name: me?.full_name || me?.email || "",
          compass_entered: false,
        };
        if (existingIdx >= 0) {
          updatedNotes = [...updatedNotes];
          updatedNotes[existingIdx] = noteObj;
        } else {
          updatedNotes = [...updatedNotes, noteObj];
        }
        setProgressNotes(updatedNotes);
        // Create Compass task
        createCompassTask({
          client_id: client.id,
          client_name: clientName,
          compass_hsid: client.compass_hsid || "",
          assigned_worker: client.assigned_worker || "",
          assigned_worker_name: client.assigned_worker_name || "",
          task_type: `roadmap_started_${row.id}`,
          title: `Service plan item started: ${row.label} — ${clientName}`,
          instructions:
            `A service plan item has been marked as started and needs to be recorded in Compass.\n\n` +
            `Client: ${clientName}\n` +
            `HSID#: ${client.compass_hsid || "unknown — check client profile"}\n\n` +
            `Item: ${row.label}\n` +
            `Started: ${startedDate || "not specified"}\n` +
            `Status: In progress\n\n` +
            `Action: Update this item in the client's Compass service plan to reflect the start date and in-progress status.`,
        });
      } else if (status === "completed" && prevStatus !== "completed") {
        const existingIdx = updatedNotes.findIndex(n => n.item_key === row.id);
        const me = await base44.auth.me().catch(() => null);
        const actualStart = startedDate || newStatusObj.started_date || "";
        const actualCompleted = completedDate || new Date().toISOString().slice(0, 10);
        const noteText = `• Client started ${row.label}${actualStart ? ` on ${actualStart}` : ""} — completed on ${actualCompleted}`;
        const noteObj = {
          id: existingIdx >= 0 ? updatedNotes[existingIdx].id : `completed_${row.id}_${Date.now()}`,
          date: actualCompleted,
          event_type: "completed",
          item_label: row.label,
          item_key: row.id,
          note: noteText,
          logged_by: me?.email || "",
          logged_by_name: me?.full_name || me?.email || "",
          compass_entered: false,
        };
        if (existingIdx >= 0) {
          updatedNotes = [...updatedNotes];
          updatedNotes[existingIdx] = noteObj;
        } else {
          updatedNotes = [...updatedNotes, noteObj];
        }
        setProgressNotes(updatedNotes);
        // Create Compass task
        createCompassTask({
          client_id: client.id,
          client_name: clientName,
          compass_hsid: client.compass_hsid || "",
          assigned_worker: client.assigned_worker || "",
          assigned_worker_name: client.assigned_worker_name || "",
          task_type: `roadmap_completed_${row.id}`,
          title: `Service plan item completed: ${row.label} — ${clientName}`,
          instructions:
            `A service plan item has been marked as completed and needs to be recorded in Compass.\n\n` +
            `Client: ${clientName}\n` +
            `HSID#: ${client.compass_hsid || "unknown — check client profile"}\n\n` +
            `Item: ${row.label}\n` +
            `Started: ${actualStart || "not specified"}\n` +
            `Completed: ${actualCompleted}\n\n` +
            `Action: Update this item in the client's Compass service plan to reflect the completion date.`,
        });
      }

      // 4. Persist both item status and notes
      await base44.entities.Client.update(client.id, {
        roadmap_item_status: updatedItemStatus,
        roadmap_progress_notes: updatedNotes,
      });

      setEditingItem(null);
    } finally {
      setSaving(false);
    }
  }

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No action plan items selected yet.</p>
      </div>
    );
  }

  const rows = buildRows();
  const rowsWithDates = rows.filter(r => r.start || r.end);
  const rowsWithoutDates = rows.filter(r => !r.start && !r.end);

  // BIT review dates as milestone markers
  const reviewDates = (client?.bit_review_dates || [])
    .map((d, i) => ({ date: parseDate(d), label: `BIT Review ${i + 1}`, raw: d }))
    .filter(m => m.date);

  // Barrier resolution timelines as dedicated rows (shown even if barrier_support not selected)
  const barrierRows = [];
  for (let n = 1; n <= 3; n++) {
    const type = client?.[`barrier_${n}`];
    if (!type) continue;
    const label = type === "Other" ? (client[`barrier_${n}_other`] || "Other") : type;
    const start = parseDate(client?.[`barrier_${n}_timeline_start`]);
    const end = parseDate(client?.[`barrier_${n}_timeline_end`]);
    if (start || end) {
      barrierRows.push({ id: `barrier_ref_${n}`, label, start, end, n });
    }
  }

  const allStarts = [
    ...rowsWithDates.map(r => r.start),
    ...barrierRows.map(r => r.start),
    ...reviewDates.map(m => m.date),
  ].filter(Boolean);
  const allEnds = [
    ...rowsWithDates.map(r => r.end || r.start),
    ...barrierRows.map(r => r.end || r.start),
    ...reviewDates.map(m => m.date),
  ].filter(Boolean);
  const timelineStart = allStarts.length > 0 ? min(allStarts) : null;
  const timelineEnd = allEnds.length > 0 ? max(allEnds) : null;
  const totalDays = timelineStart && timelineEnd ? Math.max(differenceInDays(timelineEnd, timelineStart), 1) : 1;

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
  const switches = client?.program_stream_switches || [];

  function StatusIcon({ rowId }) {
    const s = itemStatus[rowId]?.status;
    if (s === "completed") return <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />;
    if (s === "started") return <Play className="w-3.5 h-3.5 text-yellow-400 shrink-0" fill="currentColor" />;
    return null;
  }

  function GanttRow({ row }) {
    const barStyle = getBarStyle(row, timelineStart, totalDays);
    const isEditing = editingItem === row.id;
    const rowItemStatus = itemStatus[row.id];
    const isDone = rowItemStatus?.status === "completed";
    const isStarted = rowItemStatus?.status === "started";

    return (
      <div>
        <div className="flex items-center gap-2">
          <div className="w-36 shrink-0 text-right pr-2 flex items-center justify-end gap-1">
            {row.isBarrier && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
            <span className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">{row.label}</span>
          </div>
          <div className="flex-1 relative h-8 bg-slate-50 rounded-md border border-slate-100">
            <button
              onClick={() => setEditingItem(isEditing ? null : row.id)}
              className={`absolute h-full rounded-md border-2 flex items-center gap-1.5 px-2 transition-all shadow-sm hover:opacity-90
                ${isDone ? "bg-green-100 border-green-500 text-green-800"
                  : row.colorClass}
                ${isStarted && !isDone ? "animate-pulse" : ""}
                ${isEditing ? "ring-2 ring-offset-1 ring-primary/50" : ""}
              `}
              style={barStyle}
              title="Click to edit"
            >
              <StatusIcon rowId={row.id} />
              <span className="text-xs font-medium truncate">{row.label}</span>
            </button>
          </div>
          <div className="w-40 shrink-0 text-xs text-slate-400">
            {row.start && <span>{format(row.start, "MMM d")}</span>}
            {row.end && <span> – {format(row.end, "MMM d")}</span>}
          </div>
        </div>
        {isEditing && (
          <div className="ml-36 pl-2">
            <RoadmapItemPanel
              item={row}
              currentStatus={itemStatus[row.id]}
              onSave={(data) => handleSaveItem(row, data)}
              onCancel={() => setEditingItem(null)}
              saving={saving}
            />
          </div>
        )}
      </div>
    );
  }

  function UndatedCard({ row }) {
    const isEditing = editingItem === row.id;
    const rowItemStatus = itemStatus[row.id];
    const isDone = rowItemStatus?.status === "completed";
    const isStarted = rowItemStatus?.status === "started";

    return (
      <div>
        <button
          onClick={() => setEditingItem(isEditing ? null : row.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border-2 text-left transition-all
            ${isDone ? "bg-green-50 border-green-400 text-green-800"
              : row.colorClass}
            ${isStarted && !isDone ? "animate-pulse" : ""}
            ${isEditing ? "ring-2 ring-offset-1 ring-primary/50" : ""}
          `}
        >
          {row.isBarrier && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <StatusIcon rowId={row.id} />
          <span className="text-sm font-medium truncate flex-1">{row.label}</span>
          <CalendarDays className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
        </button>
        {isEditing && (
          <RoadmapItemPanel
            item={row}
            currentStatus={itemStatus[row.id]}
            onSave={(data) => handleSaveItem(row, data)}
            onCancel={() => setEditingItem(null)}
            saving={saving}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Program status panel — always at top */}
      <ProgramStatusPanel client={client} onClientUpdate={onClientUpdate} />

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        {/* Stream switch banner */}
        {switches.length > 0 && (
          <div className="bg-purple-50 border border-purple-300 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">⚠ Program Stream Switch{switches.length > 1 ? "es" : ""} on File</span>
            </div>
            <div className="space-y-1.5">
              {switches.map((sw, i) => (
                <div key={i} className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="text-xs text-purple-500 font-medium">{sw.date || "—"}</span>
                  <span className="bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded text-xs font-medium">{STREAM_LABELS[sw.from_stream] || sw.from_stream}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-xs font-semibold">{STREAM_LABELS[sw.to_stream] || sw.to_stream}</span>
                  {sw.reason && <span className="text-xs text-purple-500">({sw.reason.replace(/_/g, " ")})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-slate-700">Action Plan Timeline</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click any item to set dates, add notes, or update status.</p>
        </div>

        {/* Gantt */}
        {(rowsWithDates.length > 0 || barrierRows.length > 0 || reviewDates.length > 0) && (
          <div className="overflow-x-auto">
            <div className="min-w-[500px]">
              {/* Month axis */}
              <div className="relative h-6 mb-3 ml-36 border-b border-slate-200">
                {monthMarkers.map((m, i) => (
                  <div key={i} className="absolute top-0 flex flex-col items-start" style={{ left: `${m.pct}%` }}>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{m.label}</span>
                    <div className="w-px h-2 bg-slate-200 mt-0.5" />
                  </div>
                ))}
                {/* BIT review date markers on the axis */}
                {reviewDates.map((m, i) => {
                  const pct = (differenceInDays(m.date, timelineStart) / totalDays) * 100;
                  return (
                    <div key={i} className="absolute top-0 flex flex-col items-center" style={{ left: `${pct}%` }} title={`${m.label}: ${m.raw}`}>
                      <Flag className="w-3 h-3 text-rose-500" />
                      <div className="w-px h-2 bg-rose-400 mt-0.5" />
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                {rowsWithDates.map(row => <GanttRow key={row.id} row={row} />)}

                {/* Barrier resolution timeline rows */}
                {barrierRows.map(b => {
                  const barStyle = getBarStyle({ start: b.start, end: b.end }, timelineStart, totalDays);
                  return (
                    <div key={b.id} className="flex items-center gap-2">
                      <div className="w-36 shrink-0 text-right pr-2 flex items-center justify-end gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                        <span className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">{b.label}</span>
                      </div>
                      <div className="flex-1 relative h-8 bg-slate-50 rounded-md border border-slate-100">
                        <div
                          className="absolute h-full rounded-md border-2 flex items-center gap-1.5 px-2 bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                          style={barStyle}
                        >
                          <span className="text-xs font-medium truncate">{b.label}</span>
                        </div>
                      </div>
                      <div className="w-40 shrink-0 text-xs text-slate-400">
                        {b.start && <span>{format(b.start, "MMM d")}</span>}
                        {b.end && <span> – {format(b.end, "MMM d")}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* BIT review date legend */}
              {reviewDates.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 ml-36">
                  {reviewDates.map((m, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-rose-600">
                      <Flag className="w-3 h-3" />
                      <span>{m.label}: {m.raw}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Undated cards */}
        {rowsWithoutDates.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items Without Set Dates — click to add</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rowsWithoutDates.map(row => <UndatedCard key={row.id} row={row} />)}
            </div>
          </div>
        )}
      </div>

      {/* Progress notes panel */}
      <RoadmapProgressNotes
        notes={progressNotes}
        clientId={client.id}
        onNotesUpdate={setProgressNotes}
      />
    </div>
  );
}