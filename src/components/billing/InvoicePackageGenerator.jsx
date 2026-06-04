import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Save } from "lucide-react";
import { format } from "date-fns";

export default function InvoicePackageGenerator({ onSave, onClose }) {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    billing_month: format(new Date(), "yyyy-MM"),
    config_id: "",
    notes: "",
    crt_included: true
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.InvoiceConfig.filter({ is_active: true })
    ]).then(([user, activeConfigs]) => {
      setCurrentUser(user);
      setConfigs(activeConfigs);
      if (activeConfigs.length > 0) {
        setFormData(prev => ({ ...prev, config_id: activeConfigs[0].id }));
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!formData.billing_month || !formData.config_id) return;
    
    setSaving(true);
    try {
      const pkg = await base44.entities.InvoicePackage.create({
        package_number: `PKG-${formData.billing_month.replace("-", "")}`,
        billing_month: formData.billing_month,
        config_id: formData.config_id,
        prepared_by: currentUser.email,
        prepared_by_name: currentUser.full_name,
        prepared_date: format(new Date(), "yyyy-MM-dd"),
        crt_included: formData.crt_included,
        notes: formData.notes,
        status: "draft",
        supporting_documents: [],
        paid_placements: [],
        auto_populated_items: []
      });
      
      onSave(pkg);
    } catch (error) {
      console.error("Error creating package:", error);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Create Invoice Package</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Billing Month</Label>
          <Input 
            type="month" 
            value={formData.billing_month}
            onChange={e => setFormData({...formData, billing_month: e.target.value})}
            className="mt-1"
          />
        </div>

        <div>
          <Label>Contract Configuration</Label>
          <Select 
            value={formData.config_id}
            onValueChange={value => setFormData({...formData, config_id: value})}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select configuration" />
            </SelectTrigger>
            <SelectContent>
              {configs.map(config => (
                <SelectItem key={config.id} value={config.id}>
                  {config.config_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="crt-included"
            checked={formData.crt_included}
            onChange={e => setFormData({...formData, crt_included: e.target.checked})}
            className="h-4 w-4"
          />
          <Label htmlFor="crt-included" className="text-sm font-normal">Include CRT Report</Label>
        </div>

        <div>
          <Label>Notes</Label>
          <Textarea 
            value={formData.notes}
            onChange={e => setFormData({...formData, notes: e.target.value})}
            placeholder="Add any notes about this billing package..."
            rows={3}
            className="mt-1"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.billing_month || !formData.config_id} className="flex-1">
            <Save className="w-4 h-4 mr-2" /> {saving ? "Creating..." : "Create Package"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}