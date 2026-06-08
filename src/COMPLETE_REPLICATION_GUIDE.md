# Candora Client Management System - Complete Replication Guide

## Overview
This is a complete client management system for Candora Society employment services. It tracks clients through intake, program participation, employment outcomes, and billing.

---

## PART 1: ENTITY SCHEMAS (Create These First)

### 1. Client Entity
**Purpose**: Main client record with all demographic, program, and outcome data

**Key Fields**:
- Personal: first_name, last_name, date_of_birth, phone, email, address, city, state, zip, sex (male/female)
- Government ID: compass_hsid, compass_verified (boolean), compass_verified_date, compass_verified_by, compass_notes
- Immigration: residency_status (enum: canadian_citizen, permanent_resident, protected_person, convention_refugee, refugee_claimant, temporary_resident, work_permit, study_permit, visitor, other)
- Language: clb_level (enum: clb_1 through clb_12, native_english_french)
- Employment: employment_status (enum codes: E-RF=Employed Regular Full-time, E-UF=Employed Regular Part-time, E-PT=Employed Temporary, UE=Unemployed, UE-LA=Unemployed Layoff, UE-S=Unemployed Seasonal, NA=Not Available)
- Transportation: has_vehicle (yes, no_has_license, no_no_license)
- Referral: referral_source (self, family_friend, school, employer, external_agency, alberta_works, other)
- Service: service_type (direct_to_employment, pathways, casual, external_referral, internal_referral, not_eligible)
- Assignment: assigned_worker (email), assigned_worker_name (display name)
- Status: status (new, active, pending, closed), program_status (in_progress, complete, incomplete, cancelled)
- File Closure: file_closed (boolean), closed_reason (enum), closed_date, closed_notes
- Dates: service_start_date, completion_date, employment_start_date, post_completion_employment_date, followup_90day_date
- Outcomes: post_completion_employment_status (enum same as employment_status + no_contact), followup_90day_status (same enum)
- Service Navigation: service_navigation_supports (boolean), service_navigation_date
- Barriers (BIT): barriers_addressed (boolean), bit_completed (boolean), bit_review_dates (array), bit_checkin_frequency, bit_review_checkins (array of objects with index, scheduled_date, completed, actual_date, notes, logged_by, logged_by_name, logged_at)
- Barrier Action Plan: barrier_action_plan_completed (boolean), action_plan_submitted (boolean), action_plan_compass_entered (boolean)
- Barriers 1-3: barrier_1/2/3 (string), barrier_1/2/3_status (unresolved/in_progress/resolved), barrier_1/2/3_other, barrier_1/2/3_notes, barrier_1/2/3_action_steps, barrier_1/2/3_challenges (newline-separated), barrier_1/2/3_timeline_start/end, barrier_1/2_3_responsible, barrier_1/2/3_resources
- Placements: exposure_course (boolean), paid_external_placement (boolean), employment_supports (boolean), internal_placement (none, cleaning_arc, food_services_onsite, food_services_offsite, reception, childcare), internal_placement_details, placement_start_date, placement_end_date, placement_supervisor, placement_schedule, placement_request_sent (boolean)
- External Employment: external_employer, employer_name, employer_contact, job_title, job_start_date, job_wage, job_hours
- Action Plan (SDP): sdp_items (array), sdp_item_details (object), sdp_other_desc, sdp_notes
- Referrals: internal_referrals (array), external_referrals (array)
- Career: career_objectives, employment_history, resume_urls (array)
- Notes: intake_notes, intake_date
- Stream Switches: program_stream_switches (array of objects: from_stream, to_stream, reason, reason_other, date, notes)
- Roadmap: roadmap_item_status (object), roadmap_progress_notes (array of objects)
- Casual Stream: casual_activity_log (array)
- DEA Stream: dea_activities (array), dea_closing_dismissed (boolean)

**Required Fields**: first_name, last_name

---

### 2. FinancialRecord Entity
**Purpose**: Track billable expenses (exposure courses, paid placements, employment supports)

**Fields**:
- client_id, client_name, assigned_worker
- record_type (exposure_course, paid_external_placement, employment_supports)
- course_type (for exposure courses), course_type_other
- description, amount, tax, total, date, vendor
- registration_status (not_registered, registered, waitlisted, cancelled)
- completion_status (not_started, in_progress, completed, did_not_complete)
- receipt_urls (array), receipt_parsed (boolean), completion_record_urls (array)
- notes, billing_month (YYYY-MM auto-set from date)

**Required**: client_id, record_type

---

### 3. StaffMonthlyReport Entity
**Purpose**: Staff submit monthly narrative reports

**Fields**:
- report_month (YYYY-MM), submitted_by (email), submitted_by_name, submitted_date
- status (draft, submitted)
- trends, marketing_activities, success_stories, employer_engagements, challenges, goals_next_month, additional_notes

**Required**: report_month, submitted_by

---

### 4. InvoicePackage Entity
**Purpose**: Monthly billing package with all billable items

**Fields**:
- package_number, billing_month (YYYY-MM), prepared_by, prepared_by_name, prepared_date
- config_id, status (draft, ready_for_review, submitted, approved)
- notes, crt_included (boolean), invoice_id
- supporting_documents (array), paid_placements (array), auto_populated_items (array)

**Required**: billing_month, prepared_by

---

### 5. CompassTask Entity
**Purpose**: Queue for entering client data into Compass (Government of Alberta database)

**Fields**:
- client_id, client_name, compass_hsid
- task_type (new_client, status_change, employment_outcome, action_plan, barriers_identified, service_navigation, other)
- title, instructions (detailed steps for Compass entry)
- triggered_by, triggered_by_name
- assigned_worker, assigned_worker_name
- status (pending, completed)
- completed_by, completed_by_name, completed_date, completed_notes

**Required**: client_id, title, instructions

---

### 6. StatusChange Entity
**Purpose**: Audit trail of all client status changes

**Fields**:
- client_id, client_name
- change_type (stream_switch, program_status_change, file_opened, file_closed, employment_outcome, post_completion_status, followup_90day, other)
- change_date, from_value, to_value, notes
- logged_by, logged_by_name, billing_relevant (boolean)

**Required**: client_id, change_type, change_date

---

### 7. InternalTraining Entity
**Purpose**: Track clients in internal training placements (cleaning, food services, reception, childcare)

**Fields**:
- client_id, client_name
- placement_type (cleaning_arc, food_services_onsite, food_services_offsite, reception, childcare)
- assigned_worker, assigned_worker_name
- referral_date, start_date, expected_end_date, actual_end_date
- transportation (enum with 6 options), transportation_notes
- training_goals, status (referred, active, completed, withdrawn, cancelled)
- orientation_completed, orientation_date
- health_safety_completed, health_safety_date
- midpoint_checkin_completed, midpoint_checkin_date
- program_completion_completed, program_completion_date
- training_plan_items (array of objects: id, label, focus, completed, completed_date, notes)
- supervisor_notes
- evaluation_completed, evaluation_date
- evaluation ratings (reliability, attitude, skill_development, teamwork, communication) - all enum: excellent/good/satisfactory/needs_improvement/unsatisfactory
- evaluation_would_hire (yes/yes_with_conditions/no/not_applicable)
- evaluation_strengths, evaluation_areas_for_growth, evaluation_overall_comments
- referral_notes

**Required**: client_id, placement_type

---

### 8. Invoice Entity
**Purpose**: Generated invoice with line items

**Fields**:
- invoice_number, billing_month, config_id
- status (draft, finalized, submitted)
- base_amount, line_items (array), subtotal_deliverables, subtotal_direct_costs, total_amount
- notes, generated_by, finalized_date

**Required**: billing_month

---

### 9. InvoiceConfig Entity
**Purpose**: Contract/billing configuration with rates and caps

**Fields**:
- config_name, contract_start_date, contract_end_date
- base_monthly_amount
- rate_dea_starter, rate_pathways_starter
- rate_dea_completer, rate_pathways_completer
- rate_employment_outcome, rate_90day_outcome
- cap_starters, cap_completers, cap_employment_outcomes, cap_90day_outcomes
- cap_exposure_courses_dollars, cap_paid_placements_dollars, cap_employment_supports_dollars
- is_active (boolean), notes

**Required**: config_name

---

### 10. Employer Entity
**Purpose**: Employer database for job placements

**Fields**:
- name, contact_name, contact_email, contact_phone, address, industry, notes

**Required**: name

---

### 11. User Entity (Built-in - Customize)
**Add to User entity**: No additional fields needed beyond built-in (email, full_name, role)
**Roles**: admin, intake, worker, supervisor (customize as needed)

---

## PART 2: BACKEND FUNCTIONS

### Function 1: followupReminder
**Purpose**: Send daily email reminders for upcoming 90-day follow-ups

**Trigger**: Scheduled automation - daily at 9:00 AM (America/Edmonton timezone)

**Logic**:
1. Get all clients where:
   - program_status = "complete"
   - followup_90day_status is empty
   - followup_90day_date is within next 14 days OR overdue
2. For each client, calculate days until/overdue
3. Send email to assigned worker with list of clients due

**Email Template**:
```
Subject: 90-Day Follow-Up Reminders - [Date]

Hi [Worker Name],

You have [X] client(s) due for 90-day follow-up:

1. [Client Name] - Due: [Date] ([X] days [overdue/remaining])
   Compass HSID: [HSID]
   Phone: [Phone]

2. ...

Please complete these follow-ups and update the client records.

Thanks!
```

---

### Function 2: sendAlertEmail
**Purpose**: Send alerts when specific events occur

**Trigger**: Entity automation - Client update (with conditions)

**Trigger Conditions**:
- internal_placement changed → email supervisor
- internal_referrals added → email receiving worker
- external_referrals added → email external agency
- service_navigation_supports changed to true → email service navigator

**Email Mappings** (update these with your actual emails):
- internal_placement: supervisor@candorasociety.com
- internal_referral: dawn.williston@candorasociety.com (or dynamic based on worker)
- external_referral: partner@agency.org
- service_navigation: navigator@candorasociety.com

---

## PART 3: AUTOMATIONS

### Automation 1: Daily Follow-Up Reminder
- **Type**: Scheduled
- **Function**: followupReminder
- **Schedule**: Daily at 9:00 AM (America/Edmonton)
- **Settings**: repeat_interval=1, repeat_unit="days", start_time="09:00"

### Automation 2: Alert Email on Client Update
- **Type**: Entity
- **Entity**: Client
- **Function**: sendAlertEmail
- **Events**: ["update"]
- **Trigger Conditions**: 
  - OR logic:
    - changed_fields contains "internal_placement"
    - changed_fields contains "internal_referrals"
    - changed_fields contains "external_referrals"
    - changed_fields contains "service_navigation_supports"

---

## PART 4: PAGES & ROUTES

### Route Structure (App.jsx)
```javascript
/ → Home (auto-redirect based on role)
/intake → IntakePage (unassigned clients)
/dashboard → WorkerDashboard (assigned clients)
/client/:id → ClientProfile (individual client)
/master → MasterList (all clients)
/reports → Reports (3 tabs: Outcomes, Data, Staff)
/supervisor → SupervisorPortal (internal training)
/resources → Resources (career tools)
/compass → Compass (task queue)
/billing → MonthlyBillingSubmissions
```

### Page Details

#### Home
- Redirects admin/intake roles to /intake
- Redirects workers to /dashboard

#### IntakePage
- Shows ONLY unassigned clients (no assigned_worker)
- Intake form creates new client + auto-creates Compass task
- Duplicate detection (email, phone, HSID)
- Quick filters: service type, program status, employment status, CLB, worker, age range, duration

#### WorkerDashboard
- Shows ONLY assigned clients
- Special logic for Dawn Williston (Service Navigator): sees all clients with barriers_addressed=true
- Alert panels:
  - DEA closing soon (within 3 days of 2-week period end)
  - 90-day follow-ups due (within 14 days)
- Tab switcher: My Clients | Compass Queue
- Master list table with color-coded rows

#### MasterList
- All assigned clients
- Tabs: Active Files | Closed Files
- Extended filters: referral source, residency status, 90-day status
- Shows stream switches with visual arrows

#### ClientProfile
- 4 tabs: Overview, Financials, Referrals, Placements
- Overview: Editable demographics, Compass verification, program status, BIT, action plan roadmap
- Financials: Exposure courses, paid placements, employment supports with receipt uploads
- Referrals: Internal/external referral tracking
- Placements: Internal training, external employment

#### Reports
- 3 tabs:
  1. **Outcomes**: DEA/Pathways starters, completers, employment outcomes, 90-day outcomes
  2. **Data Reports**: Custom filters, export to CSV, demographic breakdowns
  3. **Staff Monthly**: Staff submit narrative reports

#### SupervisorPortal
- Split view: client list (left) | detail panel (right)
- Internal training placements with progress tracking
- 3 tabs in detail: Progress, Training Plan, Evaluation

#### Resources
- 2 tabs: Career Planning, Job Search
- Static resources and tools

#### Compass
- Task queue grouped by counsellor
- Pending/completed tabs
- Action plan tasks prioritized at top

#### MonthlyBillingSubmissions
- 4 tabs: Invoice Packages, CRT, Invoices, Supporting Documents
- Invoice package generator auto-populates billable items
- CRT shows client outcomes for reporting period

---

## PART 5: COMPONENTS (Key Ones)

### Layout
- **AppNav**: Top navigation with role-based visibility
  - Admin/Intake: Intake, Master List, Reports, Supervisor, Resources, Compass, Billing
  - Worker: Dashboard, My Clients, Resources, Compass

### Intake Components
- **IntakeForm**: Multi-section form with validation
  - Sections: Personal Info, Contact, Address, Demographics, Immigration, Language, Employment, Service, Career Objectives, History, Documents, Notes
  - File upload for resumes/documents
  - Duplicate warning dialog

### Client Profile Components
- **ClientProfileOverview**: Editable demographics with Compass verification
- **ClientFinancials**: Financial records with receipt upload
- **ClientRoadmap**: Visual timeline of action plan items
- **ClientStatusHistory**: Audit trail of status changes
- **ClientPlacements**: Internal/external placement tracking

### Wizard Components (Program Flow)
- **ProgramFlowWizard**: Step-by-step client onboarding
- **BarrierIdentificationTool (BIT)**: Barrier assessment
- **BarrierActionPlan**: Action plan creation
- **EmploymentActionPlan**: Employment planning
- **ExposuresSupportsStep**: Exposure courses and supports
- **InternalPlacementStep**: Internal training referral
- **DEAFlowPanel**: DEA-specific workflow
- **DEAClosingDialog**: DEA period closing confirmation
- **CasualNotesPanel**: Casual stream activity logging
- **RoadmapItemPanel**: Individual item status editing
- **RoadmapProgressNotes**: Auto-generated progress notes
- **BITReviewCheckinPanel**: BIT review check-in logging
- **ProgramStatusPanel**: Program status changes

### Billing Components
- **InvoicePackageGenerator**: Auto-populate billable items
- **InvoicePackageList**: List of packages
- **InvoicePackageDetail**: Package editing
- **InvoiceGenerator**: Invoice creation
- **InvoiceConfigEditor**: Contract configuration
- **BudgetTracker**: Budget vs actual tracking
- **CRTFinancials**: CRT financial data
- **CRTOutcomes**: CRT outcome metrics
- **CRTClientData**: CRT client extraction

### Training Components
- **TrainingReferralForm**: Internal training referral
- **TrainingProgressTracker**: Progress check-ins
- **TrainingPlanEditor**: Customized training plan
- **TrainingEvaluation**: Final evaluation form
- **PLACEMENT_CONFIG**: Placement type labels and options

### List Components
- **ClientListControls**: Search, filters, sort for client lists
- **ClientTable**: Reusable client table
- **CompassTaskList**: Task queue with pending/completed tabs

### Report Components
- **ReportSummary**: Data visualization with charts
- **StaffMonthlyReports**: Staff narrative reports
- **BillingReport**: Billing data export

### UI Components
- **Celebration**: Confetti animation for milestones
- **DuplicateWarningDialog**: Duplicate client warning
- **StatusChangeDialog**: Status change confirmation
- **CloseFileDialog**: File closing workflow

---

## PART 6: DESIGN SYSTEM

### Colors (index.css)
```css
:root {
  --candora-navy: 231 64% 20%;        /* #1a237e */
  --candora-navy-mid: 231 55% 30%;    /* #2c3799 */
  --candora-gold: 42 100% 54%;        /* #FBB800 */
  --candora-gold-light: 44 100% 88%;  /* pale gold */
  
  --background: 231 40% 96%;
  --foreground: 231 64% 16%;
  --primary: var(--candora-navy);
  --secondary: var(--candora-gold-light);
  --accent: var(--candora-gold);
  --ring: var(--candora-navy);
}
```

### Tailwind Config
- Use token-based classes: `bg-primary`, `text-secondary`, `border-accent`
- Loading spinner: `.candora-spin` (navy top, gold base)

### Typography
- Font: System default (Inter fallback)
- Headings: Bold, navy color
- Body: Regular, slate colors

### Layout Patterns
- **Header**: White background, border-bottom, flex with title + actions
- **Tables**: Fixed headers, hover rows, responsive overflow
- **Cards**: Rounded-lg, border, shadow-sm
- **Tabs**: Rounded tabs with active state
- **Alerts**: Colored borders (amber for warnings, blue for info, red for errors)
- **Buttons**: Primary (navy), outline (ghost with border)

---

## PART 7: BUSINESS LOGIC RULES

### Client Assignment
- New clients created in Intake have NO assigned_worker
- Intake staff assign worker → client moves from Intake to worker's dashboard
- Unassigned clients ONLY visible in Intake page
- Assigned clients ONLY visible in Master List and worker dashboards

### DEA Program Period
- DEA stream = 2-week program period
- Start: service_start_date
- End: service_start_date + 14 days
- Alert shown when within 3 days of end
- Closing dialog prompts for completion status

### 90-Day Follow-Up
- Due date: completion_date + 90 days (or manually set followup_90day_date)
- Alert shown when within 14 days
- Daily email reminder at 9 AM
- Status tracked: E-RF, E-UF, E-PT, UE, UE-LA, UE-S, NA, no_contact

### Stream Switches
- Tracked in program_stream_switches array
- Each switch: from_stream, to_stream, reason, date, notes
- Visual indicator in tables (amber badge with count)
- May affect billing (track in invoice line items)

### Compass Tasks
- Auto-created on:
  - New client intake
  - Service type change
  - Program status change
  - Employment outcome
  - Action plan submitted
  - Barriers identified
  - Service navigation provided
- Tasks assigned to client's career counsellor
- Pending tasks shown in worker's Compass Queue tab

### Billing Rules
- Starters: Billed once when client starts program
- Completers: Billed once when client completes program
- Employment outcomes: Billed when client gains employment
- 90-day outcomes: Billed when client sustains employment for 90 days
- Exposure courses: Reimbursed up to contract cap
- Paid placements: Reimbursed up to contract cap
- Employment supports: Reimbursed up to contract cap
- Caps tracked per contract period

---

## PART 8: KEY INTEGRATIONS

### Email (Built-in)
- Used for: Follow-up reminders, alerts, notifications
- Sender: noreply@candorasociety.com (or app name)

### File Upload (Built-in)
- Used for: Resumes, receipts, completion records, supporting documents
- Storage: Private file storage with signed URLs

### LLM (Built-in InvokeLLM)
- Used for: Receipt parsing, data extraction
- Model: Automatic (GPT-4o-mini default)

---

## PART 9: ROLE-BASED ACCESS

### Admin
- All pages accessible
- Can invite users, manage roles
- Can view all clients, reports, billing

### Intake
- Intake page (create/edit unassigned clients)
- Master list (view only)
- Reports (view only)
- Cannot access worker dashboard, compass, billing

### Worker
- Dashboard (own clients only)
- Client profiles (own clients)
- Compass task queue (own tasks)
- Resources
- Cannot access intake, supervisor, billing

### Supervisor
- Supervisor portal (internal training)
- Can view all training records
- Can update training progress, evaluations

---

## PART 10: STEP-BY-STEP REPLICATION

### Phase 1: Entities (Day 1)
1. Create all 11 entities with exact schemas
2. Customize User entity roles if needed
3. Test entity creation with sample data

### Phase 2: Backend Functions (Day 2)
1. Create followupReminder function
2. Create sendAlertEmail function
3. Test functions with sample data
4. Update email addresses to actual staff emails

### Phase 3: Automations (Day 3)
1. Create scheduled automation for followupReminder (daily 9 AM)
2. Create entity automation for sendAlertEmail (Client update)
3. Test automations with sample client updates

### Phase 4: Pages & Components (Days 4-10)
1. Create App.jsx with all routes
2. Create AppNav component
3. Create Home page with redirect logic
4. Create IntakePage with IntakeForm component
5. Create WorkerDashboard with alert panels
6. Create MasterList with active/closed tabs
7. Create ClientProfile with 4 tabs
8. Create Reports page with 3 tabs
9. Create SupervisorPortal with split view
10. Create Resources page
11. Create Compass page
12. Create MonthlyBillingSubmissions with 4 tabs

### Phase 5: Styling & Branding (Day 11)
1. Update index.css with Candora design tokens
2. Update tailwind.config.js with token mappings
3. Update index.html with app title
4. Test responsive design on mobile

### Phase 6: Testing & QA (Days 12-14)
1. Test all CRUD operations on entities
2. Test automations trigger correctly
3. Test email sending
4. Test file uploads
5. Test role-based access
6. Test all navigation flows
7. Fix bugs and edge cases

---

## PART 11: COMMON PITFALLS TO AVOID

1. **Don't forget built-in fields**: id, created_date, updated_date, created_by_id exist on all entities automatically
2. **Don't create User entity**: It's built-in, just customize if needed
3. **Use correct date format**: YYYY-MM-DD for date fields, stored as strings
4. **Handle null values**: Many fields are optional, check for null/undefined
5. **Row colors**: Use clientRowColor utility for status-based row coloring
6. **Service labels**: Use SERVICE_LABELS mapping for display (DEA, Pathways, etc.)
7. **Program status logic**: Check for incomplete assessments before showing status
8. **Dawn's special view**: Service Navigator sees all clients with barriers, not just assigned
9. **Compass task deduplication**: Check for existing pending tasks before creating new ones
10. **Billing caps**: Track cumulative totals against contract caps

---

## PART 12: FILES CHECKLIST

Ensure these files exist in the new app:

**Pages** (11 files):
- Home.jsx
- IntakePage.jsx
- WorkerDashboard.jsx
- ClientProfile.jsx
- MasterList.jsx
- Reports.jsx
- SupervisorPortal.jsx
- Resources.jsx
- Compass.jsx
- MonthlyBillingSubmissions.jsx
- CRT.jsx (if separate)
- Invoices.jsx (if separate)

**Components** (50+ files - see full list in export):
- layout/AppNav.jsx
- intake/IntakeForm.jsx
- intake/DuplicateWarningDialog.jsx
- lists/ClientListControls.jsx
- client/ClientProfileOverview.jsx
- client/ClientFinancials.jsx
- client/ClientRoadmap.jsx
- client/ClientStatusHistory.jsx
- client/ClientPlacements.jsx
- client/ClientEmployment.jsx
- client/ClientReferrals.jsx
- client/StatusChangeDialog.jsx
- client/CloseFileDialog.jsx
- wizard/ProgramFlowWizard.jsx
- wizard/BarrierIdentificationTool.jsx
- wizard/BarrierActionPlan.jsx
- wizard/EmploymentActionPlan.jsx
- wizard/ExposuresSupportsStep.jsx
- wizard/InternalPlacementStep.jsx
- wizard/DEAFlowPanel.jsx
- wizard/DEAClosingDialog.jsx
- wizard/CasualNotesPanel.jsx
- wizard/RoadmapItemPanel.jsx
- wizard/RoadmapProgressNotes.jsx
- wizard/BITReviewCheckinPanel.jsx
- wizard/ProgramStatusPanel.jsx
- billing/InvoicePackageGenerator.jsx
- billing/InvoicePackageList.jsx
- billing/InvoicePackageDetail.jsx
- billing/SupportingDocuments.jsx
- invoices/InvoiceGenerator.jsx
- invoices/InvoiceConfigEditor.jsx
- invoices/InvoiceDetail.jsx
- invoices/BudgetTracker.jsx
- crt/CRTFinancials.jsx
- crt/CRTOutcomes.jsx
- crt/CRTClientData.jsx
- training/TrainingReferralForm.jsx
- training/TrainingProgressTracker.jsx
- training/TrainingPlanEditor.jsx
- training/TrainingEvaluation.jsx
- training/PLACEMENT_CONFIG.js
- compass/CompassTaskList.jsx
- reports/ReportSummary.jsx
- reports/StaffMonthlyReports.jsx
- reports/BillingReport.jsx
- Celebration.jsx
- UserNotRegisteredError.jsx
- ProtectedRoute.jsx

**Lib** (6 files):
- AuthContext.jsx
- BrandingContext.jsx
- utils.js
- compassTasks.js
- query-client.js
- clientRowColor.js
- app-params.js
- exportBitPdf.js

**Functions** (2 files):
- followupReminder.js
- sendAlertEmail.js

**Config** (4 files):
- App.jsx
- index.css
- tailwind.config.js
- index.html

---

## Support

If you encounter issues during replication:
1. Check entity schemas match exactly
2. Verify automations are active
3. Confirm email addresses are updated in sendAlertEmail
4. Test with sample data before production use
5. Check browser console for errors
6. Verify all imports are correct (no missing components)

---

**Generated**: 2026-06-08
**App Version**: 1.0
**Platform**: Base44