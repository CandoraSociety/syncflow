import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, X, Plus, Trash2, Loader2, CheckCircle2, Pencil } from "lucide-react";
import { base44 } from "@/api/base44Client";

export const EXPOSURE_COURSE_TYPES = [
  "WHMIS",
  "First Aid/CPR",
  "Food Safety",
  "Forklift Certification",
  "Customer Service Training",
  "Other",
];

const EMPLOYMENT_SUPPORT_TYPES = [
  "PPE (Personal Protective Equipment)",
  "Work Boots / Safety Footwear",
  "Tools / Equipment",
  "Work Clothing / Uniform",
  "Transportation Support",
  "Licensing / Certification Fees",
  "Other",
];

const REGISTRATION_STATUSES = [
  { value: "not_registered", label: "Not Registered" },
  { value: "registered", label: "Registered" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "cancelled", label: "Cancelled" },
];

const COMPLETION_STATUSES = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "did_not_complete", label: "Did Not Complete" },
];

// Parse a receipt/invoice image using AI
async function parseReceiptWithAI(fileUrl) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are analyzing a receipt or invoice image. Extract the following fields and return them as JSON:
- vendor: the vendor/company name
- date: date of payment in YYYY-MM-DD format (if found)
- subtotal: dollar amount before tax (number, no $ sign)
- tax: tax amount (number, no $ sign, 0 if not shown)
- total: total amount including tax (number, no $ sign)
- description: brief description of what was purchased
Return ONLY valid JSON with these fields. If a field cannot be found, use null.`,
    file_urls: [fileUrl],
    response_json_schema: {
      type: "object",
      properties: {
        vendor: { type: "string" },
        date: { type: "string" },
        subtotal: { type: "number" },
        tax: { type: "number" },
        total: { type: "number" },
        description: { type: "string" },
      },
    },
  });
  return result;
}

// Single financial record editor (inline within Supports tab)
function SupportRecordEditor({ record, onSave, onCancel, onDelete, clientId, clientName, assignedWorker }) {
  const [form, setForm] = useState(record || {
    client_id: clientId,
    client_name: clientName,
    assigned_worker: assignedWorker,
    record_type: "exposure_course",
    course_type: "",
    course_type_other: "",
    description: "",
    amount: "",
    tax: "",
    total: "",
    date: "",
    vendor: "",
    registration_status: "not_registered",
    completion_status: "not_started",
    receipt_urls: [],
    completion_record_urls: [],
    notes: "",
  });
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // Auto-calc total when amount or tax changes
  const handleAmountChange = (field, val) => {
    const updated = { ...form, [field]: val };
    const amt = parseFloat(updated.amount) || 0;
    const tax = parseFloat(updated.tax) || 0;
    updated.total = (amt + tax).toFixed(2);
    setForm(updated);
  };

  const handleReceiptUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, receipt_urls: [...(prev.receipt_urls || []), file_url] }));

      // Auto-parse first uploaded receipt
      if (!form.receipt_parsed && (file.type.startsWith("image/") || file.type === "application/pdf")) {
        setParsing(true);
        const parsed = await parseReceiptWithAI(file_url);
        setParsing(false);
        setForm(prev => ({
          ...prev,
          receipt_parsed: true,
          vendor: prev.vendor || parsed.vendor || "",
          date: prev.date || parsed.date || "",
          amount: prev.amount || (parsed.subtotal != null ? String(parsed.subtotal) : ""),
          tax: prev.tax || (parsed.tax != null ? String(parsed.tax) : ""),
          total: prev.total || (parsed.total != null ? String(parsed.total) : ""),
          description: prev.description || parsed.description || "",
        }));
      }
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleCompletionUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, completion_record_urls: [...(prev.completion_record_urls || []), file_url] }));
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    // Compute billing_month from date
    const billingMonth = form.date ? form.date.substring(0, 7) : null;
    const saveData = { ...form, billing_month: billingMonth || form.billing_month };
    if (saveData.amount) saveData.amount = parseFloat(saveData.amount);
    if (saveData.tax) saveData.tax = parseFloat(saveData.tax);
    if (saveData.total) saveData.total = parseFloat(saveData.total);

    let saved;
    if (record?.id) {
      saved = await base44.entities.FinancialRecord.update(record.id, saveData);
    } else {
      saved = await base44.entities.FinancialRecord.create(saveData);
    }
    setSaving(false);
    onSave(saved);
  };

  const isCourse = form.record_type === "exposure_course";

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
      {/* Type selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Record Type *</Label>
          <Select value={form.record_type} onValueChange={v => set("record_type", v)}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="exposure_course">Exposure Course / Training</SelectItem>
              <SelectItem value="employment_supports">Employment Supports</SelectItem>
              <SelectItem value="paid_external_placement">Paid External Placement</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isCourse && (
          <div className="space-y-1">
            <Label className="text-xs">Course Type *</Label>
            <Select value={form.course_type} onValueChange={v => set("course_type", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select course type..." /></SelectTrigger>
              <SelectContent>
                {EXPOSURE_COURSE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {!isCourse && (
          <div className="space-y-1">
            <Label className="text-xs">Support Type</Label>
            <Select value={form.course_type} onValueChange={v => set("course_type", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select type..." /></SelectTrigger>
              <SelectContent>
                {EMPLOYMENT_SUPPORT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {form.course_type === "Other" && (
        <div className="space-y-1">
          <Label className="text-xs">Specify Course/Support Type</Label>
          <Input value={form.course_type_other} onChange={e => set("course_type_other", e.target.value)} placeholder="Describe the course or support..." />
        </div>
      )}

      {/* Course-specific status fields */}
      {isCourse && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs">Registration Status</Label>
            <Select value={form.registration_status || "not_registered"} onValueChange={v => set("registration_status", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGISTRATION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Completion Status</Label>
            <Select value={form.completion_status || "not_started"} onValueChange={v => set("completion_status", v)}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {COMPLETION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Core fields */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Description</Label>
          <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. WHMIS 2018 online course" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Vendor / Provider</Label>
          <Input value={form.vendor} onChange={e => set("vendor", e.target.value)} placeholder="Provider name" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Date of Payment</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
      </div>

      {/* Financial fields */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Subtotal ($)</Label>
          <Input type="number" step="0.01" value={form.amount} onChange={e => handleAmountChange("amount", e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tax ($)</Label>
          <Input type="number" step="0.01" value={form.tax} onChange={e => handleAmountChange("tax", e.target.value)} placeholder="0.00" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Total ($)</Label>
          <Input type="number" step="0.01" value={form.total} onChange={e => set("total", e.target.value)} placeholder="0.00" className="bg-slate-50" />
        </div>
      </div>

      {/* Receipt upload */}
      <div className="space-y-2">
        <Label className="text-xs flex items-center gap-2">
          Receipt / Invoice
          {parsing && <span className="flex items-center gap-1 text-amber-600 text-xs font-normal"><Loader2 className="w-3 h-3 animate-spin" /> Parsing receipt...</span>}
          {form.receipt_parsed && !parsing && <span className="flex items-center gap-1 text-green-600 text-xs font-normal"><CheckCircle2 className="w-3 h-3" /> Auto-filled from receipt</span>}
        </Label>
        <label className={`flex items-center gap-2 text-sm border border-dashed rounded-lg p-3 cursor-pointer transition-colors ${uploading ? "border-slate-200 text-slate-400" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading..." : "Upload receipt (AI will auto-fill fields)"}
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleReceiptUpload} disabled={uploading} />
        </label>
        {form.receipt_urls?.map((url, i) => (
          <div key={url} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">Receipt {i + 1}</a>
            <button type="button" onClick={() => set("receipt_urls", form.receipt_urls.filter(u => u !== url))}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
          </div>
        ))}
      </div>

      {/* Completion records */}
      {isCourse && (
        <div className="space-y-2">
          <Label className="text-xs">Completion Records / Certificates</Label>
          <label className={`flex items-center gap-2 text-sm border border-dashed rounded-lg p-3 cursor-pointer transition-colors ${uploading ? "border-slate-200 text-slate-400" : "border-slate-300 text-slate-500 hover:bg-slate-50"}`}>
            <Upload className="w-4 h-4" />
            {uploading ? "Uploading..." : "Upload completion certificate or record"}
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleCompletionUpload} disabled={uploading} />
          </label>
          {form.completion_record_urls?.map((url, i) => (
            <div key={url} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">Document {i + 1}</a>
              <button type="button" onClick={() => set("completion_record_urls", form.completion_record_urls.filter(u => u !== url))}><X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" /></button>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1">
        <Label className="text-xs">Notes</Label>
        <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Additional details..." />
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        {record?.id && onDelete && (
          <button onClick={() => onDelete(record.id)} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !form.record_type}>
            {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />Saving…</> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function RecordCard({ record, onEdit, onDelete }) {
  const regLabel = REGISTRATION_STATUSES.find(s => s.value === record.registration_status)?.label;
  const compLabel = COMPLETION_STATUSES.find(s => s.value === record.completion_status)?.label;
  const typeLabel = record.record_type === "exposure_course" ? "Exposure Course" :
                    record.record_type === "employment_supports" ? "Employment Support" : "Paid Placement";
  const courseDisplay = record.course_type === "Other" ? record.course_type_other : record.course_type;

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{typeLabel}</span>
            {courseDisplay && <span className="text-xs text-slate-600 font-medium">{courseDisplay}</span>}
            {record.completion_status === "completed" && (
              <span className="text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Completed
              </span>
            )}
          </div>
          {record.description && <p className="text-sm text-slate-700 mt-1">{record.description}</p>}
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-slate-500">
            {record.vendor && <span>Vendor: {record.vendor}</span>}
            {record.date && <span>Date: {record.date}</span>}
            {record.total != null && <span className="font-semibold text-slate-700">Total: ${Number(record.total).toFixed(2)}</span>}
            {record.amount != null && record.tax != null && <span>(Subtotal ${Number(record.amount).toFixed(2)} + Tax ${Number(record.tax).toFixed(2)})</span>}
          </div>
          {(regLabel || compLabel) && (
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {regLabel && <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded">Reg: {regLabel}</span>}
              {compLabel && <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">Status: {compLabel}</span>}
            </div>
          )}
          {record.notes && <p className="text-xs text-slate-400 mt-1 italic">{record.notes}</p>}
        </div>
        <div className="flex gap-1 shrink-0 ml-2">
          <button onClick={onEdit} className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete} className="p-1.5 hover:bg-red-50 rounded text-slate-400 hover:text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Receipts row */}
      {(record.receipt_urls?.length > 0 || record.completion_record_urls?.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          {record.receipt_urls?.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <FileText className="w-3 h-3" /> Receipt {i + 1}
            </a>
          ))}
          {record.completion_record_urls?.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline flex items-center gap-1">
              <FileText className="w-3 h-3" /> Completion Doc {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ExposuresSupportsStep({ client, onSave }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const clientName = `${client?.first_name || ""} ${client?.last_name || ""}`.trim();
  const stepNum = client?.service_type === "pathways" ? "5" : "4";

  const loadRecords = async () => {
    if (!client?.id) return;
    const recs = await base44.entities.FinancialRecord.filter({ client_id: client.id });

    // Auto-seed draft records from the action plan if none exist yet
    if (recs.length === 0) {
      const seeds = [];
      const sdpItems = client?.sdp_items || [];
      const sdpDetails = client?.sdp_item_details || {};
      const isDEA = client?.service_type === "direct_to_employment";

      // For DEA: check each eda_N slot for exposure_course or employment_supports activity
      if (isDEA) {
        const edaKeys = Object.keys(sdpDetails).filter(k => k.startsWith("eda_"));
        edaKeys.forEach(key => {
          const d = sdpDetails[key] || {};
          if (d.activity === "exposure_course") {
            const courseTypes = d.course_types?.length > 0 ? d.course_types : [null];
            courseTypes.forEach(ct => {
              seeds.push({
                client_id: client.id,
                client_name: clientName,
                assigned_worker: client.assigned_worker,
                record_type: "exposure_course",
                course_type: ct || "",
                course_type_other: ct === "Other" ? (d.course_type_other || "") : "",
                description: ct ? ct : "",
                notes: d.notes || "",
                registration_status: "not_registered",
                completion_status: "not_started",
                receipt_urls: [],
                completion_record_urls: [],
              });
            });
          } else if (d.activity === "employment_supports") {
            seeds.push({
              client_id: client.id,
              client_name: clientName,
              assigned_worker: client.assigned_worker,
              record_type: "employment_supports",
              course_type: d.support_type || "",
              description: d.other_desc || d.notes || "",
              notes: d.notes || "",
              receipt_urls: [],
              completion_record_urls: [],
            });
          }
        });
      } else {
        // Pathways / other: check sdp_items
        if (sdpItems.includes("exposure_course")) {
          const detail = sdpDetails["exposure_course"] || {};
          const courseTypes = detail.course_types?.length > 0 ? detail.course_types : [null];
          courseTypes.forEach(ct => {
            seeds.push({
              client_id: client.id,
              client_name: clientName,
              assigned_worker: client.assigned_worker,
              record_type: "exposure_course",
              course_type: ct || "",
              course_type_other: ct === "Other" ? (detail.course_type_other || "") : "",
              description: ct ? ct : "",
              notes: detail.notes || "",
              registration_status: "not_registered",
              completion_status: "not_started",
              receipt_urls: [],
              completion_record_urls: [],
            });
          });
        }
        if (sdpItems.includes("employment_supports")) {
          const detail = sdpDetails["employment_supports"] || {};
          seeds.push({
            client_id: client.id,
            client_name: clientName,
            assigned_worker: client.assigned_worker,
            record_type: "employment_supports",
            course_type: detail.support_type || "",
            description: detail.notes || "",
            notes: detail.notes || "",
            receipt_urls: [],
            completion_record_urls: [],
          });
        }
        if (sdpItems.includes("paid_external_placement")) {
          seeds.push({
            client_id: client.id,
            client_name: clientName,
            assigned_worker: client.assigned_worker,
            record_type: "paid_external_placement",
            description: "",
            notes: "",
            receipt_urls: [],
            completion_record_urls: [],
          });
        }
      }

      if (seeds.length > 0) {
        await base44.entities.FinancialRecord.bulkCreate(seeds);
        const seeded = await base44.entities.FinancialRecord.filter({ client_id: client.id });
        setRecords(seeded);
        setLoading(false);
        return;
      }
    }

    setRecords(recs);
    setLoading(false);
  };

  useEffect(() => { loadRecords(); }, [client?.id]);

  // Sync client-level flags based on records
  const syncClientFlags = async (updatedRecords) => {
    const hasExposure = updatedRecords.some(r => r.record_type === "exposure_course");
    const hasSupports = updatedRecords.some(r => r.record_type === "employment_supports");
    const updates = {};
    if (hasExposure !== !!client?.exposure_course) updates.exposure_course = hasExposure;
    if (hasSupports !== !!client?.employment_supports) updates.employment_supports = hasSupports;
    if (Object.keys(updates).length > 0) await onSave(updates);
  };

  const handleSaveRecord = async (saved) => {
    setShowForm(false);
    setEditingRecord(null);
    await loadRecords();
    const updated = await base44.entities.FinancialRecord.filter({ client_id: client.id });
    await syncClientFlags(updated);
  };

  const handleDelete = async (id) => {
    await base44.entities.FinancialRecord.delete(id);
    setEditingRecord(null);
    setShowForm(false);
    const updated = await base44.entities.FinancialRecord.filter({ client_id: client.id });
    setRecords(updated);
    await syncClientFlags(updated);
  };

  // Group by type for display
  const courses = records.filter(r => r.record_type === "exposure_course");
  const supports = records.filter(r => r.record_type === "employment_supports");
  const placements = records.filter(r => r.record_type === "paid_external_placement");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Step {stepNum} — Exposure Courses & Supports</h2>
          <p className="text-sm text-slate-500 mt-1">
            Track exposure courses, employment supports, and paid placements. Receipts are auto-parsed and pushed to Billing &amp; CRT.
          </p>
        </div>
        <Button size="sm" className="gap-2 shrink-0" onClick={() => { setEditingRecord(null); setShowForm(true); }}>
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {/* Add / Edit form */}
      {showForm && !editingRecord && (
        <SupportRecordEditor
          clientId={client?.id}
          clientName={clientName}
          assignedWorker={client?.assigned_worker}
          onSave={handleSaveRecord}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading records...
        </div>
      )}

      {!loading && records.length === 0 && !showForm && (
        <div className="text-center py-12 text-slate-400 text-sm bg-slate-50 rounded-xl border border-slate-200">
          <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
          <p>No records yet. Click "Add Record" to log an exposure course or employment support.</p>
        </div>
      )}

      {/* Exposure Courses */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" /> Exposure Courses ({courses.length})
          </h3>
          {courses.map(rec => (
            editingRecord?.id === rec.id ? (
              <SupportRecordEditor
                key={rec.id}
                record={editingRecord}
                clientId={client?.id}
                clientName={clientName}
                assignedWorker={client?.assigned_worker}
                onSave={handleSaveRecord}
                onCancel={() => setEditingRecord(null)}
                onDelete={handleDelete}
              />
            ) : (
              <RecordCard
                key={rec.id}
                record={rec}
                onEdit={() => { setShowForm(false); setEditingRecord(rec); }}
                onDelete={() => handleDelete(rec.id)}
              />
            )
          ))}
        </div>
      )}

      {/* Employment Supports */}
      {supports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Employment Supports ({supports.length})
          </h3>
          {supports.map(rec => (
            editingRecord?.id === rec.id ? (
              <SupportRecordEditor
                key={rec.id}
                record={editingRecord}
                clientId={client?.id}
                clientName={clientName}
                assignedWorker={client?.assigned_worker}
                onSave={handleSaveRecord}
                onCancel={() => setEditingRecord(null)}
                onDelete={handleDelete}
              />
            ) : (
              <RecordCard
                key={rec.id}
                record={rec}
                onEdit={() => { setShowForm(false); setEditingRecord(rec); }}
                onDelete={() => handleDelete(rec.id)}
              />
            )
          ))}
        </div>
      )}

      {/* Paid Placements */}
      {placements.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Paid External Placements ({placements.length})
          </h3>
          {placements.map(rec => (
            editingRecord?.id === rec.id ? (
              <SupportRecordEditor
                key={rec.id}
                record={editingRecord}
                clientId={client?.id}
                clientName={clientName}
                assignedWorker={client?.assigned_worker}
                onSave={handleSaveRecord}
                onCancel={() => setEditingRecord(null)}
                onDelete={handleDelete}
              />
            ) : (
              <RecordCard
                key={rec.id}
                record={rec}
                onEdit={() => { setShowForm(false); setEditingRecord(rec); }}
                onDelete={() => handleDelete(rec.id)}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}