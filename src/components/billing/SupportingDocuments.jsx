import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Trash2 } from "lucide-react";

const CATEGORIES = [
  { value: "exposure_course", label: "Exposure Course / Training" },
  { value: "employment_supports", label: "Employment Supports" },
  { value: "child_minding", label: "Child Minding Attendance" },
  { value: "paid_placement", label: "Paid External Placement" },
  { value: "other", label: "Other" },
];

export default function SupportingDocuments() {
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    category: "",
    description: "",
  });
  const [documents, setDocuments] = useState([]);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !form.category) return;
    
    setUploading(true);
    for (const file of files) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocuments(prev => [...prev, {
        id: crypto.randomUUID(),
        category: form.category,
        description: form.description,
        file_url,
        uploaded_date: new Date().toISOString(),
      }]);
    }
    setUploading(false);
    e.target.value = "";
  };

  const removeDocument = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Upload Supporting Documents</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input 
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the document"
              />
            </div>
          </div>

          <div className="border border-dashed border-slate-300 rounded-lg p-6 bg-slate-50">
            <label className="flex flex-col items-center gap-2 cursor-pointer">
              <Upload className={`w-8 h-8 ${uploading ? "text-slate-400" : "text-slate-500"}`} />
              <span className="text-sm text-slate-600">
                {uploading ? "Uploading..." : "Click to upload receipt or document (PDF, image, Word)"}
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading || !form.category}
              />
            </label>
            {!form.category && (
              <p className="text-xs text-amber-600 text-center mt-2">Please select a category first</p>
            )}
          </div>
        </CardContent>
      </Card>

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uploaded Documents ({documents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3">
                  <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{doc.description || "Untitled document"}</p>
                    <p className="text-xs text-slate-500">
                      {CATEGORIES.find(c => c.value === doc.category)?.label} • Uploaded {new Date(doc.uploaded_date).toLocaleDateString()}
                    </p>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                    View
                  </a>
                  <button onClick={() => removeDocument(doc.id)} className="text-slate-400 hover:text-red-500">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}