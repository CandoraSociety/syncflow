import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, FileText, Plus, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const RECORD_TYPES = [
  { value: "exposure_course", label: "Exposure Course" },
  { value: "paid_external_placement", label: "Paid External Placement" },
  { value: "employment_supports", label: "Employment Supports (PPE, tools, etc.)" },
];

function FinancialRecordForm({ clientId, clientName, record, onSave, onCancel }) {
  const [form, setForm] = useState(record || {
    client_id: clientId,
    client_name: clientName,
    record_type: "",
    description: "",
    amount: "",
    date: "",
    vendor: "",
    receipt_urls: [],
    completion_record_urls: [],
    notes: "",
  });
  const [uploading, setUploading] = useState(false);

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleUpload = async (e, field) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(prev => ({ ...prev, [field]: [...(prev[field] || []), file_url] }));
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeFile = (field, url) => {
    setForm(prev => ({ ...prev, [field]: prev[field].filter(u => u !== url) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (record?.id) {
      await base44.entities.FinancialRecord.update(record.id, form);
    } else {
      await base44.entities.FinancialRecord.create(form);
    }
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Record Type *</Label>
          <Select value={form.record_type} onValueChange={v => set("record_type", v)} required>
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>{RECORD_TYPES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Date</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Description</Label>
          <Input value={form.description} onChange={e => set("description", e.target.value)} placeholder="e.g. WHMIS certification course" />
        </div>
        <div className="space-y-1">
          <Label>Vendor / Provider</Label>
          <Input value={form.vendor} onChange={e => set("vendor", e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Amount ($)</Label>
          <Input type="number" step="0.01" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="0.00" />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Receipts</Label>
        <label className="flex items-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded p-3 cursor-pointer hover:bg-slate-50">
          <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload receipts"}
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={e => handleUpload(e, "receipt_urls")} disabled={uploading} />
        </label>
        {form.receipt_urls?.map((url, i) => (
          <div key={url} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2 text-sm">
            <FileText className="w-4 h-4 text-slate-400" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">Receipt {i + 1}</a>
            <button type="button" onClick={() => removeFile("receipt_urls", url)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label>Completion Records</Label>
        <label className="flex items-center gap-2 text-sm text-slate-500 border border-dashed border-slate-300 rounded p-3 cursor-pointer hover:bg-slate-50">
          <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload completion records"}
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={e => handleUpload(e, "completion_record_urls")} disabled={uploading} />
        </label>
        {form.completion_record_urls?.map((url, i) => (
          <div key={url} className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2 text-sm">
            <FileText className="w-4 h-4 text-slate-400" />
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex-1">Record {i + 1}</a>
            <button type="button" onClick={() => removeFile("completion_record_urls", url)}><X className="w-4 h-4 text-slate-400 hover:text-red-500" /></button>
          </div>
        ))}
      </div>

      <div className="space-y-1">
        <Label>Notes</Label>
        <Textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Record</Button>
      </div>
    </form>
  );
}

export default function ClientFinancials({ clientId, clientName }) {
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  const loadRecords = () => {
    base44.entities.FinancialRecord.filter({ client_id: clientId }).then(setRecords);
  };

  useEffect(() => { loadRecords(); }, [clientId]);

  const handleDelete = async (id) => {
    await base44.entities.FinancialRecord.delete(id);
    loadRecords();
  };

  const TYPE_LABELS = {
    exposure_course: "Exposure Course",
    paid_external_placement: "Paid Placement",
    employment_supports: "Employment Supports",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-semibold text-slate-700">Financial Records</h3>
        <Button onClick={() => { setEditingRecord(null); setShowForm(true); }} className="gap-2">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">{editingRecord ? "Edit Record" : "New Financial Record"}</CardTitle></CardHeader>
          <CardContent>
            <FinancialRecordForm
              clientId={clientId}
              clientName={clientName}
              record={editingRecord}
              onSave={() => { setShowForm(false); setEditingRecord(null); loadRecords(); }}
              onCancel={() => { setShowForm(false); setEditingRecord(null); }}
            />
          </CardContent>
        </Card>
      )}

      {records.length === 0 && !showForm && (
        <p className="text-slate-400 text-sm text-center py-8">No financial records yet.</p>
      )}

      {records.map(rec => (
        <Card key={rec.id}>
          <CardContent className="pt-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-semibold uppercase text-slate-500">{TYPE_LABELS[rec.record_type] || rec.record_type}</span>
                <p className="font-medium text-slate-800 mt-0.5">{rec.description || "—"}</p>
                <p className="text-sm text-slate-500">{rec.vendor && `Vendor: ${rec.vendor}`}{rec.amount && ` · $${rec.amount}`}{rec.date && ` · ${rec.date}`}</p>
                {rec.notes && <p className="text-sm text-slate-500 mt-1">{rec.notes}</p>}
                <div className="flex flex-wrap gap-2 mt-2">
                  {rec.receipt_urls?.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Receipt {i + 1}
                    </a>
                  ))}
                  {rec.completion_record_urls?.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Completion {i + 1}
                    </a>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => { setEditingRecord(rec); setShowForm(true); }}>
                  <FileText className="w-4 h-4 text-slate-400" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(rec.id)}>
                  <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}