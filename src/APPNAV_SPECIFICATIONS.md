# Candora App - Top Navigation Bar (AppNav) Specifications

## OVERVIEW
The AppNav is the **fixed top navigation bar** that appears on every page. It contains the app logo, navigation links (role-based), and user menu.

---

## COMPONENT STRUCTURE

```jsx
<nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-50">
  <div className="h-full px-6 flex items-center justify-between">
    
    {/* Left: Logo */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-[hsl(231,64%,20%)] flex items-center justify-center">
        <span className="text-white font-bold text-lg">C</span>
      </div>
      <span className="font-bold text-xl text-slate-900">Candora</span>
    </div>
    
    {/* Center: Navigation Links */}
    <div className="flex items-center gap-1">
      [Navigation links here - role-based]
    </div>
    
    {/* Right: User Menu */}
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600">{user?.full_name}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
  </div>
</nav>
```

---

## DESIGN SPECIFICATIONS

### Container
- **Position**: `fixed top-0 left-0 right-0`
- **Height**: `h-16` (64px / 4rem)
- **Background**: `bg-white`
- **Border**: `border-b border-slate-200`
- **Shadow**: `shadow-sm`
- **Z-index**: `z-50` (always on top)
- **Padding**: `px-6`

### Logo Section (Left)
- **Flex gap**: `gap-2`
- **Logo icon**: 
  - Size: `w-8 h-8`
  - Shape: `rounded-lg`
  - Background: `bg-[hsl(231,64%,20%)]` (Candora navy)
  - Text: White, bold, large (`text-white font-bold text-lg`)
  - Content: Letter "C"
- **App name**:
  - Font: `font-bold text-xl text-slate-900`

### Navigation Links (Center)
- **Flex gap**: `gap-1` (tight spacing between links)
- **Link styling**:
  ```jsx
  <Link 
    to="/path"
    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? 'bg-[hsl(231,64%,20%)] text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    Label
  </Link>
  ```
- **Active state**: Navy background, white text
- **Inactive state**: Slate text, hover with light grey background
- **Padding**: `px-4 py-2`
- **Border radius**: `rounded-md`

### User Menu (Right)
- **Flex gap**: `gap-3`
- **User name**: `text-sm text-slate-600`
- **Dropdown trigger**:
  - Ghost button
  - Icon only (`size="icon"`)
  - Circular (`rounded-full`)
  - User icon from lucide-react

---

## NAVIGATION LINKS BY ROLE

### Admin Role
Shows ALL links:
1. **Intake** → `/intake`
2. **Master List** → `/master`
3. **Dashboard** → `/dashboard`
4. **Reports** → `/reports`
5. **Supervisor** → `/supervisor`
6. **Resources** → `/resources`
7. **Compass** → `/compass`
8. **Billing** → `/billing`

### Intake Role
Shows:
1. **Intake** → `/intake`
2. **Master List** → `/master`
3. **Reports** → `/reports`
4. **Resources** → `/resources`

### Worker Role
Shows:
1. **Dashboard** → `/dashboard`
2. **Resources** → `/resources`
3. **Compass** → `/compass`

### Supervisor Role
Shows:
1. **Supervisor** → `/supervisor`
2. **Resources** → `/resources`

---

## ACTIVE ROUTE DETECTION

```javascript
import { useLocation, Link } from 'react-router-dom';

const location = useLocation();

// Check if route is active
const isActive = location.pathname === '/intake';

// Or for nested routes
const isActive = location.pathname.startsWith('/dashboard');
```

---

## COMPLETE APPNAV COMPONENT

```jsx
import { useLocation, Link } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

export default function AppNav() {
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    window.location.reload();
  };

  // Role-based navigation
  const navItems = {
    admin: [
      { label: 'Intake', path: '/intake' },
      { label: 'Master List', path: '/master' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Reports', path: '/reports' },
      { label: 'Supervisor', path: '/supervisor' },
      { label: 'Resources', path: '/resources' },
      { label: 'Compass', path: '/compass' },
      { label: 'Billing', path: '/billing' },
    ],
    intake: [
      { label: 'Intake', path: '/intake' },
      { label: 'Master List', path: '/master' },
      { label: 'Reports', path: '/reports' },
      { label: 'Resources', path: '/resources' },
    ],
    worker: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Resources', path: '/resources' },
      { label: 'Compass', path: '/compass' },
    ],
    supervisor: [
      { label: 'Supervisor', path: '/supervisor' },
      { label: 'Resources', path: '/resources' },
    ],
  };

  const items = navItems[user?.role] || navItems.worker;

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-50">
      <div className="h-full px-6 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[hsl(231,64%,20%)] flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl text-slate-900">Candora</span>
        </div>
        
        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {items.map((item) => {
            const isActive = location.pathname === item.path || 
                           (item.path !== '/' && location.pathname.startsWith(item.path + '/'));
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[hsl(231,64%,20%)] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
        
        {/* User Menu */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600">{user?.full_name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
      </div>
    </nav>
  );
}
```

---

## RESPONSIVE BEHAVIOR

### Desktop (Default)
- Full navigation bar as shown above
- All links visible

### Tablet (768px - 1024px)
- Same as desktop
- May reduce padding to `px-4`

### Mobile (< 768px)
```jsx
// Option 1: Hamburger Menu
<nav className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 shadow-sm z-50">
  <div className="h-full px-4 flex items-center justify-between">
    
    {/* Logo */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-[hsl(231,64%,20%)] flex items-center justify-center">
        <span className="text-white font-bold text-lg">C</span>
      </div>
      <span className="font-bold text-xl text-slate-900">Candora</span>
    </div>
    
    {/* Hamburger Button */}
    <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
      <Menu className="w-5 h-5" />
    </Button>
    
  </div>
</nav>

{/* Mobile Menu Overlay */}
{mobileMenuOpen && (
  <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileMenuOpen(false)}>
    <div className="absolute right-0 top-0 bottom-0 w-64 bg-white p-4" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <span className="font-semibold">Menu</span>
        <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className="px-4 py-3 text-sm font-medium rounded-md hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  </div>
)}
```

---

## COLOR VARIATIONS

### Alternative Logo (With Full Name)
```jsx
<div className="flex items-center gap-2">
  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(231,64%,20%)] to-[hsl(42,100%,54%)] flex items-center justify-center">
    <span className="text-white font-bold text-lg">C</span>
  </div>
  <div>
    <span className="font-bold text-xl text-slate-900">Candora</span>
    <span className="text-xs text-slate-500 ml-2">Employment Services</span>
  </div>
</div>
```

### Alternative Active State (Underline)
```jsx
<Link
  to={path}
  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
    isActive
      ? 'border-[hsl(42,100%,54%)] text-slate-900'
      : 'border-transparent text-slate-600 hover:text-slate-900'
  }`}
>
  Label
</Link>
```

---

## COPY FOR OTHER APP

**Prompt to give the AI Builder:**

> "Create a fixed top navigation bar (AppNav) with these exact specs:
> 
> - Fixed position at top (`fixed top-0 left-0 right-0`)
> - Height: 64px (`h-16`)
> - White background with bottom border (`bg-white border-b border-slate-200`)
> - Shadow (`shadow-sm`)
> - Z-index 50 (`z-50`)
> - Padding: `px-6`
> - Flex layout with 3 sections: logo (left), nav links (center), user menu (right)
> 
> **Logo**: Navy rounded square (`w-8 h-8 rounded-lg bg-[hsl(231,64%,20%)]`) with white 'C' letter, followed by 'Candora' text in bold xl.
> 
> **Nav Links**: Role-based links with `gap-1` spacing. Active link has navy background with white text. Inactive links are slate text with hover on light grey background. Each link: `px-4 py-2 text-sm font-medium rounded-md`.
> 
> **User Menu**: User name in small slate text, followed by ghost icon button with User icon, opening dropdown with Logout option.
> 
> Use React Router's useLocation for active route detection. Show different nav items based on user role (admin sees all, intake sees 4, worker sees 3, supervisor sees 2)."

---

## NAVIGATION LINK MAPPING

| Role | Links Shown |
|------|-------------|
| **Admin** | Intake, Master List, Dashboard, Reports, Supervisor, Resources, Compass, Billing |
| **Intake** | Intake, Master List, Reports, Resources |
| **Worker** | Dashboard, Resources, Compass |
| **Supervisor** | Supervisor, Resources |

---

## KEY INTERACTIONS

1. **Click nav link**: Navigate to page, link becomes active (navy bg)
2. **Hover inactive link**: Light grey background (`hover:bg-slate-100`)
3. **Click user icon**: Open dropdown menu
4. **Click logout**: Call `base44.auth.logout()`, reload page
5. **Active route detection**: Match exact path OR start with path (for nested routes)

---

**End of AppNav Specifications**