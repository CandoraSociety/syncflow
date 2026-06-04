import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Plus, Upload, Package } from "lucide-react";
import CRT from "../pages/CRT";
import Invoices from "../pages/Invoices";
import SupportingDocuments from "@/components/billing/SupportingDocuments";
import InvoicePackageList from "@/components/billing/InvoicePackageList";
import InvoicePackageGenerator from "@/components/billing/InvoicePackageGenerator";
import InvoicePackageDetail from "@/components/billing/InvoicePackageDetail";

export default function MonthlyBillingSubmissions() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // list | generate | detail
  const [selectedPackage, setSelectedPackage] = useState(null);

  const loadPackages = async () => {
    const pkgs = await base44.entities.InvoicePackage.list("-prepared_date", 100);
    setPackages(pkgs);
    setLoading(false);
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const handleCreatePackage = () => setView("generate");
  
  const handlePackageSaved = (pkg) => {
    loadPackages();
    setSelectedPackage(pkg);
    setView("detail");
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setView("detail");
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5" /> Monthly Billing Submissions
            </h1>
            <p className="text-sm text-slate-500">Manage monthly invoice packages, CRT reports, and supporting documents</p>
          </div>
          <Button onClick={handleCreatePackage} className="gap-2">
            <Plus className="w-4 h-4" /> Create Invoice Package
          </Button>
        </div>
      </div>

      <div className="px-6 py-6">
        <Tabs defaultValue="packages">
          <TabsList className="mb-4">
            <TabsTrigger value="packages">Invoice Packages</TabsTrigger>
            <TabsTrigger value="crt">CRT</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="supporting-docs">Supporting Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="packages" className="space-y-4">
            {view === "list" && (
              <InvoicePackageList 
                packages={packages} 
                onSelectPackage={handlePackageSelect}
              />
            )}
            {view === "generate" && (
              <InvoicePackageGenerator
                onSave={handlePackageSaved}
                onClose={() => setView("list")}
              />
            )}
            {view === "detail" && selectedPackage && (
              <InvoicePackageDetail
                package={selectedPackage}
                onUpdate={loadPackages}
                onClose={() => setView("list")}
              />
            )}
          </TabsContent>

          <TabsContent value="crt">
            <CRT />
          </TabsContent>

          <TabsContent value="invoices">
            <Invoices />
          </TabsContent>

          <TabsContent value="supporting-docs">
            <SupportingDocuments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}