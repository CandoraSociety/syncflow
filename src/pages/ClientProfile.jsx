import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, XCircle, RotateCcw } from "lucide-react";
import CloseFileDialog from "@/components/client/CloseFileDialog";
import ClientProfileOverview from "@/components/client/ClientProfileOverview";
import ClientServicePlan from "@/components/client/ClientServicePlan";
import ClientPlacements from "@/components/client/ClientPlacements";
import ClientReferrals from "@/components/client/ClientReferrals";
import ClientEmployment from "@/components/client/ClientEmployment";
import ClientFinancials from "@/components/client/ClientFinancials";
import ClientStreamSwitches from "@/components/client/ClientStreamSwitches";
import ClientTraining from "@/components/client/ClientTraining";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closingSaving, setClosingSaving] = useState(false);

  useEffect(() => {
    base44.entities.Client.list().then(clients => {
      const found = clients.find(c => c.id === id);
      setClient(found || null);
      setLoading(false);
    });
  }, [id]);

  const handleSave = async (updates) => {
    const updated = await base44.entities.Client.update(id, updates);
    setClient(prev => ({ ...prev, ...updates }));
    return updated;
  };

  const handleCloseFile = async (data) => {
    setClosingSaving(true);
    await base44.entities.Client.update(id, data);
    setClient(prev => ({ ...prev, ...data }));
    setClosingSaving(false);
    setShowCloseDialog(false);
  };

  const handleReopenFile = async () => {
    const updates = { file_closed: false, status: "active" };
    await base44.entities.Client.update(id, updates);
    setClient(prev => ({ ...prev, ...updates }));
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  if (!client) return (
    <div className="p-8 text-center text-slate-500">Client not found.</div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-800">
                {client.first_name} {client.last_name}
              </h1>
              {client.file_closed && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Closed</span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {client.compass_hsid ? `HSID: ${client.compass_hsid}` : ""}
              {client.compass_hsid && client.service_type ? " · " : ""}
              {client.service_type ? client.service_type.replace(/_/g, " ") : ""}
              {client.file_closed && client.closed_reason ? ` · Closed: ${client.closed_reason.replace(/_/g, " ")}` : ""}
            </p>
          </div>
        </div>
        <div>
          {client.file_closed ? (
            <Button variant="outline" size="sm" onClick={handleReopenFile} className="gap-2 text-slate-600">
              <RotateCcw className="w-4 h-4" /> Reopen File
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCloseDialog(true)}
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" /> Close File
            </Button>
          )}
        </div>
      </div>

      <CloseFileDialog
        open={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onConfirm={handleCloseFile}
        saving={closingSaving}
      />

      <div className="max-w-6xl mx-auto p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="service_plan">Service Plan</TabsTrigger>
            <TabsTrigger value="placements">Placements</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="training">Training</TabsTrigger>
            <TabsTrigger value="stream_switches" className="relative">
              Stream Switches
              {client.program_stream_switches?.length > 0 && (
                <span className="ml-1.5 bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
                  {client.program_stream_switches.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ClientProfileOverview client={client} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="service_plan">
            <ClientServicePlan client={client} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="placements">
            <ClientPlacements client={client} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="referrals">
            <ClientReferrals client={client} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="employment">
            <ClientEmployment client={client} onSave={handleSave} />
          </TabsContent>
          <TabsContent value="financials">
            <ClientFinancials clientId={id} clientName={`${client.first_name} ${client.last_name}`} />
          </TabsContent>
          <TabsContent value="training">
            <ClientTraining client={client} />
          </TabsContent>
          <TabsContent value="stream_switches">
            <ClientStreamSwitches client={client} onSave={handleSave} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}