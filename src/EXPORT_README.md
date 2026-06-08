# CANDORA PATHWAYS CASE MANAGEMENT SYSTEM
## Complete App Replication Guide

This document contains everything needed to replicate the Candora Pathways Case Management System in a new Base44 app.

---

## TABLE OF CONTENTS

1. [App Overview](#app-overview)
2. [Visual Design & Branding](#visual-design--branding)
3. [Entity Schemas](#entity-schemas)
4. [Backend Functions](#backend-functions)
5. [Automations Setup](#automations-setup)
6. [Page Structure](#page-structure)
7. [Component Architecture](#component-architecture)
8. [Integration Configuration](#integration-configuration)
9. [Step-by-Step Replication Instructions](#step-by-step-replication-instructions)

---

## APP OVERVIEW

**Purpose**: Case management system for employment services, tracking clients through program intake, service delivery, employment outcomes, and billing.

**Key Features**:
- Client intake and demographic tracking
- Service stream management (DEA, Pathways, Casual)
- Barrier identification and action planning
- Employment outcome tracking (90-day follow-ups)
- Internal training placements
- Financial tracking and invoice generation
- Compass (government database) task management
- Staff monthly reporting
- Comprehensive data reporting

**User Roles**:
- Admin: Full access, can invite users
- User (Career Counsellor/Service Navigator): Access to assigned clients

---

## VISUAL DESIGN & BRANDING

### Color Scheme (Candora Brand)

**Primary Colors**:
- Navy Blue: `#1a237e` (HSL: 231 64% 20%)
- Mid Navy: `#2c3799` (HSL: 231 55% 30%)
- Sunflower Gold: `#FBB800` (HSL: 42 100% 54%)
- Pale Gold: HSL 44 100% 88%

### Design Tokens (index.css)

The app uses a token-based design system with Candora branding:
- Background: Light navy-tinted white
- Primary: Navy blue
- Secondary: Pale gold
- Accent: Sunflower gold
- Cards: White with subtle shadows
- Borders: Light slate

### Typography

- Uses system fonts via Tailwind defaults
- Headings: Bold, slate-800
- Body: Regular, slate-600/700
- Labels: Small, uppercase, slate-400

### UI Components

All UI components use shadcn/ui with custom styling:
- Buttons: Navy primary, outlined secondary
- Cards: White with rounded-xl, shadow-sm
- Inputs: Standard with slate borders
- Selects: Custom with chevron icons
- Tables: Striped with hover states
- Badges: Color-coded by status

### Layout

**Navigation**:
- Sticky header with Candora logo
- Desktop: Horizontal nav bar
- Mobile: Hamburger menu drawer
- Routes: /, /intake, /dashboard, /client/:id, /master, /reports, /supervisor, /resources, /compass, /billing

**Page Layout**:
- Max-width: 7xl (1280px)
- Padding: 6 (24px)
- Responsive grid layouts
- Print-friendly styles for reports

---

## ENTITY SCHEMAS

### 1. Client (Main Entity)

```json
{
  "name": "Client",
  "type": "object",
  "properties": {
    "first_name": {"type": "string", "description": "Client's first name"},
    "last_name": {"type": "string", "description": "Client's last name"},
    "date_of_birth": {"type": "string", "format": "date", "description": "Date of birth"},
    "sex": {"type": "string", "enum": ["male", "female"], "description": "Biological sex for demographic data"},
    "phone": {"type": "string", "description": "Phone number"},
    "email": {"type": "string", "description": "Email address"},
    "address": {"type": "string", "description": "Street address"},
    "city": {"type": "string", "description": "City"},
    "state": {"type": "string", "description": "Province"},
    "zip": {"type": "string", "description": "Postal code"},
    "compass_hsid": {"type": "string", "description": "Compass HSID# (Government of Alberta database)"},
    "compass_verified": {"type": "boolean", "description": "Client file entered into Compass"},
    "compass_verified_date": {"type": "string", "format": "date"},
    "compass_verified_by": {"type": "string"},
    "compass_notes": {"type": "string"},
    "residency_status": {"type": "string", "enum": ["canadian_citizen", "permanent_resident", "protected_person", "convention_refugee", "refugee_claimant", "temporary_resident", "work_permit", "study_permit", "visitor", "other"]},
    "clb_level": {"type": "string", "enum": ["clb_1", "clb_2", "clb_3", "clb_4", "clb_5", "clb_6", "clb_7", "clb_8", "clb_9", "clb_10", "clb_11", "clb_12", "native_english_french"]},
    "employment_status": {"type": "string", "enum": ["E-RF", "E-UF", "E-PT", "UE", "UE-LA", "UE-S", "NA"]},
    "has_vehicle": {"type": "string", "enum": ["yes", "no_has_license", "no_no_license"]},
    "referral_source": {"type": "string", "enum": ["self", "family_friend", "school", "employer", "external_agency", "alberta_works", "other"]},
    "service_type": {"type": "string", "enum": ["direct_to_employment", "pathways", "casual", "external_referral", "internal_referral", "not_eligible"]},
    "assigned_worker": {"type": "string", "description": "Email of assigned worker"},
    "assigned_worker_name": {"type": "string"},
    "status": {"type": "string", "enum": ["new", "active", "pending", "closed"], "default": "new"},
    "program_status": {"type": "string", "enum": ["in_progress", "complete", "incomplete", "cancelled"]},
    "service_start_date": {"type": "string", "format": "date"},
    "completion_date": {"type": "string", "format": "date"},
    "employment_start_date": {"type": "string", "format": "date"},
    "post_completion_employment_status": {"type": "string", "enum": ["E-RF", "E-UF", "E-PT", "UE", "UE-LA", "UE-S", "NA", "no_contact"]},
    "post_completion_employment_date": {"type": "string", "format": "date"},
    "followup_90day_date": {"type": "string", "format": "date"},
    "followup_90day_status": {"type": "string", "enum": ["E-RF", "E-UF", "E-PT", "UE", "UE-LA", "UE-S", "NA", "no_contact"]},
    "barrier_1": {"type": "string"},
    "barrier_1_status": {"type": "string", "enum": ["unresolved", "in_progress", "resolved"]},
    "barrier_1_notes": {"type": "string"},
    "barrier_1_action_steps": {"type": "string"},
    "barrier_2": {"type": "string"},
    "barrier_2_status": {"type": "string", "enum": ["unresolved", "in_progress", "resolved"]},
    "barrier_2_notes": {"type": "string"},
    "barrier_2_action_steps": {"type": "string"},
    "barrier_3": {"type": "string"},
    "barrier_3_status": {"type": "string", "enum": ["unresolved", "in_progress", "resolved"]},
    "barrier_3_notes": {"type": "string"},
    "barrier_3_action_steps": {"type": "string"},
    "sdp_items": {"type": "array", "items": {"type": "string"}},
    "sdp_item_details": {"type": "object"},
    "internal_referrals": {"type": "array", "items": {"type": "string"}},
    "external_referrals": {"type": "array", "items": {"type": "string"}},
    "internal_placement": {"type": "string", "enum": ["none", "cleaning_arc", "food_services_onsite", "food_services_offsite", "reception", "childcare"]},
    "career_objectives": {"type": "string"},
    "employment_history": {"type": "string"},
    "resume_urls": {"type": "array", "items": {"type": "string"}},
    "intake_notes": {"type": "string"},
    "intake_date": {"type": "string", "format": "date"},
    "program_stream_switches": {"type": "array", "items": {"type": "object", "properties": {"from_stream": {"type": "string"}, "to_stream": {"type": "string"}, "reason": {"type": "string"}, "date": {"type": "string"}}}},
    "roadmap_item_status": {"type": "object"},
    "roadmap_progress_notes": {"type": "array", "items": {"type": "object"}},
    "casual_activity_log": {"type": "array", "items": {"type": "object"}},
    "dea_activities": {"type": "array", "items": {"type": "object"}}
  },
  "required": ["first_name", "last_name"]
}
```

### 2. CompassTask

```json
{
  "name": "CompassTask",
  "type": "object",
  "properties": {
    "client_id": {"type": "string"},
    "client_name": {"type": "string"},
    "compass_hsid": {"type": "string"},
    "task_type": {"type": "string"},
    "title": {"type": "string"},
    "instructions": {"type": "string"},
    "triggered_by": {"type": "string"},
    "triggered_by_name": {"type": "string"},
    "assigned_worker": {"type": "string"},
    "assigned_worker_name": {"type": "string"},
    "status": {"type": "string", "enum": ["pending", "completed"], "default": "pending"},
    "completed_by": {"type": "string"},
    "completed_by_name": {"type": "string"},
    "completed_date": {"type": "string", "format": "date"},
    "completed_notes": {"type": "string"}
  },
  "required": ["client_id", "title", "instructions"]
}
```

### 3. FinancialRecord

```json
{
  "name": "FinancialRecord",
  "type": "object",
  "properties": {
    "client_id": {"type": "string"},
    "client_name": {"type": "string"},
    "assigned_worker": {"type": "string"},
    "record_type": {"type": "string", "enum": ["exposure_course", "paid_external_placement", "employment_supports"]},
    "course_type": {"type": "string"},
    "description": {"type": "string"},
    "amount": {"type": "number"},
    "tax": {"type": "number"},
    "total": {"type": "number"},
    "date": {"type": "string", "format": "date"},
    "vendor": {"type": "string"},
    "registration_status": {"type": "string", "enum": ["not_registered", "registered", "waitlisted", "cancelled"]},
    "completion_status": {"type": "string", "enum": ["not_started", "in_progress", "completed", "did_not_complete"]},
    "receipt_urls": {"type": "array", "items": {"type": "string"}},
    "completion_record_urls": {"type": "array", "items": {"type": "string"}},
    "notes": {"type": "string"},
    "billing_month": {"type": "string"}
  },
  "required": ["client_id", "record_type"]
}
```

### 4. Invoice

```json
{
  "name": "Invoice",
  "type": "object",
  "properties": {
    "invoice_number": {"type": "string"},
    "billing_month": {"type": "string"},
    "config_id": {"type": "string"},
    "status": {"type": "string", "enum": ["draft", "finalized", "submitted"], "default": "draft"},
    "base_amount": {"type": "number"},
    "line_items": {"type": "array", "items": {"type": "object"}},
    "subtotal_deliverables": {"type": "number"},
    "subtotal_direct_costs": {"type": "number"},
    "total_amount": {"type": "number"},
    "notes": {"type": "string"},
    "generated_by": {"type": "string"},
    "finalized_date": {"type": "string", "format": "date"}
  },
  "required": ["billing_month"]
}
```

### 5. InvoiceConfig

```json
{
  "name": "InvoiceConfig",
  "type": "object",
  "properties": {
    "config_name": {"type": "string"},
    "contract_start_date": {"type": "string", "format": "date"},
    "contract_end_date": {"type": "string", "format": "date"},
    "base_monthly_amount": {"type": "number"},
    "rate_dea_starter": {"type": "number"},
    "rate_pathways_starter": {"type": "number"},
    "rate_dea_completer": {"type": "number"},
    "rate_pathways_completer": {"type": "number"},
    "rate_employment_outcome": {"type": "number"},
    "rate_90day_outcome": {"type": "number"},
    "cap_starters": {"type": "number"},
    "cap_completers": {"type": "number"},
    "cap_employment_outcomes": {"type": "number"},
    "cap_90day_outcomes": {"type": "number"},
    "cap_exposure_courses_dollars": {"type": "number"},
    "cap_paid_placements_dollars": {"type": "number"},
    "cap_employment_supports_dollars": {"type": "number"},
    "is_active": {"type": "boolean", "default": true},
    "notes": {"type": "string"}
  },
  "required": ["config_name"]
}
```

### 6. InvoicePackage

```json
{
  "name": "InvoicePackage",
  "type": "object",
  "properties": {
    "package_number": {"type": "string"},
    "billing_month": {"type": "string"},
    "prepared_by": {"type": "string"},
    "prepared_by_name": {"type": "string"},
    "prepared_date": {"type": "string", "format": "date"},
    "config_id": {"type": "string"},
    "status": {"type": "string", "enum": ["draft", "ready_for_review", "submitted", "approved"], "default": "draft"},
    "notes": {"type": "string"},
    "crt_included": {"type": "boolean", "default": true},
    "invoice_id": {"type": "string"},
    "supporting_documents": {"type": "array", "items": {"type": "object"}},
    "paid_placements": {"type": "array", "items": {"type": "object"}},
    "auto_populated_items": {"type": "array", "items": {"type": "object"}}
  },
  "required": ["billing_month", "prepared_by"]
}
```

### 7. StaffMonthlyReport

```json
{
  "name": "StaffMonthlyReport",
  "type": "object",
  "properties": {
    "report_month": {"type": "string", "format": "date"},
    "submitted_by": {"type": "string"},
    "submitted_by_name": {"type": "string"},
    "submitted_date": {"type": "string", "format": "date"},
    "status": {"type": "string", "enum": ["draft", "submitted"], "default": "draft"},
    "trends": {"type": "string"},
    "marketing_activities": {"type": "string"},
    "success_stories": {"type": "string"},
    "employer_engagements": {"type": "string"},
    "challenges": {"type": "string"},
    "goals_next_month": {"type": "string"},
    "additional_notes": {"type": "string"}
  },
  "required": ["report_month", "submitted_by"]
}
```

### 8. StatusChange

```json
{
  "name": "StatusChange",
  "type": "object",
  "properties": {
    "client_id": {"type": "string"},
    "client_name": {"type": "string"},
    "change_type": {"type": "string", "enum": ["stream_switch", "program_status_change", "file_opened", "file_closed", "employment_outcome", "post_completion_status", "followup_90day", "other"]},
    "change_date": {"type": "string", "format": "date"},
    "from_value": {"type": "string"},
    "to_value": {"type": "string"},
    "notes": {"type": "string"},
    "logged_by": {"type": "string"},
    "logged_by_name": {"type": "string"},
    "billing_relevant": {"type": "boolean"}
  },
  "required": ["client_id", "change_type", "change_date"]
}
```

### 9. InternalTraining

```json
{
  "name": "InternalTraining",
  "type": "object",
  "properties": {
    "client_id": {"type": "string"},
    "client_name": {"type": "string"},
    "placement_type": {"type": "string", "enum": ["cleaning_arc", "food_services_onsite", "food_services_offsite", "reception", "childcare"]},
    "assigned_worker": {"type": "string"},
    "assigned_worker_name": {"type": "string"},
    "referral_date": {"type": "string", "format": "date"},
    "start_date": {"type": "string", "format": "date"},
    "expected_end_date": {"type": "string", "format": "date"},
    "actual_end_date": {"type": "string", "format": "date"},
    "transportation": {"type": "string", "enum": ["has_own_vehicle", "no_vehicle_willing_to_bus", "no_vehicle_not_willing_to_bus", "transit_pass_provided", "requires_transportation_support", "offsite_not_applicable"]},
    "transportation_notes": {"type": "string"},
    "training_goals": {"type": "string"},
    "status": {"type": "string", "enum": ["referred", "active", "completed", "withdrawn", "cancelled"], "default": "referred"},
    "orientation_completed": {"type": "boolean"},
    "orientation_date": {"type": "string", "format": "date"},
    "health_safety_completed": {"type": "boolean"},
    "health_safety_date": {"type": "string", "format": "date"},
    "midpoint_checkin_completed": {"type": "boolean"},
    "midpoint_checkin_date": {"type": "string", "format": "date"},
    "program_completion_completed": {"type": "boolean"},
    "program_completion_date": {"type": "string", "format": "date"},
    "training_plan_items": {"type": "array", "items": {"type": "object"}},
    "supervisor_notes": {"type": "string"},
    "evaluation_completed": {"type": "boolean"},
    "evaluation_date": {"type": "string", "format": "date"},
    "evaluation_reliability": {"type": "string", "enum": ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"]},
    "evaluation_attitude": {"type": "string", "enum": ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"]},
    "evaluation_skill_development": {"type": "string", "enum": ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"]},
    "evaluation_teamwork": {"type": "string", "enum": ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"]},
    "evaluation_communication": {"type": "string", "enum": ["excellent", "good", "satisfactory", "needs_improvement", "unsatisfactory"]},
    "evaluation_would_hire": {"type": "string", "enum": ["yes", "yes_with_conditions", "no", "not_applicable"]},
    "evaluation_strengths": {"type": "string"},
    "evaluation_areas_for_growth": {"type": "string"},
    "evaluation_overall_comments": {"type": "string"},
    "referral_notes": {"type": "string"}
  },
  "required": ["client_id", "placement_type"]
}
```

### 10. Employer

```json
{
  "name": "Employer",
  "type": "object",
  "properties": {
    "name": {"type": "string"},
    "contact_name": {"type": "string"},
    "contact_email": {"type": "string"},
    "contact_phone": {"type": "string"},
    "address": {"type": "string"},
    "industry": {"type": "string"},
    "notes": {"type": "string"}
  },
  "required": ["name"]
}
```

### 11. User (Built-in, Customize Role)

```json
{
  "name": "User",
  "type": "object",
  "properties": {
    "role": {"type": "string", "enum": ["admin", "user"]}
  },
  "required": ["role"]
}
```

---

## BACKEND FUNCTIONS

### 1. followupReminder

**Purpose**: Automated email reminders for 90-day follow-ups due in 7, 3, or 0 days.

**Source Code**: (See functions/followupReminder.js in export package)

**Schedule**: Run daily at 9:00 AM

**Logic**:
- Checks all active clients with followup_90day_date set
- Calculates days until due
- Sends email to assigned worker if due in 7, 3, or 0 days
- Skips if already completed or file closed

### 2. sendAlertEmail

**Purpose**: Send email notifications for internal placements, referrals, and barriers.

**Source Code**: (See functions/sendAlertEmail.js in export package)

**Email Mappings**:
- Internal placements → priscilla@candorasociety.com
- Internal referrals (ELL, EmpowerU, etc.) → priscilla@candorasociety.com
- External referrals → priscilla@candorasociety.com
- Barriers → Dawn.williston@candorasociety.com (Service Navigator)

---

## AUTOMATIONS SETUP

### Required Automations

**1. Follow-up Reminder (Scheduled)**
- Type: scheduled
- Function: followupReminder
- Schedule: Daily at 9:00 AM
- Cron: `0 9 * * *`

**2. Alert Email (Entity - on Client update)**
- Type: entity
- Entity: Client
- Events: ["update"]
- Function: sendAlertEmail
- Trigger Conditions: When internal_placement, internal_referrals, external_referrals, or barriers change

---

## PAGE STRUCTURE

### Routes (App.jsx)

```javascript
<Route path="/" element={<Home />} />
<Route path="/intake" element={<IntakePage />} />
<Route path="/dashboard" element={<WorkerDashboard />} />
<Route path="/client/:id" element={<ClientProfile />} />
<Route path="/master" element={<MasterList />} />
<Route path="/reports" element={<Reports />} />
<Route path="/supervisor" element={<SupervisorPortal />} />
<Route path="/resources" element={<Resources />} />
<Route path="/compass" element={<Compass />} />
<Route path="/billing" element={<MonthlyBillingSubmissions />} />
```

### Page Descriptions

**1. Home (/)** - Landing page with navigation to all modules

**2. Intake (/intake)** - New client intake form with:
- Demographics
- Case & service info
- Employment history
- Education
- Resume upload
- Intake notes

**3. Worker Dashboard (/dashboard)** - Main workspace for career counsellors:
- Assigned client list
- Priority alerts (follow-ups due, DEA closures, overdue items)
- Compass task queue
- Quick filters and search

**4. Client Profile (/client/:id)** - Individual client management:
- Overview tab (demographics, case info, career background, Compass verification)
- Financials tab (exposure courses, placements, employment supports)
- Referrals tab (internal/external)
- Placements tab (internal training)
- Status history
- Service plan
- Action plan wizard

**5. Master List (/master)** - Comprehensive client tracking:
- Active and closed files
- Advanced filtering
- Sortable columns
- Status badges

**6. Reports (/reports)** - Three tabs:
- Outcomes: Program metrics and KPIs
- Data Reports: Customizable reports with filters, date ranges, sections
- Staff Monthly: Staff narrative report submissions

**7. Supervisor Portal (/supervisor)** - Admin oversight:
- All clients view
- Staff performance metrics
- Compass task management
- System-wide reporting

**8. Resources (/resources)** - Client resources:
- Career planning tools
- Job search resources
- External links

**9. Compass (/compass)** - Compass task management:
- Pending tasks queue
- Task completion
- Task history

**10. Billing (/billing)** - Monthly billing submissions:
- Invoice package generation
- Financial record management
- Invoice generation
- CRT reports

---

## COMPONENT ARCHITECTURE

### Key Components

**Layout**:
- `AppNav` - Responsive navigation bar with task badges

**Intake**:
- `IntakeForm` - Comprehensive intake form with validation
- `DuplicateWarningDialog` - Check for existing clients

**Client Profile**:
- `ClientProfileOverview` - Demographics and case info editing
- `ClientFinancials` - Financial record management
- `ClientReferrals` - Referral tracking
- `ClientPlacements` - Internal placement management
- `ClientEmployment` - Employment outcome tracking
- `ClientTraining` - Internal training progress
- `ClientServicePlan` - Service plan items
- `ClientStatusHistory` - Status change log
- `ClientRoadmap` - Visual progress timeline
- `StatusChangeDialog` - Status change with Compass task
- `CloseFileDialog` - File closing workflow

**Wizard Components**:
- `ProgramFlowWizard` - Step-by-step program guidance
- `ActionPlanRoadmap` - Visual action plan timeline
- `RoadmapItemPanel` - Individual item editing
- `EmploymentActionPlan` - SDP item selection
- `BarrierIdentificationTool` - BIT assessment
- `BarrierActionPlan` - Barrier action steps
- `BITReviewCheckinPanel` - Review check-ins
- `DEAFlowPanel` - DEA stream guidance
- `DEAClosingDialog` - DEA program closure
- `CasualNotesPanel` - Casual stream notes
- `InternalPlacementStep` - Placement referral
- `ExposuresSupportsStep` - Financial supports

**Reports**:
- `ReportSummary` - Aggregated data visualization with pie charts
- `StaffMonthlyReports` - Staff narrative reporting

**Billing**:
- `InvoicePackageGenerator` - Monthly invoice package creation
- `InvoicePackageList` - Package management
- `InvoicePackageDetail` - Package detail view
- `SupportingDocuments` - Document upload
- `InvoiceGenerator` - Invoice creation
- `InvoiceConfigEditor` - Contract configuration
- `InvoiceDetail` - Invoice view
- `BudgetTracker` - Budget vs actual

**CRT**:
- `CRTClientData` - Client data report
- `CRTFinancials` - Financial report
- `CRTOutcomes` - Outcomes report

**Compass**:
- `CompassTaskList` - Task queue management

**Lists**:
- `ClientListControls` - List filtering and sorting
- `ClientRowColor` - Row color coding by status

**UI Components** (shadcn/ui):
- All standard components (Button, Input, Select, Card, Dialog, etc.)
- Custom styled with Candora branding

---

## INTEGRATION CONFIGURATION

### Required Integrations

**1. Core Integrations (Built-in)**
- `SendEmail` - For automated reminders and alerts
- `UploadFile` - For resume and receipt uploads
- `InvokeLLM` - Optional for AI features

### Secrets to Configure

No external API keys required - all integrations use Base44's built-in services.

### Email Configuration

Update these email addresses in `functions/sendAlertEmail.js`:
```javascript
const INTERNAL_PLACEMENT_EMAILS = {
  cleaning_arc: "your-email@domain.com",
  food_services_onsite: "your-email@domain.com",
  // ... etc
};

const SERVICE_NAVIGATOR_EMAIL = "navigator-email@domain.com";
```

---

## STEP-BY-STEP REPLICATION INSTRUCTIONS

### Phase 1: Setup (30 minutes)

1. **Create New Base44 App**
   - Go to Base44 dashboard
   - Create new app
   - Name: "Candora Pathways Case Management"

2. **Configure Authentication**
   - Enable email authentication
   - Set user roles: admin, user
   - Configure invite-only access

3. **Install NPM Packages**
   ```bash
   # Already included in Base44:
   - @tanstack/react-query
   - react-router-dom
   - date-fns
   - lucide-react
   - recharts
   - framer-motion
   - jspdf
   - html2canvas
   ```

### Phase 2: Entity Creation (45 minutes)

4. **Create All Entities**
   - Copy each entity schema from above
   - Create in order: Client, CompassTask, FinancialRecord, Invoice, InvoiceConfig, InvoicePackage, StaffMonthlyReport, StatusChange, InternalTraining, Employer
   - Update User entity with role enum

5. **Configure Entity Permissions**
   - Client: Admin (full), User (assigned clients only)
   - CompassTask: Admin (full), User (view assigned)
   - FinancialRecord: Admin (full), User (create/edit)
   - Invoice: Admin only
   - Other entities: Based on role

### Phase 3: Backend Functions (30 minutes)

6. **Create Backend Functions**
   - Create `functions/followupReminder.js`
   - Create `functions/sendAlertEmail.js`
   - Update email addresses in sendAlertEmail

7. **Test Functions**
   - Use test_backend_function tool
   - Verify email sending works

### Phase 4: Automations (15 minutes)

8. **Create Automations**
   - Follow-up Reminder: Scheduled, daily 9 AM
   - Alert Email: Entity automation on Client update

### Phase 5: Frontend (2-3 hours)

9. **Create Core Files**
   - `index.css` - Design tokens
   - `tailwind.config.js` - Theme configuration
   - `App.jsx` - Router setup
   - `main.jsx` - Entry point

10. **Create Pages**
    - Copy each page from source export
    - Ensure all routes are registered in App.jsx

11. **Create Components**
    - Create components in organized folders
    - Import shadcn/ui components as needed

12. **Create Utility Files**
    - `lib/utils.js`
    - `lib/AuthContext.jsx`
    - `lib/BrandingContext.jsx`
    - `lib/query-client.js`
    - `lib/compassTasks.js`
    - `lib/app-params.js`

### Phase 6: Styling & Branding (30 minutes)

13. **Apply Candora Branding**
    - Update index.css with navy/gold colors
    - Configure logo URL
    - Test responsive layouts

14. **Configure Navigation**
    - Update AppNav with correct routes
    - Set up mobile drawer
    - Add Compass task badge

### Phase 7: Testing & QA (1 hour)

15. **Test All Flows**
    - Client intake
    - Dashboard alerts
    - Client profile editing
    - Financial record creation
    - Invoice generation
    - Report generation
    - Compass task creation
    - Email notifications

16. **User Acceptance Testing**
    - Test as admin user
    - Test as regular user
    - Verify permissions work correctly
    - Check all forms validate properly

### Phase 8: Deployment (15 minutes)

17. **Invite Users**
    - Invite career counsellors
    - Invite service navigators
    - Invite supervisors

18. **Go Live**
    - Enable app for production
    - Monitor first week usage
    - Gather feedback

---

## TOTAL ESTIMATED TIME: 6-8 hours

---

## ADDITIONAL NOTES

### Data Migration

If migrating from existing system:
1. Export data to CSV
2. Use Base44 import_data tool
3. Map fields carefully
4. Verify all records imported

### Customization Points

**Email Addresses**: Update in sendAlertEmail.js
**Logo**: Update in AppNav.jsx and index.html
**Colors**: Update in index.css design tokens
**Workers List**: Update in IntakeForm and ClientProfileOverview
**Placement Emails**: Update in sendAlertEmail.js

### Performance Considerations

- Use pagination for large lists (1000 record limit)
- Implement React Query caching
- Use entity subscriptions for real-time updates
- Optimize report queries with filters

### Security

- Admin-only functions verify user.role === 'admin'
- Users can only see assigned clients
- File uploads use secure Base44 storage
- Email sending uses Base44 integration

---

## SUPPORT

For questions about Base44 platform features:
- Use Base44 dashboard documentation
- Contact Base44 support
- Check platform SDK documentation

---

**End of Replication Guide**