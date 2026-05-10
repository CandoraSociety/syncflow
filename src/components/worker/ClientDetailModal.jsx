import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Save } from "lucide-react";

const SERVICE_LABELS = {
  job_placement: "Job Placement",
  resume_assistance: "Resume Assistance",
  skills_training: "Skills Training",
  benefits_enrollment: "Benefits Enrollment",
  housing_support: "Housing Support",
  mental_health_referral: "Mental Health Referral",
  childcare_assistance: "Childcare Assistance",
  other: "Other",
};

const REFERRAL_LABELS = {
  self: "Self", family_friend: "Family / Friend", school: "School",
  court: "Court", hospital: "Hospital", shelter: "Shelter", employer: "Employer", other: "Other",
};

const STATUSES = [
  { value: "new", label: "New" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "closed", label: "Closed" },
];

export default function ClientDetailModal({ client, onClose, onUpdate }) {
  const [status, setStatus] = useState(client.status || "new");
  const [notes, setNotes] = useState(client.intake_notes || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onUpdate(client.id, { status, intake_notes: notes });
    setSaving(false);
  };

  const field = (label, value) => (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium">{value || "—"}</p>
    </div>
  );

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{client.first_name} {client.last_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">Demographics</h3>
            <div className="grid grid-cols-2 gap-3">
              {field("Date of Birth", client.date_of_birth ? format(new Date(client.date_of_birth), "MM/dd/yyyy") : null)}
              {field("Phone", client.phone)}
              {field("Email", client.email)}
              {field("Address", [client.address, client.city, client.state, client.zip].filter(Boolean).join(", "))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">Case Info</h3>
            <div className="grid grid-cols-2 gap-3">
              {field("Referral Source", REFERRAL_LABELS[client.referral_source])}
              {field("Service Type", SERVICE_LABELS[client.service_type])}
              {field("Intake Date", client.intake_date ? format(new Date(client.intake_date), "MM/dd/yyyy") : null)}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-3 border-b pb-1">Update Case</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Case Notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this client's progress..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}