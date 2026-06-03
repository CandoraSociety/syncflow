import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, ClipboardList, CheckSquare, Star, Building2, Briefcase } from "lucide-react";
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

const INTERNAL_PLACEMENT_LABELS = {
  cleaning_arc: "Cleaning Services (ARC)",
  food_services_onsite: "Food Services (Onsite only)",
  food_services_offsite: "Food Services (Offsite availability)",
  reception: "Reception",
  childcare: "Childcare",
};

function InternalPlacementsSection({ client }) {
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

  const handleRecordUpdate = async () => {
    const refreshed = await base44.entities.InternalTraining.filter({ client_id: client.id }, "-created_date");
    setRecords(refreshed);
    setSelected(refreshed.find(r => r.id === selected?.id) || refreshed[0] || null);
  };

  const transportLabel = (val) => TRANSPORTATION_OPTIONS.find(o => o.value === val)?.label || val;

  // Show internal placement info from Program Flow wizard if present
  const wizardPlacement = client?.internal_placement && client.internal_placement !== "none"
    ? client.internal_placement : null;

  if (loading) return (
    <div className="flex items-center justify-center py-8">
      <div className="w-6 h-6 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Program Flow wizard internal placement summary */}
      {wizardPlacement && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> From Program Flow — Internal Placement
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-xs text-blue-500">Placement Type</p>
              <p className="font-medium text-blue-900">{INTERNAL_PLACEMENT_LABELS[wizardPlacement] || wizardPlacement}</p>
            </div>
            {client.placement_start_date && (
              <div>
                <p className="text-xs text-blue-500">Start Date</p>
                <p className="font-medium text-blue-900">{client.placement_start_date}</p>
              </div>
            )}
            {client.placement_end_date && (
              <div>
                <p className="text-xs text-blue-500">End Date</p>
                <p className="font-medium text-blue-900">{client.placement_end_date}</p>
              </div>
            )}
            {client.placement_supervisor && (
              <div>
                <p className="text-xs text-blue-500">Supervisor</p>
                <p className="font-medium text-blue-900">{client.placement_supervisor}</p>
              </div>
            )}
            {client.placement_schedule && (
              <div>
                <p className="text-xs text-blue-500">Schedule</p>
                <p className="font-medium text-blue-900">{client.placement_schedule}</p>
              </div>
            )}
            {client.placement_request_sent !== undefined && (
              <div>
                <p className="text-xs text-blue-500">Request Sent</p>
                <Badge className={client.placement_request_sent ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                  {client.placement_request_sent ? "Yes" : "Not yet"}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm font-medium text-slate-600">Training Records</p>
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
                  <TrainingProgressTracker training={selected} onSaved={handleRecordUpdate} readOnly={true} />
                </TabsContent>
                <TabsContent value="plan" className="mt-4">
                  <TrainingPlanEditor training={selected} onSaved={handleRecordUpdate} readOnly={true} />
                </TabsContent>
                <TabsContent value="evaluation" className="mt-4">
                  <TrainingEvaluation training={selected} onSaved={handleRecordUpdate} readOnly={true} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalPlacementsSection({ client }) {
  const hasExternal = !!(client?.paid_external_placement || client?.external_employer);

  if (!hasExternal) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-400">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No external placement recorded.</p>
          <p className="text-xs mt-1">External placement details are set in the Program Flow wizard.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> From Program Flow — External Placement
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
        {client.external_employer && (
          <div>
            <p className="text-xs text-purple-500">Employer</p>
            <p className="font-medium text-purple-900">{client.external_employer}</p>
          </div>
        )}
        <div>
          <p className="text-xs text-purple-500">Paid External Placement</p>
          <Badge className={client.paid_external_placement ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}>
            {client.paid_external_placement ? "Planned" : "Not planned"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ClientPlacements({ client }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-slate-700 text-base">Placements</h3>
        <p className="text-sm text-slate-500 mt-0.5">Internal and external placement details for this client.</p>
      </div>

      <div className="space-y-8">
        <div>
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">Internal Placements</h4>
          <InternalPlacementsSection client={client} />
        </div>

        <div>
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">External Placement</h4>
          <ExternalPlacementsSection client={client} />
        </div>
      </div>
    </div>
  );
}