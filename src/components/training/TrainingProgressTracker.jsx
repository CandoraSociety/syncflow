import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

const MILESTONES = [
  { key: "orientation", label: "Orientation / Induction", dateKey: "orientation_date" },
  { key: "health_safety", label: "Health & Safety Training", dateKey: "health_safety_date" },
  { key: "midpoint_checkin", label: "Mid-Point Check-In", dateKey: "midpoint_checkin_date" },
  { key: "program_completion", label: "Program / Training Completed", dateKey: "program_completion_date" },
];

const STATUS_OPTIONS = [
  { value: "referred", label: "Referred" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "cancelled", label: "Cancelled" },
];

export default function TrainingProgressTracker({ training, onSaved, readOnly = false }) {
  const [form, setForm] = useState({
    status: training.status || "referred",
    start_date: training.start_date || "",
    actual_end_date: training.actual_end_date || "",
    orientation_completed: training.orientation_completed || false,
    orientation_date: training.orientation_date || "",
    health_safety_completed: training.health_safety_completed || false,
    health_safety_date: training.health_safety_date || "",
    midpoint_checkin_completed: training.midpoint_checkin_completed || false,
    midpoint_checkin_date: training.midpoint_checkin_date || "",
    program_completion_completed: training.program_completion_completed || false,
    program_completion_date: training.program_completion_date || "",
    supervisor_notes: training.supervisor_notes || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.InternalTraining.update(training.id, form);
    setSaving(false);
    onSaved(form);
    // Notify the assigned counsellor
    if (training.assigned_worker) {
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "training_progress_update",
        client_name: training.client_name,
        client_id: training.client_id,
        placement: training.placement_type,
        updated_by: "supervisor",
        to_email: training.assigned_worker,
      });
    }
  };

  const completedCount = MILESTONES.filter(m => form[`${m.key}_completed`]).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base">Progress Tracking</CardTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">{completedCount}/{MILESTONES.length} milestones</span>
            <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(completedCount / MILESTONES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Training Status</Label>
            {readOnly ? (
              <p className="text-sm font-medium text-slate-700 capitalize">{form.status}</p>
            ) : (
              <Select value={form.status} onValueChange={v => set("status", v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Actual Start Date</Label>
            {readOnly
              ? <p className="text-sm text-slate-700">{form.start_date || "—"}</p>
              : <Input type="date" className="h-8 text-sm" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
            }
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Actual End Date</Label>
            {readOnly
              ? <p className="text-sm text-slate-700">{form.actual_end_date || "—"}</p>
              : <Input type="date" className="h-8 text-sm" value={form.actual_end_date} onChange={e => set("actual_end_date", e.target.value)} />
            }
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Milestones</p>
          {MILESTONES.map(m => (
            <div key={m.key} className={`flex items-center gap-3 p-3 rounded-lg border ${form[`${m.key}_completed`] ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
              {readOnly ? (
                <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${form[`${m.key}_completed`] ? "border-green-500 bg-green-500" : "border-slate-300"}`}>
                  {form[`${m.key}_completed`] && <span className="text-white text-xs leading-none">✓</span>}
                </span>
              ) : (
                <Switch
                  checked={!!form[`${m.key}_completed`]}
                  onCheckedChange={v => {
                    set(`${m.key}_completed`, v);
                    if (v && !form[m.dateKey]) set(m.dateKey, new Date().toISOString().split("T")[0]);
                  }}
                />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${form[`${m.key}_completed`] ? "text-green-800" : "text-slate-700"}`}>
                  {m.label}
                </p>
              </div>
              {(form[`${m.key}_completed`] || !readOnly) && (
                <div className="shrink-0 w-36">
                  {readOnly ? (
                    <span className="text-xs text-slate-500">{form[m.dateKey] || ""}</span>
                  ) : (
                    <Input
                      type="date"
                      className="h-7 text-xs"
                      value={form[m.dateKey] || ""}
                      onChange={e => set(m.dateKey, e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Supervisor Notes / Progress Log</Label>
          {readOnly ? (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{form.supervisor_notes || "No notes recorded."}</p>
          ) : (
            <Textarea
              rows={4}
              value={form.supervisor_notes}
              onChange={e => set("supervisor_notes", e.target.value)}
              placeholder="Record ongoing observations, incidents, progress notes..."
            />
          )}
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Progress"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}