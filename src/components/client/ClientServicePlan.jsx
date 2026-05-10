import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SDP_OPTIONS = [
  "Attend Job Search workshop",
  "Attend Resume Writing workshop",
  "Attend Interview Skills workshop",
  "Attend Workplace Readiness workshop",
  "Attend Financial Literacy workshop",
  "Attend Digital Literacy workshop",
  "Attend EmpowerU program",
  "Attend ELL classes",
  "Complete skills assessment",
  "Develop job action plan",
  "Apply to minimum 5 jobs/week",
  "Connect with employer network",
  "Address barriers (see barriers section)",
];

const BARRIER_OPTIONS = [
  "Transportation",
  "Childcare",
  "Language / Communication",
  "Mental Health",
  "Housing instability",
  "Domestic violence",
  "Legal issues",
  "Financial barriers",
  "Lack of Canadian work experience",
  "Credential recognition",
  "Digital literacy",
  "Health / disability",
  "Other",
];

const BARRIER_STATUSES = [
  { value: "unresolved", label: "Unresolved" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export default function ClientServicePlan({ client, onSave }) {
  const [form, setForm] = useState({
    sdp_items: client?.sdp_items || [],
    sdp_notes: client?.sdp_notes || "",
    barriers_addressed: client?.barriers_addressed || false,
    service_navigation_supports: client?.service_navigation_supports || false,
    service_navigation_date: client?.service_navigation_date || "",
    barrier_1: client?.barrier_1 || "",
    barrier_1_status: client?.barrier_1_status || "unresolved",
    barrier_2: client?.barrier_2 || "",
    barrier_2_status: client?.barrier_2_status || "unresolved",
    barrier_3: client?.barrier_3 || "",
    barrier_3_status: client?.barrier_3_status || "unresolved",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleSdpItem = (item) => {
    setForm(prev => ({
      ...prev,
      sdp_items: prev.sdp_items.includes(item)
        ? prev.sdp_items.filter(i => i !== item)
        : [...prev.sdp_items, item]
    }));
  };

  const handleBarriersToggle = async (checked) => {
    set("barriers_addressed", checked);
    if (checked) {
      // Send alert to service navigator
      const barriers = [form.barrier_1, form.barrier_2, form.barrier_3].filter(Boolean);
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "barriers",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        barriers,
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Service Delivery Plan</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Label className="text-sm font-medium text-slate-700">Select all that apply:</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SDP_OPTIONS.map(option => (
              <div key={option} className="flex items-center gap-3">
                <Checkbox
                  id={option}
                  checked={form.sdp_items.includes(option)}
                  onCheckedChange={() => toggleSdpItem(option)}
                />
                <label htmlFor={option} className="text-sm text-slate-700 cursor-pointer">{option}</label>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <Label>Additional SDP Notes</Label>
            <Textarea rows={3} value={form.sdp_notes} onChange={e => set("sdp_notes", e.target.value)} placeholder="Any additional plan details..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Service Navigation Supports</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={form.service_navigation_supports} onCheckedChange={v => set("service_navigation_supports", v)} />
            <Label>Client received service navigation supports</Label>
          </div>
          {form.service_navigation_supports && (
            <div className="space-y-1">
              <Label>Service Navigation Date</Label>
              <input type="date" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm" value={form.service_navigation_date} onChange={e => set("service_navigation_date", e.target.value)} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Barriers Addressed</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Switch checked={form.barriers_addressed} onCheckedChange={handleBarriersToggle} />
            <Label>Barriers have been identified and are being addressed</Label>
          </div>
          {form.barriers_addressed && (
            <div className="space-y-4 mt-2">
              <p className="text-xs text-slate-500 italic">Service navigator (Dawn) will be automatically notified when barriers are identified.</p>
              {[1, 2, 3].map(n => (
                <div key={n} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-1">
                    <Label>Barrier {n}</Label>
                    <Select value={form[`barrier_${n}`]} onValueChange={v => set(`barrier_${n}`, v)}>
                      <SelectTrigger><SelectValue placeholder="Select barrier" /></SelectTrigger>
                      <SelectContent>{BARRIER_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={form[`barrier_${n}_status`]} onValueChange={v => set(`barrier_${n}_status`, v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{BARRIER_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
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