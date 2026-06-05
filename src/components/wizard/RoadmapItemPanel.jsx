import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save, X, CheckCircle2, Play, Calendar, AlertCircle, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import Celebration from "../Celebration";

function isAfterProjectedEnd(dateStr, projectedEndDate) {
  if (!dateStr || !projectedEndDate) return false;
  return dateStr > projectedEndDate;
}

const BARRIER_STATUS_COLORS = {
  unresolved: "bg-red-100 text-red-700 border-red-200",
  in_progress: "bg-amber-100 text-amber-700 border-amber-200",
  resolved: "bg-green-100 text-green-700 border-green-200",
};

/**
 * Panel that opens when a roadmap item is clicked.
 * Handles: dates, case manager notes, started status + date, completed status + date.
 * Calls onSave({ startDate, endDate, notes, status, startedDate, completedDate })
 */
export default function RoadmapItemPanel({ item, currentStatus, onSave, onCancel, saving, projectedEndDate, serviceStartDate }) {
  const [startDate, setStartDate] = useState(item.detail?.timeline_start || "");
  const [endDate, setEndDate] = useState(item.detail?.timeline_end || "");
  const [notes, setNotes] = useState(currentStatus?.case_manager_notes || "");
  const [status, setStatus] = useState(currentStatus?.status || "planned");
  const [startedDate, setStartedDate] = useState(currentStatus?.started_date || "");
  const [completedDate, setCompletedDate] = useState(currentStatus?.completed_date || format(new Date(), "yyyy-MM-dd"));
  const [showCompassPrompt, setShowCompassPrompt] = useState(false);
  const [showLateDatePrompt, setShowLateDatePrompt] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [unlockRange, setUnlockRange] = useState(false);

  // Date range constraints
  const minDate = serviceStartDate || undefined;
  const maxDate = projectedEndDate || undefined;
  const hasRange = !!(minDate && maxDate);
  const dateMin = (!unlockRange && minDate) ? minDate : undefined;
  const dateMax = (!unlockRange && maxDate) ? maxDate : undefined;

  // When status changes to started/completed, show compass prompt
  const prevStatus = currentStatus?.status || "planned";

  // Check if any date is after projected end (skip check for follow-up items only)
  const isBarrierOrFollowup = item.key === "followup_90day" || item.key?.includes("followup");

  function checkLateDate() {
    if (isBarrierOrFollowup || !projectedEndDate) return false;
    return (
      isAfterProjectedEnd(startDate, projectedEndDate) ||
      isAfterProjectedEnd(endDate, projectedEndDate) ||
      isAfterProjectedEnd(startedDate, projectedEndDate) ||
      isAfterProjectedEnd(completedDate, projectedEndDate)
    );
  }

  function handleSave() {
    const isNewStarted = status === "started" && prevStatus !== "started";
    const isNewCompleted = status === "completed" && prevStatus !== "completed";

    // Check for late date first (only for non-barrier, non-followup items)
    if (checkLateDate()) {
      setShowLateDatePrompt(true);
      return;
    }

    // Trigger celebration for ANY item when marked as completed
    if (isNewCompleted) {
      setCelebrate(true);
    }
    
    if (isNewStarted || isNewCompleted) {
      setShowCompassPrompt(true);
    } else {
      onSave({ startDate, endDate, notes, status, startedDate, completedDate });
    }
  }

  function proceedAfterLateDate() {
    setShowLateDatePrompt(false);
    const isNewStarted = status === "started" && prevStatus !== "started";
    const isNewCompleted = status === "completed" && prevStatus !== "completed";
    if (isNewCompleted) setCelebrate(true);
    if (isNewStarted || isNewCompleted) {
      setShowCompassPrompt(true);
    } else {
      onSave({ startDate, endDate, notes, status, startedDate, completedDate });
    }
  }

  function confirmSave() {
    setShowCompassPrompt(false);
    onSave({ startDate, endDate, notes, status, startedDate, completedDate });
    // Celebration already triggered in handleSave
  }

  return (
    <>
      {celebrate && <Celebration trigger={celebrate} onComplete={() => setCelebrate(false)} />}
      <div className="mt-2 mb-3 bg-white border-2 border-primary/20 rounded-xl p-4 shadow-md space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {item.isBarrier && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <span className="font-semibold text-sm text-slate-800">{item.label}</span>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Barrier read-only info */}
      {item.isBarrier && item.detail && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs space-y-1 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">Status:</span>
            <span className={`px-2 py-0.5 rounded-full font-medium border text-xs ${BARRIER_STATUS_COLORS[item.detail.status] || "bg-slate-100 text-slate-600"}`}>
              {(item.detail.status || "unresolved").replace("_", " ")}
            </span>
          </div>
          {item.detail.action_steps && <p><span className="font-medium">Action Steps:</span> {item.detail.action_steps}</p>}
          {item.detail.notes && <p><span className="font-medium">Notes:</span> {item.detail.notes}</p>}
        </div>
      )}

      {/* Dates */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Planned Start</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} min={dateMin} max={dateMax} className="text-xs h-8" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Planned End</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={dateMin} max={dateMax} className="text-xs h-8" />
          </div>
        </div>
        {hasRange && (
          <button
            type="button"
            onClick={() => setUnlockRange(v => !v)}
            className={`flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border transition-colors ${unlockRange ? "border-amber-300 bg-amber-50 text-amber-700" : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300"}`}
          >
            {unlockRange ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {unlockRange ? "Dates outside program range unlocked" : "Allow dates outside program range"}
          </button>
        )}
      </div>

      {/* Status selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Item Status</Label>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "planned",   label: "Not Started", activeClass: "bg-slate-700 text-white border-slate-700" },
            { key: "started",   label: "In Progress",  activeClass: "bg-blue-600 text-white border-blue-600" },
            { key: "completed", label: "Completed",    activeClass: "bg-green-600 text-white border-green-600" },
            { key: "cancelled", label: "Cancelled",    activeClass: "bg-red-600 text-white border-red-600" },
          ].map(({ key: s, label, activeClass }) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
                ${status === s ? activeClass : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
            >
              {s === "completed" && <CheckCircle2 className="w-3 h-3" />}
              {s === "started" && <Play className="w-3 h-3" />}
              {s === "cancelled" && <X className="w-3 h-3" />}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Started date */}
      {status === "started" && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-blue-700">Actual Start Date</Label>
          <Input type="date" value={startedDate} onChange={e => setStartedDate(e.target.value)} min={dateMin} max={dateMax} className="text-xs h-8 border-blue-300" />
        </div>
      )}

      {/* Completed date */}
      {status === "completed" && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-green-700">Completion Date</Label>
          <Input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} min={dateMin} max={dateMax} className="text-xs h-8 border-green-300" />
        </div>
      )}

      {/* Case manager notes */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-600">Case Manager Notes <span className="font-normal text-slate-400">(internal only)</span></Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add helpful notes about this item for your reference…"
          className="text-xs min-h-[70px] resize-none"
        />
      </div>

      {/* Late date confirmation prompt */}
      {showLateDatePrompt && (
        <div className="border border-orange-300 bg-orange-50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-xs text-orange-800">
              <p className="font-semibold mb-1">Date is after projected program end</p>
              <p>
                This activity is scheduled at a date later than the projected program completion date
                {projectedEndDate ? ` (${projectedEndDate})` : ""}. Would you still like to select this date?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={proceedAfterLateDate} disabled={saving} className="text-xs h-7 gap-1 bg-orange-600 hover:bg-orange-700">
              Yes, proceed anyway
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowLateDatePrompt(false)} className="text-xs h-7">Go back</Button>
          </div>
        </div>
      )}

      {/* Compass prompt overlay */}
      {showCompassPrompt && (
        <div className="border border-amber-300 bg-amber-50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold mb-1">Remember to update Compass</p>
              <p>
                {status === "started"
                  ? `"${item.label}" has been marked as started${startedDate ? ` (${startedDate})` : ""}. Please update the client's service plan in Compass to reflect this.`
                  : `"${item.label}" has been marked as completed${completedDate ? ` (${completedDate})` : ""}. Please enter the completion details in the client's Compass service plan.`}
              </p>
              <p className="mt-1 font-medium">HSID#: {item.compassHsid || "see client profile"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={confirmSave} disabled={saving} className="text-xs h-7 gap-1">
              <Save className="w-3 h-3" /> {saving ? "Saving…" : "Save & I'll update Compass"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowCompassPrompt(false)} className="text-xs h-7">Go back</Button>
          </div>
        </div>
      )}

      {!showCompassPrompt && !showLateDatePrompt && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs h-8">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="text-xs h-8">Cancel</Button>
        </div>
      )}
    </div>
    </>
  );
}