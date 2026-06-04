import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, ChevronRight, Pencil, Copy, Check, Map, CheckCircle2, Briefcase, Plus, Trash2 } from "lucide-react";
import { EXPOSURE_COURSE_TYPES } from "./ExposuresSupportsStep";
import { base44 } from "@/api/base44Client";
import { createCompassTask, taskActionPlan } from "@/lib/compassTasks";
import ActionPlanRoadmap from "./ActionPlanRoadmap.jsx";

const EMPLOYMENT_SUPPORT_TYPES = [
  "PPE (Personal Protective Equipment)",
  "Work Boots / Safety Footwear",
  "Tools / Equipment",
  "Work Clothing / Uniform",
  "Transportation Support",
  "Licensing / Certification Fees",
  "Other",
];

const ACTION_PLAN_OPTIONS = [
  { key: "job_search_workshop", label: "Job Search Workshop", category: "workshops" },
  { key: "resume_writing_workshop", label: "Resume Writing Workshop", category: "workshops" },
  { key: "interview_skills_workshop", label: "Interview Skills Workshop", category: "workshops" },
  { key: "workplace_readiness_workshop", label: "Workplace Readiness Workshop", category: "workshops" },
  { key: "financial_literacy_workshop", label: "Financial Literacy Workshop", category: "workshops" },
  { key: "digital_literacy_workshop", label: "Digital Literacy Workshop", category: "workshops" },
  { key: "empoweru", label: "EmpowerU Program", category: "programs" },
  { key: "ell_classes", label: "ELL Classes", category: "programs" },
  { key: "skills_assessment", label: "Skills Assessment", category: "programs" },
  { key: "internal_placement", label: "Internal Placement (Pathways only)", category: "placement" },
  { key: "exposure_course", label: "Exposure Course / Training", category: "placement" },
  { key: "paid_external_placement", label: "Paid External Placement", category: "placement" },
  { key: "employment_supports", label: "Employment Supports (PPE, tools, etc.)", category: "supports" },
  { key: "job_applications", label: "Apply to Minimum 5 Jobs/Week", category: "job_search" },
  { key: "networking", label: "Connect with Employer Network", category: "job_search" },
  { key: "barrier_support", label: "Address Barriers (per BIT)", category: "supports" },
  { key: "other", label: "Other", category: "other" },
];

const CATEGORIES = [
  { key: "workshops", label: "Workshops" },
  { key: "programs", label: "Programs" },
  { key: "placement", label: "Placement / Training" },
  { key: "job_search", label: "Job Search" },
  { key: "supports", label: "Supports" },
  { key: "other", label: "Other" },
];

// DEA-specific options (no placements)
const DEA_EDA_OPTIONS = ACTION_PLAN_OPTIONS.filter(o => o.category !== "placement");

function buildDEACompassText(itemDetails, client, notes, deaTimeline) {
  const maxSlot = Math.max(3, Object.keys(itemDetails).filter(k => k.startsWith("eda_")).length);
  const slots = Array.from({ length: maxSlot }, (_, i) => i + 1).map(n => {
    const d = itemDetails[`eda_${n}`] || {};
    if (!d.activity) return null;
    const opt = DEA_EDA_OPTIONS.find(o => o.key === d.activity);
    const label = d.activity === "other" ? (d.other_desc || "Other") : (opt?.label || d.activity);
    const parts = [`  EDA ${n}: ${label}`];
    parts.push(`    Timeline: ${deaTimeline}`);
    if (d.notes) parts.push(`    Notes: ${d.notes}`);
    return parts.join("\n");
  }).filter(Boolean);

  if (slots.length === 0) return "";
  let text = `DEA Employment Action Plan — Employment Development Activities:\n${slots.join("\n")}`;

  const barriers = [];
  for (let n = 1; n <= 3; n++) {
    const b = client?.[`barrier_${n}`];
    if (!b) continue;
    const label = b === "Other" ? (client[`barrier_${n}_other`] || "Other") : b;
    barriers.push(`  • ${label}`);
  }
  if (barriers.length > 0) text += `\n\nBarriers to Address:\n${barriers.join("\n")}`;
  if (notes?.trim()) text += `\n\nAdditional Notes: ${notes.trim()}`;
  return text;
}

function buildCompassText(items, otherDesc, itemDetails, client, notes) {
  if (items.length === 0) return "";
  const lines = items.map(key => {
    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
    if (key === "other") return `• ${otherDesc || "Other (see notes)"}`;
    return `• ${opt?.label || key}`;
  });

  let text = `Employment Action Plan:\n${lines.join("\n")}`;

  // Barriers section
  const barriers = [];
  for (let n = 1; n <= 3; n++) {
    const b = client?.[`barrier_${n}`];
    if (!b) continue;
    const label = b === "Other" ? (client[`barrier_${n}_other`] || "Other") : b;
    const start = client[`barrier_${n}_timeline_start`];
    const end = client[`barrier_${n}_timeline_end`];
    const timeline = start || end ? ` (${[start, end].filter(Boolean).join(" – ")})` : "";
    barriers.push(`  • ${label}${timeline}`);
  }
  if (barriers.length > 0) {
    text += `\n\nBarriers to Address:\n${barriers.join("\n")}`;
  }

  // Exposure courses
  if (items.includes("exposure_course")) {
    text += `\n\nExposure Course/Training: Planned`;
  }

  // Internal placement
  if (client?.internal_placement && client.internal_placement !== "none") {
    const placements = {
      cleaning_arc: "Cleaning Services (ARC)",
      food_services_onsite: "Food Services (Onsite)",
      food_services_offsite: "Food Services (Offsite)",
      reception: "Reception",
      childcare: "Childcare",
    };
    const label = placements[client.internal_placement] || client.internal_placement;
    const start = client.placement_start_date;
    const end = client.placement_end_date;
    const timeline = start || end ? ` (${[start, end].filter(Boolean).join(" – ")})` : "";
    text += `\n\nInternal Placement: ${label}${timeline}`;
    if (client.placement_supervisor) text += `\n  Supervisor: ${client.placement_supervisor}`;
  }

  // Paraphrased notes
  if (notes?.trim()) {
    text += `\n\nAdditional Notes: ${notes.trim()}`;
  }

  return text;
}

export default function EmploymentActionPlan({ client, onSave, onComplete }) {
  const [submitted, setSubmitted] = useState(client?.action_plan_submitted || false);
  const [editing, setEditing] = useState(!client?.action_plan_submitted);

  // Auto-populate barrier_support if barriers were identified
  const hasBarriers = client?.barriers_addressed && client?.barrier_1;
  const defaultItems = client?.sdp_items
    ? client.sdp_items
    : hasBarriers ? ["barrier_support"] : [];

  const [selectedItems, setSelectedItems] = useState(defaultItems);
  const [itemDetails, setItemDetails] = useState(client?.sdp_item_details || {});
  const [otherDesc, setOtherDesc] = useState(client?.sdp_other_desc || "");
  const [notes, setNotes] = useState(client?.sdp_notes || "");
  // DEA: dynamic slot count — start with however many eda_N keys exist (min 3)
  const initSlotCount = (() => {
    const keys = Object.keys(client?.sdp_item_details || {}).filter(k => k.startsWith("eda_"));
    return Math.max(3, keys.length);
  })();
  const [edaSlotCount, setEdaSlotCount] = useState(initSlotCount);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);
  const [compassEntered, setCompassEntered] = useState(client?.action_plan_compass_entered || false);
  const [markingCompass, setMarkingCompass] = useState(false);

  const isDEA = client?.service_type === "direct_to_employment";

  // For DEA: timeline is always 2 weeks from service_start_date
  const deaTimeline = (() => {
    if (!client?.service_start_date) return "Within 2 weeks of program start";
    const start = new Date(client.service_start_date);
    start.setDate(start.getDate() + 14);
    return start.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
  })();

  const compassText = isDEA
    ? buildDEACompassText(itemDetails, client, notes, deaTimeline)
    : buildCompassText(selectedItems, otherDesc, itemDetails, client, notes);

  const toggleItem = (key) => {
    setSelectedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const updateDetail = (key, field, val) => {
    setItemDetails(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compassText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMarkCompassEntered = async () => {
    setMarkingCompass(true);
    const newVal = !compassEntered;
    await onSave({ action_plan_compass_entered: newVal });
    setCompassEntered(newVal);
    setMarkingCompass(false);
  };

  const buildSaveData = () => ({
    sdp_items: selectedItems,
    sdp_item_details: itemDetails,
    sdp_other_desc: otherDesc,
    sdp_notes: notes,
    action_plan_submitted: true,
  });

  const handleSubmit = async (andContinue = false) => {
    setSaving(true);
    const data = buildSaveData();
    await onSave(data);
    // Trigger Compass task for action plan submission
    const updatedClient = { ...client, ...data };
    await createCompassTask({
      client_id: client.id,
      client_name: `${client.first_name} ${client.last_name}`,
      compass_hsid: client.compass_hsid,
      assigned_worker: client.assigned_worker,
      assigned_worker_name: client.assigned_worker_name,
      ...taskActionPlan(updatedClient),
    });
    setSubmitted(true);
    setEditing(false);
    setSaving(false);
    if (andContinue) onComplete?.();
  };

  const isPathways = client?.service_type === "pathways";
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step 3 — Employment Action Plan</h2>
          <p className="text-sm text-slate-500 mt-1">Build a customized action plan to guide the client's pathway to employment.</p>
        </div>
        <div className="flex gap-2">
          {selectedItems.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => setShowRoadmap(v => !v)} className="gap-2">
              <Map className="w-4 h-4" /> {showRoadmap ? "Hide" : "View"} Roadmap
            </Button>
          )}
          {submitted && !editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
              <Pencil className="w-4 h-4" /> Edit Plan
            </Button>
          )}
        </div>
      </div>

      {showRoadmap && selectedItems.length > 0 && (
        <ActionPlanRoadmap
          client={client}
          selectedItems={selectedItems}
          itemDetails={itemDetails}
          otherDesc={otherDesc}
          onUpdateDetail={updateDetail}
        />
      )}

      {/* Read-only view */}
      {submitted && !editing && (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Current Action Plan</CardTitle></CardHeader>
            <CardContent>
              {isDEA ? (
                <div className="space-y-3">
                  {Array.from({ length: edaSlotCount }, (_, i) => i + 1).map(n => {
                    const d = itemDetails[`eda_${n}`] || {};
                    const opt = DEA_EDA_OPTIONS.find(o => o.key === d.activity);
                    return (
                      <div key={n} className="border border-slate-100 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">EDA {n}</span>
                          <span className="font-medium text-slate-800 text-sm">
                            {d.activity ? (d.activity === "other" ? (d.other_desc || "Other") : opt?.label) : <span className="text-slate-400 italic">Not set</span>}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">Timeline: {deaTimeline}</p>
                        {d.notes && <p className="text-xs text-slate-500">Notes: {d.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedItems.length === 0 && <p className="text-slate-400 text-sm italic">No items selected.</p>}
                  {selectedItems.map(key => {
                    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
                    const detail = itemDetails[key] || {};
                    return (
                      <div key={key} className="flex flex-col gap-1 border border-slate-100 rounded-lg p-3 bg-slate-50">
                        <span className="font-medium text-slate-800 text-sm">✓ {key === "other" ? (otherDesc || "Other") : opt?.label}</span>
                        {detail.support_type && <span className="text-xs text-slate-500">Support Type: {detail.support_type}</span>}
                        {detail.timeline && <span className="text-xs text-slate-500">Timeline: {detail.timeline}</span>}
                        {detail.notes && <span className="text-xs text-slate-500">Notes: {detail.notes}</span>}
                      </div>
                    );
                  })}
                </div>
              )}
              {notes && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-medium">Additional Notes:</p>
                  <p className="text-sm text-slate-700 mt-1">{notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compass entry — always visible until marked as entered */}
          {!compassEntered ? (
            <Card className="border-amber-300 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="text-amber-800">For Entry into Compass</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                      {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button size="sm" onClick={handleMarkCompassEntered} disabled={markingCompass} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="w-4 h-4" />
                      {markingCompass ? "Saving…" : "Mark as Entered"}
                    </Button>
                  </div>
                </CardTitle>
                <p className="text-xs text-amber-700">Copy and paste into Compass, then mark as entered to dismiss this notice.</p>
              </CardHeader>
              <CardContent>
                <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-white border border-amber-200 rounded-lg p-3 min-h-16">
                  {compassText || "No action plan items to display."}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Action plan entered into Compass.</span>
              <button onClick={handleMarkCompassEntered} disabled={markingCompass} className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline">
                Undo
              </button>
            </div>
          )}
        </>
      )}

      {/* Edit view */}
      {editing && (
        <>
          {/* Intake Summary — auto-populated from intake */}
          <IntakeSummary client={client} notes={notes} setNotes={setNotes} />

          {/* Action Plan Items */}
          {isDEA ? (
            // DEA: dynamic EDA slots (min 3, add more as needed)
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" /> Employment Development Activities (EDA)
                </CardTitle>
                <p className="text-xs text-slate-500">Select one activity per EDA slot. At least 3 are required.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: edaSlotCount }, (_, i) => i + 1).map(n => {
                  const slotKey = `eda_${n}`;
                  const d = itemDetails[slotKey] || {};
                  const updateSlot = (field, val) => updateDetail(slotKey, field, val);
                  const isExtra = n > 3;
                  return (
                    <div key={n} className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-primary bg-primary/10 rounded-full px-2.5 py-0.5">EDA {n}</span>
                          <span className="text-xs text-slate-400">{isExtra ? "Additional activity" : `Required activity #${n}`}</span>
                        </div>
                        {isExtra && (
                          <button
                            type="button"
                            onClick={() => {
                              // Remove this slot and compact remaining
                              const newDetails = { ...itemDetails };
                              delete newDetails[slotKey];
                              // Shift down any slots above this one
                              for (let i = n + 1; i <= edaSlotCount; i++) {
                                newDetails[`eda_${i - 1}`] = newDetails[`eda_${i}`];
                                delete newDetails[`eda_${i}`];
                              }
                              setItemDetails(newDetails);
                              setEdaSlotCount(c => c - 1);
                            }}
                            className="text-slate-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Remove this EDA"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs mb-1 block">Activity Type *</Label>
                        <Select value={d.activity || ""} onValueChange={v => updateSlot("activity", v)}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select activity..." /></SelectTrigger>
                          <SelectContent>
                            {DEA_EDA_OPTIONS.map(opt => (
                              <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {d.activity === "other" && (
                        <div>
                          <Label className="text-xs mb-1 block">Describe this activity</Label>
                          <Input value={d.other_desc || ""} onChange={e => updateSlot("other_desc", e.target.value)} placeholder="Describe the activity..." />
                        </div>
                      )}
                      {d.activity === "employment_supports" && (
                        <div>
                          <Label className="text-xs mb-1 block">Support Type</Label>
                          <Select value={d.support_type || ""} onValueChange={v => updateSlot("support_type", v)}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select support type..." /></SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_SUPPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs mb-1 block">Target Timeline</Label>
                          <div className="h-9 flex items-center px-3 rounded-md border border-slate-200 bg-slate-100 text-sm text-slate-600">
                            {deaTimeline}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs mb-1 block">Notes</Label>
                          <Textarea rows={2} value={d.notes || ""} onChange={e => updateSlot("notes", e.target.value)} placeholder="Any details..." />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full gap-2 border-dashed"
                  onClick={() => setEdaSlotCount(c => c + 1)}
                >
                  <Plus className="w-4 h-4" /> Add Another EDA
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Pathways / other: standard category checkboxes
            CATEGORIES.map(cat => {
              const catItems = ACTION_PLAN_OPTIONS.filter(o => o.category === cat.key);
              let filteredItems = catItems;
              if (cat.key === "placement" && !isPathways) {
                filteredItems = catItems.filter(o => o.key !== "internal_placement");
                if (filteredItems.length === 0) return null;
              }
              if (cat.key === "supports" && hasBarriers) {
                const others = filteredItems.filter(o => o.key !== "barrier_support");
                return (
                  <Card key={cat.key}>
                    <CardHeader><CardTitle className="text-sm text-slate-600 font-semibold">{cat.label}</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
                        <Checkbox checked disabled />
                        <span className="text-sm font-medium text-slate-700">Address Barriers (per BIT) — auto-included</span>
                      </div>
                      {others.map(opt => (
                        <ActionPlanItem key={opt.key} opt={opt} isSelected={selectedItems.includes(opt.key)} detail={itemDetails[opt.key] || {}} otherDesc={otherDesc} onToggle={toggleItem} onUpdateDetail={updateDetail} onOtherDesc={setOtherDesc} />
                      ))}
                    </CardContent>
                  </Card>
                );
              }
              return (
                <Card key={cat.key}>
                  <CardHeader><CardTitle className="text-sm text-slate-600 font-semibold">{cat.label}</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {filteredItems.map(opt => (
                      <ActionPlanItem key={opt.key} opt={opt} isSelected={selectedItems.includes(opt.key)} detail={itemDetails[opt.key] || {}} otherDesc={otherDesc} onToggle={toggleItem} onUpdateDetail={updateDetail} onOtherDesc={setOtherDesc} />
                    ))}
                  </CardContent>
                </Card>
              );
            })
          )}

          {/* Additional Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context, goals, or information for this plan..." />
            </CardContent>
          </Card>

          {/* Compass entry — placed after internal placement info is available */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>For Entry into Compass</span>
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </CardTitle>
              <p className="text-xs text-slate-500">Auto-populated from your selections above, including barriers, timelines, placements, and notes. Copy and paste into Compass.</p>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-slate-700 whitespace-pre-wrap bg-white border border-slate-200 rounded-lg p-3 min-h-16">
                {compassText || "Select action plan items above to generate Compass entry text."}
              </pre>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            {submitted && (
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            )}
            <div className="flex gap-3 ml-auto">
              <Button variant="outline" onClick={() => handleSubmit(false)} disabled={saving}>
                <Save className="w-4 h-4 mr-2" /> {saving ? "Saving…" : "Save"}
              </Button>
              <Button onClick={() => handleSubmit(true)} disabled={saving} className="gap-2">
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

const CLB_LABELS = {
  clb_1: "CLB 1", clb_2: "CLB 2", clb_3: "CLB 3", clb_4: "CLB 4",
  clb_5: "CLB 5", clb_6: "CLB 6", clb_7: "CLB 7", clb_8: "CLB 8",
  clb_9: "CLB 9", clb_10: "CLB 10", clb_11: "CLB 11", clb_12: "CLB 12",
  native_english_french: "Native English/French Speaker",
};

const EMPLOYMENT_STATUS_LABELS = {
  "E-RF": "Employed – Related Field", "E-UF": "Employed – Unrelated Field",
  "E-PT": "Employed – Part Time", "UE": "Unemployed",
  "UE-LA": "Unemployed – Long-term Absent", "UE-S": "Unemployed – Student", "NA": "N/A",
};

function IntakeSummary({ client, notes, setNotes }) {
  const fields = [
    { label: "Current Employment Status", value: EMPLOYMENT_STATUS_LABELS[client?.employment_status] || client?.employment_status },
    { label: "CLB Level", value: CLB_LABELS[client?.clb_level] || client?.clb_level },
    { label: "Service Stream", value: client?.service_type?.replace(/_/g, " ") },
    { label: "Career Objectives", value: client?.career_objectives },
    { label: "Employment History", value: client?.employment_history },
    { label: "Intake Notes", value: client?.intake_notes },
  ].filter(f => f.value);

  if (fields.length === 0) return null;

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="text-base text-blue-800">Client Intake Summary</CardTitle>
        <p className="text-xs text-blue-600">Auto-populated from intake. Use this to inform the plan below.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {fields.map(f => (
            <div key={f.label} className="space-y-0.5">
              <p className="text-xs font-semibold text-blue-700">{f.label}</p>
              <p className="text-sm text-slate-700 bg-white border border-blue-100 rounded px-2 py-1 whitespace-pre-wrap">{f.value}</p>
            </div>
          ))}
        </div>
        {(client?.internal_referrals?.length > 0 || client?.external_referrals?.length > 0) && (
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-blue-700">Referrals at Intake</p>
            <p className="text-sm text-slate-700 bg-white border border-blue-100 rounded px-2 py-1">
              {[...(client?.internal_referrals || []), ...(client?.external_referrals || [])].join(", ")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionPlanItem({ opt, isSelected, detail, otherDesc, onToggle, onUpdateDetail, onOtherDesc }) {
  const isEmploymentSupport = opt.key === "employment_supports";
  const isExposureCourse = opt.key === "exposure_course";
  const isOther = opt.key === "other";
  const showDetail = isSelected;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div
        className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
        onClick={() => onToggle(opt.key)}
      >
        <Checkbox checked={isSelected} onCheckedChange={() => onToggle(opt.key)} onClick={e => e.stopPropagation()} />
        <span className={`flex-1 text-sm ${isSelected ? "font-medium text-slate-800" : "text-slate-600"}`}>{opt.label}</span>
      </div>
      {showDetail && (
        <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 space-y-3">
          {isOther && (
            <div className="space-y-1">
              <Label className="text-xs">Describe this item</Label>
              <Input value={otherDesc} onChange={e => onOtherDesc(e.target.value)} placeholder="Describe the action plan item..." />
            </div>
          )}
          {isExposureCourse && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Course Types Planned (select all that apply)</Label>
                <div className="space-y-1.5">
                  {EXPOSURE_COURSE_TYPES.map(ct => {
                    const selected = (detail.course_types || []).includes(ct);
                    return (
                      <label key={ct} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => {
                            const current = detail.course_types || [];
                            onUpdateDetail(opt.key, "course_types", selected ? current.filter(c => c !== ct) : [...current, ct]);
                          }}
                        />
                        <span className="text-sm text-slate-700">{ct}</span>
                      </label>
                    );
                  })}
                </div>
                {(detail.course_types || []).includes("Other") && (
                  <div className="space-y-1 mt-2">
                    <Label className="text-xs">Specify other course type</Label>
                    <Input value={detail.course_type_other || ""} onChange={e => onUpdateDetail(opt.key, "course_type_other", e.target.value)} placeholder="Describe the course..." />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Target Timeline</Label>
                  <Input value={detail.timeline || ""} onChange={e => onUpdateDetail(opt.key, "timeline", e.target.value)} placeholder="e.g. Within 2 weeks, by March 15..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Notes</Label>
                  <Textarea rows={2} value={detail.notes || ""} onChange={e => onUpdateDetail(opt.key, "notes", e.target.value)} placeholder="Any additional details..." />
                </div>
              </div>
            </>
          )}
          {isEmploymentSupport && (
            <>
              <div className="space-y-1">
                <Label className="text-xs">Employment Support Type</Label>
                <Select value={detail.support_type || ""} onValueChange={v => onUpdateDetail(opt.key, "support_type", v)}>
                  <SelectTrigger><SelectValue placeholder="Select support type..." /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_SUPPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target Timeline</Label>
                <Input value={detail.timeline || ""} onChange={e => onUpdateDetail(opt.key, "timeline", e.target.value)} placeholder="e.g. Within 2 weeks, by March 15..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description / Notes</Label>
                <Textarea rows={2} value={detail.notes || ""} onChange={e => onUpdateDetail(opt.key, "notes", e.target.value)} placeholder="Any additional details..." />
              </div>
            </>
          )}
          {!isOther && !isExposureCourse && !isEmploymentSupport && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Target Timeline</Label>
                <Input value={detail.timeline || ""} onChange={e => onUpdateDetail(opt.key, "timeline", e.target.value)} placeholder="e.g. Within 2 weeks, by March 15..." />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Description / Notes</Label>
                <Textarea rows={2} value={detail.notes || ""} onChange={e => onUpdateDetail(opt.key, "notes", e.target.value)} placeholder="Any additional details..." />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}