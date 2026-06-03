import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

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

const ACTION_PLAN_GROUP = ["barriers_identified", "action_plan"];

function TaskCard({ task, expanded, onToggle, completing, notes, onNotesChange, onMarkComplete, onMarkUncomplete }) {
  const navigate = useNavigate();
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

/**
 * Reusable Compass task list with pending/completed tabs.
 * Pass `tasks` (already filtered to the desired set) and `currentUser`.
 * `onRefresh` is called after any status change.
 */
export default function CompassTaskList({ tasks: initialTasks, currentUser, onRefresh }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [tab, setTab] = useState("pending");
  const [expanded, setExpanded] = useState({});
  const [completing, setCompleting] = useState({});
  const [notes, setNotes] = useState({});

  // Keep in sync when parent re-fetches
  if (initialTasks !== tasks && JSON.stringify(initialTasks.map(t => t.id + t.status)) !== JSON.stringify(tasks.map(t => t.id + t.status))) {
    setTasks(initialTasks);
  }

  const pending = tasks.filter(t => t.status === "pending");
  const completed = tasks.filter(t => t.status === "completed");
  const shown = tab === "pending" ? pending : completed;

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const reload = async () => {
    // Re-fetch just the tasks for this list by asking the parent to refresh
    if (onRefresh) await onRefresh();
  };

  const markComplete = async (task) => {
    setCompleting(prev => ({ ...prev, [task.id]: true }));
    await base44.entities.CompassTask.update(task.id, {
      status: "completed",
      completed_by: currentUser?.email || "",
      completed_by_name: currentUser?.full_name || currentUser?.email || "",
      completed_date: new Date().toISOString().split("T")[0],
      completed_notes: notes[task.id] || "",
    });
    await reload();
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
    await reload();
  };

  // Group by client name for the worker dashboard view (simpler than the full counsellor grouping)
  const apGroupTasks = shown.filter(t => ACTION_PLAN_GROUP.includes(t.task_type));
  const otherTasks = shown.filter(t => !ACTION_PLAN_GROUP.includes(t.task_type));

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab("pending")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "pending" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Pending ({pending.length})
        </button>
        <button
          onClick={() => setTab("completed")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "completed" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"}`}
        >
          Completed ({completed.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <div className="text-center py-10">
          <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
          <p className="text-slate-500 text-sm font-medium">
            {tab === "pending" ? "No pending Compass tasks — all caught up!" : "No completed tasks yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apGroupTasks.length > 0 && (
            <div className="border border-orange-200 rounded-xl bg-orange-50/40 p-3 space-y-2">
              <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide px-1">
                Action Plan &amp; Barriers
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
                />
              ))}
            </div>
          )}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}