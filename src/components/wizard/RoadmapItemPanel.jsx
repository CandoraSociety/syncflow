import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Save, X, CheckCircle2, Play, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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
export default function RoadmapItemPanel({ item, currentStatus, onSave, onCancel, saving }) {
  const [startDate, setStartDate] = useState(item.detail?.timeline_start || "");
  const [endDate, setEndDate] = useState(item.detail?.timeline_end || "");
  const [notes, setNotes] = useState(currentStatus?.case_manager_notes || "");
  const [status, setStatus] = useState(currentStatus?.status || "planned");
  const [startedDate, setStartedDate] = useState(currentStatus?.started_date || "");
  const [completedDate, setCompletedDate] = useState(currentStatus?.completed_date || format(new Date(), "yyyy-MM-dd"));
  const [showCompassPrompt, setShowCompassPrompt] = useState(false);

  // When status changes to started/completed, show compass prompt
  const prevStatus = currentStatus?.status || "planned";

  function handleSave() {
    const isNewStarted = status === "started" && prevStatus !== "started";
    const isNewCompleted = status === "completed" && prevStatus !== "completed";
    if (isNewStarted || isNewCompleted) {
      setShowCompassPrompt(true);
    } else {
      onSave({ startDate, endDate, notes, status, startedDate, completedDate });
    }
  }

  function confirmSave() {
    setShowCompassPrompt(false);
    onSave({ startDate, endDate, notes, status, startedDate, completedDate });
  }

  return (
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Planned Start</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="text-xs h-8" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />Planned End</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="text-xs h-8" />
        </div>
      </div>

      {/* Status selector */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Item Status</Label>
        <div className="flex gap-2">
          {["planned", "started", "completed"].map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all capitalize
                ${status === s
                  ? s === "completed" ? "bg-green-600 text-white border-green-600"
                  : s === "started" ? "bg-blue-600 text-white border-blue-600"
                  : "bg-slate-700 text-white border-slate-700"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
            >
              {s === "completed" && <CheckCircle2 className="w-3 h-3" />}
              {s === "started" && <Play className="w-3 h-3" />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Started date */}
      {status === "started" && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-blue-700">Actual Start Date</Label>
          <Input type="date" value={startedDate} onChange={e => setStartedDate(e.target.value)} className="text-xs h-8 border-blue-300" />
        </div>
      )}

      {/* Completed date */}
      {status === "completed" && (
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-green-700">Completion Date</Label>
          <Input type="date" value={completedDate} onChange={e => setCompletedDate(e.target.value)} className="text-xs h-8 border-green-300" />
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

      {!showCompassPrompt && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs h-8">
            <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="text-xs h-8">Cancel</Button>
        </div>
      )}
    </div>
  );
}