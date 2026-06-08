# Candora App - Precise Header Specifications

## GLOBAL HEADER DESIGN (All Pages)

### Base Header Component
```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    {/* Left: Title + Subtitle */}
    <div>
      <h1 className="text-2xl font-bold text-slate-900">[Page Title]</h1>
      <p className="text-sm text-slate-500 mt-1">[Subtitle/Stats]</p>
    </div>
    
    {/* Right: Action Buttons */}
    <div className="flex items-center gap-3">
      [Buttons here]
    </div>
  </div>
</header>
```

---

## PAGE-SPECIFIC HEADERS

### 1. Home (/)
**No header** - auto-redirect page with loading spinner only.

---

### 2. IntakePage (/intake)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Intake — Unassigned Clients</h1>
      <p className="text-sm text-slate-500 mt-1">
        {unassignedClients.length} awaiting assignment · Welcome, {user?.full_name}
      </p>
    </div>
    
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={() => navigate('/master')}>
        Master List
      </Button>
      <Button variant="outline" onClick={() => navigate('/reports')}>
        Reports
      </Button>
      <Button onClick={() => setShowForm(true)}>
        <Plus className="w-4 h-4 mr-2" />
        New Client
      </Button>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  </div>
</header>
```

**Design Details**:
- Background: `bg-white`
- Border: `border-b border-slate-200`
- Padding: `px-6 py-4`
- Title: `text-2xl font-bold text-slate-900`
- Subtitle: `text-sm text-slate-500 mt-1`
- Button gap: `gap-3`
- Button order: Master List (outline) → Reports (outline) → New Client (primary) → Logout (ghost icon)

---

### 3. WorkerDashboard (/dashboard)

```jsx
<header className="bg-[hsl(231,64%,20%)] text-white px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold">
        {user?.email === 'dawn.williston@candorasociety.com' 
          ? 'Service Navigator Dashboard' 
          : 'My Clients'}
      </h1>
      <p className="text-sm text-slate-200 mt-1">
        Welcome, {user?.full_name}
      </p>
    </div>
    
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-white hover:bg-white/10"
      onClick={handleLogout}
    >
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</header>
```

**Design Details**:
- Background: `bg-[hsl(231,64%,20%)]` (Candora navy)
- Text: `text-white`
- Title conditional: "Service Navigator Dashboard" for Dawn, "My Clients" for others
- Subtitle color: `text-slate-200` (lighter for navy background)
- Logout button: ghost variant with `text-white hover:bg-white/10`

---

### 4. MasterList (/master)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Master Client List</h1>
      <p className="text-sm text-slate-500 mt-1">
        {filteredClients.length} shown · {activeCount} active · {closedCount} closed · {unassignedCount} unassigned in intake
      </p>
    </div>
    
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={() => navigate('/reports')}>
        Reports
      </Button>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  </div>
</header>
```

**Design Details**:
- Standard white header
- Subtitle shows 4 stats separated by middle dots (·)

---

### 5. ClientProfile (/client/:id)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-start justify-between">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold text-slate-900">
          {client?.first_name} {client?.last_name}
        </h1>
        {client?.compass_hsid && (
          <Badge variant="outline" className="text-xs">
            HSID: {client.compass_hsid}
          </Badge>
        )}
        <Badge className="text-xs">{SERVICE_LABELS[client?.service_type]}</Badge>
        <Badge 
          className={`text-xs ${
            client?.program_status === 'complete' ? 'bg-green-100 text-green-800' :
            client?.program_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
            'bg-slate-100 text-slate-700'
          }`}
        >
          {client?.program_status || 'Assessments Incomplete'}
        </Badge>
      </div>
      <p className="text-sm text-slate-500">
        Assigned to: {client?.assigned_worker_name || 'Unassigned'}
      </p>
    </div>
    
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={handleEdit}>
        <Pencil className="w-4 h-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" onClick={handleStatusChange}>
        Status Change
      </Button>
      <Button variant="destructive" onClick={handleCloseFile}>
        Close File
      </Button>
    </div>
  </div>
</header>
```

**Design Details**:
- Multiple badges in header (HSID, service type, program status)
- Status badge color-coded:
  - Complete: `bg-green-100 text-green-800`
  - In Progress: `bg-blue-100 text-blue-800`
  - Other: `bg-slate-100 text-slate-700`
- 3 action buttons: Edit (outline with icon), Status Change (outline), Close File (destructive)

---

### 6. Reports (/reports)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
      <p className="text-sm text-slate-500 mt-1">
        Generate outcome reports, export data, and view staff monthly reports
      </p>
    </div>
    
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</header>
```

---

### 7. SupervisorPortal (/supervisor)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Supervisor Portal</h1>
      <p className="text-sm text-slate-500 mt-1">
        Internal training placements and evaluations
      </p>
    </div>
    
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</header>
```

---

### 8. Resources (/resources)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Resources</h1>
      <p className="text-sm text-slate-500 mt-1">
        Career planning tools and job search resources
      </p>
    </div>
    
    <Button variant="ghost" size="icon" onClick={handleLogout}>
      <LogOut className="w-4 h-4" />
    </Button>
  </div>
</header>
```

---

### 9. Compass (/compass)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Compass Task Queue</h1>
        {pendingCount > 0 && (
          <Badge className="bg-amber-500 hover:bg-amber-500">
            {pendingCount} pending
          </Badge>
        )}
      </div>
      <p className="text-sm text-slate-500 mt-1">
        Pending data entry tasks for the Government of Alberta Compass database
      </p>
    </div>
    
    <div className="flex items-center gap-3">
      <Button variant="outline" onClick={refreshTasks}>
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  </div>
</header>
```

**Design Details**:
- Pending badge: `bg-amber-500` (amber/yellow color)
- Refresh button with icon

---

### 10. MonthlyBillingSubmissions (/billing)

```jsx
<header className="bg-white border-b border-slate-200 px-6 py-4">
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Monthly Billing Submissions</h1>
      <p className="text-sm text-slate-500 mt-1">
        Invoice packages, CRT reports, and supporting documents
      </p>
    </div>
    
    <div className="flex items-center gap-3">
      <Button onClick={handleCreatePackage}>
        <Plus className="w-4 h-4 mr-2" />
        Create Invoice Package
      </Button>
      <Button variant="ghost" size="icon" onClick={handleLogout}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  </div>
</header>
```

---

## BUTTON SPECIFICATIONS

### Primary Button
```jsx
<Button className="bg-[hsl(231,64%,20%)] text-white hover:bg-[hsl(231,64%,20%,0.9)]">
  [Label]
</Button>
```

### Outline Button
```jsx
<Button variant="outline" className="border-slate-300 hover:bg-slate-50">
  [Label]
</Button>
```

### Ghost Button
```jsx
<Button variant="ghost" className="hover:bg-slate-100">
  [Label or Icon]
</Button>
```

### Destructive Button
```jsx
<Button variant="destructive" className="bg-red-600 hover:bg-red-700">
  [Label]
</Button>
```

---

## BADGE SPECIFICATIONS

### Default Badge
```jsx
<Badge className="bg-slate-100 text-slate-700">
  [Label]
</Badge>
```

### Blue Badge (Info)
```jsx
<Badge className="bg-blue-100 text-blue-800">
  [Label]
</Badge>
```

### Green Badge (Success)
```jsx
<Badge className="bg-green-100 text-green-800">
  [Label]
</Badge>
```

### Amber Badge (Warning)
```jsx
<Badge className="bg-amber-100 text-amber-800">
  [Label]
</Badge>
```

### Red Badge (Error/Urgent)
```jsx
<Badge className="bg-red-100 text-red-800">
  [Label]
</Badge>
```

### Purple Badge (Stream Switch)
```jsx
<Badge className="bg-purple-100 text-purple-800">
  [Label]
</Badge>
```

---

## ICON SPECIFICATIONS

### Icons Used (from lucide-react)
```javascript
import {
  Plus,           // Add/Create
  LogOut,         // Logout
  Pencil,         // Edit
  RefreshCw,      // Refresh
  CheckCircle2,   // Complete/Success
  AlertCircle,    // Warning/Error
  Bell,           // Alert/Notification
  Calendar,       // Date
  FileText,       // Document
  Users,          // Clients
  TrendingUp,     // Growth/Outcomes
  Download,       // Export
  Upload,         // Import
  Search,         // Search
  Filter,         // Filter
  ChevronDown,    // Dropdown
  ChevronRight,   // Expand
  X,              // Close/Cancel
  Check,          // Confirm
  Loader2,        // Loading
  Home,           // Home
  BarChart3,      // Reports
  Settings,       // Settings
  User,           // Profile
  Mail,           // Email
  Phone,          // Phone
  MapPin,         // Address
  Building,       // Employer
  DollarSign,     // Financial
  Clock,          // Time/Duration
  ArrowRight,     // Next/Forward
  Trash2,         // Delete
  Eye,            // View
  ExternalLink    // Open external
} from 'lucide-react';
```

### Icon Sizes
- Small (in badges, text): `w-3 h-3`
- Default (in buttons): `w-4 h-4`
- Large (standalone): `w-5 h-5` or `w-6 h-6`

---

## LOADING STATES

### Page Loading
```jsx
<div className="fixed inset-0 flex items-center justify-center">
  <div className="w-8 h-8 border-4 border-slate-200 border-t-[hsl(231,64%,20%)] rounded-full animate-spin"></div>
</div>
```

### Button Loading
```jsx
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Loading...
</Button>
```

---

## EMPTY STATES

### No Data
```jsx
<div className="text-center py-12">
  <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
  <h3 className="text-lg font-semibold text-slate-700">No data available</h3>
  <p className="text-slate-500 mt-1">
    [Contextual message about what to do]
  </p>
</div>
```

### No Search Results
```jsx
<div className="text-center py-12">
  <Search className="w-12 h-12 mx-auto text-slate-300 mb-4" />
  <h3 className="text-lg font-semibold text-slate-700">No results found</h3>
  <p className="text-slate-500 mt-1">
    Try adjusting your search or filters
  </p>
</div>
```

---

## ALERT/NOTIFICATION PANELS

### Warning Alert (Amber)
```jsx
<div className="border border-amber-300 bg-amber-50 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
    <div>
      <h4 className="font-semibold text-amber-800">[Title]</h4>
      <p className="text-sm text-amber-700 mt-1">[Message]</p>
    </div>
  </div>
</div>
```

### Info Alert (Blue)
```jsx
<div className="border border-blue-300 bg-blue-50 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
    <div>
      <h4 className="font-semibold text-blue-800">[Title]</h4>
      <p className="text-sm text-blue-700 mt-1">[Message]</p>
    </div>
  </div>
</div>
```

### Error Alert (Red)
```jsx
<div className="border border-red-300 bg-red-50 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
    <div>
      <h4 className="font-semibold text-red-800">[Title]</h4>
      <p className="text-sm text-red-700 mt-1">[Message]</p>
    </div>
  </div>
</div>
```

### Success Alert (Green)
```jsx
<div className="border border-green-300 bg-green-50 rounded-xl p-4">
  <div className="flex items-start gap-3">
    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
    <div>
      <h4 className="font-semibold text-green-800">[Title]</h4>
      <p className="text-sm text-green-700 mt-1">[Message]</p>
    </div>
  </div>
</div>
```

---

## TAB SWITCHER

### Standard Tabs
```jsx
<div className="border-b border-slate-200">
  <div className="flex gap-4">
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === 'tab1'
          ? 'border-[hsl(42,100%,54%)] text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
      onClick={() => setActiveTab('tab1')}
    >
      Tab 1 Label
    </button>
    <button
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        activeTab === 'tab2'
          ? 'border-[hsl(42,100%,54%)] text-slate-900'
          : 'border-transparent text-slate-500 hover:text-slate-700'
      }`}
      onClick={() => setActiveTab('tab2')}
    >
      Tab 2 Label
    </button>
  </div>
</div>
```

### Rounded Tabs (Card Style)
```jsx
<div className="bg-slate-100 rounded-lg p-1 flex gap-1">
  <button
    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === 'tab1'
        ? 'bg-white text-slate-900 shadow'
        : 'text-slate-500 hover:text-slate-700'
    }`}
    onClick={() => setActiveTab('tab1')}
  >
    Tab 1
  </button>
  <button
    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeTab === 'tab2'
        ? 'bg-white text-slate-900 shadow'
        : 'text-slate-500 hover:text-slate-700'
    }`}
    onClick={() => setActiveTab('tab2')}
  >
    Tab 2
  </button>
</div>
```

---

## COPY FOR OTHER APP

**Prompt to give the AI Builder:**

> "Create a consistent header component for all pages with these exact specifications:
> 
> - White background (`bg-white`)
> - Bottom border (`border-b border-slate-200`)
> - Padding (`px-6 py-4`)
> - Flex layout with title on left, buttons on right
> - Title: `text-2xl font-bold text-slate-900`
> - Subtitle: `text-sm text-slate-500 mt-1`
> - Button gap: `gap-3`
> - Primary buttons: Navy background (`bg-[hsl(231,64%,20%)]`) with white text
> - Outline buttons: `variant="outline"`
> - Ghost buttons: `variant="ghost"` for icons
> - Logout button on every page (ghost variant, LogOut icon)
> 
> Exception: WorkerDashboard has navy background (`bg-[hsl(231,64%,20%)]`) with white text.
> 
> Use lucide-react icons (w-4 h-4 size). All buttons use shadcn/ui Button component with proper variants."

---

**End of Header Specifications**