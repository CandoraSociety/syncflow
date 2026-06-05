import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, ShieldCheck, ArrowRight, AlertTriangle, Pencil, X } from "lucide-react";
import { createCompassTask, taskServiceTypeChange, taskStatusChange } from "@/lib/compassTasks";

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
  { value: "internal_referral", label: "Internal Referral" },
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

// Read-only display field
const Field = ({ label, value }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</p>
    <p className="text-sm text-slate-800">{value || <span className="text-slate-300 italic">—</span>}</p>
  </div>
);

export default function ClientProfileOverview({ client, onSave }) {
  const [form, setForm] = useState({ ...client });
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    await onSave(form);

    const clientBase = { ...client, ...form };

    if (form.service_type && form.service_type !== client.service_type) {
      const t = taskServiceTypeChange(clientBase, form.service_type);
      await createCompassTask({ client_id: client.id, client_name: `${form.first_name} ${form.last_name}`, compass_hsid: form.compass_hsid, ...t });
    }

    if (form.program_status && form.program_status !== client.program_status) {
      const t = taskStatusChange(clientBase, form.program_status);
      await createCompassTask({ client_id: client.id, client_name: `${form.first_name} ${form.last_name}`, compass_hsid: form.compass_hsid, ...t });
    }

    setSaving(false);
    setEditMode(false);
  };

  const handleCancel = () => {
    setForm({ ...client });
    setEditMode(false);
  };

  const handleWorkerSelect = (email) => {
    const worker = WORKERS.find(w => w.email === email);
    setForm(prev => ({ ...prev, assigned_worker: email, assigned_worker_name: worker?.full_name || email }));
  };

  const clbLabel = (v) => v ? v.replace("clb_", "CLB ").replace("native_english_french", "Native English/French") : null;
  const labelOf = (list, v) => list.find(i => i.value === v)?.label || v;

  return (
    <div className="space-y-6">
      {/* Edit / Save / Cancel controls */}
      <div className="flex justify-end gap-2">
        {editMode ? (
          <>
            <Button variant="outline" onClick={handleCancel} className="gap-2">
              <X className="w-4 h-4" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={() => setEditMode(true)} className="gap-2">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editMode ? (
            <>
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
                  <SelectContent>{CLB_LEVELS.map(c => <SelectItem key={c} value={c}>{clbLabel(c)}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Has Vehicle</Label>
                <Select value={form.has_vehicle || ""} onValueChange={v => set("has_vehicle", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{VEHICLE_OPTIONS.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
              <Field label="First Name" value={form.first_name} />
              <Field label="Last Name" value={form.last_name} />
              <Field label="Date of Birth" value={form.date_of_birth} />
              <Field label="Phone" value={form.phone} />
              <Field label="Email" value={form.email} />
              <Field label="Compass HSID#" value={form.compass_hsid} />
              <Field label="Address" value={form.address} />
              <Field label="City" value={form.city} />
              <Field label="Residency Status" value={labelOf(RESIDENCY_STATUSES, form.residency_status)} />
              <Field label="CLB Level" value={clbLabel(form.clb_level)} />
              <Field label="Has Vehicle" value={labelOf(VEHICLE_OPTIONS, form.has_vehicle)} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Stream switch alert */}
      {(client.program_stream_switches?.length > 0) && (
        <div className="bg-purple-50 border-2 border-purple-400 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-sm font-bold text-purple-800">
              Program Stream Switch{client.program_stream_switches.length > 1 ? "es" : ""} on File
            </span>
          </div>
          <div className="space-y-1.5">
            {client.program_stream_switches.map((sw, i) => (
              <div key={i} className="flex items-center gap-2 flex-wrap text-sm">
                {sw.date && <span className="text-xs text-purple-500 font-medium">{sw.date}</span>}
                <span className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-lg text-xs font-medium">
                  {SERVICE_TYPES.find(s => s.value === sw.from_stream)?.label || sw.from_stream || "Unknown"}
                </span>
                <ArrowRight className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2.5 py-0.5 rounded-lg text-xs font-semibold">
                  {SERVICE_TYPES.find(s => s.value === sw.to_stream)?.label || sw.to_stream || "Unknown"}
                </span>
                {sw.reason && (
                  <span className="text-xs text-purple-500 italic">
                    — {sw.reason === "other" && sw.reason_other ? sw.reason_other : sw.reason.replace(/_/g, " ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Case Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {editMode ? (
            <>
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
            </>
          ) : (
            <>
              <Field label="Service Element" value={labelOf(SERVICE_TYPES, form.service_type)} />
              <Field label="Program Status" value={labelOf(PROGRAM_STATUSES, form.program_status)} />
              <Field label="Assigned Worker" value={form.assigned_worker_name || form.assigned_worker} />
              <Field label="Employment Status" value={form.employment_status} />
              <Field label="Intake Date" value={form.intake_date} />
              <Field label="Service Start Date" value={form.service_start_date} />
              <Field label="Completion Date" value={form.completion_date} />
              <Field label="90-Day Follow-Up Date" value={form.followup_90day_date} />
              <Field label="90-Day Employment Status" value={form.followup_90day_status} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Career Background</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
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
            </>
          ) : (
            <>
              <Field label="Career / Employment Objectives" value={form.career_objectives} />
              <Field label="Employment History / Education" value={form.employment_history} />
              <Field label="Intake Notes" value={form.intake_notes} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Compass Entry Verification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {editMode ? (
            <>
              <div className="flex items-center gap-3">
                <Checkbox
                  id="compass_verified"
                  checked={!!form.compass_verified}
                  onCheckedChange={v => set("compass_verified", v)}
                />
                <Label htmlFor="compass_verified" className="font-medium cursor-pointer">
                  Client file has been entered into Compass
                </Label>
              </div>
              {form.compass_verified && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <Label>Date Verified</Label>
                    <Input type="date" value={form.compass_verified_date || ""} onChange={e => set("compass_verified_date", e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Verified By</Label>
                    <Input placeholder="Name of person who verified..." value={form.compass_verified_by || ""} onChange={e => set("compass_verified_by", e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Compass Notes / Discrepancies</Label>
                    <Textarea
                      rows={3}
                      placeholder="Note any discrepancies between this record and Compass, or any outstanding items..."
                      value={form.compass_notes || ""}
                      onChange={e => set("compass_notes", e.target.value)}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center ${form.compass_verified ? "bg-green-100" : "bg-amber-100"}`}>
                  <div className={`w-2 h-2 rounded-full ${form.compass_verified ? "bg-green-500" : "bg-amber-400"}`} />
                </div>
                <span className="text-sm text-slate-700">
                  {form.compass_verified ? "Entered into Compass" : "Not yet entered into Compass"}
                </span>
              </div>
              {form.compass_verified && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Date Verified" value={form.compass_verified_date} />
                  <Field label="Verified By" value={form.compass_verified_by} />
                  {form.compass_notes && <div className="md:col-span-2"><Field label="Notes / Discrepancies" value={form.compass_notes} /></div>}
                </div>
              )}
            </>
          )}
          {!form.compass_verified && !editMode && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠ This client has not been verified as entered in Compass.
            </p>
          )}
        </CardContent>
      </Card>

      {editMode && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel} className="gap-2">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}
    </div>
  );
}