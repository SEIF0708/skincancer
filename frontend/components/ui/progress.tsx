import * as React from "react";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number; // 0 to 100
  indicatorColor?: string; // custom Tailwind class e.g. "bg-red-500", "bg-amber-500", "bg-[#0F52BA]"
  showValueLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Progress({
  value = 0,
  indicatorColor,
  showValueLabel = false,
  size = "md",
  className = "",
  ...props
}: ProgressProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  // Determine color if not explicitly passed
  let defaultColor = "bg-[#0F52BA]";
  if (!indicatorColor) {
    if (safeValue >= 80) defaultColor = "bg-rose-600";
    else if (safeValue >= 50) defaultColor = "bg-amber-500";
    else defaultColor = "bg-emerald-500";
  } else {
    defaultColor = indicatorColor;
  }

  const heightClasses = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-3.5",
  };

  return (
    <div className="w-full space-y-1">
      {showValueLabel && (
        <div className="flex justify-between text-xs font-semibold text-slate-700">
          <span>Progress</span>
          <span>{safeValue.toFixed(1)}%</span>
        </div>
      )}
      <div
        className={`relative w-full overflow-hidden rounded-full bg-slate-100 ${heightClasses[size]} ${className}`}
        {...props}
      >
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${defaultColor}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
