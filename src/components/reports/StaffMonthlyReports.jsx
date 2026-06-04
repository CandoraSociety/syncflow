import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FileText, Save, Send, Filter, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function StaffMonthlyReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [filterWorker, setFilterWorker] = useState("all");
  const [workers, setWorkers] = useState([]);
  
  // Form state
  const [editingReport, setEditingReport] = useState(null);
  const [formData, setFormData] = useState({
    trends: "",
    marketing_activities: "",
    success_stories: "",
    employer_engagements: "",
    challenges: "",
    goals_next_month: "",
    additional_notes: ""
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.auth.me(),
      base44.entities.StaffMonthlyReport.list("-submitted_date"),
      base44.entities.Client.list()
    ]).then(([user, reportsData, clients]) => {
      setCurrentUser(user);
      setReports(reportsData);
      
      // Extract unique workers from clients
      const uniqueWorkers = [...new Set(clients.map(c => c.assigned_worker_name).filter(Boolean))].sort();
      setWorkers(uniqueWorkers);
      
      // Set default month to current month
      const currentMonth = format(new Date(), "yyyy-MM");
      setSelectedMonth(currentMonth);
      
      // Check if user already has a report for this month
      const existingReport = reportsData.find(r => 
        r.submitted_by === user.email && 
        r.report_month === currentMonth
      );
      
      if (existingReport) {
        setEditingReport(existingReport);
        setFormData({
          trends: existingReport.trends || "",
          marketing_activities: existingReport.marketing_activities || "",
          success_stories: existingReport.success_stories || "",
          employer_engagements: existingReport.employer_engagements || "",
          challenges: existingReport.challenges || "",
          goals_next_month: existingReport.goals_next_month || "",
          additional_notes: existingReport.additional_notes || ""
        });
      }
      
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    if (!selectedMonth) return;
    
    setSaving(true);
    try {
      if (editingReport) {
        await base44.entities.StaffMonthlyReport.update(editingReport.id, {
          ...formData,
          report_month: selectedMonth,
          submitted_by: currentUser.email,
          submitted_by_name: currentUser.full_name,
          submitted_date: format(new Date(), "yyyy-MM-dd"),
          status: "draft"
        });
      } else {
        await base44.entities.StaffMonthlyReport.create({
          ...formData,
          report_month: selectedMonth,
          submitted_by: currentUser.email,
          submitted_by_name: currentUser.full_name,
          submitted_date: format(new Date(), "yyyy-MM-dd"),
          status: "draft"
        });
      }
      
      // Refresh reports
      const updatedReports = await base44.entities.StaffMonthlyReport.list("-submitted_date");
      setReports(updatedReports);
      
      // Update editing report reference
      const updated = updatedReports.find(r => 
        r.submitted_by === currentUser.email && r.report_month === selectedMonth
      );
      setEditingReport(updated);
    } catch (error) {
      console.error("Error saving report:", error);
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    if (!editingReport) return;
    
    setSaving(true);
    try {
      await base44.entities.StaffMonthlyReport.update(editingReport.id, {
        status: "submitted"
      });
      
      const updatedReports = await base44.entities.StaffMonthlyReport.list("-submitted_date");
      setReports(updatedReports);
      
      const updated = updatedReports.find(r => r.id === editingReport.id);
      setEditingReport(updated);
    } catch (error) {
      console.error("Error submitting report:", error);
    }
    setSaving(false);
  };

  const filteredReports = reports.filter(r => {
    if (filterWorker !== "all" && r.submitted_by_name !== filterWorker) return false;
    return true;
  });

  const groupedReports = filteredReports.reduce((acc, report) => {
    const month = report.report_month;
    if (!acc[month]) acc[month] = [];
    acc[month].push(report);
    return acc;
  }, {});

  const sortedMonths = Object.keys(groupedReports).sort().reverse();

  if (loading) return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Staff Monthly Reports
        </h1>
        <p className="text-sm text-slate-500">Submit and view narrative monthly reports</p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" /> 
                My Report - {selectedMonth ? format(parseISO(selectedMonth + "-01"), "MMMM yyyy") : "Select Month"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Report Month</Label>
                <Input 
                  type="month" 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="mt-1"
                />
              </div>

              <Tabs defaultValue="trends">
                <TabsList className="w-full">
                  <TabsTrigger value="trends" className="flex-1 text-xs">Trends</TabsTrigger>
                  <TabsTrigger value="marketing" className="flex-1 text-xs">Marketing</TabsTrigger>
                  <TabsTrigger value="success" className="flex-1 text-xs">Success Stories</TabsTrigger>
                  <TabsTrigger value="employer" className="flex-1 text-xs">Employer</TabsTrigger>
                </TabsList>

                <TabsContent value="trends" className="mt-4 space-y-3">
                  <div>
                    <Label>Trends Observed</Label>
                    <Textarea 
                      value={formData.trends}
                      onChange={e => setFormData({...formData, trends: e.target.value})}
                      placeholder="Describe trends, patterns, or observations from this month..."
                      rows={6}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Challenges</Label>
                    <Textarea 
                      value={formData.challenges}
                      onChange={e => setFormData({...formData, challenges: e.target.value})}
                      placeholder="Challenges encountered and how they were addressed..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="marketing" className="mt-4 space-y-3">
                  <div>
                    <Label>Marketing & Outreach Activities</Label>
                    <Textarea 
                      value={formData.marketing_activities}
                      onChange={e => setFormData({...formData, marketing_activities: e.target.value})}
                      placeholder="Describe marketing activities, outreach efforts, community engagements..."
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="success" className="mt-4 space-y-3">
                  <div>
                    <Label>Success Stories</Label>
                    <Textarea 
                      value={formData.success_stories}
                      onChange={e => setFormData({...formData, success_stories: e.target.value})}
                      placeholder="Share client success stories, achievements, and positive outcomes..."
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="employer" className="mt-4 space-y-3">
                  <div>
                    <Label>Employer Engagements</Label>
                    <Textarea 
                      value={formData.employer_engagements}
                      onChange={e => setFormData({...formData, employer_engagements: e.target.value})}
                      placeholder="Describe employer meetings, job development activities, partnerships..."
                      rows={5}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Goals for Next Month</Label>
                    <Textarea 
                      value={formData.goals_next_month}
                      onChange={e => setFormData({...formData, goals_next_month: e.target.value})}
                      placeholder="Priorities and goals for the upcoming month..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea 
                      value={formData.additional_notes}
                      onChange={e => setFormData({...formData, additional_notes: e.target.value})}
                      placeholder="Any other relevant information..."
                      rows={3}
                      className="mt-1"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving || !selectedMonth} className="flex-1">
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : (editingReport ? "Save Draft" : "Create Report")}
                </Button>
                {editingReport && editingReport.status === "draft" && (
                  <Button onClick={handleSubmit} disabled={saving} variant="default" className="flex-1">
                    <Send className="w-4 h-4 mr-2" /> Submit Report
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: View Reports */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Submitted Reports</CardTitle>
              <div className="flex items-center gap-2">
                <Filter className="w-3 h-3 text-slate-400" />
                <Select value={filterWorker} onValueChange={setFilterWorker}>
                  <SelectTrigger className="h-8 w-40 text-xs">
                    <SelectValue placeholder="Filter by staff" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Staff</SelectItem>
                    {workers.map(worker => (
                      <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-4">
              {sortedMonths.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No reports submitted yet</p>
              ) : (
                sortedMonths.map(month => (
                  <div key={month}>
                    <h3 className="text-sm font-semibold text-slate-600 mb-2">
                      {format(parseISO(month + "-01"), "MMMM yyyy")}
                    </h3>
                    <div className="space-y-2">
                      {groupedReports[month].map(report => (
                        <div key={report.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium">{report.submitted_by_name}</span>
                            </div>
                            <Badge variant={report.status === "submitted" ? "default" : "secondary"} className="text-xs">
                              {report.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 space-y-1">
                            {report.trends && (
                              <p><span className="font-medium">Trends:</span> {report.trends.substring(0, 100)}{report.trends.length > 100 ? "..." : ""}</p>
                            )}
                            {report.success_stories && (
                              <p><span className="font-medium">Success:</span> {report.success_stories.substring(0, 100)}{report.success_stories.length > 100 ? "..." : ""}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}