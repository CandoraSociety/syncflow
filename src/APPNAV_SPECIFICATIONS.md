# Candora App - AppNav (Top Navigation Bar) — EXACT Specifications

## OVERVIEW
A **sticky top navigation bar** (not fixed, uses `sticky top-0`) that appears on every page **except** client profile pages (`/client/:id`). Height is 56px (`h-14`).

---

## EXACT COMPONENT CODE

```jsx
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { label: "Intake", path: "/intake" },
  { label: "Master List", path: "/master" },
  { label: "My Dashboard", path: "/dashboard" },
  { label: "Reports", path: "/reports" },
  { label: "Billing", path: "/billing" },
  { label: "Supervisor Portal", path: "/supervisor" },
  { label: "Resources", path: "/resources" },
  { label: "Compass", path: "/compass" },
];

export default function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [pendingCompassCount, setPendingCompassCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.CompassTask.filter({ status: "pending" })
      .then(tasks => setPendingCompassCount(tasks.length))
      .catch(() => {});
  }, [location.pathname]);

  // Close menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Don't show nav on client profile pages
  if (location.pathname.startsWith("/client/")) return null;

  const NavButton = ({ item }) => {
    const active = location.pathname === item.path;
    return (
      <button
        onClick={() => navigate(item.path)}
        className={cn(
          "px-3 py-1.5 text-sm rounded-md font-medium transition-colors relative",
          active
            ? "text-[hsl(231,64%,16%)] font-semibold"
            : "text-white/80 hover:text-white hover:bg-white/10"
        )}
        style={active ? { background: "hsl(42,100%,54%)" } : {}}
      >
        {item.label}
        {item.path === "/compass" && pendingCompassCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {pendingCompassCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="sticky top-0 z-40" style={{ background: "hsl(231,64%,20%)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo + Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <img
            src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png"
            alt="Candora logo"
            className="h-9 w-9 object-contain rounded-full"
          />
          <span className="hidden md:block" style={{ color: "hsl(42,100%,54%)", fontFamily: "'Arial Black', 'Impact', sans-serif", fontSize: "15px", letterSpacing: "0.02em" }}>
            <span style={{ fontWeight: 900 }}>CANDORA</span>
            <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.85)", marginLeft: "4px" }}>Pathways</span>
          </span>
        </div>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
          {NAV_ITEMS.map((item) => <NavButton key={item.path} item={item} />)}
        </div>

        {/* User Name */}
        {user && (
          <span className="text-xs text-white/50 hidden md:block ml-4 shrink-0">
            {user.full_name || user.email}
          </span>
        )}

        {/* Mobile Hamburger */}
        <button
          className="md:hidden text-white/80 hover:text-white p-2 rounded-md"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1" style={{ background: "hsl(231,55%,25%)" }}>
          {NAV_ITEMS.map((item) => <NavButton key={item.path} item={item} />)}
          {user && (
            <p className="text-xs text-white/40 mt-2 pt-2 border-t border-white/10">
              {user.full_name || user.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## DESIGN BREAKDOWN

### Outer Container
- `sticky top-0 z-40`
- Background: `hsl(231,64%,20%)` — deep navy (inline style, not Tailwind class)

### Inner Row
- `max-w-screen-2xl mx-auto px-4`
- `flex items-center justify-between h-14` (56px height)

---

## LOGO SECTION (Left)

- Container: `flex items-center gap-3 shrink-0`
- **Image**: Actual Candora circle logo PNG from CDN
  - URL: `https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png`
  - Size: `h-9 w-9` (36px × 36px)
  - Style: `object-contain rounded-full`
- **Wordmark** (hidden on mobile, shown `md:block`):
  - Font: `'Arial Black', 'Impact', sans-serif`
  - Font size: `15px`
  - Letter spacing: `0.02em`
  - **"CANDORA"**: weight 900, color `hsl(42,100%,54%)` (sunflower gold)
  - **"Pathways"**: weight 400, color `rgba(255,255,255,0.85)` (slightly transparent white), marginLeft `4px`

---

## NAVIGATION LINKS (Center)

- Container: `hidden md:flex items-center gap-0.5 flex-1 mx-4`
- **8 links in order**: Intake, Master List, My Dashboard, Reports, Billing, Supervisor Portal, Resources, Compass

### Inactive Link Style
- `px-3 py-1.5 text-sm rounded-md font-medium transition-colors relative`
- Color: `text-white/80`
- Hover: `hover:text-white hover:bg-white/10`
- No background

### Active Link Style
- Same base classes
- Background: `hsl(42,100%,54%)` (sunflower gold) via inline `style`
- Text color: `text-[hsl(231,64%,16%)]` (very dark navy — for contrast on gold)
- Font: `font-semibold`

### Compass Badge (Red notification dot)
- Only appears on Compass link when `pendingCompassCount > 0`
- Position: `absolute -top-0.5 -right-0.5`
- Style: `bg-red-500 text-white text-xs font-bold rounded-full`
- Size: `min-w-[18px] h-[18px]`
- Layout: `flex items-center justify-center px-1 leading-none`
- Shows the count number

---

## USER NAME (Right)

- `text-xs text-white/50 hidden md:block ml-4 shrink-0`
- Shows `user.full_name` or falls back to `user.email`
- No logout button — there is NO logout button in the AppNav

---

## MOBILE BEHAVIOR

### Hamburger Button
- `md:hidden text-white/80 hover:text-white p-2 rounded-md`
- Shows `X` icon when open, `Menu` icon when closed (both `w-5 h-5`)

### Mobile Dropdown
- `md:hidden border-t border-white/10 px-4 py-3 flex flex-col gap-1`
- Background: `hsl(231,55%,25%)` (slightly lighter navy)
- Same NavButton items stacked vertically
- User name at bottom: `text-xs text-white/40 mt-2 pt-2 border-t border-white/10`

---

## KEY BEHAVIORS

1. **Hidden on client profile** — returns `null` when `location.pathname.startsWith("/client/")`
2. **Re-fetches compass count on every route change** — `useEffect` depends on `location.pathname`
3. **Closes mobile menu on route change** — separate `useEffect`
4. **No role-based filtering** — all 8 links are shown to all users
5. **No logout button** — user name only, no dropdown or logout

---

## PROMPT FOR OTHER APP

> "Build a sticky top nav bar (`sticky top-0 z-40`) with background color `hsl(231,64%,20%)` (deep navy), height 56px (`h-14`), max-width `max-w-screen-2xl mx-auto`, padding `px-4`.
>
> **Left section**: Candora circle logo image (round, 36px) followed by wordmark — 'CANDORA' in Arial Black weight 900 colored `hsl(42,100%,54%)` (gold) and 'Pathways' in weight 400 colored `rgba(255,255,255,0.85)`, hidden on mobile.
>
> **Center**: 8 nav links with `gap-0.5` — Intake, Master List, My Dashboard, Reports, Billing, Supervisor Portal, Resources, Compass. Inactive: `text-white/80 hover:text-white hover:bg-white/10 px-3 py-1.5 text-sm rounded-md`. Active: gold background `hsl(42,100%,54%)` with dark navy text `hsl(231,64%,16%)` font-semibold. Compass link shows a red notification badge with pending count.
>
> **Right**: User's full_name in `text-xs text-white/50`.
>
> On mobile: hamburger button shows/hides a dropdown with the same links on a slightly lighter navy background `hsl(231,55%,25%)`.
>
> Hide the entire nav on `/client/:id` routes."