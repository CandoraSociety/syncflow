import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";

export default function ExposuresSupportsStep({ client, onSave }) {
  const [form, setForm] = useState({
    exposure_course: client?.exposure_course || false,
    paid_external_placement: client?.paid_external_placement || false,
    employment_supports: client?.employment_supports || false,
    external_employer: client?.external_employer || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Step {client?.service_type === "pathways" ? "5" : "4"} — Exposure Courses, Placements & Supports</h2>
        <p className="text-sm text-slate-500 mt-1">Track exposure courses, paid placements, and employment support items.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Exposure Courses</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={form.exposure_course} onCheckedChange={v => set("exposure_course", v)} />
            <Label>Client attended an exposure course or training</Label>
          </div>
          {form.exposure_course && (
            <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Financial/receipt details for exposure courses can be recorded in the <strong>Financials</strong> section.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">External Employer / Paid Placement</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>External Employer Name</Label>
            <Input
              value={form.external_employer}
              onChange={e => set("external_employer", e.target.value)}
              placeholder="Employer name..."
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.paid_external_placement} onCheckedChange={v => set("paid_external_placement", v)} />
            <Label>Paid external placement</Label>
          </div>
          {form.paid_external_placement && (
            <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Financial details for this placement can be recorded in the <strong>Financials</strong> section.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Employment Supports</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Switch checked={form.employment_supports} onCheckedChange={v => set("employment_supports", v)} />
            <Label>Client received employment supports (PPE, tools, clothing, etc.)</Label>
          </div>
          {form.employment_supports && (
            <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-3 py-2">
              Financial details for employment supports can be recorded in the <strong>Financials</strong> section.
            </p>
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