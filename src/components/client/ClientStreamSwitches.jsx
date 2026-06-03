import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, ArrowRight, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";
import { createCompassTask, taskStreamSwitch } from "@/lib/compassTasks";

const STREAMS = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
  { value: "not_eligible", label: "Not Eligible" },
];

const SWITCH_REASONS = [
  { value: "client_request", label: "Client Request" },
  { value: "program_fit", label: "Better Program Fit / Reassessment" },
  { value: "employer_readiness", label: "Employer Readiness" },
  { value: "language_barrier", label: "Language Barrier" },
  { value: "credential_recognition", label: "Credential Recognition Issue" },
  { value: "skills_gap", label: "Skills Gap Identified" },
  { value: "employment_found", label: "Employment Found" },
  { value: "scheduling_conflict", label: "Scheduling Conflict" },
  { value: "personal_circumstances", label: "Personal Circumstances" },
  { value: "program_completion", label: "Program Completion / Progression" },
  { value: "staff_recommendation", label: "Staff Recommendation" },
  { value: "funding_change", label: "Funding / Eligibility Change" },
  { value: "other", label: "Other" },
];

const STREAM_LABEL = Object.fromEntries(STREAMS.map(s => [s.value, s.label]));

const emptySwitch = (currentStream = "") => ({
  from_stream: currentStream,
  to_stream: "",
  reason: "",
  reason_other: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
});

export default function ClientStreamSwitches({ client, onSave }) {
  const switches = client.program_stream_switches || [];
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptySwitch(client.service_type));
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.from_stream || !form.to_stream || !form.reason) return;
    setSaving(true);
    const newSwitch = { ...form };
    if (form.reason !== "other") newSwitch.reason_other = "";
    const updated = [...switches, newSwitch];

    // Save stream switch + update service_type
    await onSave({ program_stream_switches: updated, service_type: form.to_stream });

    // Auto-log to StatusChange history
    try {
      let me = null;
      try { me = await base44.auth.me(); } catch (_) {}
      await base44.entities.StatusChange.create({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        change_type: "stream_switch",
        change_date: form.date,
        from_value: STREAM_LABEL[form.from_stream] || form.from_stream,
        to_value: STREAM_LABEL[form.to_stream] || form.to_stream,
        notes: [
          SWITCH_REASONS.find(r => r.value === form.reason)?.label || form.reason,
          form.reason === "other" && form.reason_other ? form.reason_other : "",
          form.notes,
        ].filter(Boolean).join(" — "),
        logged_by: me?.email || "",
        logged_by_name: me?.full_name || me?.email || "",
        billing_relevant: true,
      });
    } catch (_) {}

    // Create Compass task
    const t = taskStreamSwitch(client, form.from_stream, form.to_stream,
      form.reason === "other" ? (form.reason_other || "Other") : (SWITCH_REASONS.find(r => r.value === form.reason)?.label || form.reason));
    await createCompassTask({
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      compass_hsid: client.compass_hsid,
      ...t,
    });

    setAdding(false);
    setForm(emptySwitch());
    setSaving(false);
  };

  const handleDelete = async (idx) => {
    const updated = switches.filter((_, i) => i !== idx);
    await onSave({ program_stream_switches: updated });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Program Stream Switch History</CardTitle>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)} className="gap-1">
              <PlusCircle className="w-4 h-4" /> Switch Program Stream
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {switches.length === 0 && !adding && (
            <p className="text-sm text-slate-400 italic">No stream switches recorded.</p>
          )}

          {/* Existing switches */}
          {switches.length > 0 && (
            <div className="space-y-3 mb-4">
              {switches.map((sw, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-slate-700">{STREAM_LABEL[sw.from_stream] || sw.from_stream}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="font-medium text-sm text-blue-700">{STREAM_LABEL[sw.to_stream] || sw.to_stream}</span>
                      {sw.date && (
                        <span className="text-xs text-slate-400 ml-auto">
                          {format(new Date(sw.date), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      <span className="font-medium">Reason:</span>{" "}
                      {SWITCH_REASONS.find(r => r.value === sw.reason)?.label || sw.reason}
                      {sw.reason === "other" && sw.reason_other ? ` — ${sw.reason_other}` : ""}
                    </p>
                    {sw.notes && <p className="text-xs text-slate-500 mt-0.5"><span className="font-medium">Notes:</span> {sw.notes}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                    onClick={() => handleDelete(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new switch form */}
          {adding && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50 space-y-4">
              <p className="text-sm font-semibold text-blue-800">Record a Program Stream Switch</p>
              <p className="text-xs text-blue-600">Note: the client's current stream will be updated to the "To" stream automatically.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1 block">From Stream (current)</Label>
                  <div className="h-9 text-sm border border-slate-200 rounded-md px-3 flex items-center bg-slate-50 text-slate-700 font-medium">
                    {STREAM_LABEL[client.service_type] || client.service_type || "Not set"}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">To Stream</Label>
                  <Select value={form.to_stream} onValueChange={v => setForm(f => ({ ...f, to_stream: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select stream..." /></SelectTrigger>
                    <SelectContent>
                      {STREAMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium mb-1 block">Reason for Switch</Label>
                  <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                    <SelectContent>
                      {SWITCH_REASONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium mb-1 block">Date of Switch</Label>
                  <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>

              {form.reason === "other" && (
                <div>
                  <Label className="text-xs font-medium mb-1 block">Please specify</Label>
                  <Input
                    placeholder="Describe the reason..."
                    value={form.reason_other}
                    onChange={e => setForm(f => ({ ...f, reason_other: e.target.value }))}
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-medium mb-1 block">Additional Notes (optional)</Label>
                <Textarea
                  placeholder="Any additional context..."
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setAdding(false); setForm(emptySwitch(client.service_type)); }}>Cancel</Button>
                <Button
                  size="sm"
                  onClick={handleAdd}
                  disabled={!form.from_stream || !form.to_stream || !form.reason || saving}
                >
                  {saving ? "Saving..." : "Save Switch"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}