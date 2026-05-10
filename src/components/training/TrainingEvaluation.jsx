import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ClipboardCheck } from "lucide-react";
import { EVAL_OPTIONS, WOULD_HIRE_OPTIONS } from "./PLACEMENT_CONFIG";

const RATING_FIELDS = [
  { key: "evaluation_reliability", label: "Reliability & Punctuality" },
  { key: "evaluation_attitude", label: "Attitude & Professionalism" },
  { key: "evaluation_skill_development", label: "Skill Development" },
  { key: "evaluation_teamwork", label: "Teamwork & Collaboration" },
  { key: "evaluation_communication", label: "Communication" },
];

const RATING_COLORS = {
  excellent: "text-green-700 bg-green-50 border-green-200",
  good: "text-blue-700 bg-blue-50 border-blue-200",
  satisfactory: "text-slate-700 bg-slate-50 border-slate-200",
  needs_improvement: "text-amber-700 bg-amber-50 border-amber-200",
  unsatisfactory: "text-red-700 bg-red-50 border-red-200",
};

function RatingBadge({ value }) {
  if (!value) return <span className="text-slate-400 text-xs">—</span>;
  const label = EVAL_OPTIONS.find(o => o.value === value)?.label || value;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${RATING_COLORS[value] || ""}`}>
      {label}
    </span>
  );
}

export default function TrainingEvaluation({ training, onSaved, readOnly = false }) {
  const [form, setForm] = useState({
    evaluation_completed: training.evaluation_completed || false,
    evaluation_date: training.evaluation_date || "",
    evaluation_reliability: training.evaluation_reliability || "",
    evaluation_attitude: training.evaluation_attitude || "",
    evaluation_skill_development: training.evaluation_skill_development || "",
    evaluation_teamwork: training.evaluation_teamwork || "",
    evaluation_communication: training.evaluation_communication || "",
    evaluation_would_hire: training.evaluation_would_hire || "",
    evaluation_strengths: training.evaluation_strengths || "",
    evaluation_areas_for_growth: training.evaluation_areas_for_growth || "",
    evaluation_overall_comments: training.evaluation_overall_comments || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    const patch = { ...form, evaluation_completed: true, evaluation_date: form.evaluation_date || new Date().toISOString().split("T")[0] };
    await base44.entities.InternalTraining.update(training.id, patch);
    setSaving(false);
    onSaved(patch);
    // Notify counsellor that evaluation is done
    if (training.assigned_worker) {
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "training_evaluation_completed",
        client_name: training.client_name,
        client_id: training.client_id,
        placement: training.placement_type,
        to_email: training.assigned_worker,
      });
    }
  };

  if (readOnly && !training.evaluation_completed) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-400">
          <ClipboardCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Evaluation has not been completed yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" /> Final Evaluation
          </CardTitle>
          {training.evaluation_completed && (
            <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
              Completed {training.evaluation_date || ""}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!readOnly && (
          <div className="space-y-1 max-w-xs">
            <Label className="text-xs">Evaluation Date</Label>
            <Input
              type="date"
              className="h-8 text-sm"
              value={form.evaluation_date}
              onChange={e => set("evaluation_date", e.target.value)}
            />
          </div>
        )}

        {/* Rating scales */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Performance Ratings</p>
          {RATING_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-4 flex-wrap">
              <Label className="text-sm text-slate-700 min-w-40">{label}</Label>
              {readOnly ? (
                <RatingBadge value={training[key]} />
              ) : (
                <Select value={form[key]} onValueChange={v => set(key, v)}>
                  <SelectTrigger className="h-8 text-sm w-48">
                    <SelectValue placeholder="Select rating..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EVAL_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>

        {/* Would hire */}
        <div className="flex items-center justify-between gap-4 flex-wrap pt-2 border-t border-slate-100">
          <Label className="text-sm font-semibold text-slate-700">Would you hire / recommend this client?</Label>
          {readOnly ? (
            <RatingBadge value={training.evaluation_would_hire} />
          ) : (
            <Select value={form.evaluation_would_hire} onValueChange={v => set("evaluation_would_hire", v)}>
              <SelectTrigger className="h-8 text-sm w-52">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {WOULD_HIRE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Text fields */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Written Comments</p>
          {[
            { key: "evaluation_strengths", label: "Client Strengths" },
            { key: "evaluation_areas_for_growth", label: "Areas for Growth" },
            { key: "evaluation_overall_comments", label: "Overall Comments" },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              {readOnly ? (
                <p className="text-sm text-slate-600 whitespace-pre-wrap bg-slate-50 rounded p-2 min-h-8">
                  {training[key] || <span className="text-slate-400">—</span>}
                </p>
              ) : (
                <Textarea
                  rows={3}
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              )}
            </div>
          ))}
        </div>

        {!readOnly && (
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Submit Evaluation"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}