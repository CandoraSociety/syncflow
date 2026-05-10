import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = async () => {
      const user = await base44.auth.me();
      if (user?.role === "admin" || user?.role === "intake") {
        navigate("/intake");
      } else {
        navigate("/dashboard");
      }
    };
    redirect();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}