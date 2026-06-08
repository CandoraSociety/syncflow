# MASTER LIST PAGE — Complete Replication Specification

## Files involved
1. `pages/MasterList.jsx` — main page
2. `lib/clientRowColor.js` — row colour-coding utility
3. `components/lists/ClientListControls.jsx` — shared search/filter/sort bar (same as Intake)

---

## PAGE: MasterList (`/master`)

### Purpose
Shows all clients **who have been assigned to a career counsellor** (`assigned_worker` is non-empty). Splits into two tabs: **Active Files** and **Closed Files**. This is the full case management view — Intake only shows unassigned; Master List shows assigned.

### Data Loading
```js
// On mount — loads ALL clients, sorts newest intake first, limit 1000
base44.entities.Client.list("-intake_date", 1000).then(data => {
  setClients(data);
  // Extract unique worker names for filter dropdown
  const names = [...new Set(data.map(c => c.assigned_worker_name).filter(Boolean))].sort();
  setWorkers(names);
  setLoading(false);
});
```

### Filtering logic
```js
const assignedClients = clients.filter(c => c.assigned_worker);         // only assigned
const activeClients   = assignedClients.filter(c => !c.file_closed);    // not closed
const closedClients   = assignedClients.filter(c => c.file_closed);     // closed
const sourceList      = activeTab === "active" ? activeClients : closedClients;
const displayed       = applyFiltersAndSort(sourceList, search, filters, sortKey);
```

### State
```js
const [clients, setClients] = useState([]);
const [search, setSearch] = useState("");
const [filters, setFilters] = useState(EMPTY_FILTERS);
const [sortKey, setSortKey] = useState("intake_date_desc");
const [loading, setLoading] = useState(true);
const [workers, setWorkers] = useState([]);
const [activeTab, setActiveTab] = useState("active");  // "active" | "closed"
```

### EMPTY_FILTERS constant
```js
const EMPTY_FILTERS = {
  service_type: "", program_status: "", employment_status: "",
  clb_level: "", assigned_worker: "", age_min: "", age_max: "",
  duration_min: "", duration_max: "", referral_source: "", residency_status: "",
  followup_90day_status: "",
};
```

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

### CLOSED_REASON_LABELS
```js
const CLOSED_REASON_LABELS = {
  completed: "Completed",
  cancelled: "Cancelled",
  incomplete: "Incomplete",
  withdrew: "Withdrew",
  relocated: "Relocated",
  no_longer_eligible: "No Longer Eligible",
  no_contact: "No Contact",
  duplicate: "Duplicate",
  other: "Other",
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
Note: When a program is complete but 90-day follow-up hasn't happened yet, label reads **"Complete (Follow-Up Period)"** instead of just "Complete".

---

## LOADING STATE

```jsx
<div className="fixed inset-0 flex items-center justify-center">
  <div className="w-8 h-8 border-4 rounded-full animate-spin candora-spin" />
</div>
```

Note: Uses `candora-spin` CSS class (defined in `index.css`):
```css
.candora-spin {
  border-color: hsl(44,100%,88%);
  border-top-color: hsl(231,64%,20%);
}
```
This gives a gold/navy spinner matching the brand.

---

## LAYOUT

```jsx
<div className="min-h-screen bg-background">
  {/* Navy header */}
  <div>...</div>
  
  {/* Tab bar */}
  <div>...</div>
  
  {/* Content area */}
  <div className="px-6 py-4">
    <ClientListControls ... />
    <table>...</table>
  </div>
</div>
```

---

## HEADER (Navy — matches AppNav colour)

```jsx
<div
  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
  style={{ background: "hsl(231,64%,20%)" }}
>
  <div>
    <h1 className="text-xl font-bold text-white">Master Client List</h1>
    <p className="text-sm text-white/60">
      {displayed.length} shown · {activeClients.length} active · {closedClients.length} closed · {clients.filter(c => !c.assigned_worker).length} unassigned in intake
    </p>
  </div>
  <div className="flex items-center gap-2">
    <Button
      size="sm"
      onClick={() => navigate("/reports")}
      variant="outline"
      className="border-white/30 text-white hover:bg-white/10"
    >
      Reports
    </Button>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => base44.auth.logout()}
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</div>
```

**Details:**
- Background: `hsl(231,64%,20%)` (deep navy) via **inline style** — not Tailwind class
- Title: `text-xl font-bold text-white`
- Subtitle: `text-sm text-white/60` — shows 4 stats: shown count, active count, closed count, unassigned count
- Responsive: `flex-col` on mobile, `sm:flex-row` on sm+
- Reports button: `variant="outline"` with `border-white/30 text-white hover:bg-white/10`
- Logout: ghost icon button with `text-white/70 hover:text-white hover:bg-white/10`

---

## TAB BAR (Active Files / Closed Files)

```jsx
<div className="bg-white border-b border-slate-200 px-6 flex gap-1 pt-1">
  
  {/* Active Files tab */}
  <button
    onClick={() => setActiveTab("active")}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === "active"
        ? "text-[hsl(231,64%,20%)] font-semibold"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
    style={activeTab === "active" ? { borderColor: "hsl(42,100%,54%)" } : {}}
  >
    Active Files
    <span
      className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
      style={{ background: "hsl(44,100%,88%)", color: "hsl(231,64%,20%)" }}
    >
      {activeClients.length}
    </span>
  </button>

  {/* Closed Files tab */}
  <button
    onClick={() => setActiveTab("closed")}
    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      activeTab === "closed"
        ? "border-red-500 text-red-700"
        : "border-transparent text-slate-500 hover:text-slate-700"
    }`}
  >
    Closed Files
    <span className="ml-2 bg-red-100 text-red-600 text-xs px-1.5 py-0.5 rounded-full">
      {closedClients.length}
    </span>
  </button>

</div>
```

**Tab styling details:**
- Container: `bg-white border-b border-slate-200 px-6 flex gap-1 pt-1`
- **Active Files tab (selected):**
  - Text: `text-[hsl(231,64%,20%)] font-semibold`
  - Bottom border: `hsl(42,100%,54%)` (sunflower gold) via **inline style**
  - Count badge: background `hsl(44,100%,88%)` (pale gold), text `hsl(231,64%,20%)` (navy) via inline style
- **Active Files tab (unselected):**
  - `border-transparent text-slate-500 hover:text-slate-700`
- **Closed Files tab (selected):**
  - `border-red-500 text-red-700`
  - Count badge: `bg-red-100 text-red-600`
- **Closed Files tab (unselected):**
  - `border-transparent text-slate-500 hover:text-slate-700`
  - Count badge: `bg-red-100 text-red-600` (stays red regardless of active state)

---

## CONTENT AREA

```jsx
<div className="px-6 py-4">
  <ClientListControls
    search={search} onSearch={setSearch}
    filters={filters} onFilters={setFilters}
    sortKey={sortKey} onSort={setSortKey}
    workers={workers}
  />
  
  <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        ...
      </table>
    </div>
  </div>
</div>
```

---

## TABLE HEADER (Navy background, white text)

```jsx
<thead className="border-b border-slate-200" style={{ background: "hsl(231,64%,20%)" }}>
  <tr>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Name</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">HSID#</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Intake Date</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Service Element</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Start</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Switches</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Program Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Completion</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Employment Start Date</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Date</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">90-Day Status</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Svc Nav</th>
    <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Career Counsellor</th>
    {/* Only shown in Closed tab: */}
    {activeTab === "closed" && (
      <>
        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Close Reason</th>
        <th className="text-left px-3 py-3 font-semibold text-white whitespace-nowrap">Closed Date</th>
      </>
    )}
  </tr>
</thead>
```

**Key details:**
- All `th`: `text-left px-3 py-3 font-semibold text-white whitespace-nowrap`
- Background: `hsl(231,64%,20%)` via **inline style**
- Last 2 columns (Close Reason, Closed Date) only render when `activeTab === "closed"`

---

## TABLE ROWS

### Row container
```jsx
<tr
  key={c.id}
  onClick={() => navigate(`/client/${c.id}`)}
  className={`transition-colors cursor-pointer hover:brightness-95 ${clientRowColor(c)}`}
>
```

**Key behaviours:**
- **Entire row is clickable** — navigates to `/client/${c.id}` on click
- `cursor-pointer` to show it's clickable
- `hover:brightness-95` darkens slightly on hover (works on coloured backgrounds)
- Row background comes from `clientRowColor(c)` utility (see below)

### Column cells

| Column | Code |
|---|---|
| Name | `<span className="font-semibold" style={{ color: "hsl(231,64%,28%)" }}>{c.first_name} {c.last_name}</span>` |
| HSID# | `{c.compass_hsid \|\| "—"}` — `text-slate-600 whitespace-nowrap` |
| Intake Date | `format(new Date(c.intake_date), "MMM d, yy")` — short year format |
| Service Element | `SERVICE_LABELS[c.service_type] \|\| "—"` |
| Program Start | `format(new Date(c.service_start_date), "MMM d, yy")` |
| Switches | Special rendering (see below) |
| Program Status | Badge with `programStatusLabel(c)` (see below) |
| Completion | `format(new Date(c.completion_date), "MMM d, yy")` |
| Employment Status | `{c.post_completion_employment_status \|\| "—"}` — `font-mono text-xs` |
| Employment Start Date | `format(new Date(c.post_completion_employment_date), "MMM d, yy")` |
| 90-Day Date | `format(new Date(c.followup_90day_date), "MMM d, yy")` |
| 90-Day Status | `{c.followup_90day_status \|\| "—"}` — `font-mono text-xs` |
| Svc Nav | `{c.service_navigation_supports ? "Yes" : "—"}` |
| Career Counsellor | `{c.assigned_worker_name \|\| "—"}` |
| Close Reason (closed tab only) | Red badge (see below) |
| Closed Date (closed tab only) | `format(new Date(c.closed_date), "MMM d, yy")` |

All cells: `px-3 py-2.5 text-slate-600 whitespace-nowrap`

---

### Switches Column (special rendering)

```jsx
<td className="px-3 py-2.5 whitespace-nowrap">
  {c.program_stream_switches?.length > 0 ? (
    <div className="flex flex-col gap-0.5">
      {c.program_stream_switches.map((sw, i) => (
        <div key={i} className="flex items-center gap-1">
          {/* FROM stream — red badge */}
          <span className="text-xs bg-red-100 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium whitespace-nowrap">
            {SERVICE_LABELS[sw.from_stream] || sw.from_stream || "?"}
          </span>
          <span className="text-slate-400 text-xs">→</span>
          {/* TO stream — purple badge */}
          <span className="text-xs bg-purple-100 text-purple-800 border border-purple-300 px-1.5 py-0.5 rounded font-semibold whitespace-nowrap">
            {SERVICE_LABELS[sw.to_stream] || sw.to_stream || "?"}
          </span>
        </div>
      ))}
    </div>
  ) : "—"}
</td>
```

Each switch shows: `[FROM (red)] → [TO (purple)]`. If multiple switches, stacked vertically with `gap-0.5`.

---

### Program Status Column (special rendering)

```jsx
<td className="px-3 py-2.5 whitespace-nowrap">
  {c.program_status ? (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROGRAM_STATUS_COLORS[c.program_status] || "bg-slate-100 text-slate-600"}`}>
      {programStatusLabel(c)}
    </span>
  ) : (
    // No status yet — orange warning badge
    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
      Assessments / Action Plan Incomplete
    </span>
  )}
</td>
```

When `program_status` is null/empty → shows orange "Assessments / Action Plan Incomplete" badge.

---

### Close Reason Column (closed tab only)

```jsx
<td className="px-3 py-2.5 whitespace-nowrap">
  {c.closed_reason ? (
    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
      {CLOSED_REASON_LABELS[c.closed_reason] || c.closed_reason}
    </span>
  ) : "—"}
</td>
```

---

### Empty State Row

```jsx
{displayed.length === 0 && (
  <tr>
    <td colSpan={16} className="text-center py-10 text-slate-400">
      No clients match your filters.
    </td>
  </tr>
)}
```

Note: `colSpan={16}` — always 16 (covers max column count including closed-tab columns).

---

## lib/clientRowColor.js — Row Colour Coding

```js
export function clientRowColor(client) {
  const ps = client.program_status;
  const cr = client.closed_reason;

  const badEndings = ["cancelled", "incomplete", "withdrew", "relocated", "no_longer_eligible", "no_contact", "duplicate"];

  // RED: bad program status OR closed with bad reason
  if (ps === "incomplete" || ps === "cancelled") return "bg-red-100 hover:bg-red-200";
  if (client.file_closed && badEndings.includes(cr)) return "bg-red-100 hover:bg-red-200";

  // GREEN: program complete AND 90-day follow-up done
  if (ps === "complete" && client.followup_90day_status) return "bg-green-100 hover:bg-green-200";

  // BLUE: program complete, but no 90-day follow-up yet (follow-up period)
  if (ps === "complete") return "bg-blue-100 hover:bg-blue-200";

  // YELLOW: actively in progress
  if (ps === "in_progress") return "bg-yellow-100 hover:bg-yellow-200";

  // No colour: not yet started / no status
  return "";
}
```

**Colour meaning summary:**
| Colour | Condition | Classes |
|---|---|---|
| 🔴 Red | incomplete, cancelled, or closed with bad reason | `bg-red-100 hover:bg-red-200` |
| 🟢 Green | complete + 90-day follow-up recorded | `bg-green-100 hover:bg-green-200` |
| 🔵 Blue | complete, no 90-day yet (follow-up period) | `bg-blue-100 hover:bg-blue-200` |
| 🟡 Yellow | in progress | `bg-yellow-100 hover:bg-yellow-200` |
| ⬜ None | no status set | `""` (white) |

Bad endings list: `["cancelled", "incomplete", "withdrew", "relocated", "no_longer_eligible", "no_contact", "duplicate"]`

---

## KEY DIFFERENCES FROM INTAKE PAGE

| Feature | Intake | Master List |
|---|---|---|
| Shows | Unassigned clients only (`!assigned_worker`) | Assigned clients only (`assigned_worker` exists) |
| Header background | White (`bg-white`) | Navy (`hsl(231,64%,20%)`) |
| Row click | No — uses "Open" button + name link | Yes — entire row navigates to client profile |
| Row colours | None | `clientRowColor(c)` utility |
| Tabs | None | Active Files / Closed Files |
| Table columns | 9 columns | 14 columns (active) or 16 columns (closed, adds Close Reason + Closed Date) |
| Table header colour | White (`bg-slate-50`) | Navy (`hsl(231,64%,20%)`) with white text |
| Loading spinner | `border-t-slate-800` dark spinner | `candora-spin` branded spinner |
| Switches column | Simple count badge | Full from→to chain per switch |
| Program status | Basic label | Extended label (incl. "Follow-Up Period") + orange fallback |

---

## COMPLETE IMPORTS

```js
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { format } from "date-fns";
import ClientListControls, { applyFiltersAndSort } from "@/components/lists/ClientListControls";
import { clientRowColor } from "@/lib/clientRowColor";
```

Note: `Link` is imported but not used in the rendered JSX — rows use `onClick={() => navigate()}` instead.

---

## FULL COLUMN REFERENCE

### Active Tab (14 columns)
1. Name
2. HSID#
3. Intake Date
4. Service Element
5. Program Start
6. Switches
7. Program Status
8. Completion
9. Employment Status
10. Employment Start Date
11. 90-Day Date
12. 90-Day Status
13. Svc Nav
14. Career Counsellor

### Closed Tab (16 columns — adds 2)
Same 14 as above, plus:
15. Close Reason
16. Closed Date