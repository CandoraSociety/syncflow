import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, RotateCcw, User } from "lucide-react";
import { format } from "date-fns";

const TASK_TYPE_COLORS = {
  new_client: "bg-blue-100 text-blue-700",
  service_type_change: "bg-purple-100 text-purple-700",
  stream_switch: "bg-purple-100 text-purple-700",
  program_status_change: "bg-amber-100 text-amber-700",
  employment_outcome: "bg-green-100 text-green-700",
  post_completion_employment: "bg-teal-100 text-teal-700",
  followup_90day: "bg-cyan-100 text-cyan-700",
  file_closed: "bg-red-100 text-red-700",
  service_navigation: "bg-indigo-100 text-indigo-700",
  barriers_identified: "bg-orange-100 text-orange-700",
  action_plan: "bg-orange-100 text-orange-700",
};

const TASK_TYPE_LABELS = {
  new_client: "New Client",
  service_type_change: "Service Change",
  stream_switch: "Stream Switch",
  program_status_change: "Status Change",
  employment_outcome: "Employment",
  post_completion_employment: "Post-Completion",
  followup_90day: "90-Day Follow-Up",
  file_closed: "File Closed",
  service_navigation: "Service Navigation",
  barriers_identified: "Barriers",
  action_plan: "Action Plan",
};

// Task types that are grouped together under a combined "Action Plan & Barriers" section
const ACTION_PLAN_GROUP = ["barriers_identified", "action_plan"];

function groupTasksByCounsellor(tasks) {
  const groups = {};
  for (const task of tasks) {
    const key = task.assigned_worker_name || task.triggered_by_name || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
  // Sort each group: action_plan group types first, then by created_date
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => {
      const aIsAP = ACTION_PLAN_GROUP.includes(a.task_type) ? 0 : 1;
      const bIsAP = ACTION_PLAN_GROUP.includes(b.task_type) ? 0 : 1;
      if (aIsAP !== bIsAP) return aIsAP - bIsAP;
      return new Date(b.created_date) - new Date(a.created_date);
    });
  }
  return groups;
}

function TaskCard({ task, expanded, onToggle, completing, notes, onNotesChange, onMarkComplete, onMarkUncomplete, navigate }) {
  const isAPGroup = ACTION_PLAN_GROUP.includes(task.task_type);
  return (
    <Card className={`border ${task.status === "completed" ? "border-slate-200 opacity-70" : isAPGroup ? "border-orange-300 shadow-sm" : "border-slate-300 shadow-sm"}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TASK_TYPE_COLORS[task.task_type] || "bg-slate-100 text-slate-600"}`}>
                {TASK_TYPE_LABELS[task.task_type] || task.task_type}
              </span>
              {task.compass_hsid && (
                <span className="text-xs text-slate-400">HSID: {task.compass_hsid}</span>
              )}
              <span className="text-xs text-slate-400">
                {task.created_date ? format(new Date(task.created_date), "MMM d, yyyy h:mm a") : ""}
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-800">{task.title}</CardTitle>
            {task.triggered_by_name && (
              <p className="text-xs text-slate-400 mt-0.5">Triggered by {task.triggered_by_name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/client/${task.client_id}`)}
              className="text-slate-500 gap-1 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> View Client
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggle(task.id)}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="pt-0 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instructions</p>
            <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{task.instructions}</pre>
          </div>

          {task.status === "pending" && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completion Notes (optional)</p>
              <Textarea
                rows={2}
                placeholder="Add notes about what was entered in Compass..."
                value={notes || ""}
                onChange={e => onNotesChange(task.id, e.target.value)}
                className="text-sm"
              />
              <Button
                onClick={() => onMarkComplete(task)}
                disabled={completing}
                className="gap-2 bg-green-700 hover:bg-green-800 text-white"
              >
                <CheckCircle2 className="w-4 h-4" />
                {completing ? "Marking complete…" : "Mark as Entered in Compass"}
              </Button>
            </div>
          )}

          {task.status === "completed" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-sm font-medium">
                  Entered by {task.completed_by_name || task.completed_by} on{" "}
                  {task.completed_date ? format(new Date(task.completed_date), "MMM d, yyyy") : ""}
                </span>
              </div>
              {task.completed_notes && (
                <p className="text-sm text-slate-600 italic">"{task.completed_notes}"</p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMarkUncomplete(task)}
                className="gap-2 text-slate-500"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Mark as Pending Again
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function Compass() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pending");
  const [expanded, setExpanded] = useState({});
  const [completing, setCompleting] = useState({});
  const [notes, setNotes] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const all = await base44.entities.CompassTask.list("-created_date", 200);
    setTasks(all);
    setLoading(false);
  };

  const pending = tasks.filter(t => t.status === "pending");
  const completed = tasks.filter(t => t.status === "completed");
  const shown = tab === "pending" ? pending : completed;

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const markComplete = async (task) => {
    setCompleting(prev => ({ ...prev, [task.id]: true }));
    await base44.entities.CompassTask.update(task.id, {
      status: "completed",
      completed_by: currentUser?.email || "",
      completed_by_name: currentUser?.full_name || currentUser?.email || "",
      completed_date: new Date().toISOString().split("T")[0],
      completed_notes: notes[task.id] || "",
    });
    await loadTasks();
    setCompleting(prev => ({ ...prev, [task.id]: false }));
  };

  const markUncomplete = async (task) => {
    await base44.entities.CompassTask.update(task.id, {
      status: "pending",
      completed_by: "",
      completed_by_name: "",
      completed_date: "",
      completed_notes: "",
    });
    await loadTasks();
  };

  const grouped = groupTasksByCounsellor(shown);
  const counsellorNames = Object.keys(grouped).sort((a, b) => {
    if (a === "Unassigned") return 1;
    if (b === "Unassigned") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Compass Task Queue</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Pending data entry tasks for the Government of Alberta Compass database
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pending.length > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                {pending.length} pending
              </span>
            )}
            <Button variant="outline" size="sm" onClick={loadTasks} className="gap-2">
              <RotateCcw className="w-3.5 h-3.5" /> Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab("pending")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "pending" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Pending ({pending.length})
          </button>
          <button
            onClick={() => setTab("completed")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === "completed" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Completed ({completed.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {tab === "pending" ? "No pending Compass tasks — all caught up!" : "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {counsellorNames.map(counsellor => {
              const counsellorTasks = grouped[counsellor];

              // Split into action-plan group and others
              const apGroupTasks = counsellorTasks.filter(t => ACTION_PLAN_GROUP.includes(t.task_type));
              const otherTasks = counsellorTasks.filter(t => !ACTION_PLAN_GROUP.includes(t.task_type));

              return (
                <div key={counsellor}>
                  {/* Counsellor header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "hsl(231,64%,20%)", color: "white" }}>
                      <User className="w-3.5 h-3.5" />
                      {counsellor}
                    </div>
                    <span className="text-xs text-slate-400">{counsellorTasks.length} task{counsellorTasks.length !== 1 ? "s" : ""}</span>
                  </div>

                  <div className="space-y-3 pl-1">
                    {/* Action Plan & Barriers group */}
                    {apGroupTasks.length > 0 && (
                      <div className="border border-orange-200 rounded-xl bg-orange-50/40 p-3 space-y-2">
                        <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide px-1">
                          Action Plan &amp; Barriers — {apGroupTasks[0]?.client_name}
                        </p>
                        {apGroupTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            expanded={!!expanded[task.id]}
                            onToggle={toggleExpand}
                            completing={!!completing[task.id]}
                            notes={notes[task.id]}
                            onNotesChange={(id, val) => setNotes(prev => ({ ...prev, [id]: val }))}
                            onMarkComplete={markComplete}
                            onMarkUncomplete={markUncomplete}
                            navigate={navigate}
                          />
                        ))}
                      </div>
                    )}

                    {/* Other tasks */}
                    {otherTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        expanded={!!expanded[task.id]}
                        onToggle={toggleExpand}
                        completing={!!completing[task.id]}
                        notes={notes[task.id]}
                        onNotesChange={(id, val) => setNotes(prev => ({ ...prev, [id]: val }))}
                        onMarkComplete={markComplete}
                        onMarkUncomplete={markUncomplete}
                        navigate={navigate}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}