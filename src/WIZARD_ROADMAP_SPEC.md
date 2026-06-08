# WIZARD: Action Plan Roadmap Specification

This document covers the `ActionPlanRoadmap` component and its sub-components, which provide the visual timeline, list, and calendar views for the client's progress.

## Files Involved
- `components/wizard/ActionPlanRoadmap.jsx`
- `components/wizard/RoadmapItemPanel.jsx`
- `components/wizard/BITReviewCheckinPanel.jsx`

---

## COMPONENT: ActionPlanRoadmap.jsx

### Purpose
A highly visual and interactive component to track progress against the action plan items.

### View Modes
```js
const [view, setView] = useState("timeline"); // "timeline" | "list" | "calendar"
```

### Data Construction
```js
function buildItems(selectedItems, itemDetails, otherDesc, roadmapStatus, client) {
  // 1. Map `selectedItems` from action plan to a common structure
  const items = selectedItems.map(key => ({
    key,
    label: ...,
    detail: itemDetails?.[key] || {},
    status: roadmapStatus[key]?.status || "planned",
    statusData: roadmapStatus[key] || {},
    isBarrier: false,
  }));

  // 2. Add identified barriers as separate items
  for (let n = 1; n <= 3; n++) {
    if (client?.[`barrier_${n}`]) {
      items.push({
        key: `barrier_${n}`,
        label: `Barrier: ...`,
        isBarrier: true,
        detail: { status: client[`barrier_${n}_status`], action_steps: ..., notes: ... },
        status: roadmapStatus[`barrier_${n}`]?.status || "planned",
        statusData: roadmapStatus[`barrier_${n}`] || {},
      });
    }
  }
  return items;
}
```

### Timeline Bounds Calculation
- **Date Parsing**: All date strings are parsed into local time (noon) to avoid timezone/DST issues.
- **`msPct` function**: Calculates the percentage position of a date on the timeline using raw millisecond math, which is more reliable than `differenceInDays`.
- **Timeline Range**: 
  - The left edge (`minMs`) is anchored by the `intakeDate` or `serviceStart`.
  - The right edge (`maxDate`) is the later of the projected program end date or the latest actual item/milestone date plus a 28-day buffer.

### Save Handlers
- **`handleSaveItem`**: Updates the `roadmap_item_status` object on the `Client` record for a specific action plan item.
- **`handleSaveBITCheckin`**: Updates the `bit_review_checkins` array on the `Client` record.
- **`handleSaveMilestone`**: Updates a top-level date field on the `Client` record (e.g., `service_start_date`).

---

## VIEW: Timeline

### Layout
- **Y-Axis**: Each action plan item and barrier gets its own row, with the label on the far left.
- **X-Axis**: Represents time, calculated dynamically based on the dates of all items and milestones.

### Components
- **Month Axis**: Displays month labels (e.g., "Jun 2026") at the top.
- **Milestone Lines**: Vertical lines for key dates (`Intake`, `Start`, `Projected End`, `Actual End`, `90d Follow-up`).
- **Today Line**: A vertical line indicating the current date.
- **Item Bars**: Each item is rendered as a horizontal bar on its row.
  - **Position/Width**: `left` and `width` are set via percentages calculated by the `pct()` function.
  - **Bar Color**: Determined by item type (`getItemColor` function: barriers are gold, placements green, workshops purple, etc.).
  - **Ring Color**: The outline of the bar track is colored based on status (`STATUS_CONFIG`: grey for planned, blue for started, green for completed).
  - **Shimmer/Icons**: In-progress bars have an animated shimmer. Completed/cancelled bars show an icon.
- **Tooltips**: Hovering over a bar shows a tooltip with its details.

### Interactivity
- **Clicking a bar**: Opens the `RoadmapItemPanel` to update status, dates, and notes.
- **Clicking a milestone label**: Opens a `MilestoneDateEditor` to change the date.

---

## VIEW: List

- **Layout**: A simple vertical list of all items.
- **UI**: Each item is a clickable button/row showing its icon, label, dates, and status badge.
- **Interactivity**: Clicking an item opens the `RoadmapItemPanel`, same as the timeline view.

---

## VIEW: Calendar

- **Layout**: A standard monthly calendar grid.
- **UI**: Each cell represents a day. Items spanning multiple days are shown on each day they cover.
- **Logic**: It calculates the days of the current month and iterates through them, filtering `items` to see which ones fall on that day.

---

## COMPONENT: RoadmapItemPanel.jsx

- **Purpose**: A slide-down panel for editing a single roadmap item's status.
- **UI**: Contains controls for:
  - **Status**: Radio buttons (Planned, In Progress, Completed, Cancelled).
  - **Start Date**: Date input.
  - **Completed Date**: Date input.
  - **Notes**: Textarea.
- **Save Logic**: Calls `onSave` prop with the updated data, which triggers `handleSaveItem` in the parent.

---

## COMPONENT: BITReviewCheckinPanel.jsx

- **Purpose**: A panel for logging a check-in for a scheduled BIT review.
- **UI**: 
  - **Completed**: Checkbox.
  - **Actual Date**: Date input.
  - **Notes**: Textarea.
- **Save Logic**: Calls `onSave` prop, triggering `handleSaveBITCheckin` in the parent.