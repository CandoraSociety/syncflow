import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CheckCircle2, TrendingUp, Calendar, Briefcase, Target, Filter, X } from "lucide-react";

const SERVICE_STREAMS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral",
};

const EMPLOYMENT_STATUS_LABELS = {
  "E-RF": "Employed - Regular Full-time",
  "E-UF": "Employed - Unregular Full-time",
  "E-PT": "Employed - Part-time",
  "UE": "Unemployed",
  "UE-LA": "Unemployed - Layoff",
  "UE-S": "Unemployed - Seasonal",
  "NA": "Not Available",
  "no_contact": "No Contact",
};

function calculateOutcomes(clients, dateRange) {
  const { startDate, endDate, label } = dateRange;
  
  const pathwaysStarters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= startDate && 
    new Date(c.service_start_date) < endDate
  );
  
  const deaStarters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= startDate && 
    new Date(c.service_start_date) < endDate
  );
  
  // Completers - clients with completion_date in date range
  const pathwaysCompleters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.completion_date && 
    new Date(c.completion_date) >= startDate && 
    new Date(c.completion_date) < endDate
  );
  
  const deaCompleters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.completion_date && 
    new Date(c.completion_date) >= startDate && 
    new Date(c.completion_date) < endDate
  );
  
  // Employment outcomes - clients who gained employment
  const employmentOutcomes = clients.filter(c => 
    c.employment_start_date && 
    new Date(c.employment_start_date) >= startDate && 
    new Date(c.employment_start_date) < endDate
  );
  
  // 90-day follow-ups due/completed
  const followups90Day = clients.filter(c => 
    c.followup_90day_date && 
    new Date(c.followup_90day_date) >= startDate && 
    new Date(c.followup_90day_date) < endDate
  );
  
  const followupsCompleted = followups90Day.filter(c => c.followup_90day_status);
  const followupsPending = followups90Day.filter(c => !c.followup_90day_status);
  
  // Employment status breakdown for 90-day follow-ups
  const employmentStatusBreakdown = {};
  followups90Day.forEach(c => {
    const status = c.followup_90day_status || "no_contact";
    employmentStatusBreakdown[status] = (employmentStatusBreakdown[status] || 0) + 1;
  });
  
  // Active clients by stream
  const activeClients = clients.filter(c => c.status === "active");
  const activeByStream = {};
  activeClients.forEach(c => {
    const stream = c.service_type || "unknown";
    activeByStream[stream] = (activeByStream[stream] || 0) + 1;
  });
  
  // Overall stats
  const totalClients = clients.length;
  const activeCount = activeClients.length;
  const closedCount = clients.filter(c => c.status === "closed").length;
  
  return {
    dateRangeLabel: label,
    pathwaysStarters: pathwaysStarters.length,
    deaStarters: deaStarters.length,
    pathwaysCompleters: pathwaysCompleters.length,
    deaCompleters: deaCompleters.length,
    employmentOutcomes: employmentOutcomes.length,
    followups90Day: {
      total: followups90Day.length,
      completed: followupsCompleted.length,
      pending: followupsPending.length,
      statusBreakdown: employmentStatusBreakdown,
    },
    activeByStream,
    totalClients,
    activeCount,
    closedCount,
  };
}

export default function Outcomes() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const [filters, setFilters] = useState({
    assignedWorker: "all",
    serviceType: "all",
    status: "all",
    dateRangeType: "fiscal", // fiscal, calendar, month, custom
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    startDate: "",
    endDate: "",
  });

  // Get unique assigned workers from clients
  const assignedWorkers = [...new Set(clients
    .filter(c => c.assigned_worker_name)
    .map(c => c.assigned_worker_name)
  )].sort();

  // Calculate date range based on filter selection
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate, label;

    if (filters.dateRangeType === "calendar") {
      startDate = new Date(filters.year, 0, 1);
      endDate = new Date(filters.year + 1, 0, 1);
      label = `Calendar Year ${filters.year}`;
    } else if (filters.dateRangeType === "fiscal") {
      const fiscalStart = filters.year <= now.getFullYear() ? new Date(filters.year, 3, 1) : new Date(filters.year - 1, 3, 1);
      const fiscalEnd = new Date(filters.year + 1, 3, 1);
      startDate = fiscalStart;
      endDate = fiscalEnd;
      label = `Fiscal Year ${filters.year}-${String(fiscalEnd.getFullYear()).slice(2)}`;
    } else if (filters.dateRangeType === "month") {
      const year = filters.year;
      const month = filters.month - 1;
      startDate = new Date(year, month, 1);
      endDate = new Date(year, month + 1, 1);
      label = `${startDate.toLocaleString('default', { month: 'long' })} ${year}`;
    } else if (filters.dateRangeType === "custom" && filters.startDate && filters.endDate) {
      startDate = new Date(filters.startDate);
      endDate = new Date(filters.endDate);
      endDate.setDate(endDate.getDate() + 1); // Include end date
      label = `${filters.startDate} to ${filters.endDate}`;
    } else {
      // Default to current fiscal year
      const fiscalStart = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);
      const fiscalEnd = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);
      startDate = fiscalStart;
      endDate = fiscalEnd;
      label = `Fiscal Year ${fiscalStart.getFullYear()}-${String(fiscalEnd.getFullYear()).slice(2)}`;
    }

    return { startDate, endDate, label };
  };

  const dateRange = getDateRange();

  // Filter clients based on selected filters
  const filteredClients = clients.filter(client => {
    if (filters.assignedWorker !== "all" && client.assigned_worker_name !== filters.assignedWorker) {
      return false;
    }
    if (filters.serviceType !== "all" && client.service_type !== filters.serviceType) {
      return false;
    }
    if (filters.status !== "all" && client.status !== filters.status) {
      return false;
    }
    return true;
  });

  const outcomes = calculateOutcomes(filteredClients, dateRange);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Program Outcomes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {outcomes.dateRangeLabel}
          </p>
        </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              <Users className="w-4 h-4 mr-1" />
              {filteredClients.length} / {clients.length} Clients
            </Badge>
            {(filters.assignedWorker !== "all" || filters.serviceType !== "all" || filters.status !== "all" || filters.dateRangeType !== "fiscal") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFilters({ 
                  assignedWorker: "all", 
                  serviceType: "all", 
                  status: "all",
                  dateRangeType: "fiscal",
                  year: new Date().getFullYear(),
                  month: new Date().getMonth() + 1,
                  startDate: "",
                  endDate: "",
                })}
                className="h-7 text-xs"
              >
                <X className="w-3 h-3 mr-1" /> Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Assigned Worker</label>
                <Select value={filters.assignedWorker} onValueChange={(v) => setFilters(prev => ({ ...prev, assignedWorker: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All workers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Workers</SelectItem>
                    {assignedWorkers.map(worker => (
                      <SelectItem key={worker} value={worker}>{worker}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Service Type</label>
                <Select value={filters.serviceType} onValueChange={(v) => setFilters(prev => ({ ...prev, serviceType: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All streams" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streams</SelectItem>
                    <SelectItem value="pathways">Pathways</SelectItem>
                    <SelectItem value="direct_to_employment">DEA</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="external_referral">External Referral</SelectItem>
                    <SelectItem value="internal_referral">Internal Referral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Client Status</label>
                <Select value={filters.status} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Date Range</label>
                <Select value={filters.dateRangeType} onValueChange={(v) => setFilters(prev => ({ ...prev, dateRangeType: v }))}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fiscal">Fiscal Year (Apr-Mar)</SelectItem>
                    <SelectItem value="calendar">Calendar Year</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Date range specific controls */}
            <div className="grid gap-3 md:grid-cols-3 mt-3 pt-3 border-t">
              {(filters.dateRangeType === "calendar" || filters.dateRangeType === "fiscal" || filters.dateRangeType === "month") && (
                <div className="space-y-1">
                  <Label className="text-xs">Year</Label>
                  <Select value={String(filters.year)} onValueChange={(v) => setFilters(prev => ({ ...prev, year: parseInt(v) }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 4 + i).map(year => (
                        <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {filters.dateRangeType === "month" && (
                <div className="space-y-1">
                  <Label className="text-xs">Month</Label>
                  <Select value={String(filters.month)} onValueChange={(v) => setFilters(prev => ({ ...prev, month: parseInt(v) }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map((month, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>{month}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {filters.dateRangeType === "custom" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-xs">Start Date</Label>
                    <Input 
                      type="date" 
                      value={filters.startDate} 
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">End Date</Label>
                    <Input 
                      type="date" 
                      value={filters.endDate} 
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                      className="h-9"
                    />
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Starter Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pathways Starters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{outcomes.pathwaysStarters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Started in FY {outcomes.fiscalYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DEA Starters</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{outcomes.deaStarters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Started in FY {outcomes.fiscalYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pathways Completers</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{outcomes.pathwaysCompleters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed in FY {outcomes.fiscalYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">DEA Completers</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{outcomes.deaCompleters}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Completed in FY {outcomes.fiscalYear}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employment Outcomes */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employment Outcomes</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{outcomes.employmentOutcomes}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clients gained employment in FY {outcomes.fiscalYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Client Status</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-600">{outcomes.activeCount}</div>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-600">{outcomes.closedCount}</div>
                  <p className="text-xs text-muted-foreground">Closed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 90-Day Follow-up */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <CardTitle>90-Day Follow-up Outcomes</CardTitle>
              </div>
              <Badge variant={outcomes.followups90Day.pending > 0 ? "secondary" : "default"}>
                {outcomes.followups90Day.completed}/{outcomes.followups90Day.total} Completed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(outcomes.followups90Day.statusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    {EMPLOYMENT_STATUS_LABELS[status] || status}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(outcomes.followups90Day.statusBreakdown).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  No 90-day follow-ups recorded for this fiscal year.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Clients by Stream */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Active Clients by Stream</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(outcomes.activeByStream).map(([stream, count]) => (
                <div key={stream} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">
                    {SERVICE_STREAMS[stream] || stream}
                  </span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
              {Object.keys(outcomes.activeByStream).length === 0 && (
                <p className="text-sm text-muted-foreground col-span-full">
                  No active clients.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}