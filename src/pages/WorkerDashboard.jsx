import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ClientTable from "@/components/intake/ClientTable";
import ClientDetailModal from "@/components/worker/ClientDetailModal";
import { Button } from "@/components/ui/button";
import { LogOut, Users } from "lucide-react";

export default function WorkerDashboard() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const allClients = await base44.entities.Client.list("-created_date", 200);
      const myClients = allClients.filter(c => c.assigned_worker === me.email);
      setClients(myClients);
      setLoading(false);
    };
    init();
  }, []);

  const handleUpdate = async (id, data) => {
    const updated = await base44.entities.Client.update(id, data);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    setSelectedClient(updated);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Clients</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.full_name}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2 text-slate-600">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">{clients.length} assigned client{clients.length !== 1 ? "s" : ""}</span>
        </div>

        {clients.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No clients assigned yet</p>
            <p className="text-sm mt-1">Clients will appear here once the intake worker assigns them to you.</p>
          </div>
        ) : (
          <ClientTable clients={clients} onEdit={setSelectedClient} showWorkerColumn={false} />
        )}
      </main>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  );
}