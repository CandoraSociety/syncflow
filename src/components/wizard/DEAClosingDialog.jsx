import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowRight } from "lucide-react";
import { format } from "date-fns";

export default function DEAClosingDialog({ client, onContinueDEA, onSwitchToPathways, onDismiss }) {
  const [choice, setChoice] = useState(null); // "continue" | "switch"
  const [switchReason, setSwitchReason] = useState("");
  const [saving, setSaving] = useState(false);

  const endDate = client?.completion_date
    ? format(new Date(client.completion_date), "MMM d, yyyy")
    : "soon";

  const handleConfirm = async () => {
    setSaving(true);
    if (choice === "continue") {
      await onContinueDEA();
    } else if (choice === "switch") {
      await onSwitchToPathways(switchReason);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">DEA Program Period Closing Soon</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              <strong>{client.first_name} {client.last_name}</strong>'s 2-week DEA period ends on <strong>{endDate}</strong>.
              Please select how to proceed.
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={() => setChoice("continue")}
            className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
              choice === "continue"
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-blue-500" /> Continue in DEA
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client is expected to successfully find employment within the follow-up period. No stream change.
            </p>
          </button>

          <button
            onClick={() => setChoice("switch")}
            className={`w-full text-left border-2 rounded-xl p-4 transition-all ${
              choice === "switch"
                ? "border-purple-500 bg-purple-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <div className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-purple-500" /> Switch to Pathways
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Client requires more support. They will be transitioned to the Pathways stream and the Pathways program flow will be activated.
            </p>
          </button>
        </div>

        {/* Switch reason */}
        {choice === "switch" && (
          <div>
            <Label className="text-xs mb-1 block">Reason for switching to Pathways</Label>
            <Textarea
              rows={2}
              className="text-sm"
              placeholder="Briefly describe why the client requires the Pathways stream..."
              value={switchReason}
              onChange={e => setSwitchReason(e.target.value)}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1"
            disabled={!choice || saving || (choice === "switch" && !switchReason.trim())}
            onClick={handleConfirm}
          >
            {saving ? "Saving…" : "Confirm"}
          </Button>
          <Button variant="ghost" onClick={onDismiss} disabled={saving}>
            Remind me later
          </Button>
        </div>
      </div>
    </div>
  );
}