# WORKER DASHBOARD PAGE — Complete Replication Specification

## Files involved
1. `pages/WorkerDashboard.jsx` — main page (`/dashboard`)
2. `components/compass/CompassTaskList.jsx` — Compass queue tab content
3. `components/worker/ClientDetailModal.jsx` — legacy modal (imported but not used in current page render — kept for reference)
4. `components/lists/ClientListControls.jsx` — shared search/filter/sort bar
5. `lib/clientRowColor.js` — shared row colour utility

---

## PAGE: WorkerDashboard (`/dashboard`)

### Purpose
A personal dashboard for each career counsellor showing **only their own clients** (`assigned_worker === me.email`). Has two tabs: **My Clients** (colour-coded table) and **Compass Queue** (pending Compass data-entry tasks). Includes alert panels for DEA program period endings and upcoming 90-day follow-ups.

### SPECIAL CASE — Dawn (Service Navigator)
User with email `"Dawn.williston@candorasociety.com"` has a different view:
- **Title**: "Service Navigator Dashboard" (instead of "My Clients")
- **Client filter**: Shows clients where `barriers_addressed === true` OR `assigned_worker === me.email` (instead of just `assigned_worker === me.email`)
- **Extra table columns**: Barrier 1, Barrier 2, Barrier 3 (with status colour)
- **Empty state message**: "Clients with identified barriers will appear here." (instead of "Clients assigned to you will appear here.")
- **colSpan**: 15 (instead of 12) in empty state row

---

## DATA LOADING

```js
useEffect(() => {
  const init = async () => {
    const me = await base44.auth.me();
    setUser(me);
    const allClients = await base44.entities.Client.list("-created_date", 1000);
    
    const isDawn = me.email === "Dawn.williston@candorasociety.com";
    const myClients = isDawn
      ? allClients.filter(c => c.barriers_addressed || c.assigned_worker === me.email)
      : allClients.filter(c => c.assigned_worker === me.email);
    
    setClients(myClients);
    await loadCompassTasks(me.email);
    setLoading(false);
  };
  init();
}, []);
```

### loadCompassTasks
```js
const loadCompassTasks = async (workerEmail) => {
  const allTasks = await base44.entities.CompassTask.list("-created_date", 500);
  setCompassTasks(allTasks.filter(t => t.assigned_worker === workerEmail));
};
```
Note: Loads all 500 tasks then filters client-side by `assigned_worker === workerEmail`.

---

## STATE

```js
const [user, setUser] = useState(null);
const [clients, setClients] = useState([]);
const [compassTasks, setCompassTasks] = useState([]);
const [loading, setLoading] = useState(true);
const [search, setSearch] = useState("");
const [filters, setFilters] = useState(EMPTY_FILTERS);
const [sortKey, setSortKey] = useState("intake_date_desc");
const [activeTab, setActiveTab] = useState("clients");   // "clients" | "compass"
```

### EMPTY_FILTERS
```js
const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "",
};
```
Note: No `referral_source`, `residency_status`, or `followup_90day_status` in dashboard filters (unlike MasterList).

---

## CONSTANTS

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

### PROGRAM_STATUS_COLORS
```js
const PROGRAM_STATUS_COLORS = {
  in_progress: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  incomplete: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};
```

### BARRIER_STATUS_COLORS (Dawn only)
```js
const BARRIER_STATUS_COLORS = {
  unresolved: "text-red-600",
  in_progress: "text-amber-600",
  resolved: "text-green-600",
};
```

### programStatusLabel function
```js
function programStatusLabel(c) {
  if (c.program_status === "complete" && !c.followup_90day_status) return "Complete (Follow-Up Period)";
  if (c.program_status === "in_progress") return "In Progress";
  if (c.program_status === "complete") return "Complete";
  if (c.program_status === "incomplete") return "Incomplete";
  if (c.program_status === "cancelled") return "Cancelled";
  return c.program_status?.replace("_", " ") || null;
}
```

---

## DERIVED VALUES (computed from state, no extra useState)

```js
const isDawn = user?.email === "Dawn.williston@candorasociety.com";
const displayed = applyFiltersAndSort(clients, search, filters, sortKey);
const pendingCompassCount = compassTasks.filter(t => t.status === "pending").length;
```

---

## ALERT PANEL 1 — DEA Closing

### Logic
```js
const deaClosingClients = clients.filter(c => {
  if (c.service_type !== "direct_to_employment") return false;
  if (c.file_closed) return false;
  const endDate = c.completion_date
    ? new Date(c.completion_date)
    : c.service_start_date
    ? addDays(new Date(c.service_start_date), 14)
    : null;
  if (!endDate) return false;
  const days = differenceInDays(endDate, new Date());
  return days <= 3;   // within 3 days (includes overdue)
});
```

End date resolution:
- If `completion_date` is set → use it
- Else if `service_start_date` → use `service_start_date + 14 days`
- Else → exclude (no end date)

Trigger threshold: `days <= 3` (shows if ending within 3 days OR already overdue)

### Render
```jsx
{deaClosingClients.length > 0 && (
  <div className="mb-4 border border-blue-300 bg-blue-50 rounded-xl p-4">
    {/* Header row */}
    <div className="flex items-center gap-2 mb-3">
      <Bell className="w-4 h-4 text-blue-600 animate-bounce" />
      <span className="text-sm font-bold text-blue-800">DEA Program Period Closing Soon</span>
      <span className="ml-auto text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
        {deaClosingClients.length}
      </span>
    </div>

    {/* One row per client */}
    <div className="space-y-2">
      {deaClosingClients.map(c => {
        const endDate = c.completion_date
          ? new Date(c.completion_date)
          : addDays(new Date(c.service_start_date), 14);
        const days = differenceInDays(endDate, new Date());
        const isOverdue = days < 0;
        return (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
              isOverdue ? "bg-red-50 border-red-300" : "bg-white border-blue-200"
            }`}
          >
            {/* Left side */}
            <div className="flex items-center gap-2">
              <CalendarClock className="w-3.5 h-3.5 shrink-0 text-blue-500" />
              <Link
                to={`/client/${c.id}`}
                className="font-semibold hover:underline"
                style={{ color: "hsl(231,64%,28%)" }}
              >
                {c.first_name} {c.last_name}
              </Link>
              <span className="text-xs text-slate-500">
                — DEA period ends {format(endDate, "MMM d, yyyy")}
              </span>
            </div>
            {/* Right side */}
            <div className="flex items-center gap-2 text-xs">
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                isOverdue ? "bg-red-100 text-red-700"
                : days <= 1 ? "bg-amber-200 text-amber-800"
                : "bg-blue-100 text-blue-700"
              }`}>
                {isOverdue ? `${Math.abs(days)}d past end` : days === 0 ? "Ends today!" : `${days}d left`}
              </span>
              <Link to={`/client/${c.id}`}>
                <Button size="sm" variant="outline" className="text-xs h-6 px-2">Open File</Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

**Days badge colour:**
- Overdue (`days < 0`): `bg-red-100 text-red-700`
- 0–1 days: `bg-amber-200 text-amber-800`
- 2–3 days: `bg-blue-100 text-blue-700`

---

## ALERT PANEL 2 — Upcoming 90-Day Follow-Ups

### Logic
```js
const upcomingFollowups = clients.filter(c => {
  if (c.followup_90day_status) return false;   // already done — exclude
  const followupDate = c.followup_90day_date
    ? new Date(c.followup_90day_date)
    : c.completion_date
      ? addDays(new Date(c.completion_date), 90)
      : null;
  if (!followupDate) return false;
  const days = differenceInDays(followupDate, new Date());
  return days <= 14;   // within 14 days (includes overdue)
}).sort((a, b) => {
  const dateA = a.followup_90day_date || (a.completion_date ? format(addDays(new Date(a.completion_date), 90), "yyyy-MM-dd") : "");
  const dateB = b.followup_90day_date || (b.completion_date ? format(addDays(new Date(b.completion_date), 90), "yyyy-MM-dd") : "");
  return dateA.localeCompare(dateB);
});
```

Follow-up date resolution:
- If `followup_90day_date` is set → use it
- Else if `completion_date` → use `completion_date + 90 days`
- Else → exclude

Trigger threshold: `days <= 14` (shows if due within 14 days OR already overdue)

Sorted by follow-up date ascending (soonest first).

### Render
```jsx
{upcomingFollowups.length > 0 && (
  <div className="mb-4 border border-amber-300 bg-amber-50 rounded-xl p-4">
    {/* Header row */}
    <div className="flex items-center gap-2 mb-3">
      <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
      <span className="text-sm font-bold text-amber-800">Upcoming 90-Day Follow-Ups</span>
      <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
        {upcomingFollowups.length}
      </span>
    </div>

    {/* One row per client */}
    <div className="space-y-2">
      {upcomingFollowups.map(c => {
        const followupDate = c.followup_90day_date
          ? new Date(c.followup_90day_date)
          : addDays(new Date(c.completion_date), 90);
        const days = differenceInDays(followupDate, new Date());
        const isOverdue = days < 0;
        const isUrgent = days >= 0 && days <= 5;
        return (
          <div
            key={c.id}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm ${
              isOverdue ? "bg-red-50 border-red-300"
              : isUrgent ? "bg-amber-100 border-amber-300 animate-pulse"
              : "bg-white border-amber-200"
            }`}
          >
            {/* Left side */}
            <div className="flex items-center gap-2">
              <Bell className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
              <Link
                to={`/client/${c.id}`}
                className="font-semibold hover:underline"
                style={{ color: "hsl(231,64%,28%)" }}
              >
                {c.first_name} {c.last_name}
              </Link>
            </div>
            {/* Right side */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Due: {format(followupDate, "MMM d, yyyy")}</span>
              <span className={`font-bold px-2 py-0.5 rounded-full ${
                isOverdue ? "bg-red-100 text-red-700"
                : isUrgent ? "bg-amber-200 text-amber-800"
                : "bg-blue-100 text-blue-700"
              }`}>
                {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? "Today!" : `${days}d`}
              </span>
              <Link to={`/client/${c.id}`}>
                <Button size="sm" variant="outline" className="text-xs h-6 px-2">Go to Client</Button>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  </div>
)}
```

**Row classes:**
- Overdue (`days < 0`): `bg-red-50 border-red-300`
- Urgent (`0 <= days <= 5`): `bg-amber-100 border-amber-300 animate-pulse`
- Normal (`days > 5`): `bg-white border-amber-200`

**Days badge colour:**
- Overdue: `bg-red-100 text-red-700`
- Urgent (0–5 days): `bg-amber-200 text-amber-800`
- Normal (6–14 days): `bg-blue-100 text-blue-700`

**Days badge text:**
- Overdue: `"Xd overdue"`
- Today: `"Today!"`
- Future: `"Xd"`

---

## ALERT PANEL 3 — Approaching Roadmap Items (computed but NOT rendered in current page)

The dashboard computes `approachingItems` but this panel is NOT currently rendered in the page JSX. The logic exists in the file but the output is unused. Do not render it unless explicitly requested.

```js
// Computed but unused in render:
const approachingItems = clients.flatMap(c => {
  // checks roadmap_item_status + sdp_item_details for timeline_end within 7 days
  // also checks barrier_N_timeline_end within 7 days
  // returns array of { clientId, clientName, itemKey, label, endDate, days }
}).sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
```

---

## LAYOUT

```jsx
<div className="min-h-screen bg-background">
  <header>...</header>
  <main className="max-w-7xl mx-auto px-4 py-6">
    {/* Tab switcher */}
    ...
    {/* Compass tab content */}
    {activeTab === "compass" && <CompassTaskList ... />}
    {/* Clients tab content */}
    {activeTab === "clients" && clients.length === 0 ? <EmptyState /> : <ClientsContent />}
  </main>
</div>
```

---

## HEADER

```jsx
<header
  className="px-4 py-3 flex items-center justify-between"
  style={{ background: "hsl(231,64%,20%)" }}
>
  <div>
    <h1 className="text-xl font-bold text-white">
      {isDawn ? "Service Navigator Dashboard" : "My Clients"}
    </h1>
    <p className="text-sm text-white/60">Welcome, {user?.full_name}</p>
  </div>
  <Button
    variant="ghost"
    size="icon"
    onClick={() => base44.auth.logout()}
    className="text-white/70 hover:text-white hover:bg-white/10"
  >
    <LogOut className="w-4 h-4" />
  </Button>
</header>
```

Note: No navigation buttons (no Reports, no Master List links). Just title + logout.

---

## TAB SWITCHER

```jsx
<div className="flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
  
  {/* My Clients tab */}
  <button
    onClick={() => setActiveTab("clients")}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      activeTab === "clients" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
    }`}
  >
    <Users className="w-3.5 h-3.5" /> My Clients
  </button>

  {/* Compass Queue tab */}
  <button
    onClick={() => setActiveTab("compass")}
    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      activeTab === "compass" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
    }`}
  >
    <Database className="w-3.5 h-3.5" /> Compass Queue
    {/* Amber badge if pending tasks > 0 */}
    {pendingCompassCount > 0 && (
      <span className="bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
        {pendingCompassCount}
      </span>
    )}
  </button>

</div>
```

**Tab styling:**
- Container: `flex gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit`
- Active: `bg-white shadow text-slate-800`
- Inactive: `text-slate-500 hover:text-slate-700`
- Compass Queue badge: `bg-amber-500 text-white text-xs font-bold rounded-full w-5 h-5`

---

## EMPTY STATE (clients tab, no clients)

```jsx
<div className="text-center py-20 text-slate-400">
  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
  <p className="text-lg font-medium">No clients yet</p>
  <p className="text-sm mt-1">
    {isDawn
      ? "Clients with identified barriers will appear here."
      : "Clients assigned to you will appear here."}
  </p>
</div>
```

---

## CLIENTS TAB — Content Structure

When clients exist (`clients.length > 0`) and `activeTab === "clients"`:

```
1. DEA closing alert panel (if any DEA clients closing ≤3 days)
2. Upcoming 90-day follow-up alert panel (if any follow-ups ≤14 days)
3. Client count row
4. ClientListControls (search/filter/sort)
5. Client table
```

### Client Count Row
```jsx
<div className="flex items-center gap-2 text-slate-600 mb-2">
  <Users className="w-4 h-4" />
  <span className="text-sm font-medium">
    {displayed.length} of {clients.length} client{clients.length !== 1 ? "s" : ""}
  </span>
</div>
```

### ClientListControls
```jsx
<ClientListControls
  search={search} onSearch={setSearch}
  filters={filters} onFilters={setFilters}
  sortKey={sortKey} onSort={setSortKey}
  // NOTE: No `workers` prop — dashboard doesn't need worker filter dropdown
/>
```

---

## TABLE

### Table container
```jsx
<div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
```

### Table Header (Navy)
```jsx
<thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
  <tr>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">CLB</th>
    {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 1</th>}
    {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 2</th>}
    {isDawn && <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Barrier 3</th>}
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Start Date</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
  </tr>
</thead>
```

**Column counts:**
- Normal workers: 12 columns
- Dawn: 15 columns (adds Barrier 1, 2, 3)

### Table Rows

```jsx
<tr
  key={c.id}
  onClick={() => navigate(`/client/${c.id}`)}
  className={`transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
>
```

| Column | Cell Content | Extra Classes |
|---|---|---|
| Name | `<span className="font-semibold" style={{ color: "hsl(231,64%,28%)" }}>{c.first_name} {c.last_name}</span>` | `px-3 py-2.5 font-medium whitespace-nowrap` |
| HSID# | `{c.compass_hsid \|\| "—"}` | `px-3 py-2.5 text-slate-600 whitespace-nowrap` |
| Service | `SERVICE_LABELS[c.service_type] \|\| "—"` | `px-3 py-2.5 text-slate-600 whitespace-nowrap` |
| Switches | Amber count badge or `"—"` (see below) | `px-3 py-2.5 whitespace-nowrap` |
| Program Status | Status badge with `programStatusLabel(c)` | `px-3 py-2.5 whitespace-nowrap` |
| CLB | `c.clb_level?.replace("clb_", "CLB ").replace("native_english_french", "Native") \|\| "—"` | `px-3 py-2.5 text-slate-600 whitespace-nowrap` |
| Barrier 1–3 (Dawn) | Barrier name + status (see below) | `px-3 py-2.5 whitespace-nowrap` |
| Employment Status | `{c.post_completion_employment_status \|\| "—"}` | `px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs` |
| Employment Start Date | `format(new Date(c.post_completion_employment_date), "MMM d, yy")` | `px-3 py-2.5 text-slate-600 whitespace-nowrap` |
| 90-Day Status | `{c.followup_90day_status \|\| "—"}` | `px-3 py-2.5 text-slate-600 whitespace-nowrap font-mono text-xs` |
| Svc Nav | `{c.service_navigation_supports ? "Yes" : "—"}` | `px-3 py-2.5 text-slate-600 whitespace-nowrap` |
| Intake Date | `format(new Date(c.intake_date), "MMM d, yy")` | `px-3 py-2.5 text-slate-500 whitespace-nowrap` |

### Switches Column
```jsx
{c.program_stream_switches?.length > 0 ? (
  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
    {c.program_stream_switches.length}×
  </span>
) : "—"}
```
Note: Dashboard uses simple count badge (e.g. "2×"), NOT the from→to chain used in MasterList.

### CLB Column
```js
c.clb_level?.replace("clb_", "CLB ").replace("native_english_french", "Native") || "—"
```
Example: `"clb_5"` → `"CLB 5"`, `"native_english_french"` → `"Native"`

### Barrier Columns (Dawn only — rendered for barriers 1, 2, 3)
```jsx
{c.barrier_1 ? (
  <span>
    <span className="text-slate-700">{c.barrier_1}</span>
    {c.barrier_1_status && (
      <span className={`ml-1 text-xs ${BARRIER_STATUS_COLORS[c.barrier_1_status] || ""}`}>
        ({c.barrier_1_status})
      </span>
    )}
  </span>
) : "—"}
```
Same pattern for `barrier_2` and `barrier_3`.

### Empty State Row
```jsx
{displayed.length === 0 && (
  <tr>
    <td colSpan={isDawn ? 15 : 12} className="text-center py-10 text-slate-400">
      No clients match your filters.
    </td>
  </tr>
)}
```

---

## COMPONENT: CompassTaskList

### Props
```js
{
  tasks: CompassTask[],       // pre-filtered to this worker's tasks
  currentUser: User,          // for marking complete
  onRefresh: () => void,      // called after status changes → reloads tasks in parent
}
```

### Internal State
```js
const [tasks, setTasks] = useState(initialTasks);
const [tab, setTab] = useState("pending");      // "pending" | "completed"
const [expanded, setExpanded] = useState({});   // { [taskId]: boolean }
const [completing, setCompleting] = useState({}); // { [taskId]: boolean } — loading state
const [notes, setNotes] = useState({});         // { [taskId]: string } — completion notes
```

### Sync with parent
```js
// If parent re-fetches and passes new tasks (different IDs or statuses), sync local state
if (initialTasks !== tasks && JSON.stringify(initialTasks.map(t => t.id + t.status)) !== JSON.stringify(tasks.map(t => t.id + t.status))) {
  setTasks(initialTasks);
}
```

### Derived
```js
const pending   = tasks.filter(t => t.status === "pending");
const completed = tasks.filter(t => t.status === "completed");
const shown     = tab === "pending" ? pending : completed;

// Grouping: action plan & barriers tasks shown in orange group section
const apGroupTasks = shown.filter(t => ["barriers_identified", "action_plan"].includes(t.task_type));
const otherTasks   = shown.filter(t => !["barriers_identified", "action_plan"].includes(t.task_type));
```

### Tab Bar
```jsx
<div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1 w-fit">
  <button
    onClick={() => setTab("pending")}
    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      tab === "pending" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
    }`}
  >
    Pending ({pending.length})
  </button>
  <button
    onClick={() => setTab("completed")}
    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
      tab === "completed" ? "bg-white shadow text-slate-800" : "text-slate-500 hover:text-slate-700"
    }`}
  >
    Completed ({completed.length})
  </button>
</div>
```

### Empty State
```jsx
<div className="text-center py-10">
  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
  <p className="text-slate-500 text-sm font-medium">
    {tab === "pending"
      ? "No pending Compass tasks — all caught up!"
      : "No completed tasks yet."}
  </p>
</div>
```

### Task List Layout
```jsx
<div className="space-y-3">
  {/* Orange grouped section for AP & Barriers tasks (if any) */}
  {apGroupTasks.length > 0 && (
    <div className="border border-orange-200 rounded-xl bg-orange-50/40 p-3 space-y-2">
      <p className="text-xs font-semibold text-orange-700 uppercase tracking-wide px-1">
        Action Plan &amp; Barriers
      </p>
      {apGroupTasks.map(task => <TaskCard key={task.id} task={task} ... />)}
    </div>
  )}
  {/* All other tasks — ungrouped */}
  {otherTasks.map(task => <TaskCard key={task.id} task={task} ... />)}
</div>
```

---

## COMPONENT: TaskCard (internal to CompassTaskList)

### Props
```js
{
  task,
  expanded: boolean,
  onToggle: (id) => void,
  completing: boolean,
  notes: string,
  onNotesChange: (id, val) => void,
  onMarkComplete: (task) => void,
  onMarkUncomplete: (task) => void,
}
```

### TASK_TYPE_COLORS
```js
const TASK_TYPE_COLORS = {
  new_client:                  "bg-blue-100 text-blue-700",
  service_type_change:         "bg-purple-100 text-purple-700",
  stream_switch:               "bg-purple-100 text-purple-700",
  program_status_change:       "bg-amber-100 text-amber-700",
  employment_outcome:          "bg-green-100 text-green-700",
  post_completion_employment:  "bg-teal-100 text-teal-700",
  followup_90day:              "bg-cyan-100 text-cyan-700",
  file_closed:                 "bg-red-100 text-red-700",
  service_navigation:          "bg-indigo-100 text-indigo-700",
  barriers_identified:         "bg-orange-100 text-orange-700",
  action_plan:                 "bg-orange-100 text-orange-700",
};
```

### TASK_TYPE_LABELS
```js
const TASK_TYPE_LABELS = {
  new_client:                 "New Client",
  service_type_change:        "Service Change",
  stream_switch:              "Stream Switch",
  program_status_change:      "Status Change",
  employment_outcome:         "Employment",
  post_completion_employment: "Post-Completion",
  followup_90day:             "90-Day Follow-Up",
  file_closed:                "File Closed",
  service_navigation:         "Service Navigation",
  barriers_identified:        "Barriers",
  action_plan:                "Action Plan",
};
```

### Card Structure
```jsx
<Card className={`border ${
  task.status === "completed" ? "border-slate-200 opacity-70"
  : isAPGroup ? "border-orange-300 shadow-sm"
  : "border-slate-300 shadow-sm"
}`}>

  <CardHeader className="pb-3">
    <div className="flex items-start justify-between gap-3">
      {/* Left: tags + title + triggered-by */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          {/* Type badge */}
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TASK_TYPE_COLORS[task.task_type] || "bg-slate-100 text-slate-600"}`}>
            {TASK_TYPE_LABELS[task.task_type] || task.task_type}
          </span>
          {/* HSID# (if set) */}
          {task.compass_hsid && (
            <span className="text-xs text-slate-400">HSID: {task.compass_hsid}</span>
          )}
          {/* Created date */}
          <span className="text-xs text-slate-400">
            {task.created_date ? format(new Date(task.created_date), "MMM d, yyyy h:mm a") : ""}
          </span>
        </div>
        <CardTitle className="text-base font-semibold text-slate-800">{task.title}</CardTitle>
        {task.triggered_by_name && (
          <p className="text-xs text-slate-400 mt-0.5">Triggered by {task.triggered_by_name}</p>
        )}
      </div>
      {/* Right: View Client + expand toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost" size="sm"
          onClick={() => navigate(`/client/${task.client_id}`)}
          className="text-slate-500 gap-1 text-xs"
        >
          <ExternalLink className="w-3.5 h-3.5" /> View Client
        </Button>
        <Button
          variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => onToggle(task.id)}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  </CardHeader>

  {/* Expanded content */}
  {expanded && (
    <CardContent className="pt-0 space-y-4">
      {/* Instructions box */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Instructions</p>
        <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
          {task.instructions}
        </pre>
      </div>

      {/* PENDING: show completion notes textarea + mark complete button */}
      {task.status === "pending" && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Completion Notes (optional)
          </p>
          <Textarea
            rows={2}
            placeholder="Add notes about what was entered in Compass..."
            value={notes || ""}
            onChange={e => onNotesChange(task.id, e.target.value)}
            className="text-sm"
          />
          <Button
            onClick={() => onMarkComplete(task)}
            disabled={completing}
            className="gap-2 bg-green-700 hover:bg-green-800 text-white"
          >
            <CheckCircle2 className="w-4 h-4" />
            {completing ? "Marking complete…" : "Mark as Entered in Compass"}
          </Button>
        </div>
      )}

      {/* COMPLETED: show who completed it + undo button */}
      {task.status === "completed" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">
              Entered by {task.completed_by_name || task.completed_by} on{" "}
              {task.completed_date ? format(new Date(task.completed_date), "MMM d, yyyy") : ""}
            </span>
          </div>
          {task.completed_notes && (
            <p className="text-sm text-slate-600 italic">"{task.completed_notes}"</p>
          )}
          <Button
            variant="outline" size="sm"
            onClick={() => onMarkUncomplete(task)}
            className="gap-2 text-slate-500"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Mark as Pending Again
          </Button>
        </div>
      )}
    </CardContent>
  )}
</Card>
```

### markComplete logic
```js
const markComplete = async (task) => {
  setCompleting(prev => ({ ...prev, [task.id]: true }));
  await base44.entities.CompassTask.update(task.id, {
    status: "completed",
    completed_by: currentUser?.email || "",
    completed_by_name: currentUser?.full_name || currentUser?.email || "",
    completed_date: new Date().toISOString().split("T")[0],   // YYYY-MM-DD
    completed_notes: notes[task.id] || "",
  });
  await reload();
  setCompleting(prev => ({ ...prev, [task.id]: false }));
};
```

### markUncomplete logic
```js
const markUncomplete = async (task) => {
  await base44.entities.CompassTask.update(task.id, {
    status: "pending",
    completed_by: "",
    completed_by_name: "",
    completed_date: "",
    completed_notes: "",
  });
  await reload();
};
```

---

## COMPONENT: ClientDetailModal (legacy — not rendered on WorkerDashboard)

This component exists but is NOT used in the current WorkerDashboard. It's a Dialog modal for viewing and editing a single client's status and intake notes. Kept for reference only.

```
Props: { client, onClose, onUpdate }
Sections: Demographics (DOB, phone, email, address), Case Info (referral, service type, intake date)
Editable: Status (Select), Case Notes (Textarea)
Save: calls onUpdate(client.id, { status, intake_notes: notes })
```

---

## COMPLETE IMPORTS

### WorkerDashboard
```js
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Bell, Database, CalendarClock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { format, addDays, differenceInDays, isWithinInterval } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
import CompassTaskList from "@/components/compass/CompassTaskList";
```

Note: `isWithinInterval` is imported but only used in the unused `approachingItems` computation.

### CompassTaskList
```js
import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ExternalLink, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
```

---

## KEY DIFFERENCES FROM MASTER LIST

| Feature | Master List | Worker Dashboard |
|---|---|---|
| Client scope | All assigned clients | Only current user's clients (or Dawn's special filter) |
| Tabs | Active / Closed files | My Clients / Compass Queue |
| Alert panels | None | DEA closing (≤3 days) + 90-day follow-ups (≤14 days) |
| Row click | Navigate to profile | Navigate to profile (same) |
| Switches column | Full from→to chain per switch | Simple count badge "2×" |
| Compass column | None | Compass tab via `CompassTaskList` |
| Dawn special case | No | Yes — different title, filter, extra barrier columns |
| Workers filter | Yes (dropdown from all workers) | No (not passed) |
| Columns | 14–16 | 12–15 (depending on isDawn) |