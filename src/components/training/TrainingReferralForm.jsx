import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, X } from "lucide-react";
import {
  PLACEMENT_LABELS,
  TRANSPORTATION_OPTIONS,
  STANDARD_PLAN_ITEMS,
} from "./PLACEMENT_CONFIG";

const OFFSITE_PLACEMENTS = ["food_services_offsite", "cleaning_arc"];

export default function TrainingReferralForm({ client, onSaved, onCancel }) {
  const [form, setForm] = useState({
    placement_type: client?.internal_placement && client.internal_placement !== "none"
      ? client.internal_placement : "",
    referral_date: new Date().toISOString().split("T")[0],
    start_date: "",
    expected_end_date: "",
    transportation: client?.has_vehicle === "yes" ? "has_own_vehicle" : "",
    transportation_notes: "",
    training_goals: "",
    referral_notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const isOffsite = OFFSITE_PLACEMENTS.includes(form.placement_type);

  const handleSave = async () => {
    if (!form.placement_type) return alert("Please select a placement type.");
    if (!form.transportation) return alert("Please select a transportation option.");
    setSaving(true);

    // Build initial training plan from standard items — all marked as focus by default
    const templateItems = (STANDARD_PLAN_ITEMS[form.placement_type] || []).map(item => ({
      ...item,
      focus: true,
      completed: false,
      completed_date: "",
      notes: "",
    }));

    await base44.entities.InternalTraining.create({
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      assigned_worker: client.assigned_worker,
      assigned_worker_name: client.assigned_worker_name,
      status: "referred",
      training_plan_items: templateItems,
      ...form,
    });

    // Notify supervisor via existing alert function
    await base44.functions.invoke("sendAlertEmail", {
      alert_type: "training_referral",
      client_name: `${client.first_name} ${client.last_name}`,
      client_id: client.id,
      placement: form.placement_type,
    });

    setSaving(false);
    onSaved();
  };

  return (
    <Card className="border-blue-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-blue-800">New Internal Training Referral</CardTitle>
          {onCancel && <button onClick={onCancel}><X className="w-4 h-4 text-slate-400" /></button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Placement Type <span className="text-red-500">*</span></Label>
            <Select value={form.placement_type} onValueChange={v => set("placement_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select placement..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(PLACEMENT_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label>Referral Date</Label>
            <Input type="date" value={form.referral_date} onChange={e => set("referral_date", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Anticipated Start Date</Label>
            <Input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label>Expected End Date</Label>
            <Input type="date" value={form.expected_end_date} onChange={e => set("expected_end_date", e.target.value)} />
          </div>
        </div>

        {/* Transportation — always shown; emphasized for offsite */}
        <div className="space-y-1">
          <Label>
            Transportation <span className="text-red-500">*</span>
            {isOffsite && <span className="ml-2 text-xs text-amber-600 font-medium">(Offsite placement — transportation is important)</span>}
          </Label>
          <Select value={form.transportation} onValueChange={v => set("transportation", v)}>
            <SelectTrigger><SelectValue placeholder="Select transportation option..." /></SelectTrigger>
            <SelectContent>
              {TRANSPORTATION_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Transportation Notes <span className="text-slate-400 text-xs">(optional)</span></Label>
          <Input
            value={form.transportation_notes}
            onChange={e => set("transportation_notes", e.target.value)}
            placeholder="e.g. bus route confirmed, transit pass requested..."
          />
        </div>

        <div className="space-y-1">
          <Label>Individual Training Goals / Focus Areas</Label>
          <Textarea
            rows={3}
            value={form.training_goals}
            onChange={e => set("training_goals", e.target.value)}
            placeholder="Describe specific skill areas or goals for this client's training placement..."
          />
        </div>

        <div className="space-y-1">
          <Label>Referral Notes</Label>
          <Textarea
            rows={2}
            value={form.referral_notes}
            onChange={e => set("referral_notes", e.target.value)}
            placeholder="Any additional context for the supervisor..."
          />
        </div>

        {form.placement_type && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              Standard training plan for <strong>{PLACEMENT_LABELS[form.placement_type]}</strong> will be auto-generated.
              You can customize focus areas after saving.
            </p>
            <ul className="space-y-1">
              {(STANDARD_PLAN_ITEMS[form.placement_type] || []).map(item => (
                <li key={item.id} className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Create Referral"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}