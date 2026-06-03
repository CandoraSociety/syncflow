import { useState } from "react";
import { format, parseISO, isValid, differenceInDays, addDays, min, max } from "date-fns";
import { AlertTriangle, Calendar, CalendarDays, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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

// Special color for barrier items
const BARRIER_COLOR = "bg-amber-100 border-amber-400 text-amber-800";

function parseDate(dateStr) {
  if (!dateStr) return null;
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
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

// Build a flat list of renderable rows — barriers expanded individually
function buildRows(selectedItems, itemDetails, otherDesc, client, barriers) {
  const rows = [];
  let colorIdx = 0;

  selectedItems.forEach(key => {
    if (key === "barrier_support") {
      // Expand each barrier as its own row
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
        });
        colorIdx++;
      });
      // If no barriers defined yet, show a placeholder row
      if (barriers.length === 0) {
        rows.push({
          id: "barrier_support",
          key: "barrier_support",
          barrierN: null,
          label: "Address Barriers",
          detail: {},
          start: null,
          end: null,
          colorClass: BARRIER_COLOR,
          isBarrier: true,
        });
      }
    } else {
      const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
      const detail = itemDetails?.[key] || {};
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
      });
      colorIdx++;
    }
  });

  return rows;
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

// Inline date editor for a row — calls back with updated dates
function DateEditor({ item, onSaveDates, onCancel }) {
  const [start, setStart] = useState(
    item.isBarrier ? (item.detail.timeline_start || "") : (item.detail.timeline_start || "")
  );
  const [end, setEnd] = useState(
    item.isBarrier ? (item.detail.timeline_end || "") : (item.detail.timeline_end || "")
  );

  return (
    <div className="mt-1 mb-2 mx-0 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-600 mb-3">Set dates for: <span className="text-slate-800">{item.label}</span></p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="space-y-1">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
        </div>
      </div>
      {/* Details for barrier rows */}
      {item.isBarrier && item.detail && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${BARRIER_STATUS_COLORS[item.detail.status] || "bg-slate-100 text-slate-600"}`}>
              {(item.detail.status || "unresolved").replace("_", " ")}
            </span>
          </div>
          {item.detail.action_steps && <p><span className="font-medium">Action Steps:</span> {item.detail.action_steps}</p>}
          {item.detail.responsible && <p><span className="font-medium">Responsible:</span> {item.detail.responsible}</p>}
          {item.detail.notes && <p><span className="font-medium">Notes:</span> {item.detail.notes}</p>}
        </div>
      )}
      {/* Details for non-barrier rows */}
      {!item.isBarrier && (item.detail.goal || item.detail.notes) && (
        <div className="space-y-1.5 pt-2 border-t border-slate-100 mt-2 text-xs text-slate-600">
          {item.detail.goal && <p><span className="font-medium">Goal:</span> {item.detail.goal}</p>}
          {item.detail.notes && <p><span className="font-medium">Notes:</span> {item.detail.notes}</p>}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <Button size="sm" onClick={() => onSaveDates(start, end)} className="gap-1.5">
          <Save className="w-3.5 h-3.5" /> Save Dates
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onUpdateDetail, onSave }) {
  const [activeItem, setActiveItem] = useState(null);
  const [editingDates, setEditingDates] = useState(null); // row id being date-edited

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No action plan items selected yet.</p>
      </div>
    );
  }

  const barriers = getBarriers(client);
  const rows = buildRows(selectedItems, itemDetails, otherDesc, client, barriers);

  const rowsWithDates = rows.filter(r => r.start || r.end);
  const rowsWithoutDates = rows.filter(r => !r.start && !r.end);

  // Compute timeline bounds
  const allStarts = rowsWithDates.map(r => r.start).filter(Boolean);
  const allEnds = rowsWithDates.map(r => r.end || r.start).filter(Boolean);
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

  // Save dates for a row — barriers update client barrier fields, others update itemDetails
  async function handleSaveDates(row, startVal, endVal) {
    if (row.isBarrier && row.barrierN) {
      // Update the barrier timeline fields on the client
      const patch = {
        [`barrier_${row.barrierN}_timeline_start`]: startVal || null,
        [`barrier_${row.barrierN}_timeline_end`]: endVal || null,
      };
      await onSave(patch);
    } else {
      // Update itemDetails for action plan item
      const updatedDetails = {
        ...itemDetails,
        [row.key]: {
          ...(itemDetails?.[row.key] || {}),
          timeline_start: startVal || undefined,
          timeline_end: endVal || undefined,
        },
      };
      await onSave({ sdp_item_details: updatedDetails });
      onUpdateDetail?.(row.key, "timeline_start", startVal);
      onUpdateDetail?.(row.key, "timeline_end", endVal);
    }
    setEditingDates(null);
  }

  function GanttRow({ row }) {
    const barStyle = getBarStyle(row, timelineStart, totalDays);
    const isEditing = editingDates === row.id;

    return (
      <div key={row.id}>
        <div className="flex items-center gap-2">
          {/* Label */}
          <div className="w-36 shrink-0 text-right pr-2 flex items-center justify-end gap-1">
            {row.isBarrier && <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />}
            <span className="text-xs text-slate-600 font-medium leading-tight line-clamp-2">{row.label}</span>
          </div>
          {/* Bar track */}
          <div className="flex-1 relative h-8 bg-slate-50 rounded-md border border-slate-100">
            <button
              onClick={() => setEditingDates(isEditing ? null : row.id)}
              className={`absolute h-full rounded-md border flex items-center px-2 transition-all shadow-sm hover:opacity-90 ${row.colorClass} ${isEditing ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
              style={barStyle}
              title={row.label}
            >
              <span className="text-xs font-medium truncate">{row.label}</span>
            </button>
          </div>
          {/* Date range */}
          <div className="w-28 shrink-0 text-xs text-slate-400">
            {row.start && <span>{format(row.start, "MMM d")}</span>}
            {row.end && <span> – {format(row.end, "MMM d")}</span>}
          </div>
        </div>
        {isEditing && (
          <DateEditor
            item={row}
            onSaveDates={(s, e) => handleSaveDates(row, s, e)}
            onCancel={() => setEditingDates(null)}
          />
        )}
      </div>
    );
  }

  function UndatedCard({ row }) {
    const isEditing = editingDates === row.id;
    return (
      <div key={row.id}>
        <button
          onClick={() => setEditingDates(isEditing ? null : row.id)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all hover:shadow-sm ${row.colorClass} ${isEditing ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
        >
          {row.isBarrier && <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <span className="text-sm font-medium truncate">{row.label}</span>
          <CalendarDays className="w-3.5 h-3.5 ml-auto shrink-0 opacity-60" />
        </button>
        {isEditing && (
          <DateEditor
            item={row}
            onSaveDates={(s, e) => handleSaveDates(row, s, e)}
            onCancel={() => setEditingDates(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-700">Action Plan Timeline</h3>
        <p className="text-xs text-slate-400 mt-0.5">Each barrier is shown individually. Click any bar or card to set/edit dates.</p>
      </div>

      {/* Gantt chart */}
      {rowsWithDates.length > 0 && (
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
            <div className="space-y-2">
              {rowsWithDates.map(row => <GanttRow key={row.id} row={row} />)}
            </div>
          </div>
        </div>
      )}

      {/* Items without dates */}
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
  );
}