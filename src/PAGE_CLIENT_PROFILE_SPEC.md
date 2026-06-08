# CLIENT PROFILE PAGE & TABS — Complete Replication Specification

## Files involved
1.  `pages/ClientProfile.jsx` — main page container (`/client/:id`)
2.  `components/client/ClientProfileOverview.jsx` — "Client Overview" tab
3.  `components/wizard/ProgramFlowWizard.jsx` — "Program Flow" tab (container for steps)
4.  `components/client/ClientRoadmap.jsx` — old roadmap view (imported but not used)
5.  `components/client/ClientFinancials.jsx` — "Financials" tab
6.  `components/client/ClientEmployment.jsx` — "Employment" tab
7.  `components/client/ClientPlacements.jsx` — "Placements" tab
8.  `components/client/ClientReferrals.jsx` — "Referrals" tab
9.  `components/client/ClientStreamSwitches.jsx` — "Stream Switches" tab
10. `components/client/ClientStatusHistory.jsx` — "Status History" tab
11. `components/client/CloseFileDialog.jsx` — modal for closing a client file
12. `components/client/StatusChangeDialog.jsx` — modal for logging a status change
13. `components/wizard/DEAClosingDialog.jsx` — modal shown when DEA program is ending

---

## PAGE: ClientProfile (`/client/:id`)

### Purpose
This is the central hub for managing an individual client. It features a prominent header with the client's name and status, and a multi-tab interface to access different aspects of their file.

### Data Loading
```js
useEffect(() => {
  base44.entities.Client.list().then(clients => {
    const found = clients.find(c => c.id === id);
    setClient(found || null);
    setLoading(false);
    
    // Check if DEA closing dialog should show
    if (found?.service_type === "direct_to_employment" && !found?.file_closed && !found?.dea_closing_dismissed) {
      const endDate = found.completion_date
        ? new Date(found.completion_date)
        : found.service_start_date
          ? addDays(new Date(found.service_start_date), 14)
          : null;
      if (endDate) {
        const days = differenceInDays(endDate, new Date());
        if (days <= 3) setShowDEAClosing(true);
      }
    }
  });
}, [id]);
```

Note: Loads ALL clients and then filters client-side. This is inefficient but is what the original code does.

### State
```js
const [client, setClient] = useState(null);
const [loading, setLoading] = useState(true);
const [showCloseDialog, setShowCloseDialog] = useState(false);
const [closingSaving, setClosingSaving] = useState(false);
const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
const [statusHistoryKey, setStatusHistoryKey] = useState(0); // To force re-render
const [showDEAClosing, setShowDEAClosing] = useState(false);
```

### Top Navigation Bar (Navy)
```jsx
<div className="sticky top-0 z-40 px-6 py-2 flex items-center gap-3" style={{ background: "hsl(231,64%,20%)" }}>
  <img src="...Candoracirclelogo...png" alt="Candora logo" className="h-7 w-7 ..." />
  <button onClick={() => navigate("/master")} ...> <ArrowLeft /> Master List </button>
  <span className="text-white/30">·</span>
  <button onClick={() => navigate("/dashboard")} ...>My Dashboard</button>
  <span className="text-white/30">·</span>
  <button onClick={() => navigate("/intake")} ...>Intake</button>
  <span className="text-white/30">·</span>
  <button onClick={() => navigate("/compass")} ...>Compass</button>
</div>
```

- **Sticky**: `sticky top-0 z-40`
- **Background**: `hsl(231,64%,20%)` via inline style
- **Links**: `text-sm text-white/70 hover:text-white`

### Main Header (Gold)
```jsx
<div className="border-b px-6 py-4 flex items-center justify-between gap-4" 
     style={{ background: "hsl(44,100%,88%)", borderColor: "hsl(42,100%,70%)" }}>
  <div className="flex items-center gap-4">
    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} style={{ color: "hsl(231,64%,20%)" }}>
      <ArrowLeft className="w-4 h-4" />
    </Button>
    <div>
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-xl font-bold" style={{ color: "hsl(231,64%,20%)" }}>
          {client.first_name} {client.last_name}
        </h1>
        {/* Stream Badge */}
        {client.service_type && (
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${STREAM_BADGE_COLORS[client.service_type] || "..."}`}>
            {STREAM_LABELS[client.service_type] || client.service_type.replace(/_/g, " ")}
          </span>
        )}
        {/* Closed Badge */}
        {client.file_closed && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold border border-red-200">Closed</span>
        )}
      </div>
      <p className="text-sm" style={{ color: "hsl(231,55%,40%)" }}>
        {client.compass_hsid ? `HSID: ${client.compass_hsid}` : ""}
        {client.file_closed && client.closed_reason ? `${client.compass_hsid ? " · " : ""}Closed: ${client.closed_reason.replace(/_/g, " ")}` : ""}
      </p>
    </div>
  </div>
  <div>
    <Button variant="outline" size="sm" onClick={() => setShowStatusChangeDialog(true)} ...> <History/> Log Status Change </Button>
    {client.file_closed ? (
      <Button variant="outline" size="sm" onClick={handleReopenFile} ...> <RotateCcw/> Reopen File </Button>
    ) : (
      <Button variant="outline" size="sm" onClick={() => setShowCloseDialog(true)} ...> <XCircle/> Close File </Button>
    )}
  </div>
</div>
```

**Header styling:**
- **Background**: `hsl(44,100%,88%)` (pale gold)
- **Border**: `hsl(42,100%,70%)` (deeper gold)
- **Title color**: `hsl(231,64%,20%)` (navy)

### Tab Navigation
```jsx
<Tabs defaultValue="program_flow">
  <TabsList className="mb-6 flex flex-wrap gap-1 h-auto">
    <TabsTrigger value="program_flow">Program Flow</TabsTrigger>
    <TabsTrigger value="overview">Client Overview</TabsTrigger>
    <TabsTrigger value="referrals">Referrals</TabsTrigger>
    <TabsTrigger value="employment">Employment</TabsTrigger>
    <TabsTrigger value="financials">Financials</TabsTrigger>
    <TabsTrigger value="training">Placements</TabsTrigger>
    <TabsTrigger value="status_history">Status History</TabsTrigger>
    <TabsTrigger value="stream_switches" className="relative">
      Stream Switches
      {client.program_stream_switches?.length > 0 && (
        <span className="ml-1.5 bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 leading-none">
          {client.program_stream_switches.length}
        </span>
      )}
    </TabsTrigger>
  </TabsList>
  {/* TabsContent for each tab */}
</Tabs>
```
Default tab is `"program_flow"`.

### Event Handlers

- **handleSave**: Updates client, sets local state.
- **handleCloseFile**: Updates client with close data, creates `file_closed` Compass task, closes dialog.
- **handleReopenFile**: Updates client `file_closed: false, status: "active"`.
- **handleDEAContinue**: Dismisses DEA closing dialog (`dea_closing_dismissed: true`).
- **handleDEASwitchToPathways**: Switches stream to Pathways, adds a switch record, dismisses DEA dialog.

---

## MODALS

### CloseFileDialog
- **Triggered by**: "Close File" button.
- **Fields**: Reason (Select), Closing Date (Date), Notes (Textarea).
- **On Confirm**: Calls `onConfirm` prop with `{ closed_reason, closed_date, closed_notes, file_closed: true, status: "closed" }`.

### StatusChangeDialog
- **Triggered by**: "Log Status Change" button.
- **Fields**: Type of Change (Select), Date (Date), From (Select/Input), To (Select/Input), Notes (Textarea).
- **On Save**: Creates a new `StatusChange` entity record.

### DEAClosingDialog
- **Triggered by**: `useEffect` logic on page load for DEA clients near their 14-day end date.
- **Provides options**: Continue in DEA, Switch to Pathways, or Dismiss.
- **On Action**: Calls parent handlers (`handleDEAContinue`, `handleDEASwitchToPathways`).

---

## TAB: Program Flow

### Component: `ProgramFlowWizard`

- **Purpose**: A multi-step wizard guiding the user through the client's journey.
- **Special Cases**: 
    - **Casual Stream**: Shows only `CasualNotesPanel` instead of the wizard.
    - **Pathways Stream**: Includes the "Placement" step; other streams skip it.

### Steps
| Step Key                 | Label                       | Short Label        | Pathways Only |
| ------------------------ | --------------------------- | ------------------ | ------------- |
| `bit`                    | Barrier Identification      | BIT                | No            |
| `barrier_action_plan`    | Barrier Resolution Plan     | Barrier Resolution | No            |
| `employment_action_plan` | Employment Action Plan      | Emp. Action Plan   | No            |
| `internal_placement`     | Placement                   | Placement          | Yes           |
| `exposures`              | Exposure Courses & Supports | Supports           | No            |
| `roadmap`                | Program Progress            | Program Progress   | No            |

### Step Status Logic
```js
const getStepStatus = (stepKey) => {
  switch (stepKey) {
    case "bit":
      return client?.bit_completed ? "done" : "active";
    case "barrier_action_plan":
      if (!client?.barriers_addressed) return "skipped";
      return client?.barrier_action_plan_completed ? "done" : client?.bit_completed ? "active" : "pending";
    case "employment_action_plan":
      return client?.action_plan_submitted ? "done" : client?.bit_completed ? "active" : "pending";
    case "internal_placement":
      if (!isPathways) return "skipped";
      if (!client?.internal_placement || client.internal_placement === "none") return "pending";
      return client?.placement_request_sent ? "done" : "active";
    case "exposures":
      return (client?.exposure_course || client?.paid_external_placement || client?.employment_supports || client?.external_employer)
        ? "done"
        : "active";
    case "roadmap":
      return client?.action_plan_submitted ? "active" : "pending";
    default:
      return "pending";
  }
};
```

### Content
Each step renders a corresponding component:
- `bit` -> `BarrierIdentificationTool`
- `barrier_action_plan` -> `BarrierActionPlan`
- `employment_action_plan` -> `EmploymentActionPlan`
- `internal_placement` -> `InternalPlacementStep`
- `exposures` -> `ExposuresSupportsStep`
- `roadmap` -> `ActionPlanRoadmap` (if plan submitted)

---

## TAB: Client Overview

### Component: `ClientProfileOverview`

- **Purpose**: Displays and allows editing of core demographic and case information.
- **Mode**: Toggles between `editMode` (form inputs) and view mode (read-only `Field` components).

### Editable Fields
- Demographics: Name, DOB, Sex, Phone, Email, HSID, Address, City, Residency, CLB, Vehicle.
- Case Info: Service Element, Program Status, Assigned Worker, Employment Status, Intake Date, Service Start Date, Completion Date, 90-Day Follow-up Date/Status.
- Career Background: Objectives, History, Intake Notes.
- Compass Verification: Verified (checkbox), Date, Verified By, Notes.

### Logic
- **handleSave**: Calls `onSave`, then creates Compass tasks for any changes to `service_type` or `program_status`.

### Stream Switch Alert
If `client.program_stream_switches` has entries, it displays a prominent purple alert box showing the history of switches.

---

## TAB: Referrals

### Component: `ClientReferrals`

- **Purpose**: Manage internal and external referrals for the client.
- **UI**: Two `Card` components, one for internal and one for external referrals, each with a list of checkboxes.
- **Logic**: On save, it compares the new state to the previous state and calls the `sendAlertEmail` backend function for any **newly added** referrals.

---

## TAB: Employment

### Component: `ClientEmployment`

- **Purpose**: Manage all employment-related data points.
- **Sections** (in Cards):
    1. Current Employment Status
    2. Employer & Job Info (conditional on being employed)
    3. Post-Program Completion Employment
    4. 90-Day Follow-Up
- **Logic**: On save, creates Compass tasks for changes to `employment_status`, `post_completion_employment_status`, or `followup_90day_status`.

---

## TAB: Financials

### Component: `ClientFinancials`

- **Purpose**: Track all financial records (exposure courses, placements, supports) for this client.
- **UI**: Lists existing records in individual cards. A "New Financial Record" button toggles a form (`FinancialRecordForm`) to add or edit records.
- **File Uploads**: Form includes file inputs for "Receipts" and "Completion Records", using `base44.integrations.Core.UploadFile`.

---

## TAB: Placements

### Component: `ClientPlacements`

- **Purpose**: A dedicated view for internal and external training placements.

- **Internal Placements**: 
    - Fetches and lists all `InternalTraining` records for the client.
    - Allows creating a new referral via `TrainingReferralForm`.
    - For a selected record, shows a tabbed interface with `TrainingProgressTracker`, `TrainingPlanEditor`, and `TrainingEvaluation`.

- **External Placements**: 
    - A simple read-only summary of `paid_external_placement` and `external_employer` fields from the main `Client` record.

---

## TAB: Status History

### Component: `ClientStatusHistory`

- **Purpose**: Displays a chronological timeline of all `StatusChange` records for the client.
- **Data**: Fetches from `StatusChange` entity where `client_id` matches.
- **UI**: A vertical timeline with colored dots and badges corresponding to the `change_type`.

---

## TAB: Stream Switches

### Component: `ClientStreamSwitches`

- **Purpose**: View and manage the client's history of switching between program streams.
- **UI**: Lists existing switches. A button toggles a form to add a new switch.
- **Logic**: On save, it adds the new switch to the `program_stream_switches` array, updates the client's main `service_type`, auto-logs a record in the `StatusChange` entity, and creates a `stream_switch` Compass task.