import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle } from "lucide-react";

const CLOSE_REASONS = [
  { value: "completed", label: "Completed — Program finished successfully" },
  { value: "cancelled", label: "Cancelled — Program cancelled" },
  { value: "incomplete", label: "Incomplete — Did not finish program" },
  { value: "withdrew", label: "Withdrew — Client withdrew voluntarily" },
  { value: "relocated", label: "Relocated — Client moved away" },
  { value: "no_longer_eligible", label: "No Longer Eligible — Lost eligibility" },
  { value: "no_contact", label: "No Contact — Unable to reach client" },
  { value: "duplicate", label: "Duplicate — File is a duplicate" },
  { value: "other", label: "Other" },
];

export default function CloseFileDialog({ open, onClose, onConfirm, saving }) {
  const [reason, setReason] = useState("");
  const [closedDate, setClosedDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  const handleConfirm = () => {
    if (!reason) return;
    onConfirm({ closed_reason: reason, closed_date: closedDate, closed_notes: notes, file_closed: true, status: "closed" });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Close Client File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-slate-500">
            This will mark the file as closed. It will move to the Closed Files list but all data is preserved.
          </p>

          <div className="space-y-1.5">
            <Label>Reason for Closing *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                {CLOSE_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Closing Date</Label>
            <Input type="date" value={closedDate} onChange={e => setClosedDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Any additional context..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={!reason || saving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {saving ? "Closing..." : "Close File"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}