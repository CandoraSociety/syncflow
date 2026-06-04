import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, X, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

/**
 * Panel for logging a BIT review check-in.
 * checkin = { scheduled_date, completed, actual_date, notes }
 */
export default function BITReviewCheckinPanel({ reviewIndex, scheduledDate, checkin, clientId, onSave, onCancel, saving }) {
  const [completed, setCompleted] = useState(checkin?.completed || false);
  const [actualDate, setActualDate] = useState(checkin?.actual_date || scheduledDate || "");
  const [notes, setNotes] = useState(checkin?.notes || "");

  async function handleSave() {
    onSave({ completed, actual_date: actualDate, notes, scheduled_date: scheduledDate });
  }

  return (
    <div className="mt-2 mb-3 bg-white border-2 border-rose-200 rounded-xl p-4 shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-rose-600 font-bold text-sm">BIT Review {reviewIndex + 1}</span>
          {scheduledDate && (
            <span className="text-xs text-slate-500">Scheduled: {scheduledDate}</span>
          )}
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Completed toggle */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Check-in Status</Label>
        <div className="flex gap-3">
          <button
            onClick={() => setCompleted(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${!completed ? "bg-slate-700 text-white border-slate-700" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            <Clock className="w-3 h-3" /> Pending
          </button>
          <button
            onClick={() => setCompleted(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all
              ${completed ? "bg-green-600 text-white border-green-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            <CheckCircle2 className="w-3 h-3" /> Completed
          </button>
        </div>
      </div>

      {/* Actual date */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-600">
          {completed ? "Date Check-in Occurred" : "Scheduled Date"}
        </Label>
        <Input
          type="date"
          value={actualDate}
          onChange={e => setActualDate(e.target.value)}
          className="text-xs h-8"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-slate-600">Progress Notes</Label>
        <Textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes from this check-in — progress made, concerns, next steps…"
          className="text-xs min-h-[70px] resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs h-8">
          <Save className="w-3.5 h-3.5" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="text-xs h-8">Cancel</Button>
      </div>
    </div>
  );
}