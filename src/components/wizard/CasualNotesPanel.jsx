import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Plus, Clock } from "lucide-react";
import { format } from "date-fns";

export default function CasualNotesPanel({ client, onSave }) {
  const notes = client?.casual_activity_log || [];
  const [adding, setAdding] = useState(false);
  const [entryDate, setEntryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [entryText, setEntryText] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!entryText.trim()) return;
    setSaving(true);
    const me = await base44.auth.me();
    const newEntry = {
      id: Date.now().toString(),
      date: entryDate,
      note: entryText.trim(),
      logged_by: me?.email || "",
      logged_by_name: me?.full_name || "",
      logged_at: new Date().toISOString(),
    };
    const updated = [newEntry, ...notes];
    await onSave({ casual_activity_log: updated });
    setEntryText("");
    setEntryDate(format(new Date(), "yyyy-MM-dd"));
    setAdding(false);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-slate-500" /> Activity &amp; Notes Log
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Casual clients access resources and guidance — record activity updates and notes here.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)} className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Note
        </Button>
      </div>

      {adding && (
        <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
          <div>
            <Label className="text-xs mb-1 block">Date</Label>
            <Input
              type="date"
              className="h-8 text-sm w-40"
              value={entryDate}
              onChange={e => setEntryDate(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Note / Activity</Label>
            <Textarea
              className="text-sm"
              rows={3}
              placeholder="Describe the activity, resource shared, or guidance provided..."
              value={entryText}
              onChange={e => setEntryText(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={saving || !entryText.trim()}>
              {saving ? "Saving…" : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {notes.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 text-center">
          <MessageSquare className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No activity notes yet</p>
          <p className="text-sm mt-1">Click "Add Note" to log guidance, resources, or activities.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(entry => (
            <div key={entry.id} className="bg-white border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{entry.date ? format(new Date(entry.date), "MMM d, yyyy") : "—"}</span>
                {entry.logged_by_name && <span>· {entry.logged_by_name}</span>}
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{entry.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}