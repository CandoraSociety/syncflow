import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
{ label: "Intake", path: "/intake" },
{ label: "Master List", path: "/master" },
{ label: "My Dashboard", path: "/dashboard" },
{ label: "Reports", path: "/reports" },
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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    base44.entities.CompassTask.filter({ status: "pending" })
      .then(tasks => setPendingCompassCount(tasks.length))
      .catch(() => {});
  }, [location.pathname]);

  // Don't show nav on client profile pages
  if (location.pathname.startsWith("/client/")) return null;

  return (
    <div className="sticky top-0 z-40" style={{ background: "hsl(231,64%,20%)" }}>
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-3 mr-5 shrink-0">
          <img
            src="https://media.base44.com/images/public/6a0025bc2848937e9e70bca5/6df7c66b7_Candoracirclelogo_noanniversary.png"
            alt="Candora logo"
            className="h-9 w-9 object-contain rounded-full"
          />
          <span className="text-sm font-bold tracking-tight hidden md:block" style={{ color: "hsl(42,100%,54%)" }}>
            Candora Pathways
          </span>
        </div>

        {/* Nav items */}
        <div className="flex items-center gap-0.5 flex-wrap">
          {NAV_ITEMS.map((item) => {
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
          })}
        </div>

        {user && (
          <span className="text-xs text-white/50 hidden md:block ml-4 shrink-0">
            {user.full_name || user.email}
          </span>
        )}
      </div>
    </div>
  );
}