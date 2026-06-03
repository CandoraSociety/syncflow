import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Save, ChevronRight, Pencil, Copy, Check, ChevronDown, ChevronUp, Map } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createCompassTask, taskServiceNavigation } from "@/lib/compassTasks";
import ActionPlanRoadmap from "./ActionPlanRoadmap";

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

function buildCompassText(items, otherDesc) {
  if (items.length === 0) return "";
  const lines = items.map(key => {
    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
    if (key === "other") return `• ${otherDesc || "Other (see notes)"}`;
    return `• ${opt?.label || key}`;
  });
  return `Employment Action Plan:\n${lines.join("\n")}`;
}

export default function EmploymentActionPlan({ client, onSave, onComplete }) {
  const [submitted, setSubmitted] = useState(client?.action_plan_submitted || false);
  const [editing, setEditing] = useState(!client?.action_plan_submitted);
  const [selectedItems, setSelectedItems] = useState(client?.sdp_items || []);
  const [itemDetails, setItemDetails] = useState(client?.sdp_item_details || {});
  const [expanded, setExpanded] = useState({});
  const [otherDesc, setOtherDesc] = useState(client?.sdp_other_desc || "");
  const [notes, setNotes] = useState(client?.sdp_notes || "");
  const [serviceNav, setServiceNav] = useState(client?.service_navigation_supports || false);
  const [serviceNavDate, setServiceNavDate] = useState(client?.service_navigation_date || "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(false);

  const compassText = buildCompassText(selectedItems, otherDesc);

  const toggleItem = (key) => {
    setSelectedItems(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const updateDetail = (key, field, val) => {
    setItemDetails(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [field]: val } }));
  };

  const toggleExpand = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  const handleCopy = () => {
    navigator.clipboard.writeText(compassText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const buildSaveData = () => ({
    sdp_items: selectedItems,
    sdp_item_details: itemDetails,
    sdp_other_desc: otherDesc,
    sdp_notes: notes,
    service_navigation_supports: serviceNav,
    service_navigation_date: serviceNavDate,
    action_plan_submitted: true,
  });

  const handleSubmit = async (andContinue = false) => {
    setSaving(true);
    const data = buildSaveData();
    await onSave(data);

    if (serviceNav && !client?.service_navigation_supports) {
      const updatedClient = { ...client, ...data };
      const t = taskServiceNavigation(updatedClient);
      await createCompassTask({
        client_id: client.id,
        client_name: `${client.first_name} ${client.last_name}`,
        compass_hsid: client.compass_hsid,
        ...t,
      });
    }

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
        {submitted && !editing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowRoadmap(v => !v)} className="gap-2">
              <Map className="w-4 h-4" /> {showRoadmap ? "Hide" : "View"} Roadmap
            </Button>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="gap-2">
              <Pencil className="w-4 h-4" /> Edit Plan
            </Button>
          </div>
        )}
      </div>

      {showRoadmap && submitted && (
        <ActionPlanRoadmap client={client} selectedItems={selectedItems} itemDetails={itemDetails} />
      )}

      {/* Read-only view */}
      {submitted && !editing && (
        <Card>
          <CardHeader><CardTitle className="text-base">Current Action Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedItems.length === 0 && <p className="text-slate-400 text-sm italic">No items selected.</p>}
              {selectedItems.map(key => {
                const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
                const detail = itemDetails[key] || {};
                return (
                  <div key={key} className="flex flex-col gap-1 border border-slate-100 rounded-lg p-3 bg-slate-50">
                    <span className="font-medium text-slate-800 text-sm">✓ {key === "other" ? (otherDesc || "Other") : opt?.label}</span>
                    {detail.goal && <span className="text-xs text-slate-500">Goal: {detail.goal}</span>}
                    {detail.timeline && <span className="text-xs text-slate-500">Timeline: {detail.timeline}</span>}
                    {detail.notes && <span className="text-xs text-slate-500">Notes: {detail.notes}</span>}
                  </div>
                );
              })}
            </div>
            {notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-500 font-medium">Additional Notes:</p>
                <p className="text-sm text-slate-700 mt-1">{notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit view */}
      {editing && (
        <>
          {/* Service Navigation */}
          <Card>
            <CardHeader><CardTitle className="text-base">Service Navigation Supports</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Switch checked={serviceNav} onCheckedChange={setServiceNav} />
                <Label>Client received service navigation supports</Label>
              </div>
              {serviceNav && (
                <div className="space-y-1">
                  <Label>Service Navigation Date</Label>
                  <Input type="date" value={serviceNavDate} onChange={e => setServiceNavDate(e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Plan Items */}
          {CATEGORIES.map(cat => {
            const catItems = ACTION_PLAN_OPTIONS.filter(o => o.category === cat.key);
            if (cat.key === "placement" && !isPathways) {
              // Hide internal placement for non-pathways
              const filtered = catItems.filter(o => o.key !== "internal_placement");
              if (filtered.length === 0) return null;
              return <ActionPlanCategory key={cat.key} cat={cat} items={filtered} selectedItems={selectedItems} itemDetails={itemDetails} expanded={expanded} otherDesc={otherDesc} onToggle={toggleItem} onExpand={toggleExpand} onUpdateDetail={updateDetail} onOtherDesc={setOtherDesc} />;
            }
            return (
              <ActionPlanCategory key={cat.key} cat={cat} items={catItems} selectedItems={selectedItems} itemDetails={itemDetails} expanded={expanded} otherDesc={otherDesc} onToggle={toggleItem} onExpand={toggleExpand} onUpdateDetail={updateDetail} onOtherDesc={setOtherDesc} />
            );
          })}

          {/* Additional Notes */}
          <Card>
            <CardHeader><CardTitle className="text-base">Additional Notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional context, goals, or information for this plan..." />
            </CardContent>
          </Card>

          {/* Compass auto-populate field */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>For Entry into Compass</span>
                <Button size="sm" variant="outline" onClick={handleCopy} className="gap-2">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </CardTitle>
              <p className="text-xs text-slate-500">Auto-populated from your selections above. Copy and paste into Compass.</p>
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
                {saving ? "Saving…" : "Save & Continue"} <ChevronRight className="w-4 h-4" />
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

function ActionPlanCategory({ cat, items, selectedItems, itemDetails, expanded, otherDesc, onToggle, onExpand, onUpdateDetail, onOtherDesc }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-sm text-slate-600 font-semibold">{cat.label}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {items.map(opt => {
          const isSelected = selectedItems.includes(opt.key);
          const isExpanded = expanded[opt.key];
          const detail = itemDetails[opt.key] || {};
          return (
            <div key={opt.key} className="border border-slate-200 rounded-lg overflow-hidden">
              <div
                className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? "bg-primary/5" : "hover:bg-slate-50"}`}
                onClick={() => onToggle(opt.key)}
              >
                <Checkbox checked={isSelected} onCheckedChange={() => onToggle(opt.key)} onClick={e => e.stopPropagation()} />
                <span className={`flex-1 text-sm ${isSelected ? "font-medium text-slate-800" : "text-slate-600"}`}>{opt.label}</span>
                {isSelected && (
                  <button onClick={e => { e.stopPropagation(); onExpand(opt.key); }} className="text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {isSelected && isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-slate-50 border-t border-slate-100 space-y-3">
                  {opt.key === "other" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Describe this item</Label>
                      <Input value={otherDesc} onChange={e => onOtherDesc(e.target.value)} placeholder="Describe the action plan item..." />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Goal / Objective</Label>
                      <Input value={detail.goal || ""} onChange={e => onUpdateDetail(opt.key, "goal", e.target.value)} placeholder="What is the goal for this item?" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Target Timeline</Label>
                      <Input value={detail.timeline || ""} onChange={e => onUpdateDetail(opt.key, "timeline", e.target.value)} placeholder="e.g. Within 2 weeks, by March 15..." />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Notes</Label>
                    <Textarea rows={2} value={detail.notes || ""} onChange={e => onUpdateDetail(opt.key, "notes", e.target.value)} placeholder="Any additional details..." />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}