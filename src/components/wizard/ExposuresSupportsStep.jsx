import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, CheckCircle2, Pencil } from "lucide-react";

export default function ExposuresSupportsStep({ client, onSave }) {
  const [submitted, setSubmitted] = useState(
    !!(client?.exposure_course || client?.employment_supports)
  );
  const [editing, setEditing] = useState(
    !(client?.exposure_course || client?.employment_supports)
  );
  const [form, setForm] = useState({
    exposure_course: client?.exposure_course || false,
    employment_supports: client?.employment_supports || false,
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async (finish = false) => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
    if (finish) {
      setSubmitted(true);
      setEditing(false);
    }
  };

  const stepNum = client?.service_type === "pathways" ? "5" : "4";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step {stepNum} — Exposure Courses & Supports</h2>
          <p className="text-sm text-slate-500 mt-1">Plan exposure courses and employment support items.</p>
        </div>
        {submitted && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      {submitted && !editing && (
        <>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border bg-green-50 border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <p className="text-sm font-semibold text-green-700">Program Flow Wizard Complete</p>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Planned Exposure Courses & Supports</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-700">
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.exposure_course ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                  {form.exposure_course && <span className="text-white text-xs font-bold">✓</span>}
                </span>
                <span className={form.exposure_course ? "font-medium" : "text-slate-400"}>Exposure Course / Training{form.exposure_course ? " — Planned" : " — Not planned"}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${form.employment_supports ? "bg-green-500 border-green-500" : "border-slate-300"}`}>
                  {form.employment_supports && <span className="text-white text-xs font-bold">✓</span>}
                </span>
                <span className={form.employment_supports ? "font-medium" : "text-slate-400"}>Employment Supports (PPE, tools, etc.){form.employment_supports ? " — Planned" : " — Not planned"}</span>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {editing && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Exposure Courses</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.exposure_course} onCheckedChange={v => set("exposure_course", v)} />
                <Label>Plan to attend an exposure course or training</Label>
              </div>
              {form.exposure_course && (
                <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-3 py-2">
                  Financial/receipt details for exposure courses can be recorded in the <strong>Financials</strong> section once confirmed.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Employment Supports</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={form.employment_supports} onCheckedChange={v => set("employment_supports", v)} />
                <Label>Employment supports planned (PPE, tools, clothing, etc.)</Label>
              </div>
              {form.employment_supports && (
                <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded px-3 py-2">
                  Financial details for employment supports can be recorded in the <strong>Financials</strong> section once confirmed.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between">
            {submitted && (
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving}>
                {saving ? "Saving…" : submitted ? "Save Changes" : "Finish"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}