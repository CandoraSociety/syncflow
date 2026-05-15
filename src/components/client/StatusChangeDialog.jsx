import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { X } from "lucide-react";

const CHANGE_TYPES = [
  { value: "stream_switch", label: "Program Stream Switch", billingRelevant: true },
  { value: "program_status_change", label: "Program Status Change", billingRelevant: true },
  { value: "employment_outcome", label: "Employment Outcome Recorded", billingRelevant: true },
  { value: "post_completion_status", label: "Post-Completion Status Change", billingRelevant: true },
  { value: "followup_90day", label: "90-Day Follow-Up Status", billingRelevant: true },
  { value: "file_closed", label: "File Closed", billingRelevant: false },
  { value: "file_opened", label: "File Reopened", billingRelevant: false },
  { value: "other", label: "Other", billingRelevant: false },
];

const STREAM_OPTIONS = [
  { value: "direct_to_employment", label: "Direct to Employment (DEA)" },
  { value: "pathways", label: "Pathways" },
  { value: "casual", label: "Casual" },
  { value: "external_referral", label: "External Referral" },
  { value: "internal_referral", label: "Internal Referral" },
];

const PROGRAM_STATUS_OPTIONS = [
  { value: "in_progress", label: "In Progress" },
  { value: "complete", label: "Complete" },
  { value: "incomplete", label: "Incomplete" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPLOYMENT_STATUS_OPTIONS = [
  "E-RF", "E-UF", "E-PT", "UE", "UE-LA", "UE-S", "NA", "no_contact"
];

function getOptionsForType(changeType, direction) {
  if (changeType === "stream_switch") return STREAM_OPTIONS.map(o => ({ value: o.value, label: o.label }));
  if (changeType === "program_status_change") return PROGRAM_STATUS_OPTIONS;
  if (["employment_outcome", "post_completion_status", "followup_90day"].includes(changeType))
    return EMPLOYMENT_STATUS_OPTIONS.map(v => ({ value: v, label: v }));
  return null;
}

export default function StatusChangeDialog({ client, onClose, onSaved }) {
  const [changeType, setChangeType] = useState("");
  const [changeDate, setChangeDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedType = CHANGE_TYPES.find(t => t.value === changeType);
  const options = changeType ? getOptionsForType(changeType) : null;

  const currentStreamLabel = STREAM_OPTIONS.find(o => o.value === client.service_type)?.label || client.service_type || "Unknown";

  const handleSave = async () => {
    if (!changeType || !changeDate) return;
    setSaving(true);
    const user = await base44.auth.me();
    await base44.entities.StatusChange.create({
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      change_type: changeType,
      change_date: changeDate,
      from_value: fromValue,
      to_value: toValue,
      notes,
      logged_by: user?.email || "",
      logged_by_name: user?.full_name || user?.email || "",
      billing_relevant: selectedType?.billingRelevant || false,
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-800">Log a Status Change</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <Label className="text-xs mb-1 block">Type of Change <span className="text-red-500">*</span></Label>
            <select
              className="w-full h-9 text-sm border border-slate-200 rounded-md px-3"
              value={changeType}
              onChange={e => {
                const newType = e.target.value;
                setChangeType(newType);
                setFromValue(newType === "stream_switch" ? (client.service_type || "") : "");
                setToValue("");
              }}
            >
              <option value="">Select type...</option>
              {CHANGE_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {selectedType?.billingRelevant && (
              <p className="text-xs text-amber-600 mt-1 font-medium">⚠ This change type may affect billing</p>
            )}
          </div>

          <div>
            <Label className="text-xs mb-1 block">Date of Change <span className="text-red-500">*</span></Label>
            <Input type="date" className="h-9 text-sm" value={changeDate} onChange={e => setChangeDate(e.target.value)} />
          </div>

          {options ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">From</Label>
                {changeType === "stream_switch" ? (
                  <div className="h-9 text-sm border border-slate-200 rounded-md px-3 flex items-center bg-slate-50 text-slate-600">
                    {currentStreamLabel}
                  </div>
                ) : (
                  <select className="w-full h-9 text-sm border border-slate-200 rounded-md px-3" value={fromValue} onChange={e => setFromValue(e.target.value)}>
                    <option value="">Select...</option>
                    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </div>
              <div>
                <Label className="text-xs mb-1 block">To</Label>
                <select className="w-full h-9 text-sm border border-slate-200 rounded-md px-3" value={toValue} onChange={e => setToValue(e.target.value)}>
                  <option value="">Select...</option>
                  {options.filter(o => o.value !== fromValue).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          ) : changeType && changeType !== "other" ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">From</Label>
                <Input className="h-9 text-sm" value={fromValue} onChange={e => setFromValue(e.target.value)} placeholder="Previous value" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">To</Label>
                <Input className="h-9 text-sm" value={toValue} onChange={e => setToValue(e.target.value)} placeholder="New value" />
              </div>
            </div>
          ) : null}

          <div>
            <Label className="text-xs mb-1 block">Notes (optional)</Label>
            <textarea
              className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm resize-none h-20"
              placeholder="Additional context about this change..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !changeType || !changeDate}>
              {saving ? "Saving..." : "Log Change"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}