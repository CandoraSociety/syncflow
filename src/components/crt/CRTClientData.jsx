// CRT Tab 1: Client Data — formatted for GOA spreadsheet copy/paste
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const RESIDENCY_LABELS = {
  canadian_citizen: "Canadian Citizen", permanent_resident: "Permanent Resident",
  protected_person: "Protected Person", convention_refugee: "Convention Refugee",
  refugee_claimant: "Refugee Claimant", temporary_resident: "Temporary Resident",
  work_permit: "Work Permit", study_permit: "Study Permit", visitor: "Visitor", other: "Other",
};

const SERVICE_LABELS = {
  direct_to_employment: "DEA", pathways: "Pathways", casual: "Casual",
  external_referral: "Ext. Referral", internal_referral: "Int. Referral", not_eligible: "Not Eligible",
};

function fmt(dateStr) {
  if (!dateStr) return "";
  try { return format(new Date(dateStr), "yyyy-MM-dd"); } catch { return dateStr; }
}

function CopyCell({ value }) {
  return (
    <td
      className="px-2 py-1.5 text-xs text-slate-700 border-r border-slate-100 whitespace-nowrap cursor-pointer hover:bg-blue-50 select-all"
      title="Click to select for copy"
      onClick={e => {
        const range = document.createRange();
        range.selectNodeContents(e.currentTarget);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }}
    >
      {value || ""}
    </td>
  );
}

const COLUMNS = [
  { label: "Last Name", get: c => c.last_name },
  { label: "First Name", get: c => c.first_name },
  { label: "DOB", get: c => fmt(c.date_of_birth) },
  { label: "HSID#", get: c => c.compass_hsid },
  { label: "Residency Status", get: c => RESIDENCY_LABELS[c.residency_status] || c.residency_status || "" },
  { label: "CLB Level", get: c => c.clb_level ? c.clb_level.replace("clb_", "CLB ").replace("native_english_french", "Native") : "" },
  { label: "Service Stream", get: c => SERVICE_LABELS[c.service_type] || c.service_type || "" },
  { label: "Start Date", get: c => fmt(c.service_start_date) },
  { label: "Intake Date", get: c => fmt(c.intake_date) },
  { label: "Career Counsellor", get: c => c.assigned_worker_name },
  { label: "Employment Status", get: c => c.employment_status },
  { label: "Phone", get: c => c.phone },
  { label: "Email", get: c => c.email },
  { label: "City", get: c => c.city },
  { label: "Postal Code", get: c => c.zip },
  { label: "Barriers Identified?", get: c => c.barriers_addressed ? "Yes" : "No", isBarrier: true },
];

export default function CRTClientData({ clients }) {
  const navigate = useNavigate();

  if (clients.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">No clients in selected period.</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
        Click any cell to select its text for copy/paste. Use Ctrl+C / Cmd+C after selecting.
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white">
              <th className="px-2 py-2 text-left font-semibold whitespace-nowrap sticky left-0 bg-slate-800">#</th>
              {COLUMNS.map(col => (
                <th key={col.label} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clients.map((c, i) => (
              <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-2 py-1.5 text-xs text-slate-400 sticky left-0 bg-inherit">{i + 1}</td>
                {COLUMNS.map(col => {
                  if (col.isBarrier) {
                    const hasBarriers = c.barriers_addressed;
                    return (
                      <td key={col.label} className="px-2 py-1.5 text-xs border-r border-slate-100 whitespace-nowrap">
                        {hasBarriers ? (
                          <button
                            onClick={() => navigate(`/client/${c.id}?tab=program_flow&step=barrier_action_plan`)}
                            className="text-blue-700 underline font-semibold hover:text-blue-900"
                          >
                            Yes →
                          </button>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                    );
                  }
                  return <CopyCell key={col.label} value={col.get(c)} />;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}