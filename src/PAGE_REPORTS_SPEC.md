# REPORTS PAGE — Complete Replication Specification

## Files involved
1. `pages/Reports.jsx` — main page (`/reports`)
2. `components/reports/ReportSummary.jsx` — data report summary visualization
3. `components/reports/StaffMonthlyReports.jsx` — staff narrative reports tab
4. `components/reports/BillingReport.jsx` — billing/invoice report (imported but not rendered in current page — kept for reference)

---

## PAGE: Reports (`/reports`)

### Purpose
Three-tab reporting dashboard:
1. **Outcomes** — program metrics (starters, completers, employment outcomes, 90-day follow-ups)
2. **Data Reports** — custom filtered client reports with demographic breakdowns, financial summaries, export to CSV/PDF
3. **Staff Monthly Reports** — narrative monthly submissions by staff

---

## TAB STRUCTURE

```jsx
<Tabs defaultValue="data" className="max-w-7xl mx-auto px-6 py-6">
  <TabsList className="mb-4">
    <TabsTrigger value="outcomes">Outcomes</TabsTrigger>
    <TabsTrigger value="data">Data Reports</TabsTrigger>
    <TabsTrigger value="staff">Staff Monthly Reports</TabsTrigger>
  </TabsList>

  <TabsContent value="outcomes">...</TabsContent>
  <TabsContent value="data">...</TabsContent>
  <TabsContent value="staff">...</TabsContent>
</Tabs>
```

Note: Default tab is `"data"` (Data Reports), not outcomes.

---

## TAB 1: OUTCOMES

### Layout
```jsx
<TabsContent value="outcomes">
  <OutcomesSection clients={clients} financialRecords={financialRecords} />
</TabsContent>
```

### OutcomesSection — State
```js
const [filters, setFilters] = useState({
  assignedWorker: "all",
  serviceType: "all",
  status: "all",
  dateRangeType: "all",
  year: new Date().getFullYear(),
  month: new Date().getMonth() + 1,
  startDate: "",
  endDate: "",
});
```

### Date Range Logic
```js
const getDateRange = () => {
  const now = new Date();
  let startDate, endDate, label;

  if (filters.dateRangeType === "all") {
    startDate = new Date(2000, 0, 1);
    endDate = new Date(2100, 0, 1);
    label = "All Time";
  } else if (filters.dateRangeType === "calendar") {
    startDate = new Date(filters.year, 0, 1);
    endDate = new Date(filters.year + 1, 0, 1);
    label = `Calendar Year ${filters.year}`;
  } else if (filters.dateRangeType === "fiscal") {
    const fiscalStart = filters.year <= now.getFullYear() 
      ? new Date(filters.year, 3, 1) 
      : new Date(filters.year - 1, 3, 1);
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
    endDate.setDate(endDate.getDate() + 1);  // inclusive end
    label = `${filters.startDate} to ${filters.endDate}`;
  } else {
    // Default: current fiscal year
    const fiscalStart = new Date(now.getFullYear() - (now.getMonth() < 3 ? 1 : 0), 3, 1);
    const fiscalEnd = new Date(now.getFullYear() + (now.getMonth() >= 3 ? 1 : 0), 3, 1);
    startDate = fiscalStart;
    endDate = fiscalEnd;
    label = `Fiscal Year ${fiscalStart.getFullYear()}-${String(fiscalEnd.getFullYear()).slice(2)}`;
  }

  return { startDate, endDate, label };
};
```

### calculateOutcomes function
```js
function calculateOutcomes(clients, dateRange) {
  const { startDate, endDate, label } = dateRange;
  
  // Starters
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
  
  // Completers
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
  
  // Employment outcomes
  const employmentOutcomes = clients.filter(c => 
    c.employment_start_date && 
    new Date(c.employment_start_date) >= startDate && 
    new Date(c.employment_start_date) < endDate
  );
  
  // 90-day follow-ups
  const followups90Day = clients.filter(c => 
    c.followup_90day_date && 
    new Date(c.followup_90day_date) >= startDate && 
    new Date(c.followup_90day_date) < endDate
  );
  
  const followupsCompleted = followups90Day.filter(c => c.followup_90day_status);
  const followupsPending = followups90Day.filter(c => !c.followup_90day_status);
  
  // Employment status breakdown at 90-day
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
  
  // Client status counts
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
```

### SERVICE_STREAMS mapping
```js
const SERVICE_STREAMS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "External Referral",
  internal_referral: "Internal Referral",
};
```

### EMPLOYMENT_STATUS_LABELS mapping
```js
const EMPLOYMENT_STATUS_LABELS = {
  "E-RF": "Employed - Related Field Full-time",
  "E-UF": "Employed - Unrelated Field Full-time",
  "E-PT": "Employed - Part-time",
  "UE": "Unemployed",
  "UE-LA": "Unemployed - Layoff",
  "UE-S": "Unemployed - Seasonal",
  "NA": "Not Available",
  "no_contact": "No Contact",
};
```

### Filters UI
```jsx
<Card>
  <CardContent className="pt-4">
    <div className="flex items-center gap-2 mb-3">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">Filters</span>
    </div>
    <div className="flex gap-3">
      {/* Assigned Worker */}
      <div className="flex-1 space-y-1">
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
      
      {/* Service Type */}
      <div className="flex-1 space-y-1">
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
      
      {/* Client Status */}
      <div className="flex-1 space-y-1">
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
      
      {/* Date Range */}
      <div className="flex-1 space-y-1">
        <label className="text-xs text-muted-foreground">Date Range</label>
        <Select value={filters.dateRangeType} onValueChange={(v) => setFilters(prev => ({ ...prev, dateRangeType: v }))}>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="fiscal">Fiscal Year (Apr-Mar)</SelectItem>
            <SelectItem value="calendar">Calendar Year</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="custom">Custom Range</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
    
    {/* Conditional date inputs */}
    <div className="flex gap-3 mt-3 pt-3 border-t">
      {(filters.dateRangeType === "calendar" || filters.dateRangeType === "fiscal" || filters.dateRangeType === "month") && (
        <div className="flex-1 space-y-1">
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
        <div className="flex-1 space-y-1">
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
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Start Date</Label>
            <Input type="date" value={filters.startDate} onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))} className="h-9" />
          </div>
          <div className="flex-1 space-y-1">
            <Label className="text-xs">End Date</Label>
            <Input type="date" value={filters.endDate} onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))} className="h-9" />
          </div>
        </>
      )}
    </div>
  </CardContent>
</Card>
```

### Metric Cards (4 stat cards)
```jsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {/* Pathways Starters */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Pathways Starters</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{outcomes.pathwaysStarters}</div>
      <p className="text-xs text-muted-foreground mt-1">Started in {outcomes.dateRangeLabel}</p>
    </CardContent>
  </Card>

  {/* DEA Starters */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">DEA Starters</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{outcomes.deaStarters}</div>
      <p className="text-xs text-muted-foreground mt-1">Started in {outcomes.dateRangeLabel}</p>
    </CardContent>
  </Card>

  {/* Pathways Completers */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Pathways Completers</CardTitle>
      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{outcomes.pathwaysCompleters}</div>
      <p className="text-xs text-muted-foreground mt-1">Completed in {outcomes.dateRangeLabel}</p>
    </CardContent>
  </Card>

  {/* DEA Completers */}
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">DEA Completers</CardTitle>
      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{outcomes.deaCompleters}</div>
      <p className="text-xs text-muted-foreground mt-1">Completed in {outcomes.dateRangeLabel}</p>
    </CardContent>
  </Card>
</div>
```

### Employment Outcomes Card
```jsx
<div className="grid gap-4 md:grid-cols-2">
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Employment Outcomes</CardTitle>
      <Briefcase className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold">{outcomes.employmentOutcomes}</div>
      <p className="text-xs text-muted-foreground mt-1">Clients gained employment in {outcomes.dateRangeLabel}</p>
    </CardContent>
  </Card>

  {/* Client Status */}
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
```

### 90-Day Follow-up Card
```jsx
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
          No 90-day follow-ups recorded for this period.
        </p>
      )}
    </div>
  </CardContent>
</Card>
```

### Active Clients by Stream Card
```jsx
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
```

---

## TAB 2: DATA REPORTS

### REPORT_SECTIONS constant
```js
const REPORT_SECTIONS = [
  { key: "service_stream", label: "Service Stream Breakdown", default: true },
  { key: "case_program_status", label: "Case & Program Status", default: true },
  { key: "referral_source", label: "Referral Source", default: true },
  { key: "employment_intake", label: "Employment Status at Intake", default: true },
  { key: "employment_post", label: "Post-Completion Employment Status", default: true },
  { key: "employment_90day", label: "90-Day Follow-Up Status", default: true },
  { key: "starters_completers", label: "Program Starters & Completers", default: true },
  { key: "financial_summary", label: "Financial Summary", default: true },
  { key: "barriers", label: "Top Barriers Identified", default: true },
  { key: "client_demographics", label: "Client Demographics", default: false, subOptions: [
    { key: "age_distribution", label: "Age Distribution", default: true },
    { key: "sex_distribution", label: "Sex", default: true },
    { key: "residency_status", label: "Residency Status", default: true },
    { key: "city_distribution", label: "City Distribution", default: true },
    { key: "postal_code_distribution", label: "Postal Code Distribution (FSA)", default: true },
  ]},
];
```

### ALL_FIELDS constant (partial — key fields only)
```js
const ALL_FIELDS = [
  // Demographic
  { key: "first_name", label: "First Name", category: "demographic" },
  { key: "last_name", label: "Last Name", category: "demographic" },
  { key: "date_of_birth", label: "Date of Birth", category: "demographic" },
  { key: "phone", label: "Phone", category: "demographic" },
  { key: "email", label: "Email", category: "demographic" },
  { key: "address", label: "Address", category: "demographic" },
  { key: "city", label: "City", category: "demographic" },
  { key: "state", label: "Province", category: "demographic" },
  { key: "zip", label: "Postal Code", category: "demographic" },
  { key: "compass_hsid", label: "Compass HSID#", category: "demographic" },
  { key: "residency_status", label: "Residency Status", category: "demographic" },
  { key: "clb_level", label: "CLB Level", category: "demographic" },
  { key: "employment_status", label: "Employment Status", category: "demographic" },
  { key: "has_vehicle", label: "Has Vehicle", category: "demographic" },
  { key: "referral_source", label: "Referral Source", category: "demographic" },
  { key: "service_type", label: "Service Stream", category: "demographic" },
  { key: "assigned_worker_name", label: "Career Counsellor", category: "demographic" },
  { key: "status", label: "Case Status", category: "demographic" },
  { key: "program_status", label: "Program Status", category: "demographic" },
  // Dates
  { key: "intake_date", label: "Intake Date", category: "date" },
  { key: "service_start_date", label: "Service Start Date", category: "date" },
  { key: "completion_date", label: "Completion Date", category: "date" },
  { key: "employment_start_date", label: "Employment Start Date", category: "date" },
  { key: "followup_90day_date", label: "90-Day Follow-Up Date", category: "date" },
  { key: "post_completion_employment_date", label: "Post-Completion Employment Date", category: "date" },
  { key: "closed_date", label: "Close Date", category: "date" },
  // Metrics
  { key: "followup_90day_status", label: "90-Day Employment Status", category: "metric" },
  { key: "post_completion_employment_status", label: "Post-Completion Employment Status", category: "metric" },
  { key: "service_navigation_supports", label: "Service Navigation Supports", category: "metric" },
  { key: "barriers_addressed", label: "Barriers Addressed", category: "metric" },
  { key: "barrier_1", label: "Barrier 1", category: "metric" },
  { key: "barrier_1_status", label: "Barrier 1 Status", category: "metric" },
  // Financial (per-client)
  { key: "_fin_exposure_course_total", label: "Exposure Course Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_paid_placement_total", label: "Paid Placement Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_employment_supports_total", label: "Employment Supports Total ($)", category: "financial", clientFilterable: true },
  { key: "_fin_total_all", label: "Total Direct Costs ($)", category: "financial", clientFilterable: true },
  // Invoice (report-level aggregates)
  { key: "_inv_total_amount", label: "Invoice Total ($)", category: "invoice", clientFilterable: false },
  { key: "_inv_base_amount", label: "Invoice Base Fee ($)", category: "invoice", clientFilterable: false },
  // ... more invoice fields
];
```

### SERVICE_LABELS
```js
const SERVICE_LABELS = {
  direct_to_employment: "DEA",
  pathways: "Pathways",
  casual: "Casual",
  external_referral: "Ext. Referral",
  internal_referral: "Int. Referral",
  not_eligible: "Not Eligible",
};
```

### DEMOGRAPHIC_FILTERS
```js
const DEMOGRAPHIC_FILTERS = [
  { key: "service_type", label: "Service Stream", type: "multi-select", fixedOptions: SERVICE_TYPE_OPTIONS },
  { key: "status", label: "Case Status", type: "multi-select", fixedOptions: CASE_STATUS_OPTIONS },
  { key: "program_status", label: "Program Status", type: "multi-select" },
  { key: "residency_status", label: "Residency Status", type: "multi-select", fixedOptions: RESIDENCY_STATUS_OPTIONS },
  { key: "clb_level", label: "CLB Level", type: "multi-select" },
  { key: "employment_status", label: "Employment Status", type: "multi-select" },
  { key: "referral_source", label: "Referral Source", type: "multi-select" },
  { key: "assigned_worker_name", label: "Career Counsellor", type: "multi-select" },
  { key: "city", label: "City", type: "text" },
  { key: "has_vehicle", label: "Has Vehicle", type: "select" },
  { key: "barrier_1", label: "Barrier Type", type: "multi-select" },
  { key: "closed_reason", label: "Close Reason", type: "multi-select" },
  { key: "compass_verified", label: "Compass Verified", type: "boolean-select" },
];
```

### getDateRange helper (for date presets)
```js
function getDateRange(preset, customFrom, customTo) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = today.getMonth();

  if (preset === "this_month") {
    return {
      from: format(startOfMonth(today), "yyyy-MM-dd"),
      to: format(endOfMonth(today), "yyyy-MM-dd"),
    };
  }
  if (preset === "last_month") {
    const last = subMonths(today, 1);
    return {
      from: format(startOfMonth(last), "yyyy-MM-dd"),
      to: format(endOfMonth(last), "yyyy-MM-dd"),
    };
  }
  if (preset === "ytd") {
    return {
      from: format(startOfYear(today), "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    };
  }
  if (preset === "fiscal_year") {
    const fiscalStart = mm >= 3 ? new Date(yyyy, 3, 1) : new Date(yyyy - 1, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return {
      from: format(fiscalStart, "yyyy-MM-dd"),
      to: format(fiscalEnd, "yyyy-MM-dd"),
    };
  }
  if (preset === "last_fiscal_year") {
    const fiscalStart = mm >= 3 ? new Date(yyyy - 1, 3, 1) : new Date(yyyy - 2, 3, 1);
    const fiscalEnd = new Date(fiscalStart.getFullYear() + 1, 2, 31);
    return {
      from: format(fiscalStart, "yyyy-MM-dd"),
      to: format(fiscalEnd, "yyyy-MM-dd"),
    };
  }
  if (preset === "this_year") {
    return { from: `${yyyy}-01-01`, to: `${yyyy}-12-31` };
  }
  // custom or none
  return { from: customFrom, to: customTo };
}
```

### fmt$ helper
```js
function fmt$(n) {
  if (!n && n !== 0) return "";
  return "$" + Number(n).toFixed(2);
}
```

### getDisplayValue helper
```js
function getDisplayValue(client, key) {
  if (key === "_duration_months") {
    if (!client.service_start_date) return "";
    return differenceInMonths(new Date(), new Date(client.service_start_date)) + " mo";
  }
  if (key === "_stream_switch_count") {
    return (client.program_stream_switches?.length || 0).toString();
  }
  // Financial per-client keys
  if (key === "_fin_exposure_course_total") return fmt$(client._fin_exposure || 0);
  if (key === "_fin_paid_placement_total") return fmt$(client._fin_placement || 0);
  if (key === "_fin_employment_supports_total") return fmt$(client._fin_supports || 0);
  if (key === "_fin_total_all") return fmt$((client._fin_exposure || 0) + (client._fin_placement || 0) + (client._fin_supports || 0));
  // Invoice keys — report-level aggregates only
  if (key.startsWith("_inv_")) return "—";

  const v = client[key];
  if (v === undefined || v === null || v === "") return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (key === "service_type") return SERVICE_LABELS[v] || v;
  if (key === "clb_level") return v.replace("clb_", "CLB ").replace("native_english_french", "Native");
  if (typeof v === "string" && v.match(/^\d{4}-\d{2}-\d{2}$/)) {
    try { return format(new Date(v), "MMM d, yyyy"); } catch { return v; }
  }
  if (Array.isArray(v)) return v.join(", ");
  return String(v);
}
```

### Template storage (localStorage)
```js
const TEMPLATE_KEY = "report_templates_v2";
const SESSION_KEY = "report_session_state_v1";

function loadTemplates() {
  try { return JSON.parse(localStorage.getItem(TEMPLATE_KEY) || "[]"); } catch { return []; }
}
function saveTemplates(t) {
  localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));
}

function loadSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function saveSession(state) {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch {}
}
```

### Data Reports — State
```js
const [clients, setClients] = useState([]);
const [financialRecords, setFinancialRecords] = useState([]);
const [financialMap, setFinancialMap] = useState({});
const [loading, setLoading] = useState(true);
const [datePreset, setDatePreset] = useState("none");
const [customDateFrom, setCustomDateFrom] = useState("");
const [customDateTo, setCustomDateTo] = useState("");
const [dateField, setDateField] = useState("service_start_date");
const [templates, setTemplates] = useState(loadTemplates());
const [templateName, setTemplateName] = useState("");
const [savingTemplate, setSavingTemplate] = useState(false);
const [filters, setFilters] = useState({});
const [selectedSections, setSelectedSections] = useState(
  REPORT_SECTIONS.filter(s => s.default).map(s => s.key)
);
const [demographicOptions, setDemographicOptions] = useState(
  REPORT_SECTIONS.find(s => s.key === "client_demographics")?.subOptions?.filter(o => o.default).map(o => o.key) || []
);
const [results, setResults] = useState(null);
```

### Data Loading
```js
useEffect(() => {
  Promise.all([
    base44.entities.Client.list("-created_date", 1000),
    base44.entities.FinancialRecord.list("-date", 2000),
  ]).then(([clientData, finData]) => {
    const map = {};
    finData.forEach(rec => {
      if (!rec.client_id) return;
      if (!map[rec.client_id]) map[rec.client_id] = { exposure: 0, placement: 0, supports: 0 };
      const amt = rec.amount || 0;
      if (rec.record_type === "exposure_course") map[rec.client_id].exposure += amt;
      else if (rec.record_type === "paid_external_placement") map[rec.client_id].placement += amt;
      else if (rec.record_type === "employment_supports") map[rec.client_id].supports += amt;
    });
    setFinancialMap(map);
    setFinancialRecords(finData);
    setClients(clientData);
    setLoading(false);
  });
}, []);
```

### runReport function
```js
const runReport = () => {
  let data = clients.map(c => ({
    ...c,
    _fin_exposure: financialMap[c.id]?.exposure || 0,
    _fin_placement: financialMap[c.id]?.placement || 0,
    _fin_supports: financialMap[c.id]?.supports || 0,
  }));

  // Apply demographic filters
  Object.entries(filters).forEach(([key, filterValue]) => {
    if (!filterValue || filterValue === "" || (Array.isArray(filterValue) && filterValue.length === 0)) return;
    data = data.filter(c => {
      const clientValue = c[key];
      if (Array.isArray(filterValue)) return filterValue.includes(clientValue);
      if (typeof filterValue === "boolean") return clientValue === filterValue;
      return clientValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
  });

  // Apply date range filter (only if a date preset is selected)
  if (datePreset !== "none" && (dateFrom || dateTo)) {
    data = data.filter(c => {
      const d = c[dateField];
      if (!d) return false;
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    });
  }

  setResults(data);
};
```

### exportCSV function
```js
const exportCSV = () => {
  if (!results) return;
  const fields = ALL_FIELDS.filter(f => f.category === "demographic" || f.category === "date");
  const headers = fields.map(f => f.label);
  const rows = results.map(c => fields.map(f => {
    const v = getDisplayValue(c, f.key);
    return `"${v.replace(/"/g, '""')}"`;
  }).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
```

### saveTemplate / loadTemplate / deleteTemplate
```js
const saveTemplate = () => {
  if (!templateName.trim()) return;
  const t = { id: Date.now(), name: templateName.trim(), dateField, datePreset, filters };
  const updated = [...templates, t];
  setTemplates(updated);
  saveTemplates(updated);
  setTemplateName("");
  setSavingTemplate(false);
};

const loadTemplate = (t) => {
  setDateField(t.dateField || "intake_date");
  setDatePreset(t.datePreset || "none");
  setFilters(t.filters || {});
};

const deleteTemplate = (id) => {
  const updated = templates.filter(t => t.id !== id);
  setTemplates(updated);
  saveTemplates(updated);
};
```

### Filter helpers
```js
const selectAllFilterOptions = (filterKey, options) => {
  setFilters(prev => {
    const current = prev[filterKey] || [];
    const allSelected = options.every(o => current.includes(o));
    return { ...prev, [filterKey]: allSelected ? [] : [...options] };
  });
};

const toggleFilter = (filterKey, value) => {
  setFilters(prev => {
    const current = prev[filterKey] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    return { ...prev, [filterKey]: updated };
  });
};

const toggleSection = (sectionKey) => {
  setSelectedSections(prev =>
    prev.includes(sectionKey)
      ? prev.filter(s => s !== sectionKey)
      : [...prev, sectionKey]
  );
};

const toggleDemographicOption = (optionKey) => {
  setDemographicOptions(prev =>
    prev.includes(optionKey)
      ? prev.filter(o => o !== optionKey)
      : [...prev, optionKey]
  );
};

const setTextFilter = (filterKey, value) => {
  setFilters(prev => ({ ...prev, [filterKey]: value }));
};
```

### Data Reports Layout
```jsx
<TabsContent value="data">
  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
    {/* LEFT: Configuration (1 column) */}
    <div className="lg:col-span-1 space-y-4">
      
      {/* Saved Templates card */}
      {templates.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Saved Templates</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1 justify-start text-xs truncate" onClick={() => loadTemplate(t)}>
                  {t.name}
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => deleteTemplate(t.id)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Date Range card */}
      <Card>...</Card>
      
      {/* Include in Summary card (sections) */}
      <Card>...</Card>
      
      {/* Client Filters card */}
      <Card>...</Card>

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full gap-2" onClick={runReport}>
          <Play className="w-4 h-4" /> Run Report
        </Button>
        {savingTemplate ? (
          <div className="flex gap-2">
            <Input className="h-8 text-xs flex-1" placeholder="Template name..." value={templateName} onChange={e => setTemplateName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveTemplate()} autoFocus />
            <Button size="sm" onClick={saveTemplate} disabled={!templateName.trim()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setSavingTemplate(false)}>✕</Button>
          </div>
        ) : (
          <Button variant="outline" className="w-full gap-2" onClick={() => setSavingTemplate(true)}>
            <Save className="w-4 h-4" /> Save as Template
          </Button>
        )}
      </div>
    </div>

    {/* RIGHT: Results (3 columns) */}
    <div className="lg:col-span-3">
      {results === null ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <FileBarChart className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">Configure and run your report</p>
          <p className="text-sm mt-1">Select filters and date range, then click Run Report.</p>
        </div>
      ) : (
        <ReportSummary
          results={results}
          financialRecords={financialRecords}
          selectedSections={selectedSections}
          demographicOptions={demographicOptions}
          onClear={() => { setResults(null); }}
          onExportCSV={exportCSV}
          dateRange={{ from: dateFrom, to: dateTo }}
          appliedFilters={filters}
          allClients={clients}
          demographicFilters={DEMOGRAPHIC_FILTERS}
        />
      )}
    </div>
  </div>
</TabsContent>
```

---

## TAB 3: STAFF MONTHLY REPORTS

See separate `StaffMonthlyReports` component specification (not included in this doc — request separately if needed).

---

## ReportSummary Component (Data Reports visualization)

### Props
```js
{
  results: Client[],              // filtered client dataset
  financialRecords: FinancialRecord[],
  selectedSections: string[],     // which report sections to show
  demographicOptions: string[],   // which demographic sub-options enabled
  onClear: () => void,
  onExportCSV: () => void,
  dateRange: { from, to },
  appliedFilters: object,
  allClients: Client[],           // unfiltered for option lists
  demographicFilters: DEMOGRAPHIC_FILTERS,
}
```

### PIE_COLORS
```js
const PIE_COLORS = [
  "#1a237e", "#7c3aed", "#0369a1", "#0891b2", "#059669",
  "#d97706", "#dc2626", "#9333ea", "#64748b", "#1d4ed8",
  "#f59e0b", "#10b981", "#6366f1", "#ec4899", "#8b5cf6",
];
```

### SERVICE_LABELS (ReportSummary)
```js
const SERVICE_LABELS = {
  direct_to_employment: "DEA (Direct to Employment)",
  pathways: "Pathways",
  casual: "Casual",
  internal_referral: "Internal Referral",
  external_referral: "External Referral",
  not_eligible: "Not Eligible",
};
```

### EMP_STATUS_LABELS (ReportSummary)
```js
const EMP_STATUS_LABELS = {
  "E-RF": "Employed – Related Field (E-RF)",
  "E-UF": "Employed – Unrelated Field (E-UF)",
  "E-PT": "Employed – Part Time (E-PT)",
  "UE": "Unemployed (UE)",
  "UE-LA": "Unemployed – Looking Actively (UE-LA)",
  "UE-S": "Unemployed – Student (UE-S)",
  "NA": "Not Applicable (NA)",
  "no_contact": "No Contact",
};
```

### stats computation (useMemo)
Computes:
- `total` — count of filtered clients
- `streamRows` — service stream breakdown
- `deaStarters`, `deaCompleters`, `pathwaysStarters`, `pathwaysCompleters`
- `employed` — post-completion employed count
- `followup90Employed` — employed at 90-day follow-up
- `intakeEmpRows`, `postEmpRows`, `fu90Rows` — employment status breakdowns
- `caseStatusRows`, `programStatusRows` — status breakdowns
- `referralRows` — referral source breakdown
- `barrierRows` — top 8 barriers
- `financialRows` — exposure/placement/supports counts
- `exposureCount`, `placementCount`, `supportsCount` — record counts
- `totalExposure`, `totalPlacement`, `totalSupports`, `totalDirect` — dollar totals
- `ageRows`, `sexRows`, `residencyRows`, `cityRows`, `postalRows` — demographic breakdowns

### Print/PDF functions
```js
const handlePrint = () => window.print();

const handleSavePDF = async () => {
  const { jsPDF } = await import("jspdf");
  const { default: html2canvas } = await import("html2canvas");
  if (!reportRef.current) return;
  toast("Generating PDF…");
  try {
    const canvas = await html2canvas(reportRef.current, { 
      scale: 2, useCORS: true, windowWidth: 1200,
      scrollX: 0, scrollY: 0, logging: false, backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginLeft = 15, marginRight = 15, marginTop = 15, marginBottom = 15;
    const availableWidth = pageWidth - marginLeft - marginRight;
    const availablePageHeight = pageHeight - marginTop - marginBottom;
    
    const scale = availableWidth / canvas.width;
    const scaledWidth = canvas.width * scale;
    const scaledHeight = canvas.height * scale;
    
    let sourceY = 0;
    let pageNum = 0;
    
    while (sourceY < scaledHeight) {
      if (pageNum > 0) pdf.addPage();
      const remainingHeight = scaledHeight - sourceY;
      const drawHeight = Math.min(remainingHeight, availablePageHeight);
      const sourceYPixels = sourceY / scale;
      const drawHeightPixels = drawHeight / scale;
      
      pdf.addImage(imgData, "PNG", marginLeft, marginTop, scaledWidth, drawHeight,
        undefined, 'FAST', 0, sourceYPixels, canvas.width, drawHeightPixels);
      
      sourceY += drawHeight;
      pageNum++;
    }
    
    pdf.save(`report-${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF saved!");
  } catch (error) {
    console.error("PDF generation error:", error);
    toast.error("Failed to generate PDF");
  }
};

const handleShare = async () => {
  const url = window.location.href;
  if (navigator.share) {
    try { await navigator.share({ title: "Client Report", url }); } catch {}
  } else {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  }
};
```

### Report Header (with Candora logo)
```jsx
<div className="mb-6 pb-6 border-b-2 border-slate-200 bg-white print-break-inside-avoid">
  <div className="flex items-center gap-4 mb-4">
    <img src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/bf0d54770_Candoracirclelogo_noanniversary.png" alt="Candora" className="h-16 w-auto" />
    <div>
      <h1 className="text-2xl font-bold text-slate-800">Pathways Summary Report</h1>
      <p className="text-sm text-slate-500">Generated on {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
  
  {/* Report Scope Section */}
  <div className="bg-slate-50 rounded-lg p-4 text-xs space-y-2">
    <p className="font-semibold text-slate-700 uppercase tracking-wide">Report Scope</p>
    <div className="grid grid-cols-4 gap-x-3 gap-y-2">
      {/* Date Range */}
      <div>
        <p className="font-semibold text-slate-700">Date Range</p>
        <p className="text-slate-600">
          {dateRange.from || 'All time'} → {dateRange.from ? dateRange.to : new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
        </p>
      </div>
      {/* Service Streams */}
      <div>
        <p className="font-semibold text-slate-700">Service Streams</p>
        <p className="text-slate-600 truncate" title={formatMultiSelectFilter('service_type', appliedFilters.service_type, 'All streams')}>
          {formatMultiSelectFilter('service_type', appliedFilters.service_type, 'All streams')}
        </p>
      </div>
      {/* Case Status */}
      <div>
        <p className="font-semibold text-slate-700">Case Status</p>
        <p className="text-slate-600 truncate" title={formatMultiSelectFilter('status', appliedFilters.status, 'All statuses')}>
          {formatMultiSelectFilter('status', appliedFilters.status, 'All statuses')}
        </p>
      </div>
      {/* Program Status */}
      <div>
        <p className="font-semibold text-slate-700">Program Status</p>
        <p className="text-slate-600 truncate" title={formatMultiSelectFilter('program_status', appliedFilters.program_status, 'All statuses')}>
          {formatMultiSelectFilter('program_status', appliedFilters.program_status, 'All statuses')}
        </p>
      </div>
      {/* ... more filter displays (14 total) ... */}
    </div>
  </div>
</div>
```

### Top Stats (4 cards)
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 print-break-inside-avoid">
  <StatCard title="Total Clients" value={stats.total} icon={Users} color="text-primary" />
  {show("starters_completers") && (
    <StatCard title="Employment Outcomes" value={stats.employed} sub="post-completion employed" icon={Briefcase} color="text-green-600" />
  )}
  {show("employment_90day") && (
    <StatCard title="90-Day Sustained" value={stats.followup90Employed} sub="employed at follow-up" icon={Award} color="text-purple-600" />
  )}
  {show("financial_summary") && (
    <StatCard title="Total Direct Costs" value={fmt$(stats.totalDirect)} sub="courses + placements + supports" icon={DollarSign} color="text-amber-600" />
  )}
</div>
```

### Program Starters & Completers Card
```jsx
<Card>
  <CardHeader className="pb-2">
    <CardTitle className="text-sm flex items-center gap-2">
      <TrendingUp className="w-4 h-4 text-primary" /> Program Starters & Completers
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-3">
      {[
        { label: "DEA Starters", value: stats.deaStarters, color: "bg-blue-50 border-blue-200 text-blue-800" },
        { label: "DEA Completers", value: stats.deaCompleters, color: "bg-blue-100 border-blue-300 text-blue-900" },
        { label: "Pathways Starters", value: stats.pathwaysStarters, color: "bg-purple-50 border-purple-200 text-purple-800" },
        { label: "Pathways Completers", value: stats.pathwaysCompleters, color: "bg-purple-100 border-purple-300 text-purple-900" },
      ].map(item => (
        <div key={item.label} className={`rounded-lg border p-3 ${item.color}`}>
          <p className="text-2xl font-bold">{item.value}</p>
          <p className="text-xs font-medium mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  </CardContent>
</Card>
```

### Financial Summary Card
```jsx
<BreakdownCard title="Financial Summary" rows={stats.financialRows}>
  <div className="space-y-3">
    {[
      { label: "Exposure Courses", count: stats.exposureCount, total: stats.totalExposure, color: "#f59e0b" },
      { label: "Paid External Placements", count: stats.placementCount, total: stats.totalPlacement, color: "#10b981" },
      { label: "Employment Supports", count: stats.supportsCount, total: stats.totalSupports, color: "#6366f1" },
    ].map(item => (
      <div key={item.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
          <span className="text-xs text-slate-700">{item.label}</span>
          <span className="text-xs text-slate-400">({item.count} records)</span>
        </div>
        <span className="text-xs font-semibold text-slate-800">{fmt$(item.total)}</span>
      </div>
    ))}
    <div className="flex items-center justify-between pt-1">
      <span className="text-xs font-bold text-slate-700">Total</span>
      <span className="text-sm font-bold text-slate-900">{fmt$(stats.totalDirect)}</span>
    </div>
  </div>
</BreakdownCard>
```

### Breakdown Cards (service stream, case status, program status, referral source, employment intake/post/90day, barriers, demographics)
Each uses `<BreakdownCard>` with `<BreakdownTable>` inside, optional pie chart toggle, and optional demographic breakdown toggle.

---

This specification covers all three tabs of the Reports page with complete replication details. Request separate specs for `StaffMonthlyReports` or `BillingReport` components if needed.