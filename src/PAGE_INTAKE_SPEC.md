# INTAKE PAGE — Complete Replication Specification

## Files involved
1. `pages/IntakePage.jsx` — main page
2. `components/intake/IntakeForm.jsx` — new/edit client form
3. `components/intake/DuplicateWarningDialog.jsx` — duplicate detection modal
4. `components/lists/ClientListControls.jsx` — search/filter/sort bar (shared with MasterList)
5. `lib/compassTasks.js` — Compass task generator (shared utility)

---

## PAGE: IntakePage (`/intake`)

### Purpose
Shows all clients who have **not yet been assigned to a career counsellor** (`assigned_worker` is empty/null). This is the intake queue — new clients waiting to be assigned and processed.

### Data Loading
```js
// On mount:
const me = await base44.auth.me();
const [clientList, userList] = await Promise.all([
  base44.entities.Client.list("-created_date", 1000),
  base44.entities.User.list()
]);
// Filter for unassigned only:
const unassignedClients = clients.filter(c => !c.assigned_worker);
```

### State
```js
const [user, setUser] = useState(null);
const [clients, setClients] = useState([]);
const [users, setUsers] = useState([]);
const [showForm, setShowForm] = useState(false);
const [editingClient, setEditingClient] = useState(null);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [filters, setFilters] = useState(EMPTY_FILTERS);
const [sortKey, setSortKey] = useState("intake_date_desc");
const [workers, setWorkers] = useState([]);
const [pendingData, setPendingData] = useState(null);
const [duplicates, setDuplicates] = useState([]);
```

### EMPTY_FILTERS constant
```js
const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "",
};
```

### SERVICE_LABELS constant
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

### PROGRAM_STATUS_COLORS constant
```js
const PROGRAM_STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  incomplete: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};
```

---

## LAYOUT

### Loading State
```jsx
<div className="flex items-center justify-center min-h-screen">
  <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
</div>
```

### Page Shell
```jsx
<div className="min-h-screen bg-background">
  <header>...</header>
  <main className="max-w-7xl mx-auto px-4 py-6">
    {showForm ? <IntakeForm ... /> : <ListSection />}
  </main>
  {/* DuplicateWarningDialog mounted at bottom when active */}
</div>
```

---

## HEADER (Page-level, inside the page — NOT AppNav)

```jsx
<header className="bg-white border-b border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <div>
    <h1 className="text-xl font-bold text-slate-800">Intake — Unassigned Clients</h1>
    <p className="text-sm text-slate-500">
      {unassignedClients.length} awaiting assignment · Welcome, {user?.full_name}
    </p>
  </div>
  <div className="flex items-center gap-2 flex-wrap">
    <Button variant="outline" size="sm" onClick={() => navigate("/master")}>Master List</Button>
    <Button variant="outline" size="sm" onClick={() => navigate("/reports")}>Reports</Button>
    {!showForm && (
      <Button onClick={() => { setEditingClient(null); setShowForm(true); }} className="gap-2">
        <PlusCircle className="w-4 h-4" /> New Client
      </Button>
    )}
    <Button variant="ghost" size="icon" onClick={() => base44.auth.logout()}>
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</header>
```

**Details:**
- `text-xl font-bold text-slate-800` for title
- Subtitle shows unassigned count + user's full name
- Button order: Master List (outline sm) → Reports (outline sm) → New Client (primary, hidden when form is open) → Logout (ghost icon)
- "New Client" button: `gap-2` with `PlusCircle` icon
- Responsive: stacks vertically on mobile (`flex-col`), row on `sm:`

---

## LIST VIEW (when form is not shown)

### ClientListControls (Search/Filter/Sort Bar)
Placed above the table. Props:
```jsx
<ClientListControls
  search={search} onSearch={setSearch}
  filters={filters} onFilters={setFilters}
  sortKey={sortKey} onSort={setSortKey}
  workers={workers}  // array of unique assigned_worker_name strings
/>
```

### Table Container
```jsx
<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
```

### Table Header
```jsx
<thead className="bg-slate-50 border-b border-slate-200">
  <tr>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Name</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">HSID#</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Phone</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Service</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Switches</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Program Status</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Career Counsellor</th>
    <th className="text-left px-3 py-3 font-semibold text-slate-600">Intake Date</th>
    <th className="px-3 py-3" /> {/* Actions column - no label */}
  </tr>
</thead>
```

### Table Body
```jsx
<tbody className="divide-y divide-slate-100">
  {displayed.map(c => (
    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
      
      {/* Name — clickable blue link */}
      <td className="px-3 py-2.5 font-medium">
        <Link to={`/client/${c.id}`} className="text-blue-700 hover:underline">
          {c.first_name} {c.last_name}
        </Link>
      </td>
      
      {/* HSID */}
      <td className="px-3 py-2.5 text-slate-600">{c.compass_hsid || "—"}</td>
      
      {/* Phone */}
      <td className="px-3 py-2.5 text-slate-600">{c.phone || "—"}</td>
      
      {/* Service stream — short label */}
      <td className="px-3 py-2.5 text-slate-600">{SERVICE_LABELS[c.service_type] || "—"}</td>
      
      {/* Switches — amber badge if any */}
      <td className="px-3 py-2.5">
        {c.program_stream_switches?.length > 0 ? (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
            {c.program_stream_switches.length}×
          </span>
        ) : "—"}
      </td>
      
      {/* Program status — color-coded badge */}
      <td className="px-3 py-2.5">
        {c.program_status ? (
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
            {c.program_status.replace("_", " ")}
          </span>
        ) : "—"}
      </td>
      
      {/* Assigned worker */}
      <td className="px-3 py-2.5 text-slate-600">{c.assigned_worker_name || "—"}</td>
      
      {/* Intake date — formatted */}
      <td className="px-3 py-2.5 text-slate-500">
        {c.intake_date ? format(new Date(c.intake_date), "MMM d, yyyy") : "—"}
      </td>
      
      {/* Open button */}
      <td className="px-3 py-2.5">
        <Link to={`/client/${c.id}`}>
          <Button variant="outline" size="sm">Open</Button>
        </Link>
      </td>
    </tr>
  ))}
  
  {/* Empty state */}
  {displayed.length === 0 && (
    <tr>
      <td colSpan={9} className="text-center py-10 text-slate-400">
        {unassignedClients.length === 0
          ? "All clients have been assigned to a career counsellor."
          : "No clients match your filters."}
      </td>
    </tr>
  )}
</tbody>
```

---

## DUPLICATE DETECTION LOGIC

On save attempt (new clients only):
```js
const findDuplicates = (data) => {
  return clients.filter(c => {
    if (editingClient && c.id === editingClient.id) return false;
    return (
      (data.email && c.email && data.email.toLowerCase() === c.email.toLowerCase()) ||
      (data.phone && c.phone && data.phone.replace(/\D/g, "") === c.phone.replace(/\D/g, "")) ||
      (data.compass_hsid && c.compass_hsid && data.compass_hsid === c.compass_hsid)
    );
  });
};

const handleSaveAttempt = (data) => {
  const found = findDuplicates(data);
  if (found.length > 0 && !editingClient) {
    setPendingData(data);
    setDuplicates(found);
    // → shows DuplicateWarningDialog
  } else {
    doSave(data);
  }
};
```

Duplicate matching: same email (case-insensitive) OR same phone digits OR same HSID#.

---

## SAVE LOGIC

```js
const doSave = async (data) => {
  if (editingClient) {
    const updated = await base44.entities.Client.update(editingClient.id, data);
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  } else {
    // Auto-set intake_date to today
    const withDate = { ...data, intake_date: new Date().toISOString().split("T")[0] };
    const created = await base44.entities.Client.create(withDate);
    setClients(prev => [created, ...prev]);
    
    // AUTOMATION: Create Compass task for new client
    const t = taskNewClient(created);
    await createCompassTask({
      client_id: created.id,
      client_name: `${created.first_name} ${created.last_name}`,
      compass_hsid: created.compass_hsid,
      ...t
    });
  }
  setShowForm(false);
  setEditingClient(null);
  setPendingData(null);
  setDuplicates([]);
};
```

**Key automation:** Every new client automatically generates a `new_client` Compass task.

---

## COMPONENT: DuplicateWarningDialog

```jsx
<Dialog open={true} onOpenChange={onCancel}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-amber-700">
        <AlertTriangle className="w-5 h-5" />
        Possible Duplicate Client
      </DialogTitle>
      <DialogDescription>
        A client with matching information already exists in the system:
      </DialogDescription>
    </DialogHeader>

    {/* Each duplicate shown in amber card */}
    <div className="space-y-2 my-2">
      {duplicates.map(d => (
        <div key={d.id} className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm">
          <p className="font-semibold text-slate-800">{d.first_name} {d.last_name}</p>
          {d.email && <p className="text-slate-500">Email: {d.email}</p>}
          {d.phone && <p className="text-slate-500">Phone: {d.phone}</p>}
          {d.compass_hsid && <p className="text-slate-500">HSID#: {d.compass_hsid}</p>}
        </div>
      ))}
    </div>

    <p className="text-sm text-slate-600">Do you want to create a new client anyway?</p>

    <div className="flex justify-end gap-3 mt-2">
      <Button variant="outline" onClick={onCancel}>No, go back</Button>
      <Button onClick={onConfirm} className="bg-amber-600 hover:bg-amber-700 text-white">
        Yes, create anyway
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

---

## COMPONENT: IntakeForm

### Header Row
```jsx
<div className="flex items-center gap-3 mb-2">
  <Button type="button" variant="ghost" size="icon" onClick={onCancel}>
    <ArrowLeft className="w-4 h-4" />
  </Button>
  <h2 className="text-xl font-bold text-slate-800">
    {client ? "Edit Client" : "New Client Intake"}
  </h2>
</div>
```

### Overall layout
```jsx
<form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
  {/* Section 1: Demographics */}
  <Card>...</Card>
  
  {/* Section 2: Case & Service Info */}
  <Card>...</Card>
  
  {/* Submit/Cancel buttons */}
  <div className="flex justify-end gap-3">
    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
    <Button type="submit" className="gap-2">
      <Save className="w-4 h-4" /> {client ? "Save Changes" : "Save Client"}
    </Button>
  </div>
</form>
```

### Card layout pattern
```jsx
<Card>
  <CardHeader><CardTitle className="text-base">[Section Title]</CardTitle></CardHeader>
  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Fields */}
  </CardContent>
</Card>
```

---

### SECTION 1: Demographics (Card 1)

Fields (2-column grid on md+):
| Field | Type | Notes |
|---|---|---|
| First Name * | Input | Required, shows red border + error on validation fail |
| Last Name * | Input | Required |
| Date of Birth | Input type="date" | |
| Sex | Select | Options: Male, Female |
| Phone | Input | Validates 10-11 digits, strips non-digits |
| Email | Input | Validates email format |
| Compass HSID# | Input | Placeholder: "Government of Alberta HSID number" |
| Address | Input | |
| City | Input | |
| Province + Postal Code | 2-col sub-grid | Province: Select (AB,BC,MB,NB,NL,NS,NT,NU,ON,PE,QC,SK,YT); Postal: Input maxLength=7, placeholder "A1A 1A1", validates Canadian format |

**Validation errors:** `text-xs text-red-500` below the input; input gets `border-red-400` class.

---

### SECTION 2: Case & Service Info (Card 2)

Fields (2-column grid on md+):
| Field | Type | Options |
|---|---|---|
| Referral Source | Select | Self, Family/Friend, School, Employer, External Agency, Alberta Works, Other |
| Service Element (Stream) | Select | Direct to Employment (DEA), Pathways, Casual, Internal Referral |
| Assign to Worker | Select | Hardcoded list (see below) |
| Status | Select | New, Active, Pending, Closed |
| Residency Status | Select | Canadian Citizen, Permanent Resident, Protected Person, Convention Refugee, Refugee Claimant/Asylum Seeker, Temporary Resident, Work Permit Holder, Study Permit Holder, Visitor, Other |
| CLB Level | Select | CLB 1–12, Native English/French Speaker |
| Employment Status | Select | Employed, Unemployed, Underemployed |
| Has Vehicle | Select | Yes, No (has driver's license), No (no driver's license) |

**Hardcoded worker list (assign to worker):**
```js
const workerUsers = [
  { email: "priscilla@candorasociety.com", full_name: "Priscilla" },
  { email: "lola@candorasociety.com", full_name: "Lola" },
  { email: "john@candorasociety.com", full_name: "John" },
  { email: "Dawn.williston@candorasociety.com", full_name: "Dawn" },
  { email: "olena@candorasociety.com", full_name: "Olena" },
];
// Select displays: "Priscilla (priscilla@candorasociety.com)"
// On select: sets both assigned_worker (email) and assigned_worker_name (full_name)
```

---

### Career Objectives (md:col-span-2)
```jsx
<Textarea rows={4} placeholder="Describe the client's career goals and employment objectives..." />

{/* Quick-add preset buttons below textarea */}
<p className="text-xs text-slate-500 mb-1.5">Quick add career type:</p>
<div className="flex flex-wrap gap-1.5">
  {CAREER_PRESETS.map(preset => (
    <button
      type="button"
      className="text-xs px-2 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors"
      onClick={() => append preset to career_objectives (newline separated)}
    >
      {preset}
    </button>
  ))}
</div>
```

**CAREER_PRESETS** (18 items):
```
Administrative / Clerical, Agriculture / Farming, Automotive / Trades,
Childcare / Early Education, Construction / Labourer, Customer Service / Retail,
Driving / Transportation, Food Service / Hospitality, Healthcare / Personal Support,
Housekeeping / Cleaning, IT / Technology, Landscaping / Grounds,
Manufacturing / Warehouse, Oil & Gas / Energy, Security / Safety,
Social Services / Nonprofit, Skilled Trades / Apprenticeship, Teaching / Tutoring
```

---

### Employment History (md:col-span-2)
Dynamic list of position entries. Each entry is a card:
```jsx
<div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
  {/* Header with "Position N" title and X remove button */}
  <div className="flex items-center justify-between mb-2">
    <h4 className="text-sm font-semibold text-slate-700">Position {index + 1}</h4>
    <button type="button" onClick={remove} className="text-slate-400 hover:text-red-500">
      <X className="w-4 h-4" />
    </button>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
    {/* Company (text input) */}
    {/* Industry (Select — 20 industry options) */}
    {/* Job Title (Select — ~40 preset titles) — md:col-span-2 */}
    {/*   → if "Other" selected: show text input below for custom title */}
    {/* Employment Type (Select: Full-time, Part-time, Temp, Contract, Seasonal, Internship, Volunteer, Self-employed) */}
    {/* Start Date + End Date (2-col sub-grid of date inputs) */}
    {/* Responsibilities (Textarea rows=2) — md:col-span-2 */}
  </div>
</div>
```

Add button: `<Button type="button" variant="outline" className="w-full">+ Add Position</Button>`

---

### Education & Training (md:col-span-2)
Same pattern as employment. Each entry:
```jsx
<div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
  <h4>Education {index + 1}</h4> + X remove
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
    {/* Institution / School (text input) */}
    {/* Education Type (Select — 14 types) */}
    {/* Field of Study / Program (text input) — md:col-span-2 */}
    {/* Start Date + End Date / Expected (2-col date inputs) */}
    {/* Description / Achievements (Textarea rows=2) — md:col-span-2 */}
  </div>
</div>
```

**EDUCATION_TYPES** (14 items):
```
High School Diploma, GED / Adult Learning Certificate,
College Diploma, College Certificate, Bachelor's Degree, Master's Degree, Doctorate,
Trade Certificate, Apprenticeship, Professional Certification,
ESL / LINC Training, Workshop, Short Course, On-the-Job Training
```

Add button: `<Button type="button" variant="outline" className="w-full">+ Add Education / Training</Button>`

---

### Resumes & Documents (md:col-span-2)
```jsx
<div className="border border-dashed border-slate-300 rounded-lg p-4 bg-slate-50">
  <label className="flex flex-col items-center gap-2 cursor-pointer">
    <Upload className="w-6 h-6 text-slate-400" />
    <span className="text-sm text-slate-500">
      {uploading ? "Uploading..." : "Click to upload resume or document (PDF, image, Word)"}
    </span>
    <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" />
  </label>
</div>

{/* Uploaded files list */}
{form.resume_urls.map((url, i) => (
  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded px-3 py-2">
    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
    <a href={url} target="_blank" className="text-sm text-blue-600 hover:underline truncate flex-1">
      Document {i + 1}
    </a>
    <button onClick={remove} className="text-slate-400 hover:text-red-500">
      <X className="w-4 h-4" />
    </button>
  </div>
))}
```

Upload uses: `base44.integrations.Core.UploadFile({ file })` → returns `{ file_url }`

---

### Intake Notes (md:col-span-2)
```jsx
<Textarea rows={4} placeholder="Additional notes about the client..." />
```

---

### Form Validation
```js
const validate = (data) => {
  const errs = {};
  if (!data.first_name?.trim()) errs.first_name = "First name is required.";
  if (!data.last_name?.trim()) errs.last_name = "Last name is required.";
  if (data.phone) {
    const digits = data.phone.replace(/\D/g, "");
    if (digits.length < 10 || digits.length > 11) errs.phone = "Phone must be 10 digits (or 11 with country code).";
  }
  if (data.zip) {
    const postal = data.zip.replace(/\s/g, "").toUpperCase();
    if (!/^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(postal)) errs.zip = "Postal code must be in format A1A 1A1.";
  }
  if (data.email) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Enter a valid email address.";
  }
  return errs;
};
```

---

## COMPONENT: ClientListControls

### Row 1 (always visible)
```jsx
<div className="flex items-center gap-2 flex-wrap">
  {/* Search input */}
  <div className="relative flex-1 min-w-48 max-w-sm">
    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
    <Input className="pl-9 h-9" placeholder="Search name, HSID#, phone, email..." />
  </div>

  {/* Sort dropdown */}
  <div className="w-56">
    <Select value={sortKey} onValueChange={onSort}>
      {/* 10 sort options — see SORT_OPTIONS below */}
    </Select>
  </div>

  {/* Filters toggle button */}
  <Button
    variant={activeFilterCount > 0 ? "default" : "outline"}
    size="sm"
    className="gap-2 h-9"
  >
    <SlidersHorizontal className="w-4 h-4" />
    Filters
    {/* Badge with count when filters active */}
    {activeFilterCount > 0 && (
      <span className="bg-white text-slate-800 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {activeFilterCount}
      </span>
    )}
    {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
  </Button>

  {/* Clear filters — only shown when filters are active */}
  {activeFilterCount > 0 && (
    <Button variant="ghost" size="sm" className="gap-1 text-slate-500 h-9" onClick={clearAll}>
      <X className="w-3 h-3" /> Clear filters
    </Button>
  )}
</div>
```

### SORT_OPTIONS
```js
[
  { value: "last_name_asc", label: "Name (A → Z)" },
  { value: "last_name_desc", label: "Name (Z → A)" },
  { value: "intake_date_desc", label: "Intake Date (newest)" },
  { value: "intake_date_asc", label: "Intake Date (oldest)" },
  { value: "service_start_date_desc", label: "Program Start (newest)" },
  { value: "service_start_date_asc", label: "Program Start (oldest)" },
  { value: "completion_date_desc", label: "Completion Date (newest)" },
  { value: "completion_date_asc", label: "Completion Date (oldest)" },
  { value: "assigned_worker_name_asc", label: "Career Counsellor (A → Z)" },
  { value: "assigned_worker_name_desc", label: "Career Counsellor (Z → A)" },
]
```

### Row 2 (Filter panel — toggled)
```jsx
<div className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
  {/* Each filter is a small Select with h-8 text-xs trigger */}
  {/* Filters: Service Stream, Program Status, Employment Status, CLB Level, Career Counsellor */}
  {/* Age Min, Age Max (number inputs) */}
  {/* Referral Source, Residency Status, 90-Day Status */}
  {/* Min Months in Program, Max Months in Program (number inputs) */}
</div>
```

**FilterSelect pattern:**
```jsx
<div>
  <Label className="text-xs font-medium text-slate-600 mb-1 block">{label}</Label>
  <Select value={value || "__any__"} onValueChange={v => onChange(v === "__any__" ? "" : v)}>
    <SelectTrigger className="h-8 text-xs">
      <SelectValue placeholder="Any" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="__any__">Any</SelectItem>
      {options.map(...)}
    </SelectContent>
  </Select>
</div>
```

### applyFiltersAndSort function (exported from ClientListControls)
```js
export function applyFiltersAndSort(clients, search, filters, sortKey) {
  // 1. Text search: first_name, last_name, compass_hsid, phone, email, assigned_worker_name
  // 2. Exact match filters: service_type, program_status, employment_status, clb_level, followup_90day_status, referral_source, residency_status
  // 3. Partial match: assigned_worker (case-insensitive includes)
  // 4. Range: age_min/age_max (calculated from date_of_birth), duration_min/duration_max (months from service_start_date)
  // 5. Sort: parse field name + direction from sortKey (e.g. "intake_date_desc" → field "intake_date", dir "desc")
}
```

---

## lib/compassTasks.js — Key Functions

### createCompassTask (main utility)
- Checks for existing pending task of same `task_type` + `client_id` — deletes it first (deduplication)
- Creates new `CompassTask` entity record with status "pending"
- Gets current user for `triggered_by` / `triggered_by_name`

### taskNewClient(client) → triggered on new client creation in IntakePage
```
title: "New client intake: [First Last]"
instructions: "A new client has been added to the system.
Action: Create a new client file in Compass.
Client details:
• Name: [First Last]
• DOB: [date_of_birth]
• Residency Status: [residency_status]
• Service Element: [service_type]
• Intake Date: [intake_date]
Enter all demographic and intake information into Compass and record the HSID# back in this app."
```

Other task functions (used elsewhere in the app): `taskStreamSwitch`, `taskServiceTypeChange`, `taskStatusChange`, `taskEmploymentOutcome`, `taskPostCompletionEmployment`, `task90DayFollowup`, `taskFileClosed`, `taskServiceNavigation`, `taskActionPlan`, `taskBarriersIdentified`

---

## COMPLETE IMPORTS

### IntakePage
```js
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import IntakeForm from "@/components/intake/IntakeForm";
import { Button } from "@/components/ui/button";
import { PlusCircle, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import DuplicateWarningDialog from "@/components/intake/DuplicateWarningDialog";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { createCompassTask, taskNewClient } from "@/lib/compassTasks";
```

### IntakeForm
```js
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Upload, X, FileText } from "lucide-react";
import { base44 } from "@/api/base44Client";
```

### DuplicateWarningDialog
```js
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
```

### ClientListControls
```js
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X, ChevronUp, ChevronDown } from "lucide-react";
import { differenceInMonths } from "date-fns";
``