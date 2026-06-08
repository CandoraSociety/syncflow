# WIZARD: Program Flow Specification

This document covers the `ProgramFlowWizard` component and its direct step sub-components.

## Files Involved
- `components/wizard/ProgramFlowWizard.jsx`
- `components/wizard/BarrierIdentificationTool.jsx`
- `components/wizard/BarrierActionPlan.jsx`
- `components/wizard/EmploymentActionPlan.jsx`
- `components/wizard/InternalPlacementStep.jsx`
- `components/wizard/ExposuresSupportsStep.jsx`
- `components/wizard/CasualNotesPanel.jsx` (for Casual stream)
- `components/wizard/DEAFlowPanel.jsx` (referenced, but main logic is in EmploymentActionPlan)

---

## COMPONENT: ProgramFlowWizard.jsx

### Purpose
Step-by-step wizard guiding staff through the client's program journey. Different flows for Pathways vs DEA vs Casual streams.

### Step Structure
```js
const STEPS = [
  { key: "bit", label: "Barrier Identification", short: "BIT" },
  { key: "barrier_action_plan", label: "Barrier Resolution Plan", short: "Barrier Resolution" },
  { key: "employment_action_plan", label: "Employment Action Plan", short: "Emp. Action Plan" },
  { key: "internal_placement", label: "Placement", short: "Placement", pathwaysOnly: true },
  { key: "exposures", label: "Exposure Courses & Supports", short: "Supports" },
  { key: "roadmap", label: "Program Progress", short: "Program Progress" },
];
```

### Special Cases
- **Casual stream**: Shows only `CasualNotesPanel`.
- **DEA stream**: Skips Step 4 (Placement).
- **Pathways stream**: Full 6-step wizard.

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
      return (client?.exposure_course || client?.paid_external_placement || ...) ? "done" : "active";
    case "roadmap":
      return client?.action_plan_submitted ? "active" : "pending";
    default: return "pending";
  }
};
```

---

## STEP 1: Barrier Identification Tool (BarrierIdentificationTool.jsx)

- **UI**: A large table where each row is a barrier category (`Housing Stability`, `Childcare`, etc.).
- **Columns**: Barrier, Support Needed? (Yes/No radio), Challenges (multi-select), Recommended Actions (multi-select), Notes.
- **Sub-Component**: `ChecklistCell` is a reusable dropdown for multi-select with "Other" options.
- **Action Plan Summary**: A section at the bottom summarizes identified barriers, auto-populates recommendations, and includes fields for check-in frequency, follow-up methods, and review dates.
- **Save Data**: Consolidates selections into `barrier_N`, `barrier_N_challenges`, `barrier_N_action_steps`, `bit_review_dates`, etc. on the `Client` entity.
- **Triggers**: On save, creates `barriers_identified` Compass task and sends `barriers` alert email.

---

## STEP 2: Barrier Resolution Plan (BarrierActionPlan.jsx)

- **Purpose**: If barriers were identified in Step 1, this step allows for creating a detailed resolution plan for each.
- **UI**: Renders a `Card` for each of the (up to 3) identified barriers.
- **Fields per barrier**:
  - Action Steps (multiple text inputs)
  - Start Date
  - Target Completion Date
  - Responsible Party (text input)
  - Resources / Referrals Needed (text input)
- **Save Data**: Updates `barrier_N_action_steps`, `barrier_N_timeline_start`, `barrier_N_timeline_end`, etc. on the `Client` entity.

---

## STEP 3: Employment Action Plan (EmploymentActionPlan.jsx)

- **Purpose**: Build the client's customized action plan. Has different UI for DEA vs. other streams.
- **Pathways/Other UI**: Grouped checkboxes by category (`Workshops`, `Programs`, `Placement`, `Job Search`, `Supports`, `Other`). Selecting an item can reveal more fields for timeline/notes.
- **DEA UI**: Uses "Employment Development Activities" (EDA) slots. User selects an activity type for each slot. Minimum of 3, but more can be added.
- **Compass Text**: A `pre` block shows a formatted text summary of the entire action plan, ready to be copied into Compass. This text is generated differently for DEA vs. Pathways.
- **Compass Entered Flag**: A button allows marking the plan as entered in Compass, which hides the copy/paste block.
- **Save Data**: Saves selections to `sdp_items`, `sdp_item_details`, `sdp_other_desc`, and `sdp_notes` on the `Client` entity.

---

## STEP 4: Placement (InternalPlacementStep.jsx)

- **Purpose**: Set up placement details. (Pathways only).
- **UI**: Two main cards for Internal and External placements.
- **Internal Placement**: Select placement type, start/end dates, supervisor, schedule, and details.
- **Send Request**: A button calls the `sendAlertEmail` backend function to notify the supervisor of the placement.
- **External Placement**: A simple section to note the external employer name and flag if it's a paid placement.

---

## STEP 5: Exposure Courses & Supports (ExposuresSupportsStep.jsx)

- **Purpose**: Log financial records for courses, supports, and placements.
- **UI**: Lists existing `FinancialRecord` entities. An "Add Record" button shows the `SupportRecordEditor` form.
- **Auto-Seeding**: If no records exist, it automatically creates draft records based on selections from the Step 3 Action Plan.
- **AI Receipt Parsing**: When a receipt image/PDF is uploaded, it calls `base44.integrations.Core.InvokeLLM` to parse the vendor, date, and amounts, auto-filling the form.
- **Save Data**: Creates or updates records in the `FinancialRecord` entity.
- **Sync Flags**: Updates `exposure_course` and `employment_supports` boolean flags on the `Client` entity based on the created records.