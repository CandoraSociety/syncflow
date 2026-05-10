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
];

export default function AppNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Don't show nav on client profile pages
  if (location.pathname.startsWith("/client/")) return null;

  return (
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-screen-2xl mx-auto px-4 flex items-center justify-between h-12">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold text-slate-700 mr-4 tracking-tight">Candora Pathways Program</span>
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "px-4 py-2 text-sm rounded-md font-medium transition-colors",
                  active
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
        {user && (
          <span className="text-xs text-slate-400 hidden md:block">
            {user.full_name || user.email}
          </span>
        )}
      </div>
    </div>
  );
}