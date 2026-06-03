import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, Save, ChevronRight, AlertTriangle, Pencil, CheckCircle2 } from "lucide-react";

import { base44 } from "@/api/base44Client";
import { createCompassTask, taskBarriersIdentified } from "@/lib/compassTasks";

const BARRIER_OPTIONS = [
  "Transportation", "Childcare", "Language / Communication", "Mental Health",
  "Housing Instability", "Domestic Violence", "Legal Issues", "Financial Barriers",
  "Lack of Canadian Work Experience", "Credential Recognition", "Digital Literacy",
  "Health / Disability", "Cultural / Social Adjustment", "Trauma / PTSD", "Substance Use", "Other",
];

const BARRIER_STATUSES = [
  { value: "unresolved", label: "Unresolved" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

const emptyBarrier = () => ({ type: "", other_description: "", status: "unresolved", notes: "" });

const STATUS_COLORS = { unresolved: "text-red-600", in_progress: "text-amber-600", resolved: "text-green-600" };

export default function BarrierIdentificationTool({ client, onSave, onComplete }) {
  const isCompleted = !!client?.bit_completed;

  const initialBarriers = (() => {
    const list = [];
    for (let n = 1; n <= 3; n++) {
      if (client?.[`barrier_${n}`]) {
        list.push({
          type: client[`barrier_${n}`],
          other_description: client[`barrier_${n}_other`] || "",
          status: client[`barrier_${n}_status`] || "unresolved",
          notes: client[`barrier_${n}_notes`] || "",
        });
      }
    }
    return list.length > 0 ? list : [emptyBarrier()];
  })();

  const [submitted, setSubmitted] = useState(isCompleted);
  const [editing, setEditing] = useState(!isCompleted);
  const [barriersIdentified, setBarriersIdentified] = useState(client?.barriers_addressed || false);
  const [barriers, setBarriers] = useState(initialBarriers);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const hasBarrierData = barriers.some(b => b.type);

  const handleToggle = (val) => {
    if (!val && hasBarrierData && barriersIdentified) { setConfirmClear(true); return; }
    setBarriersIdentified(val);
    if (!val) setBarriers([emptyBarrier()]);
  };

  const confirmNo = () => { setBarriersIdentified(false); setBarriers([emptyBarrier()]); setConfirmClear(false); };

  const addBarrier = () => setBarriers(prev => [...prev, emptyBarrier()]);
  const removeBarrier = (i) => setBarriers(prev => prev.filter((_, idx) => idx !== i));
  const updateBarrier = (i, field, val) => setBarriers(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

  const buildSaveData = () => {
    const data = { barriers_addressed: barriersIdentified, bit_completed: true };
    for (let n = 1; n <= 3; n++) {
      const b = barriers[n - 1];
      data[`barrier_${n}`] = b?.type || "";
      data[`barrier_${n}_status`] = b?.status || "unresolved";
      data[`barrier_${n}_other`] = b?.other_description || "";
      data[`barrier_${n}_notes`] = b?.notes || "";
    }
    return data;
  };

  const handleSave = async (andContinue = false) => {
    setSaving(true);
    const data = buildSaveData();
    await onSave(data);
    if (barriersIdentified && !client?.barriers_addressed) {
      const updatedClient = { ...client, ...data };
      const t = taskBarriersIdentified(updatedClient);
      await createCompassTask({ client_id: client.id, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, assigned_worker: client.assigned_worker, assigned_worker_name: client.assigned_worker_name, ...t });
      base44.functions.invoke("sendAlertEmail", {
        alert_type: "barriers",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        barriers: barriers.map(b => b.type === "Other" ? b.other_description || "Other" : b.type).filter(Boolean),
      }).catch(() => {});
    }
    setSaving(false);
    setSubmitted(true);
    setEditing(false);
    if (andContinue) onComplete?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 1 — Barrier Identification Tool (BIT)</h2>
          <p className="text-sm text-slate-500 mt-1">Identify any barriers that may affect the client's ability to achieve employment.</p>
        </div>
        {submitted && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      {/* Read-only summary */}
      {submitted && !editing && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <CardTitle className="text-base">BIT Completed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Barriers identified:</span>
              <span className="text-sm font-semibold">{barriersIdentified ? "Yes" : "No"}</span>
            </div>
            {barriersIdentified && barriers.filter(b => b.type).map((b, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">
                    {b.type === "Other" ? (b.other_description || "Other") : b.type}
                  </span>
                  <span className={`text-xs font-semibold ${STATUS_COLORS[b.status] || ""}`}>
                    {BARRIER_STATUSES.find(s => s.value === b.status)?.label}
                  </span>
                </div>
                {b.notes && <p className="text-xs text-slate-500">{b.notes}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Edit view */}
      {editing && (
        <>
          {confirmClear && (
            <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-md mx-4">
                <div className="flex items-center gap-3 mb-3">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <h3 className="font-bold text-slate-800">Are you sure?</h3>
                </div>
                <p className="text-sm text-slate-600 mb-4">Selecting "No" will clear all barrier information. This cannot be undone.</p>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setConfirmClear(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmNo}>Yes, Clear Barriers</Button>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Have barriers been identified?</span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${!barriersIdentified ? "text-slate-700" : "text-slate-400"}`}>No</span>
                  <Switch checked={barriersIdentified} onCheckedChange={handleToggle} />
                  <span className={`text-sm font-medium ${barriersIdentified ? "text-slate-700" : "text-slate-400"}`}>Yes</span>
                </div>
              </CardTitle>
            </CardHeader>
            {barriersIdentified && (
              <CardContent className="space-y-4">
                <p className="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded px-3 py-2">
                  Service navigator will be automatically notified when barriers are saved.
                </p>
                {barriers.map((barrier, i) => (
                  <div key={i} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-700 text-sm">Barrier #{i + 1}</h4>
                      {barriers.length > 1 && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => removeBarrier(i)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Barrier Type</Label>
                        <Select value={barrier.type} onValueChange={v => updateBarrier(i, "type", v)}>
                          <SelectTrigger><SelectValue placeholder="Select barrier" /></SelectTrigger>
                          <SelectContent>
                            {BARRIER_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select value={barrier.status} onValueChange={v => updateBarrier(i, "status", v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BARRIER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {barrier.type === "Other" && (
                      <div className="space-y-1">
                        <Label>Please describe the barrier</Label>
                        <Input value={barrier.other_description} onChange={e => updateBarrier(i, "other_description", e.target.value)} placeholder="Describe the barrier..." />
                      </div>
                    )}
                    <div className="space-y-1">
                      <Label>Notes</Label>
                      <Textarea rows={2} value={barrier.notes} onChange={e => updateBarrier(i, "notes", e.target.value)} placeholder="Additional context about this barrier..." />
                    </div>
                  </div>
                ))}
                {barriers.length < 6 && (
                  <Button variant="outline" size="sm" onClick={addBarrier} className="gap-2">
                    <Plus className="w-4 h-4" /> Add Another Barrier
                  </Button>
                )}
              </CardContent>
            )}
          </Card>

          <div className="flex items-center justify-between">
            {submitted && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                {saving ? "Saving…" : submitted ? "Save & Continue" : "Finish & Continue"} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {submitted && !editing && (
        <div className="flex justify-end">
          <Button onClick={onComplete} className="gap-2">
            Continue to Next Step <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}