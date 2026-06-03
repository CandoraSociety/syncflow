import { useState } from "react";
import { CheckCircle2, Circle, Clock } from "lucide-react";

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
  { key: "barrier_support", label: "Address Barriers" },
  { key: "other", label: "Other" },
];

export default function ActionPlanRoadmap({ client, selectedItems, itemDetails, otherDesc }) {
  const [activeItem, setActiveItem] = useState(null);

  if (!selectedItems || selectedItems.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
        <p className="text-slate-400 text-sm">No action plan items selected yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Action Plan Roadmap — Click any item for details</h3>
      <div className="relative">
        {selectedItems.map((key, i) => {
          const opt = ACTION_PLAN_OPTIONS.find(o => o.key === key);
          const detail = itemDetails?.[key] || {};
          const label = key === "other" ? (otherDesc || "Other") : opt?.label || key;
          const isActive = activeItem === key;

          return (
            <div key={key}>
              <button
                onClick={() => setActiveItem(isActive ? null : key)}
                className={`w-full flex gap-4 p-4 rounded-xl border transition-all text-left ${
                  isActive ? "border-primary bg-primary/5" : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
                }`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-full border-2 flex items-center justify-center ${isActive ? "border-primary text-primary" : "border-slate-300 text-slate-400"}`}>
                  <span className="text-xs font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-800 text-sm">{label}</div>
                  {detail.timeline && !isActive && (
                    <div className="text-xs text-slate-500 mt-0.5">Timeline: {detail.timeline}</div>
                  )}
                </div>
                <div className="shrink-0">
                  {detail.goal ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-slate-300" />}
                </div>
              </button>

              {isActive && (
                <div className="ml-14 -mt-1 mb-1 bg-primary/5 border border-primary/20 border-t-0 rounded-b-xl px-4 py-3 space-y-1.5">
                  {detail.goal && <p className="text-sm text-slate-700"><span className="font-medium">Goal:</span> {detail.goal}</p>}
                  {detail.timeline && <p className="text-sm text-slate-700"><span className="font-medium">Timeline:</span> {detail.timeline}</p>}
                  {detail.notes && <p className="text-sm text-slate-700"><span className="font-medium">Notes:</span> {detail.notes}</p>}
                  {!detail.goal && !detail.timeline && !detail.notes && (
                    <p className="text-xs text-slate-400 italic">No additional details recorded for this item.</p>
                  )}
                </div>
              )}

              {i < selectedItems.length - 1 && (
                <div className="flex justify-start pl-5 my-0.5">
                  <div className="w-0.5 h-4 bg-slate-200 ml-4" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}