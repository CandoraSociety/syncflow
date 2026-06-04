import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, FileText, Edit2 } from "lucide-react";
import { format, parseISO } from "date-fns";

export default function InvoicePackageDetail({ package: pkg, onUpdate, onClose }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(pkg.notes || "");

  const handleSaveNotes = async () => {
    await base44.entities.InvoicePackage.update(pkg.id, { notes });
    onUpdate();
    setEditingNotes(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{pkg.package_number}</h2>
            <p className="text-sm text-slate-500">
              {pkg.billing_month ? `${format(parseISO(pkg.billing_month + "-01"), "MMMM yyyy")} Billing Package` : "Billing Package"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            pkg.status === "draft" ? "bg-amber-100 text-amber-700" :
            pkg.status === "ready_for_review" ? "bg-blue-100 text-blue-700" :
            pkg.status === "submitted" ? "bg-purple-100 text-purple-700" :
            "bg-green-100 text-green-700"
          }`}>
            {pkg.status}
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="placements">Paid Placements</TabsTrigger>
          <TabsTrigger value="documents">Supporting Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Package Details</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared by:</span>
                  <span className="font-medium">{pkg.prepared_by_name || pkg.prepared_by}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Prepared date:</span>
                  <span className="font-medium">{pkg.prepared_date ? format(parseISO(pkg.prepared_date), "MMM d, yyyy") : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">CRT included:</span>
                  <span className="font-medium">{pkg.crt_included ? "Yes" : "No"}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  Notes
                  <button onClick={() => setEditingNotes(true)} className="text-slate-400 hover:text-slate-600">
                    <Edit2 className="w-3 h-3" />
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pkg.notes ? (
                  <p className="text-sm text-slate-600">{pkg.notes}</p>
                ) : (
                  <p className="text-sm text-slate-400 italic">No notes added</p>
                )}
              </CardContent>
            </Card>
          </div>

          {editingNotes && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-1">
                  <Label>Edit Notes</Label>
                  <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveNotes}>Save</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Auto-Populated Items</CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.auto_populated_items?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Category</th>
                      <th className="text-left px-3 py-2 font-semibold">Client</th>
                      <th className="text-left px-3 py-2 font-semibold">Description</th>
                      <th className="text-right px-3 py-2 font-semibold">Amount</th>
                      <th className="text-center px-3 py-2 font-semibold">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pkg.auto_populated_items.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 capitalize">{item.category.replace(/_/g, " ")}</td>
                        <td className="px-3 py-2">{item.client_name}</td>
                        <td className="px-3 py-2">{item.description}</td>
                        <td className="px-3 py-2 text-right font-medium">${item.amount?.toFixed(2)}</td>
                        <td className="px-3 py-2 text-center">
                          {item.receipt_uploaded ? (
                            <span className="text-green-600 text-xs font-medium">✓ Uploaded</span>
                          ) : (
                            <span className="text-amber-600 text-xs font-medium">Required</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No auto-populated items for this month</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Generated Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.invoice_id ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-600 mb-2">Invoice has been generated for this package</p>
                  <p className="text-xs text-slate-400">Invoice ID: {pkg.invoice_id}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-600 mb-4">No invoice generated yet</p>
                  <Button>Generate Invoice</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                Paid External Placements
                <Button size="sm" className="gap-1">
                  <Upload className="w-3 h-3" /> Add Placement
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pkg.paid_placements?.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-3 py-2 font-semibold">Client</th>
                      <th className="text-left px-3 py-2 font-semibold">Employer</th>
                      <th className="text-left px-3 py-2 font-semibold">Dates</th>
                      <th className="text-right px-3 py-2 font-semibold">Wage</th>
                      <th className="text-right px-3 py-2 font-semibold">Hours</th>
                      <th className="text-right px-3 py-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pkg.paid_placements.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2">{p.client_name}</td>
                        <td className="px-3 py-2">{p.employer_name}</td>
                        <td className="px-3 py-2 text-xs">
                          {p.placement_start_date} to {p.placement_end_date}
                        </td>
                        <td className="px-3 py-2 text-right">${p.wage_rate?.toFixed(2)}/hr</td>
                        <td className="px-3 py-2 text-right">{p.hours_worked}</td>
                        <td className="px-3 py-2 text-right font-semibold">${p.total_amount?.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No paid placements added</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Supporting Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500 mb-4">Upload receipts, attendance records, and other supporting documentation</p>
              {pkg.supporting_documents?.length > 0 ? (
                <div className="space-y-2">
                  {pkg.supporting_documents.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium">{doc.description}</p>
                          <p className="text-xs text-slate-500 capitalize">{doc.category.replace(/_/g, " ")}</p>
                        </div>
                      </div>
                      <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">No documents uploaded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}