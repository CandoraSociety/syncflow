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
{ label: "Outcomes", path: "/outcomes" },
{ label: "Billing", path: "/billing" },
{ label: "CRT", path: "/crt" },
{ label: "Invoices", path: "/invoices" },
{ label: "Supervisor Portal", path: "/supervisor" },
{ label: "Resources", path: "/resources" },
{ label: "Compass", path: "/compass" }];


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
        key={item.path}
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
        {/* Logo + wordmark */}
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

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-0.5 flex-1 mx-4">
          {NAV_ITEMS.map((item) => <NavButton key={item.path} item={item} />)}
        </div>

        {user && (
          <span className="text-xs text-white/50 hidden md:block ml-4 shrink-0">
            {user.full_name || user.email}
          </span>
        )}

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-white/80 hover:text-white p-2 rounded-md"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown menu */}
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