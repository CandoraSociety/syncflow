import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { addDays, format, differenceInDays } from "date-fns";
import { Plus, CheckCircle2, Clock, AlertCircle, Briefcase } from "lucide-react";

const EDA_TYPES = [
  "Workshop",
  "Exposure Course",
  "Employment Supports",
  "Job Club",
  "Job Fair",
  "Employer Information Session",
  "Resume / Cover Letter Assistance",
  "Interview Preparation",
  "Networking Event",
  "Labour Market Information Session",
  "Mentorship / Job Shadow",
  "Other",
];

function deaProgramEndDate(client) {
  if (!client?.service_start_date) return null;
  return addDays(new Date(client.service_start_date), 14);
}

export default function DEAFlowPanel({ client, onSave }) {
  const activities = client?.dea_activities || [];
  const endDate = deaProgramEndDate(client);
  const daysLeft = endDate ? differenceInDays(endDate, new Date()) : null;

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    type: "",
    description: "",
    completed: true,
  });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.type) return;
    setSaving(true);
    const me = await base44.auth.me();
    const newActivity = {
      id: Date.now().toString(),
      date: form.date,
      type: form.type,
      description: form.description.trim(),
      completed: form.completed,
      logged_by: me?.email || "",
      logged_by_name: me?.full_name || "",
    };

    const updatedActivities = [...activities, newActivity];

    // Also auto-set completion_date if not already set
    const updates = { dea_activities: updatedActivities };
    if (!client?.completion_date && client?.service_start_date) {
      updates.completion_date = format(deaProgramEndDate(client), "yyyy-MM-dd");
    }

    await onSave(updates);
    setForm({ date: format(new Date(), "yyyy-MM-dd"), type: "", description: "", completed: true });
    setAdding(false);
    setSaving(false);
  };

  const completedCount = activities.filter(a => a.completed).length;
  const requiredCount = 3;
  const meetsRequirement = completedCount >= requiredCount;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" /> DEA Employment Development Activities
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          DEA clients must complete <strong>3 Employment Development Activities</strong> within 2 weeks of their program start date.
        </p>
      </div>

      {/* Program period banner */}
      <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3 ${
        !client?.service_start_date
          ? "bg-slate-50 border-slate-200"
          : daysLeft !== null && daysLeft <= 3 && daysLeft >= 0
          ? "bg-red-50 border-red-300"
          : daysLeft !== null && daysLeft < 0
          ? "bg-rose-50 border-rose-300"
          : "bg-blue-50 border-blue-200"
      }`}>
        {!client?.service_start_date ? (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>No program start date set. Please set a <strong>Service Start Date</strong> in Client Overview to activate the DEA timeline.</span>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-0.5 text-sm">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-slate-600">
                  <strong>Program Start:</strong> {format(new Date(client.service_start_date), "MMM d, yyyy")}
                </span>
                {endDate && (
                  <span className="text-slate-600">
                    <strong>Program End:</strong> {format(endDate, "MMM d, yyyy")}
                  </span>
                )}
              </div>
            </div>
            <div className={`text-sm font-semibold px-3 py-1.5 rounded-full ${
              daysLeft !== null && daysLeft < 0
                ? "bg-rose-100 text-rose-700"
                : daysLeft !== null && daysLeft <= 3
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}>
              {daysLeft !== null && daysLeft < 0
                ? `${Math.abs(daysLeft)} days past end`
                : daysLeft === 0
                ? "Last day today!"
                : daysLeft !== null
                ? `${daysLeft} days remaining`
                : ""}
            </div>
          </>
        )}
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium ${
          meetsRequirement ? "bg-green-50 border-green-300 text-green-700" : "bg-amber-50 border-amber-300 text-amber-700"
        }`}>
          {meetsRequirement
            ? <CheckCircle2 className="w-4 h-4" />
            : <Clock className="w-4 h-4" />
          }
          {completedCount} / {requiredCount} activities completed
          {meetsRequirement && " ✓ Requirement met"}
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5 ml-auto">
          <Plus className="w-4 h-4" /> Log Activity
        </Button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">New Employment Development Activity</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs mb-1 block">Date</Label>
              <Input
                type="date"
                className="h-8 text-sm"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Activity Type *</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  {EDA_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Description / Notes</Label>
            <Textarea
              className="text-sm"
              rows={2}
              placeholder="Details about the activity..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
            <Checkbox
              checked={form.completed}
              onCheckedChange={v => setForm(f => ({ ...f, completed: !!v }))}
            />
            Mark as completed
          </label>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !form.type}>
              {saving ? "Saving…" : "Save Activity"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Activity list */}
      {activities.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-14 text-slate-400 text-center">
          <Briefcase className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No activities logged yet</p>
          <p className="text-sm mt-1">Click "Log Activity" to record the first EDA activity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {[...activities].sort((a, b) => b.date.localeCompare(a.date)).map(act => (
            <div key={act.id} className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${act.completed ? "bg-green-50 border-green-200" : "bg-white border-slate-200"}`}>
              <div className="mt-0.5">
                {act.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                  : <Clock className="w-4 h-4 text-slate-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{act.type}</span>
                  <span className="text-xs text-slate-400">{act.date ? format(new Date(act.date), "MMM d, yyyy") : ""}</span>
                  {act.logged_by_name && <span className="text-xs text-slate-400">· {act.logged_by_name}</span>}
                </div>
                {act.description && (
                  <p className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{act.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}