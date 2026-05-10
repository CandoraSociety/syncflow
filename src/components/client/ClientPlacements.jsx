import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INTERNAL_PLACEMENTS = [
  { value: "none", label: "None" },
  { value: "cleaning_arc", label: "Cleaning Services (ARC)" },
  { value: "food_services_onsite", label: "Food Services (Onsite only)" },
  { value: "food_services_offsite", label: "Food Services (Offsite availability)" },
  { value: "reception", label: "Reception" },
  { value: "childcare", label: "Childcare" },
];

export default function ClientPlacements({ client, onSave }) {
  const [form, setForm] = useState({
    exposure_course: client?.exposure_course || false,
    paid_external_placement: client?.paid_external_placement || false,
    employment_supports: client?.employment_supports || false,
    internal_placement: client?.internal_placement || "none",
    internal_placement_details: client?.internal_placement_details || "",
    external_employer: client?.external_employer || "",
  });
  const [saving, setSaving] = useState(false);
  const [prevPlacement, setPrevPlacement] = useState(client?.internal_placement || "none");

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handlePlacementChange = async (value) => {
    set("internal_placement", value);
    if (value && value !== "none" && value !== prevPlacement) {
      setPrevPlacement(value);
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "internal_placement",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        placement: value,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const placementLabel = INTERNAL_PLACEMENTS.find(p => p.value === form.internal_placement)?.label || "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Internal Placement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Placement Type</Label>
            <Select value={form.internal_placement} onValueChange={handlePlacementChange}>
              <SelectTrigger><SelectValue placeholder="Select placement" /></SelectTrigger>
              <SelectContent>
                {INTERNAL_PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {form.internal_placement && form.internal_placement !== "none" && (
            <>
              <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                Staff responsible for <strong>{placementLabel}</strong> will be automatically notified by email.
              </p>
              <div className="space-y-1">
                <Label>Placement Details</Label>
                <Textarea
                  rows={4}
                  value={form.internal_placement_details}
                  onChange={e => set("internal_placement_details", e.target.value)}
                  placeholder="Job description, expected skills to be developed, schedule, supervisor, other details..."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">External Employer / Placement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>External Employer</Label>
            <Input
              value={form.external_employer}
              onChange={e => set("external_employer", e.target.value)}
              placeholder="Type employer name (existing ones will be suggested)..."
            />
            <p className="text-xs text-slate-400">Enter employer name — previously used names will be suggested as you type in the future.</p>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.paid_external_placement} onCheckedChange={v => set("paid_external_placement", v)} />
            <Label>Paid external placement</Label>
          </div>
          {form.paid_external_placement && (
            <p className="text-xs text-slate-500 italic">Financial details for this placement can be recorded in the <strong>Financials</strong> tab.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Other Supports</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={form.exposure_course} onCheckedChange={v => set("exposure_course", v)} />
            <Label>Client attended exposure course</Label>
          </div>
          {form.exposure_course && (
            <p className="text-xs text-slate-500 italic">Financial/receipt details for exposure courses can be recorded in the <strong>Financials</strong> tab.</p>
          )}
          <div className="flex items-center gap-3">
            <Switch checked={form.employment_supports} onCheckedChange={v => set("employment_supports", v)} />
            <Label>Client received employment supports (PPE, tools, etc.)</Label>
          </div>
          {form.employment_supports && (
            <p className="text-xs text-slate-500 italic">Financial details for employment supports can be recorded in the <strong>Financials</strong> tab.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}