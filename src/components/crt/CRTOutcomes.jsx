// CRT Tab 2: Outcomes Tracker
import { format } from "date-fns";

const EMP_LABELS = {
  "E-RF": "Employed – Related Field",
  "E-UF": "Employed – Unrelated Field",
  "E-PT": "Employed – Part-Time",
  "UE": "Unemployed",
  "UE-LA": "Unemployed – Looking Actively",
  "UE-S": "Unemployed – Student",
  "NA": "N/A",
  "no_contact": "No Contact",
};

const PROGRAM_STATUS_LABELS = {
  in_progress: "In Progress", complete: "Complete",
  incomplete: "Incomplete", cancelled: "Cancelled",
};

function fmt(dateStr) {
  if (!dateStr) return "";
  try { return format(new Date(dateStr), "yyyy-MM-dd"); } catch { return dateStr; }
}

function CopyCell({ value, highlight }) {
  return (
    <td
      className={`px-2 py-1.5 text-xs border-r border-slate-100 whitespace-nowrap cursor-pointer select-all ${highlight ? "text-green-700 font-medium" : "text-slate-700"} hover:bg-blue-50`}
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
  { label: "HSID#", get: c => c.compass_hsid },
  { label: "Program Status", get: c => PROGRAM_STATUS_LABELS[c.program_status] || c.program_status || "" },
  { label: "Completion Date", get: c => fmt(c.completion_date) },
  { label: "Employment Status (Exit)", get: c => EMP_LABELS[c.employment_status] || c.employment_status || "" },
  { label: "Employer", get: c => c.employer_name },
  { label: "Job Title", get: c => c.job_title },
  { label: "Employment Start", get: c => fmt(c.employment_start_date) },
  { label: "Wage", get: c => c.job_wage },
  { label: "Hours/Week", get: c => c.job_hours },
  { label: "90-Day Follow-Up Date", get: c => fmt(c.followup_90day_date) },
  { label: "90-Day Status", get: c => EMP_LABELS[c.followup_90day_status] || c.followup_90day_status || "" },
  { label: "Barriers Addressed", get: c => c.barriers_addressed ? "Yes" : (c.barriers_addressed === false ? "No" : "") },
  { label: "Service Navigation", get: c => c.service_navigation_supports ? "Yes" : (c.service_navigation_supports === false ? "No" : "") },
];

// Summary counts for the top
function OutcomesSummary({ clients }) {
  const completed = clients.filter(c => c.program_status === "complete").length;
  const employed = clients.filter(c => c.employment_status && c.employment_status.startsWith("E-")).length;
  const followupDone = clients.filter(c => c.followup_90day_status && c.followup_90day_status !== "no_contact").length;
  const followupTotal = clients.filter(c => c.followup_90day_date).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {[
        { label: "Total Clients", value: clients.length },
        { label: "Program Complete", value: completed },
        { label: "Employed at Exit", value: employed },
        { label: "90-Day Follow-Ups Done", value: `${followupDone} / ${followupTotal}` },
      ].map(s => (
        <div key={s.label} className="bg-white rounded-lg border border-slate-200 px-4 py-3">
          <div className="text-xl font-bold text-slate-800">{s.value}</div>
          <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function CRTOutcomes({ clients }) {
  if (clients.length === 0) {
    return <div className="text-center py-16 text-slate-400 text-sm">No clients in selected period.</div>;
  }

  return (
    <div className="space-y-4">
      <OutcomesSummary clients={clients} />
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
          Click any cell to select its text for copy/paste.
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="px-2 py-2 text-left font-semibold sticky left-0 bg-slate-800">#</th>
                {COLUMNS.map(col => (
                  <th key={col.label} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-2 py-1.5 text-xs text-slate-400 sticky left-0 bg-inherit">{i + 1}</td>
                  {COLUMNS.map(col => (
                    <CopyCell
                      key={col.label}
                      value={col.get(c)}
                      highlight={col.label === "Employment Status (Exit)" && c.employment_status?.startsWith("E-")}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}