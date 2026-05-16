import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut, ClipboardList, CheckSquare, Star, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
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

const transportLabel = (val) => TRANSPORTATION_OPTIONS.find(o => o.value === val)?.label || val;

export default function SupervisorPortal() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPlacement, setFilterPlacement] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.InternalTraining.list("-created_date", 500);
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleUpdated = async (updates) => {
    const refreshed = await base44.entities.InternalTraining.list("-created_date", 500);
    setRecords(refreshed);
    setSelected(refreshed.find(r => r.id === selected?.id) || null);
  };

  const filtered = records.filter(r => {
    const q = search.toLowerCase();
    if (q && !r.client_name?.toLowerCase().includes(q)) return false;
    if (filterPlacement !== "all" && r.placement_type !== filterPlacement) return false;
    if (filterStatus !== "all" && r.status !== filterStatus) return false;
    return true;
  });

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Supervisor Portal</h1>
          <p className="text-sm text-slate-500">Internal Training Placements</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left panel — client list */}
        <div className="w-80 shrink-0 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-3 space-y-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                className="pl-9 h-9 text-sm"
                placeholder="Search client..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterPlacement} onValueChange={setFilterPlacement}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All placements</SelectItem>
                  {Object.entries(PLACEMENT_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="referred">Referred</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {filtered.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-10">No placements found.</p>
            )}
            {filtered.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 transition-colors hover:bg-slate-50 ${selected?.id === r.id ? "bg-slate-100" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{r.client_name}</p>
                    <p className="text-xs text-slate-500">{PLACEMENT_LABELS[r.placement_type]}</p>
                    {r.referral_date && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Referred {format(parseISO(r.referral_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${STATUS_COLORS[r.status] || "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                  </span>
                </div>
                {r.evaluation_completed && (
                  <span className="text-xs text-green-700 font-medium mt-1 block">✓ Evaluation complete</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selected && (
            <div className="flex items-center justify-center h-full text-slate-400">
              <div className="text-center">
                <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>Select a client from the list to view their training record.</p>
              </div>
            </div>
          )}

          {selected && (
            <div className="max-w-3xl space-y-5">
              {/* Header */}
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selected.client_name}</h2>
                <p className="text-sm text-slate-500">{PLACEMENT_LABELS[selected.placement_type]}</p>
              </div>

              {/* Summary */}
              <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Career Counsellor</p>
                  <p className="font-medium text-slate-800">{selected.assigned_worker_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Transportation</p>
                  <p className="text-slate-700">{selected.transportation ? transportLabel(selected.transportation) : "—"}</p>
                </div>
                {selected.transportation_notes && (
                  <div>
                    <p className="text-xs text-slate-500">Transport Notes</p>
                    <p className="text-slate-600">{selected.transportation_notes}</p>
                  </div>
                )}
                {selected.start_date && (
                  <div>
                    <p className="text-xs text-slate-500">Start Date</p>
                    <p className="text-slate-700">{format(parseISO(selected.start_date), "MMM d, yyyy")}</p>
                  </div>
                )}
                {selected.expected_end_date && (
                  <div>
                    <p className="text-xs text-slate-500">Expected End</p>
                    <p className="text-slate-700">{format(parseISO(selected.expected_end_date), "MMM d, yyyy")}</p>
                  </div>
                )}
              </div>

              {selected.training_goals && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2.5 text-sm text-blue-800">
                  <span className="font-medium">Training Goals: </span>{selected.training_goals}
                </div>
              )}

              {selected.referral_notes && (
                <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5 text-sm text-amber-800">
                  <span className="font-medium">Counsellor Notes: </span>{selected.referral_notes}
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
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="mt-4">
                  <TrainingProgressTracker
                    training={selected}
                    onSaved={handleUpdated}
                    readOnly={false}
                  />
                </TabsContent>

                <TabsContent value="plan" className="mt-4">
                  <TrainingPlanEditor
                    training={selected}
                    onSaved={handleUpdated}
                    readOnly={false}
                  />
                </TabsContent>

                <TabsContent value="evaluation" className="mt-4">
                  <TrainingEvaluation
                    training={selected}
                    onSaved={handleUpdated}
                    readOnly={false}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}