import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DuplicateWarningDialog({ duplicates, onConfirm, onCancel }) {
  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
            Possible Duplicate Client
          </DialogTitle>
          <DialogDescription>
            A client with matching information already exists in the system:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 my-2">
          {duplicates.map(d => (
            <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
              <p className="font-semibold text-slate-800">{d.first_name} {d.last_name}</p>
              {d.email && <p className="text-slate-500">Email: {d.email}</p>}
              {d.phone && <p className="text-slate-500">Phone: {d.phone}</p>}
              {d.compass_hsid && <p className="text-slate-500">HSID#: {d.compass_hsid}</p>}
            </div>
          ))}
        </div>

        <p className="text-sm text-slate-600">Do you want to create a new client anyway?</p>

        <div className="flex justify-end gap-3 mt-2">
          <Button variant="outline" onClick={onCancel}>No, go back</Button>
          <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 text-white">
            Yes, create anyway
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}