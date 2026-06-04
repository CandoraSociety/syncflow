import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function InvoicePackageList({ packages, onSelectPackage }) {
  if (!packages || packages.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No invoice packages created yet</p>
          <p className="text-sm text-slate-400 mt-1">Create your first billing package to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {packages.map(pkg => (
        <Card 
          key={pkg.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onSelectPackage(pkg)}
        >
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm">{pkg.package_number}</CardTitle>
              <Badge variant={
                pkg.status === "draft" ? "secondary" :
                pkg.status === "ready_for_review" ? "default" :
                pkg.status === "submitted" ? "default" : "outline"
              } className="text-xs">
                {pkg.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>
                {pkg.billing_month ? format(parseISO(pkg.billing_month + "-01"), "MMMM yyyy") : "N/A"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-3 h-3 text-slate-400" />
              <span>{pkg.prepared_by_name || pkg.prepared_by}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="text-slate-500">CRT:</span>
                <span className="font-medium">{pkg.crt_included ? "Included" : "Not included"}</span>
              </div>
              {pkg.paid_placements?.length > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Placements:</span>
                  <span className="font-medium">{pkg.paid_placements.length}</span>
                </div>
              )}
              {pkg.supporting_documents?.length > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-slate-500">Documents:</span>
                  <span className="font-medium">{pkg.supporting_documents.length}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}