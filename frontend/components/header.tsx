"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Activity, ShieldCheck, Stethoscope, Search, User, LogOut, CheckCircle2 } from "lucide-react";
import { Badge } from "./ui/badge";
import { apiUrl } from "@/lib/api";

export function Header() {
  const router = useRouter();
  const [doctor, setDoctor] = React.useState<{ name: string; title: string; hospital: string } | null>(null);
  const [isServerReady, setIsServerReady] = React.useState(true);

  React.useEffect(() => {
    const storedDoctor = localStorage.getItem("skin_ai_doctor");
    if (storedDoctor) {
      try {
        setDoctor(JSON.parse(storedDoctor));
      } catch {
        setDoctor(null);
      }
    } else {
      setDoctor({
        name: "Dr. Sarah Jenkins, MD",
        title: "Senior Dermatologist",
        hospital: "University Medical Center",
      });
    }

    // Ping FastAPI health
    fetch(apiUrl("/health"))
      .then((res) => res.json())
      .then((data) => setIsServerReady(data.status === "ok"))
      .catch(() => setIsServerReady(false));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("skin_ai_token");
    localStorage.removeItem("skin_ai_doctor");
    router.push("/login");
  };

  return (
    <header className="h-14 border-b border-slate-200 bg-white px-5 flex items-center justify-between shadow-2xs z-30 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F52BA] text-white shadow-xs">
          <Activity className="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900">
              SkinAI <span className="font-semibold text-[#0F52BA]">XAI Workbench</span>
            </h1>
            <Badge variant="info" className="text-[10px] py-0 px-2 font-mono">
              v2.1 Connected
            </Badge>
          </div>
          <p className="text-[10px] text-slate-400 font-medium">
            PyTorch ResNet50 + Attention Explainable AI Clinical System
          </p>
        </div>
      </div>

      {/* Right User & System Info */}
      <div className="flex items-center gap-4 text-xs">
        {/* Backend Model Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-3">
          <div
            className={`h-2 w-2 rounded-full ring-4 ${
              isServerReady
                ? "bg-emerald-500 ring-emerald-100 animate-pulse"
                : "bg-amber-500 ring-amber-100"
            }`}
          />
          <span className="text-[11px] font-medium text-slate-600">
            PyTorch Model Server:{" "}
            <strong
              className={`font-mono ${isServerReady ? "text-emerald-700" : "text-amber-700"}`}
            >
              {isServerReady ? "Connected (best_model.pth)" : "Offline Simulation"}
            </strong>
          </span>
        </div>

        {/* Doctor Profile Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-[#0F52BA] font-bold text-xs border border-blue-200 shadow-2xs">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-[11px] font-bold text-slate-900 leading-tight">
              {doctor?.name || "Dr. Sarah Jenkins, MD"}
            </p>
            <p className="text-[9px] text-slate-500 font-medium">
              {doctor?.title || "Senior Dermatologist"}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          title="Sign out of Clinical Session"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
