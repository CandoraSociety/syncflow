import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, CheckCircle2, Clock, Circle, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const SERVICE_LABELS = {
  direct_to_employment: "Direct to Employment",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral",
  not_eligible: "Not Eligible",
};

export default function ClientRoadmap({ client }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <html><head><title>Client Roadmap – ${client.first_name} ${client.last_name}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { font-size: 13px; color: #64748b; margin-bottom: 32px; }
        .stage { display: flex; gap: 16px; margin-bottom: 24px; align-items: flex-start; }
        .icon-col { width: 40px; text-align: center; }
        .circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; margin: 0 auto; }
        .done { background: #dcfce7; color: #16a34a; border: 2px solid #16a34a; }
        .active { background: #dbeafe; color: #2563eb; border: 2px solid #2563eb; }
        .pending { background: #f1f5f9; color: #94a3b8; border: 2px solid #cbd5e1; }
        .skipped { background: #fef9c3; color: #b45309; border: 2px solid #fbbf24; }
        .connector { width: 2px; height: 20px; background: #e2e8f0; margin: 0 auto; }
        .label { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
        .detail { font-size: 12px; color: #64748b; }
        .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 9999px; margin-top: 4px; }
        .badge-done { background: #dcfce7; color: #15803d; }
        .badge-active { background: #dbeafe; color: #1d4ed8; }
        .badge-pending { background: #f1f5f9; color: #64748b; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      ${content}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const stages = buildStages(client);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-800">Client Pathway Roadmap</h3>
          <p className="text-sm text-slate-500">{SERVICE_LABELS[client.service_type] || "Service pathway"}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="w-4 h-4" /> Print Roadmap
        </Button>
      </div>

      <div ref={printRef}>
        <h1 style={{ display: "none" }} className="print-only">
          {client.first_name} {client.last_name} — Client Pathway Roadmap
        </h1>

        {/* Printable header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-xl font-bold">{client.first_name} {client.last_name}</h1>
          <p className="text-sm text-slate-500">{SERVICE_LABELS[client.service_type] || ""} · Generated {format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        <div className="relative">
          {stages.map((stage, i) => (
            <div key={stage.key}>
              <RoadmapStage stage={stage} />
              {i < stages.length - 1 && (
                <div className="flex justify-start pl-5 my-0">
                  <div className="w-0.5 h-6 bg-slate-200 ml-[1.1rem]" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoadmapStage({ stage }) {
  const statusConfig = {
    done: {
      icon: <CheckCircle2 className="w-5 h-5" />,
      ring: "border-green-500",
      bg: "bg-green-50",
      text: "text-green-700",
      badge: "bg-green-100 text-green-700",
      label: "Completed",
    },
    active: {
      icon: <Clock className="w-5 h-5" />,
      ring: "border-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-700",
      badge: "bg-blue-100 text-blue-700",
      label: "In Progress",
    },
    pending: {
      icon: <Circle className="w-5 h-5" />,
      ring: "border-slate-300",
      bg: "bg-slate-50",
      text: "text-slate-400",
      badge: "bg-slate-100 text-slate-500",
      label: "Pending",
    },
    skipped: {
      icon: <AlertCircle className="w-5 h-5" />,
      ring: "border-amber-400",
      bg: "bg-amber-50",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700",
      label: "Not Applicable",
    },
  };

  const cfg = statusConfig[stage.status] || statusConfig.pending;

  return (
    <div className={`flex gap-4 p-4 rounded-xl border ${cfg.ring} ${cfg.bg}`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 ${cfg.ring} flex items-center justify-center ${cfg.text}`}>
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-800 text-sm">{stage.label}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.badge}`}>{cfg.label}</span>
        </div>
        {stage.date && (
          <p className="text-xs text-slate-500 mt-0.5">{stage.dateLabel}: {format(new Date(stage.date), "MMMM d, yyyy")}</p>
        )}
        {stage.detail && (
          <p className="text-xs text-slate-600 mt-1">{stage.detail}</p>
        )}
      </div>
    </div>
  );
}

function buildStages(client) {
  const stages = [];

  // 1. Intake
  stages.push({
    key: "intake",
    label: "Intake & Registration",
    status: client.intake_date ? "done" : "active",
    date: client.intake_date,
    dateLabel: "Intake Date",
    detail: client.intake_date ? `Registered on ${format(new Date(client.intake_date), "MMMM d, yyyy")}` : "Awaiting intake completion",
  });

  // 2. Compass Verification
  stages.push({
    key: "compass",
    label: "Compass Verification",
    status: client.compass_verified ? "done" : client.intake_date ? "active" : "pending",
    date: client.compass_verified_date,
    dateLabel: "Verified Date",
    detail: client.compass_verified
      ? `Verified by ${client.compass_verified_by || "staff"}${client.compass_hsid ? ` · HSID: ${client.compass_hsid}` : ""}`
      : "Compass entry pending verification",
  });

  // 3. Service Stream Assignment
  stages.push({
    key: "stream",
    label: "Service Stream Assignment",
    status: client.service_type ? "done" : "pending",
    detail: client.service_type
      ? `Assigned to: ${SERVICE_LABELS[client.service_type] || client.service_type}`
      : "Stream not yet assigned",
  });

  // 4. Service Start
  stages.push({
    key: "service_start",
    label: "Service Start",
    status: client.service_start_date ? "done" : client.service_type ? "active" : "pending",
    date: client.service_start_date,
    dateLabel: "Start Date",
  });

  // 5. Barriers Addressed (if applicable)
  if (client.barriers_addressed || client.barrier_1) {
    const barriers = [client.barrier_1, client.barrier_2, client.barrier_3].filter(Boolean);
    stages.push({
      key: "barriers",
      label: "Barrier Support",
      status: barriers.every(b => {
        const idx = ["barrier_1", "barrier_2", "barrier_3"].indexOf(`barrier_${barriers.indexOf(b) + 1}`);
        return false; // simplified
      }) ? "done" : "active",
      detail: barriers.length > 0 ? `Barriers: ${barriers.join(", ")}` : "Barriers addressed in service plan",
    });
  }

  // 6. Training / Placement
  const hasTraining = client.internal_placement && client.internal_placement !== "none";
  const hasExternal = client.paid_external_placement || client.external_employer;
  if (hasTraining || hasExternal || client.service_type === "pathways") {
    stages.push({
      key: "training",
      label: hasTraining ? `Internal Placement: ${client.internal_placement?.replace(/_/g, " ")}` : "Training / Placement",
      status: hasTraining || hasExternal ? "active" : "pending",
      detail: hasExternal && client.employer_name ? `Employer: ${client.employer_name}` : undefined,
    });
  }

  // 7. Program Completion
  stages.push({
    key: "completion",
    label: "Program Completion",
    status: client.completion_date ? "done"
      : client.program_status === "cancelled" ? "skipped"
      : client.service_start_date ? "active"
      : "pending",
    date: client.completion_date,
    dateLabel: "Completion Date",
    detail: client.program_status ? `Status: ${client.program_status.replace(/_/g, " ")}` : undefined,
  });

  // 8. Employment Outcome
  stages.push({
    key: "employment",
    label: "Employment Outcome",
    status: client.employment_start_date ? "done"
      : client.completion_date ? "active"
      : "pending",
    date: client.employment_start_date,
    dateLabel: "Employment Start",
    detail: client.employer_name
      ? `Employer: ${client.employer_name}${client.job_title ? ` · ${client.job_title}` : ""}${client.job_wage ? ` · ${client.job_wage}` : ""}`
      : client.employment_status ? `Status: ${client.employment_status}` : undefined,
  });

  // 9. 90-Day Follow-Up
  stages.push({
    key: "followup",
    label: "90-Day Follow-Up",
    status: client.followup_90day_date ? "done"
      : client.employment_start_date ? "active"
      : "pending",
    date: client.followup_90day_date,
    dateLabel: "Follow-up Date",
    detail: client.followup_90day_status ? `Status: ${client.followup_90day_status}` : undefined,
  });

  return stages;
}