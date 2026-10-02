import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "danger" | "warning" | "success" | "info" | "neutral";
}

export function Badge({
  variant = "info",
  className = "",
  children,
  ...props
}: BadgeProps) {
  const variants = {
    danger: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10",
    warning: "bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/10",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    info: "bg-blue-50 text-[#0F52BA] border-blue-200/80 ring-blue-500/10",
    neutral: "bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-tight transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
