import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, ChevronDown, ChevronUp } from "lucide-react";

export default function TrainingPlanEditor({ training, onSaved, readOnly = false }) {
  const [items, setItems] = useState(training.training_plan_items || []);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const updateItem = (id, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.InternalTraining.update(training.id, { training_plan_items: items });
    setSaving(false);
    onSaved(items);
  };

  const focusItems = items.filter(i => i.focus !== false);
  const nonFocusItems = items.filter(i => i.focus === false);

  const renderItem = (item) => (
    <div key={item.id} className={`border rounded-lg transition-all ${item.completed ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"}`}>
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={() => setExpanded(expanded === item.id ? null : item.id)}
      >
        {!readOnly && (
          <input
            type="checkbox"
            checked={!!item.completed}
            className="w-4 h-4 rounded accent-slate-700"
            onChange={e => {
              e.stopPropagation();
              updateItem(item.id, "completed", e.target.checked);
              if (e.target.checked && !item.completed_date) {
                updateItem(item.id, "completed_date", new Date().toISOString().split("T")[0]);
              }
            }}
          />
        )}
        {readOnly && (
          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${item.completed ? "border-green-500 bg-green-500" : "border-slate-300"}`}>
            {item.completed && <span className="text-white text-xs">✓</span>}
          </span>
        )}
        <span className={`text-sm flex-1 ${item.completed ? "line-through text-slate-400" : "text-slate-700"}`}>
          {item.label}
        </span>
        {item.completed_date && (
          <span className="text-xs text-slate-400 hidden sm:block">{item.completed_date}</span>
        )}
        {expanded === item.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </div>

      {expanded === item.id && (
        <div className="px-3 pb-3 space-y-2 border-t border-slate-100 pt-2">
          {!readOnly && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs mb-1 block">Date Completed</Label>
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={item.completed_date || ""}
                  onChange={e => updateItem(item.id, "completed_date", e.target.value)}
                />
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs mb-1 block">Notes</Label>
            {readOnly ? (
              <p className="text-xs text-slate-500">{item.notes || "No notes."}</p>
            ) : (
              <Textarea
                rows={2}
                className="text-xs"
                value={item.notes || ""}
                onChange={e => updateItem(item.id, "notes", e.target.value)}
                placeholder="Add notes about this skill area..."
              />
            )}
          </div>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <Switch
                checked={item.focus !== false}
                onCheckedChange={v => updateItem(item.id, "focus", v)}
              />
              <Label className="text-xs">Include as focus area for this client</Label>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Training Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {focusItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Focus Areas</p>
            {focusItems.map(renderItem)}
          </div>
        )}
        {nonFocusItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Not a Current Focus</p>
            {nonFocusItems.map(renderItem)}
          </div>
        )}
        {!readOnly && (
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={handleSave} disabled={saving} className="gap-2">
              <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save Training Plan"}
            </Button>
          </div>
        )}
        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">No training plan items found.</p>
        )}
      </CardContent>
    </Card>
  );
}