import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const INTERNAL_REFERRAL_OPTIONS = [
  { value: "ell", label: "ELL (English Language Learning)" },
  { value: "empoweru", label: "EmpowerU" },
  { value: "digital_literacy", label: "Digital Literacy" },
  { value: "family_programs", label: "Family Programs" },
  { value: "childcare_program", label: "Childcare Program" },
  { value: "settlement_services", label: "Settlement Services" },
  { value: "other_internal", label: "Other (Internal)" },
];

const EXTERNAL_REFERRAL_OPTIONS = [
  { value: "christcity_lighthouse", label: "Christcity Lighthouse – Counselling" },
  { value: "other_external", label: "Other (External)" },
];

export default function ClientReferrals({ client, onSave }) {
  const [form, setForm] = useState({
    internal_referrals: client?.internal_referrals || [],
    external_referrals: client?.external_referrals || [],
  });
  const [saving, setSaving] = useState(false);
  const [prevInternal, setPrevInternal] = useState(client?.internal_referrals || []);
  const [prevExternal, setPrevExternal] = useState(client?.external_referrals || []);

  const toggleItem = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(i => i !== value)
        : [...prev[field], value],
    }));
  };

  const handleSave = async () => {
    setSaving(true);

    // Send alerts for newly added internal referrals
    const newInternal = form.internal_referrals.filter(r => !prevInternal.includes(r));
    if (newInternal.length > 0) {
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "internal_referrals",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        referrals: newInternal,
      });
    }

    // Send alerts for newly added external referrals
    const newExternal = form.external_referrals.filter(r => !prevExternal.includes(r));
    if (newExternal.length > 0) {
      await base44.functions.invoke("sendAlertEmail", {
        alert_type: "external_referrals",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        referrals: newExternal,
      });
    }

    await onSave(form);
    setPrevInternal(form.internal_referrals);
    setPrevExternal(form.external_referrals);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-base">Internal Referrals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Select all internal referrals made. Staff responsible for each program will be notified automatically.</p>
          {INTERNAL_REFERRAL_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-3">
              <Checkbox
                id={`int-${opt.value}`}
                checked={form.internal_referrals.includes(opt.value)}
                onCheckedChange={() => toggleItem("internal_referrals", opt.value)}
              />
              <label htmlFor={`int-${opt.value}`} className="text-sm text-slate-700 cursor-pointer">{opt.label}</label>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">External Referrals</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-500">Select all external referrals made. Where available, the external partner will be notified automatically.</p>
          {EXTERNAL_REFERRAL_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-3">
              <Checkbox
                id={`ext-${opt.value}`}
                checked={form.external_referrals.includes(opt.value)}
                onCheckedChange={() => toggleItem("external_referrals", opt.value)}
              />
              <label htmlFor={`ext-${opt.value}`} className="text-sm text-slate-700 cursor-pointer">{opt.label}</label>
            </div>
          ))}
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