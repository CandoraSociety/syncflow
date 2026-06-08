# CLIENT PROFILE PAGE — Main Specification

This document covers the main layout, navigation, and modals for the Client Profile page. For details on each tab's content, see the corresponding spec file.

- `WIZARD_PROGRAM_FLOW_SPEC.md`
- `WIZARD_ROADMAP_SPEC.md`
- `CLIENT_PROFILE_TABS_SPEC.md`

## File Involved
- `pages/ClientProfile.jsx`
- `components/client/CloseFileDialog.jsx`
- `components/client/StatusChangeDialog.jsx`
- `components/wizard/DEAClosingDialog.jsx`

---

## PAGE: ClientProfile (`/client/:id`)

### Purpose
Central hub for managing an individual client file. Features a prominent header with client name/status, and a multi-tab interface accessing all aspects of their file.

### Navigation Structure
```
Top Nav (Navy, sticky):
  [Logo] ← Master List · My Dashboard · Intake · Compass

Main Header (Gold):
  [← Back]  Client Name [Stream Badge] [Closed Badge if applicable]
            HSID: xxx · Closed: reason (if closed)
            [Log Status Change] [Close File / Reopen File]
```

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
Note: The original code loads all clients and filters client-side, which is inefficient and should be replaced with a direct fetch `base44.entities.Client.get(id)` in replication.

### State
```js
const [client, setClient] = useState(null);
const [loading, setLoading] = useState(true);
const [showCloseDialog, setShowCloseDialog] = useState(false);
const [closingSaving, setClosingSaving] = useState(false);
const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
const [statusHistoryKey, setStatusHistoryKey] = useState(0); // Used to force re-render of history tab
const [showDEAClosing, setShowDEAClosing] = useState(false);
```

### Tab Structure
```jsx
<Tabs defaultValue="program_flow">
  <TabsList>
    <TabsTrigger value="program_flow">Program Flow</TabsTrigger>
    <TabsTrigger value="overview">Client Overview</TabsTrigger>
    <TabsTrigger value="referrals">Referrals</TabsTrigger>
    <TabsTrigger value="employment">Employment</TabsTrigger>
    <TabsTrigger value="financials">Financials</TabsTrigger>
    <TabsTrigger value="training">Placements</TabsTrigger>
    <TabsTrigger value="status_history">Status History</TabsTrigger>
    <TabsTrigger value="stream_switches">
      Stream Switches {count > 0 && <badge>{count}</badge>}
    </TabsTrigger>
  </TabsList>

  {/* Each TabsContent loads a specific component. See other specs for details. */}
  <TabsContent value="program_flow"> <ProgramFlowWizard ... /> </TabsContent>
  <TabsContent value="overview"> <ClientProfileOverview ... /> </TabsContent>
  <TabsContent value="referrals"> <ClientReferrals ... /> </TabsContent>
  {/* ... and so on for all other tabs */}
</Tabs>
```

### Key Handlers
```js
const handleSave = async (updates) => {
  const updated = await base44.entities.Client.update(id, updates);
  setClient(prev => ({ ...prev, ...updates }));
  return updated;
};

const handleCloseFile = async (data) => {
  setClosingSaving(true);
  await base44.entities.Client.update(id, data);
  const updatedClient = { ...client, ...data };
  setClient(updatedClient);
  const t = taskFileClosed(updatedClient);
  await createCompassTask({ ... });
  setClosingSaving(false);
  setShowCloseDialog(false);
};

const handleReopenFile = async () => {
  const updates = { file_closed: false, status: "active" };
  await base44.entities.Client.update(id, updates);
  setClient(prev => ({ ...prev, ...updates }));
};
```

---

## MODALS

### MODAL: CloseFileDialog
- **Purpose**: Dialog for closing a client file with reason, date, and notes.
- **Close Reasons**: `completed`, `cancelled`, `incomplete`, `withdrew`, `relocated`, `no_longer_eligible`, `no_contact`, `duplicate`, `other`.
- **Dialog Structure**:
  ```jsx
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader><DialogTitle>Close Client File</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <p>This will mark the file as closed...</p>
        <Select value={reason} onValueChange={setReason} placeholder="Select a reason..." />
        <Input type="date" value={closedDate} onChange={...} />
        <Textarea placeholder="Notes..." value={notes} onChange={...} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleConfirm} className="bg-red-600">Close File</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  ```

### MODAL: StatusChangeDialog
- **Purpose**: Manually log a status change to the client's history.
- **Change Types**: `stream_switch`, `program_status_change`, `employment_outcome`, `post_completion_status`, `followup_90day`, `file_closed`, `file_opened`, `other`.
- **Save Handler**: Creates a new `StatusChange` entity record.

### MODAL: DEAClosingDialog
- **Purpose**: Shown when a DEA client's program is ending.
- **Trigger Logic**: `useEffect` checks if client is DEA, not closed, dialog not dismissed, and completion date is within 3 days.
- **Actions**:
  1.  `handleDEAContinue`: Updates client with `dea_closing_dismissed: true`.
  2.  `handleDEASwitchToPathways`: Updates client `service_type` to `pathways`, adds a `program_stream_switches` record, and sets `dea_closing_dismissed: true`.