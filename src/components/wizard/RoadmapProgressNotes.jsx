import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardList, ChevronDown, ChevronUp, CheckCircle2, Play, Plus, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { base44 } from "@/api/base44Client";

const EVENT_ICONS = {
  started: <Play className="w-3.5 h-3.5 text-blue-600" />,
  completed: <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />,
  manual: <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-xs flex items-center justify-center font-bold">+</span>,
};

const EVENT_COLORS = {
  started: "border-blue-200 bg-blue-50",
  completed: "border-green-200 bg-green-50",
  manual: "border-slate-300 bg-slate-50",
};

export default function RoadmapProgressNotes({ notes = [], clientId, onNotesUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [manualNote, setManualNote] = useState("");
  const [addingManual, setAddingManual] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatted = [...notes].sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  async function handleAddManual() {
    if (!manualNote.trim()) return;
    setSaving(true);
    const me = await base44.auth.me().catch(() => null);
    const newNote = {
      id: `manual_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      event_type: "manual",
      item_label: "Manual Note",
      item_key: "manual",
      note: manualNote.trim(),
      logged_by: me?.email || "",
      logged_by_name: me?.full_name || me?.email || "",
    };
    const updated = [...notes, newNote];
    await base44.entities.Client.update(clientId, { roadmap_progress_notes: updated });
    onNotesUpdate(updated);
    setManualNote("");
    setAddingManual(false);
    setSaving(false);
  }

  async function handleDelete(noteId) {
    const updated = notes.filter(n => n.id !== noteId);
    await base44.entities.Client.update(clientId, { roadmap_progress_notes: updated });
    onNotesUpdate(updated);
  }

  function copyAll() {
    const text = formatted
      .map(n => `[${n.date || ""}] ${n.item_label}: ${n.note}${n.logged_by_name ? ` — ${n.logged_by_name}` : ""}`)
      .join("\n");
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
        style={{ background: "hsl(231,64%,20%)" }}
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-white/80" />
          <span className="text-sm font-semibold text-white">Client Progress Status Notes</span>
          <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-medium">{notes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          {notes.length > 0 && (
            <button
              onClick={e => { e.stopPropagation(); copyAll(); }}
              className="text-white/60 hover:text-white p-1 rounded transition-colors"
              title="Copy all notes"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-white/70" /> : <ChevronDown className="w-4 h-4 text-white/70" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-3">
          {/* Note log */}
          {formatted.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              Progress notes will appear here as items are added, started, or completed on the roadmap.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {formatted.map(n => (
                <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${EVENT_COLORS[n.event_type] || "border-slate-200 bg-white"}`}>
                  <div className="shrink-0 mt-0.5">
                    {EVENT_ICONS[n.event_type] || EVENT_ICONS.added}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-700">{n.item_label}</span>
                      <span className="text-slate-400">{n.date}</span>
                      {n.logged_by_name && <span className="text-slate-400">· {n.logged_by_name}</span>}
                    </div>
                    <p className="text-slate-600 mt-0.5 leading-relaxed">{n.note}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="shrink-0 text-slate-300 hover:text-red-400 transition-colors p-0.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add manual note */}
          {addingManual ? (
            <div className="space-y-2 border border-slate-200 rounded-lg p-3 bg-slate-50">
              <Textarea
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                placeholder="Enter a manual progress note…"
                className="text-xs min-h-[60px] resize-none bg-white"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddManual} disabled={saving || !manualNote.trim()} className="text-xs h-7 gap-1">
                  <Plus className="w-3 h-3" /> {saving ? "Saving…" : "Add Note"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setAddingManual(false); setManualNote(""); }} className="text-xs h-7">Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAddingManual(true)}
              className="text-xs h-7 gap-1 w-full"
            >
              <Plus className="w-3 h-3" /> Add Manual Note
            </Button>
          )}
        </div>
      )}
    </div>
  );
}