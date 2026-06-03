import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, ChevronRight, AlertCircle } from "lucide-react";

export default function BarrierActionPlan({ client, onSave, onComplete }) {
  const barriersIdentified = client?.barriers_addressed;

  const parseSteps = (raw) => {
    if (!raw) return [""];
    const lines = raw.split("\n").map(l => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean);
    return lines.length > 0 ? lines : [""];
  };

  const getInitialPlans = () => {
    const plans = [];
    for (let n = 1; n <= 3; n++) {
      if (client?.[`barrier_${n}`]) {
        plans.push({
          barrier: client[`barrier_${n}`] === "Other"
            ? (client[`barrier_${n}_other`] || "Other")
            : client[`barrier_${n}`],
          action_steps: parseSteps(client[`barrier_${n}_action_steps`]),
          timeline_start: client[`barrier_${n}_timeline_start`] || "",
          timeline_end: client[`barrier_${n}_timeline_end`] || "",
          responsible_party: client[`barrier_${n}_responsible`] || "",
          resources_needed: client[`barrier_${n}_resources`] || "",
        });
      }
    }
    return plans;
  };

  const [plans, setPlans] = useState(getInitialPlans());
  const [saving, setSaving] = useState(false);

  const updatePlan = (i, field, val) => setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const addStep = (i) => setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, action_steps: [...p.action_steps, ""] } : p));
  const removeStep = (i, si) => setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, action_steps: p.action_steps.filter((_, sidx) => sidx !== si) } : p));
  const updateStep = (i, si, val) => setPlans(prev => prev.map((p, idx) => idx === i ? { ...p, action_steps: p.action_steps.map((s, sidx) => sidx === si ? val : s) } : p));

  const buildSaveData = () => {
    const data = { barrier_action_plan_completed: true };
    for (let n = 1; n <= 3; n++) {
      const p = plans[n - 1];
      if (p) {
        data[`barrier_${n}_action_steps`] = p.action_steps.filter(Boolean).join("\n");
        data[`barrier_${n}_timeline_start`] = p.timeline_start;
        data[`barrier_${n}_timeline_end`] = p.timeline_end;
        data[`barrier_${n}_responsible`] = p.responsible_party;
        data[`barrier_${n}_resources`] = p.resources_needed;
      }
    }
    return data;
  };

  const handleSave = async (andContinue = false) => {
    setSaving(true);
    await onSave(buildSaveData());
    setSaving(false);
    if (andContinue) onComplete?.();
  };

  if (!barriersIdentified) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 2 — Barrier Resolution Plan</h2>
          <p className="text-sm text-slate-500 mt-1">Action plans for each identified barrier.</p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No barriers have been identified.</p>
          <p className="text-slate-400 text-sm mt-1">Return to Step 1 to identify barriers if applicable.</p>
          <Button className="mt-4 gap-2" onClick={async () => { await onSave({ barrier_action_plan_completed: true }); onComplete?.(); }}>
            Skip to Next Step <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 2 — Barrier Resolution Plan</h2>
          <p className="text-sm text-slate-500 mt-1">Please complete the BIT first to identify barriers.</p>
        </div>
        <Button className="gap-2" onClick={async () => { await onSave({ barrier_action_plan_completed: true }); onComplete?.(); }}>
          Continue <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Step 2 — Barrier Resolution Plan</h2>
        <p className="text-sm text-slate-500 mt-1">For each identified barrier, create a concrete resolution plan with timelines.</p>
      </div>

      {plans.map((plan, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base text-slate-700">
              Barrier #{i + 1}: {plan.barrier}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Action Steps to Address This Barrier</Label>
              {plan.action_steps.map((step, si) => (
                <div key={si} className="flex items-start gap-2">
                  <span className="mt-2 text-xs font-semibold text-slate-400 w-5 shrink-0">{si + 1}.</span>
                  <Input
                    value={step}
                    onChange={e => updateStep(i, si, e.target.value)}
                    placeholder={`Action step ${si + 1}...`}
                  />
                  {plan.action_steps.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-400 hover:text-red-600" onClick={() => removeStep(i, si)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1 mt-1" onClick={() => addStep(i)}>
                <Plus className="w-3 h-3" /> Add Step
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date</Label>
                <Input type="date" value={plan.timeline_start} onChange={e => updatePlan(i, "timeline_start", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Target Completion Date</Label>
                <Input type="date" value={plan.timeline_end} onChange={e => updatePlan(i, "timeline_end", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Responsible Party</Label>
                <Input
                  value={plan.responsible_party}
                  onChange={e => updatePlan(i, "responsible_party", e.target.value)}
                  placeholder="e.g. Client, Career Counsellor, Service Navigator..."
                />
              </div>
              <div className="space-y-1">
                <Label>Resources / Referrals Needed</Label>
                <Input
                  value={plan.resources_needed}
                  onChange={e => updatePlan(i, "resources_needed", e.target.value)}
                  placeholder="e.g. Referral to mental health services..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
          <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
        </Button>
        <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
          {saving ? "Saving…" : "Save & Continue"} <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}