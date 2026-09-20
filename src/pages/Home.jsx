import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import LeprechaunJig from "@/components/LeprechaunJig";

export default function Home() {
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);

  const enter = async () => {
    if (entering) return;
    setEntering(true);
    try {
      const user = await base44.auth.me();
      if (user?.role === "admin" || user?.role === "intake") {
        navigate("/intake");
      } else {
        navigate("/dashboard");
      }
    } finally {
      setEntering(false);
    }
  };

  return <LeprechaunJig onEnter={enter} />;
}