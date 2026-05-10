import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

function Field({ label, hint, name, value, onChange, prefix = "$" }) {
  return (
    <div>
      <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
      {hint && <p className="text-xs text-slate-400 mb-1">{hint}</p>}
      <div className="relative">
        {prefix && <span className="absolute left-3 top-2 text-slate-400 text-sm">{prefix}</span>}
        <Input
          type="number"
          min={0}
          step="0.01"
          className={`h-9 text-sm ${prefix ? "pl-7" : ""}`}
          value={value || ""}
          onChange={e => onChange(name, e.target.value === "" ? "" : Number(e.target.value))}
        />
      </div>
    </div>
  );
}

export default function InvoiceConfigEditor({ config, onSaved, onClose }) {
  const [form, setForm] = useState(config || {
    config_name: "",
    contract_start_date: "",
    contract_end_date: "",
    base_monthly_amount: 0,
    rate_dea_starter: 0,
    rate_pathways_starter: 0,
    rate_dea_completer: 0,
    rate_pathways_completer: 0,
    rate_employment_outcome: 0,
    rate_90day_outcome: 0,
    cap_starters: 0,
    cap_completers: 0,
    cap_employment_outcomes: 0,
    cap_90day_outcomes: 0,
    cap_exposure_courses_dollars: 0,
    cap_paid_placements_dollars: 0,
    cap_employment_supports_dollars: 0,
    is_active: true,
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  const set = (name, value) => setForm(f => ({ ...f, [name]: value }));

  const save = async () => {
    setSaving(true);
    if (config?.id) {
      await base44.entities.InvoiceConfig.update(config.id, form);
    } else {
      await base44.entities.InvoiceConfig.create(form);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-8">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Contract Configuration</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-7">
          {/* Contract Info */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Contract Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Contract Name</Label>
                <Input className="h-9 text-sm" value={form.config_name} onChange={e => set("config_name", e.target.value)} placeholder="e.g. AEIP 2024-2026" />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">Start Date</Label>
                <Input type="date" className="h-9 text-sm" value={form.contract_start_date} onChange={e => set("contract_start_date", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">End Date</Label>
                <Input type="date" className="h-9 text-sm" value={form.contract_end_date} onChange={e => set("contract_end_date", e.target.value)} />
              </div>
            </div>
            <div className="max-w-xs">
              <Field label="Base Monthly Fee" name="base_monthly_amount" value={form.base_monthly_amount} onChange={set} />
            </div>
          </div>

          {/* Rates */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Deliverable Rates (per person)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Field label="DEA Starter" name="rate_dea_starter" value={form.rate_dea_starter} onChange={set} />
              <Field label="Pathways Starter" name="rate_pathways_starter" value={form.rate_pathways_starter} onChange={set} />
              <Field label="DEA Completer" name="rate_dea_completer" value={form.rate_dea_completer} onChange={set} />
              <Field label="Pathways Completer" name="rate_pathways_completer" value={form.rate_pathways_completer} onChange={set} />
              <Field label="Employment Outcome" name="rate_employment_outcome" value={form.rate_employment_outcome} onChange={set} />
              <Field label="90-Day Sustained Outcome" name="rate_90day_outcome" value={form.rate_90day_outcome} onChange={set} />
            </div>
          </div>

          {/* Caps - counts */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Contract Caps — Deliverables (max count)</h3>
            <p className="text-xs text-slate-400">Set to 0 to disable cap tracking for that category.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="Max Starters" name="cap_starters" value={form.cap_starters} onChange={set} prefix="#" />
              <Field label="Max Completers" name="cap_completers" value={form.cap_completers} onChange={set} prefix="#" />
              <Field label="Max Emp. Outcomes" name="cap_employment_outcomes" value={form.cap_employment_outcomes} onChange={set} prefix="#" />
              <Field label="Max 90-Day Outcomes" name="cap_90day_outcomes" value={form.cap_90day_outcomes} onChange={set} prefix="#" />
            </div>
          </div>

          {/* Caps - dollars */}
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Contract Caps — Direct Costs (max dollars)</h3>
            <p className="text-xs text-slate-400">Set to 0 to disable cap tracking for that category.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="Exposure Courses / Training" name="cap_exposure_courses_dollars" value={form.cap_exposure_courses_dollars} onChange={set} />
              <Field label="Paid External Placements" name="cap_paid_placements_dollars" value={form.cap_paid_placements_dollars} onChange={set} />
              <Field label="Employment Supports / Work Equipment" name="cap_employment_supports_dollars" value={form.cap_employment_supports_dollars} onChange={set} />
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs font-medium text-slate-600 mb-1 block">Notes</Label>
            <textarea
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 resize-none h-20"
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="Any notes about this contract..."
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Configuration"}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}