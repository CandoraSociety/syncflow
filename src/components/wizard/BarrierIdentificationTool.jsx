import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Save, ChevronRight, ChevronDown, ChevronUp, Pencil, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createCompassTask, taskBarriersIdentified } from "@/lib/compassTasks";

const BIT_BARRIERS = [
  {
    key: "Housing Stability",
    examples: ["Homelessness", "Unstable housing", "Unsafe living conditions"],
    actions: ["Refer to housing support services", "Refer to shelters"],
  },
  {
    key: "Childcare",
    examples: ["Lack of affordable childcare", "Unreliable babysitters"],
    actions: ["Connect with childcare subsidies", "Connect with local childcare providers"],
  },
  {
    key: "Transportation",
    examples: ["No access to a vehicle", "Unreliable public transit"],
    actions: ["Provide transit passes", "Apply for TAG"],
  },
  {
    key: "Mental Health",
    examples: ["Anxiety", "Depression", "PTSD", "Lack of coping skills"],
    actions: ["Refer to counselling", "Refer to mental health resources"],
  },
  {
    key: "Physical Health",
    examples: ["Chronic illness", "Disability", "Lack of access to healthcare"],
    actions: ["Connect with healthcare providers", "Connect with disability supports"],
  },
  {
    key: "Language Proficiency",
    examples: ["Difficulty speaking English", "Difficulty reading English", "Difficulty writing in English"],
    actions: ["Enroll in language classes", "Provide ELL resources"],
  },
  {
    key: "Legal / Immigration",
    examples: ["Lack of work permits", "Criminal record", "Unresolved legal issues"],
    actions: ["Refer to legal aid", "Refer to immigration services"],
  },
  {
    key: "Financial Stability",
    examples: ["Debt", "Lack of savings", "Inability to afford work-related expenses"],
    actions: ["Provide budgeting tools", "Financial literacy workshops"],
  },
  {
    key: "Social Support",
    examples: ["Isolation", "Lack of family or friends", "Limited community connections"],
    actions: ["Connect with community groups", "Connect with peer support programs"],
  },
];

const KEY_TO_LEGACY = {
  "Housing Stability": "Housing Instability",
  "Childcare": "Childcare",
  "Transportation": "Transportation",
  "Mental Health": "Mental Health",
  "Physical Health": "Health / Disability",
  "Language Proficiency": "Language / Communication",
  "Legal / Immigration": "Legal Issues",
  "Financial Stability": "Financial Barriers",
  "Social Support": "Cultural / Social Adjustment",
};

const CHECKIN_FREQUENCIES = ["Weekly", "Bi-Weekly", "Monthly"];
const FOLLOWUP_METHODS = ["Phone", "Email", "In-Person", "Other"];
const PROGRESS_OPTIONS = ["Resolved", "Ongoing", "Needs Further Support"];

const emptyBarrierState = () =>
  Object.fromEntries(BIT_BARRIERS.map(b => [b.key, {
    confirmed: null,
    selectedChallenges: [],
    challengeOthers: [""],
    selectedActions: [],
    actionOthers: [""],
    notes: "",
  }]));

const emptyActionPlan = () => ({
  recommendations: "",
  checkin_frequency: "",
  followup_methods: [],
  followup_other: "",
  review_dates: ["", "", "", ""],
  progress: "",
  additional_notes: "",
});

// A reusable "check-all-that-apply" dropdown cell with multiple "Other" entries
function ChecklistCell({ options, selected, onToggle, otherValues, onOtherChange, onAddOther, onRemoveOther, open, onToggleOpen }) {
  const allSelected = [...selected.filter(s => s !== "Other"), ...(otherValues || []).filter(Boolean)];
  const displayText = allSelected.length > 0
    ? allSelected.slice(0, 2).join(", ") + (allSelected.length > 2 ? ` +${allSelected.length - 2}` : "")
    : "Select…";

  return (
    <div className="relative min-w-[160px]">
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between gap-1 text-xs border border-slate-200 rounded px-2 py-1.5 bg-white hover:border-slate-400 transition-colors text-left"
      >
        <span className={allSelected.length > 0 ? "text-slate-800" : "text-slate-400"}>
          {displayText}
        </span>
        {open ? <ChevronUp className="w-3 h-3 shrink-0 text-slate-400" /> : <ChevronDown className="w-3 h-3 shrink-0 text-slate-400" />}
      </button>
      {open && (
        <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg p-2 space-y-1.5 min-w-[200px] max-w-[280px]">
          {options.map(opt => (
            <label key={opt} className="flex items-start gap-2 cursor-pointer text-xs leading-snug">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="accent-amber-500 w-3.5 h-3.5 mt-0.5 shrink-0"
              />
              <span className={selected.includes(opt) ? "text-slate-800 font-medium" : "text-slate-600"}>{opt}</span>
            </label>
          ))}
          {/* Multiple "Other" entries */}
          <div className="pt-1 border-t border-slate-100 space-y-1.5">
            {(otherValues || []).map((val, i) => (
              <div key={i} className="flex items-center gap-1">
                <Input
                  className="h-6 text-xs flex-1"
                  placeholder={`Other${(otherValues.length > 1) ? ` ${i + 1}` : ""}...`}
                  value={val}
                  onChange={e => onOtherChange(i, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); onRemoveOther(i); }}
                  className="text-slate-300 hover:text-red-400 text-xs px-1 leading-none"
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onAddOther(); }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >+ Add other</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BarrierIdentificationTool({ client, onSave, onComplete }) {
  const isCompleted = !!client?.bit_completed;

  const initBarrierState = () => {
    const state = emptyBarrierState();
    for (let n = 1; n <= 3; n++) {
      const legacyKey = client?.[`barrier_${n}`];
      if (!legacyKey) continue;
      const bitKey = Object.entries(KEY_TO_LEGACY).find(([, v]) => v === legacyKey)?.[0] || legacyKey;
      if (state[bitKey] !== undefined) {
        state[bitKey] = {
          ...state[bitKey],
          confirmed: true,
          notes: client?.[`barrier_${n}_notes`] || "",
        };
      }
    }
    return state;
  };

  const [submitted, setSubmitted] = useState(isCompleted);
  const [editing, setEditing] = useState(!isCompleted);
  const [barrierState, setBarrierState] = useState(initBarrierState);
  const [actionPlan, setActionPlan] = useState(emptyActionPlan());
  const [saving, setSaving] = useState(false);
  const [assessorName, setAssessorName] = useState("");
  // Track which dropdown is open: `${barrierKey}_challenges` | `${barrierKey}_actions` | null
  const [openDropdown, setOpenDropdown] = useState(null);

  const confirmedBarriers = BIT_BARRIERS.filter(b => barrierState[b.key]?.confirmed === true);

  const setConfirmed = (key, val) =>
    setBarrierState(prev => ({ ...prev, [key]: { ...prev[key], confirmed: val } }));

  const toggleItem = (barrierKey, field, item) => {
    setBarrierState(prev => {
      const cur = prev[barrierKey][field];
      return {
        ...prev,
        [barrierKey]: {
          ...prev[barrierKey],
          [field]: cur.includes(item) ? cur.filter(x => x !== item) : [...cur, item],
        },
      };
    });
  };

  const setField = (barrierKey, field, val) =>
    setBarrierState(prev => ({ ...prev, [barrierKey]: { ...prev[barrierKey], [field]: val } }));

  const toggleDropdown = (id) => setOpenDropdown(prev => prev === id ? null : id);

  // Auto-populate recommendations from confirmed barriers' selected actions
  useEffect(() => {
    const lines = [];
    confirmedBarriers.forEach(b => {
      const state = barrierState[b.key];
      const actions = [
        ...(state.selectedActions || []),
        ...(state.actionOthers || []).filter(v => v.trim()),
      ];
      if (actions.length > 0) {
        lines.push(`${b.key}:`);
        actions.forEach(a => lines.push(`  • ${a}`));
      }
    });
    setActionPlan(p => ({ ...p, recommendations: lines.join("\n") }));
  }, [barrierState]);

  const toggleFollowupMethod = (method) => {
    setActionPlan(prev => ({
      ...prev,
      followup_methods: prev.followup_methods.includes(method)
        ? prev.followup_methods.filter(m => m !== method)
        : [...prev.followup_methods, method],
    }));
  };

  const buildSaveData = () => {
    const data = { barriers_addressed: confirmedBarriers.length > 0, bit_completed: true };
    for (let n = 1; n <= 3; n++) {
      const b = confirmedBarriers[n - 1];
      data[`barrier_${n}`] = b ? (KEY_TO_LEGACY[b.key] || b.key) : "";
      data[`barrier_${n}_status`] = b ? "unresolved" : "";
      data[`barrier_${n}_other`] = "";
      data[`barrier_${n}_notes`] = b ? (barrierState[b.key]?.notes || "") : "";
      if (b) {
        const state = barrierState[b.key];
        const actions = [
          ...(state.selectedActions || []),
          ...(state.actionOthers || []).filter(v => v.trim()),
        ];
        data[`barrier_${n}_action_steps`] = actions.join("\n");
      } else {
        data[`barrier_${n}_action_steps`] = "";
      }
    }
    return data;
  };

  const handleSave = async (andContinue = false) => {
    setSaving(true);
    const data = buildSaveData();
    await onSave(data);
    if (confirmedBarriers.length > 0 && !client?.barriers_addressed) {
      const updatedClient = { ...client, ...data };
      const t = taskBarriersIdentified(updatedClient);
      await createCompassTask({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid,
        assigned_worker: client.assigned_worker,
        assigned_worker_name: client.assigned_worker_name,
        ...t,
      });
      base44.functions.invoke("sendAlertEmail", {
        alert_type: "barriers",
        client_name: `${client.first_name} ${client.last_name}`,
        client_id: client.id,
        barriers: confirmedBarriers.map(b => b.key),
      }).catch(() => {});
    }
    setSaving(false);
    setSubmitted(true);
    setEditing(false);
    if (andContinue) onComplete?.();
  };

  return (
    // Clicking outside closes dropdowns
    <div className="space-y-6" onClick={() => setOpenDropdown(null)}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 1 — Barrier Identification Tool (BIT)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Identify and document barriers that may prevent the participant from securing or maintaining employment.
          </p>
        </div>
        {submitted && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2 shrink-0">
            <Pencil className="w-4 h-4" /> Edit
          </Button>
        )}
      </div>

      {/* Read-only summary */}
      {submitted && !editing && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <CardTitle className="text-base">BIT Completed</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {confirmedBarriers.length === 0 ? (
              <p className="text-sm text-slate-500">No barriers identified.</p>
            ) : (
              confirmedBarriers.map(b => (
                <div key={b.key} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{b.key}</p>
                  {barrierState[b.key]?.selectedChallenges?.length > 0 && (
                    <p className="text-xs text-slate-500 mt-0.5">Challenges: {barrierState[b.key].selectedChallenges.join(", ")}</p>
                  )}
                  {barrierState[b.key]?.notes && (
                    <p className="text-xs text-slate-400 mt-0.5">{barrierState[b.key].notes}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {editing && (
        <>
          {/* Participant Info */}
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Participant Information</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={`${client?.first_name || ""} ${client?.last_name || ""}`.trim()} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} disabled className="bg-slate-50" />
              </div>
              <div className="space-y-1">
                <Label>Assessor</Label>
                <Input value={assessorName} onChange={e => setAssessorName(e.target.value)} placeholder="Assessor name" />
              </div>
            </CardContent>
          </Card>

          {/* Barrier Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Barrier Identification</CardTitle>
              <p className="text-xs text-slate-500">For each barrier, confirm whether support is needed, then select applicable challenges and actions.</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto" onClick={e => e.stopPropagation()}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200">
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-700 w-[150px]">Barrier</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-700 w-[110px]">Support Needed?</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-700 w-[200px]">Challenges</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-700 w-[200px]">Recommended Actions</th>
                      <th className="text-left px-4 py-2.5 font-semibold text-slate-700">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {BIT_BARRIERS.map(b => {
                      const state = barrierState[b.key];
                      const isYes = state.confirmed === true;
                      const isNo = state.confirmed === false;
                      const challengesId = `${b.key}_challenges`;
                      const actionsId = `${b.key}_actions`;
                      return (
                        <tr key={b.key} className={isYes ? "bg-amber-50" : "bg-white"}>
                          <td className="px-4 py-3 font-medium text-slate-800 align-top">{b.key}</td>
                          <td className="px-4 py-3 align-top">
                            <div className="flex flex-col gap-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`barrier_${b.key}`}
                                  checked={isYes}
                                  onChange={() => setConfirmed(b.key, true)}
                                  className="accent-amber-500 w-4 h-4"
                                />
                                <span className={`text-sm ${isYes ? "font-semibold text-amber-700" : "text-slate-600"}`}>Yes</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="radio"
                                  name={`barrier_${b.key}`}
                                  checked={isNo}
                                  onChange={() => setConfirmed(b.key, false)}
                                  className="accent-slate-400 w-4 h-4"
                                />
                                <span className={`text-sm ${isNo ? "text-slate-700" : "text-slate-400"}`}>No</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 align-top">
                            <ChecklistCell
                              options={b.examples}
                              selected={state.selectedChallenges}
                              onToggle={(item) => toggleItem(b.key, "selectedChallenges", item)}
                              otherValues={state.challengeOthers}
                              onOtherChange={(i, val) => setBarrierState(prev => { const a = [...prev[b.key].challengeOthers]; a[i] = val; return { ...prev, [b.key]: { ...prev[b.key], challengeOthers: a } }; })}
                              onAddOther={() => setBarrierState(prev => ({ ...prev, [b.key]: { ...prev[b.key], challengeOthers: [...prev[b.key].challengeOthers, ""] } }))}
                              onRemoveOther={(i) => setBarrierState(prev => { const a = prev[b.key].challengeOthers.filter((_, idx) => idx !== i); return { ...prev, [b.key]: { ...prev[b.key], challengeOthers: a.length ? a : [""] } }; })}
                              open={openDropdown === challengesId}
                              onToggleOpen={(e) => { e?.stopPropagation(); toggleDropdown(challengesId); }}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <ChecklistCell
                              options={b.actions}
                              selected={state.selectedActions}
                              onToggle={(item) => toggleItem(b.key, "selectedActions", item)}
                              otherValues={state.actionOthers}
                              onOtherChange={(i, val) => setBarrierState(prev => { const a = [...prev[b.key].actionOthers]; a[i] = val; return { ...prev, [b.key]: { ...prev[b.key], actionOthers: a } }; })}
                              onAddOther={() => setBarrierState(prev => ({ ...prev, [b.key]: { ...prev[b.key], actionOthers: [...prev[b.key].actionOthers, ""] } }))}
                              onRemoveOther={(i) => setBarrierState(prev => { const a = prev[b.key].actionOthers.filter((_, idx) => idx !== i); return { ...prev, [b.key]: { ...prev[b.key], actionOthers: a.length ? a : [""] } }; })}
                              open={openDropdown === actionsId}
                              onToggleOpen={(e) => { e?.stopPropagation(); toggleDropdown(actionsId); }}
                            />
                          </td>
                          <td className="px-4 py-3 align-top">
                            <Textarea
                              rows={2}
                              value={state.notes}
                              onChange={e => setField(b.key, "notes", e.target.value)}
                              placeholder="Additional notes..."
                              className="text-xs resize-none min-w-[140px]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Action Plan Summary */}
          <Card>
            <CardHeader><CardTitle className="text-base">Action Plan Summary</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-1">
                <Label>Key Barriers Identified</Label>
                {confirmedBarriers.length > 0 ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-md px-3 py-2 space-y-1">
                    {confirmedBarriers.map(b => (
                      <div key={b.key} className="flex items-center gap-2 text-sm">
                        <span className="text-slate-400">•</span>
                        <span className="font-medium text-slate-800">{b.key}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No barriers marked Yes yet.</p>
                )}
              </div>

              <div className="space-y-1">
                <Label>Action Plan Recommendations</Label>
                <Textarea
                  rows={4}
                  value={actionPlan.recommendations}
                  onChange={e => setActionPlan(p => ({ ...p, recommendations: e.target.value }))}
                  placeholder="List recommended actions for each identified barrier..."
                />
              </div>

              <div className="space-y-2">
                <Label>Check-in Frequency</Label>
                <div className="flex gap-4 flex-wrap">
                  {CHECKIN_FREQUENCIES.map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="checkin_frequency" checked={actionPlan.checkin_frequency === f} onChange={() => setActionPlan(p => ({ ...p, checkin_frequency: f }))} className="accent-blue-600 w-4 h-4" />
                      {f}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Method of Follow-Up</Label>
                <div className="flex gap-4 flex-wrap items-center">
                  {FOLLOWUP_METHODS.map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="checkbox" checked={actionPlan.followup_methods.includes(m)} onChange={() => toggleFollowupMethod(m)} className="accent-blue-600 w-4 h-4" />
                      {m}
                    </label>
                  ))}
                  {actionPlan.followup_methods.includes("Other") && (
                    <Input className="w-40 h-7 text-xs" placeholder="Specify..." value={actionPlan.followup_other} onChange={e => setActionPlan(p => ({ ...p, followup_other: e.target.value }))} />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Review Dates</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {["1st", "2nd", "3rd", "4th"].map((ord, i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-xs text-slate-500">{ord} Review Date</label>
                      <Input type="date" value={actionPlan.review_dates[i]} onChange={e => { const d = [...actionPlan.review_dates]; d[i] = e.target.value; setActionPlan(p => ({ ...p, review_dates: d })); }} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Progress</Label>
                <div className="flex gap-4 flex-wrap">
                  {PROGRESS_OPTIONS.map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input type="radio" name="progress" checked={actionPlan.progress === opt} onChange={() => setActionPlan(p => ({ ...p, progress: opt }))} className="accent-blue-600 w-4 h-4" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Label>Additional Notes</Label>
                <Textarea rows={3} value={actionPlan.additional_notes} onChange={e => setActionPlan(p => ({ ...p, additional_notes: e.target.value }))} placeholder="Any additional context or observations..." />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            {submitted && <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={saving} className="gap-2">
                {saving ? "Saving…" : submitted ? "Save & Continue" : "Finish & Continue"} <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {submitted && !editing && (
        <div className="flex justify-end">
          <Button onClick={onComplete} className="gap-2">
            Continue to Next Step <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}