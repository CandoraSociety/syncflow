import { useState } from "react";
import { addWeeks, format, parseISO, isValid } from "date-fns";
import { CheckCircle2, Circle, Clock, AlertTriangle, Flag, CalendarCheck, List, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import RoadmapItemPanel from "./RoadmapItemPanel";
import BITReviewCheckinPanel from "./BITReviewCheckinPanel";

const ACTION_PLAN_OPTIONS = [
  { key: "job_search_workshop", label: "Job Search Workshop" },
  { key: "resume_writing_workshop", label: "Resume Writing Workshop" },
  { key: "interview_skills_workshop", label: "Interview Skills Workshop" },
  { key: "workplace_readiness_workshop", label: "Workplace Readiness Workshop" },
  { key: "financial_literacy_workshop", label: "Financial Literacy Workshop" },
  { key: "digital_literacy_workshop", label: "Digital Literacy Workshop" },
  { key: "empoweru", label: "EmpowerU Program" },
  { key: "ell_classes", label: "ELL Classes" },
  { key: "skills_assessment", label: "Skills Assessment" },
  { key: "internal_placement", label: "Internal Placement" },
  { key: "exposure_course", label: "Exposure Course / Training" },
  { key: "paid_external_placement", label: "Paid External Placement" },
  { key: "employment_supports", label: "Employment Supports" },
  { key: "job_applications", label: "Apply to Minimum 5 Jobs/Week" },
  { key: "networking", label: "Connect with Employer Network" },
  { key: "barrier_support", label: "Address Barriers (per BIT)" },
  { key: "other", label: "Other" },
];

const STATUS_CONFIG = {
  planned: { icon: Circle, color: "text-slate-400", bg: "bg-slate-50", border: "border-slate-200", badge: "bg-slate-100 text-slate-500", label: "Planned" },
  started: { icon: Clock, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700", label: "Started" },
  completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", border: "border-green-200", badge: "bg-green-100 text-green-700", label: "Completed" },
};

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc, onUpdateDetail, onClientUpdate }) {
  const [viewMode, setViewMode] = useState("list"); // "list" | "gantt"
  const [openItem, setOpenItem] = useState(null); // key of open panel
  const [openBITReview, setOpenBITReview] = useState(null); // index of open BIT review
  const [saving, setSaving] = useState(false);

  const roadmapStatus = client?.roadmap_item_status || {};
  const bitCheckins = client?.bit_review_checkins || [];
  const bitReviewDates = client?.bit_review_dates || [];

  // Program dates
  const serviceStart = client?.service_start_date ? parseISO(client.service_start_date) : null;
  const isPathways = client?.service_type === "pathways";
  const programWeeks = isPathways ? 16 : 2;
  const projectedEnd = serviceStart ? addWeeks(serviceStart, programWeeks) : null;
  const actualEnd = client?.completion_date ? parseISO(client.completion_date) : null;
  const followup90 = actualEnd ? addWeeks(actualEnd, 13) : null; // ~90 days

  // Build items list
  const items = selectedItems.map(key => {
    const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
    const detail = itemDetails?.[key] || {};
    const status = roadmapStatus[key] || {};
    return {
      key,
      label: key === "other" ? (otherDesc || "Other") : (opt?.label || key),
      detail,
      status: status.status || "planned",
      statusData: status,
      isBarrier: false,
      compassHsid: client?.compass_hsid,
    };
  });

  // Add barrier items
  for (let n = 1; n <= 3; n++) {
    const b = client?.[`barrier_${n}`];
    if (!b) continue;
    const key = `barrier_${n}`;
    const label = b === "Other" ? (client[`barrier_${n}_other`] || "Other") : b;
    const status = roadmapStatus[key] || {};
    items.push({
      key,
      label: `Barrier: ${label}`,
      isBarrier: true,
      detail: {
        status: client[`barrier_${n}_status`],
        action_steps: client[`barrier_${n}_action_steps`],
        notes: client[`barrier_${n}_notes`],
        timeline_start: client[`barrier_${n}_timeline_start`],
        timeline_end: client[`barrier_${n}_timeline_end`],
      },
      status: status.status || "planned",
      statusData: status,
      compassHsid: client?.compass_hsid,
    });
  }

  async function handleSaveItem(key, saveData) {
    setSaving(true);
    const prev = roadmapStatus[key] || {};
    const newStatus = {
      ...prev,
      status: saveData.status,
      started_date: saveData.startedDate || prev.started_date,
      completed_date: saveData.completedDate || prev.completed_date,
      case_manager_notes: saveData.notes,
    };
    const updated = { ...roadmapStatus, [key]: newStatus };

    // Also update barrier timeline if applicable
    const extraFields = {};
    if (key.startsWith("barrier_")) {
      const n = key.split("_")[1];
      if (saveData.startDate) extraFields[`barrier_${n}_timeline_start`] = saveData.startDate;
      if (saveData.endDate) extraFields[`barrier_${n}_timeline_end`] = saveData.endDate;
    }

    await base44.entities.Client.update(client.id, { roadmap_item_status: updated, ...extraFields });
    onClientUpdate?.({ ...client, roadmap_item_status: updated, ...extraFields });
    setOpenItem(null);
    setSaving(false);
  }

  async function handleSaveBITCheckin(index, checkinData) {
    setSaving(true);
    const existing = [...bitCheckins];
    existing[index] = { ...existing[index], ...checkinData, index, logged_at: new Date().toISOString() };
    await base44.entities.Client.update(client.id, { bit_review_checkins: existing });
    onClientUpdate?.({ ...client, bit_review_checkins: existing });
    setOpenBITReview(null);
    setSaving(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Program Progress</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {serviceStart ? `Started: ${format(serviceStart, "MMM d, yyyy")}` : "No start date set"}
            {projectedEnd && !actualEnd && ` · Projected end: ${format(projectedEnd, "MMM d, yyyy")}`}
            {actualEnd && ` · Completed: ${format(actualEnd, "MMM d, yyyy")}`}
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")} className="gap-1.5 h-8 text-xs">
            <List className="w-3.5 h-3.5" /> List
          </Button>
          <Button size="sm" variant={viewMode === "gantt" ? "default" : "outline"} onClick={() => setViewMode("gantt")} className="gap-1.5 h-8 text-xs">
            <BarChart2 className="w-3.5 h-3.5" /> Timeline
          </Button>
        </div>
      </div>

      {/* Program date markers */}
      {(serviceStart || projectedEnd || followup90) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {serviceStart && (
            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full">
              <Flag className="w-3 h-3" /> Program Start: {format(serviceStart, "MMM d, yyyy")}
            </span>
          )}
          {!actualEnd && projectedEnd && (
            <span className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full">
              <Flag className="w-3 h-3" /> Projected End: {format(projectedEnd, "MMM d, yyyy")}
            </span>
          )}
          {actualEnd && (
            <span className="flex items-center gap-1 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Completed: {format(actualEnd, "MMM d, yyyy")}
            </span>
          )}
          {followup90 && (
            <span className="flex items-center gap-1 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-full">
              <CalendarCheck className="w-3 h-3" /> 90-Day Follow-Up: {format(followup90, "MMM d, yyyy")}
            </span>
          )}
        </div>
      )}

      {/* Item list */}
      <div className="space-y-1">
        {items.map(item => {
          const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.planned;
          const Icon = cfg.icon;
          const isOpen = openItem === item.key;
          return (
            <div key={item.key}>
              <button
                onClick={() => setOpenItem(isOpen ? null : item.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm ${cfg.border} ${cfg.bg}`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${cfg.color}`} />
                {item.isBarrier && <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                <span className="flex-1 text-sm font-medium text-slate-800">{item.label}</span>
                {item.statusData?.started_date && item.status === "started" && (
                  <span className="text-xs text-slate-400">Started {item.statusData.started_date}</span>
                )}
                {item.statusData?.completed_date && item.status === "completed" && (
                  <span className="text-xs text-slate-400">{item.statusData.completed_date}</span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
              </button>

              {isOpen && (
                <RoadmapItemPanel
                  item={item}
                  currentStatus={item.statusData}
                  onSave={(data) => handleSaveItem(item.key, data)}
                  onCancel={() => setOpenItem(null)}
                  saving={saving}
                />
              )}
            </div>
          );
        })}

        {/* BIT Review Date rows */}
        {bitReviewDates.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-1">Scheduled BIT Review Dates</p>
            {bitReviewDates.map((date, i) => {
              const checkin = bitCheckins[i] || {};
              const isOpen = openBITReview === i;
              const isDone = checkin.completed;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenBITReview(isOpen ? null : i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all hover:shadow-sm mb-1
                      ${isDone ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"}`}
                  >
                    <CalendarCheck className={`w-4 h-4 shrink-0 ${isDone ? "text-green-600" : "text-rose-500"}`} />
                    <span className="flex-1 text-sm font-medium text-slate-800">BIT Review {i + 1}</span>
                    <span className="text-xs text-slate-500">{date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDone ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"}`}>
                      {isDone ? "Completed" : "Pending"}
                    </span>
                  </button>
                  {isOpen && (
                    <BITReviewCheckinPanel
                      reviewIndex={i}
                      scheduledDate={date}
                      checkin={checkin}
                      clientId={client.id}
                      onSave={(data) => handleSaveBITCheckin(i, data)}
                      onCancel={() => setOpenBITReview(null)}
                      saving={saving}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {items.length === 0 && bitReviewDates.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">No action plan items yet.</div>
        )}
      </div>
    </div>
  );
}