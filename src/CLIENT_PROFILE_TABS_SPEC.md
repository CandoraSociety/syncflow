# CLIENT PROFILE: Tabs Specification

This document covers the individual tab components within the Client Profile page.

## Files Involved
- `components/client/ClientProfileOverview.jsx`
- `components/client/ClientReferrals.jsx`
- `components/client/ClientEmployment.jsx`
- `components/client/ClientFinancials.jsx`
- `components/client/ClientPlacements.jsx`
- `components/client/ClientStreamSwitches.jsx`
- `components/client/ClientStatusHistory.jsx`

---

## TAB: Client Overview (ClientProfileOverview.jsx)

- **Purpose**: Displays and allows editing of core demographic and case information.
- **Mode**: Toggles between `editMode` (form inputs) and view mode (read-only `Field` components).
- **Editable Fields**: Demographics, Case Info, Career Background, Compass Verification.
- **Logic**: On save, creates Compass tasks for any changes to `service_type` or `program_status`.

---

## TAB: Referrals (ClientReferrals.jsx)

- **Purpose**: Manage internal and external referrals for the client.
- **UI**: Two `Card` components with lists of checkboxes for internal and external referral options.
- **Logic**: On save, it compares the new state to the previous state and calls the `sendAlertEmail` backend function for any **newly added** referrals.

---

## TAB: Employment (ClientEmployment.jsx)

- **Purpose**: Manage all employment-related data points.
- **Sections**: Cards for Current Employment Status, Employer & Job Info (conditional), Post-Program Completion, and 90-Day Follow-Up.
- **Logic**: On save, creates Compass tasks for changes to various employment status fields.

---

## TAB: Financials (ClientFinancials.jsx)

- **Purpose**: Track all financial records for the client.
- **UI**: Lists existing `FinancialRecord` entities. A button toggles the `FinancialRecordForm` to add/edit records.
- **AI Parsing**: The `FinancialRecordForm` uses an AI helper (`parseReceiptWithAI`) to extract data from uploaded receipt images.
- **File Uploads**: Uses `base44.integrations.Core.UploadFile` for receipts and completion records.

---

## TAB: Placements (ClientPlacements.jsx)

- **Purpose**: A dedicated view for internal and external training placements.
- **Internal Placements**: Fetches and lists `InternalTraining` records. For a selected record, shows a tabbed interface with `TrainingProgressTracker`, `TrainingPlanEditor`, and `TrainingEvaluation`.
- **External Placements**: A simple read-only summary of placement info from the main `Client` record.

---

## TAB: Stream Switches (ClientStreamSwitches.jsx)

- **Purpose**: View and manage the client's history of switching between program streams.
- **UI**: Lists existing switches. A button toggles a form to add a new switch.
- **Logic**: On save, it adds to the `program_stream_switches` array, updates the client's `service_type`, auto-logs a `StatusChange` record, and creates a `stream_switch` Compass task.

---

## TAB: Status History (ClientStatusHistory.jsx)

- **Purpose**: Displays a chronological timeline of all `StatusChange` records.
- **Data**: Fetches from `StatusChange` entity where `client_id` matches.
- **UI**: A vertical timeline with colored dots and badges corresponding to the `change_type`.