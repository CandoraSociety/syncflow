import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ClipboardList, CheckSquare, Star } from "lucide-react";
import { format, parseISO } from "date-fns";
import TrainingReferralForm from "@/components/training/TrainingReferralForm";
import TrainingProgressTracker from "@/components/training/TrainingProgressTracker";
import TrainingPlanEditor from "@/components/training/TrainingPlanEditor";
import TrainingEvaluation from "@/components/training/TrainingEvaluation";
import { PLACEMENT_LABELS, TRANSPORTATION_OPTIONS } from "@/components/training/PLACEMENT_CONFIG";

const STATUS_COLORS = {
  referred: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-slate-100 text-slate-700",
  withdrawn: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function ClientTraining({ client }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.InternalTraining.filter({ client_id: client.id }, "-created_date");
    setRecords(data);
    if (data.length > 0 && !selected) setSelected(data[0]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [client.id]);

  const handleSaved = async () => {
    setShowForm(false);
    await load();
  };

  const handleRecordUpdate = async (updates) => {
    const refreshed = await base44.entities.InternalTraining.filter({ client_id: client.id }, "-created_date");
    setRecords(refreshed);
    setSelected(refreshed.find(r => r.id === selected?.id) || refreshed[0] || null);
  };

  const transportLabel = (val) => TRANSPORTATION_OPTIONS.find(o => o.value === val)?.label || val;

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-slate-700">Internal Training Placements</h3>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New Referral"}
        </Button>
      </div>

      {showForm && (
        <TrainingReferralForm
          client={client}
          onSaved={handleSaved}
          onCancel={() => setShowForm(false)}
        />
      )}

      {records.length === 0 && !showForm && (
        <Card>
          <CardContent className="py-10 text-center text-slate-400">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No internal training referrals yet.</p>
          </CardContent>
        </Card>
      )}

      {records.length > 0 && (
        <div className="space-y-4">
          {/* Record selector */}
          {records.length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {records.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${selected?.id === r.id ? "bg-slate-800 text-white border-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
                >
                  {PLACEMENT_LABELS[r.placement_type] || r.placement_type}
                  {r.referral_date ? ` · ${format(parseISO(r.referral_date), "MMM yyyy")}` : ""}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <>
              {/* Summary bar */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Placement</p>
                  <p className="font-medium text-slate-800">{PLACEMENT_LABELS[selected.placement_type]}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Status</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] || "bg-slate-100 text-slate-600"}`}>
                    {selected.status}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Transportation</p>
                  <p className="text-slate-700">{selected.transportation ? transportLabel(selected.transportation) : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Referred</p>
                  <p className="text-slate-700">{selected.referral_date ? format(parseISO(selected.referral_date), "MMM d, yyyy") : "—"}</p>
                </div>
              </div>

              {selected.training_goals && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
                  <span className="font-medium">Training Goals: </span>{selected.training_goals}
                </div>
              )}

              <Tabs defaultValue="progress">
                <TabsList>
                  <TabsTrigger value="progress" className="gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5" /> Progress
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5" /> Training Plan
                  </TabsTrigger>
                  <TabsTrigger value="evaluation" className="gap-1.5">
                    <Star className="w-3.5 h-3.5" /> Evaluation
                    {selected.evaluation_completed && (
                      <span className="ml-1 w-2 h-2 rounded-full bg-green-500 inline-block" />
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="mt-4">
                  <TrainingProgressTracker
                    training={selected}
                    onSaved={handleRecordUpdate}
                    readOnly={true}
                  />
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <TrainingPlanEditor
                    training={selected}
                    onSaved={handleRecordUpdate}
                    readOnly={true}
                  />
                </TabsContent>

                <TabsContent value="evaluation" className="mt-4">
                  <TrainingEvaluation
                    training={selected}
                    onSaved={handleRecordUpdate}
                    readOnly={true}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </div>
  );
}