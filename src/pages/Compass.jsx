import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { format } from "date-fns";

const TASK_TYPE_COLORS = {
  new_client: "bg-blue-100 text-blue-700",
  service_type_change: "bg-purple-100 text-purple-700",
  program_status_change: "bg-amber-100 text-amber-700",
  employment_outcome: "bg-green-100 text-green-700",
  post_completion_employment: "bg-teal-100 text-teal-700",
  followup_90day: "bg-cyan-100 text-cyan-700",
  file_closed: "bg-red-100 text-red-700",
  service_navigation: "bg-indigo-100 text-indigo-700",
  barriers_identified: "bg-orange-100 text-orange-700",
};

const TASK_TYPE_LABELS = {
  new_client: "New Client",
  service_type_change: "Service Change",
  program_status_change: "Status Change",
  employment_outcome: "Employment",
  post_completion_employment: "Post-Completion",
  followup_90day: "90-Day Follow-Up",
  file_closed: "File Closed",
  service_navigation: "Service Navigation",
  barriers_identified: "Barriers",
};

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
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">
              {tab === "pending" ? "No pending Compass tasks — all caught up!" : "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(task => (
              <Card key={task.id} className={`border ${task.status === "completed" ? "border-slate-200 opacity-70" : "border-slate-300 shadow-sm"}`}>
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
                        onClick={() => toggleExpand(task.id)}
                      >
                        {expanded[task.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {expanded[task.id] && (
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
                          value={notes[task.id] || ""}
                          onChange={e => setNotes(prev => ({ ...prev, [task.id]: e.target.value }))}
                          className="text-sm"
                        />
                        <Button
                          onClick={() => markComplete(task)}
                          disabled={completing[task.id]}
                          className="gap-2 bg-green-700 hover:bg-green-800 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {completing[task.id] ? "Marking complete…" : "Mark as Entered in Compass"}
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
                          onClick={() => markUncomplete(task)}
                          className="gap-2 text-slate-500"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Mark as Pending Again
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}