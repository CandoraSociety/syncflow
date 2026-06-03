import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ChevronRight, Mail, CheckCircle2, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INTERNAL_PLACEMENTS = [
  { value: "cleaning_arc", label: "Cleaning Services (ARC)" },
  { value: "food_services_onsite", label: "Food Services (Onsite only)" },
  { value: "food_services_offsite", label: "Food Services (Offsite availability)" },
  { value: "reception", label: "Reception" },
  { value: "childcare", label: "Childcare" },
];

export default function InternalPlacementStep({ client, onSave, onComplete }) {
  const [form, setForm] = useState({
    internal_placement: client?.internal_placement || "",
    internal_placement_details: client?.internal_placement_details || "",
    placement_start_date: client?.placement_start_date || "",
    placement_end_date: client?.placement_end_date || "",
    placement_supervisor: client?.placement_supervisor || "",
    placement_schedule: client?.placement_schedule || "",
  });
  const [saving, setSaving] = useState(false);
  const [emailSent, setEmailSent] = useState(client?.placement_request_sent || false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [prevPlacement, setPrevPlacement] = useState(client?.internal_placement || "");

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleSave = async (andContinue = false) => {
    setSaving(true);
    await onSave({ ...form, placement_request_sent: emailSent });
    setSaving(false);
    if (andContinue) onComplete?.();
  };

  const handleSendRequest = async () => {
    setSendingEmail(true);
    await onSave({ ...form, placement_request_sent: false });
    await base44.functions.invoke("sendAlertEmail", {
      alert_type: "internal_placement",
      client_name: `${client.first_name} ${client.last_name}`,
      client_id: client.id,
      placement: form.internal_placement,
      details: form.internal_placement_details,
      start_date: form.placement_start_date,
      supervisor: form.placement_supervisor,
    });
    await onSave({ placement_request_sent: true });
    setEmailSent(true);
    setSendingEmail(false);
  };

  const placementLabel = INTERNAL_PLACEMENTS.find(p => p.value === form.internal_placement)?.label || "";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800">Step 4 — Internal Placement</h2>
        <p className="text-sm text-slate-500 mt-1">Set up and coordinate the client's internal placement (Pathways stream).</p>
      </div>

      {/* Placement request status — always visible */}
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${emailSent ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
        {emailSent
          ? <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          : <Clock className="w-5 h-5 text-amber-500 shrink-0" />
        }
        <div className="flex-1">
          <p className={`text-sm font-semibold ${emailSent ? "text-green-700" : "text-amber-700"}`}>
            {emailSent ? "Placement Request Sent" : "Placement Request Not Yet Sent"}
          </p>
          <p className={`text-xs ${emailSent ? "text-green-600" : "text-amber-600"}`}>
            {emailSent
              ? "The relevant supervisor has been notified of this placement request."
              : "Save placement details below, then click 'Send Placement Request' to notify the supervisor."
            }
          </p>
        </div>
        {!emailSent && form.internal_placement && (
          <Button size="sm" onClick={handleSendRequest} disabled={sendingEmail} className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shrink-0">
            <Mail className="w-4 h-4" />
            {sendingEmail ? "Sending…" : "Send Request"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Placement Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Placement Type</Label>
            <Select value={form.internal_placement} onValueChange={v => set("internal_placement", v)}>
              <SelectTrigger><SelectValue placeholder="Select placement type" /></SelectTrigger>
              <SelectContent>
                {INTERNAL_PLACEMENTS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {form.internal_placement && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Expected Start Date</Label>
                  <Input type="date" value={form.placement_start_date} onChange={e => set("placement_start_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Expected End Date</Label>
                  <Input type="date" value={form.placement_end_date} onChange={e => set("placement_end_date", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Supervisor</Label>
                  <Input value={form.placement_supervisor} onChange={e => set("placement_supervisor", e.target.value)} placeholder="Supervisor name..." />
                </div>
                <div className="space-y-1">
                  <Label>Schedule</Label>
                  <Input value={form.placement_schedule} onChange={e => set("placement_schedule", e.target.value)} placeholder="e.g. Mon–Fri 9am–1pm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Placement Details / Goals</Label>
                <Textarea
                  rows={4}
                  value={form.internal_placement_details}
                  onChange={e => set("internal_placement_details", e.target.value)}
                  placeholder="Job description, skills to develop, goals, any special considerations..."
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

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