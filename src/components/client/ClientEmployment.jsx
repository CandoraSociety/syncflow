import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { createCompassTask, taskEmploymentOutcome, taskPostCompletionEmployment, task90DayFollowup } from "@/lib/compassTasks";

const EMPLOYMENT_CODES = [
  { value: "E-RF", label: "E-RF – Employed, Related Field" },
  { value: "E-UF", label: "E-UF – Employed, Unrelated Field" },
  { value: "E-PT", label: "E-PT – Employed, Part-Time" },
  { value: "UE", label: "UE – Unemployed" },
  { value: "UE-LA", label: "UE-LA – Unemployed, Looking Actively" },
  { value: "UE-S", label: "UE-S – Unemployed, Seasonal" },
  { value: "NA", label: "N/A" },
];

export default function ClientEmployment({ client, onSave }) {
  const [form, setForm] = useState({
    employment_status: client?.employment_status || "",
    employment_start_date: client?.employment_start_date || "",
    employer_name: client?.employer_name || "",
    employer_contact: client?.employer_contact || "",
    job_title: client?.job_title || "",
    job_start_date: client?.job_start_date || "",
    job_wage: client?.job_wage || "",
    job_hours: client?.job_hours || "",
    post_completion_employment_status: client?.post_completion_employment_status || "",
    post_completion_employment_date: client?.post_completion_employment_date || "",
    followup_90day_date: client?.followup_90day_date || "",
    followup_90day_status: client?.followup_90day_status || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const isEmployed = ["E-RF", "E-UF", "E-PT"].includes(form.employment_status);

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);

    const clientBase = { ...client, ...form };

    // Employment status changed
    if (form.employment_status && form.employment_status !== client.employment_status) {
      const t = taskEmploymentOutcome(clientBase, form.employment_status);
      await createCompassTask({ client_id: client.id, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, ...t });
    }

    // Post-completion employment status changed
    if (form.post_completion_employment_status && form.post_completion_employment_status !== client.post_completion_employment_status) {
      const t = taskPostCompletionEmployment(clientBase, form.post_completion_employment_status);
      await createCompassTask({ client_id: client.id, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, ...t });
    }

    // 90-day follow-up status changed
    if (form.followup_90day_status && form.followup_90day_status !== client.followup_90day_status) {
      const t = task90DayFollowup(clientBase, form.followup_90day_status);
      await createCompassTask({ client_id: client.id, client_name: `${client.first_name} ${client.last_name}`, compass_hsid: client.compass_hsid, ...t });
    }

    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Employment Status</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Employment Status</Label>
            <Select value={form.employment_status} onValueChange={v => set("employment_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_CODES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Employment Start Date</Label>
            <Input type="date" value={form.employment_start_date} onChange={e => set("employment_start_date", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {isEmployed && (
        <Card>
          <CardHeader><CardTitle className="text-base">Employer & Job Info</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Employer Name</Label>
              <Input value={form.employer_name} onChange={e => set("employer_name", e.target.value)} placeholder="Company name" />
            </div>
            <div className="space-y-1">
              <Label>Employer Contact</Label>
              <Input value={form.employer_contact} onChange={e => set("employer_contact", e.target.value)} placeholder="Name, phone, email" />
            </div>
            <div className="space-y-1">
              <Label>Job Title</Label>
              <Input value={form.job_title} onChange={e => set("job_title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Job Start Date</Label>
              <Input type="date" value={form.job_start_date} onChange={e => set("job_start_date", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Wage ($/hr or salary)</Label>
              <Input value={form.job_wage} onChange={e => set("job_wage", e.target.value)} placeholder="e.g. $18/hr" />
            </div>
            <div className="space-y-1">
              <Label>Hours/Week</Label>
              <Input value={form.job_hours} onChange={e => set("job_hours", e.target.value)} placeholder="e.g. 35" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Post-Program Completion Employment</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Post-Completion Employment Status</Label>
            <Select value={form.post_completion_employment_status} onValueChange={v => set("post_completion_employment_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {[...EMPLOYMENT_CODES, { value: "no_contact", label: "No Contact" }].map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Post-Completion Employment Start Date</Label>
            <Input type="date" value={form.post_completion_employment_date} onChange={e => set("post_completion_employment_date", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">90-Day Follow-Up</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>90-Day Follow-Up Date</Label>
            <Input type="date" value={form.followup_90day_date} onChange={e => set("followup_90day_date", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>90-Day Employment Status</Label>
            <Select value={form.followup_90day_status} onValueChange={v => set("followup_90day_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {[...EMPLOYMENT_CODES, { value: "no_contact", label: "No Contact" }].map(e => (
                  <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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