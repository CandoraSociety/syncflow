import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { createCompassTask } from "@/lib/compassTasks";
import { format, addDays, differenceInDays } from "date-fns";
import { Play, CheckCircle2, XCircle, Calendar, ChevronDown, ChevronUp, Bell } from "lucide-react";

const EMPLOYMENT_CODES = [
  { value: "E-RF", label: "E-RF – Employed, Related Field" },
  { value: "E-UF", label: "E-UF – Employed, Unrelated Field" },
  { value: "E-PT", label: "E-PT – Employed, Part-Time" },
  { value: "UE", label: "UE – Unemployed" },
  { value: "UE-LA", label: "UE-LA – Unemployed, Looking Actively" },
  { value: "UE-S", label: "UE-S – Unemployed, Seasonal" },
  { value: "NA", label: "N/A" },
];

const FOLLOWUP_CODES = [...EMPLOYMENT_CODES, { value: "no_contact", label: "No Contact" }];

export default function ProgramStatusPanel({ client, onClientUpdate }) {
  const [saving, setSaving] = useState(false);
  const [activeForm, setActiveForm] = useState(null); // "start" | "complete" | "cancel" | "followup"

  // Form state
  const [startDate, setStartDate] = useState(client.service_start_date || "");
  const [completionDate, setCompletionDate] = useState(client.completion_date || "");
  const [cancelReason, setCancelReason] = useState("");
  const [postEmpStatus, setPostEmpStatus] = useState(client.post_completion_employment_status || "");
  const [postEmpDate, setPostEmpDate] = useState(client.post_completion_employment_date || "");
  const [followupEmpStatus, setFollowupEmpStatus] = useState(client.followup_90day_status || "");
  const [followupEmpDate, setFollowupEmpDate] = useState(client.post_completion_employment_date || "");

  const ps = client.program_status;
  const clientName = `${client.first_name} ${client.last_name}`;

  // 90-day follow-up date & urgency
  const followupDate = client.followup_90day_date
    ? new Date(client.followup_90day_date)
    : client.completion_date
    ? addDays(new Date(client.completion_date), 90)
    : null;

  const daysUntilFollowup = followupDate
    ? differenceInDays(followupDate, new Date())
    : null;

  const followupUrgent = daysUntilFollowup !== null && daysUntilFollowup >= 0 && daysUntilFollowup <= 5;
  const followupOverdue = daysUntilFollowup !== null && daysUntilFollowup < 0;
  const followupDone = !!client.followup_90day_status;

  async function addProgressNote(noteText, eventType) {
    const me = await base44.auth.me().catch(() => null);
    const newNote = {
      id: `program_${eventType}_${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      event_type: eventType,
      item_label: "Program Status",
      item_key: `program_${eventType}`,
      note: noteText,
      logged_by: me?.email || "",
      logged_by_name: me?.full_name || me?.email || "",
      compass_entered: false,
    };
    const existing = client.roadmap_progress_notes || [];
    return [...existing, newNote];
  }

  async function save(updates, progressNotes) {
    setSaving(true);
    const payload = { ...updates };
    if (progressNotes) payload.roadmap_progress_notes = progressNotes;
    await base44.entities.Client.update(client.id, payload);
    onClientUpdate?.({ ...client, ...payload });
    setSaving(false);
  }

  async function handleStart() {
    if (!startDate) return;
    const notes = await addProgressNote(
      `• Program marked as started — service start date: ${startDate}`,
      "started"
    );
    await save({ program_status: "in_progress", service_start_date: startDate }, notes);
    createCompassTask({
      client_id: client.id, client_name: clientName, compass_hsid: client.compass_hsid || "",
      assigned_worker: client.assigned_worker || "", assigned_worker_name: client.assigned_worker_name || "",
      task_type: "program_started",
      title: `Program started: ${clientName}`,
      instructions: `Program has been marked as started.\n\nClient: ${clientName}\nHSID#: ${client.compass_hsid || "unknown"}\nStart Date: ${startDate}\n\nAction: Update client program status to In Progress in Compass and record the service start date.`,
    });
    setActiveForm(null);
  }

  async function handleComplete() {
    if (!completionDate) return;
    const followup = format(addDays(new Date(completionDate), 90), "yyyy-MM-dd");
    const updates = {
      program_status: "complete",
      completion_date: completionDate,
      followup_90day_date: followup,
    };
    if (postEmpStatus) updates.post_completion_employment_status = postEmpStatus;
    if (postEmpDate) updates.post_completion_employment_date = postEmpDate;
    const notes = await addProgressNote(
      `• Program completed on ${completionDate}${postEmpStatus ? ` — employment status: ${postEmpStatus}` : ""}${postEmpDate ? `, employment start: ${postEmpDate}` : ""} — 90-day follow-up due: ${followup}`,
      "completed"
    );
    await save(updates, notes);
    createCompassTask({
      client_id: client.id, client_name: clientName, compass_hsid: client.compass_hsid || "",
      assigned_worker: client.assigned_worker || "", assigned_worker_name: client.assigned_worker_name || "",
      task_type: "program_completed",
      title: `Program completed: ${clientName}`,
      instructions: `Program has been marked as completed.\n\nClient: ${clientName}\nHSID#: ${client.compass_hsid || "unknown"}\nCompletion Date: ${completionDate}\nEmployment Status: ${postEmpStatus || "not entered"}\nEmployment Start: ${postEmpDate || "not entered"}\n90-Day Follow-Up Date: ${followup}\n\nAction: Update client program status to Complete in Compass, record completion date and employment outcome.`,
    });
    setActiveForm(null);
  }

  async function handleCancel() {
    const notes = await addProgressNote(
      `• Program marked as cancelled${cancelReason ? ` — reason: ${cancelReason}` : ""}`,
      "cancelled"
    );
    await save({ program_status: "cancelled", closed_reason: "cancelled", file_closed: true, closed_date: new Date().toISOString().slice(0, 10), closed_notes: cancelReason }, notes);
    createCompassTask({
      client_id: client.id, client_name: clientName, compass_hsid: client.compass_hsid || "",
      assigned_worker: client.assigned_worker || "", assigned_worker_name: client.assigned_worker_name || "",
      task_type: "program_cancelled",
      title: `Program cancelled: ${clientName}`,
      instructions: `Program has been marked as cancelled.\n\nClient: ${clientName}\nHSID#: ${client.compass_hsid || "unknown"}\nReason: ${cancelReason || "not specified"}\n\nAction: Update client program status to Cancelled in Compass.`,
    });
    setActiveForm(null);
  }

  async function handleFollowup() {
    if (!followupEmpStatus) return;
    const notes = await addProgressNote(
      `• 90-day follow-up recorded — employment status: ${followupEmpStatus}${followupEmpDate ? `, employment start: ${followupEmpDate}` : ""}`,
      "followup_90day"
    );
    await save({
      followup_90day_status: followupEmpStatus,
      post_completion_employment_date: followupEmpDate || client.post_completion_employment_date,
    }, notes);
    createCompassTask({
      client_id: client.id, client_name: clientName, compass_hsid: client.compass_hsid || "",
      assigned_worker: client.assigned_worker || "", assigned_worker_name: client.assigned_worker_name || "",
      task_type: "followup_90day",
      title: `90-day follow-up completed: ${clientName}`,
      instructions: `90-day follow-up has been recorded.\n\nClient: ${clientName}\nHSID#: ${client.compass_hsid || "unknown"}\nFollow-Up Date: ${client.followup_90day_date || "today"}\nEmployment Status: ${followupEmpStatus}\nEmployment Start: ${followupEmpDate || "not entered"}\n\nAction: Record 90-day employment outcome in Compass.`,
    });
    setActiveForm(null);
  }

  const toggle = (form) => setActiveForm(activeForm === form ? null : form);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Program Status</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {!ps && "Not started"}
            {ps === "in_progress" && `In progress${client.service_start_date ? ` · Started ${format(new Date(client.service_start_date), "MMM d, yyyy")}` : ""}`}
            {ps === "complete" && `Completed${client.completion_date ? ` · ${format(new Date(client.completion_date), "MMM d, yyyy")}` : ""}`}
            {ps === "cancelled" && "Cancelled"}
            {ps === "incomplete" && "Incomplete"}
          </p>
        </div>

        {/* Status badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {!ps && <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">Not Started</span>}
          {ps === "in_progress" && <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold">In Progress</span>}
          {ps === "complete" && <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">Complete</span>}
          {ps === "cancelled" && <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">Cancelled</span>}
          {ps === "incomplete" && <span className="text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-semibold">Incomplete</span>}
        </div>
      </div>

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        {/* Start Program */}
        {(!ps || ps === "in_progress") && (
          <Button
            size="sm" variant={ps === "in_progress" ? "outline" : "default"}
            onClick={() => toggle("start")}
            className={`gap-1.5 text-xs ${ps === "in_progress" ? "border-yellow-400 text-yellow-700 hover:bg-yellow-50" : "bg-yellow-500 hover:bg-yellow-600 text-white border-0"}`}
          >
            <Play className="w-3.5 h-3.5" fill="currentColor" />
            {ps === "in_progress" ? "Update Start Date" : "Mark Program Started"}
            {activeForm === "start" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}

        {/* Complete Program */}
        {(ps === "in_progress" || !ps) && (
          <Button
            size="sm" variant="outline"
            onClick={() => toggle("complete")}
            className="gap-1.5 text-xs border-green-400 text-green-700 hover:bg-green-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Program Completed
            {activeForm === "complete" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}

        {/* Cancel / Incomplete */}
        {ps !== "cancelled" && ps !== "incomplete" && (
          <Button
            size="sm" variant="outline"
            onClick={() => toggle("cancel")}
            className="gap-1.5 text-xs border-red-300 text-red-600 hover:bg-red-50"
          >
            <XCircle className="w-3.5 h-3.5" />
            Mark Cancelled / Incomplete
            {activeForm === "cancel" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        )}
      </div>

      {/* START FORM */}
      {activeForm === "start" && (
        <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-yellow-800">Program Start</p>
          <div className="space-y-1">
            <Label className="text-xs">Program / Service Start Date</Label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="max-w-xs" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!startDate || saving} onClick={handleStart} className="bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs">
              {saving ? "Saving…" : "Confirm — Program Started"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setActiveForm(null)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* COMPLETE FORM */}
      {activeForm === "complete" && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-green-800">Program Completion</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Completion Date *</Label>
              <Input type="date" value={completionDate} onChange={e => setCompletionDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Employment Status at Completion</Label>
              <Select value={postEmpStatus} onValueChange={setPostEmpStatus}>
                <SelectTrigger><SelectValue placeholder="Select code" /></SelectTrigger>
                <SelectContent>{EMPLOYMENT_CODES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Employment Start Date (if employed)</Label>
              <Input type="date" value={postEmpDate} onChange={e => setPostEmpDate(e.target.value)} />
            </div>
            {completionDate && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded-lg px-3 py-2 border border-green-200">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                90-day follow-up auto-set: <strong>{format(addDays(new Date(completionDate), 90), "MMM d, yyyy")}</strong>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={!completionDate || saving} onClick={handleComplete} className="bg-green-600 hover:bg-green-700 text-white border-0 text-xs">
              {saving ? "Saving…" : "Confirm — Program Completed"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setActiveForm(null)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* CANCEL FORM */}
      {activeForm === "cancel" && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
          <p className="text-xs font-semibold text-red-800">Cancel / Close Program</p>
          <div className="space-y-1">
            <Label className="text-xs">Reason (optional)</Label>
            <Input placeholder="e.g. Client relocated, withdrew, no contact..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button size="sm" disabled={saving} onClick={handleCancel} className="bg-red-600 hover:bg-red-700 text-white border-0 text-xs">
              {saving ? "Saving…" : "Confirm — Mark Cancelled"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setActiveForm(null)} className="text-xs">Cancel</Button>
          </div>
        </div>
      )}

      {/* 90-DAY FOLLOW-UP BUTTON — shown once program is complete */}
      {ps === "complete" && followupDate && (
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => !followupDone && toggle("followup")}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all
                ${followupDone
                  ? "bg-green-50 border-green-400 text-green-700 cursor-default"
                  : followupOverdue
                    ? "bg-red-50 border-red-400 text-red-700 hover:bg-red-100"
                    : followupUrgent
                      ? "bg-amber-50 border-amber-400 text-amber-800 hover:bg-amber-100 animate-pulse"
                      : "bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                }
              `}
            >
              {followupDone
                ? <CheckCircle2 className="w-4 h-4" />
                : <Bell className={`w-4 h-4 ${followupUrgent ? "animate-bounce" : ""}`} />
              }
              <span>90-Day Follow-Up</span>
              {followupDone
                ? <span className="text-xs font-normal opacity-70">— Done ({client.followup_90day_status})</span>
                : <span className="text-xs font-normal opacity-70">
                    {followupOverdue
                      ? `— Overdue by ${Math.abs(daysUntilFollowup)} day${Math.abs(daysUntilFollowup) !== 1 ? "s" : ""}`
                      : daysUntilFollowup === 0
                        ? "— Due today!"
                        : `— Due ${format(followupDate, "MMM d, yyyy")} (${daysUntilFollowup}d)`
                    }
                  </span>
              }
              {!followupDone && (activeForm === "followup" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
            </button>
          </div>

          {/* FOLLOWUP FORM */}
          {activeForm === "followup" && !followupDone && (
            <div className="mt-3 border border-blue-200 bg-blue-50 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-blue-800">Record 90-Day Follow-Up Outcome</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Employment Status at Follow-Up *</Label>
                  <Select value={followupEmpStatus} onValueChange={setFollowupEmpStatus}>
                    <SelectTrigger><SelectValue placeholder="Select code" /></SelectTrigger>
                    <SelectContent>{FOLLOWUP_CODES.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employment Start Date (if employed)</Label>
                  <Input type="date" value={followupEmpDate} onChange={e => setFollowupEmpDate(e.target.value)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled={!followupEmpStatus || saving} onClick={handleFollowup} className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-xs">
                  {saving ? "Saving…" : "Confirm 90-Day Follow-Up"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setActiveForm(null)} className="text-xs">Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}