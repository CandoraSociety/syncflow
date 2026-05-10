import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import IntakeForm from "@/components/intake/IntakeForm";
import ClientTable from "@/components/intake/ClientTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut } from "lucide-react";

export default function IntakePage() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const me = await base44.auth.me();
      setUser(me);
      const [clientList, userList] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.User.list()
      ]);
      setClients(clientList);
      setUsers(userList);
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async (data) => {
    if (editingClient) {
      const updated = await base44.entities.Client.update(editingClient.id, data);
      setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
    } else {
      const created = await base44.entities.Client.create({ ...data, intake_date: new Date().toISOString().split("T")[0] });
      setClients(prev => [created, ...prev]);
    }
    setShowForm(false);
    setEditingClient(null);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingClient(null);
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
          <h1 className="text-xl font-bold text-slate-800">Intake Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {user?.full_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2">
            <PlusCircle className="w-4 h-4" /> New Client
          </Button>
          <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {showForm ? (
          <IntakeForm
            client={editingClient}
            users={users}
            onSave={handleSave}
            onCancel={handleCancel}
          />
        ) : (
          <ClientTable clients={clients} onEdit={handleEdit} showWorkerColumn={true} />
        )}
      </main>
    </div>
  );
}