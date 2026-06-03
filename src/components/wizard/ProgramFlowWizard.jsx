import { useState } from "react";
import { CheckCircle2, Circle, ChevronRight, Lock } from "lucide-react";
import BarrierIdentificationTool from "./BarrierIdentificationTool";
import BarrierActionPlan from "./BarrierActionPlan";
import EmploymentActionPlan from "./EmploymentActionPlan";
import InternalPlacementStep from "./InternalPlacementStep";
import ExposuresSupportsStep from "./ExposuresSupportsStep";

const STEPS = [
  { key: "bit", label: "Barrier Identification", short: "BIT" },
  { key: "barrier_action_plan", label: "Barrier Resolution Plan", short: "Barrier Resolution" },
  { key: "employment_action_plan", label: "Employment Action Plan", short: "Emp. Action Plan" },
  { key: "internal_placement", label: "Internal Placement", short: "Placement", pathwaysOnly: true },
  { key: "exposures", label: "Exposure Courses & Supports", short: "Supports" },
];

export default function ProgramFlowWizard({ client, onSave }) {
  const [activeStep, setActiveStep] = useState("bit");

  const isPathways = client?.service_type === "pathways";
  const steps = STEPS.filter(s => !s.pathwaysOnly || isPathways);

  const getStepStatus = (stepKey) => {
    switch (stepKey) {
      case "bit":
        return client?.bit_completed ? "done" : "active";
      case "barrier_action_plan":
        if (!client?.barriers_addressed) return "skipped";
        return client?.barrier_action_plan_completed ? "done" : client?.bit_completed ? "active" : "pending";
      case "employment_action_plan":
        return client?.action_plan_submitted ? "done" : client?.bit_completed ? "active" : "pending";
      case "internal_placement":
        if (!isPathways) return "skipped";
        if (!client?.internal_placement || client.internal_placement === "none") return "pending";
        return client?.placement_request_sent ? "done" : "active";
      case "exposures":
        return (client?.exposure_course || client?.paid_external_placement || client?.employment_supports || client?.external_employer)
          ? "done"
          : "active";
      default:
        return "pending";
    }
  };

  const statusConfig = {
    done: { icon: CheckCircle2, ring: "border-green-500 bg-green-50", text: "text-green-700", badge: "bg-green-100 text-green-700", label: "Complete" },
    active: { icon: Circle, ring: "border-primary bg-primary/5", text: "text-primary", badge: "bg-primary/10 text-primary", label: "In Progress" },
    pending: { icon: Circle, ring: "border-slate-200 bg-slate-50", text: "text-slate-400", badge: "bg-slate-100 text-slate-500", label: "Pending" },
    skipped: { icon: CheckCircle2, ring: "border-slate-200 bg-slate-50", text: "text-slate-300", badge: "bg-slate-100 text-slate-400", label: "N/A" },
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Step sidebar */}
      <div className="w-56 shrink-0">
        <div className="sticky top-6 space-y-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-3">Program Steps</p>
          {steps.map((step, i) => {
            const status = getStepStatus(step.key);
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            const isActive = activeStep === step.key;
            return (
              <button
                key={step.key}
                onClick={() => setActiveStep(step.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isActive ? "border-white/60 bg-white/20" : cfg.ring}`}>
                  <span className={`text-xs font-bold ${isActive ? "text-white" : cfg.text}`}>{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{step.short}</div>
                  {!isActive && (
                    <div className={`text-xs ${isActive ? "text-white/70" : "text-slate-400"}`}>{cfg.label}</div>
                  )}
                </div>
                {status === "done" && !isActive && (
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        {activeStep === "bit" && (
          <BarrierIdentificationTool client={client} onSave={onSave} onComplete={() => setActiveStep("barrier_action_plan")} />
        )}
        {activeStep === "barrier_action_plan" && (
          <BarrierActionPlan client={client} onSave={onSave} onComplete={() => setActiveStep("employment_action_plan")} />
        )}
        {activeStep === "employment_action_plan" && (
          <EmploymentActionPlan client={client} onSave={onSave} onComplete={() => setActiveStep(isPathways ? "internal_placement" : "exposures")} />
        )}
        {activeStep === "internal_placement" && isPathways && (
          <InternalPlacementStep client={client} onSave={onSave} onComplete={() => setActiveStep("exposures")} />
        )}
        {activeStep === "exposures" && (
          <ExposuresSupportsStep client={client} onSave={onSave} />
        )}
      </div>
    </div>
  );
}