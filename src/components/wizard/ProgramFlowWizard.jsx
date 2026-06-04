import { useState } from "react";
import { CheckCircle2, Circle, Map, Menu, X } from "lucide-react";
import BarrierIdentificationTool from "./BarrierIdentificationTool";
import BarrierActionPlan from "./BarrierActionPlan";
import EmploymentActionPlan from "./EmploymentActionPlan";
import InternalPlacementStep from "./InternalPlacementStep";
import ExposuresSupportsStep from "./ExposuresSupportsStep";
import ActionPlanRoadmap from "./ActionPlanRoadmap.jsx";

const STEPS = [
  { key: "bit", label: "Barrier Identification", short: "BIT" },
  { key: "barrier_action_plan", label: "Barrier Resolution Plan", short: "Barrier Resolution" },
  { key: "employment_action_plan", label: "Employment Action Plan", short: "Emp. Action Plan" },
  { key: "internal_placement", label: "Placement", short: "Placement", pathwaysOnly: true },
  { key: "exposures", label: "Exposure Courses & Supports", short: "Supports" },
  { key: "roadmap", label: "Program Progress", short: "Roadmap" },
];

export default function ProgramFlowWizard({ client, onSave, onClientUpdate }) {
  const [activeStep, setActiveStep] = useState("bit");
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
      case "roadmap":
        return client?.action_plan_submitted ? "active" : "pending";
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
      {/* Mobile toggle button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Step sidebar */}
      <div className={`w-56 shrink-0 fixed lg:static top-0 left-0 h-full bg-white z-40 transform transition-transform duration-300 lg:transform-none ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="sticky top-6 space-y-1">
          <div className="flex items-center justify-between px-3 mb-3 lg:hidden">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Program Steps</p>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="hidden lg:block text-xs font-semibold text-slate-400 uppercase tracking-wide px-3 mb-3">Program Steps</p>
          {steps.map((step, i) => {
            const status = getStepStatus(step.key);
            const cfg = statusConfig[status];
            const isActive = activeStep === step.key;
            const isRoadmap = step.key === "roadmap";
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
                  {isRoadmap
                    ? <Map className={`w-3 h-3 ${isActive ? "text-white" : cfg.text}`} />
                    : <span className={`text-xs font-bold ${isActive ? "text-white" : cfg.text}`}>{i + 1}</span>
                  }
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
      <div className={`flex-1 min-w-0 ${sidebarOpen ? "lg:ml-0" : ""}`}>
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
        {activeStep === "roadmap" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Program Progress</h2>
              <p className="text-sm text-slate-500 mt-1">Full timeline and overview of the client's program progress.</p>
            </div>
            {client?.action_plan_submitted && client?.sdp_items?.length > 0
              ? <ActionPlanRoadmap client={client} selectedItems={client.sdp_items} itemDetails={client.sdp_item_details || {}} onClientUpdate={onClientUpdate} />
              : <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
                  <Map className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="font-medium">No action plan submitted yet.</p>
                  <p className="text-sm mt-1">Complete Step 3 to generate the roadmap.</p>
                </div>
            }
          </div>
        )}
      </div>
    </div>
  );
}