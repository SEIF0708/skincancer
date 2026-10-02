"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("doctor@clinic.org");
  const [password, setPassword] = React.useState("admin123");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch("http://127.0.0.1:8000/api/auth/login", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid doctor email or password.");
      }

      const data = await res.json();
      localStorage.setItem("skin_ai_token", data.access_token);
      localStorage.setItem("skin_ai_doctor", JSON.stringify(data.doctor));
      router.push("/");
    } catch (err: any) {
      if (email === "doctor@clinic.org" && password === "admin123") {
        const dummyDoctor = {
          id: 1,
          name: "Dr. Sarah Jenkins, MD",
          email: "doctor@clinic.org",
          title: "Senior Dermatologist",
          hospital: "University Medical Center",
        };
        localStorage.setItem("skin_ai_token", "demo-token-offline");
        localStorage.setItem("skin_ai_doctor", JSON.stringify(dummyDoctor));
        router.push("/");
      } else {
        setError(err.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.18)] sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 ring-1 ring-slate-200">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                  SkinAI
                </p>
                <p className="text-sm font-bold text-slate-900">
                  Clinical portal
                </p>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Ready
            </div>
          </div>

          <div className="mb-6 space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="text-sm text-slate-600">
              Sign in to continue to your clinical dashboard.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Medical Email / ID
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@clinic.org"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Activity className="h-4 w-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Access dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-600">
            <span>Need an account?</span>
            <button
              type="button"
              onClick={() => router.push("/signup")}
              className="font-semibold text-slate-900 underline-offset-4 hover:underline"
            >
              Create one
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-700" />
              Demo credentials
            </div>
            <div className="space-y-1 text-xs text-slate-600">
              <p>
                <span className="font-semibold text-slate-800">Email:</span>{" "}
                doctor@clinic.org
              </p>
              <p>
                <span className="font-semibold text-slate-800">Password:</span>{" "}
                admin123
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
