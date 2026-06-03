import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, RotateCcw, User } from "lucide-react";
import CompassTaskList from "@/components/compass/CompassTaskList";

const ACTION_PLAN_GROUP = ["barriers_identified", "action_plan"];

function groupTasksByCounsellor(tasks) {
  const groups = {};
  for (const task of tasks) {
    const key = task.assigned_worker_name || task.triggered_by_name || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(task);
  }
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

export default function Compass() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => setCurrentUser(u)).catch(() => {});
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    const all = await base44.entities.CompassTask.list("-created_date", 500);
    setTasks(all);
    setLoading(false);
  };

  const pending = tasks.filter(t => t.status === "pending");

  // Group ALL tasks by counsellor (CompassTaskList handles its own pending/completed tabs)
  const grouped = groupTasksByCounsellor(tasks);
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
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No Compass tasks yet.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {counsellorNames.map(counsellor => {
              const counsellorTasks = grouped[counsellor];
              return (
                <div key={counsellor}>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold" style={{ background: "hsl(231,64%,20%)", color: "white" }}>
                      <User className="w-3.5 h-3.5" />
                      {counsellor}
                    </div>
                    <span className="text-xs text-slate-400">{counsellorTasks.filter(t => t.status === "pending").length} pending</span>
                  </div>
                  <div className="pl-1">
                    <CompassTaskList
                      tasks={counsellorTasks}
                      currentUser={currentUser}
                      onRefresh={loadTasks}
                    />
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