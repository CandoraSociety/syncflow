import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

const RESIDENCY_STATUSES = [
  { value: "canadian_citizen", label: "Canadian Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "protected_person", label: "Protected Person" },
  { value: "convention_refugee", label: "Convention Refugee" },
  { value: "refugee_claimant", label: "Refugee Claimant / Asylum Seeker" },
  { value: "temporary_resident", label: "Temporary Resident" },
  { value: "work_permit", label: "Work Permit Holder" },
  { value: "study_permit", label: "Study Permit Holder" },
  { value: "visitor", label: "Visitor" },
  { value: "other", label: "Other" },
];

const CLB_LEVELS = [
  "clb_1","clb_2","clb_3","clb_4","clb_5","clb_6",
  "clb_7","clb_8","clb_9","clb_10","clb_11","clb_12","native_english_french"
];

const VEHICLE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no_has_license", label: "No (has licence)" },
  { value: "no_no_license", label: "No (no licence)" },
];

const SERVICE_TYPES = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
  { value: "not_eligible", label: "Not eligible/no referral" },
];

const PROGRAM_STATUSES = [
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPLOYMENT_CODES = [
  { value: "E-RF", label: "E-RF – Employed, Related Field" },
  { value: "E-UF", label: "E-UF – Employed, Unrelated Field" },
  { value: "E-PT", label: "E-PT – Employed, Part-Time" },
  { value: "UE", label: "UE – Unemployed" },
  { value: "UE-LA", label: "UE-LA – Unemployed, Looking Actively" },
  { value: "UE-S", label: "UE-S – Unemployed, Seasonal" },
  { value: "NA", label: "N/A" },
];

const WORKERS = [
  { email: "priscilla@candorasociety.com", full_name: "Priscilla" },
  { email: "lola@candorasociety.com", full_name: "Lola" },
  { email: "john@candorasociety.com", full_name: "John" },
  { email: "Dawn.williston@candorasociety.com", full_name: "Dawn" },
  { email: "olena@candorasociety.com", full_name: "Olena" },
];

export default function ClientProfileOverview({ client, onSave }) {
  const [form, setForm] = useState({ ...client });
  const [saving, setSaving] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  const handleWorkerSelect = (email) => {
    const worker = WORKERS.find(w => w.email === email);
    setForm(prev => ({ ...prev, assigned_worker: email, assigned_worker_name: worker?.full_name || email }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1"><Label>First Name</Label><Input value={form.first_name || ""} onChange={e => set("first_name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Last Name</Label><Input value={form.last_name || ""} onChange={e => set("last_name", e.target.value)} /></div>
          <div className="space-y-1"><Label>Date of Birth</Label><Input type="date" value={form.date_of_birth || ""} onChange={e => set("date_of_birth", e.target.value)} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={form.phone || ""} onChange={e => set("phone", e.target.value)} /></div>
          <div className="space-y-1"><Label>Email</Label><Input value={form.email || ""} onChange={e => set("email", e.target.value)} /></div>
          <div className="space-y-1"><Label>Compass HSID#</Label><Input value={form.compass_hsid || ""} onChange={e => set("compass_hsid", e.target.value)} /></div>
          <div className="space-y-1"><Label>Address</Label><Input value={form.address || ""} onChange={e => set("address", e.target.value)} /></div>
          <div className="space-y-1"><Label>City</Label><Input value={form.city || ""} onChange={e => set("city", e.target.value)} /></div>
          <div className="space-y-1">
            <Label>Residency Status</Label>
            <Select value={form.residency_status || ""} onValueChange={v => set("residency_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{RESIDENCY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>CLB Level</Label>
            <Select value={form.clb_level || ""} onValueChange={v => set("clb_level", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{CLB_LEVELS.map(c => <SelectItem key={c} value={c}>{c.replace("clb_", "CLB ").replace("native_english_french", "Native English/French")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Has Vehicle</Label>
            <Select value={form.has_vehicle || ""} onValueChange={v => set("has_vehicle", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{VEHICLE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Case Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Service Element</Label>
            <Select value={form.service_type || ""} onValueChange={v => set("service_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Program Status</Label>
            <Select value={form.program_status || ""} onValueChange={v => set("program_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{PROGRAM_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Assigned Worker</Label>
            <Select value={form.assigned_worker || ""} onValueChange={handleWorkerSelect}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{WORKERS.map(w => <SelectItem key={w.email} value={w.email}>{w.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Employment Status</Label>
            <Select value={form.employment_status || ""} onValueChange={v => set("employment_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{EMPLOYMENT_CODES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Intake Date</Label><Input type="date" value={form.intake_date || ""} onChange={e => set("intake_date", e.target.value)} /></div>
          <div className="space-y-1"><Label>Service Start Date</Label><Input type="date" value={form.service_start_date || ""} onChange={e => set("service_start_date", e.target.value)} /></div>
          <div className="space-y-1"><Label>Completion Date</Label><Input type="date" value={form.completion_date || ""} onChange={e => set("completion_date", e.target.value)} /></div>
          <div className="space-y-1"><Label>90-Day Follow-Up Date</Label><Input type="date" value={form.followup_90day_date || ""} onChange={e => set("followup_90day_date", e.target.value)} /></div>
          <div className="space-y-1">
            <Label>90-Day Employment Status</Label>
            <Select value={form.followup_90day_status || ""} onValueChange={v => set("followup_90day_status", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {[...EMPLOYMENT_CODES, { value: "no_contact", label: "No Contact" }].map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Career Background</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Career / Employment Objectives</Label>
            <Textarea rows={4} value={form.career_objectives || ""} onChange={e => set("career_objectives", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Employment History / Education</Label>
            <Textarea rows={4} value={form.employment_history || ""} onChange={e => set("employment_history", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Intake Notes</Label>
            <Textarea rows={4} value={form.intake_notes || ""} onChange={e => set("intake_notes", e.target.value)} />
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