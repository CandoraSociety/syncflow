import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

const SERVICE_TYPES = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral (non-employment)" },
  { value: "not_eligible", label: "Not eligible/no referral" },
];

const REFERRAL_SOURCES = [
  { value: "self", label: "Self" },
  { value: "family_friend", label: "Family / Friend" },
  { value: "school", label: "School" },
  { value: "court", label: "Court" },
  { value: "hospital", label: "Hospital" },
  { value: "shelter", label: "Shelter" },
  { value: "employer", label: "Employer" },
  { value: "other", label: "Other" },
];

const STATUSES = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

export default function IntakeForm({ client, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    first_name: client?.first_name || "",
    last_name: client?.last_name || "",
    date_of_birth: client?.date_of_birth || "",
    phone: client?.phone || "",
    email: client?.email || "",
    address: client?.address || "",
    city: client?.city || "",
    state: client?.state || "",
    zip: client?.zip || "",
    referral_source: client?.referral_source || "",
    service_type: client?.service_type || "",
    assigned_worker: client?.assigned_worker || "",
    assigned_worker_name: client?.assigned_worker_name || "",
    status: client?.status || "new",
    intake_notes: client?.intake_notes || "",
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleWorkerSelect = (email) => {
    const worker = users.find(u => u.email === email);
    set("assigned_worker", email);
    set("assigned_worker_name", worker?.full_name || email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  const workerUsers = users.filter(u => u.role !== "admin" || true); // show all users as potential workers

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-xl font-bold text-slate-800">
          {client ? "Edit Client" : "New Client Intake"}
        </h2>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Demographics</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>First Name *</Label>
            <Input value={form.first_name} onChange={e => set("first_name", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Last Name *</Label>
            <Input value={form.last_name} onChange={e => set("last_name", e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Date of Birth</Label>
            <Input type="date" value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={e => set("email", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Address</Label>
            <Input value={form.address} onChange={e => set("address", e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>City</Label>
            <Input value={form.city} onChange={e => set("city", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label>Province</Label>
              <Select value={form.state} onValueChange={v => set("state", v)}>
                <SelectTrigger><SelectValue placeholder="Select province" /></SelectTrigger>
                <SelectContent>
                  {["AB","BC","MB","NB","NL","NS","NT","NU","ON","PE","QC","SK","YT"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Postal Code</Label>
              <Input value={form.zip} onChange={e => set("zip", e.target.value)} maxLength={7} placeholder="A1A 1A1" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Case & Service Info</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Referral Source</Label>
            <Select value={form.referral_source} onValueChange={v => set("referral_source", v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {REFERRAL_SOURCES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Service Element (Stream)</Label>
            <Select value={form.service_type} onValueChange={v => set("service_type", v)}>
              <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
              <SelectContent>
                {SERVICE_TYPES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Assign to Worker</Label>
            <Select value={form.assigned_worker} onValueChange={handleWorkerSelect}>
              <SelectTrigger><SelectValue placeholder="Select worker" /></SelectTrigger>
              <SelectContent>
                {workerUsers.map(u => (
                  <SelectItem key={u.email} value={u.email}>{u.full_name} ({u.email})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Intake Notes</Label>
            <Textarea
              value={form.intake_notes}
              onChange={e => set("intake_notes", e.target.value)}
              rows={4}
              placeholder="Additional notes about the client..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="gap-2">
          <Save className="w-4 h-4" /> {client ? "Save Changes" : "Save Client"}
        </Button>
      </div>
    </form>
  );
}