import * as React from "react";

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  size?: "sm" | "md";
}

export function Switch({
  checked = false,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className = "",
  size = "md",
  ...props
}: SwitchProps) {
  const handleClick = () => {
    if (!disabled && onCheckedChange) {
      onCheckedChange(!checked);
    }
  };

  const isSm = size === "sm";

  return (
    <label
      className={`inline-flex items-center gap-3 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#0F52BA] focus:ring-offset-2 ${
          isSm ? "h-5 w-9" : "h-6 w-11"
        } ${checked ? "bg-[#0F52BA]" : "bg-slate-300"}`}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            isSm ? "h-4 w-4" : "h-5 w-5"
          } ${
            checked
              ? isSm
                ? "translate-x-4"
                : "translate-x-5"
              : "translate-x-0.5"
          } mt-0.5 ml-0.5`}
        />
      </button>

      {label && (
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-800 tracking-wide">{label}</span>
          {description && <span className="text-[10px] text-slate-500">{description}</span>}
        </div>
      )}
    </label>
  );
}
