import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, TrendingUp, Calendar, Briefcase, Target } from "lucide-react";

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

function calculateOutcomes(clients) {
  const now = new Date();
  
  // Starters - clients with service_start_date in current fiscal year (April 1 - March 31)
  const fiscalYearStart = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);
  const fiscalYearEnd = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);
  
  const pathwaysStarters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= fiscalYearStart && 
    new Date(c.service_start_date) < fiscalYearEnd
  );
  
  const deaStarters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.service_start_date && 
    new Date(c.service_start_date) >= fiscalYearStart && 
    new Date(c.service_start_date) < fiscalYearEnd
  );
  
  // Completers - clients with completion_date in current fiscal year
  const pathwaysCompleters = clients.filter(c => 
    c.service_type === "pathways" && 
    c.completion_date && 
    new Date(c.completion_date) >= fiscalYearStart && 
    new Date(c.completion_date) < fiscalYearEnd
  );
  
  const deaCompleters = clients.filter(c => 
    c.service_type === "direct_to_employment" && 
    c.completion_date && 
    new Date(c.completion_date) >= fiscalYearStart && 
    new Date(c.completion_date) < fiscalYearEnd
  );
  
  // Employment outcomes - clients who gained employment
  const employmentOutcomes = clients.filter(c => 
    c.employment_start_date && 
    new Date(c.employment_start_date) >= fiscalYearStart && 
    new Date(c.employment_start_date) < fiscalYearEnd
  );
  
  // 90-day follow-ups due/completed
  const followups90Day = clients.filter(c => 
    c.followup_90day_date && 
    new Date(c.followup_90day_date) >= fiscalYearStart && 
    new Date(c.followup_90day_date) < fiscalYearEnd
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
    fiscalYear: `${fiscalYearStart.getFullYear()}-${fiscalYearEnd.getFullYear()}`,
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

  const outcomes = calculateOutcomes(clients);

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
              Fiscal Year {outcomes.fiscalYear} (April 1 - March 31)
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Users className="w-4 h-4 mr-1" />
            {outcomes.totalClients} Total Clients
          </Badge>
        </div>

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