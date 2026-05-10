import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { format } from "date-fns";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  closed: "bg-slate-100 text-slate-600",
};

const SERVICE_LABELS = {
  direct_to_employment: "Direct to Employment (DEA)",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral (non-employment)",
  not_eligible: "Not eligible/no referral",
};

export default function ClientTable({ clients, onEdit, showWorkerColumn }) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 bg-white rounded-lg border border-slate-200">
        <p className="text-lg font-medium">No clients yet</p>
        <p className="text-sm mt-1">Click "New Client" to add the first intake record.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Client Name</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Phone</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Service</th>
              {showWorkerColumn && <th className="text-left px-4 py-3 font-semibold text-slate-600">Assigned Worker</th>}
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Intake Date</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map(client => (
              <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-800">
                  {client.first_name} {client.last_name}
                </td>
                <td className="px-4 py-3 text-slate-600">{client.phone || "—"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {SERVICE_LABELS[client.service_type] || client.service_type || "—"}
                </td>
                {showWorkerColumn && (
                  <td className="px-4 py-3 text-slate-600">
                    {client.assigned_worker_name || client.assigned_worker || <span className="text-slate-400 italic">Unassigned</span>}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[client.status] || "bg-slate-100 text-slate-600"}`}>
                    {client.status ? client.status.charAt(0).toUpperCase() + client.status.slice(1) : "New"}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {client.intake_date ? format(new Date(client.intake_date), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="icon" onClick={() => onEdit(client)}>
                    <Pencil className="w-4 h-4 text-slate-400" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}