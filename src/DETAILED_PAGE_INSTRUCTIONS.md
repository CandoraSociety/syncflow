# Candora App - Detailed Page Instructions

## GLOBAL DESIGN SYSTEM

### Colors
- **Primary (Navy)**: `hsl(231, 64%, 20%)` - #1a237e
- **Secondary (Gold Light)**: `hsl(44, 100%, 88%)` - pale gold background
- **Accent (Gold)**: `hsl(42, 100%, 54%)` - #FBB800
- **Background**: `hsl(231, 40%, 96%)` - very light grey-blue
- **Foreground**: `hsl(231, 64%, 16%)` - dark navy text

### Typography
- Font: System default (sans-serif)
- Headings: Bold, navy color
- Body: Regular weight, slate colors
- Small text: text-sm (0.875rem)

### Common UI Patterns
- **Headers**: White background, border-b border-slate-200, px-6 py-4
- **Cards**: bg-white, rounded-lg, border border-slate-200, shadow-sm
- **Tables**: Fixed headers, hover:bg-slate-50, divide-y divide-slate-100
- **Buttons**: 
  - Primary: bg-primary text-white hover:bg-primary/90
  - Outline: border border-input hover:bg-accent hover:text-accent-foreground
  - Ghost: hover:bg-accent/10
- **Tabs**: Rounded tabs with active state (bg-white shadow)
- **Alerts**: 
  - Warning: border-amber-300 bg-amber-50 text-amber-800
  - Info: border-blue-300 bg-blue-50 text-blue-800
  - Error: border-red-300 bg-red-50 text-red-800

---

## PAGE 1: Home (/)

### Purpose
Auto-redirect users based on role after login.

### Functionality
1. On mount, check current user's role
2. If role is "admin" or "intake" → redirect to /intake
3. If role is "worker" or "supervisor" → redirect to /dashboard
4. Show loading spinner while checking

### Components
- Loading spinner (w-8 h-8, candora-spin class)

### Layout
- Full screen centered spinner
- No navigation visible during redirect

### Code Logic
```javascript
useEffect(() => {
  const redirect = async () => {
    const user = await base44.auth.me();
    if (user?.role === "admin" || user?.role === "intake") {
      navigate("/intake");
    } else {
      navigate("/dashboard");
    }
  };
  redirect();
}, []);
```

---

## PAGE 2: IntakePage (/intake)

### Purpose
Intake staff create new clients and manage unassigned clients before assigning them to career counsellors.

### Layout
- **Header**: White background, flex with title + action buttons
- **Main**: Max-w-7xl mx-auto, px-4 py-6
- **Two states**: Show form OR show client list

### Header Elements
- Title: "Intake — Unassigned Clients"
- Subtitle: "[X] awaiting assignment · Welcome, [User Name]"
- Buttons:
  - "Master List" (outline, navigate to /master)
  - "Reports" (outline, navigate to /reports)
  - "New Client" (primary, shows form)
  - Logout (ghost icon button)

### Client List View (when !showForm)

#### Filters Section (ClientListControls component)
- **Search**: Text input (search by name, phone, email, HSID)
- **Filters**:
  - Service Type (dropdown: all, DEA, Pathways, Casual, etc.)
  - Program Status (dropdown: all, in_progress, complete, incomplete, cancelled)
  - Employment Status (dropdown: all, E-RF, E-UF, E-PT, UE, etc.)
  - CLB Level (dropdown: all, CLB 1-12, Native)
  - Assigned Worker (dropdown: all workers)
  - Age Range (min/max inputs)
  - Duration (min/max inputs)
- **Sort**: Dropdown (intake date, name, service type, etc.)

#### Table Columns
1. **Name**: Link to /client/:id, font-semibold, navy color
2. **HSID#**: compass_hsid or "—"
3. **Phone**: phone or "—"
4. **Service**: SERVICE_LABELS mapping (DEA, Pathways, Casual, etc.)
5. **Switches**: Count badge (amber bg) if program_stream_switches.length > 0
6. **Program Status**: Colored badge (blue/green/yellow/red)
7. **Career Counsellor**: assigned_worker_name or "—"
8. **Intake Date**: Formatted (MMM d, yyyy)
9. **Action**: "Open" button (outline, navigate to client)

#### Empty State
- If unassignedClients.length === 0: "All clients have been assigned to a career counsellor."
- If filtered results === 0: "No clients match your filters."

### Intake Form View (when showForm)

#### Component: IntakeForm
- **Sections**:
  1. Personal Information (first_name, last_name, date_of_birth, sex)
  2. Contact Information (phone, email)
  3. Address (address, city, state, zip)
  4. Demographics (residency_status, clb_level, employment_status, has_vehicle)
  5. Government ID (compass_hsid, compass_verified checkbox, compass_verified_date, compass_verified_by, compass_notes)
  6. Service Information (service_type, referral_source, assigned_worker dropdown)
  7. Career Objectives (textarea)
  8. Employment History (dynamic array - add/remove entries)
  9. Education (dynamic array - add/remove entries)
  10. Documents (file upload for resumes, etc.)
  11. Intake Notes (textarea)

- **Validation**:
  - Required: first_name, last_name
  - Email format validation
  - Phone format validation
  - Date validation (date_of_birth not in future)

- **Actions**:
  - Save: Calls onSave with form data
  - Cancel: Closes form, clears editingClient

### Duplicate Detection Logic
```javascript
// Before saving, check for duplicates by:
// 1. Email (case-insensitive)
// 2. Phone (digits only comparison)
// 3. HSID (exact match)
// If duplicates found, show DuplicateWarningDialog
```

### DuplicateWarningDialog Component
- Shows list of potential duplicates
- Options: "Save Anyway" or "Cancel"
- On confirm: Calls doSave with pending data

### Save Logic
```javascript
if (editingClient) {
  // Update existing client
  const updated = await base44.entities.Client.update(id, data);
} else {
  // Create new client with auto intake_date
  const withDate = { ...data, intake_date: new Date().toISOString().split("T")[0] };
  const created = await base44.entities.Client.create(withDate);
  
  // Auto-create Compass task for new client
  const task = taskNewClient(created);
  await createCompassTask({ 
    client_id: created.id, 
    client_name: `${created.first_name} ${created.last_name}`,
    compass_hsid: created.compass_hsid,
    ...task 
  });
}
```

### Automations Triggered
- **sendAlertEmail**: If internal_referrals, external_referrals, or service_navigation_supports changed

---

## PAGE 3: WorkerDashboard (/dashboard)

### Purpose
Career counsellors view and manage their assigned clients, see alerts, and access Compass task queue.

### Special Logic
- **Dawn Williston (Service Navigator)**: Sees ALL clients with barriers_addressed=true, not just assigned
- **Regular Workers**: See ONLY clients where assigned_worker === their email

### Layout
- **Header**: Navy background (hsl(231,64%,20%)), white text
- **Tab Switcher**: "My Clients" | "Compass Queue" (with badge count)
- **Alert Panels**: DEA closing soon, 90-day follow-ups due
- **Client Table**: Master list with color-coded rows

### Header
- Title: "Service Navigator Dashboard" (if Dawn) or "My Clients" (otherwise)
- Subtitle: "Welcome, [User Name]"
- Logout button (ghost, white text)

### Tab Switcher
- Gray background (bg-slate-100), rounded-lg
- Active tab: white background, shadow
- Compass tab shows pending count badge (amber circle)

### Alert Panel 1: DEA Closing Soon
**Show if**: Any DEA clients within 3 days of program end

**Design**:
- Border: border-blue-300 bg-blue-50 rounded-xl p-4
- Header: Bell icon (animate-bounce), "DEA Program Period Closing Soon", count badge
- Each client row:
  - Calendar icon
  - Client name (link)
  - End date
  - Days left badge (red if overdue, amber if 0-1 days, blue otherwise)
  - "Open File" button

**Logic**:
```javascript
const deaClosingClients = clients.filter(c => {
  if (c.service_type !== "direct_to_employment") return false;
  if (c.file_closed) return false;
  const endDate = c.completion_date || addDays(service_start_date, 14);
  const days = differenceInDays(endDate, new Date());
  return days <= 3;
});
```

### Alert Panel 2: Upcoming 90-Day Follow-Ups
**Show if**: Any clients with follow-up due within 14 days

**Design**:
- Border: border-amber-300 bg-amber-50 rounded-xl p-4
- Header: Bell icon, "Upcoming 90-Day Follow-Ups", count badge
- Each client row:
  - Bell icon
  - Client name (link)
  - Due date
  - Days badge (red if overdue, amber if urgent ≤5 days, blue otherwise)
  - "Go to Client" button
  - Urgent rows: animate-pulse class

**Logic**:
```javascript
const upcomingFollowups = clients.filter(c => {
  if (c.followup_90day_status) return false; // already done
  const followupDate = c.followup_90day_date || addDays(completion_date, 90);
  const days = differenceInDays(followupDate, new Date());
  return days <= 14;
});
```

### Client Table

#### Columns (for Dawn/Service Navigator)
1. Name
2. HSID#
3. Service
4. Switches
5. Program Status
6. CLB
7. **Barrier 1** (with status badge)
8. **Barrier 2** (with status badge)
9. **Barrier 3** (with status badge)
10. Employment Status
11. Employment Start Date
12. 90-Day Status
13. Svc Nav (Yes/—)
14. Intake Date

#### Columns (for Regular Workers)
1. Name
2. HSID#
3. Service
4. Switches
5. Program Status
6. CLB
7. Employment Status
8. Employment Start Date
9. 90-Day Status
10. Svc Nav
11. Intake Date

#### Row Colors (clientRowColor utility)
- **No barriers identified**: bg-orange-50 (light orange)
- **Barriers identified, action plan incomplete**: bg-yellow-50 (light yellow)
- **Action plan complete, no employment**: bg-blue-50 (light blue)
- **Employment outcome achieved**: bg-green-50 (light green)
- **90-day follow-up complete**: bg-slate-50 (light grey)

#### Program Status Badge Logic
```javascript
if (c.program_status === "complete" && !c.followup_90day_status) {
  return "Complete (Follow-Up Period)";
}
if (!c.program_status) {
  return "Assessments / Action Plan Incomplete"; // orange badge
}
return c.program_status; // normal badge
```

### Compass Queue Tab
- Shows CompassTaskList component
- Filters tasks by assigned_worker === current user
- Pending/completed tabs within component

---

## PAGE 4: MasterList (/master)

### Purpose
View all assigned clients (active and closed) with comprehensive filtering.

### Layout
- **Header**: Navy background, title + stats + buttons
- **Tab Switcher**: "Active Files" | "Closed Files"
- **Filters**: Extended filter options
- **Table**: Comprehensive client data

### Header
- Title: "Master Client List"
- Subtitle: "[X] shown · [active] active · [closed] closed · [unassigned] unassigned in intake"
- Buttons: "Reports", Logout

### Tab Switcher
- White background, border-b border-slate-200
- Active tab: gold underline (hsl(42,100%,54%))
- Counts in badges

### Filters (Extended)
- All standard filters from IntakePage
- PLUS:
  - Referral Source
  - Residency Status
  - 90-Day Follow-Up Status

### Table Columns

#### Active Files Tab
1. Name
2. HSID#
3. Intake Date
4. Service Element
5. Program Start
6. **Switches** (visual arrows showing from→to)
7. Program Status
8. Completion Date
9. Employment Status
10. Employment Start Date
11. 90-Day Date
12. 90-Day Status
13. Svc Nav
14. Career Counsellor

#### Closed Files Tab
- Same as active, PLUS:
15. Close Reason (badge)
16. Closed Date

### Stream Switches Display
```jsx
{c.program_stream_switches.map((sw, i) => (
  <div key={i} className="flex items-center gap-1">
    <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
      {SERVICE_LABELS[sw.from_stream]}
    </span>
    <span className="text-slate-400">→</span>
    <span className="text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
      {SERVICE_LABELS[sw.to_stream]}
    </span>
  </div>
))}
```

### Row Click
- Clicking any row navigates to /client/:id

---

## PAGE 5: ClientProfile (/client/:id)

### Purpose
View and edit individual client record with tabs for different sections.

### Layout
- **Header**: Client name, HSID, status badges
- **Tabs**: Overview | Financials | Referrals | Placements
- **Tab Content**: Varies by tab

### Header
- Client full name (large heading)
- HSID# badge
- Program status badge
- Service type badge
- Action buttons: Edit, Close File, Status Change

### Tab 1: Overview

#### Component: ClientProfileOverview
**Sections**:
1. **Personal Information** (editable)
   - Name, DOB, sex, contact info, address
2. **Government ID** (editable)
   - HSID, verified checkbox, date, verified by, notes
3. **Immigration & Language** (editable)
   - Residency status, CLB level
4. **Employment** (editable)
   - Employment status, vehicle status
5. **Service Information** (editable)
   - Service type, referral source, assigned worker
6. **Program Status** (editable)
   - Program status, service start date, completion date
7. **Career Background** (editable)
   - Career objectives, employment history

**Compass Verification Alert**:
```jsx
{!client.compass_verified && (
  <Alert variant="warning">
    This client has not been entered into Compass yet.
    Please create a Compass entry as soon as possible.
  </Alert>
)}
```

**Stream Switch Alert**:
```jsx
{client.program_stream_switches?.length > 0 && (
  <Alert variant="info">
    This client has been switched {client.program_stream_switches.length} time(s).
    Review switch history for billing implications.
  </Alert>
)}
```

#### Component: ActionPlanRoadmap
**Visual Timeline**:
- Horizontal timeline with milestones
- Color-coded items by category
- Progress indicators (planned, started, completed)
- Click to edit item status

**Sections**:
1. **Barriers** (from BIT)
2. **Action Plan Items** (SDP items)
3. **BIT Review Dates** (up to 4 scheduled reviews)
4. **Check-ins** (logged reviews)

**Item Status Colors**:
- Planned: bg-slate-100 text-slate-700
- Started: bg-blue-100 text-blue-700
- Completed: bg-green-100 text-green-700
- Cancelled: bg-red-100 text-red-700

**Overdue Alert**:
```jsx
{isOverdue && (
  <Alert variant="error">
    This item is {daysOverdue} days overdue.
    Please update the status or timeline.
  </Alert>
)}
```

#### Component: RoadmapItemPanel (sidebar)
**Fields**:
- Item label (read-only)
- Status toggle (planned/started/completed/cancelled)
- Planned start date
- Planned end date
- Case manager notes
- Save button

**Validation**:
- End date cannot be before start date
- Warn if end date is past program end date
- Confirm if marking complete without employment outcome

### Tab 2: Financials

#### Component: ClientFinancials
**Three Sections**:

1. **Exposure Courses**
   - Table of courses (WHMIS, First Aid, etc.)
   - Fields: course_type, vendor, amount, tax, total, date, registration_status, completion_status
   - File upload: receipts, completion records
   - "Add Course" button

2. **Paid External Placements**
   - Table of placements
   - Fields: employer_name, start_date, end_date, wage_rate, hours, total_amount
   - File upload: timesheets, invoices
   - "Add Placement" button

3. **Employment Supports**
   - Table of supports (work boots, tools, transit, etc.)
   - Fields: description, vendor, amount, date
   - File upload: receipts
   - "Add Support" button

**Financial Record Card**:
```jsx
<Card>
  <CardHeader>
    <CardTitle>{record.description}</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p className="text-sm text-slate-500">Amount</p>
        <p className="font-semibold">${record.amount}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Total (with tax)</p>
        <p className="font-semibold">${record.total}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Date</p>
        <p>{format(date, 'MMM d, yyyy')}</p>
      </div>
      <div>
        <p className="text-sm text-slate-500">Vendor</p>
        <p>{record.vendor}</p>
      </div>
    </div>
    {record.receipt_urls?.length > 0 && (
      <div className="mt-3">
        <p className="text-sm text-slate-500 mb-2">Receipts</p>
        <div className="flex gap-2 flex-wrap">
          {record.receipt_urls.map(url => (
            <a href={url} target="_blank" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              View Receipt
            </a>
          ))}
        </div>
      </div>
    )}
  </CardContent>
</Card>
```

### Tab 3: Referrals

#### Component: ClientReferrals
**Two Sections**:

1. **Internal Referrals**
   - Checkboxes for internal services:
     - Service Navigation
     - Internal Training (cleaning, food services, reception, childcare)
     - BIT Assessment
     - Action Plan Development
   - When checked: auto-triggers sendAlertEmail automation

2. **External Referrals**
   - List of external agencies
   - Add referral button
   - Fields: agency_name, referral_date, contact_person, notes, status (pending/completed)
   - When added: auto-triggers sendAlertEmail automation

### Tab 4: Placements

#### Component: ClientPlacements
**Two Sections**:

1. **Internal Training**
   - Shows InternalTraining record if exists
   - Placement type, start/end dates, supervisor, schedule
   - Transportation status
   - Training goals
   - Progress tracker link

2. **External Employment**
   - Employer name, contact
   - Job title, start date
   - Wage, hours
   - Employment status at follow-up

---

## PAGE 6: Reports (/reports)

### Purpose
Generate analytical reports, export data, and view staff monthly reports.

### Layout
- **Header**: Title + description
- **Tabs**: Outcomes | Data Reports | Staff Monthly
- **Tab Content**: Varies

### Tab 1: Outcomes

#### Component: CRTOutcomes
**Metrics Displayed**:
1. **DEA Starters**: Count of clients who started DEA this period
2. **Pathways Starters**: Count of clients who started Pathways this period
3. **DEA Completers**: Count who completed DEA
4. **Pathways Completers**: Count who completed Pathways
5. **Employment Outcomes**: Count who gained employment
6. **90-Day Outcomes**: Count who sustained employment 90 days

**Filters**:
- Date range (start/end)
- Service type (DEA, Pathways, both)
- Worker (dropdown)

**Visual Design**:
- Stat cards: bg-white, rounded-lg, border, p-6
- Large number display: text-4xl font-bold
- Trend indicators: green up arrow, red down arrow
- Mini pie charts for demographics

**Export Button**:
- "Export to CSV" - downloads all outcome data

### Tab 2: Data Reports

#### Component: ReportSummary
**Features**:
1. **Custom Report Builder**
   - Select fields to include
   - Apply filters
   - Run report
   - Export to CSV/PDF

2. **Pre-built Reports**
   - Demographic Summary
   - Service Element Breakdown
   - Employment Outcomes by Month
   - Barrier Analysis
   - CLB Level Distribution
   - Residency Status Report

3. **Visualizations**
   - Bar charts for counts
   - Pie charts for distributions
   - Line charts for trends over time
   - Progress bars for completion rates

**Report Sections**:
- Executive Summary (KPIs)
- Demographic Breakdown
- Service Stream Analysis
- Financial Summary
- Outcome Metrics
- Recommendations

### Tab 3: Staff Monthly

#### Component: StaffMonthlyReports
**Two Views**:

1. **Submit Report** (current month)
   - Form with fields:
     - Trends observed (textarea)
     - Marketing activities (textarea)
     - Success stories (textarea)
     - Employer engagements (textarea)
     - Challenges (textarea)
     - Goals next month (textarea)
     - Additional notes (textarea)
   - Save as draft button
   - Submit button (finalizes report)

2. **View Past Reports** (list)
   - Filter by staff member
   - Filter by month
   - Group by month
   - Click to view full report

---

## PAGE 7: SupervisorPortal (/supervisor)

### Purpose
Supervisors manage internal training placements, track progress, and complete evaluations.

### Layout
- **Split View**:
  - Left Panel (w-80): Client list
  - Right Panel (flex-1): Detail view

### Left Panel: Client List

#### Header
- Search input (search by client name)
- Filter by placement type (dropdown)
- Filter by status (dropdown: all, referred, active, completed, withdrawn, cancelled)

#### List Items
```jsx
<button onClick={() => setSelected(client)} className="w-full text-left px-4 py-3 border-b hover:bg-slate-50">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-sm font-semibold">{client_name}</p>
      <p className="text-xs text-slate-500">{placement_type}</p>
      <p className="text-xs text-slate-400">Referred {date}</p>
    </div>
    <span className="text-xs px-2 py-0.5 rounded-full bg-{status}-100 text-{status}-700">
      {status}
    </span>
  </div>
  {evaluation_completed && (
    <span className="text-xs text-green-700">✓ Evaluation complete</span>
  )}
</button>
```

### Right Panel: Detail View

#### Header
- Client name (large)
- Placement type
- Career counsellor name

#### Summary Cards
- Transportation status
- Start date
- Expected end date
- Training goals (from counsellor)
- Referral notes (from counsellor)

#### Tabs

**Tab 1: Progress**
- Component: TrainingProgressTracker
- Check-in dates (orientation, midpoint, program completion)
- Supervisor notes log
- Attendance tracking
- Milestone completion

**Tab 2: Training Plan**
- Component: TrainingPlanEditor
- Customized training items (checkboxes)
- Focus areas (toggle)
- Completion dates
- Notes per item

**Tab 3: Evaluation**
- Component: TrainingEvaluation
- Ratings (1-5 or excellent/poor scale):
  - Reliability
  - Attitude
  - Skill Development
  - Teamwork
  - Communication
- Would hire? (yes/yes with conditions/no)
- Strengths (textarea)
- Areas for growth (textarea)
- Overall comments (textarea)

---

## PAGE 8: Resources (/resources)

### Purpose
Provide career planning tools and job search resources to clients.

### Layout
- **Header**: Title + description
- **Tabs**: Career Planning | Job Search

### Tab 1: Career Planning

#### Component: CareerPlanning
**Sections**:
1. **Self-Assessment Tools**
   - Skills inventory
   - Interests assessment
   - Values clarification
   - Work style preferences

2. **Career Exploration**
   - Occupational databases
   - Job market information
   - Salary ranges
   - Education requirements

3. **Goal Setting**
   - Short-term goals (1-6 months)
   - Long-term goals (1-5 years)
   - Action steps
   - Timeline

4. **Decision Making**
   - Pros/cons lists
   - Decision matrices
   - Informational interviews

### Tab 2: Job Search

#### Component: JobSearch
**Sections**:
1. **Resume Building**
   - Templates
   - Writing tips
   - Keyword optimization
   - Format examples

2. **Cover Letters**
   - Templates by industry
   - Customization tips
   - Sample letters

3. **Job Boards**
   - Links to Indeed, LinkedIn, WorkBC, etc.
   - Local employer websites
   - Government job postings

4. **Interview Preparation**
   - Common questions
   - STAR method
   - Mock interview practice
   - Dress code guidelines

5. **Networking**
   - LinkedIn profile optimization
   - Networking events
   - Professional associations
   - Informational interviews

---

## PAGE 9: Compass (/compass)

### Purpose
Queue for data entry tasks that need to be entered into Compass (Government of Alberta database).

### Layout
- **Header**: Title + pending count + refresh button
- **Grouped by Counsellor**: Each counsellor's tasks shown separately

### Header
- Title: "Compass Task Queue"
- Subtitle: "Pending data entry tasks for the Government of Alberta Compass database"
- Pending count badge (amber)
- Refresh button

### Task Grouping
```javascript
// Group tasks by assigned_worker_name
const grouped = tasks.reduce((acc, task) => {
  const counsellor = task.assigned_worker_name || 'Unassigned';
  if (!acc[counsellor]) acc[counsellor] = [];
  acc[counsellor].push(task);
  return acc;
}, {});
```

### Task Card Design
```jsx
<Card className="mb-3">
  <CardContent className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="font-semibold">{task.title}</p>
        <p className="text-sm text-slate-500">{task.client_name}</p>
        <p className="text-xs text-slate-400 mt-1">HSID: {task.compass_hsid}</p>
      </div>
      <Badge variant={task.status === 'pending' ? 'warning' : 'success'}>
        {task.status}
      </Badge>
    </div>
    <p className="text-sm text-slate-600 mt-3">{task.instructions}</p>
    <div className="flex items-center gap-2 mt-3">
      <Button size="sm" onClick={() => markComplete(task)}>
        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Complete
      </Button>
      <span className="text-xs text-slate-400">
        Triggered by {task.triggered_by_name} on {date}
      </span>
    </div>
  </CardContent>
</Card>
```

### Task Types (Priority Order)
1. **Action Plan** (highest priority)
2. **Barriers Identified**
3. **Employment Outcome**
4. **Status Change**
5. **New Client**
6. **Service Navigation**
7. **Other**

### Mark Complete Dialog
- Textarea for completed_notes
- "What did you enter in Compass?"
- On save: Updates task status to "completed", sets completed_by, completed_date, completed_notes

---

## PAGE 10: MonthlyBillingSubmissions (/billing)

### Purpose
Create and manage monthly invoice packages for government billing.

### Layout
- **Header**: Title + "Create Invoice Package" button
- **Tabs**: Invoice Packages | CRT | Invoices | Supporting Documents

### Tab 1: Invoice Packages

#### InvoicePackageList Component
**List of Packages**:
- Package number
- Billing month
- Status badge (draft/ready_for_review/submitted/approved)
- Prepared by/date
- Actions (view/edit)

#### InvoicePackageGenerator Component
**Step 1: Select Month**
- Month/year picker
- Check if package already exists

**Step 2: Auto-Populate Items**
- System queries:
  - Starters this month (by service_start_date)
  - Completers this month (by completion_date)
  - Employment outcomes (by employment_start_date)
  - 90-day outcomes (by followup_90day_date)
  - Exposure courses (by date)
  - Paid placements (by date)
  - Employment supports (by date)

**Step 3: Review & Edit**
- Line items table:
  - Category
  - Client name
  - Description
  - Unit rate
  - Quantity
  - Amount
- Edit quantities
- Exclude items (with reason)
- Add manual items

**Step 4: Attach Documents**
- Upload receipts
- Upload completion records
- Upload supporting documents

**Step 5: Submit**
- Review totals
- Add notes
- Submit for approval

### Tab 2: CRT

#### Component: CRT
**Purpose**: Client Report Tracking for government reporting

**Sections**:
1. **CRT Financials**
   - Total expenditures by category
   - Budget vs actual
   - Variance analysis

2. **CRT Outcomes**
   - Employment outcomes by month
   - Retention rates
   - Wage analysis
   - Demographic breakdowns

3. **CRT Client Data**
   - Extract client data for CRT format
   - Validate required fields
   - Export to CRT format

### Tab 3: Invoices

#### Component: Invoices
**Features**:
- List of generated invoices
- Invoice number, month, amount, status
- View invoice detail
- Download PDF
- Track submission status

### Tab 4: Supporting Documents

#### Component: SupportingDocuments
**Features**:
- Upload documents by category:
  - Exposure courses
  - Employment supports
  - Paid placements
  - Child minding
  - Other
- Organize by billing month
- Link to invoice packages
- Download all for submission

---

## AUTOMATIONS

### Automation 1: Daily Follow-Up Reminder
**Type**: Scheduled

**Configuration**:
- Function: followupReminder
- Schedule: Daily at 9:00 AM (America/Edmonton)
- repeat_interval: 1
- repeat_unit: days
- start_time: "09:00"

**Function Logic**:
```javascript
// 1. Get all clients where:
//    - program_status === "complete"
//    - !followup_90day_status
//    - followup_90day_date within next 14 days OR overdue

// 2. Group by assigned_worker

// 3. Send email to each worker with their clients
const emailBody = `
Hi ${workerName},

You have ${clients.length} client(s) due for 90-day follow-up:

${clients.map(c => `
- ${c.first_name} ${c.last_name}
  Due: ${format(followupDate, 'MMM d, yyyy')} (${days} days ${days < 0 ? 'overdue' : 'remaining'})
  HSID: ${c.compass_hsid}
  Phone: ${c.phone}
`).join('\n')}

Please complete these follow-ups and update the client records.

Thanks!
`;

await base44.integrations.Core.SendEmail({
  to: workerEmail,
  subject: `90-Day Follow-Up Reminders - ${format(new Date(), 'MMM d, yyyy')}`,
  body: emailBody
});
```

### Automation 2: Alert Email on Client Update
**Type**: Entity

**Configuration**:
- Function: sendAlertEmail
- Entity: Client
- Events: ["update"]
- Trigger Conditions:
  - logic: "or"
  - conditions:
    - field: "changed_fields", operator: "contains", value: "internal_placement"
    - field: "changed_fields", operator: "contains", value: "internal_referrals"
    - field: "changed_fields", operator: "contains", value: "external_referrals"
    - field: "changed_fields", operator: "contains", value: "service_navigation_supports"

**Function Logic**:
```javascript
// Check what changed and send appropriate email

if (changed_fields.includes('internal_placement') && client.internal_placement !== 'none') {
  // Email supervisor
  await sendEmail({
    to: 'supervisor@candorasociety.com',
    subject: `Internal Training Referral: ${client.first_name} ${client.last_name}`,
    body: `...placement details...`
  });
}

if (changed_fields.includes('internal_referrals') && client.internal_referrals?.length > 0) {
  // Email receiving worker
  await sendEmail({
    to: client.assigned_worker,
    subject: `Internal Referral: ${client.first_name} ${client.last_name}`,
    body: `...referral details...`
  });
}

// Similar for external_referrals and service_navigation_supports
```

---

## COMPONENT LIBRARY

### UI Components (from @/components/ui)
- Button (variants: default, destructive, outline, secondary, ghost, link)
- Card (Card, CardHeader, CardTitle, CardContent, CardFooter)
- Input
- Label
- Select (Select, SelectTrigger, SelectValue, SelectContent, SelectItem)
- Tabs (Tabs, TabsList, TabsTrigger, TabsContent)
- Dialog (Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter)
- Badge
- Table (Table, TableHeader, TableBody, TableRow, TableHead, TableCell)
- Textarea
- Checkbox
- Switch
- Calendar
- Popover
- Progress
- Alert
- Accordion
- Command
- Dropdown Menu
- Toast/Sonner

### Custom Components

#### AppNav
**Purpose**: Top navigation bar

**Items** (role-based):
- Admin/Intake: Intake, Master List, Reports, Supervisor, Resources, Compass, Billing
- Worker: Dashboard, My Clients, Resources, Compass
- Supervisor: Supervisor Portal, Resources

**Design**:
- Fixed top, full width
- White background, border-b
- Logo on left
- Navigation links in center
- User menu on right (profile, logout)

#### Celebration
**Purpose**: Confetti animation for milestones

**Triggers**:
- Client completes program
- Client gains employment
- 90-day follow-up complete
- Training evaluation complete

**Design**:
- Canvas overlay
- Confetti particles (navy and gold colors)
- Auto-dismiss after 3 seconds

#### DuplicateWarningDialog
**Purpose**: Warn about potential duplicate clients

**Props**:
- duplicates (array)
- onConfirm
- onCancel

**Design**:
- Alert variant warning
- List of potential matches
- "Save Anyway" / "Cancel" buttons

#### StatusChangeDialog
**Purpose**: Confirm program status changes

**Props**:
- client
- onChange
- onCancel

**Design**:
- Shows current vs new status
- Reason dropdown
- Notes textarea
- Compass task warning

#### CloseFileDialog
**Purpose**: Guide through file closing workflow

**Props**:
- client
- onClose
- onCancel

**Design**:
- Checklist of closing requirements
- Reason dropdown
- Final confirmation
- Auto-creates Compass task

---

## BUSINESS LOGIC SUMMARY

### Client Flow
1. **Intake**: Created in IntakePage (unassigned)
2. **Assignment**: Intake staff assigns worker → moves to worker's dashboard
3. **Assessment**: BIT completed, barriers identified
4. **Action Plan**: SDP items created, roadmap built
5. **Program**: Client participates (DEA 2-week, Pathways longer, Casual ongoing)
6. **Completion**: Program status → complete
7. **Employment**: Client gains job, employment_start_date recorded
8. **Follow-Up**: 90-day check-in, followup_90day_status recorded
9. **Closure**: File closed with reason

### Billing Flow
1. **Monthly**: Invoice package created for month
2. **Auto-populate**: System queries billable items
3. **Review**: Staff reviews and edits line items
4. **Submit**: Package submitted for approval
5. **Invoice**: Invoice generated from package
6. **Payment**: Tracked in system

### Compass Integration
- **Not automated**: All Compass entry is manual
- **Task queue**: System creates tasks, staff enter data in Compass
- **Verification**: compass_verified checkbox confirms entry
- **Audit trail**: CompassTask records track what was entered

---

## TESTING CHECKLIST

### Entities
- [ ] All 11 entities created with correct schemas
- [ ] Required fields enforced
- [ ] Enum values match specifications
- [ ] Array/object fields work correctly

### Backend Functions
- [ ] followupReminder sends emails daily at 9 AM
- [ ] sendAlertEmail triggers on correct field changes
- [ ] Email addresses are correct

### Automations
- [ ] Scheduled automation runs at correct time
- [ ] Entity automation triggers on update
- [ ] Trigger conditions work correctly

### Pages
- [ ] Home redirects based on role
- [ ] IntakePage shows only unassigned clients
- [ ] WorkerDashboard shows correct clients
- [ ] MasterList active/closed tabs work
- [ ] ClientProfile tabs all functional
- [ ] Reports generate correct data
- [ ] SupervisorPortal split view works
- [ ] Compass groups by counsellor
- [ ] Billing package generator auto-populates

### Components
- [ ] AppNav shows correct items by role
- [ ] ClientListControls filters work
- [ ] DuplicateWarningDialog detects duplicates
- [ ] Celebration triggers on milestones
- [ ] All forms validate correctly

### Styling
- [ ] Candora colors applied correctly
- [ ] Responsive design works on mobile
- [ ] Loading spinners use candora-spin class
- [ ] Tables are readable and responsive

---

**End of Instructions**